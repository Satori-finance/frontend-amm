import { Component, Mixins, Watch } from 'vue-property-decorator'
import Widget from './widget'
import {
  formatPrice,
  getLocalStorage,
  setLocalStorage,
} from '@/utils'
import moment from 'moment-timezone'
import { BackendOraclePriceStruct, OraclePrice, TradePrice } from '@/type'
import { backendOracleServiceStatus, queryCandle, queryCandleFromBackend } from '@/api/candle'
import * as _ from 'lodash'
import BigNumber from 'bignumber.js'
import { ErrorHandlerMixin, SelectedPerpetualMixin } from '@/mixins'
import { ResolutionString } from '@/@types/tradingview'

const graphQueryBatch = 1000
const backendQueryBatch = 1500
const maxBatch = 5
const intervalReloadChart = 10 * 60  // 10 minute
const chartConfigureKey = "dex3-price-chart.v1"

@Component
export default class PriceChartMixin extends Mixins(SelectedPerpetualMixin, ErrorHandlerMixin) {
  private oracleChartServerIsNormal: boolean = true

  protected isMobile: boolean = false
  protected showChart = false
  protected widget: Widget | null = null

  // page store
  protected latestChartLineData: TradingView.Bar | null = null

  mounted() {
    window.addEventListener("beforeunload", () => {
      this.saveChartState()
    })

    this.initWidget()
  }

  destroyed() {
    // showChart is true === chart loading to false
    this.showChart = true
  }

  beforeDestroy() {
    this.saveChartState()
    this.widget?.onDestroyed()
  }

  get isInverse() {
    return !!this.selectedPerpetualProperty?.isInverse
  }

  get locale() {
    return this.$i18n.locale
  }

  get selectedPerpetualIndexPriceStr(): string | null {
    return this.selectedPerpetualIndexPrice?.toFixed() || null
  }

  loadChartState() {
    if (this.isMobile) {
      return
    }
    const config = getLocalStorage(chartConfigureKey)
    if (!config) {
      return
    }
    this.widget?.tvWidget?.load(config)
  }

  saveChartState() {
    try {
      if (this.isMobile || !this.widget) {
        return
      }
      this.widget.tvWidget?.save(state => {
        setLocalStorage(chartConfigureKey, state)
      })
    } catch (e) {
      // ignore error
    }
  }

  setChartResolution() {
    if (!this.widget) {
      return
    }
    try {
      const savedResolution = getLocalStorage('tradingview.chart.lastUsedTimeBasedResolution', false)
      if (!savedResolution) {
        return
      }
      if (this.widget.tvWidget && this.widget.tvWidget.activeChart) {
        this.widget.tvWidget.activeChart().setResolution(savedResolution as ResolutionString, () => {})
      }
    } catch (e) {
     // ignore error
    }
  }

  get priceDecimals(): number {
    if (!this.selectedPerpetualProperty) return 1
    return this.selectedPerpetualProperty.priceFormatDecimals
  }

  getRealtimePrice(): TradingView.Bar | null {
    if (!this.selectedPerpetualIndexPrice) {
      return null
    }
    // fix Infinity
    let isInverse: boolean = this.isInverse
    if (this.selectedPerpetualIndexPrice.isZero()) {
      isInverse = false
    }
    const v = formatPrice(this.selectedPerpetualIndexPrice, isInverse).toNumber()
    let barData = {
      time: Date.now(),
      open: v,
      close: v,
      high: v,
      low: v,
    }
    if (this.latestChartLineData) {
      barData.open = this.latestChartLineData.close
      barData.low = Math.min(barData.open, v)
      barData.high = Math.max(barData.open, v)
      this.latestChartLineData = barData
    }
    return barData
  }

  @Watch('selectedPerpetualID', { immediate: true })
  private onMarketIDChange(newVal: string) {
    if (!newVal || !this.widget || !this.selectedPerpetualStorage) {
      return
    }
    this.latestChartLineData = null
    this.oracleChartServerIsNormal = true
    this.saveChartState()
    // this.widget.onMarketChanged(newVal)
    // default decimals change, restart initial chart dom
    this.initWidget()
  }

  @Watch('selectedPerpetualProperty', { immediate: true })
  private onSelectedPerpetualPropertyChange() {
    if (this.selectedPerpetualID && this.widget && this.selectedPerpetualProperty) {
      const s = this.selectedPerpetualProperty
      // chart view symbol
      const symbol = `${s.symbolStr} ${s.underlyingAssetSymbol}-${s.collateralTokenSymbol}`
      this.widget.onMarketChanged(symbol)
    }
  }

