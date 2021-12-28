const LINESTYLE_SOLID = 0
//const LINESTYLE_DOTTED = 1
const LINESTYLE_DASHED = 2
//const LINESTYLE_LARGE_DASHED = 3

export default {
  // supported values: large, medium, small, tiny
  volumePaneSize: 'tiny',

  'paneProperties.background': '#12182C',
  'paneProperties.vertGridProperties.color': '#242D43',
  'paneProperties.vertGridProperties.style': LINESTYLE_SOLID,
  'paneProperties.horzGridProperties.color': '#242D43',
  'paneProperties.horzGridProperties.style': LINESTYLE_SOLID,
  'paneProperties.crossHairProperties.color': '#4D5E90',
  'paneProperties.crossHairProperties.width': 1,
  'paneProperties.crossHairProperties.style': LINESTYLE_DASHED,

  // Margins (percentage). Used for auto scaling
  'paneProperties.topMargin': 10,
  'paneProperties.bottomMargin': 5,

  // 'paneProperties.axisProperties.autoScale': true,
  // 'paneProperties.axisProperties.lockScale': false,
  // 'paneProperties.axisProperties.percentage': false,
  // 'paneProperties.axisProperties.indexedTo100': false,
  // 'paneProperties.axisProperties.log': false,
  // 'paneProperties.axisProperties.alignLabels': true,
  // 'paneProperties.axisProperties.isInverted': false,

  'paneProperties.legendProperties.showStudyArguments': true,
  'paneProperties.legendProperties.showStudyTitles': true,
  'paneProperties.legendProperties.showStudyValues': true,
  'paneProperties.legendProperties.showSeriesTitle': true,
  'paneProperties.legendProperties.showSeriesOHLC': true,
  'paneProperties.legendProperties.showLegend': true,
  'paneProperties.legendProperties.showBarChange': true,

  'scalesProperties.backgroundColor': '#12182C',
  'scalesProperties.fontSize': 12,
  'scalesProperties.lineColor': '#242D43',
  'scalesProperties.textColor': '#6678A9',
  'scalesProperties.scaleSeriesOnly': false,
  'scalesProperties.showSeriesLastValue': true,
  'scalesProperties.showSeriesPrevCloseValue': false,
  'scalesProperties.showStudyLastValue': false,
  'scalesProperties.showStudyPlotLabels': false,
  'scalesProperties.showSymbolLabels': false,

  // timezone: "Etc/UTC", // See supported timezones list (at Symbology#timezone page) for available values

  // Series style. See the supported values below
  // Bars = 0
  // Candles = 1
  // Line = 2
  // Area = 3
  // Heikin Ashi = 8
  // Hollow Candles = 9
  // Renko = 4
  // Kagi = 5
  // Point&Figure = 6
  // Line Break = 7
  // Baseline = 10
  'mainSeriesProperties.style': 1,

  'mainSeriesProperties.showCountdown': false,
  'mainSeriesProperties.visible': true,
  'mainSeriesProperties.showPriceLine': true,
  'mainSeriesProperties.priceLineWidth': 1,
  'mainSeriesProperties.priceLineColor': '',
  'mainSeriesProperties.showPrevClosePriceLine': false,
  'mainSeriesProperties.prevClosePriceLineWidth': 1,
  'mainSeriesProperties.prevClosePriceLineColor': 'rgba( 85, 85, 85, 1)',
  // 'mainSeriesProperties.lockScale': false,
  'mainSeriesProperties.minTick': 'default',

  'mainSeriesProperties.priceAxisProperties.autoScale': true, // (see #749)
  'mainSeriesProperties.priceAxisProperties.autoScaleDisabled': false, // (see #749)
  'mainSeriesProperties.priceAxisProperties.percentage': false,
  'mainSeriesProperties.priceAxisProperties.percentageDisabled': false,
  'mainSeriesProperties.priceAxisProperties.log': false,
  'mainSeriesProperties.priceAxisProperties.logDisabled': false,

  // possible values are: description, ticker.
  // 'mainSeriesProperties.statusViewStyle.symbolTextSource': 'description',

  'symbolWatermarkProperties.color': 'rgba(255, 255, 255, 0)',

  // Different chart types defaults

  // Candles styles
  'mainSeriesProperties.candleStyle.upColor': '#59EFEC',
  'mainSeriesProperties.candleStyle.downColor': '#D98041',
  'mainSeriesProperties.candleStyle.drawWick': true,
  'mainSeriesProperties.candleStyle.drawBorder': false,
  'mainSeriesProperties.candleStyle.borderColor': '#59EFEC', // hide (color is similar to background). original: #378658
  'mainSeriesProperties.candleStyle.borderUpColor': '#59EFEC', // hide (color is similar to background). original: #59EFEC
  'mainSeriesProperties.candleStyle.borderDownColor': '#D98041', // hide (color is similar to background). original: #D98041
  'mainSeriesProperties.candleStyle.wickUpColor': '#59EFEC',
  'mainSeriesProperties.candleStyle.wickDownColor': '#D98041',
  'mainSeriesProperties.candleStyle.barColorsOnPrevClose': false,

  // Hollow Candles styles
  'mainSeriesProperties.hollowCandleStyle.upColor': '#59EFEC',
  'mainSeriesProperties.hollowCandleStyle.downColor': '#D98041',
  'mainSeriesProperties.hollowCandleStyle.drawWick': true,
  'mainSeriesProperties.hollowCandleStyle.drawBorder': true,
  'mainSeriesProperties.hollowCandleStyle.borderColor': '#59EFEC',
  'mainSeriesProperties.hollowCandleStyle.borderUpColor': '#59EFEC',
  'mainSeriesProperties.hollowCandleStyle.borderDownColor': '#D98041',
  'mainSeriesProperties.hollowCandleStyle.wickColor': '#93B6F2',

  // Heikin Ashi styles
  'mainSeriesProperties.haStyle.upColor': '#59EFEC',
  'mainSeriesProperties.haStyle.downColor': '#D98041',
  'mainSeriesProperties.haStyle.drawWick': true,
  'mainSeriesProperties.haStyle.drawBorder': false,
  // 'mainSeriesProperties.haStyle.borderColor': "#378658",
  // 'mainSeriesProperties.haStyle.borderUpColor': "#59EFEC",
  // 'mainSeriesProperties.haStyle.borderDownColor': "#D98041",
  'mainSeriesProperties.haStyle.wickColor': '#93B6F2',
  'mainSeriesProperties.haStyle.barColorsOnPrevClose': false,

  // Bar styles
  'mainSeriesProperties.barStyle.upColor': '#59EFEC',
  'mainSeriesProperties.barStyle.downColor': '#D98041',
  'mainSeriesProperties.barStyle.barColorsOnPrevClose': false,
  'mainSeriesProperties.barStyle.dontDrawOpen': false,

  // Line styles
  'mainSeriesProperties.lineStyle.color': '#27A2F8',
  'mainSeriesProperties.lineStyle.linestyle': LINESTYLE_SOLID,
  'mainSeriesProperties.lineStyle.linewidth': 2,
  'mainSeriesProperties.lineStyle.priceSource': 'close',

  // Area styles
  'mainSeriesProperties.areaStyle.color1': '#27A2F8',
  'mainSeriesProperties.areaStyle.color2': '#27A2F8',
  'mainSeriesProperties.areaStyle.linecolor': '#27A2F8',
  'mainSeriesProperties.areaStyle.linestyle': LINESTYLE_SOLID,
  'mainSeriesProperties.areaStyle.linewidth': 2,
  'mainSeriesProperties.areaStyle.priceSource': 'close',

  // Baseline styles
  'mainSeriesProperties.baselineStyle.baselineColor': '#59EFEC',
  'mainSeriesProperties.baselineStyle.topFillColor1': 'rgba( 46, 129, 147, 0.05)',
  'mainSeriesProperties.baselineStyle.topFillColor2': 'rgba( 64, 149, 167, 0.05)',
  'mainSeriesProperties.baselineStyle.bottomFillColor1': 'rgba( 143, 91, 91, 0.05)',
  'mainSeriesProperties.baselineStyle.bottomFillColor2': 'rgba( 167, 111, 80, 0.05)',
  'mainSeriesProperties.baselineStyle.topLineColor': '#59EFEC',
  'mainSeriesProperties.baselineStyle.bottomLineColor': '#D98041',
  'mainSeriesProperties.baselineStyle.topLineWidth': 1,
  'mainSeriesProperties.baselineStyle.bottomLineWidth': 1,
  'mainSeriesProperties.baselineStyle.priceSource': 'close',
  'mainSeriesProperties.baselineStyle.transparency': 50,
  'mainSeriesProperties.baselineStyle.baseLevelPercentage': 50,

  // Hi-Lo style
  // 'mainSeriesProperties.hiloStyle.color': "#2196f3",
  // 'mainSeriesProperties.hiloStyle.showBorders': true,
  // 'mainSeriesProperties.hiloStyle.borderColor': "#2196f3",
  // 'mainSeriesProperties.hiloStyle.showLabels': true,
  // 'mainSeriesProperties.hiloStyle.labelColor': "#2196f3",
  // 'mainSeriesProperties.hiloStyle.fontFamily': 'Trebuchet MS',
  // 'mainSeriesProperties.hiloStyle.fontSize': 7
} as TradingView.Overrides
