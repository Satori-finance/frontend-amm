<template>
  <div class="funding-rate-chart">
    <div class="header-bor">
      <div class="chart-time-box">
        <div class="time-item"
             v-for="(item, index) in timeOptions"
             :class="{'is-selected': item.value===selectedTimeType}"
             :key="index" @click="selectedTimeType=item.value">{{ item.label }}</div>
      </div>
      <div class="line-chart-tabs">
        <div class="tab-item" :class="{'is-selected': selectedLineChartType==='8hRate'}"
             @click="selectedLineChartType='8hRate'">{{ $t('tradeCharts.8hRate') }}</div>
        <div class="tab-item" :class="{'is-selected': selectedLineChartType==='annualized'}"
             @click="selectedLineChartType='annualized'">{{ $t('tradeCharts.annualized') }}</div>
      </div>
    </div>
    <TradeLineChart
      :data-call-radio-group="dataCallGroup"
      :active-date-radio="selectedTimeType"
      :chart-view-type="selectedLineChartType"
      :selected-perpetual-id="selectedPerpetualID"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import FundingRateChartMixin from '@/template/components/TradeChart/FundingRateChartMixin'
import TradeLineChart from './TradeLineChart.vue'

@Component({
  components: {
    TradeLineChart,
  }
})
export default class FundingRateChart extends Mixins(FundingRateChartMixin) {

}
</script>

<style lang="scss" scoped>
.funding-rate-chart {
  height: calc(100% - 41px);

  .header-bor {
    height: 38px;
    border-bottom: 1px solid var(--mc-border-color);
    align-items: center;
    cursor: pointer;
    display: flex;

    .chart-time-box {
      .time-item {
        &:first-child {
          border-left: unset !important;
        }

        &:last-child {
          border-right: unset !important;
        }
      }
    }

    .line-chart-tabs, .chart-time-box {
      display: flex;
      height: 38px;

      .tab-item, .time-item {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 8px 12px;
        color: var(--mc-text-color);
        font-size: 14px;

        &:first-child {
          border-left: 1px solid var(--mc-border-color);
        }

        &:last-child {
          border-right: 1px solid var(--mc-border-color);
        }

        &.is-selected, &:hover {
          color: var(--mc-color-primary);
        }
      }
    }
  }
}
</style>
