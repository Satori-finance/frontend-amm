<template>
  <McLoading :show-loading="reloading" :margin="8" :hide-content="noData">
    <div class="orders position-order-common-container scroll">
      <div class="filter-box">
        <div class="left">
          <el-checkbox v-model="showAllMarket">{{ $t('filters.allMarkets') }}</el-checkbox>
          <McSimpleTimeRange v-model="timeRange" :options="timeRangeOptions"/>
        </div>
        <div class="right"></div>
      </div>
      <div class="table-box" ref="orderContainer" v-fixed-table>
        <table class="mc-data-table is-small fixed-table"
               :class="{ 'no-data-table': userAddress && isValidateFunc() && noData }">
          <thead>
          <tr>
            <th class="is-left">
              <span>{{ $t('base.time') }}</span>
            </th>
            <th class="is-left symbol-row">
              <span>{{ $t('base.contract') }}</span>
            </th>
            <th class="is-left">
              <span>{{ $t('base.side') }}</span>
            </th>
            <th class="is-left">
              <span>{{ $t('base.type') }}</span>
            </th>
            <th class="is-left">
              <span>{{ $t('base.limitPrice') }}</span>
            </th>
            <th class="is-left">
              <el-tooltip :content="$t('hintInfos.positionsAndOrders.orderLevPrompt')" placement="top"
                          :open-delay="400">
                <span>{{ $t('base.lev') }}</span>
              </el-tooltip>
            </th>
            <th class="is-left">
              <span>{{ $t('base.amount') }}</span>
            </th>
            <th class="is-left">
              <span>{{ $t('base.executed') }}</span>
            </th>
            <th class="is-left">
              <span>{{ $t('base.status') }}</span>
            </th>
            <th class="is-left">
              <span>{{ $t('base.canceled') }}</span>
            </th>
            <th class="is-left">
              <span>{{ $t('base.closeOnly') }}</span>
            </th>
            <th class="is-right">
              <span>{{ $t('base.triggerPrice') }}</span>
            </th>
          </tr>
          </thead>
          <tbody v-if="userAddress && isValidateFunc()">
          <tr v-if="noData && !loading && !reloading">
            <td colspan="100">
              <McNoData></McNoData>
            </td>
          </tr>
          <tr v-for="(item, index) in tableBody" :key="index">
            <td class="is-left">
              <div class="cell">
                {{ item.createdAt.unix() | i18nTimeFormatter($i18n.locale, 'day') }}
                <span class="newline">
                    {{ item.createdAt.unix() | i18nTimeFormatter($i18n.locale, 'time') }}
                  </span>
              </div>
            </td>
            <td class="is-left symbol-row">
                <span class="cell symbol-box">
                  <span>
                    <McTokenPairView :underlyingSymbol="item.underlyingSymbol"
                                     :collateralAddress="item.collateralAddress" :size="36"/>
                  </span>
                  <span class="value symbol-link more-line">
                    <span>{{ `${item.perpetualProperty.name}` }}</span>
                    <span class="newline light-color" @click="switchContract(item.perpetualProperty)">
                      {{ `${item.perpetualProperty.symbolStr}` }}
                      <span class="inverse-card" v-if="item.perpetualProperty.isInverse">{{ $t('base.inverse') }}</span>
                    </span>
                  </span>
                </span>
            </td>
            <td class="is-left">
              <div class="cell">
                <div class="up" :class="getSideClass(item)">
                  <span class="short">{{ $t('base.short') }}</span>
                  <span class="long">{{ $t('base.long') }}</span>
                </div>
                <span class="down contractSymbol" v-if="item.perpetualProperty">{{
                    item.perpetualProperty.contractSymbol
                  }}</span>
              </div>
            </td>
            <td class="is-left">
              <div class="cell">
                <span>{{ getOrderType(item.type) }}</span>
              </div>
            </td>
            <td class="is-left">
              <div class="cell">
                  <span>{{
                      item.price
                        | priceFormatter(item.perpetualProperty.isInverse)
                        | bigNumberFormatter(item.perpetualProperty.priceFormatDecimals)
                    }}</span>
              </div>
            </td>
            <td class="is-left">
              <div class="cell">
                <span v-if="!item.isCloseOnly">{{
                    item.targetLeverage | bigNumberFormatterTruncateByPrecision(2,2)
                  }}x</span>
              </div>
            </td>
            <td class="is-left">
              <div class="cell">
                  <span>{{
                      item.amount.abs() | bigNumberFormatter(item.perpetualProperty.underlyingAssetFormatDecimals)
                    }}</span>
              </div>
            </td>
            <td class="is-left">
              <div class="cell">
                  <span>{{
                      item.confirmedAmount.abs()
                        | bigNumberFormatter(item.perpetualProperty.underlyingAssetFormatDecimals)
                    }}</span>
              </div>
            </td>
            <td class="is-left">
              <div class="cell icon-number">
                <span :class="getOrderStatusClass(item.status)">{{ getOrderStatus(item.status) }}</span>
              </div>
            </td>
            <td class="is-left">
              <div class="cell icon-number" v-if="item.canceledAmount.abs() > 0">
                  <span>{{
                      item.canceledAmount.abs()
                        | bigNumberFormatter(item.perpetualProperty.underlyingAssetFormatDecimals)
                    }}
                    {{ item.perpetualProperty.underlyingAssetSymbol }}
                  </span>
                <a
                  @click="showCancelDetail(item.cancelReasons, item.perpetualProperty.underlyingAssetFormatDecimals, item.perpetualProperty.underlyingAssetSymbol)">
                  <i class="iconfont icon-more-frame-round"></i>
                </a>
              </div>
              <div v-else class="cell">
                <span>0.0 {{ item.perpetualProperty.underlyingAssetSymbol }}</span>
              </div>
            </td>
            <td class="is-left">
              <div class="cell">
                <span>{{ item.isCloseOnly ? $t('base.true') : $t('base.false') }}</span>
              </div>
            </td>
            <td class="is-right">
              <div class="cell" v-if="item.type !== 1">
                  <span>{{
                      item.triggerPrice
                        | priceFormatter(item.perpetualProperty.isInverse)
                        | bigNumberFormatter(item.perpetualProperty.priceFormatDecimals)
                    }}</span>
              </div>
            </td>
          </tr>
          <tr v-show="!noData" class="load-more-box">
            <td v-if="loading && !reloading"><McLoadingIcon :height="22"></McLoadingIcon></td>
            <td v-else-if="noMore" class="no-more">{{ $t('base.noMore') }}</td>
            <td v-else @click="load" class="load-more">
              {{ $t('base.loadMoreEntries', {pageSize: pageSize}) }}
            </td>
          </tr>
          </tbody>
        </table>
        <CancelDetailDialog :visible.sync="isShowReasonDialog" :activeCancelReason="activeCancelReason"
                            :amountFormatDecimals="amountFormatDecimals" :underlyingAssetSymbol="underlyingSymbol"/>
      </div>

      <AuthMask v-if="!isValidateFunc() && userAddress" :show-mask="false"></AuthMask>
      <ConnectWalletMask v-if="!userAddress" :show-mask="false"></ConnectWalletMask>
    </div>
  </McLoading>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import { McSimpleTimeRange, McNoData, McLoading, McTokenPairView, McLoadingIcon } from '@/components'
