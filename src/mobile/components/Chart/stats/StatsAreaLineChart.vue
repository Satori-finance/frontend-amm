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
        <span v-if="viewLatestValue">
          <span v-if="unitPosition==='left'">{{ unit }}</span>
            {{ viewLatestValue }}
          <span v-if="unitPosition==='right'">{{ unit }}</span>
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
import { areaLineSeriesPartialOptions, createChartOptions } from '../chartOptions'
import McMRadioGroup from '../../RadioGroup.vue'
import elementResizeDetectorMaker from 'element-resize-detector'
import { StatsAreaLineChartMixin } from '@/components/Chart/stats/statsAreaLineChartMixin'

@Component({
  components: {
    McMRadioGroup,
  }
})
export default class StatsAreaLineChart extends Mixins(StatsAreaLineChartMixin) {
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
    margin-bottom: 4px;
    align-items: center;

    .header-left {
      font-size: 14px;
      font-weight: 400;
      color: var(--mc-text-color);
      line-height: 20px;
    }

    .header-right {
      height: 32px;
      width: 66%;

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

  .area-line-container {
    width: 100%;
    height: 100%;
  }

  .van-skeleton {
    margin-top: 28px;
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
    font-size: 32px;
    line-height: 40px;
    font-weight: 700;
  }

  .value-change {
    font-size: 16px;
    margin-left: 4px;
    font-weight: 400;
  }
}
</style>
