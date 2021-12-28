<template>
  <div class="amm-depth-table">
    <McLoading
      :show-loading="loading"
      :style="{ 'align-self': loading || noData ? 'center' : '' }"
      :hide-content="true"
      :show-loading-text="false"
    >
      <template v-if="!noData">
        <div
          class="amm-depth-item"
          ref="table"
          v-for="(info, index) in renderTableBody"
          :key="index"
          :style="{ height: rowHeight + 'px' }"
        >
          <div class="price">
            <transition name="fade">
              <div class="active-price-point" v-if="activeOrderPrices[info.price]"></div>
            </transition>
            <span class="price" :class="side" @click="onSetLimitPrice(info.price, info.total)">{{
              info.price.toFormat(priceFormatDecimals, priceRoundMode)
            }}</span>
          </div>
          <div class="amount">
            <AnimatedBigNumber
              style="display: inline-block"
              :amountFormatDecimals="amountFormatDecimals"
              :amountRoundMode="amountRoundMode"
              :value="info.amount.dp(amountFormatDecimals, amountRoundMode)"
              :duration="1000"
            />
          </div>
          <div class="total">
            <span>{{ renderTotals[index].toFormat(amountFormatDecimals, amountRoundMode) }}</span>
          </div>
          <div
            class="total-bar"
            :class="side"
            :style="[{ width: `${(maxTotal.gt(0) && renderTotals[index].div(maxTotal).times(100).toNumber()) || 0}%` }]"
          ></div>
        </div>
      </template>
      <McNoData v-else></McNoData>
    </McLoading>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import BigNumber from 'bignumber.js'
import { AnimatedBigNumber, McLoading, McNoData } from '@/components'
import { VUE_EVENT_BUS, PLACE_ORDER_EVENT } from '@/event'
import { AMMDepthData } from '@/utils'

@Component({
  components: {
    AnimatedBigNumber,
    McLoading,
    McNoData,
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

  get noData() {
    return this.renderTableBody.length <= 0
  }

  get renderTableBody(): Array<AMMDepthData> {
    let tmp = this.tableBody.slice(0)
    return this.side === 'sell' ? tmp.reverse() : tmp
  }

  get renderTotals(): Array<BigNumber> {
    let tmp = this.totals.slice(0)
    return this.side === 'sell' ? tmp.reverse() : tmp
  }

  getDataID(info: any) {
    return info.price.toFixed()
  }

  onSetLimitPrice(price: BigNumber, totalAmount: BigNumber) {
    VUE_EVENT_BUS.emit(PLACE_ORDER_EVENT.SetLimitPrice, this.side, price, totalAmount)
  }
}
</script>

<style lang="scss" scoped>
@-webkit-keyframes flickerDown {
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

@-moz-keyframes flickerDown {
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

@-ms-keyframes flickerDown {
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

@-o-keyframes flickerDown {
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

@-webkit-keyframes flickerUp {
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

@-moz-keyframes flickerUp {
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

@-ms-keyframes flickerUp {
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

@-o-keyframes flickerUp {
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
  display: flex;
  align-items: center;
  justify-content: center;

  .mc-loading {
    width: 100%;
  }

  .amm-depth-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    font-size: 12px;
    line-height: 14px;

    .total {
      flex: 4.5 1 0%;
      position: relative;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      color: var(--mc-text-color-white);

      span {
        display: inline-block;
        z-index: 2;
      }
    }

    .amount {
      flex: 3.8 1 0%;
      text-align: right;
      color: var(--mc-text-color-white);

      ::v-deep {
        .down {
          animation: flickerDown 1s ease-out;
        }

        .up {
          animation: flickerUp 1s ease-out;
        }
      }
    }

    .price {
      max-width: 0.76rem;
      flex: 5.5 1 0%;
      cursor: pointer;
      text-align: left;
      position: relative;

      &:active {
        opacity: 0.8;
      }

      .active-price-point {
        position: absolute;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--mc-color-error);
        left: -8px;
        top: calc(50% - 3px);
      }
    }
    .total-bar {
      z-index: 1;
      position: absolute;
      right: 0;
      top: 50%;
      opacity: 0.15;
      height: 20px;
      margin-top: -10px;
    }
  }
}
</style>

<style lang="scss" scoped>
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
  background-image: linear-gradient(90deg, #d98041 0%, #1b2337 80%);
}

.flicker-up {
  background-image: linear-gradient(90deg, #41d2d9 0%, #1b2337 80%);
}

.total-bar {
  &.buy {
    background-color: var(--mc-color-blue);
  }

  &.sell {
    background-color: var(--mc-color-orange);
  }
}
</style>
