<template>
  <div class="ammDepth">
    <header class="head">
      <slot name="head">
        <span class="mc-font-p14">{{ $t('AMMDepth') }}</span>
      </slot>
      <div class="group" v-if="isShowGroup">
        <el-select size="small" v-model="selectedGroup">
          <el-option v-for="item in groupOption" :value="item" :label="item" :key="item"></el-option>
        </el-select>
      </div>
    </header>
    <div class="table-title">
      <div class="price-title">{{ tableTitle[0] }}</div>
      <div class="amount-title">{{ tableTitle[1] }}</div>
      <div class="total-title">{{ tableTitle[2] }}</div>
    </div>
    <div class="table" ref="tableBox">
      <div class="table-box ask">
        <AMMDepthTable ref="askTable" side="sell" :activeOrderPrices="activeOrderPrices.sell" :tableBody="visibleAsks" :maxTotal="maxTotal" :totals="askTotals" :rowHeight="rowHeight" :amountFormatDecimals="contractFormatDecimals" :priceFormatDecimals="priceFormatDecimals" :loading="loading"></AMMDepthTable>
      </div>

      <div class="spread-box" v-if="!isHorizontal">
        <span class="spread">{{ spread.toFormat(priceFormatDecimals) }}</span>
        <span class="spread-percent">{{ spreadPercent.toFixed(2) }}%</span>
        <span class="total"></span>
      </div>

      <div class="table-box bid">
        <AMMDepthTable ref="bidTable" side="buy" :activeOrderPrices="activeOrderPrices.buy" :tableBody="visibleBids" :totals="bidTotals" :maxTotal="maxTotal" :rowHeight="rowHeight" :amountFormatDecimals="contractFormatDecimals" :priceFormatDecimals="priceFormatDecimals" :loading="loading"></AMMDepthTable>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Mixins } from 'vue-property-decorator'
import AMMDepthTable from './AMMDepthTable.vue'
import elementResizeDetectorMaker from 'element-resize-detector'
import * as _ from 'lodash'
import { AMMDepthMixin } from './AMMDepthMixin'

@Component({
  components: {
    AMMDepthTable,
  },
})
export default class AMMDepth extends Mixins(AMMDepthMixin) {
  @Prop({ default: 0 }) w!: number
  @Prop({ default: 0 }) h!: number
  @Prop({ default: 0 }) maxW!: number
  @Prop({ default: 20 }) rowHeight!: number

  @Ref('tableBox') tableBox!: HTMLElement
  priorities = ['price', 'amount', 'total']
  erd: elementResizeDetectorMaker.Erd | null = null
  isLoading: boolean = true

  mounted() {
    this.erd = elementResizeDetectorMaker({ strategy: 'scroll', callOnAdd: true })
    const debounceCalc = _.debounce(this.calcCount, 200)
    this.erd.listenTo(this.tableBox, (el) => {
      debounceCalc()
    })
  }

  destroyed() {
    this.isLoading = false
  }

  get tableTitle() {
    const sizeString =
      this.$t('tableTitle.sizeNumber').toString() +
      (this.perpetualProperty?.contractSymbol ? ` (${this.perpetualProperty?.underlyingAssetSymbol})` : '')
    const priceStr =
      this.$t('tableTitle.price').toString() +
      (this.perpetualProperty?.priceSymbol ? ` (${this.perpetualProperty?.priceSymbol})` : '')
    const totalStr =
      this.$t('tableTitle.total').toString() +
      (this.perpetualProperty?.contractSymbol ? ` (${this.perpetualProperty?.underlyingAssetSymbol})` : '')
    return [priceStr, sizeString, totalStr]
  }

  get isShowGroup() {
    return this.w >= 3 && this.groupOption.length > 1
  }

  get isHorizontal() {
    //TODO determine horizontal layout by w
    return this.maxW === this.w
  }

  get loading(): boolean {
    if (this.isLoading) {
      return !this.liquidityPool || !this.perpetualProperty || this.selectedGroup == 0
    }
    return this.isLoading
  }

  private calcCount() {
    const height = this.tableBox.clientHeight
    this.count = Math.floor((height - 34 - 32) / 2 / this.rowHeight)
  }
}
</script>

<style lang="scss" scoped>
$header-height: 48px;
$spread-box-height: 34px;

@-webkit-keyframes rotate {
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }
}

@-moz-keyframes rotate {
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }
}

@-ms-keyframes rotate {
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }
}

@-o-keyframes rotate {
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes rotate {
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }
}

.ammDepth {
  width: 100%;
  height: 100%;
  min-width: 360px;

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: $header-height;
    padding: 0 16px;
  }

  .head {
    font-weight: normal;
  }

  .group {
    flex: auto;
    max-width: 80px;
    height: 30px;
    display: flex;
    align-items: center;

    .select {
      width: 100%;
      height: 100%;
      margin-left: 0.05rem;
    }
  }

  .table-title {
    display: flex;
    align-items: center;
    font-size: 12px;
    line-height: 16px;
    text-align: right;
    padding: 8px 16px 0;

    .price-title {
      flex: 5.5 1 0;
      max-width: 76px;
      text-align: left;
    }

    .amount-title {
      flex: 3.8 1 0;
    }

    .total-title {
      flex: 4.5 1 0;
    }
  }

  .table {
    height: calc(100% - #{$header-height} - 24px);
    position: relative;

    .table-box {
      display: flex;
      flex-direction: column;
      flex: auto;
      height: 100%;
      overflow: hidden;
      padding: 8px 16px;

      .amm-depth-table {
        flex: 1;
      }

      &.ask .amm-depth-table {
        align-items: flex-end;
      }

      &.bid .amm-depth-table {
        align-items: flex-start;
      }
    }

    .spread-box {
      display: flex;
      flex: auto;
      line-height: $spread-box-height - 2px;
      font-size: 12px;
      padding: 0 16px;
      text-align: right;
      border-top: 1px solid;
      border-bottom: 1px solid;

      ::v-deep .mc-table-body {
        height: 100%;
        font-size: 12px;

        li {
          height: 100%;

          &:hover {
            background: none;
          }
        }
      }

      .spread {
        flex: 5.5 1 0;
        text-align: left;
        max-width: 76px;
      }

      .total {
        flex: 4.5 1 0;
      }

      .spread-percent {
        flex: 3.8 1 0;
      }
    }

    .ask,
    .bid {
      height: calc((100% - #{$spread-box-height}) / 2);
    }
  }
}
</style>

<style lang="scss" scoped>
.satori-fantasy .ammDepth {
  header {
    background-color: var(--mc-background-color-darkest);
    color: var(--mc-text-color-white);
    border-bottom: 1px solid var(--mc-border-color);
  }

  .table-title {
    color: var(--mc-text-color);
    background-color: var(--mc-background-color-darkest);
  }

  .table {
    background-color: var(--mc-background-color-darkest);
  }

  .spread-box {
    border-color: var(--mc-border-color);
    background-color: #22352c;
  }
}
</style>
