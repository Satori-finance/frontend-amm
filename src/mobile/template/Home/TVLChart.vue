<template>
  <div class="mobile-tlv-chart">
    <McMStatsAreaLineChart :chart-size="chartSize"
                      unit-position="left" unit="$" default-radio="1w"
                      :data-call-radio-group="tvlRadioGroup" key="tlvChart"
                      :is-price-formatter="true" :default-price-decimals="2"
                      chart-background-color="transparent" :latest-value="latestTvlValue"
                      :title="$t('home.tvl')" :is-form-header-price="true" />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import TVLChartMixin from '@/template/components/Home/TVLChartMixin'
import { McMStatsAreaLineChart } from '@/mobile/components'

@Component({
  components: {
    McMStatsAreaLineChart,
  },
})
export default class TVLChart extends Mixins(TVLChartMixin) {
  private chartSize: { width: number, height: number } = { width: 311, height: 226 }

}
</script>

<style scoped lang="scss">
.mobile-tlv-chart {
  padding: 24px;
}
</style>
