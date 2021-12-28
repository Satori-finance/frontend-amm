import BigNumber from 'bignumber.js'
import { ResolutionString } from '@/@types/tradingview'

export default class Datafeed implements TradingView.IDatafeedChartApi, TradingView.IDatafeedQuotesApi {
  configuration: any
  candlesResolution: number
  onBeginFetch: Function | null
  onRealtimeCallback: TradingView.SubscribeBarsCallback | null
  decimals: number

  constructor(decimals: number) {
    this.decimals = decimals
    this.configuration = {
      // supports_search: false, *
      // supports_group_request: false, *
      // exchanges: {value, name, desc},
      // symbols_types: {name, value},
      // supported_resolutions: ['5', '15', '60', '720', '1440', '10080'],
      // supports_marks: Boolean,
      // supports_timescale_marks: Boolean,
      // supports_time: Boolean,
      // futures_regex: /[\d]*/
      supports_search: false, // Set it to true if your data feed supports symbol search and individual symbol resolve logic
      supports_group_request: false, // Set it to true if your data feed provides full information on symbol group only and is not able to perform symbol search or individual symbol resolve
      exchanges: [{ value: 'Default', name: 'Default', desc: 'Default' }],
      symbols_types: [
        { name: 'All types', value: '' },
        { name: 'Index', value: 'index' },
      ],
      supports_marks: false,
      supports_timescale_marks: false,
      supports_time: false,
      supported_resolutions: ['1', '5', '60', '1d'],
    }

    // resolution when getting candles. (seconds)
    this.candlesResolution = 60 * 15

    // onBeginFetch(
    //   symbolInfo, resolution: resolutionMinutes, from, to, firstDataRequest,
    //   successFn, // (bars, { noData: true })
    //   errorFn,   // (reason)
    // )
    this.onBeginFetch = null
    this.onRealtimeCallback = null
  }
  onReady(callback: Function) {
    setTimeout(() => callback(this.configuration), 0)
  }
  searchSymbols(
    userInput: string,
    exchange: string,
    symbolType: string,
    onResultReadyCallback: TradingView.SearchSymbolsCallback,
  ) {
    // const result = onResultReadyCallback([])
    // userInput: string, search text
    // exchange: string, symbol, can be ""
    // symbolType: string, index, stock, forex, can be ""
    // onResultReadyCallback: function(result)
  }
  resolveSymbol(
    symbolName: string,
    onSymbolResolvedCallback: TradingView.ResolveCallback,
    onResolveErrorCallback: TradingView.ErrorCallback,
  ) {
    // symbolName: string, Symbol name or ticker if provided.
    // onSymbolResolvedCallback: function(SymbolInfo)
    // onResolveErrorCallback: function(reason)
    let symbolStub: TradingView.LibrarySymbolInfo = {
      description: '',
      exchange: '',
      full_name: '',
      listed_exchange: '',
      name: symbolName,
      // description: "",
      type: 'index',
      session: '24x7',
      timezone: 'Etc/UTC', // See supported timezones list (at Symbology#timezone page) for available values
      ticker: symbolName,
      minmov: 1, // the amount of price precision steps for 1 tick
      // number of decimal places. It is 10^number-of-decimal-places
      pricescale: new BigNumber('1').shiftedBy(this.decimals).toNumber(),
      has_seconds: false,
      seconds_multipliers: [],
      has_intraday: true,
      intraday_multipliers: ['1', '5', '60', '1d'],
      has_daily: true,
      has_weekly_and_monthly: true,
      has_empty_bars: true,
      force_session_rebuild: true,
      has_no_volume: true, // true = disable volume
      supported_resolutions: [
        '1' as ResolutionString,
        // '3' as ResolutionString,
        '5' as ResolutionString,
        // '15' as ResolutionString,
        // '30' as ResolutionString,
        // '45' as ResolutionString,
        '60' as ResolutionString,
        // '120' as ResolutionString,
        // '180' as ResolutionString,
        // '240' as ResolutionString,
        '1d' as ResolutionString,
        // '1w'  as ResolutionString
      ],
      volume_precision: 8,
      data_status: 'streaming',
      format: 'price'
    }
    // if (split_data[2].match(/USD|EUR|JPY|AUD|GBP|KRW|CNY/)) {
    //     symbol_stub.pricescale = 100
    // }
    window.setTimeout(() => {
      onSymbolResolvedCallback(symbolStub)
      // this.gotoDefaultTimeFrame()
    }, 0)
  }
  getBars(
    symbolInfo: TradingView.LibrarySymbolInfo,
    resolution: TradingView.ResolutionString,
    from: number,
    to: number,
    onHistoryCallback: TradingView.HistoryCallback,
    onErrorCallback: TradingView.ErrorCallback,
    firstDataRequest: boolean,
  ) {
    //   historyData.push({
    //     'time': time + i * 1 * 60 * 1000,
    //     'open': initPrice,
    //     'close': closePrice,
    //     'low': initPrice - initPrice * randomLow / (random1_10 + 1),
    //     'high': initPrice + initPrice * randomHigh / (random1_10 + 1),
    //     'volume': Math.abs(closePrice - initPrice)
    //   })
    // }
    // onHistoryCallback(historyData)
    // onHistoryCallback([], {noData: true}) // need this if no more data
    if (symbolInfo.ticker && symbolInfo.ticker.startsWith('Default')) {
      // ignore the default configure
      onHistoryCallback([], { noData: true })
      return
    }
    if (this.onBeginFetch) {
      let resolutionMinutes = this.convertResolutionToMinutes(resolution)
      // work around: I don't know why but trading view often asks a very old time. "from" and "to"
      //              seems divided by 1000
      if (from < 31507200 /* 1971-1-1 */) {
        from *= 1000
      }
      if (to < 31507200 /* 1971-1-1 */) {
        to *= 1000
      }
      from = Math.floor(from)
      to = Math.ceil(to)
      this.onBeginFetch(symbolInfo, resolutionMinutes, from, to, firstDataRequest, onHistoryCallback, onErrorCallback)
    }
  }
  convertResolutionToMinutes(resolution: string) {
    let minutes = 1 // because 'w' means '1w'
    try {
      let arr = resolution.match(/(\d*)(.*)/) || []
      if (arr[1]) {
        minutes = parseInt(arr[1])
      }
      if (arr[2] === '') {
        minutes *= 60
      } else if (arr[2] === '1') {
        minutes *= 60
      } else if (arr[2] === 'h' || arr[2] === 'H') {
        minutes *= 60 * 60
      } else if (arr[2] === 'd' || arr[2] === 'D') {
        minutes *= 60 * 60 * 24
      } else if (arr[2] === 'w' || arr[2] === 'W') {
        minutes *= 60 * 60 * 24 * 7
      } else if (arr[2] === 'm' || arr[2] === 'M') {
        minutes *= (60 * 60 * 24 * 365) / 12
      } else if (arr[2] === 'y' || arr[2] === 'Y') {
        minutes *= 60 * 60 * 24 * 365
      } else {
        console.warn('FIXME: resolution not supported yet!', resolution)
        minutes = 60 * 5
      }
    } catch (e) {
      console.warn('FIXME: resolution not supported yet!', resolution, e)
      minutes = 60 * 5
    }
    return minutes
  }
  subscribeBars(
    symbolInfo: TradingView.LibrarySymbolInfo,
    resolution: TradingView.ResolutionString,
    onRealtimeCallback: TradingView.SubscribeBarsCallback,
    subscriberUID: string,
    onResetCacheNeededCallback: Function,
  ) {
    // onRealtimeCallback({ time: Date.now(), close: 8000, open: 10000, high: 11500, low: 7000, volume: 2000 })
    // onResetCacheNeededCallback(); // function() to be executed when bar data has changed
    this.onRealtimeCallback = onRealtimeCallback
  }
  unsubscribeBars(subscriberUID: string) {
    // subscriberUID:object
    this.onRealtimeCallback = null
  }
  calculateHistoryDepth(
    resolution: TradingView.ResolutionString,
    resolutionBack: TradingView.ResolutionBackValues,
    intervalBack: number,
  ): TradingView.HistoryDepth | undefined {
    return undefined
  }
  getMarks(
    symbolInfo: TradingView.LibrarySymbolInfo,
    startDate: number,
    endDate: number,
    onDataCallback: TradingView.GetMarksCallback<TradingView.Mark>,
    resolution: TradingView.ResolutionString,
  ) {
    // symbolInfo:SymbolInfo
    // startDate: unix timestamp (UTC). Leftmost visible bar's time.
    // endDate: unix timestamp (UTC). Rightmost visible bar's time.
    // onDataCallback: function(marks)
    // resolution: string
  }
  getTimescaleMarks(
    symbolInfo: TradingView.LibrarySymbolInfo,
    startDate: number,
    endDate: number,
    onDataCallback: TradingView.GetMarksCallback<TradingView.TimescaleMark>,
    resolution: TradingView.ResolutionString,
  ) {
    // symbolInfo:SymbolInfo object
    // startDate: unix timestamp (UTC). Leftmost visible bar's time.
    // endDate: unix timestamp (UTC). Rightmost visible bar's time.
    // onDataCallback: function(array of marks)
    // resolution: string
  }
  getServerTime(callback: TradingView.ServerTimeCallback) {
    // callback: function(unixTime)
  }
  getQuotes(symbols: string[], onDataCallback: TradingView.QuotesCallback, onErrorCallback: Function) {
    // symbols:
    // onDataCallback: function(array of data)
    //                 data: symbol quote data
    // onErrorCallback: function(reason)
  }
  subscribeQuotes(
    symbols: string[],
    fastSymbols: string[],
    onRealtimeCallback: TradingView.QuotesCallback,
    listenerGUID: string,
  ) {
    // symbols: array of symbols that should be updated rarely (once per minute). These symbols are included in the watchlist but they are not visible at the moment.
    // fastSymbols: array of symbols that should be updated frequently (once every 10 seconds or more often)
    // onRealtimeCallback: function(array of data) // data: symbol quote data
    // listenerGUID: unique identifier of the listener
  }
  unsubscribeQuotes(listenerGUID: string) {
    // listenerGUID: unique identifier of the listener
  }
  subscribeDepth(symbolInfo: string, callback: TradingView.DomeCallback): string {
    // symbolInfo:SymbolInfo object
    // callback: function(depth) // depth: object{snapshot, asks, bids}
    //                           // snapshot: Boolean - if true asks and bids have full set of depth, otherwise they contain only updated levels.
    //                           // asks: Array of {price, volume}
    //                           // bids: Array of {price, volume}
    return ''
  }
  unsubscribeDepth(subscriberUID: string) {
    // subscriberUID: String
  }
  gotoDefaultTimeFrame() {
    // method 1
    // const to = Date.now() / 1000
    // const from = to - 86400
    // this.tvWidget.chart().setVisibleRange({ from, to }, () => void {})

    // method 2
    // this.tvWidget.chart().executeActionById('timeScaleReset')

    // method 3:
    // this.tvWidget.chart().onIntervalChanged().subscribe(null, function(interval, obj) {
    //   obj.timeframe = '1d'
    // })

    // method 4: This is a workaround to simulate the user clicking the 1st time range button.
    //           I know it is ugly but it lets the button being "blue".
    // window.setTimeout(() => {
    const wrapper = document.getElementById('TV-chart')
    if (!wrapper) {
      return
    }
    const iframe = wrapper.getElementsByTagName('iframe')
    if (iframe.length === 0) {
      return
    }
    var innerDoc = iframe[0].contentDocument || (iframe[0].contentWindow && iframe[0].contentWindow.document)
    if (!innerDoc) {
      return
    }
    const buttons = innerDoc.getElementsByClassName('item-3cgIlGYO isFirst-2kfAV5tf')
    if (buttons.length === 0) {
      return
    }
    const button = buttons[0] as any
    if (button.click) {
      button.click()
    }
  }
}
