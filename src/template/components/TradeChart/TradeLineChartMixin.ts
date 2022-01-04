import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator'
import {
  BarPrice,
  BusinessDay,
  ChartOptions,
  createChart,
  CrosshairMode,
  DeepPartial,
  IChartApi,
  ISeriesApi,
  LineData,
  LineSeriesPartialOptions,
  LineStyle,
  MouseEventParams,
  PriceFormat,
  PriceLineOptions,
  PriceScaleMode,
  TickMarkType,
  Time,
  UTCTimestamp,
} from 'lightweight-charts'
import moment from 'moment'
import { timestampFormat } from '@/components/Chart/chart'
import { toBigNumber } from '@/utils'

function defaultChartSize () {
  return { width: 792, height: 300 }
}

export type TradeLineChartDataCallFunc = () => Promise<LineData[]>

export interface TradeLineChartDataCallGroup {
  label: string
  value: string
  dataCall: TradeLineChartDataCallFunc
  dataType: 'hour' | 'minute'
}

const createChartOptions: DeepPartial<ChartOptions> = {
  layout: {
    backgroundColor: '#12182C',
    textColor: '#999897',
    fontSize: 12,
  },
  grid: {
    vertLines: {
      visible: false,
    },
    horzLines: {
      visible: false,
    },
  },
  crosshair: {
    mode: CrosshairMode.Normal,
    vertLine: {
      color: '#999897',
      labelBackgroundColor: '#373F5C',
    },
    horzLine: {
      color: '#999897',
      labelBackgroundColor: '#373F5C',
    },
  },
  timeScale: {
    borderVisible: true,
    visible: true,
    secondsVisible: true,
    borderColor: '#242D43'
  },
  rightPriceScale: {
    visible: true,
    borderVisible: true,
    mode: PriceScaleMode.Normal,
    borderColor: '#242D43',
    alignLabels: false
  }
}

const lineSeriesPartialOptions: LineSeriesPartialOptions = {
  color: '#27A2F8',
  lineStyle: 0,
  lineWidth: 2,
  crosshairMarkerVisible: true,
  crosshairMarkerRadius: 4,
  lineType: 0,
  crosshairMarkerBackgroundColor: '#FFFFFF',
  crosshairMarkerBorderColor: '#12182C',
  priceLineVisible: false,
  lastValueVisible: false
}

const priceLineOptions: PriceLineOptions = {
  price: 0,
  color: '#555D7A',
  lineWidth: 1,
  lineStyle: LineStyle.Dotted,
  axisLabelVisible: false,
  title: '',
}

const defaultPointCoordinate = {
  x: 0,
  y: 0
}

@Component
export class TradeLineChartMixin extends Vue {
  @Prop({ required: false, default: defaultChartSize }) chartSize !: { width: number, height: number }
  @Prop({ required: true }) dataCallRadioGroup!: TradeLineChartDataCallGroup[]
  @Prop({ required: true }) activeDateRadio!: string
  @Prop({ required: true, default: '8hRate' }) chartViewType !: '8hRate' | 'annualized'
  @Ref('tradeLineChart') chartContainer!: HTMLDivElement

  mounted() {
    this.createChartOptions = createChartOptions
    this.lineSeriesPartialOptions = this.seriesPartialOptions
  }

  get chartPriceFormat(): PriceFormat {
    if (this.chartViewType === '8hRate') {
      return  {
        type: 'percent',
        precision: 6,
        minMove: 0.000005
      }
    }
    return {
      type: 'percent',
      precision: 5,
      minMove: 1
    }
  }

  get seriesPartialOptions(): LineSeriesPartialOptions {
    return {
      ...lineSeriesPartialOptions,
      priceFormat: this.chartPriceFormat
    }
  }

  protected valueDecimals = 5

  // options configuration
  protected createChartOptions: DeepPartial<ChartOptions> = {}
  protected lineSeriesPartialOptions: LineSeriesPartialOptions = {}

  protected chart: IChartApi | null = null
  protected lineSeries: ISeriesApi<'Line'> | null = null
  protected loading: boolean = false

  protected chartDatas: LineData[] = []

  protected mouseSelectValue: string = ''
  protected mouseSelectTime: string = ''
  protected lastRowChartData: LineData | null = null

  protected chartMouseInContainer: boolean = false

  protected pointCoordinate = {
    x: 0,
    y: 0
  }

  protected mouseMoveCallBackTooltipFunc: Function | null = null

  beforeDestroy() {
    this.chart!.remove()
  }

  get lang(): string {
    return this.$i18n.locale
  }

  get activeDateRadioCallFunc(): TradeLineChartDataCallFunc | null {
    if (this.dataCallRadioGroup.length === 0) return null
    for (let i = 0; i < this.dataCallRadioGroup.length; i++) {
      const radioItem = this.dataCallRadioGroup[i]
      if (this.activeDateRadio === radioItem.value) {
        return radioItem.dataCall
      }
    }
    return null
  }

