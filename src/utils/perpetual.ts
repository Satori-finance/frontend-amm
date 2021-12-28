import { getLocalStorage, setLocalStorage } from '@/utils/storage'
import { currentChainConfig } from '@/config/chain'
import { ContractError, LiquidityPoolCombinedState, PerpetualProperty, CollateralTokenConfig } from '@/type'
import {
  _0,
  _1,
  CHAIN_ID_TO_POOL_CREATOR_ADDRESS,
  computeAMMAmountWithPrice,
  computeBestAskBidPrice,
  erc20Decimals,
  erc20Symbol,
  getERC20Contract,
  getLiquidityPool,
  getPoolCreatorContract,
  getReaderContract,
  InsufficientLiquidityError,
  InvalidArgumentError,
  IOracleFactory,
  LiquidityPoolStorage,
  listActivatePerpetualsOfTrader,
  PerpetualID,
  PerpetualStorage,
  getLiquidityPoolContract,
  PerpetualState
} from '@mcdex/mai3.js'
import { BigNumber } from 'bignumber.js'
import { getPerpetualFormatDecimals } from '@/utils/formatDecimals'
import {
  PERP_MIN_TRADE_AMOUNT_PREFIX_KEY,
  PERP_SLIPPAGE_TOLERANCE_PREFIX_KEY,
  TARGET_NETWORK_ID,
  TRADE_DEFAULT_SLIPPAGE,
} from '@/constants'
import { Provider } from '@ethersproject/providers'
import { isNativeToken } from '@/utils/chain'
import { ethers } from 'ethers'
import { VisibleTimeRange } from '@/@types/tradingview'

export async function readLiquidityPoolCombinedStorage(
  liquidityPoolAddress: string,
  provider: Provider
): Promise<LiquidityPoolCombinedState | null> {
  const reader = await getReaderContract(provider)
  try {
    const liquidityPoolStorage = await getLiquidityPool(reader, liquidityPoolAddress)
    const perpetualPropertyMap = new Map<number, PerpetualProperty>()
    const perpetuals = Array.from(liquidityPoolStorage.perpetuals)
    const [ collateralTokenConfig ] = await Promise.all([
      getCollateralTokenConfig(liquidityPoolStorage.collateral, provider)
    ])
    await Promise.all(
      perpetuals.map(async ([perpetualIndex, perpetualStorage]) => {
        perpetualPropertyMap.set(
          perpetualIndex,
          await getPerpetualProperty(
            liquidityPoolAddress,
            perpetualIndex,
            liquidityPoolStorage,
            perpetualStorage,
            {
              collateralTokenConfig: collateralTokenConfig,
            },
            provider
          )
        )
      })
    )

    return {
      liquidityPoolAddress,
      liquidityPoolStorage,
      perpetualPropertyMap,
    }
  } catch (e) {
    throw new ContractError(e)
  }
}

export const collateralTokenCache: { [address: string]: CollateralTokenConfig } = {}

export async function getCollateralTokenConfig(
  tokenAddress: string,
  provider: Provider
): Promise<CollateralTokenConfig> {
  const config = collateralTokenCache[tokenAddress.toLowerCase()]
  if (config) {
    return config
  }
  const erc20 = getERC20Contract(tokenAddress, provider)
  const baseSymbol = await erc20Symbol(erc20)
  const symbol = isNativeToken(tokenAddress) ? currentChainConfig.symbol : baseSymbol
  const decimals = await erc20Decimals(erc20)
  collateralTokenCache[tokenAddress.toLowerCase()] = { symbol, decimals, baseSymbol }
  return collateralTokenCache[tokenAddress.toLowerCase()]
}

export async function getPerpetualProperty(
  liquidityPoolAddress: string,
  perpetualIndex: number,
  liquidityPoolStorage: LiquidityPoolStorage,
  perpetualStorage: PerpetualStorage,
  publicParams: {
    collateralTokenConfig: CollateralTokenConfig,
  },
  provider: Provider
): Promise<PerpetualProperty> {
  const underlyingSymbol = perpetualStorage.underlyingSymbol
  const decimals = getPerpetualFormatDecimals(liquidityPoolStorage.collateral, perpetualStorage.indexPrice)
  let perpState: PerpetualState = perpetualStorage.state
  if (perpetualStorage.isTerminated) {
    perpState = await getPerpetualUnChangeState(liquidityPoolAddress, perpetualIndex, provider)
  }
  return new PerpetualProperty({
    liquidityPoolAddress: liquidityPoolAddress,
    perpetualIndex: perpetualIndex,
    symbol: perpetualStorage.symbol,
    isInverse: perpetualStorage.isInversePerpetual,
    collateralTokenSymbol: publicParams.collateralTokenConfig.symbol,
    collateralTokenBaseSymbol: publicParams.collateralTokenConfig.baseSymbol,
    collateralTokenDecimals: publicParams.collateralTokenConfig.decimals,
    underlyingAssetSymbol: underlyingSymbol.toUpperCase(),
    unChangePerpetualState: perpState,
    decimals: decimals,
  })
}

