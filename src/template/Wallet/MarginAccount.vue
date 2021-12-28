<template>
  <div class="margin-account">
    <div class="panel-item-header">
      <div class="title">{{ $t('accountWallet.marginAccount.title') }}</div>
    </div>
    <McLoading :show-loading="loading" :min-show-time="300" :hide-content="true">
      <div class="table-container">
        <table class="mc-data-table">
          <thead>
          <tr>
            <th class="is-left">
              <span>
                <el-tooltip :content="$t('hintInfos.positionsAndOrders.symbol')" placement="top" :open-delay="400">
                  <span class="tip-text">{{ $t('accountWallet.marginAccount.perpetualContract') }}</span>
                </el-tooltip>
              </span>
            </th>
            <th class="is-left">
              <el-tooltip :content="$t('hintInfos.positionsAndOrders.margin')" placement="top" :open-delay="400">
                <span>{{ $t('accountWallet.marginAccount.marginBalance') }}</span>
              </el-tooltip>
            </th>
            <th class="is-left">
              <span>
                {{ $t('accountWallet.marginAccount.side') }}
              </span>
            </th>
            <th class="is-left">
              <el-tooltip placement="top" :open-delay="400">
                <div slot="content" v-html="$t('hintInfos.positionsAndOrders.size')"></div>
                <span>{{ $t('accountWallet.marginAccount.positionSize') }}</span>
              </el-tooltip>
            </th>
            <th class="is-left">
              <el-tooltip placement="top" :open-delay="400">
                <div slot="content" v-html="$t('hintInfos.positionsAndOrders.positionPnl')"></div>
                <span class="decoration">{{ $t('accountWallet.marginAccount.pnl') }}</span>
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
            <tr v-for="(item, index) in tableBody" :key="index" @click="switchContract(item)">
              <template v-if="!item">
                <td colspan="100"></td>
              </template>
              <template v-else>
                <td>
                  <div class="cell symbol-row" v-if="item.perpetualProperty">
                    <div class="symbol-box">
                      <span>
                        <McTokenPairView :underlyingSymbol="item.underlyingSymbol"
                                         :collateralAddress="item.collateralAddress" />
                      </span>
                      <div class="symbol-link">
                        <div class="click-field">
                          {{ item.perpetualProperty.name }}
                        </div>
                        <div class="newline light-color symbol">
                          {{ item.perpetualProperty.symbolStr }}
                          <span class="inverse-card"
                                v-if="item.perpetualProperty.isInverse">{{ $t('base.inverse') }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="cell flex-box" v-if="item.perpetualProperty">
                    <div class="margin-balance">
                      {{ item.marginBalance | bigNumberFormatter(item.perpetualProperty.collateralFormatDecimals) }}
                      {{ item.perpetualProperty.collateralTokenSymbol }}
                    </div>
                    <template v-if="
                        item.isEmergency ||
                        item.isCleared
                      ">
                      <i></i>
                    </template>
                    <template v-else>
                      <i v-if="!item.positionAmount.eq(0)" class="iconfont icon-plus-frame-round mc-icon-btn"
                         :class="{ disabled: item.isEmergency }" @click.stop="showChangeMargin(item)"></i>
                      <i v-else class="iconfont icon-minus-frame-round mc-icon-btn"
                         :class="{ disabled: item.isEmergency }" @click.stop="showChangeMargin(item, 'withdraw')"></i>
                    </template>
                  </div>
                </td>
                <td>
                  <div class="cell" v-if="item.perpetualProperty">
                    <template v-if="item.positionAmount.isZero()">
                      <span class="sub-info">--</span>
                    </template>
                    <template v-else>
                      <span class="side-box" :class="getSideClass(item)">
                        <span class="short">{{ $t('base.short') }}</span>
                        <span class="long">{{ $t('base.long') }}</span>
                      </span>
                      <div class="unit sub-info">
                        {{ item.perpetualProperty.contractSymbol }}
                      </div>
                    </template>
                  </div>
                </td>
                <td>
                  <div class="cell" v-if="item.perpetualProperty">
                    <div class="values">
                      <div class="position-value">
                        {{
                        item.positionAmount.abs()
                          | bigNumberFormatter(item.perpetualProperty.underlyingAssetFormatDecimals)
                      }}
                        {{ item.perpetualProperty.underlyingAssetSymbol }}
                      </div>
                      <div class="notion-value sub-info">
                        {{
                        item.notionalAmount
                          | bigNumberFormatter(item.perpetualProperty.collateralFormatDecimals)
                      }}
                        {{ item.perpetualProperty.collateralTokenSymbol }}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="cell" v-if="item.perpetualProperty">
                    <template v-if="item.isCleared || item.isEmergency || item.positionAmount.isZero()">
                      <span class="sub-info">--</span>
                    </template>
                    <template v-else>
                      <div>
                        <PNNumber class="pnl" v-if="item.pnl" :number="item.pnl"
                                  :decimals="item.collateralFormatDecimals" :suffix="` ${item.collateralSymbol}`"
                                  show-plus-sign />
                      </div>
<!--                      <PNNumber class="roe" v-if="item.roe" :number="item.roe.times(100)" :decimals="1" suffix="%"-->
<!--                                :showPlusSign="true" :roundingMode="BigNumber.ROUND_UP" />-->
                    </template>
                  </div>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
        <div class="table-pagination" v-if="total > pagination.pageSize">
          <McPagination :page-size.sync="pagination.pageSize" :total="total"
                        :current-page.sync="pagination.currentPage"></McPagination>
        </div>
      </div>
    </McLoading>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch, Mixins } from 'vue-property-decorator'
