import { Component, Mixins, Watch } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import { OrderStruct, PerpetualCombinedState, PerpetualProperty, Trade } from '@/type'
import { ROUTE } from '@/router'
import { ORDER_STATUS } from '@/ts'
import { getMyOrders } from '@/api/order'
import { getPerpetualFromID, isLongPosition } from '@/utils'
import BigNumber from 'bignumber.js'
import { namespace } from 'vuex-class'
import debounceAsync from '@seregpie/debounce-async'
import { PLACE_ORDER_EVENT, VUE_EVENT_BUS } from '@/event'

export type TableData = Omit<OrderStruct, 'convert'> & { perpetualProperty: PerpetualProperty }

const perpetual = namespace('perpetual')
const wallet = namespace('wallet')
const auth = namespace('auth')

@Component
export default class OrderHistoryMixin extends Mixins(ErrorHandlerMixin) {
  @wallet.Getter('address') address!: string | null
  @perpetual.Getter('getPerpetualFunc') getPerpetualFunc!: (perpetualID: string) => PerpetualCombinedState | null
  @perpetual.Action('updatePerpetual') updatePerpetual!: (perpetualID: string) => Promise<void>
  @auth.Getter('isValidateFunc') isValidateFunc!: () => boolean
  @auth.State('jwt') jwt!: string

  loadingMore = false
  closedOrders: OrderStruct[] = []
  loading = false
  reloading = false
  noMore = false
  pageSize = 30
  filters: {
    contract: string
    startDate: null | number
  } = {
      contract: '',
      startDate: null,
    }
  debounceLoadOrders = debounceAsync(this.loadOrders, 100)
  debounceLoad = debounceAsync(this.load, 100)

  mounted() {
    VUE_EVENT_BUS.on(PLACE_ORDER_EVENT.OrderClosed, this.onCloseOrderChange)
  }

  destroyed() {
    VUE_EVENT_BUS.off(PLACE_ORDER_EVENT.OrderClosed, this.onCloseOrderChange)
  }

  get disableInfiniteScroll() {
    return this.loading
  }

  get noData() {
    return this.tableBody.length <= 0
  }

  get tableBody(): TableData[] {
    return this.closedOrders.map((item) => {
      return this.convertTrade(item)
    })
  }

  convertTrade(order: OrderStruct): TableData {
    const perpetualID = `${order.liquidityPoolAddress}-${order.perpetualIndex}`
    const perpetual = this.getPerpetualFunc(perpetualID)
    if (!perpetual) {
      this.updatePerpetual(perpetualID)
    }
    return Object.assign(
      {
        perpetualProperty: perpetual?.perpetualProperty || PerpetualProperty.emptyInstance(),
        underlyingSymbol: perpetual?.perpetualStorage.underlyingSymbol,
        collateralSymbol: perpetual?.perpetualProperty.collateralTokenSymbol
      },
      order,
    )
  }

  async load() {
    if (this.loading) {
      return
    }
    await this.debounceLoadOrders()
  }

  onCloseOrderChange(order: OrderStruct) {
    const perpetualID = `${order.liquidityPoolAddress}-${order.perpetualIndex}`.toLowerCase()
    if (this.filters.contract && this.filters.contract !== perpetualID) {
      return
    }
    this.closedOrders.unshift(order)
  }

  getOrderStatus(status: string) {
    switch (status) {
      case 'full_filled':
        return this.$t('tableData.fullyFilled')
      case 'partial_filled':
        return this.$t('tableData.partialFilled')
      case 'canceled':
        return this.$t('tableData.canceled')
    }
  }

  getOrderStatusClass(status: string) {
    switch (status) {
      case 'full_filled':
        return 'success'
      case 'partial_filled':
        return 'danger'
      case 'canceled':
        return 'danger'
    }
  }

  @Watch('address')
  @Watch('jwt')
  async reload() {
    if (this.reloading || !this.isValidateFunc()) {
      return
    }
    this.closedOrders = []
    this.noMore = false
    this.reloading = true
    await this.debounceLoad()
    this.reloading = false
  }

  getSideClass(item: TableData) {
    return isLongPosition(item.amount as BigNumber, item.perpetualProperty.isInverse) ? ['is-long'] : ['is-short']
  }

  getIsLong(item: TableData) {
    return isLongPosition(item.amount as BigNumber, item.perpetualProperty.isInverse)
  }

  switchContract(item: PerpetualProperty | null) {
    if (!item) {
      return
    }
    if (this.$route.name === ROUTE.TRADE_MAIN && this.$route.params.symbol === item.symbolStr) {
      return
    }
    this.$router.push({ name: ROUTE.TRADE_MAIN, params: { symbol: item.symbolStr } })
  }

  async loadOrders() {
    if (this.noMore || !this.isValidateFunc()) {
      return null
    }
    const status = [ORDER_STATUS.OrderFullFilled, ORDER_STATUS.OrderCanceled, ORDER_STATUS.OrderPartialFilled]
    this.loading = true
    await this.callRelayerServerApiReadFunc(async () => {
      let perpetualInfo
      let liquidityPoolAddress
      let perpetualIndex
      try {
        if (this.filters.contract !== '') {
          perpetualInfo = getPerpetualFromID(this.filters.contract)
          liquidityPoolAddress = perpetualInfo.liquidityPoolAddress
          perpetualIndex = perpetualInfo.perpetualIndex
        }
      } catch (e) {
        console.warn(e)
      }

      const result = await getMyOrders({
        liquidityPoolAddress,
        perpetualIndex,
        beginTime: this.filters.startDate || undefined,
        status: status.join(','),
        beforeOrderHash: this.closedOrders[this.closedOrders.length - 1]?.orderHash,
        limit: this.pageSize,
      })
      this.noMore = result.orders.length <= 0
      this.closedOrders = Array<OrderStruct>().concat(this.closedOrders, result.orders)
    })
    this.loading = false
  }

  @Watch('filters', { deep: true })
  onFilterChange() {
    this.reload()
  }
}