  @Watch('selectedPerpetualOracle')
  onSelectedOracleChanged() {
    if (this.selectedPerpetualOracle && this.selectedPerpetualOracle !== '') {
      this.initWidget()
    }
  }

  @Watch('oracleChartServerIsNormal')
  onOracleChartServerStatusChanged() {
    if (!this.oracleChartServerIsNormal) {
      this.initWidget()
    }
  }

  @Watch('priceDecimals')
  onPriceDecimalsChanged() {
    // default decimals change, restart initial chart dom
    this.initWidget()
  }

  @Watch('locale')
  private onLocaleChange() {
    this.initWidget()
  }

  @Watch('isInverse')
  private onInverseChange() {
    this.initWidget()
  }

  private updateRealtimePriceDebounce = _.debounce(this.updateRealtimePrice, 100)

  updateRealtimePrice() {
    if (this.latestChartLineData) {
      const nowTimestamp = Date.now()
      const diff = (nowTimestamp - this.latestChartLineData.time) / 1000
      if (diff >= intervalReloadChart) {
        this.initWidget()
        return
      }
    }
    const bar = this.getRealtimePrice()
    if (bar && this.widget) {
      this.widget.updateRealtimePrice(bar)
    }
  }

  @Watch('selectedPerpetualIndexPriceStr')
  onSelectedPerpetualIndexPriceChange() {
    this.updateRealtimePriceDebounce()
  }

  async isUseBackendOracleServer(): Promise<boolean> {
    if (!this.selectedPerpetualOracle) {
      return false
    }
    return await backendOracleServiceStatus()
  }

  async initWidget() {
    const useBackendServer = await this.isUseBackendOracleServer()

    this.widget = new Widget(this.priceDecimals, this.isMobile)
    this.widget.onChartReady = () => {
      this.loadChartState()
      this.showChart = true
    }
    const symbol = 'Default'
    const timezone = moment.tz.guess()
    // en-US => en, zh-CN => zh, ja-JP => ja, etc.
    let locale = 'en'
    if (this.locale) {
      locale = this.locale.substr(0, 2)
    }
    if (this.selectedPerpetualStorage) {
      this.widget.init('TV-chart', symbol, locale, timezone)
      if (useBackendServer && this.oracleChartServerIsNormal) {
        this.widget.setCandlesGetter(this.onBeginFetchCandlesFromBackend, this.setChartResolution)
      } else {
        this.widget.setCandlesGetter(this.onBeginFetchCandlesFromGraph, this.setChartResolution)
      }
    }
  }

  // get data from graph
  async onBeginFetchCandlesFromGraph(
    symbolInfo: TradingView.LibrarySymbolInfo,
    resolution: number,
    from: number,
    to: number,
    firstDataRequest: boolean,
    onHistoryCallback: TradingView.HistoryCallback,
    onErrorCallback: TradingView.ErrorCallback,
  ) {
    // reset
    this.hideOracleChartServerError()
    // retry later if data not ready
    if (!this.selectedPerpetualID || !this.selectedPerpetualStorage) {
      window.setTimeout(
        () => this.onBeginFetchCandlesFromGraph(symbolInfo, resolution, from, to, firstDataRequest, onHistoryCallback, onErrorCallback),
        1000
      )
      return
    }

    const { symbol, type } = this.parseTickName(symbolInfo.ticker)
    if (type === 'unknown') {
      onErrorCallback('unspported symbol')
    }
    let symbolId: string = symbol
    if (symbol) {
      symbolId = symbol.split(' ')[0]
    }
    let prices: OraclePrice[] | null = null
    try {
      let i = 0
      for (; i < maxBatch; i++) {
        const temp = await queryCandle(resolution, from, to, symbolId, this.selectedPerpetualStorage.oracle, graphQueryBatch)
        if (prices === null) {
          prices = temp.oraclePriceCandles
        } else {
          prices = prices.concat(temp.oraclePriceCandles)
        }
        if (temp.oraclePriceCandles.length < graphQueryBatch) {
          break
        }
        from = Number(temp.oraclePriceCandles[temp.oraclePriceCandles.length - 1].timestamp) + 1
      }
      if (i === maxBatch) {
        console.warn('data miss, reach max query candle batch.')
      }

      if (prices == null) {
        throw Error('no graph candle data')
      }
    } catch (err) {
      console.warn(err)
      this.showGraphServerError()
      onErrorCallback(err)
      return
    }

    // return bars
    let bars: TradingView.Bar[] = []
    if (type === 'price') {
      // this is the trading prices
      prices.forEach((val) => {
        bars.push({
          time: Number(val.timestamp) * 1000,
          open: formatPrice(val.open, this.isInverse).toNumber(),
          close: formatPrice(val.close, this.isInverse).toNumber(),
          low: formatPrice(val.low, this.isInverse).toNumber(),
          high: formatPrice(val.high, this.isInverse).toNumber(),
          // volume: this.getTradeVolume(data.tradePriceCandles, val.timestamp as string)
        })
      })
    }

    // callback
    let noData = bars.length === 0 // noData should be set if there is no data in the requested period
    this.updateLatestChartLineData(bars)
    onHistoryCallback(bars, { noData })
  }