import { McLoading, McNoData, PNNumber, McTokenPairView, McPagination } from '@/components'
import { DepositWithdrawMixin, ErrorHandlerMixin } from '@/mixins'
import BigNumber from 'bignumber.js'
import { namespace } from 'vuex-class'
import { MarginAccount, PerpetualCombinedState, PerpetualProperty } from '@/type'
import { ACCOUNT_EVENT, VUE_EVENT_BUS } from '@/event'
import { _0, AccountStorage, LiquidityPoolStorage, PerpetualState } from '@mcdex/mai3.js'
import { getPerpetualFromID, getPerpetualID, isLongPosition } from '@/utils'
import { ROUTE } from '@/router'
import { queryMarginAccounts } from '@/api/marginAccount'
import { currentChainConfig } from '@/config/chain'
import { computeAccountDetails } from '@/utils/account'

interface TokenInfo {
  collateral: string
  amount: BigNumber
}

interface TableItem {
  perpetualID: string
  perpetualProperty: PerpetualProperty | null
  collateralAddress: string | null
  underlyingSymbol: string | null
  collateralSymbol: string | null
  marginBalance: BigNumber | null
  positionAmount: BigNumber
  notionalAmount: BigNumber
  isInverse: boolean
  liquidityPoolStorage: LiquidityPoolStorage | null
  withdrawing?: boolean
  isEmergency: boolean
  isCleared: boolean
  roe: BigNumber | null
  pnl: BigNumber | null
}

const account = namespace('account')
const wallet = namespace('wallet')
const price = namespace('price')
const perpetual = namespace('perpetual')

@Component({
  components: {
    McLoading,
    McNoData,
    PNNumber,
    McTokenPairView,
    McPagination,
  },
})
export default class MarginAccounts extends Mixins(DepositWithdrawMixin, ErrorHandlerMixin) {
  @account.Getter('marginAccounts') marginAccounts!: MarginAccount[]
  @account.Action('updateMarginAccounts') updateMarginAccounts!: () => Promise<void>
  @price.Action('updateTokenPrice') updateTokenPrice!: (tokens: string[]) => Promise<void>
  @wallet.Getter('address') address!: string | null
  @price.Getter('tokenPriceFunc') tokenPriceFunc!: (token: string) => BigNumber | null
  @perpetual.Action('updatePerpetual') updatePerpetual!: (perpetualID: string) => Promise<void>
  @perpetual.Getter('getPerpetualFunc') getPerpetualFunc!: (perpetualID: string) => PerpetualCombinedState | null
  @account.Getter('accountStorageFunc') accountStorageFunc!: (perpetualID: string) => AccountStorage | null
  @account.Getter('marginAccountFunc') marginAccountFunc!: (perpetualID: string) => MarginAccount | null
  @account.Action('updateAccountStorage') updateAccountStorage!: (perpetualID: string) => Promise<void>
  @perpetual.Action('updateLiquidityPool') updateLiquidityPool!: (pool: string) => Promise<void>

  BigNumber = BigNumber
  private pagination = {
    pageSize: 5,
    currentPage: 1,
  }
  private loading: boolean = false
  private withdrawItemStateMap: Map<string, boolean> = new Map<string, boolean>()
  private perpetualIDs: string[] = []
  private loadingMarginBalance: boolean = false
  private loadingPrice: boolean = true
  private marginAccountTokens: string[] = []

  get netLoading() {
    return this.loadingPrice || this.loadingMarginBalance
  }

  get total() {
    return this.tableData.length
  }

