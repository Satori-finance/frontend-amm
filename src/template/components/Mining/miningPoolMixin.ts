import { Component, Mixins, Watch } from 'vue-property-decorator'
import { LiquidityPoolDirectoryItem, PoolLiquidityData, PoolStruct } from '@/type'
import { queryPoolsLiquidityHistory, querySpecifiedPools } from '@/api/pool'
import { namespace } from 'vuex-class'
import { Provider } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import {
  _0,
  computeAMMPoolMargin,
  DECIMALS,
  getClaimableMiningReward,
  getERC20Contract,
  getLiquidityPool,
  getLpGovernorContract,
  getReaderContract,
  initAMMTradingContext,
  LiquidityPoolStorage,
} from '@mcdex/mai3.js'
import { SATORI_ADDRESS_CONFIG, NETWORK_PROVIDER_RPC_CONFIG, SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/const'
import { getBeforeTimestamp, toBigNumber } from '@/utils'
import { isNativeToken } from '@/utils/chain'
import { chainConfigs, currentChainConfig } from '@/config/chain'
import { ClaimMiningRewardMixin } from '@/template/components/Mining/claimMiningRewardMixin'
import { liquidityMiningPools } from '@/config/pool'
import * as _ from 'lodash'
import { ethers } from 'ethers'

const wallet = namespace('wallet')
const price = namespace('price')
const perpetual = namespace('perpetual')

const comingSoonMiningPool: {[chainID: number]: {
  poolName: string
}[]} = {
  [SUPPORTED_NETWORK_ID.ARB]: [],
  [SUPPORTED_NETWORK_ID.BSC]: [],
  [SUPPORTED_NETWORK_ID.ARB_TESTNET]: [
    {
      poolName: "ETH"
    },
    {
      poolName: "USDC"
    }
  ],
}

const poolTotalRewardInfo: {[chainId: number]: { [poolAddress: string]: BigNumber} } = {
  [SUPPORTED_NETWORK_ID.ARB]: {
    "0xc7b2ad78fded2bbc74b50dc1881ce0f81a7a0cca": new BigNumber(280), // ETH Pool
  },
  [SUPPORTED_NETWORK_ID.ARB_TESTNET]: {},
  [SUPPORTED_NETWORK_ID.BSC]: {
    "0xdb282bbace4e375ff2901b84aceb33016d0d663d": new BigNumber(4300),  // BUSD Pool
    "0x2ea001032b0eb424120b4dec51bf02db0df46c78": new BigNumber(140),  // BTC Pool
    "0xf6b2d76c248af20009188139660a516e5c4e0532": new BigNumber(280),  // ETH Pool
    "0x23cda00836e60d213d8e7b0c50c1e268e67b96f1": new BigNumber(300),  // USDO Pool
  }
}

export interface MiningPoolData {
  poolAddress: string
  collateral: string
  collateralAddress: string
  collateralSymbol: string
  perpetuals: Array<{ symbol: string, underlying: string }>
  governorAddress: string
  miningAPY: BigNumber | null
  LpAPY: BigNumber | null
  myShare: BigNumber
  myPooled: BigNumber
  claimable: BigNumber
  claiming?: boolean
  totalLiquidity: BigNumber
  visible: boolean
  totalReward: BigNumber
  chainId: number
}

@Component
export class MiningPoolMixin extends Mixins(ClaimMiningRewardMixin) {
  @wallet.Getter('provider') provider!: Provider
  @wallet.Getter('providerL1') providerL1!: Provider
  @wallet.Getter('address') address!: string
  @wallet.Getter('isConnectedWallet') isConnectedWallet!: boolean
  @price.Getter('tokenPriceFunc') tokenPriceFunc!: (token: string, networkId: number) => BigNumber | null
  @price.Action('updateTokenPrice') updateTokenPrice!: (payload: { tokens: string[], networkId: number }) => Promise<void>
  @perpetual.Getter('getLiquidityPoolFunc') getLiquidityPoolFunc!: (
    liquidityPoolAddress: string
  ) => LiquidityPoolDirectoryItem | null
  @perpetual.Action('updateLiquidityPool') updateLiquidityPool!: (liquidityPoolAddress: string) => Promise<void>

  protected pools: PoolStruct[] = []
  protected miningPoolChain: number[] = [SUPPORTED_NETWORK_ID.BSC, SUPPORTED_NETWORK_ID.ARB]
  protected currentBlockNumber = 0
  protected loading: boolean = false

  protected shareMap: Map<string, BigNumber> = new Map<string, BigNumber>()
  protected LpAPYMap: Map<string, BigNumber> = new Map<string, BigNumber>()
  protected claimableMap: Map<string, BigNumber> = new Map<string, BigNumber>()
  protected claimItemStateMap: Map<string, boolean> = new Map<string, boolean>()
  protected poolMarginMap: Map<string, BigNumber> = new Map<string, BigNumber>()
  protected blockNumberMap: Map<number, number> = new Map<number, number>()

  get isBSC() {
    return TARGET_NETWORK_ID === SUPPORTED_NETWORK_ID.BSC
  }

  get isArb() {
    return TARGET_NETWORK_ID === SUPPORTED_NETWORK_ID.ARB
  }

  get isArbTestnet() {
    return TARGET_NETWORK_ID === SUPPORTED_NETWORK_ID.ARB_TESTNET
  }

  get isOnlineChain() {
    return this.isBSC || this.isArb
  }

  get currentChainComingSoonPool() {
    return comingSoonMiningPool[currentChainConfig.chainID]
  }

  private get miningPools() {
    return this.pools
  }

  get miningPoolsData(): MiningPoolData[] {
    let pools: MiningPoolData[] = []
    const SATORIPrice = this.tokenPriceFunc(SATORI_ADDRESS_CONFIG[SUPPORTED_NETWORK_ID.ARB], SUPPORTED_NETWORK_ID.ARB)
    const claimItemStateMap = this.claimItemStateMap
    this.pools.forEach(p => {
      pools.push({
        poolAddress: p.id,
        claiming: claimItemStateMap.get(p.id) || false,
        collateral: p?.collateralName || '',
        collateralAddress: p.collateralAddress || '',
        collateralSymbol: isNativeToken(p.collateralAddress || '') ? currentChainConfig.symbol : p.collateralName?.toUpperCase() || '',
        perpetuals: !p.perpetuals ? [] : p.perpetuals.map((perpItem) => {
          return { symbol: perpItem?.symbol || '', underlying: perpItem?.underlying || '' }
        }),
        totalReward: this.getPoolTotalReward(p.id, this.getChainByAddress(p.id)),
        governorAddress: p?.governor?.id || '',
        miningAPY: SATORIPrice ? this.getMiningApy(p, SATORIPrice, this.getChainByAddress(p.id)) : _0,
        LpAPY: this.LpAPYMap.get(p.id) || _0,
        myShare: this.shareMap.get(p.id) || _0,
        myPooled: this.poolMarginMap.get(p.id || '')?.times(this.shareMap.get(p.id) || _0).div(100) || _0,
        claimable: this.claimableMap.get(p.id) || _0,
        totalLiquidity: new BigNumber(p.poolMarginUSD || _0),
        visible: false,
        chainId: this.getChainByAddress(p.id),
      })
    })
    return pools
  }

  getPoolTotalReward(poolAddress: string, chainID?: number): BigNumber {
    const currentChainPool = poolTotalRewardInfo[chainID || TARGET_NETWORK_ID]
    const v = currentChainPool[poolAddress.toLowerCase()]
    if (v) {
      return v
    }
    return new BigNumber(0)
  }

  getChainByAddress(poolAddress: string): number {
    let chain = 0
    for (const networkId of this.miningPoolChain) {
      for (const item of liquidityMiningPools[networkId]) {
        if (poolAddress === item.poolAddress) {
          chain = networkId
          break
        }
      }
      if (chain) {
        break
      }
    }
    return chain
  }

  private getMiningApy(pool: PoolStruct, price: BigNumber, chainID?: number): BigNumber {
    if (!pool.governor || !pool.poolMarginUSD || (pool.poolMarginUSD as BigNumber).isZero() ||
      Number(pool.governor.periodFinish) < (this.blockNumberMap.get(chainID || TARGET_NETWORK_ID) || 0)) {
      return _0
    }
    const SATORINumPerDay = new BigNumber(pool.governor.rewardRate).times(chainConfigs[chainID || TARGET_NETWORK_ID].blockNumberPerDay)
    return SATORINumPerDay.times(price).div(pool.poolMarginUSD).times(365).times(100)
  }

  mounted() {
    this.getPoolList()
    this.getCurrentBlockNumber()
    // can't get mcb price on bsc
    this.updateTokenPrice({ tokens: [SATORI_ADDRESS_CONFIG[SUPPORTED_NETWORK_ID.ARB]], networkId: SUPPORTED_NETWORK_ID.ARB })
  }

  async getPoolList() {
    this.loading = true
    let pools: PoolStruct[] = []
    await Promise.all(
      this.miningPoolChain.map(async (networkId) => {
        const currentChainPools = liquidityMiningPools[networkId] || []
        const poolsInfo = await this.callGraphApiFunc(() => {
          return querySpecifiedPools(currentChainPools.map(p => p.poolAddress.toLowerCase()),chainConfigs[networkId].subgraphConfig.dataSubgraph)
        })
        pools = pools.concat(poolsInfo?.pools || [])
      })
    )
    this.pools = pools
    this.loading = false
  }

  computePoolMargin(pool: LiquidityPoolStorage): BigNumber {
    try {
      let context = initAMMTradingContext(pool)
      context = computeAMMPoolMargin(context, _0 /* useless */, true /* allow unsafe */)
      return context.poolMargin
    } catch (InsufficientLiquidityError) {
      return _0
    }
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
    const poolInfos = _.filter(this.pools, (item) => {
      return item.id.toLowerCase() === poolAddress.toLowerCase()
    })

    let leftInfoItem = poolItem[poolItem.length-1]
    const rightInfoItem = poolItem[0]
    for (let i=2; i< poolItem.length; i++) {
      if (!toBigNumber(leftInfoItem.netAssetValue).isZero()) {
        break
      }
      leftInfoItem = poolItem[poolItem.length-i]
    }

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
    if (poolInfos.length > 0) {
      const poolCreateTimestamp = poolInfos[0].createdAtTimestamp ? Number(poolInfos[0].createdAtTimestamp) / 1000 : 0
      if (poolCreateTimestamp > 0 && (nowTimestamp - poolCreateTimestamp) <= (86400 * 30)) {
        nav0 = new BigNumber(1)
      }
    }

    const day = (Number(rightInfoItem.timestamp) - leftTimestamp) / 86400
    return nav1.minus(nav0).div(nav0).div(day).times(365).times(100)
  }

  getChainIcon(chain: number) {
    if (!chainConfigs[chain] || !chainConfigs[chain].icon) {
      return
    }
    return chainConfigs[chain].icon
  }

  getChainName(chain: number) {
    if (!chainConfigs[chain] || !chainConfigs[chain].chainName) {
      return
    }
    return chainConfigs[chain].chainName
  }

  async getPoolsLiquidityData(poolsAddress: string[], chainId?: number): Promise<{ [poolAddress: string]: PoolLiquidityData[] }> {
    if (poolsAddress.length === 0) {
      return {}
    }
    const subgraph = chainConfigs[chainId || TARGET_NETWORK_ID].subgraphConfig.dataSubgraph
    const timestamp = getBeforeTimestamp('d', 30)
    const poolData = await this.callGraphApiFunc(() => {
      return queryPoolsLiquidityHistory(poolsAddress, timestamp, 1000, subgraph)
    })
    if (!poolData) {
      return {}
    }
    return poolData.data
  }

  async getCurrentBlockNumber() {
    const blockNumberMap = new Map<number, number>()
    await Promise.all(
      this.miningPoolChain.map(async (chainId) => {
        if (chainId === SUPPORTED_NETWORK_ID.ARB) {
          const provider = new ethers.providers.StaticJsonRpcProvider({
            url: NETWORK_PROVIDER_RPC_CONFIG[SUPPORTED_NETWORK_ID.MAINNET],
            timeout: 30000
          })
          blockNumberMap.set(chainId, await provider.getBlockNumber())
        } else {
          const provider = new ethers.providers.StaticJsonRpcProvider({
            url: NETWORK_PROVIDER_RPC_CONFIG[chainId],
            timeout: 30000
          })
          blockNumberMap.set(chainId, await provider.getBlockNumber())
        }
      })
    )
    this.blockNumberMap = blockNumberMap
  }

  @Watch('miningPools')
  @Watch('address')
  async getClaimableMiningReward() {
    const claimableMap = new Map<string, BigNumber>()
    const shareMap = new Map<string, BigNumber>()
    await this.callChainReadFunc(async () => {
      return await Promise.all(this.miningPools.map(async (p) => {
        if (!this.address || this.address === '' || !p.governor) {
          claimableMap.set(p.id, new BigNumber(0))
          shareMap.set(p.id, new BigNumber(0))
          return
        }
        const lpGovernorContract = getLpGovernorContract(
          p.governor.id,
          this.provider,
        )
        claimableMap.set(p.id, await getClaimableMiningReward(lpGovernorContract, this.address))
      }))
    })
    this.claimableMap = claimableMap
  }

  @Watch('miningPools')
  @Watch('address')
  async getShareRageReward() {
    const shareMap = new Map<string, BigNumber>()
    await this.callChainReadFunc(async () => {
      return await Promise.all(this.miningPools.map(async (p) => {
        if (!this.address || this.address === '' || !p.shareAddress) {
          shareMap.set(p.id, new BigNumber(0))
          return
        }
        const nullIfNotDeployed = (err: Error & { code?: string }): null => {
          if (err.code === 'CALL_EXCEPTION') {
            return null
          }
          throw err
        }
        const erc20Contract = getERC20Contract(p.shareAddress, this.provider)
        const [
          tokenBalance,
          tokenTotalSupply,
        ] = await Promise.all([
          erc20Contract.balanceOf(this.address).catch((e: Error) => nullIfNotDeployed(e)),
          erc20Contract.totalSupply().catch((e: Error) => nullIfNotDeployed(e)),
        ])
        if (tokenBalance && tokenTotalSupply) {
          const shareRate = tokenTotalSupply.isZero() ? _0 : new BigNumber(tokenBalance.toString()).div(tokenTotalSupply.toString()).times(100)
          shareMap.set(p.id, shareRate)
          shareMap.set(`${p.id}_tokenBalance`, new BigNumber(tokenBalance.toString()).shiftedBy(-DECIMALS))
        }
      }))
    })
    this.shareMap = shareMap
  }

  @Watch('miningPools')
  async getLpApy() {
    const LpAPYMap = new Map<string, BigNumber>()
    let poolLiquidityData = {}
    await Promise.all(
      this.miningPoolChain.map(async (chainId) => {
        const currentChainPools = liquidityMiningPools[chainId]
        const poolsAddress = currentChainPools.map(p => p.poolAddress.toLowerCase())
        const data = await this.getPoolsLiquidityData(poolsAddress, chainId)
        poolLiquidityData = Object.assign(poolLiquidityData, data)
      })
    )

    this.miningPools.map((p)=>{
      LpAPYMap.set(p.id, this.computeLpApy(p.id, poolLiquidityData))
    })
    this.LpAPYMap = LpAPYMap
  }

  @Watch('miningPools')
  async getPoolMargin() {
    const poolMarginMap = new Map<string, BigNumber>()

    const poolAddress: string[]= this.miningPools.map((p)=>{
      return p.id
    })
    poolAddress.map(async (poolAddress)=>{
      const chain = this.getChainByAddress(poolAddress)
      let provider = this.provider
      if (chain !== TARGET_NETWORK_ID) {
        provider = new ethers.providers.StaticJsonRpcProvider({
          url: NETWORK_PROVIDER_RPC_CONFIG[chain],
          timeout: 30000
        })
      }
      const reader = await getReaderContract(provider)
      const liquidityPoolStorage = await getLiquidityPool(reader, poolAddress)
      if (liquidityPoolStorage) {
        poolMarginMap.set(poolAddress, this.computePoolMargin(liquidityPoolStorage))
      }
    })
    this.poolMarginMap = poolMarginMap
  }

  setClaimState(poolAddress: string, state: boolean) {
    this.claimItemStateMap.set(poolAddress, state)
    this.claimItemStateMap = new Map<string, boolean>(this.claimItemStateMap)
  }

  async onClaimEvent(item: MiningPoolData) {
    if (!this.provider || !item) {
      return null
    }
    this.setClaimState(item.poolAddress, true)
    await this.callChainFunc(async () => {
      await this.claimingMiningReward(item.governorAddress, 'liquidityMining')
    })
    this.setClaimState(item.poolAddress, false)
    await this.getClaimableMiningReward()
  }
}
