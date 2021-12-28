import { Module } from 'vuex'
import {
  connectCoin98Wallet,
  connectImTokenWallet,
  connectMetaMaskWallet,
  connectMobileInjectWallet, connectTrustWallet,
  connectWCWallet,
  connectWLWallet,
  getLastWalletType,
  SUPPORTED_WALLET,
  tryRecoverWallet,
  Wallet,
} from '@/business-components/wallet/wallet-connector'
import BigNumber from 'bignumber.js'
import { ContractError, DataNotFoundError } from '@/type'
import { mcLogger } from '@/utils/mcLogger'
import { currentChainConfig } from '@/config/chain'
import {
  L1_NETWORK_ID,
  L1_NETWORK_PROVIDER_RPC,
  NETWORK_PROVIDER_RPC,
  SUPPORTED_NETWORK_ID,
  TARGET_NETWORK_ID,
} from '@/constants'
import { ethers } from 'ethers'
import { LOGIN_SESSION_EVENT, VUE_EVENT_BUS, WALLET_EVENT } from '@/event'
import { _0 } from '@mcdex/mai3.js'

const logger = mcLogger('STORE', 'Wallet')
const defaultProvider = new ethers.providers.StaticJsonRpcProvider({ url: NETWORK_PROVIDER_RPC, timeout: 30000 })
const defaultL1Provider = new ethers.providers.StaticJsonRpcProvider({ url: L1_NETWORK_PROVIDER_RPC, timeout: 30000 })

interface WalletState {
  walletType: SUPPORTED_WALLET | null
  wallet: null | Wallet
  nativeTokenBalance: BigNumber | null
  nativeTokenBalanceL1: BigNumber | null
}

function onNetworkChanged() {
  VUE_EVENT_BUS.emit(LOGIN_SESSION_EVENT.NetworkChanged)
}

function onAddressChanged() {
  VUE_EVENT_BUS.emit(LOGIN_SESSION_EVENT.AddressChanged)
}