  get tableData(): TableItem[] {
    const data: TableItem[] = []
    const withdrawItemStateMap = this.withdrawItemStateMap

    this.marginAccounts.forEach(item => {
      const perpetual = this.getPerpetualFunc(item.perpetualID)
      const accountStorage = this.accountStorageFunc(item.perpetualID)
      const perpetualID = item.perpetualID
      let accountDetails
      try {
        accountDetails = accountStorage && perpetual?.liquidityPoolStorage ? computeAccountDetails(perpetualID, accountStorage, perpetual.liquidityPoolStorage, item) : null
      } catch (e) {
        accountDetails = null
      }
      if (accountDetails && accountDetails.accountComputed.marginBalance.gt(0)) {
        data.push({
          perpetualID: perpetualID,
          underlyingSymbol: perpetual?.perpetualProperty.underlyingAssetSymbol || null,
          collateralAddress: perpetual?.liquidityPoolStorage.collateral || null,
          collateralSymbol: perpetual?.perpetualProperty.collateralTokenSymbol || null,
          withdrawing: withdrawItemStateMap.get(perpetualID) || false,
          perpetualProperty: perpetual?.perpetualProperty || null,
          marginBalance: accountDetails?.accountComputed.marginBalance || null,
          positionAmount: item.position as BigNumber,
          notionalAmount: (item.position as BigNumber).times(perpetual?.perpetualStorage.indexPrice || _0).abs(),
          isInverse: !!perpetual?.perpetualProperty.isInverse,
          liquidityPoolStorage: perpetual?.liquidityPoolStorage || null,
          isEmergency: perpetual?.perpetualStorage.state === PerpetualState.EMERGENCY,
          isCleared: perpetual?.perpetualStorage.state === PerpetualState.CLEARED,
          roe: accountDetails.accountComputed.roe,
          pnl: accountDetails.accountComputed.pnl2,
        })
      }
    })
    return data
  }

  get tableBody(): TableItem[] {
    const start = this.pagination.currentPage * this.pagination.pageSize - this.pagination.pageSize
    const end = start + this.pagination.pageSize
    return this.tableData.slice(start, end)
  }

  get noData(): boolean {
    return this.tableData.length === 0
  }

  get marginBalanceInfo(): TokenInfo[] {
    try {
      this.loadingMarginBalance = true
      const details: TokenInfo[] = []
      this.perpetualIDs.forEach(item => {
        const accountStorage = this.accountStorageFunc(item)
        const marginAccount = this.marginAccountFunc(item)
        const perpetual = this.getPerpetualFunc(item)
        const detail = accountStorage && perpetual?.liquidityPoolStorage ? computeAccountDetails(item, accountStorage, perpetual.liquidityPoolStorage, marginAccount) : null
        if (detail && perpetual) {
          details.push({
            collateral: perpetual.liquidityPoolStorage.collateral.toLowerCase(),
            amount: detail.accountComputed.marginBalance,
          })
        }
      })
      return details
    } catch (e) {
      return []
    } finally {
      this.loadingMarginBalance = false
    }
  }

  showChangeMargin(item: any, operateType = 'deposit') {
    VUE_EVENT_BUS.emit(ACCOUNT_EVENT.CHANGE_MARGIN, { perpetualID: item.perpetualID, type: operateType })
  }

  setWithdrawState(perpetualID: string, state: boolean) {
    this.withdrawItemStateMap.set(perpetualID, state)
    this.withdrawItemStateMap = new Map<string, boolean>(this.withdrawItemStateMap)
  }

  async withdrawBalance(item: TableItem) {
    if (!item.perpetualProperty) {
      return
    }
    const perpetualID = getPerpetualID(item.perpetualProperty.liquidityPoolAddress, item.perpetualProperty.perpetualIndex)
    this.setWithdrawState(perpetualID, true)
    const r = await this.callChainFunc(async () => {
      if (!item.perpetualProperty || !this.signer || !this.address || !item.marginBalance || !item.liquidityPoolStorage) {
        return
      }
      await this.updateAccountStorage(perpetualID)
      const accountStorage = this.accountStorageFunc(perpetualID)
      const marginAccount = this.marginAccountFunc(perpetualID)
      const perpetual = this.getPerpetualFunc(perpetualID)
      const accountDetails = accountStorage && perpetual?.liquidityPoolStorage ? computeAccountDetails(perpetualID, accountStorage, perpetual.liquidityPoolStorage, marginAccount) : null
      if (!accountDetails) {
        return
      }
      return await this.withdraw(item.liquidityPoolStorage, item.perpetualProperty, this.address, accountDetails.accountComputed.marginBalance)
    })
    if (r) {
      await this.callChainReadFunc(async () => {
        await Promise.all([
          this.updatePerpetual(perpetualID),
          this.updateAccountStorage(perpetualID),
        ])
      })
    }
    this.setWithdrawState(perpetualID, false)
  }

  async updatePrice() {
    const tokens = [currentChainConfig.assetAddress, ...this.marginAccountTokens]
    try {
      this.loadingPrice = true
      await this.updateTokenPrice(tokens)
    } finally {
      this.loadingPrice = false
    }
  }

