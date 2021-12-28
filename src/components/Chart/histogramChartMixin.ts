import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator'
import {
  _NORMAL_DECIMALS,
  defaultChartSize,
  LightChartDataCallFunc,
  LightDataCallRadioGroup,
  priceFormatter,
  priceNormalFormatter,
  priceTitleFormatter,
  timestampFormat,
} from '@/components/Chart/chart'
import {
  BarPrice,
  BusinessDay,
  ChartOptions,
  createChart,
  DeepPartial,
  HistogramSeriesPartialOptions,
  IChartApi,
  ISeriesApi,
  LineData,
  MouseEventParams,
  TickMarkType,
  Time,
  UTCTimestamp,
  WhitespaceData,
} from 'lightweight-charts'
import BigNumber from 'bignumber.js'
import moment from 'moment'
import _ from 'lodash'
import { toBigNumber } from '@/utils'

@Component
export class HistogramChartMixin extends Vue {
  @Prop({ required: false, default: defaultChartSize }) chartSize !: { width: number, height: number }
  @Prop({ default: '#0A1024' }) chartBackgroundColor !: string
  @Prop({ required: false, default: 'right' }) unitPosition!: 'left' | 'right'
  @Prop({ default: false }) isPriceFormatter!: boolean
  @Prop({ default: false }) isFormHeaderPrice !: boolean
  @Prop({ default: _NORMAL_DECIMALS }) defaultPriceDecimals!: number
  @Prop({ default: false }) showValueChange !: boolean
  @Prop({ default: false }) isShowPriceUnit!: boolean
  @Prop({ required: true }) unit!: string
  @Prop({ required: true }) defaultRadio!: string
  @Prop({ required: true }) dataCallRadioGroup!: LightDataCallRadioGroup[]
  @Ref('histogramChart') chartContainer!: HTMLDivElement

  private defaultChartNumber: number = 15

  // options configuration
  protected createChartOptions: DeepPartial<ChartOptions> = {}
  protected histogramSeriesPartialOptions: HistogramSeriesPartialOptions = {}

  protected chart: IChartApi | null = null
  protected histogramSeries: ISeriesApi<'Histogram'> | null = null
  protected loading: boolean = true

  protected activeDateRadio: string = this.defaultRadio
  protected chartDatas: LineData[] = []

  protected mouseSelectValue: string = ''
  protected mouseSelectTime: string = ''
  protected valueChangeRate: BigNumber | null = new BigNumber(0)

  protected lastRowChartData: LineData | WhitespaceData | null = null

  beforeDestroy() {
    this.chart!.remove()
  }

  get lang(): string {
    return this.$i18n.locale
  }

  get activeDateRadioCallFunc(): LightChartDataCallFunc | null {
    if (this.dataCallRadioGroup.length === 0) return null
    for (let i = 0; i < this.dataCallRadioGroup.length; i++) {
      const radioItem = this.dataCallRadioGroup[i]
      if (this.activeDateRadio === radioItem.value) {
        return radioItem.dataCall
      }
    }
    return null
  }

  get activeDateRadioDataType(): 'hour' | 'day' {
    if (this.dataCallRadioGroup.length === 0) return 'day'
    for (let i = 0; i < this.dataCallRadioGroup.length; i++) {
      const radioItem = this.dataCallRadioGroup[i]
      if (this.activeDateRadio === radioItem.value) {
        return radioItem.dataType
      }
    }
    return 'day'
  }

  initialChart() {
    if (!this.chartContainer) {
      return
    }
    const createChartDefaultOptions = this.getCreateChartDefaultOptions()
    this.chart = createChart(this.chartContainer, createChartDefaultOptions)

    this.histogramSeries = this.chart.addHistogramSeries(this.histogramSeriesPartialOptions)

    this.chart.subscribeCrosshairMove((param: MouseEventParams) => {
      this.computeChartMouseMoveData(param)
    })

    this.getChartData()
  }

  getCreateChartDefaultOptions(): DeepPartial<ChartOptions> {
    return {
      ...this.createChartOptions,
      layout: {
        ...this.createChartOptions.layout,
        backgroundColor: this.chartBackgroundColor,
      },
      width: this.chartSize.width,
      height: this.chartSize.height,
      localization: {
        locale: this.lang,
        timeFormatter: (time: BusinessDay | UTCTimestamp): string => {
          const newTime = time as UTCTimestamp
          return moment.unix(newTime).local().format('llll')
        },
        priceFormatter: (priceValue: BarPrice) => {
          const newPrice = new BigNumber(priceValue)
          let priceString: string = ''
          if (this.isPriceFormatter) {
            priceString = priceFormatter(newPrice, this.defaultPriceDecimals)
          } else {
            priceString = priceNormalFormatter(newPrice, this.defaultPriceDecimals)
          }
          if (this.isShowPriceUnit) {
            if (this.unitPosition === 'left') {
              return `${this.unit}${priceString}`
            } else {
              return `${priceString}${this.unit}`
            }
          }
          return priceString
        },
      },
      timeScale: {
        ...this.createChartOptions.timeScale,
        tickMarkFormatter: (newTime: UTCTimestamp, tickMarkType: TickMarkType, locale: string): string => {
          // different time granularity, custom format
          let DATETIME_FORMAT_PARSE = 'MM-DD'
          if (this.activeDateRadioDataType === 'hour') {
            DATETIME_FORMAT_PARSE = 'MM/DD HH:mm'
          }
          return moment.unix(newTime).local().format(DATETIME_FORMAT_PARSE)
        },
      },
    }
  }

