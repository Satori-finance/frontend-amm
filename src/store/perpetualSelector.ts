import { Module } from 'vuex'
import { queryBlockByTimestamp } from '@/api/block'
import moment from 'moment/moment'
import { currentChainConfig } from '@/config/chain'
import { queryPerpetuals } from '@/api/perpetual'
import { Perpetual } from '@/type'

interface PerpetualSelectorState {
  loading: boolean
  searchKey: string
  perpetualsMap: Map<string, Perpetual>
  perpetualType: 'certified' | 'uncertified'
}

const module: Module<PerpetualSelectorState, any> = {
  namespaced: true,

  state: () => {
    return {
      loading: false,
      searchKey: '',
      perpetualType: 'certified',
      perpetualsMap: new Map<string, Perpetual>(),
    }
  },
  getters: {
    perpetuals(state): Perpetual[] {
      return Array.from(state.perpetualsMap.values())
    },
    perpetualsBySearchKey(state, getter): Perpetual[] {
      return (getter.perpetuals as Perpetual[]).filter(item => {
        return (state.perpetualType === 'certified' ? Number(item.symbol!) < 10000 : Number(item.symbol) >= 10000)
          && (
            item.symbol!.toString().includes(state.searchKey)
            || item.liquidityPool!.collateralName!.includes(state.searchKey.toUpperCase())
            || item.underlying!.includes(state.searchKey.toUpperCase())
          )
      })
    },
  },
  actions: {
    async updatePerpetuals({ commit }) {
      commit('setLoading', true)
      try {
        const blockInfo = await queryBlockByTimestamp(
          moment()
            .subtract(1, 'day')
            .unix(),
          currentChainConfig.subgraphConfig.blockSubgraph,
        )
        const result = await queryPerpetuals({
          search: '',
          oldBlockNumber: blockInfo.block ? Number(blockInfo.block.number) : undefined,
        })
        commit('setPerpetuals', result.perpetuals)
      } finally {
        commit('setLoading', false)
      }
    },
  },
  mutations: {
    setLoading(state, loading: boolean) {
      state.loading = loading
    },
    setSearchKey(state, searchKey: string) {
      state.searchKey = searchKey
    },
    setPerpetualType(state, perpetualType: 'certified' | 'uncertified') {
      state.perpetualType = perpetualType
    },
    setPerpetuals(state, perpetuals: Perpetual[]) {
      const map = new Map<string, Perpetual>(state.perpetualsMap.entries())
      perpetuals.forEach(p => {
        map.set(p.id, p)
      })
      state.perpetualsMap = map
    },
  },
}

export default module
