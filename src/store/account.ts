import { Module } from 'vuex'
import { BigNumber } from 'bignumber.js'
import {
  _0,
  AccountStorage,
  getERC20Contract,
  getReaderContract,
  getBrokerContract,
  getBrokerBalanceOf,
  erc20Decimals,
  getAccountStorage,
  erc20Name,
  erc20Symbol,
  CHAIN_ID_TO_BROKER_ADDRESS,
} from '@mcdex/mai3.js'
import {
  DataNotFoundError,
  ContractError,
  PerpetualCombinedState,
  needUpdate,
  MarginAccount,
  GraphQLError,
  AllowanceDirectoryItem,
} from '@/type'
import { getLocalStorage, getPerpetualFromID, setLocalStorage, toBigNumber } from '@/utils'
import { mcLogger } from '@/utils/mcLogger'
import { Directory, AccountStorageDirectoryItem, AccountGasStorage, TokenBalanceDirectoryItem } from '@/type/common'
import { ROOT_GETTER } from '@/store/constant'
import { queryMarginAccounts } from '@/api/marginAccount'
import { Provider } from '@ethersproject/providers'
import { L1_NETWORK_ID, SUPPORTED_NETWORK_ID, TARGET_LEVERAGE_KEY, TARGET_NETWORK_ID } from '@/const'

const logger = mcLogger('STORE', 'Account')
const readingAccountStorages = new Set()
const readingAccountGasStorage = new Set()
const readingTokenBalance = new Set()
const readingAllowance = new Set()

export interface AccountState {
  accountStorages: Directory<AccountStorageDirectoryItem>
  accountGasStorage: Directory<AccountGasStorage>
  tokenBalances: Directory<TokenBalanceDirectoryItem>
  marginAccounts: Directory<MarginAccount>
  allowanceStorage: Directory<AllowanceDirectoryItem>
  targetLeverageStorage: Directory<BigNumber>
  loadingUserData: boolean
}

