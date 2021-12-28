import Vue from 'vue'
import Vuex, { StoreOptions } from 'vuex'

import preference from './preference'
import order from './order'
import wallet from './wallet'
import perpetual from './perpetual'
import account from './account'
import auth from './auth'
import activePerpetuals from './activePerpetuals'
import poolList from './poolList'
import price from './price'
import interactiveState from './interactiveState'
import perpetualSelector from './perpetualSelector'
import token from './token'

Vue.use(Vuex)

export interface RootState {
  latestBlockNumber: number | null
  isMobile: boolean
  routing: boolean
  routeValidatorPassport: Set<string>
}

export const storeOption: StoreOptions<RootState> = {
  state: {
    latestBlockNumber: null,
    isMobile: false,
    routing: false,
    routeValidatorPassport: new Set<string>(),
  },
  getters: {
    routePassed: state => (key: string) => {
      return state.routeValidatorPassport.has(key)
    },
  },
  mutations: {
    updateLatestBlockNumber(state, blockNumber: number) {
      state.latestBlockNumber = blockNumber
    },
    setIsMobile(state, isMobile: boolean) {
      state.isMobile = isMobile
    },
    setRouting(state, routing: boolean) {
      state.routing = routing
    },
    setRouteValidatorPassport(state, key: string) {
      const passport = new Set(state.routeValidatorPassport)
      passport.add(key)
      state.routeValidatorPassport = passport
    },
  },
  actions: {},
  modules: {
    preference,
    order,
    wallet,
    perpetual,
    account,
    auth,
    activePerpetuals,
    poolList,
    price,
    perpetualSelector,
    token,
  },
}

const pcStoreOption: StoreOptions<RootState> = {
  ...storeOption,
  modules: {
    ...storeOption.modules,
    interactiveState,
  },
}

export default new Vuex.Store<RootState>(pcStoreOption)
