<template>
  <div class="charts">
    <div class="tabs-container">
      <McMRadioGroupTabs v-model="selectedRadio" :options="radioOptions" />
    </div>
    <div class="chart-container">
      <van-skeleton title :row="7" v-if="!poolBaseInfo" />
      <McmAreaLineChart v-if="selectedRadio==='liquidity'&&poolBaseInfo" :chart-size="chartSize"
                     unit-position="right" :unit="collateralSymbol" default-radio="1w"
                     :data-call-radio-group="liquidityRadioGroup" key="liquidityChart"
                     :is-price-formatter="true" :default-price-decimals="collateralDecimals"
                     :show-value-change="true" chart-background-color="transparent" />
      <McmHistogramChart v-else-if="selectedRadio==='volume'&&poolBaseInfo" :chart-size="chartSize"
                     unit-position="right" :unit="collateralSymbol" default-radio="1w"
                     :data-call-radio-group="volumeRadioGroup" key="volumeChart"
                     :is-price-formatter="true" :default-price-decimals="collateralDecimals"
                     :show-value-change="false" chart-background-color="transparent"  />
      <McmAreaLineChart v-else-if="selectedRadio==='nav'&&poolBaseInfo" :chart-size="chartSize"
                     unit-position="right" :unit="collateralSymbol" default-radio="1w"
                     :data-call-radio-group="navRadioGroup" key="navChart" chart-background-color="transparent"
                        :default-price-decimals="netAssetValueDecimals" :show-value-change="true" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { McMRadioGroupTabs, McmAreaLineChart, McmHistogramChart } from '@/mobile/components'
import PoolChartMixin from '@/template/components/Pool/PoolInfo/poolChartMixin'

@Component({
  components: {
    McMRadioGroupTabs,
    McmAreaLineChart,
    McmHistogramChart,
  }
})
export default class Charts extends Mixins(PoolChartMixin) {
  private chartSize: { width: number, height: number } = { width: 311, height: 193 }

  private selectedRadio: 'liquidity' | 'volume' | 'nav' = 'liquidity'

  get radioOptions() {
    return [
      {
        label: this.$t('pool.chart.sharedLiquidity').toString(),
        value: 'liquidity',
      },
      {
        label: this.$t('base.volume24H').toString(),
        value: 'volume',
      },
      {
        label: this.$t('pool.chart.nav').toString(),
        value: 'nav',
      }
    ]
  }
}
</script>

<style lang="scss" scoped>
.charts {
  .tabs-container {
    ::v-deep {
      .tabs {
        height: 32px;
        border-radius: 8px;

        .tab-item {
          line-height: 32px;
          border-radius: 8px;
          font-size: 12px;
        }

        .is-selected {
          color: var(--mc-text-color-white);
        }

        .label {
          border-radius: 8px;
        }
      }
    }
  }

  .chart-container {
    margin-top: 16px;
    min-height: 237px;

    ::v-deep .radio-group {
      background: var(--mc-background-color-darkest);
      border-radius: 8px;

      .radio-item {
        background: transparent;
        height: 32px;
        line-height: 32px;
        margin: 0;
        font-size: 12px;
      }

      .is-selected {
        border: unset;
        background: var(--mc-background-color);
        color: var(--mc-text-color-white);
      }
    }
  }
}
</style>
