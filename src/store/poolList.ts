import { Module } from 'vuex'
import { mcLogger } from '@/utils/mcLogger'
import { PoolListItem, PoolListSubItem, PoolListType } from '@/template/Pool/type'

const logger = mcLogger('STORE', 'PoolList')

interface PoolListState {
  poolList: Array<PoolListItem> | null
  subPoolList: { [poolAddress: string]: PoolListSubItem }
  searchKey: string | null
  currentPage: number
  selectedListType: PoolListType
  onlyMine: boolean
  lastRefreshTimeStamp: number
}

const module: Module<PoolListState, any> = {
  namespaced: true,

  state: () => {
    return {
      poolList: null,
      subPoolList: {},
      searchKey: null,
      currentPage: 1,
      selectedListType: '',
      onlyMine: false,
      lastRefreshTimeStamp: 0
    }
  },
  getters: {},
  actions: {
    resetPoolListStorage({ commit }) {
      commit('updatePoolList', null)
      commit('updateSubPoolList', {})
      commit('updateSearchKey', null)
      commit('updateCurrentPage', 1)
      commit('updateSelectListType', 'certified')
      commit('updateOnlyMine', false)
    }
  },
  mutations: {
    updatePoolList(state, data: Array<PoolListItem> | null) {
      state.poolList = data
    },
    updateSubPoolList(state, data: { [poolAddress: string]: PoolListSubItem }) {
      state.subPoolList = data
    },
    updateSearchKey(state, searchKey: string | null) {
      state.searchKey = searchKey
    },
    updateCurrentPage(state, pageSize: number) {
      if (state.currentPage === pageSize) {
        return
      }
      state.currentPage = pageSize
    },
    updateLastRefreshTimeStamp(state, timestamp: number) {
      state.lastRefreshTimeStamp = timestamp
    },
    updateSelectListType(state, v: PoolListType) {
      state.selectedListType = v
    },
    updateOnlyMine(state, v: boolean) {
      state.onlyMine = v
    },
  },
}

export default module
