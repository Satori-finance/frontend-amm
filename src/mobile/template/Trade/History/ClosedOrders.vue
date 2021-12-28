<template>
  <div class="closed-orders">
    <AuthMask v-if="!isValidateFunc() && address" :show-mask="false" />

    <div v-else class="item-container">
      <div class="selector">
        <div class="check-box">
          <van-checkbox v-model="showAllMarket" class="mc-mobile__checkbox">
            {{ $t('filters.allMarkets') }}
            <template #icon="props">
              <div class="selected box" v-if="props.checked">
                <i class="iconfont icon-select"></i>
              </div>
              <div class="un-selected box" v-else></div>
            </template>
          </van-checkbox>
        </div>
        <div class="select-box">
          <div>{{ $t('base.time') }}:</div>
          <McMPopupSelector v-model="timeRange" :options="timeRangeOptions"></McMPopupSelector>
        </div>
      </div>

      <van-list v-model="loadingOrders" @load="loadData" :finished="finished">
        <div v-for="item in tableBody" :key="item.orderHash" class="order-item">
          <div class="head">
            <div class="left">
              <McMTokenPairView :collateral-address="item.perpetualProperty.collateralTokenSymbol" :collateral-icon-size="20"
                                :underlying-symbol="item.perpetualProperty.underlyingAssetSymbol" :size="36"/>
              <div class="symbol-info">
                <div class="line1">{{ item.perpetualProperty.name }}</div>
                <div class="line2">
                  {{ item.perpetualProperty.symbolStr }}
                  <span class="inverse-card" v-if="item.perpetualProperty.isInverse">{{$t('base.inverse') }}</span>
                </div>
              </div>
            </div>
            <div class="right">
              <div class="time">{{ item.createdAt.unix() | timestampFormatter('lll') }}</div>
              <div class="type">
                <span :class="getSideClass(item)">
                  <span class="short">{{ $t('base.short') }} {{ item.perpetualProperty.contractSymbol }}</span>
                  <span class="long">{{ $t('base.long') }} {{ item.perpetualProperty.contractSymbol }}</span>
                </span>
                <span> / {{ getOrderType(item.type) }}</span>
                <span v-if="!item.isCloseOnly"> /
                  <McMTooltip>
                    <div slot="content" v-html="$t('hintInfos.positionsAndOrders.orderLevPrompt')"></div>
                    <span class="leverage">{{ $t('base.isolated') }} {{ item.targetLeverage | bigNumberFormatterByPrecision(2, 2) }}x</span>
                  </McMTooltip>
                </span>
              </div>
            </div>
          </div>
          <div class="infos">
            <van-row>
              <van-col span="9" class="block">
                <div class="data-item">
                  <div class="label">{{ $t('base.limitPrice') }}</div>
                  <div class="value">
                    {{ item.price | priceFormatter(item.perpetualProperty.isInverse) | bigNumberFormatter(item.perpetualProperty.priceFormatDecimals) }}
                  </div>
                </div>
              </van-col>
              <van-col span="9" class="block">
                <div class="data-item">
                  <div class="label">{{ $t('base.executed') }} / {{ $t('base.amount') }}</div>
                  <div class="value">
                    {{ item.confirmedAmount.abs() | bigNumberFormatter(item.perpetualProperty.underlyingAssetFormatDecimals) }}
                    / {{ item.amount.abs() | bigNumberFormatter(item.perpetualProperty.underlyingAssetFormatDecimals) }}
                  </div>
                </div>
              </van-col>
              <van-col span="6" class="block">
                <div class="data-item">
                  <div class="label">{{ $t('base.canceled') }}</div>
                  <div class="value flex-box">
                    <span>{{ item.canceledAmount.abs() | bigNumberFormatter(item.perpetualProperty.underlyingAssetFormatDecimals) }}</span>
                    <span v-if="!item.canceledAmount.eq(0)" @click="showCancelDetail(item)"><i class="iconfont icon-right2"></i></span>
                  </div>
                </div>
              </van-col>
            </van-row>
            <van-row>
              <van-col span="9" class="block">
                <div class="data-item">
                  <div class="label">{{ $t('base.status') }}</div>
                  <div class="value" :class="getOrderStatusClass(item.status)">
                    {{ getOrderStatus(item.status) }}
                  </div>
                </div>
              </van-col>
              <van-col span="9" class="block">
                <div class="data-item">
                  <div class="label">{{ $t('base.closeOnly') }}</div>
                  <div class="value">
                    {{ item.isCloseOnly ? $t('base.true') : $t('base.false') }}
                  </div>
                </div>
              </van-col>
              <van-col span="6" class="block" v-if="item.type !== 1">
                <div class="data-item">
                  <div class="label">{{ $t('base.triggerPrice') }}</div>
                  <div class="value">
                    {{ item.triggerPrice | priceFormatter(item.perpetualProperty.isInverse) | bigNumberFormatter(item.perpetualProperty.priceFormatDecimals) }}
                  </div>
                </div>
              </van-col>
            </van-row>
          </div>
        </div>

        <template slot="loading">
          <img class="fantasy-loading" src="@/assets/img/satori-fantasy/loading.svg" alt="">
        </template>

        <template slot="finished">
          <div v-if="noData" class="empty-container">
            <McMNoData />
          </div>
          <span v-else>{{ $t('base.noMore') }}</span>
        </template>
      </van-list>
    </div>
    <CancelDetailPopup :visible.sync="showCancelDetailPopup" :order-item="currentOrderData" />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import { McMNoData, McMTokenPairView, McMPopupSelector, McMTooltip } from '@/mobile/components'
