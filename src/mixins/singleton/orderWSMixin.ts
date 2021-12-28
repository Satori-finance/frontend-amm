import Vue from 'vue'
import WebSocket from 'isomorphic-ws'
import { Component, Watch } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { OrderWSStatus } from '@/ts/types'
import { OrderWSClientSettings } from '@/config/orderWS'
import { SERVER_WS_URL } from '@/constants'
import { PLACE_ORDER_EVENT, VUE_EVENT_BUS, WS_EVENTS } from '@/event'
import { parseOrderStruct } from '@/type/index.validator'

const auth = namespace('auth')
const wallet = namespace('wallet')

/**
 * use once on global
 */
@Component
export class OrderWSSingletonMixin extends Vue {
  @wallet.Getter('address') address!: string | null
  @auth.Getter('isValidateFunc') isValidateFunc!: Function
  @auth.State('jwt') jwt!: string

  protected orderWSClient: WebSocket | null = null
  protected orderWSStatus: OrderWSStatus = OrderWSStatus.UNKNOWN
  private subscribedTraderChannel: string[] = []

  mounted() {
    this.connectOrderWS()
  }

  destroyed() {
    if (this.orderWSClient) {
      this.orderWSClient.close()
    }
  }

  @Watch('jwt', { immediate: true })
  private async onOrderWSJWTChanged() {
    this.clearTraderInfo()
    if (this.address && this.jwt && this.isValidateFunc()) {
      this.updateTraderInfo()
    }
  }

  private clearTraderInfo() {
    this.orderWSUnsubscribe(this.subscribedTraderChannel)
    this.subscribedTraderChannel = []
  }

  private updateTraderInfo() {
    if (!this.address || (!this.jwt && !this.isValidateFunc())) {
      return
    }
    this.orderWSLogin()
    const channel = 'TraderAddress#' + this.address.toLowerCase()
    this.subscribedTraderChannel.push(channel)
    this.orderWSSubscribe(this.subscribedTraderChannel)
  }

  protected connectOrderWS() {
    if (!SERVER_WS_URL) {
      console.error('miss SERVER_WS_URL')
      return
    }

    this.orderWSStatus = OrderWSStatus.CONNECTING
    try {
      this.orderWSClient = new WebSocket(SERVER_WS_URL)
    } catch (error) {
      this.onError(error)
      this.onClosed()
      this.reconnectOrderWS()
      return
    }
    this.orderWSClient!.onopen = () => {
      this.onConnected()
    }
    this.orderWSClient!.onclose = () => {
      this.onClosed()
    }
    this.orderWSClient!.onerror = (event: WebSocket.ErrorEvent) => {
      this.onError(event)
    }
    this.orderWSClient!.onmessage = (event: WebSocket.MessageEvent) => {
      this.dispatch(event)
    }
  }

  protected reconnectOrderWS() {
    setTimeout(() => {
      this.connectOrderWS()
    }, OrderWSClientSettings.reconnectDelay)
  }

  private onConnected() {
    this.orderWSStatus = OrderWSStatus.CONNECTED
    this.orderWSLogin()
    this.orderWSSubscribe(this.subscribedTraderChannel)

    VUE_EVENT_BUS.emit(WS_EVENTS.HIDE)
  }

  private onClosed() {
    // NOTE: do NOT clear subscribedTraderChannel. the orderWS need re-subscribe these channels
    this.orderWSStatus = OrderWSStatus.DISCONNECTED
    this.reconnectOrderWS()
    VUE_EVENT_BUS.emit(WS_EVENTS.SHOW)
  }

  private onError(event: WebSocket.ErrorEvent | Error) {
    console.warn('ws err', event)
  }

  private dispatch(event: WebSocket.MessageEvent) {
    if (typeof event.data !== 'string') {
      console.warn('malformed ws', typeof event.data)
      return
    }
    try {
      const message = JSON.parse(event.data)
      if (typeof message.type === 'undefined') {
        throw new Error('invalid websocket message response')
      } else if (message.type === 'orderChange') {
        const order = parseOrderStruct(message.order)
        VUE_EVENT_BUS.emit(PLACE_ORDER_EVENT.WSOrderChanged, {
          order,
          blockNumber: message.blockNumber,
          transactionHash: message.transaction_hash,
        })
      }
    } catch (error) {
      console.warn('malformed ws', error)
      return
    }
  }

  protected orderWSLogin() {
    if (!this.jwt) {
      return
    }
    if (this.orderWSStatus !== OrderWSStatus.CONNECTED) {
      return
    }
    const request = JSON.stringify({
      type: 'login',
      jwt: this.jwt,
    })
    this.orderWSClient?.send(request)
  }

  protected orderWSSubscribe(channels: string[]) {
    if (channels.length == 0) {
      return
    }
    if (this.orderWSStatus !== OrderWSStatus.CONNECTED) {
      return
    }
    const request = JSON.stringify({
      type: 'subscribe',
      channels: channels,
    })
    this.orderWSClient?.send(request)
  }

  protected orderWSUnsubscribe(channels: string[]) {
    if (channels.length == 0) {
      return
    }
    if (this.orderWSStatus !== OrderWSStatus.CONNECTED) {
      return
    }
    const request = JSON.stringify({
      type: 'unsubscribe',
      channels: channels,
    })
    this.orderWSClient?.send(request)
  }
}
