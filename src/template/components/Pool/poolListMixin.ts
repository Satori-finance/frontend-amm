import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import { namespace, State } from 'vuex-class'
import { ErrorHandlerMixin } from '@/mixins'
import { MyPoolShareInfo, PoolListItem, PoolListSubItem, PoolListType } from '@/template/Pool/type'
import { queryAllPools, queryPoolsLiquidityHistory, queryPoolsVolumesHistory } from '@/api/pool'
import { PoolLiquidityData, PoolStruct, Volume } from '@/type'
import * as _ from 'lodash'
import { queryAccountLiquidityPool } from '@/api/account'
import { getBeforeTimestamp, toBigNumber } from '@/utils'
import { isNativeToken } from '@/utils/chain'
import BigNumber from 'bignumber.js'
import { Provider } from '@ethersproject/providers'
import { currentChainConfig } from '@/config/chain'
import { certifiedPoolsAddress, getCertifiedPoolsByChain } from '@/config/pool'
import {  SATORI_ADDRESS_CONFIG, SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/const'
import { _0 } from '@mcdex/mai3.js'

const tradingMiningPools: { [id: number]: string[] } = {
  [SUPPORTED_NETWORK_ID.BSC]: [
    '0xdb282bbace4e375ff2901b84aceb33016d0d663d', // BUSD Pool
    '0x2ea001032b0eb424120b4dec51bf02db0df46c78', // BTC Pool
    '0x0a848c92295369794d38dfa1e4d26612cad2dfa8', // USX Pool
    '0xf6b2d76c248af20009188139660a516e5c4e0532', // BUSD Pool
  ],
  [SUPPORTED_NETWORK_ID.ARB]: [
    '0xab324146c49b23658e5b3930e641bdbdf089cbac', // USDC Pool
    '0xc7b2ad78fded2bbc74b50dc1881ce0f81a7a0cca', // ETH Pool
  ]
}

const wallet = namespace('wallet')
const poolList = namespace('poolList')
const price = namespace('price')

@Component
export class PoolListMixin extends Mixins(ErrorHandlerMixin) {
  @Prop({ default: true }) useSearchFilter!: boolean

  @State('isMobile') _isMobile !: boolean
  @wallet.Getter('address') userAddress!: string | null
  @wallet.Getter('provider') provider!: Provider
  @wallet.Getter('providerL1') providerL1!: Provider
  @price.Getter('tokenPriceFunc') tokenPriceFunc!: (token: string, networkId: SUPPORTED_NETWORK_ID) => BigNumber | null
  @price.Action('updateTokenPrice') updateTokenPrice!: (tokens: string[] | { tokens: string[], networkId: SUPPORTED_NETWORK_ID }) => Promise<void>
  // pool list store
  @poolList.State('poolList') storePoolList!: PoolListItem[] | null
  @poolList.State('subPoolList') storeSubPoolList!: { [poolAddress: string]: PoolListSubItem }
  @poolList.State('searchKey') storeSearchKey!: string | null
  @poolList.State('currentPage') storeCurrentPage!: number
  @poolList.State('selectedListType') storeSelectedListType!: PoolListType
  @poolList.State('onlyMine') storeOnlyMine!: boolean
  @poolList.State('lastRefreshTimeStamp') lastRefreshTimeStamp!: number
  @poolList.Mutation('updatePoolList') updatePoolList!: Function
  @poolList.Mutation('updateSubPoolList') updateSubPoolList!: Function
  @poolList.Mutation('updateSearchKey') updateSearchKey!: Function
  @poolList.Mutation('updateCurrentPage') updateCurrentPage!: Function
  @poolList.Mutation('updateSelectListType') updateSelectListType!: Function
  @poolList.Mutation('updateOnlyMine') updateOnlyMine!: Function
  @poolList.Mutation('updateLastRefreshTimeStamp') updateLastRefreshTimeStamp!: Function
  @poolList.Action('resetPoolListStorage') resetPoolListStorage!: Function

  protected poolRefreshTimeInterval: number = 300 // 5 minute
  protected currentPage: number = 1
  protected pageSize: number = 10
  protected searchKey: string = ''
  protected onlyMine: boolean = false
  protected tradingMiningPools: boolean = false
  protected selectedPoolListType: PoolListType = 'all'
  protected loading: boolean = false
  protected searchedPoolList: PoolListItem[] = []
  protected sourcePoolList: PoolListItem[] = []
  protected subPoolList: { [poolAddress: string]: PoolListSubItem} = {}
  protected myLiquidityPool: string[] = []
  protected myLiquidityPoolInfo: { [poolAddress: string]: MyPoolShareInfo } = {}

  mounted() {
    this.initialPoolListData()
    this.onlyMine = this.storeOnlyMine
    this.updateTokenPrice({ tokens: [SATORI_ADDRESS_CONFIG[SUPPORTED_NETWORK_ID.ARB]], networkId: SUPPORTED_NETWORK_ID.ARB })
    // TODO: arb ETH Pool, after delete
    this.updateTokenPrice({ tokens: ["0x82af49447d8a07e3bd95bd0d56f35241523fbab1"], networkId: SUPPORTED_NETWORK_ID.ARB })
  }

  destroyed() {
    this.updateCurrentPage(this.currentPage)
    this.updateSearchKey(this.searchKey)
    this.updateSelectListType(this.selectedPoolListType)
    this.updateOnlyMine(this.onlyMine)
    this.updateSubPoolList(this.subPoolList)
    if (this.sourcePoolList.length > 0) {
      this.updatePoolList(this.sourcePoolList)
    }
  }

  async initialPoolListData() {
    if (this.loading) {
      return
    }
    this.loading = true
    const nowTimeStamp: number = Date.now() / 1000

    // get special pool address list
    await this.getMyLiquidityPool()

    if (
      this.lastRefreshTimeStamp + this.poolRefreshTimeInterval >= nowTimeStamp &&
      this.storePoolList &&
      this.storePoolList.length > 0
    ) {
      // store
      this.sourcePoolList = this.storePoolList
      this.subPoolList = this.storeSubPoolList
      this.currentPage = this.storeCurrentPage
      if (this.storeSearchKey) {
        this.searchKey = this.storeSearchKey
      }
      this.onSearch()
    } else {
      // graph
      this.resetPoolListStorage()
      const poolListData = await this.getAndComputePoolListData()
      this.sourcePoolList = this.sortPoolList(poolListData)
      this.updateLastRefreshTimeStamp(nowTimeStamp)
      if (this.searchKey !== '') {
        this.onSearch()
      }
    }
    this.onProviderChanged()
    this.loading = false
  }

  get accountAddress(): string {
    if (!this.userAddress) {
      return ''
    }
    return this.userAddress.toLowerCase()
  }

  get poolCount(): number {
    return this.sourcePoolList.length
  }

  get mcbTokenPrice(): BigNumber | null {
    return this.tokenPriceFunc(SATORI_ADDRESS_CONFIG[SUPPORTED_NETWORK_ID.ARB], SUPPORTED_NETWORK_ID.ARB)
  }

  get sourceTableBody(): PoolListItem[] {
    if (this.storeSelectedListType === '') {
      return []
    }
    let poolList = this.sourcePoolList
    if (this.searchKey !== '' && this.useSearchFilter) {
      poolList = this.searchedPoolList
    }
    if (this.onlyMine) {
      poolList = this.filterMinePool(poolList)
    }
    if (this.tradingMiningPools) {
      poolList = this.filterTradingMiningPool(poolList)
    }
    if (this.selectedPoolListType === 'certified') {
      poolList = this.filterCertifiedPool(poolList)
    }
    if (this.selectedPoolListType === 'uncertified') {
      poolList = this.filterUncertifiedPool(poolList)
    }
    return this.sortPoolList(poolList)
  }

  get currentPagePoolList (): Array<PoolListItem> {
    return this.sourceTableBody.slice(
      this.pageSize * (this.currentPage - 1),
      this.pageSize * this.currentPage
    )
  }

  get sourceTableBodyCount(): number {
    return this.sourceTableBody.length
  }

  get noData(): boolean {
    return this.sourceTableBody.length === 0
  }

  // TODO: arb ETH Pool, after delete
  arbETHPoolLiquidity(item: PoolListItem): BigNumber | null {
    let price = this.tokenPriceFunc("0x82af49447d8a07e3bd95bd0d56f35241523fbab1", SUPPORTED_NETWORK_ID.ARB)
    if (!price) {
      return _0
    }
    return price.times(item.poolMargin)
  }

  filterMinePool(pools: PoolListItem[]): PoolListItem[] {
    if (!this.userAddress || !this.onlyMine) {
      return pools
    }
    return _.filter(pools, (item) => {
      return this.userAddress?.toLocaleLowerCase() === item.operatorAddress.toLowerCase()
        || this.isMyLiquidityPool(item.poolAddress)
    })
  }

  filterCertifiedPool(pools: PoolListItem[]): PoolListItem[] {
    const result: PoolListItem[] = []
    const currentCertifiedPools = getCertifiedPoolsByChain()
    pools.forEach(pool => {
      const matchedPool = currentCertifiedPools.find(p => p.poolAddress.toLowerCase() === pool.poolAddress.toLowerCase())
      if (matchedPool) {
        pool.poolIcon = matchedPool.poolIcon
        result.push(pool)
      }
    })
    return result
  }

  filterUncertifiedPool(pools: PoolListItem[]): PoolListItem[] {
    const certifiedPools = certifiedPoolsAddress()
    return _.filter(pools, (item) => {
      return certifiedPools.indexOf(item.poolAddress.toLowerCase()) === -1
    })
  }


  filterTradingMiningPool(pools: PoolListItem[]): PoolListItem[] {
    const miningPools = tradingMiningPools[currentChainConfig.chainID] || []
    return _.filter(pools, (item) => {
      return miningPools.indexOf(item.poolAddress.toLowerCase()) !== -1
    })
  }

  sortPoolList(poolList: PoolListItem[]): PoolListItem[] {
    return _.orderBy(
      poolList,
      [
        // this.sortOperatorIterator,
        // this.sortMyLiquidityIterator,
        this.sortPoolMarginUSDIterator,
        this.sortPoolMarginIterator,
        // this.sortMiningIterator,
        this.sortPerpetualNumberIterator,
      ],
      ['desc', 'desc', 'desc']
    )
  }

  sortMiningIterator(pool: PoolListItem): number {
    return pool.isMining ? 1 : -1
  }

  sortMyLiquidityIterator(pool: PoolListItem): number {
    return this.isMyLiquidityPool(pool.poolAddress) ? 1 : -1
  }

  sortOperatorIterator(pool: PoolListItem): number {
    return pool.operatorAddress.toLowerCase() === this.userAddress?.toLowerCase() ? 1 : -1
  }

  sortPoolMarginUSDIterator(pool: PoolListItem): number {
    const poolMarginUSD = new BigNumber(pool.poolMarginUSD)
    return poolMarginUSD.isNaN() ? -1 : poolMarginUSD.toNumber()
  }

  sortPoolMarginIterator(pool: PoolListItem): number {
    const poolMargin = new BigNumber(pool.poolMargin)
    return poolMargin.isNaN() ? -1 : poolMargin.toNumber()
  }

  sortPerpetualNumberIterator(pool: PoolListItem): number {
    return pool.perpetuals.length
  }

  subPoolItem(t: { [poolAddress: string]: PoolListSubItem }, poolAddress: string): PoolListSubItem | null {
    return t[poolAddress.toLowerCase()] || null
  }

  computeTotalApy(pool: PoolListSubItem | null): BigNumber | null {
    return !pool ? null : pool.lpApy.plus(pool.miningApy)
  }

  getSpecifyPoolItem(poolAddress: string): PoolListItem | null {
    const r = _.filter(this.sourcePoolList, (item) => {
      return item.poolAddress.toLowerCase() === poolAddress.toLowerCase()
    })
    if (r.length === 0) {
      return null
    }
    return r[0]
  }

  async getAndComputePoolListData(): Promise<PoolListItem[]> {
    const basePoolList = await this.getPoolListFromGraph()
    let newPoolList: PoolListItem[] = []
    basePoolList.forEach((item) => {
      let poolMarginUSD = item.poolMarginUSD ? item.poolMarginUSD.toString() : ''
      const poolItem: PoolListItem = {
        isMining: false,
        poolAddress: item.id.toLowerCase(),
        voteAddress: item.voteAddress ? item.voteAddress.toLowerCase() : '',
        operatorAddress: item.operatorAddress ? item.operatorAddress.toLowerCase() : '',
        operatorIsExpiration: item.operatorIsExpiration,
        collateralAddress: item?.collateralAddress || '',
        poolCollateralSymbol: isNativeToken(item.collateralAddress || '')
          ? currentChainConfig.symbol
          : item.collateralName?.toUpperCase() || '',
        perpetuals: !item.perpetuals
          ? []
          : item.perpetuals.map((perpItem) => {
            return { symbol: perpItem?.symbol || '', underlying: perpItem?.underlying || '' }
          }),
        poolMarginUSD: poolMarginUSD,
        poolMargin: item.poolMargin ? item.poolMargin.toString() : '',
        myShareRate: this.computeUserShareRate(item.id),
        myPooled: this.computeUserSharePooled(item.id),
        shareAddress: item.shareAddress ? item.shareAddress.toLowerCase() : '',
        governorPeriodFinish: item.governor ? item.governor.periodFinish.toString() : '0',
        rewardRate: item.governor ? item.governor.rewardRate.toString() : '0',
        isUnknownUSD: this.computeUnknownUSD(item),
        createTimestamp: item.createdAtTimestamp ? Number(item.createdAtTimestamp) : 0
      }
      newPoolList.push(poolItem)
    })
    return newPoolList
  }

  async getSubPoolListData(pools: string[]) {
    const [ poolVolumes, poolLiquidityData ] = await Promise.all([
      this.getPoolsVolumes(pools),
      this.getPoolsLiquidityData(pools)
    ])
    pools.forEach((poolAddress) => {
      this.$set(
        this.subPoolList,
        poolAddress.toLowerCase(),
        {
          volume: this.computeVolume(poolAddress, poolVolumes),
          lpApy: this.computeLpApy(poolAddress, poolLiquidityData),
          miningApy: this.computeMiningApy(poolAddress),
        }
      )
    })
  }

  async getPoolsVolumes(poolsAddress: string[]): Promise<{ [poolAddress: string]: Volume[] }> {
    if (poolsAddress.length === 0) {
      return {}
    }
    const timestamp = getBeforeTimestamp('d', 1)
    const poolVolume = await this.callGraphApiFunc(() => {
      return queryPoolsVolumesHistory(poolsAddress, timestamp)
    })
    if (!poolVolume) {
      return {}
    }
    return poolVolume.data
  }

  computeUnknownUSD(item: PoolStruct): boolean {
    if (!item.poolMargin || !item.poolMarginUSD) {
      return false
    }
    return !!new BigNumber(item.poolMargin).toNumber() && !new BigNumber(item.poolMarginUSD).toNumber()
  }

  computeVolume(poolAddress: string, poolVolumes: { [poolAddress: string]: Volume[] }): string {
    if (poolAddress === '' || !poolVolumes)  {
      return '0'
    }
    const poolItem = poolVolumes['pool_' + poolAddress.toLowerCase()]
    if (!poolItem || poolItem.length === 0) {
      return '0'
    }
    const totalVolume = _.sumBy(poolItem, (o) => {
      return Number(o.volume)
    })
    return totalVolume.toString()
  }

  async getPoolsLiquidityData(poolsAddress: string[]): Promise<{ [poolAddress: string]: PoolLiquidityData[] }> {
    if (poolsAddress.length === 0) {
      return {}
    }
    const timestamp = getBeforeTimestamp('d', 30)
    const poolData = await this.callGraphApiFunc(() => {
      return queryPoolsLiquidityHistory(poolsAddress, timestamp)
    })
    if (!poolData) {
      return {}
    }
    return poolData.data
  }

  computeLpApy(poolAddress: string, poolLiquidityData: { [poolAddress: string]: PoolLiquidityData[] }): BigNumber {
    if (poolAddress === '' || !poolLiquidityData)  {
      return toBigNumber(0)
    }
    const poolItem = poolLiquidityData['pool_' + poolAddress.toLowerCase()]
    if (!poolItem || poolItem.length <= 1) {
      return toBigNumber(0)
    }

    const nowTimestamp = Math.ceil(Date.now() / 1000)
    const poolInfos = _.filter(this.sourcePoolList, (item) => {
      return item.poolAddress.toLowerCase() === poolAddress.toLowerCase()
    })

    let leftInfoItem = poolItem[poolItem.length-1]
    for (let i=2; i< poolItem.length; i++) {
      if (!toBigNumber(leftInfoItem.netAssetValue).isZero()) {
        break
      }
      leftInfoItem = poolItem[poolItem.length-i]
    }
    const rightInfoItem = poolItem[0]
    // nav0: -10 day, nav1: now >> (nav1 - nav0) / nav0 / 10 * 365 * 100 (10-day avg apy)
    let nav0 = toBigNumber(leftInfoItem.netAssetValue)
    let nav1 = toBigNumber(rightInfoItem.netAssetValue)
    if (nav0.isZero()) {
      return toBigNumber(0)
    }

    let leftTimestamp = Number(leftInfoItem.timestamp)
    if (TARGET_NETWORK_ID === SUPPORTED_NETWORK_ID.BSC) {
      leftTimestamp = Math.max(leftTimestamp, 1633219200) // BSC starts at 2021-10-04 00:00 UTC. You can remove this line after 1 month
      if (poolAddress.toLowerCase() === '0x0a848c92295369794d38dfa1e4d26612cad2dfa8'.toLowerCase()) { // usx 2021-10-18 00:00 UTC. You can remove this line after 1 month
        leftTimestamp = Math.max(leftTimestamp, 1634515200) // usx 2021-10-18 00:00 UTC. You can remove this line after 1 month
      }
    }

    // if pool create time < 30 Day, nav0 = 1
    if (poolInfos.length > 0 && poolInfos[0].createTimestamp > 0
      && (nowTimestamp - (poolInfos[0].createTimestamp / 1000)) <= (86400 * 30)) {
      nav0 = new BigNumber(1)
    }

    const day = (Number(rightInfoItem.timestamp) - leftTimestamp) / 86400
    return nav1.minus(nav0).div(nav0).div(day).times(365).times(100)
  }

  computeMiningApy(poolAddress: string): BigNumber {
    const poolInfo = this.getSpecifyPoolItem(poolAddress)
    if (!poolInfo || !this.mcbTokenPrice || !poolInfo.poolMarginUSD
      || !poolInfo.isMining
      || toBigNumber(poolInfo.poolMarginUSD).isZero()) {
      return toBigNumber(0)
    }
    const SATORINumPerDay = new BigNumber(poolInfo.rewardRate).times(currentChainConfig.blockNumberPerDay)
    return SATORINumPerDay.times(this.mcbTokenPrice).times(365).times(100).div(poolInfo.poolMarginUSD)
  }

  computeUserShareRate(poolAddress: string): string {
    if (poolAddress === '' || !this.myLiquidityPoolInfo[poolAddress.toLowerCase()]) {
      return ''
    }
    const poolShareInfo = this.myLiquidityPoolInfo[poolAddress]
    return poolShareInfo.shareAmount
      .div(poolShareInfo.totalSupply)
      .times(100)
      .toFixed()
  }

  computeUserSharePooled(poolAddress: string): string {
    if (poolAddress === '' || !this.myLiquidityPoolInfo[poolAddress.toLowerCase()]) {
      return ''
    }
    const poolShareInfo = this.myLiquidityPoolInfo[poolAddress]
    const shareRate = poolShareInfo.shareAmount.div(poolShareInfo.totalSupply)
    if (poolShareInfo.poolMarginUSD.gt(0)) {
      return poolShareInfo.poolMarginUSD.times(shareRate).toFixed()
    }
    return poolShareInfo.poolMargin.times(shareRate).toFixed()
  }

  isMyLiquidityPool(poolAddress: string): boolean {
    const newPoolAddress = poolAddress.toLowerCase()
    return this.myLiquidityPool.indexOf(newPoolAddress) > -1
  }

  reComputeUserShareData(poolList: PoolListItem[]): PoolListItem[] {
    let newPoolList: PoolListItem[] = []
    poolList.forEach((item: PoolListItem) => {
      const isMyLiquidityPool = this.isMyLiquidityPool(item.poolAddress)
      if ((item.myShareRate !== '') !== isMyLiquidityPool) {
        item.myShareRate = this.computeUserShareRate(item.poolAddress)
        item.myPooled = this.computeUserSharePooled(item.poolAddress)
      }
      newPoolList.push(item)
    })
    return newPoolList
  }

  reComputeMiningApy() {
    const pools = Object.keys(this.subPoolList)
    pools.forEach((pool) => {
      this.$set(this.subPoolList, pool, {
        ...this.subPoolList[pool],
        miningApy: this.computeMiningApy(pool)
      })
    })
  }

  async getMyLiquidityPool() {
    this.myLiquidityPool = []
    this.myLiquidityPoolInfo = {}
    const liquidityPoolResult = await this.callGraphApiFunc(() => {
      if (this.userAddress) {
        return queryAccountLiquidityPool(this.userAddress)
      }
    })
    if (!liquidityPoolResult) {
      return
    }
    liquidityPoolResult.liquidityPools.forEach((val) => {
      const poolAddress: string = val.liquidityPool?.id || ''
      const shareToken = val.liquidityPool?.shareToken
      this.myLiquidityPool.push(poolAddress.toLowerCase())
      this.myLiquidityPoolInfo[poolAddress] = {
        poolAddress: poolAddress.toLowerCase(),
        shareAmount: toBigNumber(val.shareAmount),
        totalSupply: toBigNumber(shareToken?.totalSupply || '0'),
        poolMarginUSD: toBigNumber(val.liquidityPool?.poolMarginUSD || '0'),
        poolMargin: toBigNumber(val.liquidityPool?.poolMargin || '0'),
      }
    })
  }

  async getPoolListFromGraph(): Promise<PoolStruct[]> {
    const pools = await this.callGraphApiFunc(() => {
      return queryAllPools()
    })
    if (!pools) {
      return []
    }
    return pools.poolList
  }

  onSearch() {
    this.loading = true
    let localPoolList = this.sourcePoolList
    if (this.searchKey === '') {
      this.searchedPoolList = []
      this.loading = false
      return
    }
    const newSearchKey = this.searchKey.toLowerCase()
    const isPerpetualNameKey = newSearchKey.indexOf('-') > -1
    const searchPoolList = _.filter(localPoolList, (item: PoolListItem) => {
      if (newSearchKey === item.poolAddress.toLowerCase()) return true
      if (item.poolCollateralSymbol.toLowerCase().includes(newSearchKey)) return true
      let perpetualsIsMatch: boolean = false
      for (let i = 0; i < item.perpetuals.length; i++) {
        const perpItem = item.perpetuals[i]
        if (isPerpetualNameKey) {
          // underlying, collateral
          const perpetualNameKeys = newSearchKey.split('-')
          if (
            perpItem.underlying.toLowerCase() === perpetualNameKeys[0].toLowerCase() &&
            item.poolCollateralSymbol.toLowerCase() === perpetualNameKeys[1].toLowerCase()
          ) {
            perpetualsIsMatch = true
            break
          }
        } else {
          if (perpItem.symbol.toLowerCase().includes(newSearchKey) || perpItem.underlying.toLowerCase().includes(newSearchKey)) {
            perpetualsIsMatch = true
            break
          }
        }
      }
      return perpetualsIsMatch
    })
    this.searchedPoolList = this.sortPoolList(searchPoolList)
    this.loading = false
  }

  @Watch('userAddress')
  async onUserAddressChanged() {
    await this.getMyLiquidityPool()
    this.sourcePoolList = this.reComputeUserShareData(this.sortPoolList(this.sourcePoolList))
  }

  @Watch('providerL1', { immediate: true })
  async onProviderChanged() {
    if (!this.sourcePoolList || !this.providerL1 || this.poolCount === 0) {
      return
    }
    const latestBlockNumber = await this.providerL1.getBlockNumber()
    let newPoolList: PoolListItem[] = []
    this.sourcePoolList.forEach((item) => {
      item.isMining = Number(item.governorPeriodFinish) >= latestBlockNumber
      newPoolList.push(item)
    })
    this.sourcePoolList = newPoolList
    this.reComputeMiningApy()
  }

  @Watch('mcbTokenPrice', { immediate: true })
  async onMcbTokenPriceChanged() {
    this.reComputeMiningApy()
  }

  @Watch('sourcePoolList', { immediate: true })
  onCurrentPageChanged() {
    const pools = this.sourcePoolList.map((item) => item.poolAddress)
    let noDataPools: string[] = []
    pools.forEach((pool) => {
      const p =  this.subPoolItem(this.subPoolList, pool)
      if (!p) {
        noDataPools.push(pool)
      }
    })
    if (noDataPools.length === 0) {
      return
    }
    this.getSubPoolListData(pools)
  }
}
