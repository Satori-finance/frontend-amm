import { Component, Mixins, Watch } from 'vue-property-decorator'
import BigNumber from 'bignumber.js'
import { namespace } from 'vuex-class'
import {
  OrderStruct,
  PerpetualCombinedState,
  PerpetualProperty,
} from '@/type'
import { getPerpetualID, isLongPosition } from '@/utils/perpetual'
import { ErrorHandlerMixin } from '@/mixins'
import { WS_ORDER_TYPE } from '@/ts'
import { cancelAllOrders, cancelOrder } from '@/api/order'
import { PLACE_ORDER_EVENT, VUE_EVENT_BUS } from '@/event'

type TableData = Omit<OrderStruct, 'convert'> & { perpetualProperty: PerpetualProperty | null, confirmedPercent: string, confirmedRate: BigNumber }

const auth = namespace('auth')
const wallet = namespace('wallet')
const perpetual = namespace('perpetual')
const order = namespace('order')
const activePerpetuals = namespace('activePerpetuals')

@Component
export default class OrdersMixin extends Mixins(ErrorHandlerMixin) {
  @auth.Getter('isValidateFunc') isValidateFunc!: Function
  @auth.State('jwt') jwtValue !: string
  @wallet.Getter('address') userAddress!: string | null
  @wallet.Getter('isConnectedWallet') isConnectedWallet!: boolean
  @perpetual.Getter('getPerpetualFunc') getPerpetualFunc!: (perpetualID: string) => PerpetualCombinedState | null
  @order.Getter('openOrders') openOrders!: OrderStruct[]
  @activePerpetuals.State('selectedPerpetualID') selectedPerpetualID!: string | null
  filters: {
    contract: string
    startDate: null | number
  } = {
      contract: '',
      startDate: null,
    }
  cancelingOrder: TableData | null = null
  reloading: boolean = false

  get noData() {
    return this.tableBody.length <= 0
  }

  get orders() {
    if (!this.userAddress) {
      return []
    }
    return this.openOrders
  }

  get tableBody(): TableData[] {
    const newOrders = this.orders.filter(item => {
      if (this.filters.contract === '') {
        return item
      }
      const perpetualId = getPerpetualID(item.liquidityPoolAddress, item.perpetualIndex)
      if (this.filters.contract !== '' && this.filters.contract.toLowerCase() === perpetualId.toLowerCase()) {
        return item
      }
    })

    return newOrders.map(item => {
      const perpetualId = getPerpetualID(item.liquidityPoolAddress, item.perpetualIndex)
      const perpetual = this.getPerpetualFunc(perpetualId)
      const confirmedRate = (item.confirmedAmount as BigNumber).div((item.amount as BigNumber).abs()).times(100).abs()
      return {
        ...item,
        confirmedRate,
        confirmedPercent: confirmedRate.toFixed(),
        perpetualProperty: perpetual?.perpetualProperty || PerpetualProperty.emptyInstance(),
        underlyingSymbol: perpetual?.perpetualStorage.underlyingSymbol,
        collateralSymbol: perpetual?.perpetualProperty.collateralTokenSymbol,
      }
    })
  }

  get statusFormat(): any {
    return {
      canceled: this.$t('tableData.canceled'),
      pending: this.$t('tableData.pending'),
      partial_filled: this.$t('tableData.partialFilled'),
      full_filled: this.$t('tableData.fullyFilled'),
    }
  }

  get openOrdersCount() {
    if (!this.openOrders) {
      return 0
    }
    return this.openOrders.length
  }

  getIsLong(item: TableData) {
    return isLongPosition(item.amount as BigNumber, item.perpetualProperty?.isInverse)
  }

  getSideClass(item: TableData) {
    return this.getIsLong(item) ? ['is-long'] : ['is-short']
  }

  getOrderType(val: WS_ORDER_TYPE) {
    switch (val) {
      case WS_ORDER_TYPE.LimitOrder:
        return this.$t('order.limitOrder')
      case WS_ORDER_TYPE.StopLimitOrder:
        return this.$t('order.stopLimitOrder')
      default:
        return ''
    }
  }

  getStatus(status: any) {
    return this.statusFormat[status]
  }

  @Watch('jwtValue', { immediate: true })
  onJwtChanged() {
    if (this.jwtValue === '') {
      this.reloading = false
      return
    }
    this.reloading = true
  }

  @Watch('openOrdersCount', { immediate: true })
  @Watch('openOrders', { immediate: true })
  onOrderChanged() {
    this.reloading = false
  }

  noAvailableCancel(order: TableData) {
    return false
    // return (order.availableAmount as BigNumber).isZero()
  }

  async cancelOrder(order: TableData) {
    const orderState = this.noAvailableCancel(order)
    if (orderState) return
    this.cancelingOrder = order
    try {
      await this.callRelayerServerApiModifyingFunc(async () => {
        await cancelOrder(order.orderHash)
        VUE_EVENT_BUS.emit(PLACE_ORDER_EVENT.LoadAllOrders)
      })
    } catch (e) {
      console.warn(e)
    } finally {
      this.cancelingOrder = null
    }
  }

  async cancelAllOrder() {
    try {
      await this.callRelayerServerApiModifyingFunc(async () => {
        await cancelAllOrders()
        VUE_EVENT_BUS.emit(PLACE_ORDER_EVENT.LoadAllOrders)
      })
    } catch (e) {
      console.warn(e)
    }
  }

}