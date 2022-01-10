import BigNumber from 'bignumber.js'
import { Moment } from 'moment'
import { LiquidityPoolStorage, AccountStorage, PerpetualStorage, PerpetualState } from '@mcdex/mai3.js'
import { PerpetualFormatDecimals } from '@/utils/formatDecimals'
import { ORDER_SIDE, ORDER_TYPE } from '@/ts'
import { getPerpetualID, padLeft } from '@/utils'
import { DEFAULT_SYMBOL_LENGTH } from '@/const'
import { ethers } from 'ethers'

export type BignumberString = string | BigNumber
export type MomentString = string | Moment
export type IntString = string | number

export class PerpetualProperty {
  static emptyInstance() {
    return new PerpetualProperty({
      liquidityPoolAddress: '',
      perpetualIndex: 0,
      symbol: 0,
      isInverse: false,
      collateralTokenSymbol: '',
      collateralTokenBaseSymbol: '',
      collateralTokenDecimals: 0,
      underlyingAssetSymbol: '',
      unChangePerpetualState: PerpetualState.INITIALIZING,
      decimals: {
        priceFormatDecimals: 0,
        collateralFormatDecimals: 0,
        underlyingAssetFormatDecimals: 0,
        inversePriceFormatDecimals: 0,
      },
    })
  }

  liquidityPoolAddress: string = ''
  perpetualIndex: number = 0
  symbol: number = 0
  collateralTokenSymbol: string = ''
  collateralTokenBaseSymbol: string = ''
  collateralTokenDecimals: number = 0
  underlyingAssetSymbol: string = ''
  isInverse: boolean = false
  unChangePerpetualState = PerpetualState.INITIALIZING
  decimals: PerpetualFormatDecimals

  constructor(params: {
    liquidityPoolAddress: string
    perpetualIndex: number
    symbol: number
    isInverse: boolean
    collateralTokenSymbol: string
    collateralTokenBaseSymbol: string
    collateralTokenDecimals: number
    underlyingAssetSymbol: string
    unChangePerpetualState: PerpetualState
    decimals: PerpetualFormatDecimals
  }) {
    this.liquidityPoolAddress = params.liquidityPoolAddress
    this.perpetualIndex = params.perpetualIndex
    this.symbol = params.symbol
    this.isInverse = params.isInverse
    this.collateralTokenSymbol = params.collateralTokenSymbol
    this.collateralTokenBaseSymbol = params.collateralTokenBaseSymbol
    this.collateralTokenDecimals = params.collateralTokenDecimals
    this.underlyingAssetSymbol = params.underlyingAssetSymbol
    this.unChangePerpetualState = params.unChangePerpetualState
    this.decimals = params.decimals
  }

  get symbolStr() {
    return padLeft(this.symbol, DEFAULT_SYMBOL_LENGTH)
  }

  get name() {
    return `${this.underlyingAssetSymbol.toUpperCase()}/${this.collateralTokenSymbol.toUpperCase()}`
  }

  get perpetualID() {
    return getPerpetualID(this.liquidityPoolAddress, this.perpetualIndex)
  }

  get collateralFormatDecimals() {
    return this.decimals.collateralFormatDecimals
  }

  get underlyingAssetFormatDecimals() {
    return this.decimals.underlyingAssetFormatDecimals
  }

  get priceFormatDecimals() {
    return this.isInverse ? this.decimals.inversePriceFormatDecimals : this.decimals.priceFormatDecimals
  }

  get priceSymbol() {
    return !this.isInverse ? this.collateralTokenSymbol : this.underlyingAssetSymbol
  }

  get contractSymbol() {
    return !this.isInverse ? this.underlyingAssetSymbol : this.collateralTokenSymbol
  }

  get contractFormatDecimals() {
    return !this.isInverse ? this.underlyingAssetFormatDecimals : this.collateralFormatDecimals
  }
}

export interface Token {
  address: string
  decimals: number
}

export interface Collateral extends Token {
  balance: BigNumber
  allowance: BigNumber
}

export interface CollateralTokenConfig {
  decimals: number
  symbol: string
  baseSymbol: string
}

export interface UpdateStatus {
  loading: boolean
  updateTime: number
}

export function needUpdate(item: UpdateStatus, minUpdateDuration: number = 1000) {
  return !item.loading && Date.now() - item.updateTime > minUpdateDuration
}

