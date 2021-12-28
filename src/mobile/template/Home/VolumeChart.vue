<template>
  <div class="mobile-volume-chart">
    <McMStatsHistogramChart :chart-size="chartSize"
                      unit-position="left" unit="$" default-radio="1w"
                      :data-call-radio-group="volumeRadioGroup" key="volumeChart"
                      :is-price-formatter="true" :default-price-decimals="2"
                      chart-background-color="transparent" :latest-value="latestVolumeValue"
                      :is-form-header-price="true" :title="$t('base.volume24H')" />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import VolumeChartMixin from '@/template/components/Home/VolumeChartMixin'
import { McMStatsHistogramChart } from '@/mobile/components'

@Component({
  components: {
    McMStatsHistogramChart,
  }
})
export default class VolumeChart extends Mixins(VolumeChartMixin) {
  private chartSize: { width: number, height: number } = { width: 311, height: 226 }

}
</script>

<style scoped lang="scss">
.mobile-volume-chart {
  padding: 24px;
}
</style>
