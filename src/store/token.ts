import { Module } from 'vuex'
import { mcLogger } from '@/utils/mcLogger'
import { initTokens, TokenConfig } from '@/config/tokens'

const logger = mcLogger('STORE', 'Token')

interface TokenState {
  tokenConfig: TokenConfig | null,
}

const module: Module<TokenState, any> = {
  namespaced: true,

  state: () => {
    return {
      tokenConfig: null,
    }
  },
  getters: {
    tokenConfigs: (state) => (state.tokenConfig?.tokenConfigs || {}),
    chainAllTokenList: (state) => (state.tokenConfig?.chainAllTokenList || []),
    l1ChainAllTokenList: (state) => (state.tokenConfig?.l1ChainAllTokenList || []),
    collateralTokenWhiteList: (state) => (state.tokenConfig?.collateralTokenWhiteList || []),
    l1CollateralTokenWhiteList: (state) => (state.tokenConfig?.l1CollateralTokenWhiteList || []),
  },
  actions: {
    async initTokenConfig({commit}) {
      try {
        const config = await initTokens()
        commit('setTokenConfig', config)
      } catch (e) {
        logger.error('init token config:', e)
      }
    }
  },
  mutations: {
    setTokenConfig(state, config: TokenConfig) {
      state.tokenConfig = config
    }
  },
}

export default module
