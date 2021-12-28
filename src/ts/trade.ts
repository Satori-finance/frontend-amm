import { ORDER_SIDE } from '@/ts/types'
import {
  _0,
  _1,
  AccountDetails,
  computeAccount,
  computeAMMMaxTradeAmount,
  computeAMMPrice,
  computeAMMTrade,
  computeAMMTradeAmountByMargin,
  computeLimitOrderMaxTradeAmount,
  computeTradeWithPrice,
  LiquidityPoolStorage,
  Order,
  orderCost,
  TradeFlag,
  computePerpetualOpenInterestLimit,
  computeAMMOpenInterest,
} from '@mcdex/mai3.js'
import { BigNumber } from 'bignumber.js'
import { DataNotFoundError, PerpetualCombinedState } from '@/type'
import { OpenInterestExceededError, OrderContext } from '@mcdex/mai3.js/dist/types'
import { getLeverageFlag } from '@/utils/leverage'

export interface TradeParams {
  isEmpty: boolean // true if the market is changing, order type is changing, etc.
  orderSide: ORDER_SIDE
  price: string
  amount: string // always >= 0
  triggerPrice: string
  value: string // price * amount
  maxAmount: string
  amountProportion: number // amount = maxAmount * amountProportion
  isCloseOnly: boolean
  minTradeAmount: string
}

export interface TradeStrategyContext {
  tradeForm: TradeParams
  liquidityPool: LiquidityPoolStorage | null
  perpetualIndex: number | null
  perp: PerpetualCombinedState | null
  trader: AccountDetails | null
  walletBalance: BigNumber | null
  orderAvailable: BigNumber | null
  orders: Order[]
  ordersContext: Map<number, OrderContext>
  targetLeverage: BigNumber | null
}

export interface TradeResult {
  trader: AccountDetails
  tradeIsSafe: boolean
  fee: BigNumber
  cost: BigNumber
}

export function emptyTradeParams(): TradeParams {
  return {
    isEmpty: true,
    orderSide: ORDER_SIDE.Buy,
    price: '0',
    amount: '',
    triggerPrice: '',
    value: '',
    maxAmount: '0',
    amountProportion: 0,
    isCloseOnly: false,
    minTradeAmount: '',
  }
}

export function fillDefaultTradeParams(context: TradeStrategyContext) {
  if (!context.tradeForm.isEmpty) {
    return
  }
  if (!context.perp) {
    return
  }
  context.tradeForm.price = contractPriceToUIPrice(context, context.perp.perpetualStorage.markPrice).toFixed(
    context.perp.perpetualProperty.priceFormatDecimals
  )
  context.tradeForm.isEmpty = false
}

export interface TradeStrategy {
  getMaxAmount(context: TradeStrategyContext): BigNumber | null
  getMaxAvailableAmount(context: TradeStrategyContext): BigNumber | null
  getValueByAmount(context: TradeStrategyContext): { newPrice?: BigNumber; newValue: BigNumber } | null
  getAmountByValue(context: TradeStrategyContext): { newPrice?: BigNumber; newAmount: BigNumber } | null
  getTradeResult(context: TradeStrategyContext): TradeResult | null
}

export class MarketTradeStrategy implements TradeStrategy {
  getMaxAmount(context: TradeStrategyContext): BigNumber | null {
    if (!context.liquidityPool || context.perpetualIndex === null || !context.trader || !context.walletBalance || !context.targetLeverage) {
      return null
    }
    if (context.tradeForm.isCloseOnly) {
      if (isClosing(context)) {
        return context.trader.accountStorage.positionAmount.abs()
      }
      return _0
    }
    const perpetual = context.liquidityPool.perpetuals.get(context.perpetualIndex)
    if (!perpetual) {
      return null
    }
    const amount = computeAMMMaxTradeAmount(
      context.liquidityPool,
      context.perpetualIndex,
      context.trader.accountStorage,
      context.walletBalance,
      isBuyInContract(context),
      context.targetLeverage.toNumber(),
    )
    return amount.abs()
  }