export interface LiquidityPoolCombinedState {
  liquidityPoolAddress: string
  liquidityPoolStorage: LiquidityPoolStorage
  perpetualPropertyMap: Map<number, PerpetualProperty>
}

export interface PerpetualCombinedState {
  liquidityPoolStorage: LiquidityPoolStorage
  perpetualStorage: PerpetualStorage
  perpetualProperty: PerpetualProperty
}

export type LiquidityPoolDirectoryItem = LiquidityPoolCombinedState & UpdateStatus

export type AccountStorageDirectoryItem = AccountStorage & UpdateStatus

export interface AccountGasStorage extends UpdateStatus {
  balance: BigNumber
}

export interface TokenBalanceDirectoryItem extends UpdateStatus {
  balance: BigNumber | null
  totalSupply: BigNumber
  balanceL1: BigNumber | null
  totalSupplyL1: BigNumber
  tokenName: string
  symbol: string
  decimals: number | null
}

export interface AllowanceDirectoryItem extends UpdateStatus {
  allowance: ethers.BigNumber
}

export interface OrderConfirmParams {
  orderType: ORDER_TYPE
  orderSide: ORDER_SIDE
  tradeSymbol: string
  priceUnit: string
  triggerPrice?: BigNumber
  collateralSymbol: string
  collateralDecimals: number
  underlyingSymbol: string
  underlyingDecimals: number
  priceImpact: BigNumber | null

  // limit price
  price: BigNumber
  priceDecimals: number
  amount: BigNumber
  amountDecimals: number
  marginRatio: BigNumber
  newTotalLeverage: BigNumber
  liqPrice: BigNumber
  isInverse: boolean
  isClosePosition: boolean
  closePositionPnl: BigNumber | null
  maintenanceMargin: BigNumber | null
  marginBalance: BigNumber | null
  maxAvailableAmount: BigNumber | null
}

export enum OrderStatus {
  Pending = 'pending',
  Canceled = 'canceled',
  PartialFilled = 'partial_filled',
  FullFilled = 'full_filled',
  Stop = 'stop',
}

export interface QueryOrderHistoryApiParams {
  perpetualID: string
  status: string
  beforeOrderHash?: string
  afterOrderHash?: string
  num?: number
  // to utc unix timestamp
  startTime?: number
  endTime?: number
}

export interface QueryConfirmedOrderApiParams {
  userAddress: string
  type?: number
  perpetualID?: string
  startTime?: string
  endTime?: string
}

export interface QueryTradeHistoryApiParams {
  userAddress?: string
  type?: number
  perpetualID?: string
  startTime?: string
  endTime?: string
  offset?: number
  pageSize?: number
}

export interface QueryLiquidateHistoryApiParams {
  trader?: string
  liquidator?: string
  perpetualID?: string
  startTime?: string
  endTime?: string
  offset?: number
  pageSize?: number
}

// api order
export enum MaiProtocolVersion {
  V1 = 1,
  V2 = 2,
  V3 = 3,
}

export enum OrderTypeParams {
  MarketOrder = 0,
  LimitOrder = 1,
  StopOrder = 2,
}

export enum SignType {
  EthSign = 'ethSign',
  EIP712 = 'eip712',
}

export interface OrderApiRequestParams {
  address: string
  orderHash: string
  orderType: number
  liquidityPoolAddress: string
  brokerAddress: string
  relayerAddress: string
  referrerAddress: string
  perpetualIndex: number
  price: string
  amount: string
  minTradeAmount: string
  brokerFeeLimit: number // in gwei
  triggerPrice?: string
  // current unix timestamp + expire second
  expiresAt: number
  isCloseOnly: boolean
  chainID: number
  salt: number
  version: string
  r: string
  s: string
  v: string
  signType: SignType
  targetLeverage: string
}

export interface PerpetualV3OrderToSign {
  trader: string
  broker: string
  relayer: string
  referrer: string
  liquidityPool: string
  minTradeAmount: string
  amount: string
  limitPrice: string
  triggerPrice: string
  chainID: string
  expiredAt: string
  perpetualIndex: string
  brokerFeeLimit: string
  flags: string
  salt: string
}

export interface GetOrdersParams {
  liquidityPoolAddress?: string
  perpetualIndex?: number
  status?: string
  beforeOrderHash?: string
  afterOrderHash?: string
  beginTime?: number
  endTime?: number
  limit?: number
}