async function getPerpetualUnChangeState(
  liquidityPoolAddress: string,
  perpetualIndex: number,
  provider: Provider
): Promise<PerpetualState> {
  const contract = getLiquidityPoolContract(liquidityPoolAddress, provider)
  const perpInfo = await contract.getPerpetualInfo(perpetualIndex)
  return perpInfo.state
}

export interface AMMDepthData {
  price: BigNumber
  amount: BigNumber
  total: BigNumber
}

export interface ChartLocalStorage {
  state: object | null
  visibleTimeRange: VisibleTimeRange | null
}

export function alignPriceToGroup(price: BigNumber, groupSize: BigNumber, isTraderBuy: boolean): BigNumber {
  if (isTraderBuy) {
    return price
      .div(groupSize)
      .dp(0, BigNumber.ROUND_UP)
      .times(groupSize)
  } else {
    return price
      .div(groupSize)
      .dp(0, BigNumber.ROUND_DOWN)
      .times(groupSize)
  }
}

export function getAMMDepth(
  liquidityPool: LiquidityPoolStorage,
  perpetualIndex: number,
  isInverse: boolean,
  isTraderBuy: boolean,
  groupSize: BigNumber, // always > 0
  count: number
): Array<AMMDepthData> {
  const ret: Array<AMMDepthData> = []
  if (!isTraderBuy) {
    groupSize = groupSize.negated() // human perspective
  }
  // get order side (in contract perspective)
  let isTraderBuyInContract = isTraderBuy
  if (isInverse) {
    isTraderBuyInContract = !isTraderBuyInContract
  }
  try {
    // get the best ask/bid price
    let price = computeBestAskBidPrice(liquidityPool, perpetualIndex, !isTraderBuyInContract) // (in contract perspective)
    if (price.isZero()) {
      return ret
    }
    if (isInverse) {
      price = _1.div(price) // (in human perspective)
    }
    price = alignPriceToGroup(price, groupSize, isTraderBuy) // (in human perspective)
    // for each price levels (in human perspective)
    let previousTotal = _0
    let isFirst = true
    for (; ret.length < count; price = price.plus(groupSize)) {
      if (price.lt(_0)) {
        break
      }
      // limitPrice (in contract perspective)
      let limitPrice = price // (in human perspective)
      if (isInverse) {
        limitPrice = _1.div(limitPrice)
      }
      // amount
      const total = computeAMMAmountWithPrice(liquidityPool, perpetualIndex, isTraderBuyInContract, limitPrice)
      const amount = total.minus(previousTotal)
      if (amount.isZero()) {
        if (!isFirst) {
          // the 1st item will be 0 if α = 0 or precision problems. let us try the next item again
          break
        }
      } else {
        ret.push({ price, amount: amount.abs(), total: total.abs() })
        previousTotal = total
      }
      isFirst = false
    }
  } catch (e) {
    if (!(e instanceof InsufficientLiquidityError)) {
      console.warn('[BUG] computeAMMAmountWithPrice failed', e)
      return ret
    }
  }
  return ret
}

export function isLongPosition(positionSize: BigNumber, isInverse: boolean = false) {
  return isInverse ? positionSize.lte(_0) : positionSize.gte(_0)
}

export async function loadActivatePerpetuals(traderAddress: string, provider: Provider): Promise<string[]> {
  const creator = getPoolCreatorContract(CHAIN_ID_TO_POOL_CREATOR_ADDRESS[TARGET_NETWORK_ID], provider)
  const ids = await listActivatePerpetualsOfTrader(creator, traderAddress)
  return ids.map((i: PerpetualID) => getPerpetualID(i.liquidityPoolAddress, i.perpetualIndex))
}

export async function loadSATORIAddress(provider: Provider): Promise<string> {
  const creator = getPoolCreatorContract(CHAIN_ID_TO_POOL_CREATOR_ADDRESS[TARGET_NETWORK_ID], provider)
  return await creator.getSATORIToken()
}

export function getPerpetualID(liquidityPoolAddress: string, perpetualIndex: number): string {
  return `${liquidityPoolAddress}-${perpetualIndex}`
}

