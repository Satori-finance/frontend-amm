import { Component, Mixins, Watch } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { ErrorHandlerMixin } from '../errorHandlerMixin'
import { OrderStruct, PerpetualCombinedState } from '@/type'
import BigNumber from 'bignumber.js'
import { getPerpetualID } from '@/utils'
import { ACCOUNT_EVENT, PLACE_ORDER_EVENT, VUE_EVENT_BUS } from '@/event'
import { OrderDirectoryItem } from '@/store/order'
import { ORDER_SIDE } from '@/ts'
import { Provider } from '@ethersproject/providers'
import { ethers } from 'ethers'

const auth = namespace('auth')
const wallet = namespace('wallet')
const order = namespace('order')
const perpetual = namespace('perpetual')
const account = namespace('account')

/**
 * use once on global
 */
@Component
export class OrderSingletonMixin extends Mixins(ErrorHandlerMixin) {
  @wallet.Getter('address') address!: string | null
  @wallet.Getter('provider') provider !: Provider
  @auth.State('jwt') jwt!: string
  @auth.Getter('isValidateFunc') isValidateFunc!: () => boolean
  @order.Action('loadOpenOrders') loadOpenOrders!: () => Promise<void>
  @order.Action('updateOpenOrder') updateOpenOrder!: (order: OrderStruct) => Promise<void>
  @order.Mutation('removeOpenOrder') removeOpenOrder!: (order: OrderStruct) => void
  @order.Getter('openOrderStorageFunc') openOrderStorageFunc!: (orderId: string) => OrderDirectoryItem | null
  @order.Getter('openOrders') openOrders!: OrderStruct[]
  @order.Mutation('reset') reset!: () => void
  @perpetual.Action('updateLiquidityPool') updateLiquidityPool !: (poolAddress: string) => Promise<void>
  @perpetual.Getter('getPerpetualFunc') getPerpetualFunc !: (perpetualID: string) => PerpetualCombinedState | null
  @account.Action('updateAccountStorage') updateAccountStorage!: (perpetualID: string) => Promise<void>

  private timer = 0
  private time2 = 0

  mounted() {
    VUE_EVENT_BUS.on([PLACE_ORDER_EVENT.OrderCreated, PLACE_ORDER_EVENT.OrderMatching, PLACE_ORDER_EVENT.OrderFilled, PLACE_ORDER_EVENT.OrderCanceled], this.updateOpenOrder)
    VUE_EVENT_BUS.on(PLACE_ORDER_EVENT.OrderClosed, this.removeOpenOrder)
    VUE_EVENT_BUS.on(PLACE_ORDER_EVENT.LoadAllOrders, this.loadOrders)
    VUE_EVENT_BUS.on(PLACE_ORDER_EVENT.LoadAllOrders, this.loadAccountStorageByOrders)

    this.timer = window.setInterval(this.loadOrders, 60000)
    this.time2 = window.setInterval(this.loadAccountStorageByOrders, 60000)
  }

  destroyed() {
    VUE_EVENT_BUS.off([PLACE_ORDER_EVENT.OrderCreated, PLACE_ORDER_EVENT.OrderMatching, PLACE_ORDER_EVENT.OrderFilled, PLACE_ORDER_EVENT.OrderCanceled], this.updateOpenOrder)
    VUE_EVENT_BUS.off(PLACE_ORDER_EVENT.OrderClosed, this.removeOpenOrder)
    VUE_EVENT_BUS.off(PLACE_ORDER_EVENT.LoadAllOrders, this.loadOrders)
    VUE_EVENT_BUS.off(PLACE_ORDER_EVENT.LoadAllOrders, this.loadAccountStorageByOrders)

    window.clearInterval(this.timer)
    window.clearInterval(this.time2)
  }

  _safeDelta(a: BigNumber | null, b: BigNumber | null) {
    // safe b - a
    if (a && b) {
      return a.minus(b)
    } else if (a) {
      return a
    } else if (b) {
      return b.negated()
    }
    return new BigNumber(0)
  }

  getSpecifiedOrder(orderId: string): OrderDirectoryItem | null {
    return this.openOrderStorageFunc(orderId)
  }

  getOrderSide(amount: BigNumber): ORDER_SIDE | null {
    if (amount.gt(0)) {
      return ORDER_SIDE.Buy
    } else if (amount.lt(0)) {
      return ORDER_SIDE.Sell
    } else {
      return null
    }
  }