  initialChart(isInitData: boolean = true) {
    if (!this.chartContainer) {
      return
    }
    const createChartDefaultOptions = this.getCreateChartDefaultOptions()
    this.chart = createChart(this.chartContainer, createChartDefaultOptions)

    this.lineSeries = this.chart.addLineSeries(this.lineSeriesPartialOptions)

    this.chart.subscribeCrosshairMove((param: MouseEventParams) => {
      this.computeChartMouseMoveData(param)
    })
    if (isInitData) {
      this.getChartData()
    }
  }

  createZeroLine() {
    if (!this.lineSeries) {
      return
    }
    this.lineSeries.createPriceLine(priceLineOptions)
  }

  getCreateChartDefaultOptions(): DeepPartial<ChartOptions> {
    return {
      ...this.createChartOptions,
      width: this.chartSize.width,
      height: this.chartSize.height,
      localization: {
        locale: this.lang,
        timeFormatter: (time: BusinessDay | UTCTimestamp): string => {
          const newTime = time as UTCTimestamp
          return moment.unix(newTime).local().format('llll')
        },
        priceFormatter: (priceValue: BarPrice) => {
          return `${toBigNumber(priceValue).toFixed(this.valueDecimals)}%`
        },
      },
      timeScale: {
        ...this.createChartOptions.timeScale,
        tickMarkFormatter: (newTime: UTCTimestamp, tickMarkType: TickMarkType, locale: string): string => {
          // different time granularity, custom format
          return moment.unix(newTime).local().format('MM/DD HH:mm')
        },
      },
    }
  }

  get lastItemValue(): string | null  {
    if (!this.lastRowChartData) {
      return null
    }
    return toBigNumber((this.lastRowChartData as LineData).value).toFixed(this.valueDecimals)
  }

  computeChartMouseMoveData(param: MouseEventParams) {
    // mouse leave container
    if (param.point === undefined) {
      this.chartMouseInContainer = false
      this.pointCoordinate = defaultPointCoordinate
      return
    }
    this.chartMouseInContainer = true
    // Mouse in chart container, but is null
    if (param.time === undefined || !param.point) {
      this.mouseSelectTime = ''
      this.mouseSelectValue = ''
      this.pointCoordinate = defaultPointCoordinate
      return
    }
    const newParams = param as any
    const timestamp = newParams.time as number
    this.mouseSelectTime = timestampFormat(timestamp)
    if (newParams.seriesPrices.size === 0) {
      this.mouseSelectValue = ''
    } else {
      const value = newParams.seriesPrices.get(this.lineSeries) as number
      this.mouseSelectValue = toBigNumber(value).toFixed(this.valueDecimals)
    }
    if (this.mouseMoveCallBackTooltipFunc) {
      this.mouseMoveCallBackTooltipFunc()
    }
    this.pointCoordinate = {
      x: param.point.x,
      y: param.point.y
    }
  }

  setTimeAxisRange(data: LineData[]) {
    if (!this.chart || data.length === 0) return
    const formItem = data[0]
    const toItem = data[data.length - 1]
    this.chart.timeScale().setVisibleRange({ from: formItem.time, to: toItem.time })
  }

  @Watch('activeDateRadioCallFunc', { immediate: true, deep: true })
  async getChartData() {
    if (!this.lineSeries || !this.dataCallRadioGroup || !this.chart) {
      return
    }
    this.loading = true
    this.resetSeries()
    this.lastRowChartData = null
    this.chart.applyOptions(this.getCreateChartDefaultOptions())
    try {
      const callFunc = this.activeDateRadioCallFunc
      if (!callFunc) return
      let chartData = await callFunc()
      if (!this.chartContainer) {
        this.chart!.remove()
        return
      }
      if (chartData.length === 0) {
        const currentTimestamp = Date.parse(new Date().toUTCString()) / 1000
        chartData = [{ time: currentTimestamp as Time, value: 0 }]
      }
      this.chartDatas = chartData
      this.updateChartData()
    } catch (e) {
      console.warn('get area line chart data failed,', e)
    }
    this.loading = false
  }

  updateChartData() {
    if (!this.lineSeries) {
      return
    }
    const chartDatas = this.chartDatas.map((item: LineData) => {
      const newItem = item as LineData
      const v = Number(newItem.value.toString())
      return {
        ...newItem,
        value: this.chartViewType === '8hRate' ? v : this.computeAnnualizedValue(v)
      }
    })
    this.lineSeries.setData(chartDatas)
    this.lastRowChartData = chartDatas[chartDatas.length - 1]
    this.setTimeAxisRange(chartDatas)
    this.createZeroLine()
  }

  computeAnnualizedValue(v: number): number {
    return v * 3 * 365
  }

  resetSeries() {
    if (this.chart && this.lineSeries && this.chartContainer) {
      this.chart.removeSeries(this.lineSeries)
      this.lineSeries = this.chart.addLineSeries(this.lineSeriesPartialOptions)
    }
  }

  resetChart(isInitData: boolean = true) {
    if (this.chart && this.chartContainer) {
      this.chart.remove()
    }
    this.initialChart(isInitData)
  }

  @Watch('lang')
  onLangChanged() {
    this.resetChart()
  }

  @Watch('chartViewType')
  onChartViewTypeChanged() {
    this.resetChart(false)
    this.updateChartData()
  }
}
