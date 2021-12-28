import { ethers, BytesLike } from 'ethers'
import { TypedDataSigner } from '@ethersproject/abstract-signer'
import { WALLET_EVENT } from '@/event'
import {
  NETWORK_PROVIDER_RPC,
  NETWORK_PROVIDER_RPC_CONFIG,
  TARGET_NETWORK_ID,
} from '@/constants'
import {
  UnavailableWalletError,
  UserCanceledError,
  WalletError,
  isMCError,
  MCError,
  normalizeError,
} from '@/type/error'
import WalletConnectProvider from '@walletconnect/ethereum-provider'
import { IQRCodeModal } from '@walletconnect/types'
import { COMMON_EVENT, VUE_EVENT_BUS } from '@/event'
import WalletLink from 'walletlink'
import { Provider, Web3Provider, ExternalProvider } from '@ethersproject/providers'
import { Network } from '@ethersproject/networks'

export enum SUPPORTED_WALLET {
  InvalidType = -1,
  Injected,
  MetaMask = 1,
  WalletConnect,
  WalletLink,
  'Coin98 Wallet',
  imToken,
  'Trust Wallet',
}

export const WALLET_ICON = {
  [SUPPORTED_WALLET.InvalidType]: '',
  [SUPPORTED_WALLET.Injected]: '',
  [SUPPORTED_WALLET.MetaMask]: require('@/assets/img/wallet/MetaMask.svg'),
  [SUPPORTED_WALLET.WalletLink]: require('@/assets/img/wallet/CoinbaseWallet.svg'),
  [SUPPORTED_WALLET.WalletConnect]: require('@/assets/img/wallet/WalletConnect.svg'),
  [SUPPORTED_WALLET['Coin98 Wallet']]: require('@/assets/img/wallet/Coin98Wallet.svg'),
  [SUPPORTED_WALLET.imToken]: require('@/assets/img/wallet/imToken.svg'),
  [SUPPORTED_WALLET['Trust Wallet']]: require('@/assets/img/wallet/TrustWallet.svg'),
}

export class UnsupportEIP712Error extends Error {
}

export interface InjectedProvider {
  enable?: () => Promise<Array<string>>

  request(args: RequestArguments): Promise<unknown>

  on(
    eventName: 'accountsChanged' | 'chainChanged' | 'block',
    callback: ((addresses: Array<string>) => void) | ((networkId: string) => void),
  ): void

  removeListener(eventName: 'accountsChanged' | 'chainChanged' | 'block', callback: Function): void

  autoRefreshOnNetworkChange?: boolean

  isConnected(): boolean
}

interface RequestArguments {
  method: string
  params?: unknown[] | object
}

export interface MetaMaskInjectedProvider extends InjectedProvider {
  isMetaMask: true
}

export interface Coin98InjectedProvider extends InjectedProvider {
  isCoin98: true
}

interface ImTokenInjectedProvider extends InjectedProvider {
  isImToken: true
}

interface TrustWalletInjectedProvider extends InjectedProvider {
  isTrust: true
}

interface MathInjectedProvider extends InjectedProvider {
  isMathWallet: true
}

interface Web3InjectedProvider extends ExternalProvider {
  isEQLWallet?: boolean
  isToshi?: boolean
  isTrust?: boolean
  isStatus?: boolean
}

interface InjectedWeb3 {
  currentProvider: Web3InjectedProvider
}

interface InjectedWindow {
  ethereum?: MetaMaskInjectedProvider | null
  web3?: InjectedWeb3 | undefined
  imToken?: boolean | null
}

interface Signer extends ethers.Signer, TypedDataSigner {
}

// Wallet is actually extends networkIdAndProvider of mai2.js
export interface Wallet {
  networkId: number
  provider: Provider
  type: SUPPORTED_WALLET
  address: string
  signer: Signer
  available: boolean

  signTypedDataV3?(data: any): Promise<string>

  signMessage(message: BytesLike): Promise<string>

  close(): void