  async onBeginFetchCandlesFromBackend(
    symbolInfo: TradingView.LibrarySymbolInfo,
    resolution: number,
    from: number,
    to: number,
    firstDataRequest: boolean,
    onHistoryCallback: TradingView.HistoryCallback,
    onErrorCallback: TradingView.ErrorCallback,
  ) {
    // retry later if data not ready
    if (!this.selectedPerpetualID || !this.selectedPerpetualStorage) {
      window.setTimeout(
        () => this.onBeginFetchCandlesFromBackend(symbolInfo, resolution, from, to, firstDataRequest, onHistoryCallback, onErrorCallback),
        1000
      )
      return
    }
    const { symbol, type } = this.parseTickName(symbolInfo.ticker)
    if (type === 'unknown') {
      onErrorCallback('unspported symbol')
    }
    let prices: BackendOraclePriceStruct[] | null = null
    try {
      let i = 0
      for (; i < maxBatch; i++) {
        const temp = await queryCandleFromBackend(resolution, from, to, this.selectedPerpetualStorage.oracle)
        if (prices === null) {
          prices = temp.candles
        } else {
          prices = prices.concat(temp.candles)
        }
        if (temp.candles.length < backendQueryBatch) {
          break
        }
        from = Number(temp.candles[temp.candles.length - 1].timestamp) + 1
      }
      if (i === maxBatch) {
        console.warn('data miss, reach max query candle batch.')
      }

      if (prices == null) {
        throw Error('no graph candle data')
      }
      this.hideOracleChartServerError()
      this.oracleChartServerIsNormal = true
    } catch (err) {
      console.warn(err)
      this.showOracleChartServerError()
      this.oracleChartServerIsNormal = false
      onErrorCallback(err)
      return
    }

    // return bars
    let bars: TradingView.Bar[] = []
    if (type === 'price') {
      // this is the trading prices
      prices.forEach((val) => {
        bars.push({
          time: Number(val.timestamp) * 1000,
          open: formatPrice(val.open, this.isInverse).toNumber(),
          close: formatPrice(val.close, this.isInverse).toNumber(),
          low: formatPrice(val.low, this.isInverse).toNumber(),
          high: formatPrice(val.high, this.isInverse).toNumber(),
        })
      })
    }

    // callback
    let noData = bars.length === 0 // noData should be set if there is no data in the requested period
    this.updateLatestChartLineData(bars)
    onHistoryCallback(bars, { noData })
  }

  updateLatestChartLineData(data: TradingView.Bar[]) {
    const maxData = _.maxBy(data, 'time')
    if (!this.latestChartLineData && maxData) {
      this.latestChartLineData = maxData
      return
    }
    if (maxData && this.latestChartLineData) {
      if (maxData.time > this.latestChartLineData.time) {
        this.latestChartLineData = maxData
      }
    }
  }

  parseTickName(name: string | undefined): { symbol: string, type: 'price' | 'index' | 'unknown' } {
    if (typeof name === 'undefined') {
      return { symbol: '', type: 'unknown' }
    }
    const parts = name.split('#', 2)
    if (parts[1] === 'Index') {
      return { symbol: parts[0].toLowerCase(), type: 'index' }
    }
    return { symbol: parts[0].toLowerCase(), type: 'price' }
  }

  getTradeVolume(tradeData: TradePrice[], timestamp: string): number {
    const tradeItem = _.find(tradeData, (v) => {
      return v.timestamp as string === timestamp
    })
    if (typeof tradeItem === 'undefined') {
      return 0
    }
    return (tradeItem.volume as BigNumber).toNumber()
  }
}
