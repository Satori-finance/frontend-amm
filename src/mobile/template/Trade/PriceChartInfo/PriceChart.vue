<template>
  <div class="price-chart" :class="{ 'padding-container': !showChart }">
    <van-skeleton title :row="10" :loading="!showChart"></van-skeleton>
    <div id="TV-chart" style="width: 100%; height: 100%" v-show="showChart"></div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import PriceChartMixin from '@/template/components/TradeChart/priceChartMixin'

@Component
export default class PriceChart extends Mixins(PriceChartMixin) {
  created() {
    this.isMobile = true
  }
}
</script>

<style scoped lang="scss">
.price-chart {
  height: 375px;
}
.padding-container {
  padding: 16px;
}
</style>
