<template>
  <div class="place-order-adapter">
    <div class="layout-item head">
      <div class="select-tabs">
        <McTabs v-model="orderTypeSelectedOption" :tabs="orderTypeOption"></McTabs>
      </div>
    </div>
    <div class="trade-panel-container">
      <TradeAccountInfo/>
      <div class="layout-item">
        <McRadioBevelTabs
          v-model="orderSideSelectedOption"
          :class="[orderSideSelectedOption]"
          :options="[
            {label: $t('placeOrder.sideSelector.buy'), value: ORDER_SIDE.Buy},
            {label: $t('placeOrder.sideSelector.sell'), value: ORDER_SIDE.Sell},
          ]"
        ></McRadioBevelTabs>
      </div>
      <div class="layout-item">
        <OrderTrade :prop-order-side="orderSideSelectedOption" :prop-order-type="orderTypeSelectedOption"/>
      </div>
    </div>
  </div>
</template>

<script lang='ts'>
import { Vue, Component } from 'vue-property-decorator'
import { ORDER_SIDE, ORDER_TYPE } from '@/ts/types'
import OrderTrade from './OrderTrade.vue'
import { McTabs, McRadioBevelTabs } from '@/components'
import TradeAccountInfo from './TradeAccountInfo.vue'

@Component({
  components: {
    OrderTrade,
    McTabs,
    TradeAccountInfo,
    McRadioBevelTabs,
  },
})
export default class PlaceOrderAdapter extends Vue {

  private ORDER_SIDE = ORDER_SIDE
  private orderSideSelectedOption = ORDER_SIDE.Buy
  private orderTypeSelectedOption = ORDER_TYPE.MarketOrder

  get orderTypeOption(): Array<{ label: string, value: string }> {
    return [
      { label: this.$t('placeOrder.orderTypeSelect.market').toString(), value: ORDER_TYPE.MarketOrder },
      { label: this.$t('placeOrder.orderTypeSelect.limit').toString(), value: ORDER_TYPE.LimitOrder },
      { label: this.$t('placeOrder.orderTypeSelect.stopLimit').toString(), value: ORDER_TYPE.StopLimitOrder },
    ]
  }
}
</script>

<style lang="scss" scoped>
.place-order-adapter {

  .trade-panel-container {
    padding: 0 16px 0 16px;
  }

  .layout-item {
    padding-bottom: 16px;

    &:last-child {
      padding-bottom: 0;
    }

    .mc-radio-bevel-tabs {
      &.buy ::v-deep .radio-item.active {
        color: var(--mc-color-blue);
      }

      &.sell ::v-deep .radio-item.active {
        color: var(--mc-color-orange);
      }
    }
  }

  .select-tabs {
    ::v-deep {
      .mc-tabs {
        border-bottom: 1px solid var(--mc-background-color-light);
        height: 48px;
        line-height: 48px;

        .select-bar {
          margin-top: -2.77px !important;
        }
      }
    }
  }

  ::v-deep .el-radio-group {
    width: 100%;

    .el-radio-button {
      width: 50%;
    }

    .el-radio-button__inner {
      width: 100%;
    }

    .el-radio-button--medium {
      .el-radio-button__inner {
        font-size: 13px;
      }
    }
  }
}
</style>
