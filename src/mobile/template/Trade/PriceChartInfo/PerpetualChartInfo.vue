<template>
  <div class="perpetual-chart-info scroll-container safe-area-inset-bottom">
    <div class="page-container">
      <div class="statistics-container">
        <PerpetualStatistics/>
      </div>
      <div class="split-line"></div>
      <div class="chart-container">
        <ChartAdapter/>
      </div>
      <div class="split-line"></div>
      <div class="depth-history-container">
        <AMMDepthAndMarketHistory :perpetual-storage="selectedPerpetualStorage"
                                  :perpetual-property="selectedPerpetualProperty"
                                  :liquidity-pool="selectedLiquidityPoolStorage" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import PerpetualStatistics from '../PerpetualStatistics.vue'
import PriceChart from './PriceChart.vue'
import { SelectedPerpetualMixin } from '@/mixins'
import AMMDepthAndMarketHistory from '../AMMDepthAndMarketHistory.vue'
import ChartAdapter from './ChartAdapter.vue'

@Component({
  components: {
    PerpetualStatistics,
    PriceChart,
    AMMDepthAndMarketHistory,
    ChartAdapter,
  },
})
export default class PerpetualChartInfo extends Mixins(SelectedPerpetualMixin) {

  get headTitle(): string {
    return `${this.perpetualSymbol} ${this.perpetualName}`
  }

  get perpetualSymbol() {
    return this.selectedPerpetualProperty?.symbolStr || ''
  }

  get perpetualName() {
    return this.selectedPerpetualProperty?.name || ''
  }
}
</script>

<style lang="scss" scoped>
.perpetual-chart-info {
  ::v-deep {
    .back-nav-bar {
      .van-nav-bar__title {
        font-size: 18px;
        font-weight: 700;
      }
    }
  }

  .statistics-container {
    padding: 0 16px 16px;
    background: var(--mc-background-color-dark);
  }

  .split-line {
    width: 100%;
    height: 12px;
    background-color: var(--mc-background-color-darkest);
  }

  .chart-container {
    overflow: hidden;
  }

  .depth-history-container {
    background: var(--mc-background-color);
    min-height: calc(100vh - 531px);
  }
}
</style>
