<template>
  <div class="liquidity-provider">
    <div class="panel-item-header flex-box">
      <div class="title">{{ $t('accountWallet.liquidityProvider.title') }}</div>
      <div class="right">
        <McTabs v-model="selectedPoolListType" :tabs="poolListTypeOptions" :equal-width="true" />
      </div>
    </div>
    <div class="table-container">
      <McLoading :show-loading="loading" :min-show-time="300" :hide-content="true">
        <div class="table-container">
          <table class="mc-data-table">
            <thead>
              <tr>
                <th>{{ $t('accountWallet.liquidityProvider.pool') }}</th>
                <th>{{ $t('accountWallet.liquidityProvider.pooled') }}</th>
                <th>{{ $t('accountWallet.liquidityProvider.lpToken') }}</th>
                <th>{{ $t('accountWallet.liquidityProvider.share') }}</th>
                <th>
                  <el-tooltip placement="top" :open-delay="400">
                    <span>{{ $t('accountWallet.liquidityProvider.apy') }}</span>
                    <div slot="content"><span v-html="$t('pool.poolList.apyPrompt')"></span></div>
                  </el-tooltip>
                </th>
              </tr>
            </thead>
            <tbody :class="{ 'no-data': noData }">
              <tr v-if="noData">
                <td colspan="5">
                  <McNoData :label="$t('base.noData')"></McNoData>
                </td>
              </tr>
              <tr v-for="(item, index) in tableBody" :key="index" @click="toInfo(item)">
                <template v-if="!item">
                  <td colspan="100"></td>
                </template>
                <template v-else>
                  <td>
                    <div class="flex-box">
                      <el-image class="token-img" :src="item.collateralAddress | tokenIconUrlFormatter">
                        <div slot="error" class="image-slot">
                          <img src="@/assets/img/tokens/Unknow.svg" alt="">
                        </div>
                      </el-image>
                      <div>{{ item.collateralSymbol }} {{ $t('base.pool') }}</div>
                    </div>

                  </td>
                  <td>
                    <div>{{ item.myPooled | bigNumberFormatter(item.collateralFormatDecimals) }}
                      {{ item.collateralSymbol }}</div>
                    <div class="text">${{ item.value | bigNumberFormatter(2) }}</div>
                  </td>
                  <td>
                    {{ item.lpTokenAmount | bigNumberFormatter(1) }}
                  </td>
                  <td>
                    {{ item.myShare | bigNumberFormatter(2) }}%
                  </td>
                  <td>
                    <PNNumber :number="item.LpAPY.plus(item.miningAPY)" :showPlusSign="true" :decimals="2" suffix="%" />
                    <div class="text">
                      {{ item.LpAPY | bigNumberFormatter(2) }}% +
                      {{ item.miningAPY | bigNumberFormatter(2) }}%
                    </div>

                  </td>
                </template>
              </tr>
            </tbody>
          </table>
          <div class="table-pagination" v-if="totalCount > pagination.pageSize">
            <McPagination :page-size.sync="pagination.pageSize" :total="totalCount"
                          :current-page.sync="pagination.currentPage">
            </McPagination>
          </div>
        </div>
      </McLoading>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import { McLoading, McNoData, PNNumber, McTabs, McPagination } from '@/components'
