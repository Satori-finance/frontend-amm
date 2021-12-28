<template>
  <div class="amm-depth">
    <div class="title">
      <span>{{ $t('base.price') }}<br/>({{ priceUnit }})</span>
      <span>{{ $t('base.amount') }}<br/>({{ amountUnit }})</span>
    </div>
    <div class="table" ref="tableBox">
      <div class="table-box ask">
        <AMMDepthTable
          v-if="askTotals.length"
          ref="askTable"
          side="sell"
          :activeOrderPrices="activeOrderPrices.sell"
          :tableBody="visibleAsks"
          :maxTotal="maxTotal"
          :totals="askTotals"
          :rowHeight="rowHeight"
          :isAscend="true"
          :amountFormatDecimals="contractFormatDecimals"
          :priceFormatDecimals="priceFormatDecimals"
          :loading="loading"
        ></AMMDepthTable>
        <McMNoData v-else/>
      </div>

      <div class="spread-box">
        <NumberArrow
          v-if="indexPrice"
          :number="indexPrice"
          :inverse="isInverse"
          :decimals="priceFormatDecimals"
        />
      </div>

      <div class="table-box bid">
        <AMMDepthTable
          v-if="bidTotals.length"
          ref="bidTable"
          side="buy"
          :activeOrderPrices="activeOrderPrices.buy"
          :tableBody="visibleBids"
          :totals="bidTotals"
          :maxTotal="maxTotal"
          :rowHeight="rowHeight"
          :isAscend="false"
          :amountFormatDecimals="contractFormatDecimals"
          :priceFormatDecimals="priceFormatDecimals"
          :loading="loading"
        ></AMMDepthTable>
        <McMNoData v-else/>
      </div>
    </div>

    <div class="group-box">
      <div class="group">
        <McMPopupSelector v-model="selectedGroup" :options="selectOptions"></McMPopupSelector>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Mixins } from 'vue-property-decorator'
import AMMDepthTable from './AMMDepthTable.vue'
import elementResizeDetectorMaker from 'element-resize-detector'
import * as _ from 'lodash'
import { NumberArrow } from '@/components'
import { McMNoData, McMPopupSelector } from '@/mobile/components'
import { AMMDepthMixin } from '@/business-components/AMMDepth/AMMDepthMixin'

@Component({
  components: {
    AMMDepthTable,
    NumberArrow,
    McMPopupSelector,
    McMNoData,
  },
})
export default class AMMDepth extends Mixins(AMMDepthMixin) {
  @Prop({ default: 26 }) rowHeight!: number

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

  beforeDestroy() {
    this.erd?.removeAllListeners(this.tableBox)
  }

  destroyed() {
    this.isLoading = false
  }

  get loading(): boolean {
    if (this.isLoading) {
      return !this.liquidityPool || !this.perpetualProperty || this.selectedGroup == 0
    }
    return this.isLoading
  }


  private calcCount() {
    const height = this.tableBox.clientHeight
    this.count = Math.floor((height - 38) / 2 / this.rowHeight)
  }
}
</script>

<style lang="scss" scoped>
@keyframes rotate {
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }
}

.amm-depth {
  width: 100%;
  height: 100%;
  min-height: 300px;
  display: flex;
  flex-direction: column;

  .title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    line-height: 16px;
    margin-bottom: 4px;
    color: var(--mc-text-color);

    span:last-of-type {
      text-align: right;
    }
  }

  .group-box {
    margin-top: 8px;

    .mc-mobile-select {
      ::v-deep .selector {
        height: 26px;
        padding: 5px 12px;

        .left-value {
          color: var(--mc-text-color);
          font-size: 12px;
          line-height: 14px;
        }
      }
    }

    .van-cell {
      width: 100%;
      background-color: transparent;
      height: 26px;
      padding: 0 12px;
      font-size: 12px;
      line-height: 24px;
      border-radius: var(--mc-border-radius-m);
      border: 1px solid var(--mc-border-color);

      .van-icon {
        line-height: 24px;
        color: var(--mc-text-color);
      }

      ::v-deep .van-field__control {
        color: var(--mc-text-color);
      }
    }
  }

  .table {
    height: calc(100% - 60px);
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 1;

    .table-box {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;

      &.ask {
        justify-content: flex-end;
      }

      &.bid {
        justify-content: flex-start;
      }

      .no-data {
        margin: auto;
      }
    }

    .spread-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 38px;
      font-size: 16px;
      line-height: 48px;
    }
  }
}
</style>
