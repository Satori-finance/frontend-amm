import { Module } from 'vuex'
import { DataNotFoundError, Directory, OrderStruct, UpdateStatus } from '@/type'
import { getMyOrder, getMyOrders } from '@/api/order'
import { ORDER_STATUS } from '@/ts'
import * as _ from 'lodash'
import { Moment } from 'moment'
import { ROOT_GETTER } from '@/store/constant'
import { PLACE_ORDER_EVENT, VUE_EVENT_BUS } from '@/event'

export type OrderDirectoryItem = OrderStruct & UpdateStatus

interface OrderState {
  openOrderStorage: Directory<OrderDirectoryItem>
}

const module: Module<OrderState, any> = {
  namespaced: true,

  state: () => {
    return {
      openOrderStorage: new Directory(),
    }
  },
  getters: {
    openOrderStorageFunc: (state) => (orderId: string): OrderDirectoryItem | null => {
      return state.openOrderStorage.get(orderId) || null
    },
    openOrders(state): OrderDirectoryItem[] {
      return _.orderBy(state.openOrderStorage.array, item => {
        return (item.createdAt as Moment).valueOf()
      }, 'desc')
    },
  },
  actions: {
    async loadOpenOrders({ rootGetters, commit }) {
      const isValidateFunc = rootGetters[ROOT_GETTER.IS_VALIDATE_FUNC]
      if (!isValidateFunc()) {
        throw new DataNotFoundError('jwt')
      }
      const status = [ORDER_STATUS.OrderPending]
      const result = await getMyOrders({ status: status.join(',') })
      commit('initOpenOrders', result.orders)
    },
    async updateOpenOrder({ rootState, commit }, order: OrderStruct) {
      commit('setOpenOrder', order)
    },
  },
  mutations: {
    reset(state) {
      state.openOrderStorage.clear()
    },
    initOpenOrders(state, orders: OrderDirectoryItem[]) {
      const orderDirectory = new Directory<OrderDirectoryItem>()
      orders.forEach(item => {
        orderDirectory.set(item.orderHash, item)
      })
      state.openOrderStorage = orderDirectory
      if (orders.length) {
        VUE_EVENT_BUS.emit(PLACE_ORDER_EVENT.InitLoadOrders)
      }
    },
    setOpenOrder(state, order: OrderDirectoryItem) {
      state.openOrderStorage.set(order.orderHash, order)
    },
    removeOpenOrder(state, order: OrderDirectoryItem) {
      state.openOrderStorage.delete(order.orderHash)
    },
    setOpenOrderLoading(state, payload: { orderId: string, loading: boolean }) {
      const order = state.openOrderStorage.get(payload.orderId)
      if (order) {
        order.loading = payload.loading
      }
    },
  },
}

export default module
