<template>
  <div class="mobile-area-line-chart">
    <div class="chart-header">
      <div class="header-left">
        <slot name="title">{{ title }}</slot>
      </div>
      <div class="header-right">
        <McMRadioGroup v-model="activeDateRadio" :options="dataCallRadioGroup" />
      </div>
    </div>
    <div style="display: none">
      <div class="mobile-area-chart-tooltip" ref="toolTip" >
        <div class="value">
        <span v-if="mouseSelectValue!==''">
          <span v-if="unitPosition==='left'">{{ unit }}</span>
            {{ mouseSelectValue }}
          <span v-if="unitPosition==='right'">{{ unit }}</span>
          <span v-if="showValueChange && valueChangeRate" class="value-change"
                :class="{'up-color': valueChangeRate.gte(0), 'down-color': valueChangeRate.lt(0)}">
            <span v-if="valueChangeRate.gt(0)">+</span><span v-else-if="valueChangeRate.lt(0)">-</span>{{
              valueChangeRate.abs() | bigNumberFormatter(2) }} <span v-if="!valueChangeRate.isNaN()">%</span>
          </span>
        </span>
        </div>
      </div>
    </div>
    <van-skeleton title :row="skeletonCount" v-if="loading" />
    <div class="area-line-container" v-show="!loading" ref="chartContainer">
      <div ref="areaLineChart"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Ref, Prop } from 'vue-property-decorator'
import { AreaLineChartMixin } from '@/components/Chart/areaLineChartMixin'
import { areaLineSeriesPartialOptions, createChartOptions } from './chartOptions'
import McMRadioGroup from '../RadioGroup.vue'
import elementResizeDetectorMaker from 'element-resize-detector'

@Component({
  components: {
    McMRadioGroup,
  }
})
export default class AreaLineChart extends Mixins(AreaLineChartMixin) {
  @Prop({ default: ''}) chartName !: string
  @Prop({ default: '' }) title !: string
  @Prop({ default: 5 }) skeletonCount !: number
  @Ref('toolTip') toolTipContainer !: HTMLElement
  @Ref('chartContainer') chartContainer !: HTMLDivElement

  private erd: elementResizeDetectorMaker.Erd | null = null

  created () {
    this.areaLineSeriesPartialOptions = areaLineSeriesPartialOptions
    this.createChartOptions = createChartOptions
  }

  mounted () {
    this.initialChart()
    this.chartContainer.style.position = 'relative'
    this.chartContainer.appendChild(this.toolTipContainer)
    // watch window change
    this.erd = elementResizeDetectorMaker()
    if (this.erd) {
      this.erd.listenTo(this.chartContainer, (el) => {
        this.resetChartSize()
      })
    }
  }

  beforeDestroy() {
    if (this.erd) {
      this.erd.removeListener(this.chartContainer, () =>{})
    }
  }

  resetChartSize() {
    if (this.chartContainer && this.chart) {
      const width = this.chartContainer.offsetWidth
      const height = this.chartContainer.offsetHeight
      this.chart.resize(width, height)
    }
  }
}
</script>

<style scoped lang="scss">
.mobile-area-line-chart {
  .chart-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;

    .header-left {
      font-size: 16px;
      font-weight: 400;
      color: var(--mc-text-color-white);
      line-height: 28px;
      height: 28px;
    }

    .header-right {
      width: 68%;
    }
  }

  .area-line-container {
    width: 100%;
    height: 100%;
  }
}
</style>

<style lang="scss">
.mobile-area-chart-tooltip {
  top: 0;
  position: absolute;
  font-size: 12px;
  z-index: 1;
  pointer-events: none;
  color: var(--mc-text-color-white);

  .value {
    font-size: 24px;
    font-weight: 400;
  }

  .value-change {
    font-size: 16px;
    margin-left: 4px;
    font-weight: 400;
  }

  .up-color {
    color: var(--mc-color-blue);
  }

  .down-color {
    color: var(--mc-color-orange);
  }
}
</style>