export enum NOTIFICATION_KEY {
  WSError,
  WrongNetwork,
  ReadBlockChainError,
  Emergency,
  GlobalSettled,
  Attention,
  GraphServerError,
  RelayerServerError,
  OracleChartServerError,
  MarketClosedInfo,
  OracleError,
  PoolNotRunWarn,
  PerpetualEmergency,
  PerpetualCleared,
  AmmUnsafePrompt,
}

export class Directory<T> {
  private raw: { [key: string]: T } = {}

  set(key: string, value: T) {
    if (this.has(key)) {
      this.raw[key] = value
    } else {
      this.raw = { ...this.raw, [key]: value }
    }
  }

  has(key: string) {
    return Object.getOwnPropertyNames(this.raw).includes(key)
  }

  get(key: string): T | undefined {
    return this.raw[key]
  }

  delete(key: string) {
    const temp = this.raw
    delete temp[key]
    this.raw = { ...temp }
  }

  forEach(callback: (item: T, key: string) => void) {
    const keys = Object.keys(this.raw)
    keys.forEach((key) => {
      callback(this.raw[key], key)
    })
  }

  get array(): Array<{ _key: string } & T> {
    const items: Array<{ _key: string } & T> = []
    this.forEach((item, key) => {
      items.push({ ...item, _key: key })
    })

    return items
  }

  get length(): number {
    return Object.keys(this.raw).length
  }

  clear() {
    this.raw = {}
  }

  clone() {
    const newObj = new Directory<T>()
    this.forEach((item, key) => {
      newObj.set(key, item)
    })
    return newObj
  }
}

export class LinkedMap<K, V> extends Map<K, V> {
  private _keys = new Array<K>()

  constructor(entries?: readonly (readonly [K, V])[] | null) {
    super(entries)
    entries?.forEach((e) => {
      this._keys.push(e[0])
    })
  }

  set(key: K, value: V) {
    super.set(key, value)
    if (!this.has(key)) {
      this._keys.push(key)
    }
    return this
  }

  get(key: K) {
    return super.get(key)
  }

  delete(key: K): boolean {
    const index = this._keys.indexOf(key)
    if (index > -1) {
      this._keys.splice(index, 1)
    }
    return super.delete(key)
  }

  has(key: K) {
    return super.has(key)
  }

  forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any) {
    this._keys.forEach((k) => {
      callbackfn(this.get(k)!, k, this)
    }, thisArg)
  }

  values(): IterableIterator<V> {
    const values = new Array<V>()
    this._keys.forEach((k) => {
      values.push(this.get(k)!)
    })
    return values.values()
  }
}

export enum PoolStatus {
  Unknown = 0,
  Initialize = 1,
  Normal = 2,
}

export enum PoolProposalState {
  Created,
  Active,
  Failed,
  Succeeded,
  Queued,
  Executed,
  Expired,
}

export enum DaoProposalState {
  Created,
  Active,
  Failed, // cancel
  Defeated,
  Succeeded,
  Queued,
  Expired,
  Executed,
}

export interface TokenInfoItem {
  chainId?: number
  address: string
  name?: string
  symbol: string
  decimals?: number
  logoURI?: string
}

export enum UnderlyingType {
  Index,
  Token,
}

export interface IndexUnderlying {
  type: UnderlyingType.Index
  info: string
}

export interface TokenUnderlying {
  type: UnderlyingType.Token
  info: TokenInfoItem
}

export type UnderlyingInfo = IndexUnderlying | TokenUnderlying

export type ButtonState = 'loading' | 'success' | 'fail' | 'unknown' | ''

export type PerpetualOracleType = 'whitelist' | 'oracleRouter' | 'uniswapv3' | 'custom'

export interface DumOracleRouterPath {
  oracle: string
  isInverse: boolean
  underlyingAsset: string
  collateral: string
}

export interface DumUniswapV3RouterPath {
  path: string[]
  symbols: string[]
  fees: number[]
  shortPeriod: number
  longPeriod: number
}

export interface TunableOracleInfo {
  isTerminated: boolean
  fineTuner: string
  collateral: string
  externalOracle: string
  deviation: BigNumber | null
  timeout: number | null
}

export enum TradingMiningMultiChainID {
  BSC = '0',
  ARB = '1',
  ARB_TESTNET = '1',
  TOTAL = 'total'
}
