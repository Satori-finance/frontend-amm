<template>
  <div class="orders">
    <AuthMask v-if="!isValidateFunc() && userAddress" :show-mask="false"></AuthMask>
    <McMLoading v-else :loading="reloading">
      <div class="order-list" v-if="!noData">
        <div class="order-item header-button">
          <van-button size="mini" class="cancel-button" @click="cancelAllOrder">{{ $t('base.cancelAll') }}</van-button>
          <div class="divider"></div>
        </div>
        <div class="order-item" v-for="item in tableBody" :key="item.orderHash">
          <div class="head">
            <div class="symbol-link" @click="switchContract(item.perpetualProperty)">
              <McMTokenPairView :collateral-address="item.collateralAddress" :underlying-icon-size="28"
                                :underlying-symbol="item.underlyingSymbol" :size="34"/>
              <div class="symbol-info">
                <div class="line1">{{ item.perpetualProperty.name }}</div>
                <div class="line2">
                  {{ item.perpetualProperty.symbolStr }} <span class="inverse-card" v-if="item.perpetualProperty.isInverse">{{
                    $t('base.inverse')
                  }}</span>
                </div>
              </div>
            </div>
            <div class="right-info">
              <div class="time">{{ item.createdAt.unix() | timestampFormatter('lll') }}</div>
              <McMTooltip v-if="!item.isCloseOnly">
                <div slot="content" v-html="$t('hintInfos.positionsAndOrders.orderLevPrompt')"></div>
                <span class="leverage">{{ $t('base.isolated') }} {{ item.targetLeverage | bigNumberFormatterTruncateByPrecision(2, 2) }}x</span>
              </McMTooltip>
            </div>
          </div>
          <div class="type">
            <span :class="getSideClass(item)">
              <span>{{ getOrderType(item.type) }}</span>
              /
              <span class="short">{{ $t('base.short') }}</span>
              <span class="long">{{ $t('base.long') }}</span>
            </span>
          </div>
          <div class="info">
            <div class="fill-rate">
              <van-circle
                layer-color="#373F5C"
                stroke-width="125"
                :class="[getIsLong(item)?'is-long':'is-short']"
                :style="{color: getIsLong(item) ? '#00D8E2' : '#D98041'}"
                :color="getIsLong(item) ? '#00D8E2' : '#D98041'"
                :value="getConfirmedRate(item.confirmedRate)"
                :size="36"
                :speed="100"
                :text="`${getConfirmedRate(item.confirmedRate)}%`"/>
            </div>
            <div class="data">
              <div class="data-item">
                <div class="label">{{ $t('base.amount') }}</div>
                <div class="value">
                  <span>{{
                      item.confirmedAmount.abs() | bigNumberFormatter(item.perpetualProperty.underlyingAssetFormatDecimals)
                    }}</span>
                  <span class="amount">
                    /
                    {{
                      item.amount.abs() | bigNumberFormatter(item.perpetualProperty.underlyingAssetFormatDecimals)
                    }} {{ item.perpetualProperty.underlyingAssetSymbol }}</span>
                </div>
              </div>
              <div class="data-item" v-if="item.canceledAmount.gt(0)">
                <div class="label">{{ $t('base.canceled') }}</div>
                <div class="value" @click="showCancelDetail(item)">
                  <span>
                    {{item.canceledAmount | bigNumberFormatter(item.perpetualProperty.underlyingAssetFormatDecimals) }}
                    {{ item.perpetualProperty.priceSymbol }}
                  </span>
                  <i class="iconfont icon-vector-stroke"></i>
                </div>
              </div>
              <div class="data-item">
                <div class="label">{{ $t('base.limitPrice') }}</div>
                <div class="value">
                  <span>{{
                      item.price | priceFormatter(item.perpetualProperty.isInverse) | bigNumberFormatter(item.perpetualProperty.priceFormatDecimals)
                    }} {{ item.perpetualProperty.priceSymbol }}</span>
                </div>
              </div>
              <div class="data-item" v-if="!item.triggerPrice.isZero()">
                <div class="label">{{ $t('base.triggerPrice') }}</div>
                <div class="value">
                  <span>{{ getIsLong(item) ? '≤' : '≥' }}{{
                      item.triggerPrice | priceFormatter(item.perpetualProperty.isInverse) | bigNumberFormatter(item.perpetualProperty.priceFormatDecimals)
                    }}</span>
                </div>
              </div>
              <div class="data-item" v-if="item.isCloseOnly">
                <div class="label">{{ $t('base.closeOnly') }}</div>
                <div class="value">{{ $t('base.true') }}</div>
              </div>
            </div>
            <div class="action">
              <van-button size="mini" class="cancel-button-large" :disabled="cancelingOrder && cancelingOrder.orderHash === item.orderHash"
                          @click="cancelOrder(item)">{{ $t('base.cancel') }}
              </van-button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-container">
        <McMNoData/>
      </div>
    </McMLoading>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { AuthMask } from '@/mobile/business-components'