  on(event: WALLET_EVENT | WALLET_EVENT[], callback: Function): void

  off(event?: WALLET_EVENT | WALLET_EVENT[], callback?: Function): void

  normalizeError(error: Error): MCError
}

class BasicWallet {
  protected _available = true

  get available() {
    return this._available
  }

  close() {
    console.log('close wallet')
    this.invalid()
  }

  invalid() {
    if (this._available) {
      this._available = false
      VUE_EVENT_BUS.emit(WALLET_EVENT.Invalid)
    }
  }

  on(event: WALLET_EVENT | WALLET_EVENT[], callback: Function): void {
    VUE_EVENT_BUS.on(event, callback)
  }

  off(event: WALLET_EVENT, callback: Function): void {
    VUE_EVENT_BUS.off(event, callback)
  }
}

async function signMessage(signer: ethers.providers.JsonRpcSigner, message: BytesLike): Promise<string> {
  let sign = await signer.signMessage(message)

  if (sign.length > 2) {
    const v = sign.slice(sign.length - 2)
    //homestead EIP155
    if (v === '00') {
      sign = sign.slice(0, sign.length - 2) + '1b'
    } else if (v === '01') {
      sign = sign.slice(0, sign.length - 2) + '1c'
    }
  }
  return sign
}

function isInjectedProvider(provider?: any): provider is MetaMaskInjectedProvider {
  if (provider === undefined || provider === null) {
    return false
  }
  const wallet = provider as MetaMaskInjectedProvider
  return (
    typeof wallet === 'object' &&
    (typeof wallet.enable === 'function' || typeof wallet.request === 'function') &&
    typeof wallet.on === 'function' &&
    typeof wallet.isConnected === 'function'
  )
}

function isMetaMaskInjectedProvider(provider?: any): provider is MetaMaskInjectedProvider {
  if (provider === undefined || provider === null) {
    return false
  }
  const metaMask = provider as MetaMaskInjectedProvider
  return isInjectedProvider(provider) && metaMask.isMetaMask
}

function isCoin98InjectedProvider(provider?: any): provider is Coin98InjectedProvider {
  if (provider === undefined || provider === null) {
    return false
  }
  const wallet = provider as Coin98InjectedProvider
  return isInjectedProvider(provider) && wallet.isCoin98
}

function isImTokenInjectedProvider(provider?: any): provider is ImTokenInjectedProvider {
  if (provider === undefined || provider === null) {
    return false
  }
  const wallet = provider as ImTokenInjectedProvider
  return isInjectedProvider(provider) && wallet.isImToken
}

function isTrustWalletInjectedProvider(provider?: any): provider is TrustWalletInjectedProvider {
  if (provider === undefined || provider === null) {
    return false
  }
  const wallet = provider as TrustWalletInjectedProvider
  return isInjectedProvider(provider) && wallet.isTrust
}

function isInjectedWeb3(web3?: any): web3 is InjectedWeb3 {
  if (web3 === undefined || web3 === null) {
    return false
  }
  const injectedWeb3 = web3 as InjectedWeb3

  return typeof web3 === 'object' && typeof injectedWeb3.currentProvider === 'object'
}

async function connectWeb3Provider(provider: ExternalProvider) {
  const web3Provider = new ethers.providers.Web3Provider(provider)
  const networkPromise = web3Provider.getNetwork()
  const addressPromise = web3Provider.getSigner().getAddress()
  const [network, address] = await Promise.all([networkPromise, addressPromise])
  return { web3Provider, network, address }
}

function saveLastWalletType(walletType: SUPPORTED_WALLET) {
  window.localStorage.setItem(
    'mcdexLastWalletType',
    JSON.stringify({
      walletType,
    }),
  )
}

export function getLastWalletType(): SUPPORTED_WALLET | null {
  const t = window.localStorage.getItem('mcdexLastWalletType')
  if (t) {
    const data = JSON.parse(t)
    return (data && data.walletType) || null
  }
  return null
}