const module: Module<WalletState, any> = {
  namespaced: true,

  state: () => {
    return {
      walletType: null,
      wallet: null,
      nativeTokenBalance: null,
      nativeTokenBalanceL1: null,
    }
  },
  getters: {
    walletNetworkId: (state) => state.wallet?.networkId || null,
    networkId: (state) => (state.wallet ? state.wallet.networkId : TARGET_NETWORK_ID),
    address: (state) => (state.wallet ? state.wallet.address : null),
    signerL1: (state, getters) => {
      if (!getters.address) {
        return null
      }
      return getters.isL1 && getters.signer ? getters.signer : getters.providerL1.getSigner(getters.address)
    },
    signerL2: (state, getters) => {
      if (!getters.address) {
        return null
      }
      return getters.isL2 && getters.signer ? getters.signer : getters.provider.getSigner(getters.address)
    },
    signer: (state) => {
      if (!state.wallet) {
        return null
      }
      return state.wallet.signer
    },
    provider: (state, getters) =>
      state.wallet && !getters.isWrongNetwork && getters.isL2 ? state.wallet.provider : defaultProvider,
    providerL1: (state, getters) => (getters.isL1 && state.wallet ? state.wallet.provider : defaultL1Provider),
    isWrongNetwork: (state, getters) => getters.networkId !== TARGET_NETWORK_ID,
    isConnectedWallet: (state, getters) => getters.address && getters.address !== '',
    isL1: (state, getters) => getters.networkId === L1_NETWORK_ID,
    isL2: (state, getters) => getters.networkId === TARGET_NETWORK_ID,
    useCustomGasLimit: (state) => {
      if (currentChainConfig.chainID === SUPPORTED_NETWORK_ID.BSC) {
        return true
      }
      return false
    },
    availableNativeTokenBalance: (state) => {
      const config = currentChainConfig
      if (state.nativeTokenBalance && config) {
        if (state.nativeTokenBalance.isZero()) {
          return state.nativeTokenBalance
        }
        return state.nativeTokenBalance.minus(config.minGasLimit)
      }
      return null
    },
    isMobileWallet: (state) => {
      if (state.walletType
        && (
          state.walletType === SUPPORTED_WALLET.WalletLink
          || state.walletType === SUPPORTED_WALLET.WalletConnect
          || state.walletType === SUPPORTED_WALLET.imToken
          || state.walletType === SUPPORTED_WALLET['Trust Wallet']
        )) {
        return true
      }
      return false
    }
  },
  actions: {
    async connectWallet({ commit, rootState }, walletType: SUPPORTED_WALLET = SUPPORTED_WALLET.MetaMask) {
      let wallet: Wallet
      const isMobile = rootState['isMobile']
      if (isMobile) {
        switch (walletType) {
          case SUPPORTED_WALLET.WalletConnect:
            wallet = await connectWCWallet(undefined, true)
            break
          case SUPPORTED_WALLET.imToken:
            wallet = await connectImTokenWallet(undefined, true)
            break
          case SUPPORTED_WALLET['Trust Wallet']:
            wallet = await connectTrustWallet(undefined, true)
            break
          case SUPPORTED_WALLET.WalletLink:
            // TODO: connect walletlink coinbase
            wallet = await connectWLWallet()
            break
          default:
            wallet = await connectMobileInjectWallet()
            break
        }
      } else if (walletType == SUPPORTED_WALLET.MetaMask) {
        wallet = await connectMetaMaskWallet(true)
      } else if (walletType === SUPPORTED_WALLET['Coin98 Wallet']) {
        wallet = await connectCoin98Wallet(true)
      } else if (walletType == SUPPORTED_WALLET.WalletLink) {
        wallet = await connectWLWallet()
      } else {
        logger.error('bad wallet type', walletType)
        throw Error('bad walletType:' + walletType)
      }
      commit('setWallet', { wallet, type: wallet.type })
    },
    async recover({ commit }) {
      try {
        const wallet = await tryRecoverWallet()
        let walletType: SUPPORTED_WALLET = SUPPORTED_WALLET.MetaMask
        const lastWalletType = getLastWalletType()
        if (lastWalletType !== null) {
          walletType = lastWalletType
        }
        commit('setWallet', { wallet, type: walletType })
      } catch (e) {
        logger.error('recover wallet error', e)
      }
    },
    async updateNativeTokenBalance({ commit, getters }) {
      if (!getters.address) {
        commit('setNativeTokenBalance', { balance: null, balanceL1: null })
        return
      }
      if (!getters.provider) {
        throw new DataNotFoundError('provider')
      }
      // if (!getters.providerL1) {
      //   throw new DataNotFoundError('providerL1')
      // }
      try {
        const [
          balanceBN,
          // balanceBNL1,
        ] = await Promise.all([
          getters.provider.getBalance(getters.address),
          // getters.providerL1.getBalance(getters.address),
        ])
        const balance = new BigNumber(balanceBN.toString()).shiftedBy(-currentChainConfig.decimals)
        // const balanceL1 = new BigNumber(balanceBNL1.toString()).shiftedBy(-currentChainConfig.decimals)
        // commit('setNativeTokenBalance', { balance, balanceL1: balanceL1 })
        commit('setNativeTokenBalance', { balance, balanceL1: _0 })
      } catch (e) {
        logger.error('can not refresh chain native asset balance', e)
        throw new ContractError(e)
      }
    },
  },
  mutations: {
    setWallet(state, payload: { wallet: Wallet | null; type: SUPPORTED_WALLET | null }) {
      payload.wallet?.on(WALLET_EVENT.AddressChanged, () => onAddressChanged())
      payload.wallet?.on(WALLET_EVENT.NetworkChanged, () => onNetworkChanged())
      state.walletType = payload.type
      state.wallet = payload.wallet
      onNetworkChanged()
    },
    closeWallet(state) {
      if (state.wallet) {
        state.wallet.close()
        state.wallet = null
        state.walletType = null
        VUE_EVENT_BUS.emit(LOGIN_SESSION_EVENT.Close)
      }
    },
    clearNativeTokenBalance(state) {
      state.nativeTokenBalance = null
    },
    setNativeTokenBalance(state, payload: { balance: BigNumber | null; balanceL1: BigNumber | null }) {
      state.nativeTokenBalance = payload.balance
      state.nativeTokenBalanceL1 = payload.balanceL1
    },
  },
}

export default module