import AuthMask from '@/business-components/AuthMask.vue'
import ConnectWalletMask from '@/business-components/ConnectWalletMask.vue'
import { namespace } from 'vuex-class'
import { isDangerPerpetual } from '@/utils'
import { WS_ORDER_TYPE } from '@/ts'
import OrderHistoryMixin from '@/template/components/Order/orderHistoryMixin'
import moment from 'moment'
import CancelDetailDialog from '@/template/Dialogs/CancelDetailDialog.vue'
import { OrderCancelReason } from '@/type/validatable/orderStruct'

const wallet = namespace('wallet')
const activePerpetuals = namespace('activePerpetuals')
const auth = namespace('auth')
@Component({
  components: {
    McSimpleTimeRange,
    AuthMask,
    ConnectWalletMask,
    McNoData,
    McLoading,
    CancelDetailDialog,
    McTokenPairView,
    McLoadingIcon,
  },
})
export default class OrderHistory extends Mixins(OrderHistoryMixin) {
  @wallet.Getter('address') userAddress!: string | null
  @activePerpetuals.State('selectedPerpetualID') selectedPerpetualID!: string | null
  private timeRange = '1d'
  private showAllMarket = true
  private isDangerPerpetual = isDangerPerpetual
  private isShowReasonDialog: boolean = false
  private activeCancelReason: Array<OrderCancelReason> = []
  private amountFormatDecimals: number = 0
  private underlyingSymbol: string = ''

  get disableLoadData() {
    return this.disableInfiniteScroll || !this.selectedPerpetualID
  }

  get timeRangeOptions() {
    return [
      { key: '1d', label: this.$t('timeRange.1d').toString() },
      { key: '1w', label: this.$t('timeRange.1w').toString() },
      { key: '1M', label: this.$t('timeRange.1m').toString() },
      { key: '3M', label: this.$t('timeRange.3m').toString() },
    ]
  }