export class InjectWallet extends BasicWallet implements Wallet {
  type = SUPPORTED_WALLET.Injected
  protected injectedProvider: InjectedProvider
  private _web3Provider: ethers.providers.Web3Provider
  private _networkId: number
  private _address: string

  protected onAccountsChangeWrap = (accounts?: Array<string>) => {
    // Note: do not use address in accounts, we get from api to encode the address
    this.onAccountsChanged()
  }

  protected onNetworkChangedWrap = () => {
    this.onNetworkChanged()
  }

  constructor(
    injectedProvider: InjectedProvider,
    web3Provider: ethers.providers.Web3Provider,
    network: Network,
    address: string,
  ) {
    super()
    this.injectedProvider = injectedProvider
    this._web3Provider = web3Provider
    this._networkId = network.chainId
    this._address = address
    this.registerEvent(injectedProvider)
  }

  registerEvent(provider: InjectedProvider) {
    this.injectedProvider = provider
    provider.on('accountsChanged', this.onAccountsChangeWrap)
    provider.on('chainChanged', this.onNetworkChangedWrap)
  }

  close() {
    this.injectedProvider.removeListener('accountsChanged', this.onAccountsChangeWrap)
    this.injectedProvider.removeListener('chainChanged', this.onNetworkChangedWrap)
    super.close()
  }

  get provider(): Provider {
    return this._web3Provider
  }

  get networkId() {
    return this._networkId
  }

  get address() {
    return this._address
  }

  get signer() {
    return this._web3Provider.getSigner()
  }

  get isImToken() {
    return isImTokenInjectedProvider(this.injectedProvider)
  }

  get isTrust() {
    return isTrustWalletInjectedProvider(this.injectedProvider)
  }

  normalizeError(error: Error): MCError {
    return normalizeError(error)
  }

  protected onAccountsChanged(address?: string) {
    window.location.reload()
  }

  protected onNetworkChanged() {
    const w = window as InjectedWindow
    if (!isInjectedProvider(w.ethereum)) {
      console.error('inject wallet unavailable after network changed.')
      this.invalid()
      return
    }
    connectWeb3Provider(w.ethereum)
      .then((value) => {
        const { web3Provider, network, address } = value
        this._web3Provider = web3Provider
        this.setAddress(address)
        this.setNetworkID(network.chainId)
      })
      .catch((e) => {
        console.error('connect inject provider failed after network changed.', e)
        this.invalid()
      })
  }

  protected setNetworkID(networkID: number) {
    if (this.networkId !== networkID) {
      this._networkId = networkID
      VUE_EVENT_BUS.emit(WALLET_EVENT.NetworkChanged)
    }
  }

  protected setAddress(address: string) {
    if (address !== this.address) {
      this._address = address
      VUE_EVENT_BUS.emit(WALLET_EVENT.AddressChanged)
    }
  }

  async signTypedDataV3(eip712Msg: any): Promise<string> {
    const from = this.address
    const params = [from, JSON.stringify(eip712Msg)]
    try {
      return await this._web3Provider.send('eth_signTypedData_v3', params)
    } catch (e) {
      // when connect to hardware wallet, it is not supported EIP
      if (e.code === -32603) {
        throw new UnsupportEIP712Error()
      }
      throw e
    }
  }

  async signMessage(message: BytesLike): Promise<string> {
    return signMessage(this._web3Provider.getSigner(), message)
  }
}

export class MetaMaskWallet extends InjectWallet {
  type = SUPPORTED_WALLET.MetaMask

  normalizeError(error: Error): MCError {
    let result: any = null
    if (this.isMetaMaskError(error)) {
      if (error.code === 4001) {
        result = new UserCanceledError()
      }
    }
    return result || normalizeError(error)
  }

  protected isMetaMaskError(error: Error): error is MetaMeskError {
    const e = error as MetaMeskError
    return e && typeof e.code === 'number'
  }
}