  getMaxAvailableAmount(context: TradeStrategyContext): BigNumber | null {
    if (!context.liquidityPool || context.perpetualIndex === null || !context.trader || !context.walletBalance || !context.targetLeverage) {
      return null
    }
    const perpetual = context.liquidityPool.perpetuals.get(context.perpetualIndex)
    if (!perpetual) {
      return null
    }
    const amount = computeAMMMaxTradeAmount(
      context.liquidityPool,
      context.perpetualIndex,
      context.trader.accountStorage,
      context.walletBalance,
      isBuyInContract(context),
      context.targetLeverage.toNumber(),
    )
    return amount.abs()
  }

  getValueByAmount(context: TradeStrategyContext): { newPrice?: BigNumber; newValue: BigNumber } | null {
    if (!context.liquidityPool || context.perpetualIndex === null) {
      return null
    }
    let a = new BigNumber(context.tradeForm.amount)
    if (!a.isFinite() || a.lt(_0)) {
      return null
    }
    if (a.isZero()) {
      return { newPrice: new BigNumber(context.tradeForm.price), newValue: _0 }
    }
    const ammPrice = computeAMMPrice(
      context.liquidityPool,
      context.perpetualIndex,
      uiAmountToContractAmount(context, a)
    )
    const newValue = ammPrice.tradingPrice.times(a).abs()
    const newPrice = contractPriceToUIPrice(context, ammPrice.tradingPrice)
    return { newPrice, newValue }
  }

  getAmountByValue(context: TradeStrategyContext): { newPrice?: BigNumber; newAmount: BigNumber } | null {
    if (!context.perp || !context.liquidityPool || context.perpetualIndex === null) {
      return null
    }
    let v = new BigNumber(context.tradeForm.value)
    if (!v.isFinite() || v.lt(_0)) {
      return null
    }
    if (v.isZero()) {
      return { newPrice: new BigNumber(context.tradeForm.price), newAmount: _0 }
    }
    // trader's margin change. < 0 if buy, > 0 if sell
    if (context.tradeForm.orderSide === ORDER_SIDE.Buy) {
      v = v.negated()
    }
    if (context.perp.perpetualProperty.isInverse) {
      v = v.negated()
    }
    let newAmount = computeAMMTradeAmountByMargin(context.liquidityPool, context.perpetualIndex, v)
    let newPrice = v.div(newAmount).abs()
    if (context.tradeForm.orderSide === ORDER_SIDE.Sell) {
      newAmount = newAmount.negated()
    }
    if (context.perp.perpetualProperty.isInverse) {
      newAmount = newAmount.negated()
      newPrice = _1.div(newPrice)
    }
    return { newPrice, newAmount }
  }

  getTradeResult(context: TradeStrategyContext): TradeResult | null {
    if (!context.liquidityPool || context.perpetualIndex === null || !context.trader || !context.targetLeverage) {
      return null
    }
    let amount = new BigNumber(context.tradeForm.amount)
    if (!amount.isFinite() || amount.lt(_0)) {
      return null
    }
    amount = uiAmountToContractAmount(context, amount)
    let newTrader = computeAccount(context.liquidityPool, context.perpetualIndex, context.trader.accountStorage)
    let tradeIsSafe = true
    let fee = _0
    let cost = _0
    if (!amount.isZero()) {
      let maskFlag = getLeverageFlag(context.targetLeverage.toNumber())
      if (context.tradeForm.isCloseOnly) {
        maskFlag += TradeFlag.MASK_CLOSE_ONLY
      }
      const afterTrading = computeAMMTrade(
        context.liquidityPool,
        context.perpetualIndex,
        context.trader.accountStorage,
        amount,
        maskFlag
      )
      newTrader = afterTrading.trader
      tradeIsSafe = afterTrading.tradeIsSafe
      fee = afterTrading.totalFee
      cost = afterTrading.adjustCollateral.gt(0) ? afterTrading.adjustCollateral : _0
    }
    return {
      trader: newTrader,
      tradeIsSafe,
      fee,
      cost,
    }
  }
}

