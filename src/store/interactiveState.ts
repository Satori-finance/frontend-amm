import { Module } from 'vuex'

// Temporary storage of page interaction status
interface InteractiveState {
  tradePanelIsLoading: boolean
}

const module: Module<InteractiveState, any> = {
  namespaced: true,

  state: () => {
    return {
      tradePanelIsLoading: true
    }
  },
  getters: {},
  actions: {},
  mutations: {
    updateTradePanelState(state, currentState: boolean) {
      state.tradePanelIsLoading = currentState
    }
  },
}

export default module