export class Coin98Wallet extends InjectWallet {
  type = SUPPORTED_WALLET['Coin98 Wallet']

  normalizeError(error: Error): MCError {
    let result: any = null
    if (this.isCoin98Error(error)) {
      if (error.code === 4001) {
        result = new UserCanceledError()
      }
    }
    return result || normalizeError(error)
  }

  protected isCoin98Error(error: Error): error is Coin98Error {
    const e = error as Coin98Error
    return e && typeof e.code === 'number'
  }
}

export class WCWallet extends BasicWallet implements Wallet {
  type = SUPPORTED_WALLET.WalletConnect
  wcProvider: WalletConnectProvider
  private _web3Provider: ethers.providers.Web3Provider
  private _networkId: number
  private _address: string

  private onAccountsChangeWrap = () => {
    this.onAccountsChanged()
  }

  private onNetworkChangedWrap = () => {
    this.onNetworkChanged()
  }

  private onErrorWrap = (error: Error) => {
    this.onError(error)
  }

  private onCloseWrap = (code: number, reason: string) => {
    this.onClose(code, reason)
  }

  private onDisconnectWrap = () => {
    console.log('wallet connect disconnect.')
    this.close()
  }

  constructor(
    wcProvider: WalletConnectProvider,
    web3Provider: ethers.providers.Web3Provider,
    network: Network,
    address: string,
  ) {
    super()
    this.wcProvider = wcProvider
    this._web3Provider = web3Provider
    this._networkId = network.chainId
    this._address = address
    wcProvider.on('accountsChanged', this.onAccountsChangeWrap)
    wcProvider.on('chainChanged', this.onNetworkChangedWrap)
    wcProvider.on('close', this.onCloseWrap)
    wcProvider.on('error', this.onErrorWrap)

    wcProvider.on('disconnect', this.onDisconnectWrap)
  }

  close() {
    this.wcProvider.off('accountsChanged', this.onAccountsChangeWrap)
    this.wcProvider.off('chainChanged', this.onNetworkChangedWrap)
    this.wcProvider.off('close', this.onCloseWrap)
    this.wcProvider.off('error', this.onErrorWrap)
    super.close()
  }

  get provider(): Provider {
    return this._web3Provider
  }

  get networkId() {
    return this._networkId
  }

  get address() {
    return this._address
  }

  get signer() {
    return this._web3Provider.getSigner()
  }

  normalizeError(error: Error): MCError {
    return normalizeError(error)
  }

  private onError(error: Error) {
    console.log('wallet-connect error:', error.message)
    this.close()
  }

  private onClose(code: number, reason: string) {
    console.log('wallet-connect close:', code, reason)
    this.close()
  }

  private onAccountsChanged() {
    this._web3Provider
      .getSigner()
      .getAddress()
      .then((address) => {
        this.setAddress(address)
      })
      .catch((e) => {
        console.warn('get address error after address changed:', e)
        this.invalid()
      })
  }

  private onNetworkChanged() {
    connectWeb3Provider(this.wcProvider)
      .then((value) => {
        const { web3Provider, network, address } = value
        this._web3Provider = web3Provider
        this.setAddress(address)
        this.setNetworkID(network.chainId)
      })
      .catch((e) => {
        console.error('connect wc provider failed after network changed.', e)
        this.invalid()
      })
  }

  private setNetworkID(networkID: number) {
    if (this.networkId !== networkID) {
      this._networkId = networkID
      VUE_EVENT_BUS.emit(WALLET_EVENT.NetworkChanged)
    }
  }

  private setAddress(address: string) {
    if (address !== this.address) {
      this._address = address
      VUE_EVENT_BUS.emit(WALLET_EVENT.AddressChanged)
    }
  }

  async signTypedDataV3(eip712Msg: any): Promise<string> {
    const from = this.address
    const params = [JSON.stringify(eip712Msg), from]
    return await this._web3Provider.send('eth_signTypedData', params)
  }