export class LimitOrderTradeStrategy implements TradeStrategy {
  getMaxAmount(context: TradeStrategyContext): BigNumber | null {
    if (
      !context.perp ||
      !context.trader ||
      !context.liquidityPool ||
      context.perpetualIndex === null ||
      !context.walletBalance ||
      !context.targetLeverage
    ) {
      return null
    }
    if (context.tradeForm.isCloseOnly) {
      if (isClosing(context)) {
        return context.trader.accountStorage.positionAmount.abs()
      }
      return _0
    }

    let price = new BigNumber(context.tradeForm.price)
    if (!price.isFinite() || price.lt(_0)) {
      return null
    }
    if (context.perp.perpetualProperty.isInverse) {
      price = _1.div(price)
    }
    if (price.isZero()) {
      return _0
    }
    // broker server has a fee
    const amount = computeLimitOrderMaxTradeAmount(
      context.ordersContext,
      context.walletBalance,
      context.orders,
      context.perp.perpetualProperty.symbol,
      price,
      isBuyInContract(context),
      context.targetLeverage,
    )
    return amount.abs()
  }

  getMaxAvailableAmount(context: TradeStrategyContext): BigNumber | null {
    return this.getMaxAmount(context)
  }

  getValueByAmount(context: TradeStrategyContext): { newPrice?: BigNumber; newValue: BigNumber } | null {
    if (!context.perp) {
      return null
    }
    let newPrice = new BigNumber(context.tradeForm.price)
    if (!newPrice.isFinite() || newPrice.lt(_0)) {
      return null
    }
    let newAmount = new BigNumber(context.tradeForm.amount)
    if (!newAmount.isFinite() || newAmount.lt(_0)) {
      return null
    }
    if (context.perp.perpetualProperty.isInverse) {
      newPrice = _1.div(newPrice)
    }
    let newValue = newPrice.times(newAmount)
    return { newValue }
  }

  getAmountByValue(context: TradeStrategyContext): { newPrice?: BigNumber; newAmount: BigNumber } | null {
    if (!context.perp) {
      return null
    }
    let newPrice = new BigNumber(context.tradeForm.price)
    if (!newPrice.isFinite() || newPrice.lt(_0)) {
      return null
    }
    let newValue = new BigNumber(context.tradeForm.value)
    if (!newValue.isFinite() || newValue.lt(_0)) {
      return null
    }
    if (context.perp.perpetualProperty.isInverse) {
      newPrice = _1.div(newPrice)
    }
    let newAmount = _0
    if (!newPrice.isZero()) {
      newAmount = newValue.div(newPrice)
    }
    return { newAmount }
  }

