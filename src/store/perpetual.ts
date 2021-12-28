/* perpetual store */
import { Module } from 'vuex'
import {
  ContractError,
  DataNotFoundError,
  Directory,
  needUpdate,
  LiquidityPoolDirectoryItem,
  PerpetualCombinedState,
  PerpetualProperty,
} from '@/type'
import { readLiquidityPoolCombinedStorage } from '@/utils/perpetual'
import { setLocalStorage, getPerpetualFromID } from '@/utils'
import { mcLogger } from '@/utils/mcLogger'
import { ROOT_GETTER } from '@/store/constant'

const logger = mcLogger('Store', 'Perp')

const readingPools = new Set<string>()

interface PerpetualState {
  liquidityPool: Directory<LiquidityPoolDirectoryItem>
  symbolToPerpetualID: Directory<string>
}

const module: Module<PerpetualState, any> = {
  namespaced: true,
  state: () => {
    return {
      liquidityPool: new Directory<LiquidityPoolDirectoryItem>(),
      symbolToPerpetualID: new Directory(),
    }
  },
  getters: {
    getLiquidityPoolFunc: (state) => (liquidityPoolAddress: string): LiquidityPoolDirectoryItem | null => {
      return state.liquidityPool.get(liquidityPoolAddress.toLowerCase()) || null
    },
    getPerpetualFunc: (state) => (perpetualID: string): PerpetualCombinedState | null => {
      const { liquidityPoolAddress, perpetualIndex } = getPerpetualFromID(perpetualID)
      const pool = state.liquidityPool.get(liquidityPoolAddress.toLowerCase())
      if (!pool) {
        return null
      }
      const prop = pool.perpetualPropertyMap.get(perpetualIndex)
      if (!prop) {
        return null
      }
      const perpetualStorage = pool.liquidityPoolStorage.perpetuals.get(perpetualIndex)
      if (!perpetualStorage) {
        return null
      }
      return {
        liquidityPoolStorage: pool.liquidityPoolStorage,
        perpetualStorage: perpetualStorage,
        perpetualProperty: prop,
      }
    },
    liquidityPools: state => state.liquidityPool.array,
    perpetuals: state => {
      const perps: PerpetualCombinedState[] = []
      state.liquidityPool.forEach(pool => {
        pool.liquidityPoolStorage.perpetuals.forEach((perp, perpetualIndex) => {
          const prop = pool.perpetualPropertyMap.get(perpetualIndex)
          const perpetualStorage = pool.liquidityPoolStorage.perpetuals.get(perpetualIndex)
          if (prop && perpetualStorage) {
            perps.push({
              liquidityPoolStorage: pool.liquidityPoolStorage,
              perpetualStorage: perpetualStorage,
              perpetualProperty: prop,
            })
          }
        })
      })
      perps.sort((a: PerpetualCombinedState, b: PerpetualCombinedState) => {
        let s = a.perpetualProperty.symbol - b.perpetualProperty.symbol
        if (s != 0) {
          return s
        }
        return a.perpetualProperty.liquidityPoolAddress.localeCompare(b.perpetualProperty.liquidityPoolAddress)
      })
      return perps
    }
  },
  actions: {
    async updateLiquidityPool({ commit, state, rootGetters }, liquidityPoolAddress: string) {
      const key = liquidityPoolAddress.toLowerCase()
      const provider = rootGetters[ROOT_GETTER.WALLET_PROVIDER]
      if (!provider) {
        throw new DataNotFoundError('provider')
      }
      const pool = state.liquidityPool.get(key)
      // if loading or last update time less than 10s, skip the updating
      if (pool && !needUpdate(pool)) {
        return
      }
      if (readingPools.has(key)) {
        return
      }
      readingPools.add(key)
      commit('setLiquidityPoolLoading', { liquidityPoolAddress: key, loading: true })
      try {
        const pool = await readLiquidityPoolCombinedStorage(key, provider)
        commit('updateLiquidityPool', { ...pool, loading: false, updateTime: Date.now() })
      } catch (e) {
        commit('setLiquidityPoolLoading', { liquidityPoolAddress: key, loading: false })
        logger.error(`update LiquidityPool ${key} error`, e)
        throw new ContractError(e)
      } finally {
        readingPools.delete(key)
      }
    },
    async updatePerpetual({ dispatch }, perpetualID: string) {
      const { liquidityPoolAddress } = getPerpetualFromID(perpetualID)
      await dispatch('updateLiquidityPool', liquidityPoolAddress)
    },
  },
  mutations: {
    deleteLiquidityPool(state, liquidityPoolAddress: string) {
      state.liquidityPool.delete(liquidityPoolAddress.toLowerCase())
    },
    updateLiquidityPool(state, pool: LiquidityPoolDirectoryItem) {
      state.liquidityPool.set(pool.liquidityPoolAddress.toLowerCase(), pool)
      pool.perpetualPropertyMap.forEach(prop => {
        state.symbolToPerpetualID.set(prop.symbolStr, prop.perpetualID)
      })
    },
    setLiquidityPoolLoading(state, payload: { liquidityPoolAddress: string, loading: boolean }) {
      const pool = state.liquidityPool.get(payload.liquidityPoolAddress.toLowerCase())
      if (pool) {
        pool.loading = payload.loading
      }
    },
  },
}

export default module
