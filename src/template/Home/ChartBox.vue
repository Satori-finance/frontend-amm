<template>
  <div class="chart-box">
    <div class="title">{{$t('home.allNetworksStats')}}</div>
    <div class="chart-flex-box">
      <div class="liquidity-chart chart-item">
        <div class="chart-title">{{ $t('home.tvl') }}</div>
        <StatsAreaLineChart :chart-size="chartSize"
                       unit-position="left" unit="$" default-radio="1w"
                       :data-call-radio-group="tvlRadioGroup" key="tlvChart"
                       :is-price-formatter="true" :default-price-decimals="2" :is-form-header-price="true"
                       chart-background-color="transparent" :latest-value="latestTvlValue" />
      </div>
      <div class="volume-chart chart-item">
        <div class="chart-title">{{ $t('base.volume24H') }}</div>
        <StatsHistogramChart :chart-size="chartSize"
                        unit-position="left" unit="$" default-radio="1w"
                        :data-call-radio-group="volumeRadioGroup" key="volumeChart"
                        :is-price-formatter="true" :default-price-decimals="2" :is-form-header-price="true"
                        chart-background-color="transparent" :latest-value="latestVolumeValue" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { StatsAreaLineChart, StatsHistogramChart } from '@/components'
import TVLChartMixin from '@/template/components/Home/TVLChartMixin'
import VolumeChartMixin from '@/template/components/Home/VolumeChartMixin'

@Component({
  components: {
    StatsAreaLineChart,
    StatsHistogramChart,
  }
})
export default class ChartBox extends Mixins(TVLChartMixin, VolumeChartMixin) {
  private chartSize: { width: number, height: number } = { width: 550, height: 206 }

}
</script>

<style scoped lang="scss">
@import "~@mcdex/style/common/var";

.chart-box {
  max-width: 1200px;
  margin: auto;
  z-index: 1;
  position: relative;

  .title {
    font-size: 24px;
    line-height: 30px;
    margin-bottom: 24px;
  }

  .chart-flex-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .chart-item {
    height: 312px;
    box-shadow: 0px 10px 32px rgba(18, 24, 44, 0.54);
    background: var(--mc-background-color-dark);
    border: 1px solid var(--mc-border-color);
    border-radius: var(--mc-border-radius-l);
    padding: 24px 12px 14px 24px;
    flex: 1;

    &:first-of-type {
      margin-right: 24px;
    }

    .chart-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--mc-text-color-white);
      margin-bottom: 6px;
    }

    ::v-deep {
      .el-radio-group {
        .el-radio-button {
          background: linear-gradient(90deg, #87AECA0D 0%, #9BC2DE0D 100%);
          border-radius: var(--mc-border-radius-s);

          .el-radio-button__inner {
            color: var(--mc-color-brand);
          }
        }
        .is-active {
          .el-radio-button__inner {
            background: var(--mc-background-color);
            color: #F2F4F7;
          }
        }
      }

      .el-loading-mask {
        margin-right: 24px;
        margin-bottom: 24px;
      }
    }
  }
}
</style>
