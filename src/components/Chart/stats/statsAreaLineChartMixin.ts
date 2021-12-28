import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator'
import {
  _NORMAL_DECIMALS,
  defaultChartSize,
  LightChartDataCallFunc,
  LightDataCallRadioGroup,
  priceFormatter,
  priceNormalFormatter,
  priceTitleFormatter,
} from '@/components/Chart/chart'
import {
  AreaSeriesPartialOptions,
  BarPrice,
  BusinessDay,
  ChartOptions,
  createChart,
  DeepPartial,
  IChartApi,
  ISeriesApi,
  LineData,
  TickMarkType,
  Time,
  UTCTimestamp,
  WhitespaceData,
} from 'lightweight-charts'
import BigNumber from 'bignumber.js'
import moment from 'moment'

@Component
export class StatsAreaLineChartMixin extends Vue {
  @Prop({ required: false, default: defaultChartSize }) chartSize !: { width: number, height: number }
  @Prop({ default: '#0A1024' }) chartBackgroundColor !: string
  @Prop({ required: false, default: 'right' }) unitPosition!: 'left' | 'right'
  @Prop({ default: false }) isPriceFormatter!: boolean
  @Prop({ default: false }) isFormHeaderPrice !: boolean
  @Prop({ default: _NORMAL_DECIMALS }) defaultPriceDecimals!: number
  @Prop({ default: false }) isShowPriceUnit!: boolean
  @Prop({ required: true }) unit!: string
  @Prop({ required: true }) defaultRadio!: string
  @Prop({ required: true }) dataCallRadioGroup!: LightDataCallRadioGroup[]
  @Prop({ required: true }) latestValue !: BigNumber | null
  @Ref('areaLineChart') chartContainer!: HTMLDivElement

  // options configuration
  protected createChartOptions: DeepPartial<ChartOptions> = {}
  protected areaLineSeriesPartialOptions: AreaSeriesPartialOptions = {}

  protected chart: IChartApi | null = null
  protected areaLineSeries: ISeriesApi<'Area'> | null = null
  protected loading: boolean = true

  protected activeDateRadio: string = this.defaultRadio

  beforeDestroy() {
    this.chart!.remove()
  }

  get lang(): string {
    return this.$i18n.locale
  }

  get viewLatestValue(): string {
    if (!this.latestValue) {
      return ''
    }
    if (this.isFormHeaderPrice) {
      return priceFormatter(this.latestValue, this.defaultPriceDecimals)
    }
    return priceTitleFormatter(this.latestValue, this.defaultPriceDecimals)
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

    this.areaLineSeries = this.chart.addAreaSeries(this.areaLineSeriesPartialOptions)

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

  setTimeAxisRange(data: LineData[]) {
    if (!this.chart || data.length === 0) return
    const formItem = data[0]
    const toItem = data[data.length - 1]
    this.chart.timeScale().setVisibleRange({ from: formItem.time, to: toItem.time })
  }

  @Watch('defaultPriceDecimals')
  onDefaultPriceDecimals() {
    if (!this.chart) return
    this.chart.applyOptions(this.getCreateChartDefaultOptions())
  }

  @Watch('activeDateRadioCallFunc', { immediate: true, deep: true })
  async getChartData() {
    if (!this.areaLineSeries || !this.dataCallRadioGroup || !this.chart) {
      return
    }
    this.loading = true
    this.resetSeries()
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
      chartData = chartData.map((item: LineData | WhitespaceData) => {
        const newItem = item as LineData
        return {
          ...newItem,
          value: Number(newItem.value.toString())
        }
      })
      this.areaLineSeries.setData(chartData)
      this.setTimeAxisRange(chartData)
    } catch (e) {
      console.warn('get area line chart data failed,', e)
    }
    this.loading = false
  }

  resetSeries() {
    if (this.chart && this.areaLineSeries && this.chartContainer) {
      this.chart.removeSeries(this.areaLineSeries)
      this.areaLineSeries = this.chart.addAreaSeries(this.areaLineSeriesPartialOptions)
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
