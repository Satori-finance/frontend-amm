<template>
  <div class="amm-depth-table">
    <div
      class="amm-depth-item"
      ref="table"
      v-for="(info, index) in renderTableBody"
      :key="index"
      :style="{height: rowHeight + 'px'}"
    >
      <div class="total">
        <div
          class="total-bar"
          :class="side"
          :style="[{width: `${(maxTotal.gt(0) && renderTotals[index].div(maxTotal).times(100).toNumber()) || 0}%`}]"
        ></div>
      </div>
      <div class="price">
        <transition name="fade">
          <i class="active-price-point" v-if="activeOrderPrices[info.price]"></i>
        </transition>
        <span class="price" :class="side" @click="onSetLimitPrice(info.price, info.total)">{{
            info.price.toFormat(priceFormatDecimals, priceRoundMode)
          }}</span>
      </div>
      <div class="amount">
        <AnimatedBigNumber
          style="display: inline-block;"
          :amountFormatDecimals="amountFormatDecimals"
          :amountRoundMode="amountRoundMode"
          :value="info.amount.dp(amountFormatDecimals, amountRoundMode)"
          :duration="1000"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import BigNumber from 'bignumber.js'
import { AnimatedBigNumber } from '@/components'
import { VUE_EVENT_BUS, PLACE_ORDER_EVENT } from '@/event'
import { AMMDepthData } from '@/utils'

@Component({
  components: {
    AnimatedBigNumber,
  },
})
export default class AMMDepthTable extends Vue {
  @Prop({ default: () => [] }) tableBody!: Array<AMMDepthData>
  @Prop({ default: new BigNumber(0) }) maxTotal!: BigNumber
  @Prop({ default: () => [] }) totals !: Array<BigNumber>

  @Prop({ default: 20 }) rowHeight !: number
  @Prop({ default: 'buy' }) side !: string
  @Prop({ default: 1 }) amountFormatDecimals !: number
  @Prop({ required: true }) priceFormatDecimals !: number
  @Prop({ default: false }) loading !: Boolean
  @Prop() activeOrderPrices !: Object

  private amountRoundMode = BigNumber.ROUND_UP
  private priceRoundMode = this.side === 'buy' ? BigNumber.ROUND_DOWN : BigNumber.ROUND_UP

  get renderTableBody(): Array<AMMDepthData> {
    let tmp = this.tableBody.slice(0)
    return this.side === 'sell' ? tmp.reverse() : tmp
  }

  get renderTotals(): Array<BigNumber> {
    let tmp = this.totals.slice(0)
    return this.side === 'sell' ? tmp.reverse() : tmp
  }

  onSetLimitPrice(price: BigNumber, totalAmount: BigNumber) {
    VUE_EVENT_BUS.emit(PLACE_ORDER_EVENT.SetLimitPrice, this.side, price, totalAmount)
  }
}
</script>

<style lang="scss" scoped>
@keyframes flickerDown {
  0% {
    background: transparent;
  }
  50% {
    background: var(--mc-color-orange);
  }
  100% {
    background: transparent;
  }
}

@keyframes flickerUp {
  0% {
    background: transparent;
  }
  50% {
    background: var(--mc-color-blue);
  }
  100% {
    background: transparent;
  }
}

.amm-depth-table {
  .amm-depth-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    font-size: 12px;
    line-height: 14px;

    .total {
      position: absolute;
      height: 100%;
      width: calc(100% - 16px);
      right: 0;

      .total-bar {
        position: absolute;
        right: 0;
        opacity: 0.15;
        height: 100%;
      }
    }

    .price, .amount {
      z-index: 1;
    }

    .price {
      cursor: pointer;

      &:active {
        opacity: 0.8;
      }
    }
  }


  .active-price-point {
    width: 0.06rem;
    height: 0.06rem;
    border-radius: 50%;
    background: var(--mc-color-error);
    margin-right: 0.06rem;
  }
}
</style>

<style lang="scss" scoped>
@import "~@mcdex/style/common/var";
.amm-depth-table {
  .price {
    &.buy {
      color: var(--mc-color-blue);
    }

    &.sell {
      color: var(--mc-color-orange);
    }
  }

  .unit {
    color: var(--mc-text-color);
  }
}

.flicker-down {
  background-image: linear-gradient(90deg, #D98041 0%, #1B2337 80%);
}

.flicker-up {
  background-image: linear-gradient(90deg, #41D2D9 0%, #1B2337 80%);
}

.total-bar {
  &.buy {
    background: var(--mc-color-blue);
  }

  &.sell {
    background: var(--mc-color-orange);
  }
}
</style>