  showCancelDetail(reasons: Array<OrderCancelReason>, amount: number, symbol: string) {
    this.activeCancelReason = reasons
    this.amountFormatDecimals = amount
    this.underlyingSymbol = symbol
    this.isShowReasonDialog = true
  }

  getOrderType(val: WS_ORDER_TYPE) {
    switch (val) {
      case WS_ORDER_TYPE.LimitOrder:
        return this.$t('order.limitOrder')
      case WS_ORDER_TYPE.StopLimitOrder:
        return this.$t('order.stopLimitOrder')
      default:
        return ''
    }
  }

  @Watch('selectedPerpetualID')
  @Watch('showAllMarket')
  handlerFilterContract() {
    if (!this.showAllMarket) {
      this.filters.contract = this.selectedPerpetualID || ''
    } else {
      this.filters.contract = ''
    }
  }

  @Watch('timeRange', { immediate: true })
  private onTimeRangeChange() {
    const now = moment.utc()
    let start = null
    switch (this.timeRange) {
      case '1d':
        start = now.subtract(1, 'd')
        break
      case '1w':
        start = now.subtract(1, 'w')
        break
      case '1M':
        start = now.subtract(1, 'M')
        break
      case '3M':
        start = now.subtract(3, 'M')
        break
    }
    this.filters.startDate = start?.unix() || null
  }
}
</script>

<style lang="scss" scoped>
@import './positionsAndOrders.scss';
</style>

<style lang="scss" scoped>
@import 'filterBox';

.mc-loading {
  height: 100%;
}

.loading {
  height: 24px;
  text-align: center;
  color: var(--mc-text-color);
  padding-bottom: 8px;
}

.symbol-row {
  .symbol-box {
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    color: var(--mc-text-color-white);
    cursor: pointer;

    .symbol-link {
      margin-left: 8px;
    }
  }
}

.table-box {
  flex: 1;
  overflow-y: auto;

  td {
    height: 60px;
    line-height: 22px;

    .newline {
      display: flex;
      align-items: center;
    }
  }

  .cell {
    .down {
      display: block;
    }
  }

  .mc-data-table {
    width: 100%;

    thead th,
    tbody td {
      margin: 0 8px;

      &:nth-child(1) {
        width: 6%;
      }

      &:nth-child(2) {
        width: 12%;
      }

      &:nth-child(3) {
        width: 4%;
      }

      &:nth-child(4) {
        width: 5%;
      }

      &:nth-child(5) {
        width: 7%;
      }

      &:nth-child(6) {
        width: 4%;
      }

      &:nth-child(7) {
        width: 10%;
      }

      &:nth-child(8) {
        width: 7%;
      }

      &:nth-child(9) {
        width: 10%;
      }

      &:nth-child(10) {
        width: 8%;
      }

      &:nth-child(11) {
        width: 6%;
      }

      &:nth-child(12) {
        width: 10%;
        padding-right: 8px;
      }
    }

    tr.load-more-box {
      height: 52px;
      display: flex;
      justify-content: center;
      align-items: center;

      &:hover {
        background: transparent;
      }

      td {
        width: auto;
        height: auto;
        font-size: 14px;
        line-height: 20px;
      }

      .load-more {
        color: var(--mc-color-primary);

        &:hover {
          cursor: pointer;
          text-decoration: underline;
        }
      }

      .no-more {
        color: var(--mc-text-color);
      }
    }
  }

  .symbol-link {
    cursor: pointer;
    color: var(--mc-text-color);
  }

  .contractSymbol {
    color: var(--mc-text-color);
  }
}

.auth-mask {
  top: 71px;
}

.is-long .long {
  display: inline-block;
}

a {
  cursor: pointer;
  margin-left: 4px;
}

.up {
  font-size: 12px;
}

.blow {
  font-size: 12px;
  color: #999897;
}

.is-short .short {
  display: inline-block;
}

.short {
  display: none;
  color: var(--mc-color-orange);
}

.long {
  display: none;
  color: var(--mc-color-blue);
}

.icon-number {
  display: flex;

  .icon-more-frame-round {
    cursor: pointer;
    font-size: 16px;
    color: var(--mc-color-primary);
  }
}

.danger {
  color: var(--mc-color-warning);
}

.success {
  color: var(--mc-color-success);
}
</style>

<style lang="scss" scoped>
@import '~@mcdex/style/common/fantasy-var';

.satori-fantasy {
  .active {
    color: var(--mc-color-primary);
    background: var(--mc-background-color);
  }

  .inverse-card {
    background: rgb(217, 128, 65, 0.1);
    border: 1px solid rgb(217, 128, 65, 0.1);
  }
}
</style>
