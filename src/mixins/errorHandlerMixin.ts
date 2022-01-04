import { Component, Vue } from 'vue-property-decorator'
import { Mutation, namespace, State } from 'vuex-class'
import {
  DataNotFoundError,
  isNodeServerError,
  normalizeError,
  RelayerApiError,
  WrongNetworkError,
} from '@/type'
import { SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/const'
import {
  CHAIN_EVENT,
  ERROR_EVENTS,
  GRAPH_EVENTS,
  PRICE_CHART_EVENTS,
  RELAYER_EVENTS,
  VUE_EVENT_BUS,
  WALLET_EVENT,
} from '@/event'
import { ethers, providers } from 'ethers'
import { Provider } from '@ethersproject/providers'
import { COMMON_EVENT } from '@/mobile/event'
import { chainConfigs, currentChainConfig } from '@/config/chain'
import BigNumber from 'bignumber.js'

const wallet = namespace('wallet')

export function processStoreErrors(v: Vue, e: Error): void {
  if (e instanceof DataNotFoundError) {
    return
  }
  console.warn('warn', e)

  const mc = normalizeError(e)
  VUE_EVENT_BUS.emit(ERROR_EVENTS.ShowMcError, mc)
}

@Component
export class ErrorHandlerMixin extends Vue {
  @wallet.Getter('networkId') networkId!: number
  @wallet.Getter('isWrongNetwork') isWrongNetwork!: boolean
  @wallet.Getter('provider') _chainProvider!: Provider
  @wallet.Getter('signer') _walletSigner!: ethers.Signer
  @wallet.Getter('isConnectedWallet') isConnectedWallet!: boolean
  @wallet.State('nativeTokenBalance') nativeTokenBalance!: BigNumber | null
  @wallet.State('nativeTokenBalanceL1') nativeTokenBalanceL1!: BigNumber | null
  @wallet.Getter('address') address!: string | null
  @State('latestBlockNumber') latestBlockNumber !: number | null
  @State('isMobile') _isMobile !: boolean
  @Mutation('updateLatestBlockNumber') updateLatestBlockNumber !: Function

  // only write chain
  async callChainFunc(func: () => providers.TransactionReceipt | any | null, targetNetwork: SUPPORTED_NETWORK_ID = TARGET_NETWORK_ID, throwError = false): Promise<any | null> {
    try {
      if (!this.isConnectedWallet) {
        this._isMobile ? VUE_EVENT_BUS.emit(COMMON_EVENT.SHOW_SELECT_WALLET_POPUP) : VUE_EVENT_BUS.emit(WALLET_EVENT.ShowConnectWallet)
        throw Error('no wallet')
      }
      if (this.networkId !== targetNetwork) {
        VUE_EVENT_BUS.emit(CHAIN_EVENT.WRONG_CHAIN, targetNetwork)
        throw Error('wrong network')
      }
      const chain = chainConfigs[targetNetwork]
      const nativeTokenBalance = targetNetwork === TARGET_NETWORK_ID ? this.nativeTokenBalance : this.nativeTokenBalanceL1
      if (nativeTokenBalance && chain.minGasLimit.gt(nativeTokenBalance)) {
        VUE_EVENT_BUS.emit(ERROR_EVENTS.ShowTextError, {
          type: 'error',
          message: 'commonErrors.insufficientETHBalance',
          args: { symbol: currentChainConfig.symbol }
        })
        throw Error('insufficient eth balance')
      }
      if (this.isWrongNetwork || !this._walletSigner) {
        throw new WrongNetworkError(this.networkId ? this.networkId : 0, SUPPORTED_NETWORK_ID[TARGET_NETWORK_ID])
      }
      const result = await func()
      try { // get on the chain after blocks
        if (result) {
          const blockNumber = result?.blockNumber
          if ((blockNumber && !this.latestBlockNumber) ||
            ((blockNumber && this.latestBlockNumber && blockNumber > this.latestBlockNumber))) {
            this.updateLatestBlockNumber(blockNumber)
          }
        }
      } catch {
        // ignore updateLatestBlockNumber error
      }
      return result
    } catch (err) {
      // insufficientETHBalance
      if (normalizeError(err).message === 'execution ran out of gas') {
        VUE_EVENT_BUS.emit(ERROR_EVENTS.ShowTextError, {
          type: 'error',
          message: 'commonErrors.insufficientETHBalance',
          args: { symbol: currentChainConfig.symbol}
        })
      }
      if (throwError) {
        throw normalizeError(err)
      }
      console.warn(err)
      return null
    }
  }

  // only read chain data
  async callChainReadFunc(func: () => Promise<providers.TransactionReceipt | any | null>, throwError = false): Promise<any | null> {
    try {
      if (!this._chainProvider) {
        throw new DataNotFoundError('provider is null')
      }
      return await func()
    } catch (err) {
      console.warn(err)
      if (isNodeServerError(err)) {
        VUE_EVENT_BUS.emit(ERROR_EVENTS.ShowNodeError)
      }
      if (throwError) {
        throw err
      } else {
        return null
      }
    }
  }

  async callGraphApiFunc<T>(func: () => Promise<T> | T): Promise<T | null> {
    try {
      const result = await func()
      this.hideGraphServerError()
      return result
    } catch (err) {
      console.warn(err)
      if (err instanceof DataNotFoundError) {
        return null
      }
      this.showGraphServerError()
      return null
    }
  }

  showGraphServerError() {
    VUE_EVENT_BUS.emit(GRAPH_EVENTS.SHOW)
  }

  hideGraphServerError() {
    VUE_EVENT_BUS.emit(GRAPH_EVENTS.HIDE)
  }

  async callRelayerServerApiReadFunc(func: Function): Promise<any | null> {
    try {
      const result = await func()
      this.hideRelayerServerError()
      return result
    } catch (err) {
      console.warn(err)
      if (err instanceof DataNotFoundError) {
        return null
      }
      if (err instanceof RelayerApiError) {
        VUE_EVENT_BUS.emit(ERROR_EVENTS.ShowMcError, err)
      } else {
        this.showRelayerServerError()
      }
      return null
    }
  }

  async callRelayerServerApiModifyingFunc(func: Function): Promise<any | null> {
    try {
      const result = await func()
      this.hideRelayerServerError()
      return result
    } catch (err) {
      console.warn(err)
      if (err instanceof DataNotFoundError) {
        return null
      }
      if (err instanceof RelayerApiError) {
        VUE_EVENT_BUS.emit(ERROR_EVENTS.ShowMcError, err)
      } else {
        this.showRelayerServerError()
      }
      return null
    }
  }

  showRelayerServerError() {
    VUE_EVENT_BUS.emit(RELAYER_EVENTS.SHOW)
  }

  hideRelayerServerError() {
    VUE_EVENT_BUS.emit(RELAYER_EVENTS.HIDE)
  }

  showOracleChartServerError() {
    VUE_EVENT_BUS.emit(PRICE_CHART_EVENTS.SHOW)
  }

  hideOracleChartServerError() {
    VUE_EVENT_BUS.emit(PRICE_CHART_EVENTS.HIDE)
  }
}
