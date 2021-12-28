import {
  AreaSeriesPartialOptions,
  ChartOptions,
  CrosshairMode,
  DeepPartial,
  HistogramSeriesPartialOptions
} from 'lightweight-charts'

export const createChartOptions: DeepPartial<ChartOptions> = {
  layout: {
    backgroundColor: '#232B48',
    textColor: '#6678A9',
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
      labelBackgroundColor: '#4D5E90',
    },
    horzLine: {
      labelBackgroundColor: '#4D5E90',
    },
  },
  timeScale: {
    borderVisible: false,
    visible: true,
    secondsVisible: true,
  },
  rightPriceScale: {
    visible: true,
    borderVisible: false,
    scaleMargins: {
      top: 0.35,
      bottom: 0.2,
    },
  },
  handleScroll: {
    vertTouchDrag: false
  }
}

export const areaLineSeriesPartialOptions: AreaSeriesPartialOptions = {
  topColor: 'rgba(39, 162, 248, 0.5)',
  bottomColor: 'rgba(39, 162, 248, 0)',
  lineColor: 'rgba(39, 162, 248, 1)',
}

export const histogramSeriesPartialOptions: HistogramSeriesPartialOptions = {
  color: '#27A2F8',
  base: 0
}