  async loadMarginData() {
    await this.callGraphApiFunc(async () => {
      if (!this.address) {
        return
      }
      const result = await this.callGraphApiFunc(() => {
        return queryMarginAccounts(this.address?.toLowerCase() || '')
      })
      if (!result) {
        return
      }
      const tokens: string[] = []
      result.marginAccounts.forEach(item => {
        this.perpetualIDs.push(item.perpetualID)
        if (item.perpetual && item.perpetual.collateralAddress) {
          tokens.push(item.perpetual.collateralAddress)
        }
      })
      this.marginAccountTokens = tokens
    })
    await this.callChainReadFunc(async () => {
      const promises: Promise<void>[] = []
      const perpetualPromises: Promise<void>[] = []
      this.perpetualIDs.forEach((perpetualID) => {
        const { liquidityPoolAddress } = getPerpetualFromID(perpetualID)
        promises.push(this.updateAccountStorage(perpetualID))
        perpetualPromises.push(this.updateLiquidityPool(liquidityPoolAddress))
      })
      await Promise.all(promises)
      await Promise.all(perpetualPromises)
    })
  }


  @Watch('address', { immediate: true })
  async loadData() {
    this.loading = true
    try {
      await Promise.all([
        this.loadMarginData(),
        this.updateMarginAccounts(),
      ])
      await this.updatePrice()
      this.marginAccounts.forEach(item => {
        this.updatePerpetual(item.perpetualID)
      })
    } catch (e) {
      console.warn(e)
    } finally {
      this.loading = false
    }
  }

  getSideColorClass(position: BigNumber): string {
    if (position.gt(0)) {
      return 'long-side'
    }
    if (position.lt(0)) {
      return 'short-side'
    }
    return ''
  }

  getSideText(position: BigNumber): string {
    if (position.gt(0)) {
      return this.$t('base.long').toString()
    }
    if (position.lt(0)) {
      return this.$t('base.short').toString()
    }
    return ''
  }

  getSideClass(item: TableItem) {
    if (item.positionAmount.isZero()) {
      return []
    }
    return isLongPosition(item.positionAmount, item.isInverse) ? ['is-long'] : ['is-short']
  }

  switchContract(item: TableItem) {
    if (!item.perpetualProperty) {
      return
    }
    this.$router.push({ name: ROUTE.TRADE_MAIN, params: { symbol: item.perpetualProperty.symbolStr } })
  }
}
</script>

<style scoped lang="scss">
@import './wallet.scss';

.margin-account {
  .mc-data-table {
    display: table;
    width: 100%;
    table-layout: fixed;

    tbody td {
      height: 72px;
    }

    thead th,
    tbody td {
      margin: 0 8px;
      padding-left: 16px;

      &:nth-child(1) {
        width: 208px
      }

      &:nth-child(2) {
        width: 212px;
      }

      &:nth-child(3) {
        width: 96px;
      }

      &:nth-child(4) {
        width: 160px;
      }

      &:nth-child(5) {
        width: auto;
      }
    }

    &.is-left {
      text-align: left;
    }

    &.is-right {
      text-align: right;
    }

    td {
      .newline {
        display: flex;
        align-items: center;
      }

      .light-color {
        color: var(--mc-text-color);
      }
    }

    .symbol-row {
      display: flex;
      align-items: center;

      .symbol-box {
        display: inline-flex;
        align-items: center;
        justify-content: flex-start;
        color: var(--mc-text-color-white);
        cursor: pointer;

        .symbol-link {
          margin-left: 8px;

          .click-field {
            font-size: 14px;
            line-height: 22px;
          }

          .symbol {
            font-size: 12px;
            line-height: 22px;
          }
        }
      }
    }

    .cell {
      width: 100%;

      .margin-balance {
        font-size: 14px;
        line-height: 20px;
      }

      .side-box {
        margin-right: 8px;
        font-size: 14px;
        line-height: 22px;

        .long,
        .short {
          display: none;
        }

        &.is-long .long {
          display: inline;
        }

        &.is-short .short {
          display: inline;
        }

        &.is-short {
          color: var(--mc-color-orange);
        }

        &.is-long {
          color: var(--mc-color-blue);
        }
      }

      .unit {
        color: var(--mc-text-color);
      }

      .sub-info {
        font-size: 12px;
        line-height: 22px;
        color: var(--mc-text-color);
      }

      .position-value {
        font-size: 14px;
        line-height: 22px;
      }

      .pnl {
        font-size: 14px;
        line-height: 22px;
      }

      .roe {
        font-size: 12px;
        line-height: 22px;
      }
    }

    i {
      font-size: 16px;
      margin-left: 4px;
    }
  }
}
</style>

<style scoped lang="scss">
.satori-fantasy {
  .inverse-card {
    background: rgb(217, 128, 65, 0.1);
    border: 1px solid rgb(217, 128, 65, 0.1);
  }

  i {
    color: var(--mc-color-primary);
  }
}
</style>
