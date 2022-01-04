import { Module } from 'vuex'
import { Directory } from '@/type'
import BigNumber from 'bignumber.js'
import { queryTokenPrice } from '@/api/token'
import { SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/const'
import { isArray } from 'lodash'
import { tokenMapPair } from '@/config/tokenMap'

export type TokenPrice = { token: string; price: BigNumber, networkId: number }

interface PriceState {
  tokenPriceStorage: Directory<TokenPrice>
}

async function tokenPriceFetcher(tokens: string[], maxTimes = 3, networkId = TARGET_NETWORK_ID): Promise<Map<string, BigNumber | null>> {
  const tokenMapObj = new Map<string, string>( networkId === SUPPORTED_NETWORK_ID.BSC ? [] : tokenMapPair[networkId] || [])
  const mapTokens = tokens.map((t) => tokenMapObj.get(t.toLowerCase()) || t.toLowerCase())
  const priceMap = new Map<string, BigNumber | null>()
  try {
    const result = await queryTokenPrice(mapTokens, undefined, networkId)
    tokens.forEach((t) => {
      priceMap.set(t.toLowerCase(), result.get(tokenMapObj.get(t.toLowerCase()) || t.toLowerCase()) || null)
    })
    return priceMap
  } catch (e) {
    if (maxTimes > 0 && e.message && (e.message as string).includes('canceling statement due to conflict with recovery')) {
      console.info('tokenPriceFetcher retry', 4 - maxTimes)
      return await tokenPriceFetcher(tokens, maxTimes - 1, networkId)
    } else {
      return priceMap
    }
  }
}

const module: Module<PriceState, any> = {
  namespaced: true,

  state: () => {
    return {
      tokenPriceStorage: new Directory(),
    }
  },
  getters: {
    tokenPriceFunc: (state) => (token: string, networkId = TARGET_NETWORK_ID): BigNumber | null => {
      if (!token) {
        return null
      }
      return state.tokenPriceStorage.get(`${token.toLowerCase()}_${networkId}`)?.price || null
    },
  },
  actions: {
    async updateTokenPrice({ commit }, payload: string[] | { tokens: string[], networkId: SUPPORTED_NETWORK_ID }) {
      const tokens = isArray(payload) ? payload : payload.tokens
      const networkId = isArray(payload) ? TARGET_NETWORK_ID : payload.networkId
      const priceMap = await tokenPriceFetcher(tokens, undefined, networkId)
      commit('setTokenPrice', { priceMap, networkId })
    },
  },
  mutations: {
    setTokenPrice(state, payload: { priceMap: Map<string, BigNumber | null>, networkId: SUPPORTED_NETWORK_ID }) {
      const priceDirectory = state.tokenPriceStorage.clone()
      payload.priceMap.forEach((value, key) => {
        if (value) {
          priceDirectory.set(`${key.toLowerCase()}_${payload.networkId}`, { token: key.toLowerCase(), price: value, networkId: payload.networkId })
        }
      })
      state.tokenPriceStorage = priceDirectory
    },
  },
}

export default module
