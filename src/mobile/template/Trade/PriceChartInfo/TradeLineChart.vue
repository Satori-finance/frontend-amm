<template>
  <div class="trade-line-chart">
    <div class="mc-loading" v-if="loading">
      <van-skeleton title :row="10" :loading="loading"></van-skeleton>
    </div>
    <div style="display: none;">
      <div class="trade-line-chart-tooltip" ref="toolTip" :class="{ 'none': !chartMouseInContainer || !mouseSelectValue }">
        <template v-if="chartMouseInContainer && mouseSelectValue">
          <div class="tooltip-container">
            <div class="time">{{ mouseSelectTime }}</div>
            <div class="value" :class="{
            'positive': mouseSelectValue && Number(mouseSelectValue)>0,
            'negative': mouseSelectValue && Number(mouseSelectValue)<0
            }">
              <template v-if="mouseSelectValue">{{ mouseSelectValue }}%</template>
              <template v-else>--</template>
            </div>
          </div>
        </template>
      </div>
      <div class="trade-line-chart-value-panel" ref="valuePanel" :class="{ 'none': chartMouseInContainer }">
        <template v-if="!chartMouseInContainer">
          <div class="title">
            <template v-if="chartViewType==='8hRate'">{{ $t('tradeCharts.current8HRate') }}</template>
            <template v-if="chartViewType==='annualized'">{{ $t('tradeCharts.currentAnnualized') }}</template>
          </div>
          <div class="value" :class="{
            'positive': lastItemValue && Number(lastItemValue)>0,
            'negative': lastItemValue && Number(lastItemValue)<0
          }">
            <template v-if="lastItemValue && Number(lastItemValue)>0">+ </template>
            <template v-if="lastItemValue">{{ lastItemValue }}%</template>
            <template v-else>--</template>
          </div>
        </template>
      </div>
    </div>
    <div class="trade-line-container" v-show="!loading" ref="tradeLineChartContainer">
      <div ref="tradeLineChart"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Ref, Prop, Watch } from 'vue-property-decorator'
import { McLoading } from '@/components'
import { TradeLineChartMixin } from '@/template/components/TradeChart/TradeLineChartMixin'
import elementResizeDetectorMaker from 'element-resize-detector'

@Component({
  components: {
    McLoading
  }
})
export default class TradeLineChart extends Mixins(TradeLineChartMixin) {
  @Prop({ required: true }) selectedPerpetualId !: string | null
  @Ref('toolTip') toolTipRef !: HTMLElement
  @Ref('valuePanel') valuePanelRef !: HTMLElement
  @Ref('tradeLineChartContainer') tradeLineChartContainer !: HTMLDivElement

  private erd: elementResizeDetectorMaker.Erd | null = null

  mounted() {
    this.initialChart()
    this.chartContainer.style.position = 'relative'
    this.chartContainer.appendChild(this.toolTipRef)
    this.chartContainer.appendChild(this.valuePanelRef)
    this.onMouseMoveCallBackTooltipFunc()
    // watch window change
    this.erd = elementResizeDetectorMaker()
    if (this.erd) {
      this.erd.listenTo(this.tradeLineChartContainer, (el) => {
        this.resetChartSize()
      })
    }
  }

  beforeDestroy() {
    if (this.erd) {
      this.erd.removeListener(this.tradeLineChartContainer, () =>{})
    }
  }

  setToolOffset(top: number, left: number) {
    this.toolTipRef.style.top = `${top}px`
    this.toolTipRef.style.left = `${left}px`
  }

  onMouseMoveCallBackTooltipFunc() {
    this.mouseMoveCallBackTooltipFunc = () => {
      // chart size
      const canvasItems = this.chartContainer.getElementsByTagName('canvas')
      if (canvasItems.length === 0 || !this.toolTipRef || !this.lineSeries) {
        this.setToolOffset(0, 0)
        return
      }
      const tooltipMargin: number = 8
      const chartHeight = canvasItems[0].clientHeight
      const chartWidth = canvasItems[0].clientWidth
      const tooltipHeight = this.toolTipRef.offsetHeight
      const tooltipWidth = this.toolTipRef.offsetWidth

      const coordinate = this.lineSeries.priceToCoordinate(Number(this.mouseSelectValue))
      let shiftedCoordinate = this.pointCoordinate.x - (tooltipWidth/2)
      if (coordinate === null) {
        return
      }

      shiftedCoordinate = Math.max(0, Math.min(chartWidth - tooltipWidth, shiftedCoordinate))
      shiftedCoordinate = this.pointCoordinate.x + tooltipWidth > chartWidth ? chartWidth - tooltipWidth : shiftedCoordinate

      const coordinateY = coordinate - tooltipHeight - tooltipMargin > 0 ? coordinate - tooltipHeight - tooltipMargin :
        Math.max(0, Math.min(chartHeight - tooltipHeight - tooltipMargin, coordinate + tooltipMargin))
      const top = coordinateY
      const left = shiftedCoordinate
      this.setToolOffset(top, left)
    }
  }

  resetChartSize() {
    if (this.tradeLineChartContainer && this.chart) {
      const width = this.tradeLineChartContainer.offsetWidth
      const height = this.tradeLineChartContainer.clientHeight
      this.chart.resize(width, height)
    }
  }

  @Watch('selectedPerpetualId')
  onSelectedPerpetualIdChanged() {
    this.resetChart()
    this.resetChartSize()
  }

  @Watch('activeDateRadio')
  @Watch('chartViewType')
  onResetChartToUpdateSize() {
    this.resetChartSize()
  }
}
</script>

<style lang="scss" scoped>
.trade-line-chart {
  height: 100%;

  .trade-line-container {
    height: 100%;
  }
  .mc-loading {
    padding: 16px;
    height: 100%;
    line-height: 100%;
  }
}
</style>

<style lang="scss">
.current-value-panel {

}
</style>

<style lang="scss">
.trade-line-chart-value-panel {
  &.none {
    display: none;
  }

  top: 11%;
  width: 100%;
  text-align: center;
  position: absolute;
  z-index: 10;
  pointer-events: none;

  .title {
    font-size: 14px;
    color: var(--mc-text-color);
  }

  .value {
    font-size: 20px;
    margin-top: 4px;
    color: var(--mc-text-color-white);

    &.positive {
      color: var(--mc-color-blue);
    }

    &.negative {
      color: var(--mc-color-orange);
    }
  }
}
</style>

<style lang="scss">
.trade-line-chart-tooltip {
  position: absolute;
  z-index: 10;
  pointer-events: none;
  background: var(--mc-color-primary-gradient);
  padding: 1px;
  border-radius: var(--mc-border-radius-l);

  &.none {
    display: none;
  }

  .tooltip-container {
    padding: 16px;
    background: var(--mc-background-color-darkest);
    border: 1px solid var(--mc-border-color);
    border-radius: var(--mc-border-radius-l);

    .time {
      font-size: 14px;
      color: var(--mc-text-color);
      line-height: 20px;
    }

    .value {
      margin-top: 4px;
      font-size: 20px;
      line-height: 24px;

      &.positive {
        color: var(--mc-color-blue);
      }

      &.negative {
        color: var(--mc-color-orange);
      }
    }
  }
}
</style>
