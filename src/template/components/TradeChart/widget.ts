import Datafeed from './datafeed'
import pcOverride from './pc/override'
import mobileOverride from './mobile/override'
import { CHART_LIBRARY_PATH } from '@/constants'
import { mobileWidgetConfiguration } from '@/template/components/TradeChart/mobile/widgetConfiguration'
import { ResolutionString } from '@/@types/tradingview'
const tradingView = require('@/../vendor/charting_library/charting_library/charting_library.min')

export default class Widget {
  datafeed: Datafeed
  tvWidget: TradingView.IChartingLibraryWidget | null
  volumeEntity: TradingView.EntityId | null
  indexPriceEntity: TradingView.EntityId | null
  onChartReady: Function | null
  isTvWidgetChartReady: boolean
  isMobile: boolean

  constructor(decimals: number, isMobile: boolean = false) {
    this.datafeed = new Datafeed(decimals)
    this.tvWidget = null
    this.volumeEntity = null
    this.indexPriceEntity = null
    this.onChartReady = null
    this.isTvWidgetChartReady = false
    this.isMobile = isMobile
  }
  init(containerID: string, symbol: string, locale: string, timezone: string) {
    if (!containerID) {
      throw new Error('Pass in the id of the element you want to render')
    }
    let conf = this.getConfiguration(containerID, symbol, locale, timezone)
    this.tvWidget = new tradingView.widget(conf)
    this.tvWidget!.onChartReady(() => {
      if (!this.tvWidget) {
        return
      }
      // this.volumeEntity = this.tvWidget!.chart().createStudy('volume', false /* forceOverlay */, false /* lock */)
      // this.indexPriceEntity = this.tvWidget!.chart().createStudy(
      //   'indexPrice', false /* forceOverlay */, false /* lock */,
      //   ['Default'])
      if (this.isMobile) {
        this.tvWidget!.chart().executeActionById('drawingToolbarAction') // hides or shows the drawing toolbar
      }
      this.isTvWidgetChartReady = true
      if (this.onChartReady) {
        this.onChartReady()
      }
    })
  }
  onDestroyed() {
    if (this.tvWidget !== null) {
      this.tvWidget.remove()
    }
    this.tvWidget = null
  }
  onMarketChanged(symbol: string) {
    if (!this.isTvWidgetChartReady) {
      return
    }
    if (this.tvWidget) {
      this.tvWidget.chart().setSymbol(symbol, () => {})
      if (this.indexPriceEntity) {
        type Index = TradingView.Nominal<string, 'StudyInputId'>
        this.tvWidget
          .chart()
          .getStudyById(this.indexPriceEntity)
          .setInputValues([{ id: 'symbol' as Index, value: symbol }])
      }
    }
  }
  setCandlesGetter(callback: Function, endCallback: Function) {
    this.datafeed.onBeginFetch = callback
    endCallback()
    this.datafeed.gotoDefaultTimeFrame()
  }
  updateRealtimePrice(bar: TradingView.Bar) {
    if (this.datafeed.onRealtimeCallback) {
      this.datafeed.onRealtimeCallback(bar)
    }
  }
  getConfiguration(
    containerID: string,
    symbol: string,
    locale: string,
    timezone: string
  ): TradingView.ChartingLibraryWidgetOptions {
    return {
      container_id: containerID,
      datafeed: this.datafeed,
      symbol,
      locale: parseLanguageCode(locale),

      // See supported timezones list (at Symbology#timezone page) for available values
      timezone: parseTimeZone(timezone),

      // dark theme
      theme: 'Dark',
      loading_screen: {
        backgroundColor: this.isMobile ? '#12182C' : '#0A1024',
      },
      toolbar_bg: undefined,

      library_path: CHART_LIBRARY_PATH,
      debug: false,
      autosize: true,
      charts_storage_api_version: '1.1',

      // Charting Library sends HTTP/HTTPS commands to charts_storage_url/charts_storage_api_version/charts?client=client_id&user=user_id
      charts_storage_url: '',
      client_id: '',
      user_id: '',

      interval: '5' as ResolutionString, // Default resolution

      // This time range list can be seen in the time range selector at the bottom of the chart
      time_frames: [
        { text: '1d', resolution: '5' as ResolutionString },
        { text: '7d', resolution: '5' as ResolutionString },
        { text: '30d', resolution: '60' as ResolutionString },
      ],

      // disabled_features: ['left_toolbar', 'header_symbol_search', 'header_chart_type', 'header_indicators',
      // 'header_compare', 'header_undo_redo', 'header_fullscreen_button', 'header_saveload', 'header_screenshot',
      // 'legend_context_menu', 'edit_buttons_in_legend'],
      // enabled_features: ['header_widget'],
      disabled_features: [
        'header_symbol_search',
        'header_interval_dialog_button',
        'show_interval_dialog_on_key_press',
        'symbol_search_hot_key',
        'study_dialog_search_control',
        // 'display_market_status',
        'header_compare',
        'edit_buttons_in_legend',
        'symbol_info',
        // 'border_around_the_chart',
        'main_series_scale_menu',
        'star_some_intervals_by_default',
        'datasource_copypaste',
        'right_bar_stays_on_scroll',
        'context_menus',
        'go_to_date',
        'compare_symbol',
        'timezone_menu',
        //'header_resolutions',//todo: przetestowac
        //'control_bar',//todo: przetestowac
        //'edit_buttons_in_legend',//todo: przetestowac
        'remove_library_container_border',
        ...(this.isMobile ? mobileWidgetConfiguration.disabled_features : []),
      ],
      enabled_features: [
        'dont_show_boolean_study_arguments',
        'use_localstorage_for_settings',
        'border_around_the_chart',
        'remove_library_container_border',
        'save_chart_properties_to_local_storage',
        'side_toolbar_in_fullscreen_mode',
        'hide_last_na_study_output',
        'constraint_dialogs_movement', // todo: nie do końca jestem pewien
        'show_chart_property_page',
        'pane_context_menu'
      ],
      studies_overrides: {
        'volume.volume.color.0': '#59EFEC',
        'volume.volume.color.1': '#D98041',
        'volume.volume.transparency': 75,
        'rsi.plot.color':'#B8DBEB',
        'rsi.hlines background.color':'#B8DBEB',
        'macd.histogram.color':'#D98041',
        'macd.signal.color':'#D98041',
        'macd.macd.color':'#B8DBEB',
      },
      overrides: this.isMobile ? mobileOverride : pcOverride,
      custom_css_url: this.isMobile ? 'chart.mobile.v3.2.css' : 'chart.v3.2.css',

      customFormatters: {
        timeFormatter: {
          format: function(date: Date) {
            // charting_library always set date as timestamp+timezone with timezone which is ridiculous. ex:
            // "2019-11-14 12:13:24 in Asia/Shanghai" will be "Thu Nov 14 2019 20:13:24 GMT+0800". so we
            // change it back to utc
            return _pad2(date.getUTCHours()) + ':' + _pad2(date.getUTCMinutes())
          },
          formatLocal: function(date: Date) {
            return _pad2(date.getUTCHours()) + ':' + _pad2(date.getUTCMinutes())
          },
        },
        dateFormatter: {
          format: function(date: Date) {
            return date.getUTCFullYear() + '/' + _pad2(date.getUTCMonth() + 1) + '/' + _pad2(date.getUTCDate())
          },
          formatLocal: function(date: Date) {
            return date.getUTCFullYear() + '/' + _pad2(date.getUTCMonth() + 1) + '/' + _pad2(date.getUTCDate())
          },
        },
      },
    }
  }
}

