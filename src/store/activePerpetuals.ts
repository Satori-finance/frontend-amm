import { Module } from 'vuex'
import { ContractError, DataNotFoundError } from '@/type'
import { loadActivatePerpetuals } from '@/utils'
import { mcLogger } from '@/utils/mcLogger'
import { ROOT_GETTER } from '@/store/constant'

const logger = mcLogger('STORE', 'ActivePerpetual')

export interface ActivePerpetualState {
  activePerpetuals: string[]
  selectedPerpetualID: string | null
  loading: boolean
}

const module: Module<ActivePerpetualState, any> = {
  namespaced: true,
  state: () => {
    return {
      activePerpetuals: [],
      selectedPerpetualID: null,
      loading: false,
    }
  },
  getters: {
    activePerpetualIds: (state): string[] => state.activePerpetuals.map((item) => item.toLowerCase()),
    trackedPerpetualIds: (state, getters, rootState, rootGetters): string[] => {
      if (!state.selectedPerpetualID || getters.activePerpetualIds.includes(state.selectedPerpetualID)) {
        return getters.activePerpetualIds
      } else {
        return [...getters.activePerpetualIds, state.selectedPerpetualID]
      }
    },
  },
  actions: {
    async loadActivePerpetuals({ commit, rootGetters }) {
      const address = rootGetters[ROOT_GETTER.WALLET_ADDRESS]
      if (!address) {
        throw new DataNotFoundError('address')
      }
      const provider = rootGetters[ROOT_GETTER.WALLET_PROVIDER]
      if (!provider) {
        throw new DataNotFoundError('provider')
      }
      commit('startLoading')
      try {
        const perpetuals = await loadActivatePerpetuals(address, provider)
        commit('updateActivePerpetuals', perpetuals)
      } catch (e) {
        logger.error('load active perpetuals error', e)
        throw new ContractError(e)
      } finally {
        commit('endLoading')
      }
    },
  },
  mutations: {
    reset(state) {
      state.activePerpetuals = []
      state.loading = false
    },
    startLoading(state) {
      state.loading = true
    },
    endLoading(state) {
      state.loading = false
    },
    updateActivePerpetuals(state, perpetuals: string[]) {
      state.activePerpetuals = perpetuals
    },
    updateSelectPerpetualID(state, perpetualID?: string) {
      if (!perpetualID) {
        return
      }
      state.selectedPerpetualID = perpetualID.toLowerCase()
    },
  },
}

export default module