const module: Module<AccountState, any> = {
  namespaced: true,
  state: () => {
    return {
      accountStorages: new Directory(),
      accountGasStorage: new Directory(),
      tokenBalances: new Directory(),
      marginAccounts: new Directory(),
      allowanceStorage: new Directory(),
      targetLeverageStorage: new Directory(),
      loadingUserData: false,
    }
  },
  getters: {
    /**
     * current account marginAccounts info
     */
    marginAccounts(state, getters, rootState, rootGetters): MarginAccount[] {
      const trader = rootGetters[ROOT_GETTER.WALLET_ADDRESS]
      if (!trader) {
        return []
      } else {
        const data: MarginAccount[] = []
        state.marginAccounts.forEach((item, key) => {
          if (key.startsWith((trader as string).toLowerCase())) {
            data.push(item)
          }
        })
        return data
      }
    },
    marginAccountFunc: (state, getters, rootState, rootGetters) => (
      perpetualID: string,
    ): MarginAccount | null => {
      const trader = rootGetters[ROOT_GETTER.WALLET_ADDRESS]
      if (!trader) {
        return null
      }
      const marginAccountKey = getMarginAccountKey(trader, perpetualID)
      return state.marginAccounts.get(marginAccountKey) || null
    },
    accountStorageFunc: (state, getters, rootState, rootGetters) => (
      perpetualID: string,
    ): AccountStorageDirectoryItem | null => {
      const trader = rootGetters[ROOT_GETTER.WALLET_ADDRESS]
      if (!trader) {
        return null
      }
      return state.accountStorages.get(getAccountStorageKey(trader, perpetualID)) || null
    },
    accountGasStorage: (state, getters, rootState, rootGetters): AccountGasStorage | null => {
      const trader = rootGetters[ROOT_GETTER.WALLET_ADDRESS]
      if (!trader) {
        return null
      }
      return state.accountGasStorage.get(getAccountGasStorageKey(trader)) || null
    },
    tokenBalanceFunc: (state, getters, rootState, rootGetters) => (tokenAddress: string, networkId?: SUPPORTED_NETWORK_ID): TokenBalanceDirectoryItem | null => {
      const trader = rootGetters[ROOT_GETTER.WALLET_ADDRESS]
      if (!trader) {
        return null
      }
      return state.tokenBalances.get(getTokenBalanceKey(trader, tokenAddress, networkId || TARGET_NETWORK_ID)) || null
    },
    allowanceFunc: (state, getters, rootState, rootGetters) => (
      tokenAddress: string,
      spender: string,
      networkId?: SUPPORTED_NETWORK_ID,
    ): BigNumber => {
      const trader = rootGetters[ROOT_GETTER.WALLET_ADDRESS]
      if (!trader) {
        return _0
      }
      const token = state.tokenBalances.get(getTokenBalanceKey(trader, tokenAddress, networkId || TARGET_NETWORK_ID))
      const allowanceItem = state.allowanceStorage.get(getAllowanceKey(trader, tokenAddress, spender, networkId || TARGET_NETWORK_ID))
      return allowanceItem ? new BigNumber(allowanceItem.allowance.toString()).shiftedBy(-(token?.decimals || 0)) : _0
    },
    targetLeverageFunc: (state, getters, rootState, rootGetters) => (
      perpetualId: string,
    ): BigNumber | null => {
      const perp: PerpetualCombinedState | null = rootGetters[ROOT_GETTER.GET_PERPETUAL_FUNC](perpetualId)
      const trader = rootGetters[ROOT_GETTER.WALLET_ADDRESS]
      if (!trader || !perp) {
        return null
      }
      const key = getTargetLeverageKey(trader, perpetualId)
      const localStorageLeverage = toBigNumber(getLocalStorage(key))
      const targetLeverage = state.targetLeverageStorage.get(getTargetLeverageKey(trader, perpetualId))
      return new BigNumber((targetLeverage || (localStorageLeverage.isNaN() ? perp.perpetualStorage.defaultTargetLeverage.value : localStorageLeverage)).toFormat(2))
    },
    accountStorageWithPositions(
      state,
      getters,
      rootState,
      rootGetters,
    ): Array<{ perpetualID: string } & AccountStorageDirectoryItem> {
      const trader = rootGetters[ROOT_GETTER.WALLET_ADDRESS]
      if (!trader) {
        return []
      }
      return state.accountStorages.array
        .filter((item) => {
          return (item.positionAmount.abs().gt(0) || item.cashBalance.abs().gt(0)) && item._key.startsWith((trader as string).toLowerCase())
        })
        .map((item) => {
          const splitResult = item._key.split('-')
          return { ...item, perpetualID: `${splitResult[1]}-${splitResult[2]}` }
        })
    },
  },
  actions: {
    async updateAccountStorage({ state, commit, rootGetters, dispatch }, perpetualID: string) {
      const { liquidityPoolAddress, perpetualIndex } = getPerpetualFromID(perpetualID)
      const accountAddress = rootGetters[ROOT_GETTER.WALLET_ADDRESS]
      if (!accountAddress) {
        throw new DataNotFoundError('accountAddress')
      }
      const provider = rootGetters[ROOT_GETTER.WALLET_PROVIDER]
      if (!provider) {
        throw new DataNotFoundError('provider')
      }
      const accountStorageKey = getAccountStorageKey(accountAddress, perpetualID)
      const accountStorage = state.accountStorages.get(accountStorageKey)
      if (readingAccountStorages.has(accountStorageKey) || (accountStorage && !needUpdate(accountStorage))) {
        return
      }
      readingAccountStorages.add(accountStorageKey)
      commit('updateAccountStorageLoading', { accountAddress, perpetualID, loading: true })
      try {
        const readerContract = await getReaderContract(provider)
        const accountStorage = await getAccountStorage(
          readerContract,
          liquidityPoolAddress,
          perpetualIndex,
          accountAddress,
        )
        commit('updateAccountStorage', { accountAddress, perpetualID, accountStorage })
        dispatch('updateMarginAccounts')
        const perp: PerpetualCombinedState | null = rootGetters[ROOT_GETTER.GET_PERPETUAL_FUNC](perpetualID)
        if (perp) {
          dispatch('updateTokenBalance', { tokenAddress: perp.liquidityPoolStorage.collateral })
        }
      } catch (e) {
        commit('updateAccountStorageLoading', { accountAddress, perpetualID, loading: false })
        logger.error(['updateAccountStorage error', e])
        throw new ContractError(e)
      } finally {
        readingAccountStorages.delete(accountStorageKey)
      }
    },
    async updateMarginAccounts({ commit, rootGetters }) {
      const accountAddress = rootGetters[ROOT_GETTER.WALLET_ADDRESS]
      if (!accountAddress) {
        throw new DataNotFoundError('accountAddress')
      }
      try {
        const result = await queryMarginAccounts((accountAddress as string).toLowerCase())
        commit('updateMarginAccounts', { accountAddress, marginAccounts: result.marginAccounts })
      } catch (e) {
        throw new GraphQLError(e)
      }
    },
    async updateAccountGasStorage({ commit, rootGetters, state }) {
      const accountAddress = rootGetters[ROOT_GETTER.WALLET_ADDRESS]
      if (!accountAddress) {
        throw new DataNotFoundError('accountAddress')
      }
      const provider = rootGetters[ROOT_GETTER.WALLET_PROVIDER]
      if (!provider) {
        throw new DataNotFoundError('provider')
      }
      const key = getAccountGasStorageKey(accountAddress)
      const accountGasStorage = state.accountGasStorage.get(key)
      if (readingAccountGasStorage.has(key) || (accountGasStorage && !needUpdate(accountGasStorage))) {
        return
      }
      readingAccountGasStorage.add(key)
      commit('updateAccountGasStorageLoading', { accountAddress, loading: true })
      try {
        const BrokerContract = getBrokerContract(CHAIN_ID_TO_BROKER_ADDRESS[TARGET_NETWORK_ID], provider)
        const gasBalance = await getBrokerBalanceOf(BrokerContract, accountAddress)
        commit('updateAccountGasStorage', { accountAddress, gasBalance })
      } catch (e) {
        commit('updateAccountGasStorageLoading', { accountAddress, loading: false })
        logger.error(['updateAccountStorage error', e])
        throw new ContractError(e)
      } finally {
        readingAccountGasStorage.delete(key)
      }
    },
    async updateTokenBalance(
      { commit, rootState, rootGetters, state },
      { tokenAddress, networkId = TARGET_NETWORK_ID }: { tokenAddress: string, networkId?: SUPPORTED_NETWORK_ID },
    ) {
      const accountAddress = rootGetters[ROOT_GETTER.WALLET_ADDRESS]
      if (!accountAddress) {
        throw new DataNotFoundError('accountAddress')
      }
      const provider = networkId === L1_NETWORK_ID ? rootGetters[ROOT_GETTER.WALLET_PROVIDER_L1] : rootGetters[ROOT_GETTER.WALLET_PROVIDER]
      if (!provider) {
        throw new DataNotFoundError('provider')
      }
      const key = getTokenBalanceKey(accountAddress, tokenAddress, networkId)
      const tokenBalance = state.tokenBalances.get(key)
      if (readingTokenBalance.has(key) || (tokenBalance && !needUpdate(tokenBalance))) {
        return
      }
      readingTokenBalance.add(key)
      commit('updateTokenBalanceLoading', { accountAddress, tokenAddress, loading: true, networkId })

      const nullIfNotDeployed = (err: Error & { code?: string }): null => {
        if (err.code === 'CALL_EXCEPTION') {
          return null
        }
        throw err
      }

      const getTokenInfo = async (p: Provider) => {
        const erc20Contract = getERC20Contract(tokenAddress, p)
        const [
          tokenBalance,
          tokenTotalSupply,
          tokenDecimals,
          tokenName,
          tokenSymbol,
        ] = await Promise.all([
          erc20Contract.balanceOf(accountAddress).catch((e: Error) => nullIfNotDeployed(e)),
          erc20Contract.totalSupply().catch((e: Error) => nullIfNotDeployed(e)),
          erc20Decimals(erc20Contract).catch((e: Error) => nullIfNotDeployed(e)),
          erc20Name(erc20Contract).catch((e: Error) => nullIfNotDeployed(e)),
          erc20Symbol(erc20Contract).catch((e: Error) => nullIfNotDeployed(e)),
        ])

        return {
          balance: tokenBalance,
          totalSupply: tokenTotalSupply,
          tokenName: tokenName,
          symbol: tokenSymbol,
          decimals: tokenDecimals,
        }
      }

      try {
        const [
          tokenInfoL1,
          tokenInfoL2,
        ] = await Promise.all([
          // getTokenInfo(providerL1),
          {},
          getTokenInfo(provider)],
        )

        const mergeTokenInfo = (
          l1Token: any,
          l2Token: typeof tokenInfoL2,
        ) => {
          const decimals = l2Token.decimals !== null ? l2Token.decimals : l1Token?.decimals || 0

          return {
            balance:
              l2Token.balance && decimals !== null
                ? new BigNumber(l2Token.balance.toString()).shiftedBy(-decimals)
                : null,
            totalSupply:
              l2Token.totalSupply && decimals !== null
                ? new BigNumber(l2Token.totalSupply.toString()).shiftedBy(-decimals)
                : null,
            balanceL1:
              l1Token.balance && decimals !== null
                ? new BigNumber(l1Token.balance.toString()).shiftedBy(-decimals)
                : null,
            totalSupplyL1:
              l1Token.totalSupply && decimals !== null
                ? new BigNumber(l1Token.totalSupply.toString()).shiftedBy(-decimals)
                : null,
            symbol: l2Token.symbol || l1Token.symbol || '',
            name: l2Token.tokenName || l1Token.tokenName || '',
            decimals,
          }
        }

        commit('updateTokenBalance', {
          accountAddress,
          tokenAddress,
          networkId,
          ...mergeTokenInfo(tokenInfoL1, tokenInfoL2),
        })
      } catch (e) {
        commit('updateTokenBalanceLoading', { accountAddress, tokenAddress, loading: false, networkId })
        logger.error('updateTokenBalance error', `"${tokenAddress}"`, e)
        throw new ContractError(e)
      } finally {
        readingTokenBalance.delete(key)
      }
    },
    async updateAllowance(
      { commit, rootState, rootGetters, state },
      {
        tokenAddress,
        spenderAddress,
        networkId = TARGET_NETWORK_ID,
      }: { tokenAddress: string; spenderAddress: string, networkId: SUPPORTED_NETWORK_ID },
    ) {
      const accountAddress = rootGetters[ROOT_GETTER.WALLET_ADDRESS]
      if (!accountAddress) {
        throw new DataNotFoundError('accountAddress')
      }
      const provider = networkId === L1_NETWORK_ID ? rootGetters[ROOT_GETTER.WALLET_PROVIDER_L1] : rootGetters[ROOT_GETTER.WALLET_PROVIDER]
      if (!provider) {
        throw new DataNotFoundError('provider')
      }
      const key = getAllowanceKey(accountAddress, tokenAddress, spenderAddress, networkId)
      const allowanceItem = state.allowanceStorage.get(key)
      if (readingAllowance.has(key) || (allowanceItem && !needUpdate(allowanceItem))) {
        return
      }
      readingAllowance.add(key)
      commit('updateAllowanceLoading', { accountAddress, tokenAddress, spenderAddress, loading: true, networkId })

      try {
        const erc20Contract = getERC20Contract(tokenAddress, provider)
        const allowance = await erc20Contract.allowance(accountAddress, spenderAddress)

        commit('updateAllowance', {
          accountAddress,
          tokenAddress,
          spenderAddress,
          allowance,
          networkId,
        })
      } catch (e) {
        commit('updateAllowanceLoading', { accountAddress, tokenAddress, spenderAddress, loading: false, networkId })
        logger.error('updateAllowance error', `${tokenAddress}-${spenderAddress}-${networkId}`, e)
        throw new ContractError(e)
      } finally {
        readingAllowance.delete(key)
      }
    },
  },
  mutations: {
    reset(state) {
      state.accountStorages.clear()
      state.accountGasStorage.clear()
      state.tokenBalances.clear()
      state.marginAccounts.clear()
      state.allowanceStorage.clear()
      state.loadingUserData = false
    },
    updateMarginAccounts(state, payload: { accountAddress: string; marginAccounts: MarginAccount[] }) {
      payload.marginAccounts.forEach((item) => {
        const key = getMarginAccountKey(payload.accountAddress, item.perpetualID as string)
        state.marginAccounts.set(key, item)
      })
    },
    updateAccountStorageLoading(state, payload: { accountAddress: string; perpetualID: string; loading: boolean }) {
      const key = getAccountStorageKey(payload.accountAddress, payload.perpetualID)
      const accountStorage = state.accountStorages.get(key)
      if (accountStorage) {
        accountStorage.loading = payload.loading
      }
    },
    updateAccountStorage(
      state,
      payload: { accountAddress: string; perpetualID: string; accountStorage: AccountStorage },
    ) {
      const key = getAccountStorageKey(payload.accountAddress, payload.perpetualID)
      state.accountStorages.set(key, {
        ...payload.accountStorage,
        loading: false,
        updateTime: Date.now(),
      })
    },
    updateAccountGasStorageLoading(state, { accountAddress, loading }: { accountAddress: string; loading: boolean }) {
      const key = getAccountGasStorageKey(accountAddress)
      const gasStorage = state.accountGasStorage.get(key)
      if (gasStorage) {
        gasStorage.loading = loading
      }
    },
    updateAccountGasStorage(state, { accountAddress, gasBalance }: { accountAddress: string; gasBalance: BigNumber }) {
      const key = getAccountGasStorageKey(accountAddress)
      state.accountGasStorage.set(key, {
        balance: gasBalance,
        loading: false,
        updateTime: Date.now(),
      })
    },
    updateTokenBalanceLoading(
      state,
      payload: { accountAddress: string; tokenAddress: string; loading: boolean, networkId?: SUPPORTED_NETWORK_ID },
    ) {
      const key = getTokenBalanceKey(payload.accountAddress, payload.tokenAddress, payload.networkId || TARGET_NETWORK_ID)
      const tokenBalance = state.tokenBalances.get(key)
      if (tokenBalance) {
        tokenBalance.loading = payload.loading
      }
    },
    updateTokenBalance(
      state,
      payload: {
        accountAddress: string
        tokenAddress: string
        spenderAddress: string
        networkId?: SUPPORTED_NETWORK_ID
      } & TokenBalanceDirectoryItem,
    ) {
      const key = getTokenBalanceKey(payload.accountAddress, payload.tokenAddress, payload.networkId || TARGET_NETWORK_ID)
      state.tokenBalances.set(key, {
        balance: payload.balance,
        totalSupply: payload.totalSupply,
        balanceL1: payload.balanceL1,
        totalSupplyL1: payload.totalSupply,
        tokenName: payload.tokenName,
        symbol: payload.symbol,
        decimals: payload.decimals,
        loading: false,
        updateTime: Date.now(),
      })
    },
    updateAllowanceLoading(
      state,
      payload: { accountAddress: string; tokenAddress: string; spenderAddress: string; loading: boolean, networkId?: SUPPORTED_NETWORK_ID },
    ) {
      const key = getAllowanceKey(payload.accountAddress, payload.tokenAddress, payload.spenderAddress, payload.networkId || TARGET_NETWORK_ID)
      const allowanceItem = state.allowanceStorage.get(key)
      if (allowanceItem) {
        allowanceItem.loading = payload.loading
      }
    },
    updateAllowance(
      state,
      payload: {
        accountAddress: string
        tokenAddress: string
        spenderAddress: string
        networkId?: SUPPORTED_NETWORK_ID
      } & AllowanceDirectoryItem,
    ) {
      const key = getAllowanceKey(payload.accountAddress, payload.tokenAddress, payload.spenderAddress, payload.networkId || TARGET_NETWORK_ID)
      state.allowanceStorage.set(key, {
        allowance: payload.allowance,
        loading: false,
        updateTime: Date.now(),
      })
    },
    updateTargetLeverage(
      state,
      payload: {
        accountAddress: string
        perpetualId: string
        leverage: BigNumber
      },
    ) {
      const key = getTargetLeverageKey(payload.accountAddress, payload.perpetualId)
      setLocalStorage(key, payload.leverage.toFormat(2))
      state.targetLeverageStorage.set(key, toBigNumber(payload.leverage.toFormat(2)))
    },
    setLoadingUserData(state, loading: boolean) {
      state.loadingUserData = loading
    },
  },
}

export function getAccountGasStorageKey(accountAddress: string): string {
  return `${accountAddress.toLowerCase()}`
}

export function getAccountStorageKey(accountAddress: string, perpetualID: string): string {
  return `${accountAddress.toLowerCase()}-${perpetualID.toLowerCase()}`
}

export function getMarginAccountKey(accountAddress: string, perpetualID: string): string {
  return getAccountStorageKey(accountAddress, perpetualID)
}

export function getTokenBalanceKey(accountAddress: string, tokenAddress: string, networkID: SUPPORTED_NETWORK_ID): string {
  return `${accountAddress.toLowerCase()}-${tokenAddress.toLowerCase()}-${networkID}`
}

export function getAllowanceKey(accountAddress: string, tokenAddress: string, spender: string, networkID: SUPPORTED_NETWORK_ID): string {
  return `${accountAddress.toLowerCase()}-${tokenAddress.toLowerCase()}-${spender.toLowerCase()}-${networkID}`
}

export function getTargetLeverageKey(accountAddress: string, perpetualId: string): string {
  return `${TARGET_LEVERAGE_KEY}${accountAddress.toLowerCase()}-${perpetualId.toLowerCase()}`
}

export default module
