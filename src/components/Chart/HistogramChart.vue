<template>
  <div class="histogram-chart">
    <div class="histogram-header">
      <div class="header-left">
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
        <div class="time">{{ mouseSelectTime }}</div>
      </div>
      <div class="header-right">
        <el-radio-group v-model="activeDateRadio" size="medium">
          <el-radio-button :label="item.value" v-if="dataCallRadioGroup.length>1"
                           v-for="(item, index) in dataCallRadioGroup" :key="index">
            {{ item.label }}
          </el-radio-button>
        </el-radio-group>
      </div>
    </div>
    <div class="mc-loading" :style="{width: `${chartSize.width}px`, height: `${chartSize.height}px`}" v-if="loading">
      <McLoading :show-loading="loading" :min-show-time="0" maskColor="unset"></McLoading>
    </div>
    <div class="histogram-container" v-show="!loading">
      <div ref="histogramChart"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins,  } from 'vue-property-decorator'
import { McLoading } from '@/components'
import { HistogramChartMixin } from './histogramChartMixin'
import {
  histogramSeriesPartialOptions,
  createChartOptions
} from './chartOptions'

@Component({
  components: {
    McLoading
  }
})
export default class HistogramChart extends Mixins(HistogramChartMixin) {
  created () {
    this.histogramSeriesPartialOptions = histogramSeriesPartialOptions
    this.createChartOptions = createChartOptions
  }

  mounted() {
    this.initialChart()
  }
}
</script>

<style lang="scss" scoped>
.histogram-chart {

  .histogram-header {
    display: flex;
    justify-content: space-between;
    height: 50px;

    .header-left {
      color: var(--mc-text-color-white);

      .value {
        font-size: 18px;
        font-weight: 700;
      }

      .time {
        margin-top: 10px;
        font-size: 13px;
        font-weight: 400;
      }

      .value-change {
        font-size: 16px;
        margin-left: 10px;
        font-weight: 400;
      }

      .up-color {
        color: var(--mc-color-blue);
      }

      .down-color {
        color: var(--mc-color-orange);
      }
    }

    .header-right {
      text-align: center;
      margin-right: 18px;

      ::v-deep .el-radio-group {
        .el-radio-button {
          margin: 0 2px;
          width: 48px;

          .el-radio-button__inner {
            width: 100%;
            padding: 0;
            text-align: center;
            font-size: 12px;
            font-weight: 400;
            border-radius: 4px;
            height: 28px;
            line-height: 28px;
          }
        }
      }
    }
  }

  .mc-loading {
    height: 100%;
    line-height: 100%;
  }
}
</style>