import OrderHistoryMixin, { TableData } from '@/template/components/Order/orderHistoryMixin'
import { WS_ORDER_TYPE } from '@/ts'
import { AuthMask } from '@/mobile/business-components'
import { PNNumber } from '@/components'
import CancelDetailPopup from '@/mobile/template/Trade/History/CancelDetailPopup.vue'
import moment from 'moment'
import { namespace } from 'vuex-class'

const activePerpetuals = namespace('activePerpetuals')

@Component({
  components: {
    McMNoData,
    AuthMask,
    McMTokenPairView,
    PNNumber,
    CancelDetailPopup,
    McMPopupSelector,
    McMTooltip,
  },
})
export default class ClosedOrders extends Mixins(OrderHistoryMixin) {

  @activePerpetuals.State('selectedPerpetualID') selectedPerpetualID!: string | null

  private loadingOrders = false
  private showCancelDetailPopup: boolean = false
  private currentOrderData: TableData | null = null
  private timeRange = '1d'
  private showAllMarket = true

  get timeRangeOptions() {
    return [
      { value: '1d', label: this.$t('timeRange.1d').toString() },
      { value: '1w', label: this.$t('timeRange.1w').toString() },
      { value: '1M', label: this.$t('timeRange.1m').toString() },
      { value: '3M', label: this.$t('timeRange.3m').toString() },
    ]
  }

  get finished() {
    return this.noMore || !this.isValidateFunc()
  }

  async loadData() {
    await this.debounceLoad()
    this.loadingOrders = false
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

  showCancelDetail(item: TableData) {
    if (item.canceledAmount.toString() === '0') {
      return
    }
    this.currentOrderData = item
    this.showCancelDetailPopup = true
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
.closed-orders {
  .selector {
    display: flex;
    align-items: center;
    padding: 10px 16px;
    border-bottom: 1px solid #1A2136;

    .check-box {
      ::v-deep .van-checkbox__label {
        font-size: 14px;
        line-height: 20px;
      }
    }

    .select-box {
      display: flex;
      align-items: center;
      font-size: 14px;
      line-height: 20px;
      color: var(--mc-text-color);
      margin-left: 32px;
    }

    ::v-deep .mc-mobile-select {
      width: auto;

      .selector {
        background: transparent;
        width: auto;
        height: 20px;
        padding: 0;

        .left-value {
          color: var(--mc-text-color);
          font-size: 14px;
          line-height: 20px;
        }

        .icon-drop-down {
          font-size: 12px;
          margin-left: 6.5px;
        }
      }
    }
  }

  ::v-deep .van-list {
    height: calc(100vh - 166px);
    overflow: scroll;
    padding: 0 16px;

    .van-list__finished-text {
      line-height: 20px;
      margin: 16px 0;
      color: var(--mc-text-color);
    }
  }

  .data-box {
    height: calc(100% - 50px);
    overflow: scroll;
  }

  .order-item {
    padding: 16px 0;
    border-bottom: 1px solid #1A2136;

    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .left {
        display: flex;
        align-items: center;

        .symbol-info {
          margin-left: 8px;
          font-size: 12px;

          .line1 {
            color: var(--mc-text-color-white);
            line-height: 22px;
          }

          .line2 {
            color: var(--mc-text-color);
            line-height: 22px;
          }
        }
      }

      .right {
        text-align: right;

        .time {
          font-size: 12px;
          line-height: 22px;
          color: var(--mc-text-color);
        }

        .type {
          font-size: 12px;
          line-height: 22px;

          .is-long {
            color: var(--mc-color-blue);

            .long {
              display: inline-block;
            }
          }

          .is-short {
            color: var(--mc-color-orange);

            .short {
              display: inline-block;
            }
          }

          .short,
          .long {
            display: none;
          }

          .close-item {
            .long,
            .short {
              text-decoration-line: line-through;
            }
          }
        }
      }
    }

    .infos {
      margin-top: 12px;

      .van-row {
        margin-bottom: 12px;

        .block:nth-child(3) {
          text-align: right;
        }

        &:last-child {
          margin-bottom: 0;
        }
      }

      .data-item {
        font-size: 12px;
        line-height: 16px;
        display: inline-block;

        &:not(:last-of-type) {
          margin-bottom: 8px;
        }

        .label {
          color: var(--mc-text-color);
          margin-bottom: 4px;
        }

        .value {
          .text {
            margin-right: 4px;
            color: var(--mc-text-color);
          }

          .icon-right2 {
            font-size: 12px;
            margin-left: 4px;
            color: var(--mc-text-color);
          }

          .amount {
            color: var(--mc-text-color);
            font-size: 10px;
            line-height: 11px;
          }
        }

        .flex-box {
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }

        .danger {
          color: var(--mc-color-warning);
        }

        .success {
          color: var(--mc-color-success);
        }
      }
    }
  }
  .amount {
    color: var(--mc-text-color);
    font-size: 10px;
    line-height: 11px;
  }
}

.fantasy-loading {
  display: inline-block;
  animation: 2s linear infinite svg-animation;
  max-width: 100px;
}

@keyframes svg-animation {
  0% {
    transform: rotateZ(0deg);
  }
  100% {
    transform: rotateZ(360deg);
  }
}

.empty-container {
  padding: 30vh 0;
}
</style>
