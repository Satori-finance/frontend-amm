<template>
  <div class="readonly-amm-depth">
    <div class="title">
      <span>{{ $t('base.bidAmount', {tokenName: underlyingAssetSymbol}) }}</span>
      <span>{{ $t('base.price') }}({{ priceUnit }})</span>
      <span>{{ $t('base.amountAsk', {tokenName: underlyingAssetSymbol}) }}</span>
    </div>
    <div class="table" ref="tableBox">
      <div class="table-box bid">
        <ReadonlyAMMDepthTable
          v-if="bidTotals.length"
          ref="bidTable"
          side="buy"
          :activeOrderPrices="activeOrderPrices.buy"
          :tableBody="visibleBids"
          :totals="bidTotals"
          :maxTotal="maxTotal"
          :rowHeight="rowHeight"
          :amountFormatDecimals="contractFormatDecimals"
          :priceFormatDecimals="priceFormatDecimals"
        ></ReadonlyAMMDepthTable>
        <McMNoData v-else/>
      </div>

      <div class="table-box ask">
        <ReadonlyAMMDepthTable
          v-if="askTotals.length"
          ref="askTable"
          side="sell"
          :activeOrderPrices="activeOrderPrices.sell"
          :tableBody="visibleAsks"
          :maxTotal="maxTotal"
          :totals="askTotals"
          :rowHeight="rowHeight"
          :amountFormatDecimals="contractFormatDecimals"
          :priceFormatDecimals="priceFormatDecimals"
        ></ReadonlyAMMDepthTable>
        <McMNoData v-else/>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Mixins } from 'vue-property-decorator'
import ReadonlyAMMDepthTable from './ReadonlyAMMDepthTable.vue'
import { NumberArrow } from '@/components'
import { McMNoData } from '@/mobile/components'
import { AMMDepthMixin } from '@/business-components/AMMDepth/AMMDepthMixin'

@Component({
  components: {
    ReadonlyAMMDepthTable,
    NumberArrow,
    McMNoData,
  },
})
export default class ReadonlyAMMDepth extends Mixins(AMMDepthMixin) {
  @Prop({ default: 26 }) rowHeight!: number

  @Ref('tableBox') tableBox!: HTMLElement
  isLoading: boolean = true

  mounted() {
    this.count = 20
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

.readonly-amm-depth {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  .title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    line-height: 16px;
    margin-bottom: 8px;
    color: var(--mc-text-color);

    span:first-of-type {
      flex: 1;
      text-align: left;
    }

    span:last-of-type {
      flex: 1;
      text-align: right;
    }
  }

  .table {
    display: flex;
    .table-box {
      width: 50%;

      .no-data {
        margin: auto;
      }
    }
  }
}
</style>