import BigNumber from 'bignumber.js'
import { queryLiquidityAccounts } from '@/api/account'
import { namespace } from 'vuex-class'
import { ErrorHandlerMixin } from '@/mixins'
import { LiquidityAccount, LiquidityPoolDirectoryItem, PoolLiquidityData, PoolStruct } from '@/type'
import { getBeforeTimestamp, toBigNumber } from '@/utils'
import { currentChainConfig } from '@/config/chain'
import { queryPoolsLatestNAV, queryPoolsLiquidityHistory } from '@/api/pool'
import _ from 'lodash'
import {
  _0,
  computeAMMPoolMargin,
  DECIMALS,
  getERC20Contract,
  initAMMTradingContext,
  LiquidityPoolStorage,
} from '@mcdex/mai3.js'
import { Provider } from '@ethersproject/providers'
import { SATORI_ADDRESS, SATORI_ADDRESS_CONFIG, SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/constants'
import { PoolListType } from '@/template/Pool/type'
import { certifiedPoolsAddress } from '@/config/pool'
import { isNativeToken } from '@/utils/chain'

interface TableItem {
  poolAddress: string
  collateralSymbol: string | null
  collateralAddress: string | null
  lpTokenAmount: BigNumber
  value: BigNumber | null
  collateralFormatDecimals: number | null
  myShare: BigNumber
  myPooled: BigNumber
  LpAPY: BigNumber
  miningAPY: BigNumber
}

const wallet = namespace('wallet')
const perpetual = namespace('perpetual')
const account = namespace('account')
const price = namespace('price')

@Component({
  components: {
    McPagination,
    McLoading,
    McNoData,
    PNNumber,
    McTabs,
  },
})
export default class LiquidityProvider extends Mixins(ErrorHandlerMixin) {
  @wallet.Getter('address') address!: string | null
  @wallet.Getter('provider') provider!: Provider
  @price.Getter('tokenPriceFunc') tokenPriceFunc!: (token: string, networkId: SUPPORTED_NETWORK_ID) => BigNumber | null
  @price.Action('updateTokenPrice') updateTokenPrice!: (tokens: string[] | { tokens: string[], networkId: SUPPORTED_NETWORK_ID }) => Promise<void>
  @perpetual.Getter('getLiquidityPoolFunc') getLiquidityPoolFunc!: (
    liquidityPoolAddress: string
  ) => LiquidityPoolDirectoryItem | null
  @perpetual.Action('updateLiquidityPool') updateLiquidityPool!: (liquidityPoolAddress: string) => Promise<void>

  private pagination = {
    pageSize: 5,
    currentPage: 1,
  }
  private loading: boolean = false
  private liquidityAccounts: LiquidityAccount[] = []
  private navs: PoolLiquidityData[] = []
  protected selectedPoolListType: PoolListType = 'certified'
  protected shareMap: Map<string, BigNumber> = new Map<string, BigNumber>()
  protected LpAPYMap: Map<string, BigNumber> = new Map<string, BigNumber>()

  mounted() {
    this.updateTokenPrice({ tokens: [SATORI_ADDRESS_CONFIG[SUPPORTED_NETWORK_ID.ARB]], networkId: SUPPORTED_NETWORK_ID.ARB })
    this.selectedPoolListType = this.getLastListType() || 'certified'
  }

  destroyed() {
    this.saveLastListType(this.selectedPoolListType)
  }

  get mcbTokenPrice(): BigNumber | null {
    return this.tokenPriceFunc(SATORI_ADDRESS_CONFIG[SUPPORTED_NETWORK_ID.ARB], SUPPORTED_NETWORK_ID.ARB)
  }

  get poolListTypeOptions() {
    return [
      { label: this.$t('base.certified').toString(), value: 'certified' },
      { label: this.$t('base.uncertified').toString(), value: 'uncertified' },
    ]
  }

  get totalCount() {
    return this.tableData.length
  }

  get tableData(): TableItem[] {
    if (this.selectedPoolListType === 'certified') {
      return this.filterCertifiedPool(this.tableList)
    }
    if (this.selectedPoolListType === 'uncertified') {
      return this.filterUncertifiedPool(this.tableList)
    }
    return this.tableList
  }

  get tableList(): TableItem[] {
    return this.liquidityAccounts.map((item) => {
      const nav = _.find(this.navs, nav => {
        return nav.liquidityPool === item.liquidityPool!.id
      })
      return {
        poolAddress: item.liquidityPool?.id || '',
        collateralSymbol: isNativeToken(item.liquidityPool?.collateralAddress || '') ? currentChainConfig.symbol : item.liquidityPool?.collateralName || null,
        collateralAddress: item.liquidityPool?.collateralAddress || null,
        lpTokenAmount: item.shareAmount as BigNumber,
        value: nav ? (item.shareAmount as BigNumber).times(nav.netAssetValue) : null,
        collateralFormatDecimals: this.getLiquidityPoolFunc(item.liquidityPool?.id || '')?.perpetualPropertyMap.values().next().value.collateralFormatDecimals || 3,
        myShare: this.shareMap.get(item.id) || _0,
        myPooled: this.poolMarginMap.get(item.liquidityPool?.id || '')?.times(this.shareMap.get(item.id) || _0).div(100) || _0,
        LpAPY: this.LpAPYMap.get(item.liquidityPool?.id || '') || _0,
        miningAPY: item.liquidityPool ? this.getMiningApy(item.liquidityPool) : _0
      }
    })
  }

  get tableBody(): TableItem[] {
    const start = this.pagination.currentPage * this.pagination.pageSize - this.pagination.pageSize
    const end = start + this.pagination.pageSize
    return this.tableData.slice(start, end)
  }

  get noData(): boolean {
    return this.tableData.length === 0
  }

  get poolMarginMap(): Map<string, BigNumber> {
    const poolMarginMap = new Map<string, BigNumber>()
    const poolAddress: string[] = this.liquidityAccounts.map((p) => {
      return p.liquidityPool?.id || ''
    })
    poolAddress.map((poolAddress) => {
      const liquidityPoolStorage = this.getLiquidityPoolFunc(poolAddress)?.liquidityPoolStorage
      if (liquidityPoolStorage) {
        poolMarginMap.set(poolAddress, this.computePoolMargin(liquidityPoolStorage))
      }
    })
    return poolMarginMap
  }

  private filterCertifiedPool(pools: TableItem[]): TableItem[] {
    const certifiedPools = certifiedPoolsAddress()
    return _.filter(pools, (item) => {
      return certifiedPools.indexOf(item.poolAddress.toLowerCase()) > -1
    })
  }

  private filterUncertifiedPool(pools: TableItem[]): TableItem[] {
    const certifiedPools = certifiedPoolsAddress()
    return _.filter(pools, (item) => {
      return certifiedPools.indexOf(item.poolAddress.toLowerCase()) === -1
    })
  }

  private getMiningApy(pool: PoolStruct): BigNumber {
    if (!pool || !this.mcbTokenPrice || !pool.poolMarginUSD || toBigNumber(pool.poolMarginUSD).isZero() || !pool.governor) {
      return toBigNumber(0)
    }
    const SATORINumPerDay = new BigNumber(pool.governor.rewardRate).times(currentChainConfig.blockNumberPerDay)
    return SATORINumPerDay.times(this.mcbTokenPrice).times(365).times(100).div(pool.poolMarginUSD)
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

  private computePoolMargin(pool: LiquidityPoolStorage): BigNumber {
    try {
      let context = initAMMTradingContext(pool)
      context = computeAMMPoolMargin(context, _0 /* useless */, true /* allow unsafe */)
      return context.poolMargin
    } catch (InsufficientLiquidityError) {
      return _0
    }
  }

  private computeLpApy(poolAddress: string, poolLiquidityData: { [poolAddress: string]: PoolLiquidityData[] }): BigNumber {
    if (poolAddress === '' || !poolLiquidityData) {
      return toBigNumber(0)
    }
    const poolItem = poolLiquidityData['pool_' + poolAddress.toLowerCase()]
    if (!poolItem || poolItem.length <= 1) {
      return toBigNumber(0)
    }
    let leftInfoItem = poolItem[poolItem.length - 1]
    const rightInfoItem = poolItem[0]
    for (let i = 2; i < poolItem.length; i++) {
      if (!toBigNumber(leftInfoItem.netAssetValue).isZero()) {
        break
      }
      leftInfoItem = poolItem[poolItem.length - i]
    }
    // nav0: -10 day, nav1: now >> (nav1 - nav0) / nav0 / 10 * 365 * 100 (10-day avg apy)
    const nav0 = toBigNumber(leftInfoItem.netAssetValue)
    const nav1 = toBigNumber(rightInfoItem.netAssetValue)
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
    const day = (Number(rightInfoItem.timestamp) - leftTimestamp) / 86400
    return nav1.minus(nav0).div(nav0).div(day).times(365).times(100)
  }

  private saveLastListType(listType: PoolListType) {
    window.localStorage.setItem('liquidityProviderListType', listType)
  }

  private getLastListType(): PoolListType | null {
    const t = window.localStorage.getItem('liquidityProviderListType')
    if (t && (t === 'certified' || t === 'uncertified')) {
      return t as PoolListType
    }
    return null
  }

  private toInfo(item: TableItem) {
    this.$router.push({
      name: 'poolInfo', params: { poolAddress: item.poolAddress },
    })
  }

  @Watch('address', { immediate: true })
  async loadData() {
    await this.callGraphApiFunc(async () => {
      if (!this.address) {
        this.liquidityAccounts = []
        return
      }
      this.loading = true
      try {
        const result = await queryLiquidityAccounts(this.address)
        this.liquidityAccounts = result.liquidityAccounts
        this.liquidityAccounts.map(async (p) => {
          await this.updateLiquidityPool(p.liquidityPool?.id || '')
        })
        this.navs = await queryPoolsLatestNAV(this.liquidityAccounts.map(item => item.liquidityPool!.id))
      } finally {
        this.loading = false
      }
    })
  }

  @Watch('liquidityAccounts')
  @Watch('address')
  async getShareRageReward() {
    const shareMap = new Map<string, BigNumber>()
    await this.callChainReadFunc(async () => {
      return await Promise.all(this.liquidityAccounts.map(async (p) => {
        if (!this.address || this.address === '' || !p.liquidityPool?.shareAddress) {
          shareMap.set(p.id, new BigNumber(0))
          return
        }
        const nullIfNotDeployed = (err: Error & { code?: string }): null => {
          if (err.code === 'CALL_EXCEPTION') {
            return null
          }
          throw err
        }
        const erc20Contract = getERC20Contract(p.liquidityPool.shareAddress, this.provider)
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

  @Watch('liquidityAccounts')
  @Watch('address')
  async getLpApy() {
    const LpAPYMap = new Map<string, BigNumber>()
    const poolAddress: string[] = this.liquidityAccounts.map((p) => {
      return p.liquidityPool?.id || ''
    })
    const poolLiquidityData = await this.getPoolsLiquidityData(poolAddress)
    poolAddress.map((poolAddress) => {
      LpAPYMap.set(poolAddress, this.computeLpApy(poolAddress, poolLiquidityData))
    })
    this.LpAPYMap = LpAPYMap
  }

  @Watch('selectedPoolListType', { immediate: true })
  updateCurrentPage() {
    if (this.pagination.currentPage) {
      this.pagination.currentPage = 1
    }
  }
}
</script>

<style scoped lang="scss">
@import './wallet.scss';
.liquidity-provider {
  .panel-item-header {
    margin-bottom: 18px;
  }

  .right {
    width: 169px;
    border-bottom: 1px solid;
    align-items: center;

    ::v-deep {
      .mc-tabs {
        width: 169px;
        height: 44px;
        line-height: 44px;

        .tab-item {
          font-size: 16px;
        }

        .select-bar {
          margin-top: -2.8px;
        }
      }
    }
  }

  .table-container {
    .mc-data-table {
      width: 100%;
      border: 1px solid;
      border-radius: 12px;
      border-collapse: collapse;
      border-style: hidden;
      overflow: hidden;
      font-size: 14px;

      tbody {
        tr {
          border-bottom: 1px solid;
        }
      }

      thead tr th,
      tbody tr td {
        position: relative;
        text-align: left;
        padding-left: 16px;

        &:nth-child(1) {
          width: 176px;
        }

        &:nth-child(2) {
          width: 200px;
        }

        &:nth-child(3) {
          width: 152px;
        }

        &:nth-child(4) {
          width: 144px;
        }

        &:nth-child(5) {
          width: auto;
        }
      }
    }
  }

  .flex-box {
    display: flex;
    align-items: center;

    .token-img {
      margin-right: 8px;
      width: 32px;
      height: 32px;

      img {
        height: 100%;
        width: 100%;
      }
    }
  }

  .text {
    font-size: 12px;
    line-height: 16px;
    margin-top: 4px;
  }
}
</style>

<style scoped lang="scss">
.satori-fantasy {
  .liquidity-provider {
    .right {
      border-bottom-color: var(--mc-border-color);
    }

    .table-container {
      .mc-data-table {
        border-color: var(--mc-border-color);
        -webkit-box-shadow: 0 0 0 1px var(--mc-border-color);
        box-shadow: 0 0 0 1px var(--mc-border-color);

        tbody {
          background-color: var(--mc-background-color-dark);

          tr {
            border-bottom-color: var(--mc-border-color);
          }
        }
      }
    }

    .text {
      color: var(--mc-text-color);
    }
  }
}
</style>

