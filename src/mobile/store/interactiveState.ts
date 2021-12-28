import { Module } from 'vuex'

// Temporary storage of page interaction status
interface InteractiveState {
  daoMainInfoTab: 'info' | 'governance'
  tradePanelIsLoading: boolean
  showLeveragePopup: boolean
}

const module: Module<InteractiveState, any> = {
  namespaced: true,

  state: () => {
    return {
      daoMainInfoTab: 'info',
      tradePanelIsLoading: true,
      showLeveragePopup: false
    }
  },
  getters: {},
  actions: {},
  mutations: {
    updateDaoMainInfoTab(state, tab: 'info' | 'governance') {
      state.daoMainInfoTab = tab
    },
    updateTradePanelState(state, currentState: boolean) {
      state.tradePanelIsLoading = currentState
    },
    updateShowLeveragePopupState(state, currentState: boolean) {
      state.showLeveragePopup = currentState
    }
  },
}

export default module