  async signMessage(message: string): Promise<string> {
    //return signMessage(this._web3Provider.getSigner(), message)
    //this.wcProvider.
    const from = this.address
    const msgHex = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message))
    const params = [msgHex, from.toLowerCase()]
    return this._web3Provider.send('personal_sign', params)
  }
}

export class ImTokenWallet extends WCWallet {
  type = SUPPORTED_WALLET.imToken
}

export class TrustWallet extends WCWallet {
  type = SUPPORTED_WALLET['Trust Wallet']
}

async function connectInjectWallet(tryEnable = true): Promise<Wallet> {
  const w = window as InjectedWindow
  const provider = w.ethereum as InjectedProvider
  provider.autoRefreshOnNetworkChange = false
  if (tryEnable) {
    if (provider.request) {
      await provider.request({ method: 'eth_requestAccounts' })
    } else if (provider.enable) {
      await provider.enable()
    } else {
      throw Error('bad mobile provider')
    }
  }
  const { web3Provider, network, address } = await connectWeb3Provider(provider)
  return new InjectWallet(provider, web3Provider, network, address)
}

export async function connectMobileInjectWallet(retryTimes = 5, tryEnable = true): Promise<Wallet> {
  if (retryTimes < 0) {
    throw new UnavailableWalletError('no mobile injected wallet available' + ' ' + retryTimes)
  }

  if (window.ethereum) {
    return connectInjectWallet(tryEnable)
  } else {
    return new Promise<Wallet>(resolve => {
      window.setTimeout(async () => {
        resolve(await connectMobileInjectWallet(retryTimes - 1, tryEnable))
      }, 1000)
    })
  }
}

export async function connectMetaMaskWallet(tryEnable = true) {
  const w = window as InjectedWindow
  if (!isMetaMaskInjectedProvider(w.ethereum)) {
    throw new UnavailableWalletError('no MetaMask wallet available')
  }
  const provider = w.ethereum
  provider.autoRefreshOnNetworkChange = false
  if (tryEnable) {
    if (provider.request) {
      await provider.request({ method: 'eth_requestAccounts' })
    } else if (provider.enable) {
      await provider.enable()
    } else {
      throw Error('bad metamesk provider')
    }
  }
  const { web3Provider, network, address } = await connectWeb3Provider(provider)
  saveLastWalletType(SUPPORTED_WALLET.MetaMask)
  return new MetaMaskWallet(provider, web3Provider, network, address)
}

export async function connectCoin98Wallet(tryEnable = true) {
  const w = window as InjectedWindow
  if (!isCoin98InjectedProvider(w.ethereum)) {
    return connectMetaMaskWallet(true)
  }
  const provider = w.ethereum as Coin98InjectedProvider
  provider.autoRefreshOnNetworkChange = false
  console.log('connect coin 98')
  if (tryEnable) {
    if (provider.request) {
      await provider.request({ method: 'eth_requestAccounts' })
    } else if (provider.enable) {
      await provider.enable()
    } else {
      throw Error('bad coin98 provider')
    }
  }
  const { web3Provider, network, address } = await connectWeb3Provider(provider)
  saveLastWalletType(SUPPORTED_WALLET['Coin98 Wallet'])
  return new Coin98Wallet(provider, web3Provider, network, address)
}

const WALLECT_CONNECT_BRIDGE = 'https://bridge.walletconnect.org'

let currentWalletConnectProvier: WalletConnectProvider | null = null