import { PerpetualProperty } from '@/type'
import { ROUTE } from '@/mobile/router'
import OrdersMixin from '@/template/components/Order/ordersMixin'
import { McMNoData, McMTokenPairView, McMLoading, McMTooltip } from '@/mobile/components'
import BigNumber from 'bignumber.js'
import { TableData } from '@/template/components/Order/orderHistoryMixin'

@Component({
  components: {
    AuthMask,
    McMNoData,
    McMLoading,
    McMTokenPairView,
    McMTooltip,
  },
})
export default class Orders extends Mixins(OrdersMixin) {

  switchContract(item: PerpetualProperty | null) {
    if (!item) {
      return
    }
    if (this.$route.name === ROUTE.TRADE_MAIN && this.$route.params.symbol === item.symbolStr) {
      return
    }
    this.$router.push({ name: ROUTE.TRADE_MAIN, params: { symbol: item.symbolStr } })
  }

  getConfirmedRate(confirmRate: BigNumber) {
    return confirmRate.dp(0).toNumber()
  }

  showCancelDetail(item: TableData) {
    this.$router.push({
      name: ROUTE.CANCEL_DETAIL,
      params: {
        orderItem: item as any,
      },
    })
  }
}
</script>

<style lang="scss" scoped>
.orders {
  position: relative;
  min-height: 50px;

  .order-list {
    .order-item {
      position: relative;
      padding-bottom: 16px;
      box-shadow: inset 0px -1px 0px #1A2136;

      &:not(:last-of-type) {
        margin-bottom: 16px;
      }

      &:first-of-type {
        box-shadow: unset;
      }

      .divider {
        position: absolute;
        left: -16px;
        right: -16px;
        bottom: 0;
        margin: 0;
        border-bottom: 1px solid #1A2136;
      }

      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .symbol-link {
          display: flex;
          align-items: center;

          .symbol-info {
            margin-left: 8px;
            font-size: 12px;

            .line1 {
              color: var(--mc-text-color-white);
              line-height: 22px;
              height: 22px;
            }

            .line2 {
              color: var(--mc-text-color);
              line-height: 22px;
              height: 22px;
            }
          }
        }

        .right-info {
          font-size: 12px;
          line-height: 22px;
          text-align: right;
          .time {
            color: var(--mc-text-color);
          }
          .leverage {
            text-align: right;
          }
        }
      }

      .type {
        font-size: 12px;
        line-height: 16px;
        margin-top: 12px;
        margin-bottom: 8px;

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

        .short, .long {
          display: none;
        }
      }

      .info {
        display: flex;
        align-items: flex-start;

        .fill-rate {
          padding: 0 24px 0 10px;

          ::v-deep {
            .is-long {
              .van-circle__text {
                color: var(--mc-color-blue);
              }
            }

            .is-short {
              .van-circle__text{
                color: var(--mc-color-orange);
              }
            }
          }

          ::v-deep .van-circle__text {
            font-size: 10px;
            line-height: 11px;
          }
        }

        .data {
          flex: 1;

          .data-item {
            font-size: 12px;
            line-height: 16px;
            height: 14px;
            display: flex;
            align-items: center;

            &:not(:last-of-type) {
              margin-bottom: 8px;
            }

            .label {
              color: var(--mc-text-color);
              flex: 2.1;
            }

            .value {
              flex: 3;

              .amount {
                font-size: 12px;
                line-height: 16px;
              }
            }
          }
        }

        .action {
          padding-left: 16px;
          align-self: flex-end;
        }
      }
    }
  }

  .header-button {
    text-align: right;
    padding-bottom: 8px !important;
    padding-top: 8px;
    height: 40px;
    line-height: 0;
  }

  .cancel-button {
    font-size: 12px;
    padding: 0 8px;
    height: 24px;
    background: var(--mc-background-color);
    border-radius: var(--mc-border-radius-m);
  }

  .cancel-button-large {
    font-size: 12px;
    padding: 0 16px;
    height: 32px;
    background: var(--mc-background-color);
    border-radius: var(--mc-border-radius-m);
  }

  .icon-vector-stroke {
    color: var(--mc-text-color);
    font-size: 12px;
  }

  .empty-container {
    padding: 32px 0 32px 0;
  }
}
</style>