  getTradeResult(context: TradeStrategyContext): TradeResult | null {
    if (
      !context.perp ||
      !context.trader ||
      !context.liquidityPool ||
      context.perpetualIndex === null ||
      !context.orderAvailable ||
      !context.walletBalance ||
      !context.targetLeverage
    ) {
      return null
    }
    let price = new BigNumber(context.tradeForm.price)
    if (!price.isFinite() || price.lt(_0)) {
      return null
    }
    if (context.perp.perpetualProperty.isInverse) {
      price = _1.div(price)
    }
    let amount = new BigNumber(context.tradeForm.amount)
    if (!amount.isFinite() || amount.lt(_0)) {
      return null
    }
    amount = uiAmountToContractAmount(context, amount)
    // trade
    let tradeIsSafe = true
    let newAccount = computeAccount(context.liquidityPool, context.perpetualIndex, context.trader.accountStorage)
    let fee = _0
    let cost = _0
    if (!amount.isZero()) {
      let maskFlag = getLeverageFlag(context.targetLeverage.toNumber())
      if (context.tradeForm.isCloseOnly) {
        maskFlag += TradeFlag.MASK_CLOSE_ONLY
      }
      let feeRate = context.liquidityPool.vaultFeeRate
      feeRate = feeRate.plus(context.perp.perpetualStorage.lpFeeRate)
      feeRate = feeRate.plus(context.perp.perpetualStorage.operatorFeeRate)
      // trade
      const tradeResult = computeTradeWithPrice(
        context.liquidityPool,
        context.perpetualIndex,
        context.trader.accountStorage,
        price,
        amount,
        feeRate,
        maskFlag
      )
      newAccount = tradeResult.afterTrade
      tradeIsSafe = tradeResult.tradeIsSafe
      // cost
      const orderCostValue = orderCost(
        context.ordersContext,
        context.walletBalance,
        context.orders,
        context.orderAvailable,
        {
          limitPrice: price,
          amount: amount,
          symbol: context.perp.perpetualProperty.symbol,
          targetLeverage: context.targetLeverage,
        }
      )
      fee = tradeResult.totalFee
      cost = orderCostValue.gt(0) ? orderCostValue : _0
      // open interest
      const oldOpenInterest = context.perp.perpetualStorage.openInterest
      const openInterestLimit = computePerpetualOpenInterestLimit(context.liquidityPool, context.perpetualIndex)
      const newOpenInterest = computeAMMOpenInterest(
        context.liquidityPool,
        context.perpetualIndex,
        context.trader.accountStorage,
        amount
      )
      if (newOpenInterest.gt(oldOpenInterest) && newOpenInterest.gt(openInterestLimit)) {
        throw new OpenInterestExceededError(
          `open interest exceeds limit: ${newOpenInterest.toFixed()} > ${openInterestLimit.toFixed()}`,
          newOpenInterest,
          openInterestLimit
        )
      }
    }
    return {
      tradeIsSafe,
      trader: newAccount,
      fee,
      cost,
    }
  }
}

export const StopLimitOrderTradeStrategy = LimitOrderTradeStrategy

export function isBuyInContract(context: TradeStrategyContext): boolean {
  if (!context.perp) {
    throw new DataNotFoundError('perp')
  }
  if (context.perp.perpetualProperty.isInverse) {
    return context.tradeForm.orderSide == ORDER_SIDE.Sell
  } else {
    return context.tradeForm.orderSide == ORDER_SIDE.Buy
  }
}

export function uiPriceToContractPrice(context: TradeStrategyContext, p: BigNumber): BigNumber {
  if (!context.perp) {
    throw new DataNotFoundError('perp')
  }
  if (context.perp.perpetualProperty.isInverse) {
    p = _1.div(p)
  }
  return p
}

export function contractPriceToUIPrice(context: TradeStrategyContext, p: BigNumber): BigNumber {
  if (!context.perp) {
    throw new DataNotFoundError('perp')
  }
  if (context.perp.perpetualProperty.isInverse) {
    p = _1.div(p)
  }
  return p
}

export function uiAmountToContractAmount(context: TradeStrategyContext, a: BigNumber): BigNumber {
  if (!context.perp) {
    throw new DataNotFoundError('perp')
  }
  if (context.tradeForm.orderSide == ORDER_SIDE.Sell) {
    a = a.negated()
  }
  if (context.perp.perpetualProperty.isInverse) {
    a = a.negated()
  }
  return a
}

export function isClosing(context: TradeStrategyContext): boolean {
  if (!context.trader) {
    throw new DataNotFoundError('context.trader')
  }
  if (isBuyInContract(context)) {
    return context.trader.accountStorage.positionAmount.lte(_0)
  } else {
    return context.trader.accountStorage.positionAmount.gte(_0)
  }
}
