<template>
  <div class="price-chart">
      <McLoading :show-loading="!showChart" v-show="!showChart" />
      <div id="TV-chart" style="width: 100%; height: 100%" v-show="showChart"></div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { McLoading } from '@/components'
import PriceChartMixin from '@/template/components/TradeChart/priceChartMixin'

@Component({
  components: {
    McLoading,
  },
})
export default class PriceChart extends Mixins(PriceChartMixin) {
  created() {
    this.isMobile = false
  }
}
</script>

<style lang="scss" scoped>
.price-chart {
  height: 100%;

  ::v-deep .mc-loading {
    height: 100%;

    .mc-loading__mask {
      background: transparent !important;
    }
  }
}
</style>