  computeValueChangeRate(selectedTimestamp: number) {
    const index = _.findIndex(this.chartDatas, (o) => {
      return Number(o.time) === selectedTimestamp
    })
    if (index <= 0) {
      this.valueChangeRate = new BigNumber(0)
      return
    }
    const currentData = this.chartDatas[index] as any
    const currentValue = toBigNumber(currentData.value)
    let previousData = this.chartDatas[index - 1] as any
    if (this.activeDateRadioDataType === 'hour') {
      previousData = this.getHourLevelPrevious24HData(index)
    }
    let previousValue = toBigNumber(previousData.value)
    if (previousValue.isZero()) {
      this.valueChangeRate = new BigNumber(0)
      return
    }
    this.valueChangeRate = currentValue
      .minus(previousValue)
      .div(previousValue)
      .times(100)
  }

  viewDefaultValue() {
    if (!this.lastRowChartData) {
      this.mouseSelectTime = ''
      this.mouseSelectValue = ''
      return
    }
    const lastItem = this.lastRowChartData as LineData
    const timestamp = Number(lastItem.time.toString())
    this.mouseSelectTime = timestampFormat(timestamp)
    this.mouseSelectValue = this.formatMouseSelectValue(new BigNumber(lastItem.value))
    if (this.showValueChange) {
      this.computeValueChangeRate(timestamp)
    }
  }

  computeChartMouseMoveData(param: MouseEventParams) {
    // mouse leave container
    if (param.point === undefined) {
      this.viewDefaultValue()
      return
    }
    // Mouse in chart container, but is null
    if (param.time === undefined) {
      this.mouseSelectTime = ''
      this.mouseSelectValue = ''
      return
    }
    const newParams = param as any
    const timestamp = newParams.time as number
    this.mouseSelectTime = timestampFormat(timestamp)
    if (newParams.seriesPrices.size === 0) {
      this.mouseSelectValue = ''
    } else {
      const price = newParams.seriesPrices.get(this.histogramSeries) as number
      this.mouseSelectValue = this.formatMouseSelectValue(new BigNumber(price))
    }
    if (this.showValueChange) {
      // this.computeValueChangeRate(timestamp)
      this.valueChangeRate = null
    }
  }

  formatMouseSelectValue(val: BigNumber): string {
    if (this.isFormHeaderPrice) {
      return priceFormatter(val, this.defaultPriceDecimals)
    }
    return priceTitleFormatter(val, this.defaultPriceDecimals)
  }

  setTimeAxisRange(data: LineData[]) {
    if (!this.chart || data.length === 0) return
    let formIndex: number
    let toIndex: number
    if (data.length >= this.defaultChartNumber) {
      formIndex = data.length-1-15
      toIndex = data.length - 1
    } else {
      const diffLen = this.defaultChartNumber - data.length
      formIndex = 0 - (diffLen / 2)
      toIndex = data.length + (diffLen / 2)
      if (diffLen % 2 !== 0) {
        formIndex -= 1
      }
    }
    this.chart.timeScale().setVisibleLogicalRange({ from: formIndex, to: toIndex })
  }

  getHourLevelPrevious24HData(index: number): LineData | WhitespaceData {
    const newChartData = this.chartDatas.slice(0, index)
    let previousData = newChartData[newChartData.length - 1]
    if (newChartData.length < 24) {
      previousData = this.chartDatas[0] as any
    } else {
      previousData = newChartData[newChartData.length - 24] as any
    }
    return previousData
  }

  @Watch('defaultPriceDecimals')
  onDefaultPriceDecimals() {
    if (!this.chart) return
    this.chart.applyOptions(this.getCreateChartDefaultOptions())
  }

  @Watch('activeDateRadioCallFunc', { immediate: true, deep: true })
  async getChartData() {
    if (!this.histogramSeries || !this.dataCallRadioGroup || !this.chart) {
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
      chartData = chartData.map((item: LineData | WhitespaceData) => {
        const newItem = item as LineData
        return {
          ...newItem,
          value: Number(newItem.value.toString())
        }
      })
      this.histogramSeries.setData(chartData)
      this.lastRowChartData = chartData[chartData.length - 1]
      this.setTimeAxisRange(chartData)
      this.viewDefaultValue()
    } catch (e) {
      console.warn('get area line chart data failed,', e)
    }
    this.loading = false
  }

  resetSeries() {
    this.mouseSelectValue = ''
    this.mouseSelectTime = ''
    if (this.chart && this.histogramSeries && this.chartContainer) {
      this.chart.removeSeries(this.histogramSeries)
      this.histogramSeries = this.chart.addHistogramSeries(this.histogramSeriesPartialOptions)
    }
  }

  resetChart() {
    if (this.chart && this.chartContainer) {
      this.chart.remove()
    }
    this.initialChart()
  }

  @Watch('lang')
  onLangChanged() {
    this.resetChart()
  }
}