export async function connectWCWallet(qrcodeModal?: IQRCodeModal, mobile: boolean = false) {
  if (currentWalletConnectProvier) {
    try {
      await currentWalletConnectProvier.disconnect()
    } catch (e) {
      console.log('close WalletConnect provider fail', e)
    } finally {
      currentWalletConnectProvier = null
    }
  }

  // lazy load
  const WalletConnect = (await import('@walletconnect/client')).default
  const wc = new WalletConnect({
    bridge: WALLECT_CONNECT_BRIDGE,
    qrcodeModal,
  })
  // Create WalletConnect Provider
  const provider = new WalletConnectProvider({
    //bridge: 'https://server10.jy.mcarlo.com',
    connector: mobile ? undefined : wc,
    // infuraId: INFURA_API_KEY, // Required
    rpc: NETWORK_PROVIDER_RPC_CONFIG,
    chainId: TARGET_NETWORK_ID,
    //qrcode: false
  })
  await provider.enable()
  currentWalletConnectProvier = provider

  const { web3Provider, network, address } = await connectWeb3Provider(provider)
  saveLastWalletType(SUPPORTED_WALLET.WalletConnect)
  return new WCWallet(provider, web3Provider, network, address)
}

export async function connectImTokenWallet(qrcodeModal?: IQRCodeModal, mobile: boolean = false) {
  if (currentWalletConnectProvier) {
    try {
      await currentWalletConnectProvier.disconnect()
    } catch (e) {
      console.log('close WalletConnect provider fail', e)
    } finally {
      currentWalletConnectProvier = null
    }
  }

  // lazy load
  const WalletConnect = (await import('@walletconnect/client')).default
  const wc = new WalletConnect({
    bridge: WALLECT_CONNECT_BRIDGE,
    qrcodeModal,
  })
  // Create WalletConnect Provider
  const provider = new WalletConnectProvider({
    //bridge: 'https://server10.jy.mcarlo.com',
    connector: mobile ? undefined : wc,
    // infuraId: INFURA_API_KEY, // Required
    rpc: NETWORK_PROVIDER_RPC_CONFIG,
    qrcodeModalOptions: {
      mobileLinks: ['imToken'],
    },
    chainId: TARGET_NETWORK_ID,
    //qrcode: false
  })
  await provider.enable()
  currentWalletConnectProvier = provider

  const { web3Provider, network, address } = await connectWeb3Provider(provider)
  saveLastWalletType(SUPPORTED_WALLET.imToken)
  return new ImTokenWallet(provider, web3Provider, network, address)
}

export async function connectTrustWallet(qrcodeModal?: IQRCodeModal, mobile: boolean = false) {
  if (currentWalletConnectProvier) {
    try {
      await currentWalletConnectProvier.disconnect()
    } catch (e) {
      console.log('close WalletConnect provider fail', e)
    } finally {
      currentWalletConnectProvier = null
    }
  }

  // lazy load
  const WalletConnect = (await import('@walletconnect/client')).default
  const wc = new WalletConnect({
    bridge: WALLECT_CONNECT_BRIDGE,
    qrcodeModal,
  })
  // Create WalletConnect Provider
  const provider = new WalletConnectProvider({
    //bridge: 'https://server10.jy.mcarlo.com',
    connector: mobile ? undefined : wc,
    // infuraId: INFURA_API_KEY, // Required
    rpc: NETWORK_PROVIDER_RPC_CONFIG,
    qrcodeModalOptions: {
      mobileLinks: ['Trust'],
    },
    chainId: TARGET_NETWORK_ID,
    //qrcode: false
  })
  await provider.enable()
  currentWalletConnectProvier = provider

  const { web3Provider, network, address } = await connectWeb3Provider(provider)
  saveLastWalletType(SUPPORTED_WALLET['Trust Wallet'])
  return new TrustWallet(provider, web3Provider, network, address)
}

export class WLinkWallet extends BasicWallet implements Wallet {
  type = SUPPORTED_WALLET.WalletLink
  private _walletLink: WalletLink
  private _web3Provider: Web3Provider
  private _networkId: number
  private _address: string

  private onErrorWrap = (error: Error) => {
    this.onError(error)
  }

  private onCloseWrap = (code: number, reason: string) => {
    this.onClose(code, reason)
  }

  private onDisconnectWrap = () => {
    console.log('wallet connect disconnect.')
    this.close()
  }

  constructor(walletLink: WalletLink, web3Provider: Web3Provider, network: Network, address: string) {
    super()

    this._walletLink = walletLink
    this._web3Provider = web3Provider
    this._networkId = network.chainId
    this._address = address
  }

