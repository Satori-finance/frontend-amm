<template>
  <div class="cancel-detail scroll-container">
    <BackNavBar :title="$t('cancelDetail.title')"></BackNavBar>
    <div class="info-display" v-if="orderItem !== null">
      <div class="head">
        <div class="perpetual-status">
          <span>{{ `${orderItem.perpetualProperty.symbolStr} ${orderItem.perpetualProperty.name}` }}</span>
          <span class="inverse-card" v-if="orderItem.perpetualProperty.isInverse">{{ $t('base.inverse') }}</span>
        </div>
        <div class="order-status">
          <span class="type">
            <span :class="getSideClass(orderItem)">
              <span class="short">{{ $t('base.short') }}</span>
              <span class="long">{{ $t('base.long') }}</span>
              <span> {{ orderItem.perpetualProperty.contractSymbol }}</span>
            </span>
            <span> / {{ getOrderType(orderItem.type) }}</span>
          </span>
        </div>
      </div>
      <div class="content-container">
        <van-list @load="loadData" :finished="finished">
          <div v-for="(item, index) in orderItem.cancelReasons" :key="index" class="item-container">
            <van-row>
              <van-col span="12" class="block">
                <div class="label">{{ $t('cancelDetail.amount') }}</div>
                <div class="value">
                  {{
                    item.amount.abs() | bigNumberFormatter(orderItem.perpetualProperty.underlyingAssetFormatDecimals)
                  }}
                </div>
              </van-col>
              <van-col span="12" class="block">
                <div class="label">{{ $t('cancelDetail.reason') }}</div>
                <div class="value">{{ $t(getCancelReason(item.reason)) }}</div>
              </van-col>
            </van-row>
            <div class="time">
              <span>{{ item.canceledAt.unix() | timestampFormatter('lll') }}</span>
            </div>
          </div>
        </van-list>
      </div>
    </div>
    <div v-if="orderItem == null" class="empty-container">
      <McMNoData />
    </div>
  </div>
</template>

<script lang="ts">
import BackNavBar from '@/mobile/template/Header/BackNavBar.vue'
import { Component, Prop, Mixins } from 'vue-property-decorator'
import { McMNoData } from '@/mobile/components'
import OrderHistoryMixin, { TableData } from '@/template/components/Order/orderHistoryMixin'
import { WS_ORDER_TYPE } from '@/ts'

@Component({
  components: {
    BackNavBar,
    OrderHistoryMixin,
    McMNoData,
  },
})
export default class CancelDetail extends Mixins(OrderHistoryMixin) {
  @Prop({ required: true, default: null }) orderItem!: TableData | null

  getCancelReason(val: string) {
    const output = 'cancelDetail.' + val
    return this.$t(output)
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
}
</script>

<style lang="scss" scoped>
.cancel-detail {
  background-color: var(--mc-background-color-dark);
  display: flex;

  .info-display {
    overflow-y: scroll;
    height: 100%;
    .head {
      text-align: center;
      background-color: var(--mc-background-color-dark);

      .perpetual-status {
        padding-top: 16px;
        padding-bottom: 8px;
        font-size: 20px;
        line-height: 23px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .order-status {
        font-size: 14px;
        line-height: 16px;
        color: var(--mc-text-color-light);
        padding-bottom: 16px;
      }
    }

    .content-container {
      border-radius: 24px 24px 0 0;
      padding: 16px;
      height: calc(100vh - 123px);
      background-color: var(--mc-background-color);
      overflow-y: scroll;

      .item-container {
        border-bottom: 1px solid var(--mc-border-color);

        .block:nth-child(odd) {
          text-align: left;
        }
        .block:nth-child(even) {
          text-align: right;
        }
        .block {
          font-size: 14px;
          line-height: 16px;

          .label {
            color: var(--mc-text-color);
            margin-bottom: 4px;
          }
        }

        .time {
          color: var(--mc-text-color);
          margin-top: 12px;
          margin-bottom: 16px;
          font-size: 14px;
          line-height: 16px;
        }
      }
    }
  }
}
.type {
  color: var(--mc-text-color-white);

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
}

.empty-container {
  padding: 120px 0;
}
</style>