export function getPerpetualFromID(perpetualID: string): { liquidityPoolAddress: string; perpetualIndex: number } {
  const arr = perpetualID.split('-', 2)
  if (arr.length !== 2) {
    throw new InvalidArgumentError(`malformed perpetualID: ${perpetualID}`)
  }
  return {
    liquidityPoolAddress: arr[0],
    perpetualIndex: parseInt(arr[1]),
  }
}

export function getPerpetualMinTradeAmount(perpetualID: string): number {
  if (perpetualID === '') {
    return -1
  }
  const key = `${PERP_MIN_TRADE_AMOUNT_PREFIX_KEY}${perpetualID.toLowerCase()}`
  const amount = getLocalStorage(key)
  if (!amount) {
    return -1
  }
  return amount
}

export function setPerpetualMinTradeAmount(perpetualID: string, amount: string | number) {
  if (perpetualID === '') {
    return
  }
  const key = `${PERP_MIN_TRADE_AMOUNT_PREFIX_KEY}${perpetualID.toLowerCase()}`
  setLocalStorage(key, amount)
}

export function getPerpetualSlippageTolerance(perpetualID: string): string {
  const defaultSlippage: string = TRADE_DEFAULT_SLIPPAGE
  if (perpetualID === '') {
    return defaultSlippage
  }
  const key = `${PERP_SLIPPAGE_TOLERANCE_PREFIX_KEY}${perpetualID.toLowerCase()}`
  const slippage = getLocalStorage(key)
  if (!slippage) {
    return defaultSlippage
  }
  return slippage
}

export function setPerpetualSlippageTolerance(perpetualID: string, slippage: string) {
  if (perpetualID === '') {
    return
  }
  const key = `${PERP_SLIPPAGE_TOLERANCE_PREFIX_KEY}${perpetualID.toLowerCase()}`
  setLocalStorage(key, slippage)
}

export function isDangerPerpetual(symbol: number) {
  return symbol > 9999
}

export function poolHasErrorOracle(liquidityPool: LiquidityPoolStorage): boolean {
  for (let item of liquidityPool.perpetuals.entries()) {
    if (item[1].indexPrice.eq(0)) {
      return true
    }
  }
  return false
}

export interface CheckOracleAdaptorResult {
  underlyingAsset: string
  quoteSymbol: string
}

export class CheckOracleAdaptorError extends Error {
  reason: string = ''
  args: { [key: string]: any }

  constructor(reason: string, args: { [key: string]: any }) {
    super(reason)
    this.reason = reason
    this.args = args
  }
}

export async function checkValidOracleAdaptor(
  adaptorAddress: string,
  provider: Provider
): Promise<CheckOracleAdaptorResult> {
  let ret: CheckOracleAdaptorResult = { underlyingAsset: '', quoteSymbol: '' }
  if (!ethers.utils.isAddress(adaptorAddress)) {
    throw new CheckOracleAdaptorError('newContract.invalidAdapterBadAddress', {})
  }
  const readOracle = async (funcName: string, f: () => Promise<void>): Promise<void> => {
    try {
      await f()
    } catch (err) {
      console.warn('checkValidOracleAdaptor', funcName, err)
      if (err.code === 'CALL_EXCEPTION' || err.code === -32015 || err.code === -32603) {
        throw new CheckOracleAdaptorError('newContract.invalidAdapterMissFunction', { function: funcName })
      }
      throw err
    }
  }
  const oracle = IOracleFactory.connect(adaptorAddress, provider)
  await readOracle('underlyingAsset', async () => {
    ret.underlyingAsset = await oracle.underlyingAsset()
  })
  await readOracle('collateral', async () => {
    ret.quoteSymbol = await oracle.collateral()
  })
  await readOracle('priceTWAPLong', async () => {
    const { newPrice } = await oracle.callStatic.priceTWAPLong()
    if (newPrice.lte('0')) {
      throw new CheckOracleAdaptorError('newContract.invalidAdapterZeroPrice', {})
    }
  })
  await readOracle('priceTWAPShort', async () => {
    const { newPrice } = await oracle.callStatic.priceTWAPShort()
    if (newPrice.lte('0')) {
      throw new CheckOracleAdaptorError('newContract.invalidAdapterZeroPrice', {})
    }
  })
  await readOracle('isMarketClosed', async () => {
    await oracle.callStatic.isMarketClosed()
  })
  await readOracle('isTerminated', async () => {
    const term = await oracle.callStatic.isTerminated()
    if (term) {
      throw new CheckOracleAdaptorError('newContract.invalidAdapterTerminated', {})
    }
  })
  return ret
}
