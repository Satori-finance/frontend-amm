<template>
  <div class="chart-adapter">
    <header class="head mc-font-p14">
      <McTabs v-model="selectedChartOption" :tabs="chartOptions" :equal-width="true"/>
    </header>
    <div class="content">
      <McLoading :show-loading="isLoading" :hide-content="isLoading">
        <div class="chart-container" v-show="selectedChartOption === 'price'">
          <PriceChart />
        </div>
        <div class="chart-container" v-show="selectedChartOption==='funding'">
          <FundingRateChart />
        </div>
      </McLoading>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { McTabs, McLoading } from '@/components'
import PriceChart from './PriceChart.vue'
import FundingRateChart from './FundingRateChart.vue'
import { SelectedPerpetualMixin } from '@/mixins'

@Component({
  components: {
    McTabs,
    PriceChart,
    FundingRateChart,
    McLoading,
  }
})
export default class ChartAdapter extends Mixins(SelectedPerpetualMixin) {
  private selectedChartOption: 'price' | 'funding' = 'price'

  get chartOptions() {
    return [
      {
        label: this.$t('indexChart').toString(),
        value: 'price'
      },
      {
        label: this.$t('fundingRate').toString(),
        value: 'funding'
      }
    ]
  }

  get isLoading(): boolean {
    return !this.selectedPerpetualID
  }
}
</script>

<style lang="scss" scoped>
.chart-adapter {
  width: 100%;
  min-width: 113px;
  height: 100%;
  box-sizing: border-box;

  .head {
    height: 48px;
    padding: 0 0 0 16px;
    background-color: var(--mc-background-color-dark);
    border-bottom: 1px solid var(--mc-border-color);

    .mc-tabs {
      width: 191px;
      height: 48px;
      line-height: 48px;

      ::v-deep .tab-item.selected {
        height: 48px;
        line-height: 48px;
      }
    }
  }

  .content {
    height: calc(100% - 46px);
    position: relative;

    .chart-container {
      height: 100%;
    }
  }

  ::v-deep .mc-loading {
    height: 100%;

    .mc-loading__mask {
      background: transparent !important;
    }
  }
}
</style>

<style lang="scss" scoped>
.satori-fantasy .chart-adapter {
  .head {
    background-color: var(--mc-background-color-darkest);
  }
  .content {
    background-color: var(--mc-background-color-darkest);
  }
}
</style>