function _pad2(n: number) {
  if (n < 10) {
    return '0' + n
  }
  return '' + n
}

function parseLanguageCode(l: string): TradingView.LanguageCode {
  switch (l) {
    case 'ar':
    case 'zh':
    case 'cs':
    case 'da_DK':
    case 'nl_NL':
    case 'en':
    case 'et_EE':
    case 'fr':
    case 'de':
    case 'el':
    case 'he_IL':
    case 'hu_HU':
    case 'id_ID':
    case 'it':
    case 'ja':
    case 'ko':
    case 'fa':
    case 'pl':
    case 'pt':
    case 'ro':
    case 'ru':
    case 'sk_SK':
    case 'es':
    case 'sv':
    case 'th':
    case 'tr':
    case 'vi':
      return l
    default:
      return 'en'
  }
}

function parseTimeZone(t: string): TradingView.Timezone {
  switch (t) {
    case 'America/New_York':
    case 'America/Los_Angeles':
    case 'America/Chicago':
    case 'America/Phoenix':
    case 'America/Toronto':
    case 'America/Vancouver':
    case 'America/Argentina/Buenos_Aires':
    case 'America/El_Salvador':
    case 'America/Sao_Paulo':
    case 'America/Bogota':
    case 'America/Caracas':
    case 'Europe/Moscow':
    case 'Europe/Athens':
    case 'Europe/Belgrade':
    case 'Europe/Berlin':
    case 'Europe/London':
    case 'Europe/Luxembourg':
    case 'Europe/Madrid':
    case 'Europe/Paris':
    case 'Europe/Rome':
    case 'Europe/Warsaw':
    case 'Europe/Istanbul':
    case 'Europe/Zurich':
    case 'Australia/Sydney':
    case 'Australia/Brisbane':
    case 'Australia/Adelaide':
    case 'Australia/ACT':
    case 'Asia/Almaty':
    case 'Asia/Ashkhabad':
    case 'Asia/Tokyo':
    case 'Asia/Taipei':
    case 'Asia/Singapore':
    case 'Asia/Shanghai':
    case 'Asia/Seoul':
    case 'Asia/Tehran':
    case 'Asia/Dubai':
    case 'Asia/Kolkata':
    case 'Asia/Hong_Kong':
    case 'Asia/Bangkok':
    case 'Asia/Chongqing':
    case 'Asia/Jerusalem':
    case 'Asia/Kuwait':
    case 'Asia/Muscat':
    case 'Asia/Qatar':
    case 'Asia/Riyadh':
    case 'Pacific/Auckland':
    case 'Pacific/Chatham':
    case 'Pacific/Fakaofo':
    case 'Pacific/Honolulu':
    case 'America/Mexico_City':
    case 'Africa/Cairo':
    case 'Africa/Johannesburg':
    case 'Asia/Kathmandu':
    case 'US/Mountain':
    case 'Europe/Helsinki':
    case 'Europe/Stockholm':
    case 'Europe/Copenhagen':
    case 'Atlantic/Reykjavik':
    case 'Europe/Tallinn':
    case 'Europe/Riga':
    case 'Europe/Vilnius':
    case 'America/Lima':
    case 'America/Santiago':
    case 'Asia/Bahrain':
    case 'Asia/Jakarta':
    case 'Africa/Lagos':
    case 'Pacific/Norfolk':
    case 'America/Juneau':
    case 'Asia/Ho_Chi_Minh':
    case 'Australia/Perth':
    case 'Europe/Oslo':
      return t
    default:
      return 'Etc/UTC'
  }
}