  async getPerpetualSymbol(poolAddress: string, perpetualIndex: number): Promise<string> {
    const perpetualID = getPerpetualID(poolAddress, perpetualIndex)
    let perpetualCombinedState = this.getPerpetualFunc(perpetualID)
    if (perpetualCombinedState) {
      // return `${perpetualCombinedState.perpetualProperty.symbolStr} ${perpetualCombinedState.perpetualProperty.name}`
      return `${perpetualCombinedState.perpetualProperty.underlyingAssetSymbol}`
    }
    await this.updateLiquidityPool(poolAddress)
    perpetualCombinedState = this.getPerpetualFunc(perpetualID)
    if (perpetualCombinedState) {
      // return `${perpetualCombinedState.perpetualProperty.symbolStr} ${perpetualCombinedState.perpetualProperty.name}`
      return `${perpetualCombinedState.perpetualProperty.underlyingAssetSymbol}`
    }
    return ''
  }

  async onWsOrderChangeEvent(params: { order: OrderStruct, blockNumber: number, transactionHash: string }) {
    let data: OrderStruct = params.order
    const orderId: string = params.order.orderHash
    let oldItem: OrderDirectoryItem | null = this.getSpecifiedOrder(orderId)

    let order = {
      ...params.order,
      side: this.getOrderSide(data.amount as BigNumber),
      symbol: await this.getPerpetualSymbol(data.liquidityPoolAddress.toLowerCase(), data.perpetualIndex),
      pendingDelta: this._safeDelta(
        data ? data.pendingAmount as BigNumber : null,
        oldItem ? oldItem.pendingAmount as BigNumber : null,
      ),
      confirmDelta: this._safeDelta(
        data ? data.confirmedAmount as BigNumber : null,
        oldItem ? oldItem.confirmedAmount as BigNumber : null,
      ),
      canceledDelta: this._safeDelta(
        data ? data.canceledAmount as BigNumber : null,
        oldItem ? oldItem.canceledAmount as BigNumber : null,
      ),
      closed: data.status !== 'pending',
    }

    // new order
    // if (toBigNumber(order.availableAmount).eq(order.amount)) {
    //   VUE_EVENT_BUS.emit(PLACE_ORDER_EVENT.OrderCreated, order)
    // }

    // partially canceled
    if (!order.canceledDelta.isZero()) {
      VUE_EVENT_BUS.emit(PLACE_ORDER_EVENT.OrderCanceled, order)
    }

    // partially matched
    if (!order.confirmDelta.isZero()) {
      VUE_EVENT_BUS.emit(PLACE_ORDER_EVENT.OrderFilled, order)
      // update account
      await ethers.utils.poll(async () => {
        const lastBlockNumber = await this.provider.getBlockNumber()
        if (lastBlockNumber > params.blockNumber) {
          VUE_EVENT_BUS.emit(ACCOUNT_EVENT.REFRESH_USER_DATA)
          return true
        }
        return undefined
      })
    }

    // partially matching is not zero and confirm delta is zero and cancel delta is zero, then send notice
    if (!order.pendingDelta.isZero() && order.confirmDelta.isZero() && order.canceledDelta.isZero()) {
      VUE_EVENT_BUS.emit(PLACE_ORDER_EVENT.OrderMatching, order)
    }

    // order closed
    if (order.closed) {
      VUE_EVENT_BUS.emit(PLACE_ORDER_EVENT.OrderClosed, order)
    }

    //  update order
    VUE_EVENT_BUS.emit(PLACE_ORDER_EVENT.OrderUpdate, orderId)
    VUE_EVENT_BUS.emit(ACCOUNT_EVENT.REFRESH_USER_DATA)
  }


  @Watch('jwt', { immediate: true })
  async loadOrders() {
    if (!this.jwt || !this.isValidateFunc()) {
      this.reset()
      return
    }
    await this.callRelayerServerApiReadFunc(() => {
      this.loadOpenOrders()
    })
  }

  @Watch('openOrders', { immediate: true })
  async loadAccountStorageByOrders() {
    if (this.openOrders.length == 0) {
      return
    }
    await Promise.all(
      this.openOrders.map((item) => {
        return this.updateLiquidityPool(item.liquidityPoolAddress)
      })
    )
    await Promise.all(
      this.openOrders.map((item) => {
        return this.updateAccountStorage(
          getPerpetualID(item.liquidityPoolAddress, item.perpetualIndex)
        )
      })
    )
  }
}
