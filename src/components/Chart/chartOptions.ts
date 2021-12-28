import {
  AreaSeriesPartialOptions,
  ChartOptions,
  CrosshairMode,
  DeepPartial,
  HistogramSeriesPartialOptions
} from 'lightweight-charts'

export const createChartOptions: DeepPartial<ChartOptions> = {
  layout: {
    backgroundColor: '#0A1024',
    textColor: '#FFFFFF',
    fontSize: 14,
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
      labelBackgroundColor: '#27A2F8',
    },
    horzLine: {
      labelBackgroundColor: '#27A2F8',
    },
  },
  timeScale: {
    borderVisible: false,
    visible: true,
    secondsVisible: true,
  },
  rightPriceScale: {
    visible: true,
    borderVisible: false
  }
}

export const areaLineSeriesPartialOptions: AreaSeriesPartialOptions = {
  topColor: 'rgba(39, 162, 248, 0.5)',
  bottomColor: 'rgba(184, 219, 235, 0)',
  lineColor: 'rgba(39, 162, 248, 1)',
  priceLineVisible: false
}

export const histogramSeriesPartialOptions: HistogramSeriesPartialOptions = {
  color: '#27A2F8',
  base: 0,
  priceLineVisible: false
}
