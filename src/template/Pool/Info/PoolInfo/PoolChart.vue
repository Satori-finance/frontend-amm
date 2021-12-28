<template>
  <div class="pool-chart">
    <span class="head-title">{{ $t('pool.poolInfo.poolChart') }}</span>
    <div class="chart-data-type-select">
      <el-radio-group v-model="activeDataType" size="medium">
        <el-radio-button label="liquidity">{{ $t('pool.chart.sharedLiquidity') }}</el-radio-button>
        <el-radio-button label="volume">{{ $t('base.volume24H') }}</el-radio-button>
        <el-radio-button label="nav">{{ $t('pool.chart.netAssetValue') }}</el-radio-button>
      </el-radio-group>
    </div>
    <div class="chart-container">
      <AreaLineChart v-if="activeDataType==='liquidity'&&poolBaseInfo" :chart-size="chartSize"
                     unit-position="right" :unit="collateralSymbol" default-radio="1w"
                     :data-call-radio-group="liquidityRadioGroup" key="liquidityChart"
                     :is-price-formatter="true" :default-price-decimals="collateralDecimals"
                     :show-value-change="true" />
      <HistogramChart v-else-if="activeDataType==='volume'&&poolBaseInfo" :chart-size="chartSize"
                     unit-position="right" :unit="collateralSymbol" default-radio="1w"
                     :data-call-radio-group="volumeRadioGroup" key="volumeChart"
                     :is-price-formatter="true" :default-price-decimals="collateralDecimals"
                     :show-value-change="false" />
      <AreaLineChart v-else-if="activeDataType==='nav'&&poolBaseInfo" :chart-size="chartSize"
                     unit-position="right" :unit="collateralSymbol" default-radio="1w"
                     :data-call-radio-group="navRadioGroup" key="navChart"
                     :default-price-decimals="netAssetValueDecimals" :show-value-change="true" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { AreaLineChart, HistogramChart } from '@/components'
import PoolChartMixin from '@/template/components/Pool/PoolInfo/poolChartMixin'

@Component({
  components: {
    AreaLineChart,
    HistogramChart,
  },
})
export default class PoolChart extends Mixins(PoolChartMixin) {
  private chartSize: { width: number, height: number } = { width: 625, height: 260 }
  private activeDataType: 'liquidity' | 'volume' | 'nav' = 'liquidity'

}
</script>

<style scoped lang="scss">
@import "../info.scss";

.pool-chart {}
</style>