  close() {
    this._walletLink.disconnect()
    super.close()
  }

  get provider(): Provider {
    return this._web3Provider
  }

  get networkId() {
    return this._networkId
  }

  get address() {
    return this._address
  }

  get signer() {
    return this._web3Provider.getSigner()
  }

  normalizeError(error: Error): MCError {
    return normalizeError(error)
  }

  private onError(error: Error) {
    console.log('WalletLink error:', error.message)
    this.close()
  }

  private onClose(code: number, reason: string) {
    console.log('WalletLink close:', code, reason)
    this.close()
  }

  async signTypedDataV3(eip712Msg: any): Promise<string> {
    const from = this.address
    const params = [from, eip712Msg]
    return await this._web3Provider.send('eth_signTypedData_v3', params)
  }

  async signMessage(message: string): Promise<string> {
    //return signMessage(this._web3Provider.getSigner(), message)
    //this.wcProvider.
    const from = this.address
    const msgHex = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message))
    const params = [msgHex, from.toLowerCase()]
    return this._web3Provider.send('personal_sign', params)
  }
}

let currentWalletLink: WalletLink | null = null

export async function connectWLWallet(
  appName = 'SATORI',
  appLogoUrl = 'https://cdn.mcdex.io/favicon.ico',
  darkMode = true,
) {
  if (currentWalletLink) {
    try {
      await currentWalletLink.disconnect()
    } catch (e) {
      console.log('close WalletConnect provider fail', e)
    } finally {
      currentWalletLink = null
    }
  }

  // Initialize WalletLink
  const WalletLink = (await import('walletlink')).default
  currentWalletLink = new WalletLink({
    appName,
    appLogoUrl,
    darkMode,
  })

  //  Create Web3 Provider
  const wLProvider = currentWalletLink.makeWeb3Provider(NETWORK_PROVIDER_RPC, TARGET_NETWORK_ID)

  const accounts = await wLProvider.enable()
  console.log(`WalletLink: User's address is ${accounts[0]}`)

  // @ts-ignore
  const { web3Provider, network, address } = await connectWeb3Provider(wLProvider)
  saveLastWalletType(SUPPORTED_WALLET.WalletLink)
  return new WLinkWallet(currentWalletLink, web3Provider, network, address)
}

// Try to connect wallet
export async function tryConnectWallet(tryEnable = true): Promise<Wallet> {
  const w = window as InjectedWindow
  if (isMetaMaskInjectedProvider(w.ethereum)) {
    return connectMetaMaskWallet(tryEnable)
  } else {
    throw new UnavailableWalletError('no web wallet available')
  }
}

export async function tryRecoverWallet(): Promise<Wallet> {
  const w = window as InjectedWindow
  const lastType = getLastWalletType()
  if (lastType !== null) {
    if (lastType === SUPPORTED_WALLET.MetaMask) {
      if (isMetaMaskInjectedProvider(w.ethereum)) {
        return connectMetaMaskWallet(false)
      }
    }  else if (lastType === SUPPORTED_WALLET['Coin98 Wallet']) {
      if (isCoin98InjectedProvider(w.ethereum)) {
        return connectCoin98Wallet(true)
      } else if (isMetaMaskInjectedProvider(w.ethereum)) {
        return connectMetaMaskWallet(false)
      }
    } else if (lastType === SUPPORTED_WALLET.WalletConnect) {
      // can not recovery w3 wallet
      return connectWCWallet()
    } else if (lastType === SUPPORTED_WALLET.WalletLink) {
      return connectWLWallet()
    }
  }

  return tryConnectWallet(false)
}

export interface MetaMeskError extends Error {
  code: number
}

export interface Coin98Error extends Error {
  code: number
}

export interface ImTokenError extends Error {
  code: number
}

export function normalizeWalletError(error: Error): MCError {
  return isMCError(error) ? error : new WalletError(error.message)
}
