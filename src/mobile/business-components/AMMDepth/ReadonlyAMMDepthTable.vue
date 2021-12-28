<template>
  <div class="readonly-amm-depth-table" :class="side">
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
        <span class="price" :class="side">{{
            info.price.toFormat(priceFormatDecimals, priceRoundMode)
          }}</span>
      </div>
      <div class="amount">
        <div class="index">{{index + 1 | padLeftFormat(2)}}</div>

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
import { Component, Prop, Vue } from 'vue-property-decorator'
import BigNumber from 'bignumber.js'
import { AnimatedBigNumber } from '@/components'
import { AMMDepthData } from '@/utils'

@Component({
  components: {
    AnimatedBigNumber,
  },
})
export default class ReadonlyAMMDepthTable extends Vue {
  @Prop({ default: () => [] }) tableBody!: Array<AMMDepthData>
  @Prop({ default: new BigNumber(0) }) maxTotal!: BigNumber
  @Prop({ default: () => [] }) totals !: Array<BigNumber>

  @Prop({ default: 20 }) rowHeight !: number
  @Prop({ default: 'buy' }) side !: string
  @Prop({ default: 1 }) amountFormatDecimals !: number
  @Prop({ required: true }) priceFormatDecimals !: number
  @Prop() activeOrderPrices !: Object

  private amountRoundMode = BigNumber.ROUND_UP
  private priceRoundMode = this.side === 'buy' ? BigNumber.ROUND_DOWN : BigNumber.ROUND_UP

  get renderTableBody(): Array<AMMDepthData> {
    return this.tableBody.slice(0)
  }

  get renderTotals(): Array<BigNumber> {
    return this.totals.slice(0)
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

.readonly-amm-depth-table {
  &.buy {
    .amm-depth-item {
      flex-direction: row-reverse;
      padding-right: 4px;

      .total {
        right: 0;

        .total-bar {
          right: 0;
        }
      }

      .amount {
        .index {
          margin-right: 8px;
        }
      }
    }
  }

  &.sell {
    .amm-depth-item {
      padding-left: 4px;

      .total {
        left: 0;

        .total-bar {
          left: 0;
        }
      }

      .amount {
        .index {
          order: 1;
          margin-left: 8px;
        }
      }
    }
  }

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
      width: calc(100% - 32px);

      .total-bar {
        position: absolute;
        top: 0;
        opacity: 0.15;
        height: 26px;
        mix-blend-mode: normal;
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

    .amount {
      display: flex;
      align-items: center;

      .index {
        color: var(--mc-text-color-dark);
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
.readonly-amm-depth-table {
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
