import { Component, Prop, Vue } from 'vue-property-decorator'
import { ERROR_EVENTS, GRAPH_EVENTS, PRICE_CHART_EVENTS, RELAYER_EVENTS, VUE_EVENT_BUS, WS_EVENTS } from '@/event'
import { NETWORK_ID_NAME, SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/constants'
import { namespace } from 'vuex-class'
import { Provider } from '@ethersproject/providers'
import { loadSATORIAddress } from '@/utils'
import { isNodeServerError } from '@/type'

const wallet = namespace('wallet')

@Component
export class NodeServerErrorMixin extends Vue {
  @wallet.Getter('provider') provider!: Provider
  @wallet.Getter('networkId') networkId!: number

  protected timer = 0
  protected nodeErrorNum = 0
  protected relayerError = false
  protected graphError = false
  protected priceChartError = false
  protected wsError = false
  protected arbNetworkId = SUPPORTED_NETWORK_ID.ARB

  get status() {
    if (!this.hasError) {
      return 'success'
    } else {
      return 'warning'
    }
  }

  get hasError() {
    return this.nodeErrorNum || this.graphError || this.relayerError || this.priceChartError || this.wsError
  }

  get nodeErrorMessage() {
    return this.$t('nodeStatus.nodeErrorMessage', { networkName: NETWORK_ID_NAME[TARGET_NETWORK_ID] })
  }

  mounted() {
    VUE_EVENT_BUS.on(ERROR_EVENTS.ShowNodeError, this.show)
    VUE_EVENT_BUS.on(RELAYER_EVENTS.SHOW, this.showRelayerError)
    VUE_EVENT_BUS.on(GRAPH_EVENTS.SHOW, this.showGraphError)
    VUE_EVENT_BUS.on(PRICE_CHART_EVENTS.SHOW, this.showPriceChartError)
    VUE_EVENT_BUS.on(RELAYER_EVENTS.HIDE, this.hideRelayerError)
    VUE_EVENT_BUS.on(GRAPH_EVENTS.HIDE, this.hideGraphError)
    VUE_EVENT_BUS.on(PRICE_CHART_EVENTS.HIDE, this.hidePriceChartError)
    VUE_EVENT_BUS.on(WS_EVENTS.SHOW, this.showWSError)
    VUE_EVENT_BUS.on(WS_EVENTS.HIDE, this.hideWSError)
  }

  destroyed() {
    VUE_EVENT_BUS.off(ERROR_EVENTS.ShowNodeError, this.show)
    VUE_EVENT_BUS.off(RELAYER_EVENTS.SHOW, this.showRelayerError)
    VUE_EVENT_BUS.off(GRAPH_EVENTS.SHOW, this.showGraphError)
    VUE_EVENT_BUS.off(PRICE_CHART_EVENTS.SHOW, this.showPriceChartError)
    VUE_EVENT_BUS.off(RELAYER_EVENTS.HIDE, this.hideRelayerError)
    VUE_EVENT_BUS.off(GRAPH_EVENTS.HIDE, this.hideGraphError)
    VUE_EVENT_BUS.off(PRICE_CHART_EVENTS.HIDE, this.hidePriceChartError)
    VUE_EVENT_BUS.off(WS_EVENTS.SHOW, this.showWSError)
    VUE_EVENT_BUS.off(WS_EVENTS.HIDE, this.hideWSError)
    window.clearTimeout(this.timer)
  }

  showRelayerError() {
    this.relayerError = true
  }

  hideRelayerError() {
    this.relayerError = false
  }

  showGraphError() {
    this.graphError = true
  }

  hideGraphError() {
    this.graphError = false
  }

  showPriceChartError() {
    this.priceChartError = true
  }

  hidePriceChartError() {
    this.priceChartError = false
  }

  showWSError() {
    this.wsError = true
  }

  hideWSError() {
    this.wsError = false
  }

  show() {
    this.nodeErrorNum++
    if (!this.timer) {
      this.startHeartBeat()
    }
  }

  private startHeartBeat() {
    this.timer = window.setTimeout(async () => {
      try {
        await loadSATORIAddress(this.provider)
        this.nodeErrorNum = 0
        window.clearTimeout(this.timer)
        this.timer = 0
      } catch (e) {
        if (isNodeServerError(e)) {
          this.startHeartBeat()
        }
      }
    }, 5000)
  }
}
