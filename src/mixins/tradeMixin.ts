import { BigNumber } from 'bignumber.js'
import { Component, Mixins, Watch } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import {
  _0,
  _1,
  AccountDetails,
  computeBestAskBidPrice,
  getLiquidityPoolContract,
  InsufficientLiquidityError,
  LiquidityPoolStorage,
  normalizeBigNumberish,
  Order as mai3Order,
  orderAvailable,
  PerpetualStorage,
  perpetualTrade,
  splitAmount,
  TradeFlag,
} from '@mcdex/mai3.js'
import { Wallet } from '@/business-components/wallet/wallet-connector'
import {
  emptyTradeParams,
  MarketTradeStrategy,
  TradeParams,
  TradeResult,
  TradeStrategy,
  TradeStrategyContext,
  uiAmountToContractAmount,
} from '@/ts/trade'
import {
  AccountStorageDirectoryItem,
  ButtonState,
  ContractError,
  DataNotFoundError,
  LiquidityPoolDirectoryItem,
  MarginAccount,
  OrderApiRequestParams,
  OrderStruct,
  OrderTypeParams,
  PerpetualCombinedState,
  PerpetualV3OrderToSign,
  SignType,
  TokenBalanceDirectoryItem,
  WalletError,
} from '@/type'
import { ErrorHandlerMixin, processStoreErrors } from '@/mixins/errorHandlerMixin'
import { ethers } from 'ethers'
import { ORDER_SIDE } from '@/ts'
import {
  bigNumberFormatterTruncateByPrecision,
  getOrderFlag,
  getOrderHash,
  getPerpetualFromID,
  getPerpetualID,
  signOrder,
  toBigNumber,
} from '@/utils'
import { fromWad, toWad } from '@/utils/chain'
import { waitTransaction } from '@/utils/transaction'
import { getGasStationPrice, getGasStationTxParams } from '@/utils/gasPrice'
import { gasLimitConfig } from '@/config/gas'
import { ACCOUNT_EVENT, PLACE_ORDER_EVENT, VUE_EVENT_BUS } from '@/event'
import { SUPPORTED_NETWORK_ID, TRADE_DEFAULT_SLIPPAGE } from '@/const'
import { getSignOrderInfo, placeOrder } from '@/api/order'
import { currentChainConfig } from '@/config/chain'
import { OpenInterestExceededError, OrderContext } from '@mcdex/mai3.js/dist/types'
import { computeAccountDetails } from '@/utils/account'
import { USDTokenSet } from '@/config/tokens'

const wallet = namespace('wallet')
const perpetual = namespace('perpetual')
const account = namespace('account')
const auth = namespace('auth')
const order = namespace('order')
const price = namespace('price')

export interface OrderTradeBaseParams {
  accountAddress: string
  limitPrice: string,
  amount: BigNumber
  expire: number
  symbol: string
  noticeAmount: string
  noticePrice: string
  referrer: string
  perpetualIndex: number
  liquidityPoolAddress: string
  isCloseOnly: boolean
}

export interface BuildMarketTradeParams extends OrderTradeBaseParams {
  errorCallback?: Function
}

export interface BuildOrderApiParams extends OrderTradeBaseParams {
  chainID: string
  orderType: OrderTypeParams
  minTradeAmount: number
  triggerPrice?: string
  relayerErrCallback?: Function
  signErrCallback?: Function
  placeOrderErrCallback?: Function
}

/**
 * register Trade EVENT BUS
 */
@Component
export class TradeMixin extends Mixins(ErrorHandlerMixin) {
  @perpetual.Getter('getPerpetualFunc') getPerpetualFunc!: (perpetualID: string) => PerpetualCombinedState | null
  @perpetual.Getter('getLiquidityPoolFunc') getLiquidityPoolFunc!: (liquidityPoolAddress: string) => LiquidityPoolDirectoryItem | null
  @perpetual.Action('updatePerpetual') updatePerpetual!: (perpetualId: string) => Promise<void>
  @account.Getter('accountStorageFunc') accountStorageFunc!: (perpetualID: string) => AccountStorageDirectoryItem | null
  @account.Getter('marginAccountFunc') marginAccountFunc!: (perpetualID: string) => MarginAccount | null
  @account.Action('updateAccountStorage') updateAccountStorage!: (perpetualID: string) => Promise<void>
  @account.Getter('tokenBalanceFunc') tokenBalanceFunc!: (tokenAddress: string) => TokenBalanceDirectoryItem | null
  @wallet.Getter('address') tradeAccountAddress!: string | null
  @wallet.Getter('networkId') tradeChainID!: string | null
  @wallet.State('wallet') tradeWalletConnector!: Wallet | null
  @wallet.Getter('signer') walletSigner!: ethers.Signer | null
  @wallet.Getter('isConnectedWallet') isConnectedWallet!: boolean
  @auth.Getter('isValidateFunc') jwtIsValidateFunc!: Function
  @order.Getter('openOrders') openOrders!: OrderStruct[]
  @account.Getter('targetLeverageFunc') targetLeverageFunc!: (perpetualId: string) => BigNumber | null
  @price.Getter('tokenPriceFunc') tokenPriceFunc!: (token: string) => BigNumber | null
  @price.Action('updateTokenPrice') updateTokenPrice!: (payload: string[]) => Promise<void>


  protected tradeForm: TradeParams = emptyTradeParams()
  protected tradeStrategy: TradeStrategy = new MarketTradeStrategy()
  protected hasInsufficientLiquidityError = false
  protected hasOpenInterestExceededError = false
  protected tradingPerpetualID: string | null = null
  protected tradeState: ButtonState = ''
  protected walletBalance: BigNumber | null = null

  protected refreshPerpetualAndAccount: boolean = false
  protected refreshTimer = 0

  protected ordersDetailsHasNull: boolean = true

  protected marketExpire: string = currentChainConfig.marketOrderExpireTime.toString()
  protected orderExpire: string = '90'
  protected defaultMinTradeAmount: string = ''
  protected defaultSlippageTolerance: string = TRADE_DEFAULT_SLIPPAGE
  protected safeMax: string = '95'  // 95%
  protected setSlippageTolerance: string = this.defaultSlippageTolerance

  get tradingLiquidityPoolInfo(): { liquidityPoolAddress: string, perpetualIndex: number } | null {
    if (!this.tradingPerpetualID) {
      return null
    }
    return getPerpetualFromID(this.tradingPerpetualID)
  }

  get tradingPerpetual(): PerpetualCombinedState | null {
    if (!this.getPerpetualFunc || !this.tradingPerpetualID) {
      return null
    }
    try {
      return this.getPerpetualFunc(this.tradingPerpetualID) || null
    } catch (e) {
      processStoreErrors(this, e)
      return null
    }
  }

  get tradingPerpetualProperty() {
    return this.tradingPerpetual?.perpetualProperty || null
  }

  get tradingPerpetualStorage(): PerpetualStorage | null {
    return this.tradingPerpetual?.perpetualStorage || null
  }

  get tradingLiquidityPool(): LiquidityPoolDirectoryItem | null {
    if (!this.getLiquidityPoolFunc || !this.tradingLiquidityPoolInfo) {
      return null
    }
    try {
      return this.getLiquidityPoolFunc(this.tradingLiquidityPoolInfo.liquidityPoolAddress) || null
    } catch (e) {
      processStoreErrors(this, e)
      return null
    }
  }

  get tradingLiquidityPoolStorage(): LiquidityPoolStorage | null {
    if (!this.tradingLiquidityPool) {
      return null
    }
    return this.tradingLiquidityPool.liquidityPoolStorage
  }

  get tradingAccountStorage(): AccountStorageDirectoryItem | null {
    if (!this.tradingPerpetualID || !this.tradeAccountAddress) {
      return null
    }

    return this.accountStorageFunc(this.tradingPerpetualID)
  }

  get tradingAccountDetails(): AccountDetails | null {
    return this.tradingPerpetualID && this.tradingAccountStorage && this.tradingLiquidityPoolStorage
      ? computeAccountDetails(this.tradingPerpetualID, this.tradingAccountStorage, this.tradingLiquidityPoolStorage, this.tradingMarginAccount)
      : null
  }

  get tradingMarginAccount(): MarginAccount | null {
    if (!this.tradingPerpetualID || !this.tradeAccountAddress) {
      return null
    }

    return this.marginAccountFunc(this.tradingPerpetualID)
  }

  get tradingAccountCollateralBalance(): BigNumber | null {
    if (!this.tradingLiquidityPool || !this.tradeAccountAddress) {
      return null
    }
    try {
      return this.tokenBalanceFunc(this.tradingLiquidityPool.liquidityPoolStorage.collateral)?.balance || null
    } catch (e) {
      processStoreErrors(this, e)
      return null
    }
  }

  get tradingPerpetualIsInverse() {
    return !!this.tradingPerpetualProperty?.isInverse
  }

  get tradingPerpetualIsMarketClosed(): boolean | null {
    if (!this.tradingPerpetualStorage) {
      return null
    }
    return this.tradingPerpetualStorage.isMarketClosed
  }

  get tradingPerpetualCollateralAddress(): string {
    return this.tradingPerpetual?.liquidityPoolStorage.collateral || ''
  }

  get collateralTokenPrice(): BigNumber | null {
    return this.tokenPriceFunc(this.tradingPerpetualCollateralAddress,)
  }

  get validSafeMax(): BigNumber {
    // 0.95(return) --> 95%
    const safeMax = new BigNumber(this.safeMax)
    if (safeMax.isNaN() || safeMax.isZero() || safeMax.gt(100) || this.safeMax === '') {
      return new BigNumber(this.safeMax).div(100)
    }
    return safeMax.div(100)
  }

  get maxTradableAmount(): BigNumber | null {
    const amount = this.tradeStrategy.getMaxAmount(this.tradeStrategyContext)
    if (!amount) {
      return null
    }
    // console.log('max tradable amount', amount.toFixed())
    if (this.tradeForm.isCloseOnly) {
      return amount
    }
    return amount.times(this.validSafeMax)
  }

  get maxAvailableAmount(): BigNumber | null {
    const amount = this.tradeStrategy.getMaxAvailableAmount(this.tradeStrategyContext)
    if (!amount) {
      return null
    }
    if (this.tradeForm.isCloseOnly) {
      return amount
    }
    return amount.times(this.validSafeMax)
  }

  get ordersContext(): {
    orders: mai3Order[],
    context: Map<number, OrderContext>
  } {
    const defaultResult = { orders: [], context: new Map<number, OrderContext>() }
    let result: {
      orders: mai3Order[],
      context: Map<number, OrderContext>
    } = { ...defaultResult }

    if (!this.tradingPerpetual || !this.tradingAccountDetails) {
      return defaultResult
    }
    // current perpetual
    result.context.set(
      this.tradingPerpetual.perpetualProperty.symbol,
      {
        pool: this.tradingPerpetual.liquidityPoolStorage,
        perpetualIndex: this.tradingPerpetual.perpetualProperty.perpetualIndex,
        account: this.tradingAccountDetails.accountStorage,
      },
    )

    // orders
    for (let i = 0; i < this.openOrders.length; i++) {
      const openOrderItem = this.openOrders[i]
      // choose the order of the same collateral
      if (openOrderItem.collateralAddress.toLowerCase() !== this.tradingPerpetual.liquidityPoolStorage.collateral.toLowerCase()) {
        continue
      }
      const perpetualId = getPerpetualID(openOrderItem.liquidityPoolAddress, openOrderItem.perpetualIndex)
      const perpetualCombinedState = this.getPerpetualFunc(perpetualId)
      const accountStorage = this.accountStorageFunc(perpetualId)
      if (!perpetualCombinedState || !accountStorage) {
        // null data
        this.ordersDetailsHasNull = true
        return defaultResult
      }
      result.orders.push({
        symbol: perpetualCombinedState.perpetualStorage.symbol,
        limitPrice: new BigNumber(openOrderItem.price),
        amount: new BigNumber(openOrderItem.availableAmount).plus(openOrderItem.pendingAmount),
        targetLeverage: new BigNumber(openOrderItem.targetLeverage),
      })
      result.context.set(
        perpetualCombinedState.perpetualStorage.symbol,
        {
          pool: perpetualCombinedState.liquidityPoolStorage,
          perpetualIndex: perpetualCombinedState.perpetualProperty.perpetualIndex,
          account: accountStorage,
        },
      )
    }
    this.ordersDetailsHasNull = false
    return result
  }

  get orderAvailable(): BigNumber | null {
    if (!this.tradingLiquidityPoolStorage || !this.tradingPerpetualProperty
      || !this.tradingAccountDetails || !this.walletBalance || !this.isConnectedWallet || !this.jwtIsValidateFunc()) {
      return null
    }
    return orderAvailable(
      this.ordersContext.context,
      this.walletBalance,
      this.ordersContext.orders,
      this.tradingPerpetualProperty.symbol,
    )
  }

  get tradeStrategyContext(): TradeStrategyContext {
    return {
      tradeForm: this.tradeForm,
      liquidityPool: this.tradingLiquidityPool?.liquidityPoolStorage || null,
      perpetualIndex: this.tradingLiquidityPoolInfo ? this.tradingLiquidityPoolInfo.perpetualIndex : null,
      perp: this.tradingPerpetual,
      trader: this.tradingAccountDetails,
      walletBalance: this.walletBalance,
      orderAvailable: this.orderAvailable,
      orders: this.ordersContext.orders,
      ordersContext: this.ordersContext.context,
      targetLeverage: this.targetLeverage,
    }
  }

  get afterTradingResult(): TradeResult | null {
    try {
      this.hasInsufficientLiquidityError = false
      this.hasOpenInterestExceededError = false
      return this.tradeStrategy.getTradeResult(this.tradeStrategyContext)
    } catch (e) {
      if (e instanceof InsufficientLiquidityError) {
        this.hasInsufficientLiquidityError = true
      }
      if (e instanceof OpenInterestExceededError) {
        this.hasOpenInterestExceededError = true
      }
      return null
    }
  }

  get bestAMMAskBidPrice(): BigNumber | null {
    if (!this.tradingLiquidityPoolStorage || !this.tradingLiquidityPoolInfo || !this.tradingPerpetual) {
      return null
    }
    try {
      let orderSideIsBuy: boolean = this.tradeForm.orderSide === ORDER_SIDE.Buy
      if (this.tradingPerpetual.perpetualProperty.isInverse) {
        orderSideIsBuy = !orderSideIsBuy
      }
      return computeBestAskBidPrice(
        this.tradingLiquidityPoolStorage,
        this.tradingLiquidityPoolInfo.perpetualIndex,
        !orderSideIsBuy,
      )
    } catch {
      return null
    }
  }

  get tradePriceImpact(): BigNumber | null {  // e: 5%
    if (!this.tradingPerpetual) {
      return null
    }
    const isInverse = this.tradingPerpetual.perpetualProperty.isInverse
    let price = new BigNumber(this.tradeForm.price)
    if (!this.bestAMMAskBidPrice || price.isNaN()) {
      return null
    }
    if (isInverse) {
      price = _1.div(price)
    }
    if (this.tradeForm.orderSide === ORDER_SIDE.Buy) {
      let v = _0
      if (isInverse) {
        v = this.bestAMMAskBidPrice.minus(price).div(price).times(100)
      } else {
        v = price.minus(this.bestAMMAskBidPrice).div(price).times(100)
      }
      return v.lte(0) ? _0 : v
    }
    if (this.tradeForm.orderSide === ORDER_SIDE.Sell) {
      let v = _0
      if (isInverse) {
        v = price.minus(this.bestAMMAskBidPrice).div(price).times(100)
      } else {
        v = this.bestAMMAskBidPrice.minus(price).div(price).times(100)
      }
      return v.lte(0) ? _0 : v
    }
    return _0
  }

  get isClosePosition(): boolean {
    if (!this.tradingAccountDetails || !this.contractAmount) {
      return false
    }
    const { close } = splitAmount(this.tradingAccountDetails.accountStorage.positionAmount, this.contractAmount)
    if (!close.isZero()) {
      return true
    }
    return false
  }

  get closePositionPnl(): BigNumber | null {
    if (!this.tradingAccountDetails || !this.contractAmount || !this.tradingPerpetual) {
      return null
    }
    const { close } = splitAmount(this.tradingAccountDetails.accountStorage.positionAmount, this.contractAmount)
    if (!close.isZero()) {
      const entryValue = this.tradingAccountDetails.accountStorage.entryValue
      const entryFunding = this.tradingAccountDetails.accountStorage.entryFunding
      if (!entryValue || !entryFunding || !this.tradingPerpetualStorage) {
        return null
      }
      let closePercent = close.div(this.tradingAccountDetails.accountStorage.positionAmount).abs()
      let limitPrice = new BigNumber(this.tradeForm.price)
      if (this.tradingPerpetual.perpetualProperty.isInverse) {
        limitPrice = _1.div(limitPrice)
      }
      let pnl1 = close.negated().times(limitPrice).minus(entryValue.times(closePercent))
      let fundingPnl = entryFunding.times(closePercent).minus(close.negated().times(this.tradingPerpetualStorage.unitAccumulativeFunding))
      return pnl1.plus(fundingPnl)
    }
    return null
  }

  get afterTrading(): AccountDetails | null {
    if (!this.afterTradingResult) return null
    return this.afterTradingResult.trader
  }

  get afterTradingMaintenanceMargin(): BigNumber | null {
    if (this.afterTrading) {
      return this.afterTrading.accountComputed.maintenanceMargin
    }
    if (this.tradingAccountDetails) {
      return this.tradingAccountDetails.accountComputed.maintenanceMargin
    }
    return null
  }

  get afterTradingMarginBalance(): BigNumber | null {
    if (this.afterTrading) {
      return this.afterTrading.accountComputed.marginBalance
    }
    if (this.tradingAccountDetails) {
      return this.tradingAccountDetails.accountComputed.marginBalance
    }
    return null
  }

  get priceFormatRound(): BigNumber.RoundingMode {
    if (this.tradeForm.orderSide === ORDER_SIDE.Buy) {
      return BigNumber.ROUND_UP
    }
    return BigNumber.ROUND_DOWN
  }

  get contractAmount(): BigNumber | null {
    if (this.tradeForm.amount === '' || isNaN(Number(this.tradeForm.amount))) {
      return null
    }
    let a = normalizeBigNumberish(this.tradeForm.amount)
    if (!a.isFinite() || a.lt(_0) || a.isNaN()) {
      return null
    }
    return uiAmountToContractAmount(this.tradeStrategyContext, a)
  }

  convertPriceFromSlippage(price: BigNumber, slippage: BigNumber, isInverse: boolean): BigNumber {
    let priceLimit = price
    let slippageTolerance: BigNumber
    if (!slippage.isFinite() || slippage.isZero() || slippage.isNaN() || slippage.lte(0)) {
      if (isInverse) {
        return _1.div(price)
      }
      return price
    }
    slippageTolerance = slippage.div(100)
    if (this.tradeForm.orderSide === ORDER_SIDE.Sell) {
      priceLimit = priceLimit.times(_1.minus(slippageTolerance))
    } else {
      priceLimit = priceLimit.times(_1.plus(slippageTolerance))
    }
    if (isInverse) {
      priceLimit = _1.div(priceLimit)
    }
    return priceLimit
  }

  get convertLimitPriceWithSlippage(): string {
    if (!this.tradingPerpetualProperty) {
      return '0'
    }
    let limitPrice = toBigNumber(this.tradeForm.price)
    if (limitPrice.isNaN() || limitPrice.isZero()) {
      return '0'
    }
    limitPrice = this.convertPriceFromSlippage(limitPrice,
      toBigNumber(this.setSlippageTolerance),
      this.tradingPerpetualIsInverse)
    return limitPrice.toFixed()
  }

  get convertOrderLimitPrice(): string {
    if (!this.tradingPerpetualProperty) {
      return '0'
    }
    let limitPrice = toBigNumber(this.tradeForm.price)
    if (limitPrice.isNaN() || limitPrice.isZero()) {
      return '0'
    }
    if (this.tradingPerpetualIsInverse) {
      limitPrice = _1.div(limitPrice)
    }
    return limitPrice.toFixed()
  }

  get convertOrderTriggerPrice(): string {
    if (!this.tradingPerpetualProperty) {
      return '0'
    }
    let limitPrice = toBigNumber(this.tradeForm.triggerPrice)
    if (limitPrice.isNaN() || limitPrice.isZero()) {
      return '0'
    }
    if (this.tradingPerpetualIsInverse) {
      limitPrice = _1.div(limitPrice)
    }
    return limitPrice.toFixed()
  }

  get targetLeverage(): BigNumber | null {
    return this.tradingPerpetualID ? this.targetLeverageFunc(this.tradingPerpetualID) : null
  }

  resetForm() {
    this.tradeForm = emptyTradeParams()
  }

  async updateAccountWithPerpetual() {
    if (!this.tradingPerpetualID || this.tradingPerpetualID === '' || this.isWrongNetwork) {
      return
    }
    await this.updatePerpetual(this.tradingPerpetualID)
    await this.updateAccountStorage(this.tradingPerpetualID)
  }

  async onMarketTrade(params: BuildMarketTradeParams, pool: LiquidityPoolStorage, isClosePosition: boolean = false) {
    const tipKey = this.tradeForm.orderSide === ORDER_SIDE.Sell ? 'transaction.sell' : 'transaction.buy'
    this.tradeState = 'loading'
    try {
      // initial liquidity contract
      if (!this.tradingLiquidityPoolInfo || !this.tradingPerpetual || !this.tradingPerpetualID) {
        throw new ContractError({ message: 'trading perpetual has error', code: 0 })
      }
      if (!this.walletSigner) {
        throw new WalletError('wallet signer is null')
      }
      const liquidityContract = getLiquidityPoolContract(this.tradingLiquidityPoolInfo.liquidityPoolAddress, this.walletSigner)
      if (!liquidityContract) {
        throw new ContractError({ message: 'perpetual contract is null', code: 0 })
      }
      let gasLimit = pool.perpetuals.size * gasLimitConfig.TRADE_GAS_LIMIT_K + gasLimitConfig.TRADE_GAS_LIMIT_B
      if (isClosePosition) {
        gasLimit = pool.perpetuals.size * gasLimitConfig.TRADE_CLOSE_GAS_LIMIT_K + gasLimitConfig.TRADE_CLOSE_GAS_LIMIT_B
      }
      const gas = await getGasStationTxParams(gasLimit)
      if (!this.tradeAccountAddress || this.tradeAccountAddress === '') {
        throw new WalletError('wallet address is null')
      }
      let tradeFlag = 0
      if (params.isCloseOnly) {
        tradeFlag += TradeFlag.MASK_CLOSE_ONLY // use '+' instead of bitwise '|' because js does not support uint64 or
      }
      const leverage = this.targetLeverageFunc(this.tradingPerpetualID)
      if (leverage) {
        const leverageFlag = toBigNumber(leverage.toFormat(2)).times(100).toNumber() << 7
        tradeFlag += leverageFlag
      }
      const tradePromise = await perpetualTrade(
        liquidityContract,
        params.perpetualIndex,
        params.accountAddress,
        params.amount,
        params.limitPrice,
        Math.floor(Date.now() / 1000) + Number(params.expire),
        params.referrer,
        tradeFlag,
        gas,
      )
      const transaction = waitTransaction(tradePromise)
      this.$transaction({
        location: 'top',
        transaction: transaction,
        content: this.$t(tipKey, {
          amount: params.noticeAmount,
          symbol: params.symbol,
          price: params.noticePrice,
        }).toString(),
        transactionHash: tradePromise.hash ? tradePromise.hash : '',
      })
      const transactionResult = await transaction
      // on trade success, send google event
      this.onTradeSendGoogleEvent(
        params.amount.gte(0) ? 'long' : 'short',
        params.amount.abs(),
        new BigNumber(params.limitPrice),
      )
      VUE_EVENT_BUS.emit(ACCOUNT_EVENT.REFRESH_USER_DATA)
      this.tradeState = 'success'
      return transactionResult
    } catch (e) {
      this.tradeState = 'fail'
      let err = e
      if (this.tradeWalletConnector) {
        err = this.tradeWalletConnector.normalizeError(e)
      }
      console.error(err)
      if (params.errorCallback) {
        params.errorCallback(err)
      }
      throw e
    } finally {
      this.updateAccountWithPerpetual()
    }
  }

  async getOrderApiRequestParams(
    params: BuildOrderApiParams,
    pool: LiquidityPoolStorage,
    isClosePosition: boolean = false,
  ): Promise<OrderApiRequestParams | null> {
    this.tradeState = 'loading'
    if (!this.tradeWalletConnector || !this.tradingLiquidityPoolInfo || !this.tradingPerpetualID || !this.tradingPerpetualStorage) {
      this.tradeState = 'fail'
      throw Error('trade fail')
    }

    const liquidityPoolAddress = this.tradingLiquidityPoolInfo.liquidityPoolAddress
    const perpetualIndex = this.tradingLiquidityPoolInfo.perpetualIndex
    const signOrderInfo = await this.callRelayerServerApiReadFunc(() => {
      return getSignOrderInfo(liquidityPoolAddress, perpetualIndex)
    })

    if (!signOrderInfo) {
      if (params.relayerErrCallback) {
        params.relayerErrCallback()
      }
      this.tradeState = 'fail'
      throw Error('trade fail')
    }
    let gasLimit = pool.perpetuals.size * gasLimitConfig.TRADE_GAS_LIMIT_K + gasLimitConfig.TRADE_GAS_LIMIT_B
    if (isClosePosition) {
      gasLimit = pool.perpetuals.size * gasLimitConfig.TRADE_CLOSE_GAS_LIMIT_K + gasLimitConfig.TRADE_CLOSE_GAS_LIMIT_B
    }
    const gasPrice = await getGasStationPrice()
    if (!gasPrice) {
      throw Error('invalid gas')
    }

    const leverage = this.targetLeverageFunc(this.tradingPerpetualID)
    const orderParam: OrderApiRequestParams = {
      address: params.accountAddress.toLowerCase(),
      orderType: params.orderType,
      liquidityPoolAddress: liquidityPoolAddress.toLowerCase(),
      brokerAddress: signOrderInfo.brokerAddress.toLowerCase(),
      relayerAddress: signOrderInfo.relayerAddress.toLowerCase(),
      referrerAddress: params.referrer,
      perpetualIndex: perpetualIndex,
      price: toWad(params.limitPrice),
      amount: toWad(params.amount),
      minTradeAmount: toWad(params.minTradeAmount.toString()),
      brokerFeeLimit: Math.ceil(gasLimit * (gasPrice.toNumber() / 1e9) * 2),  // (k * x + b) * gasPrice * 2
      triggerPrice: toWad(params.triggerPrice || '0'),
      expiresAt: (Math.ceil(new Date().getTime() / 1000) + params.expire),
      isCloseOnly: params.isCloseOnly,
      chainID: Number(params.chainID),
      salt: Math.round(Math.random() * 10000000),
      version: signOrderInfo.version.toString(),
      orderHash: '', // assigned later
      r: '', // assigned later
      s: '', // assigned later
      v: '', // assigned later
      signType: SignType.EthSign, // assigned later
      targetLeverage: leverage?.toFixed() || this.tradingPerpetualStorage.defaultTargetLeverage.value.toFixed(),
    }


    const orderHash = getOrderHash(orderParam)
    let orderFlag = getOrderFlag(orderParam.orderType, orderParam.isCloseOnly, leverage?.toNumber() || this.tradingPerpetualStorage.defaultTargetLeverage.value.toNumber())
    const v3json: PerpetualV3OrderToSign = {
      trader: orderParam.address,
      broker: orderParam.brokerAddress,
      relayer: orderParam.relayerAddress,
      referrer: orderParam.referrerAddress,
      liquidityPool: orderParam.liquidityPoolAddress,
      minTradeAmount: orderParam.minTradeAmount,
      amount: orderParam.amount,
      limitPrice: orderParam.price,
      triggerPrice: orderParam.triggerPrice || '0',
      chainID: orderParam.chainID.toString(),
      expiredAt: orderParam.expiresAt.toString(),
      perpetualIndex: orderParam.perpetualIndex.toString(),
      brokerFeeLimit: orderParam.brokerFeeLimit.toString(),
      flags: orderFlag.toString(),
      salt: orderParam.salt.toString(),
    }
    orderParam.orderHash = orderHash

    const signOrderResult = await this.callChainFunc(async () => {
      if (!this.tradeWalletConnector) {
        throw new DataNotFoundError('wallet connector is null')
      }
      try {
        return await signOrder(this.tradeWalletConnector, orderHash, v3json)
      } catch (e) {
        let err = e
        if (this.tradeWalletConnector) {
          err = this.tradeWalletConnector.normalizeError(e)
        }
        console.error(err)
        if (params.signErrCallback) {
          params.signErrCallback(err)
        }
      }
      throw Error('trade fail')
    }, undefined, true)
    if (!signOrderResult) {
      this.tradeState = 'fail'
      throw Error('trade fail')
    }
    orderParam.r = signOrderResult.signature.r
    orderParam.s = signOrderResult.signature.s
    orderParam.v = signOrderResult.signature.v
    orderParam.signType = signOrderResult.signType

    // update date orderParam price and amount for backend
    orderParam.amount = fromWad(orderParam.amount)
    orderParam.price = fromWad(orderParam.price)
    orderParam.minTradeAmount = fromWad(orderParam.minTradeAmount)
    orderParam.triggerPrice = fromWad(orderParam.triggerPrice || '0')

    return orderParam
  }

  async onPlaceApiOrder(apiParams: OrderApiRequestParams, orderParams: BuildOrderApiParams) {
    this.tradeState = 'loading'
    const response = await this.callRelayerServerApiModifyingFunc(() => {
      return placeOrder(apiParams)
    })
    if (!response || response.status !== 0) { // place order failed
      if (orderParams.placeOrderErrCallback) {
        orderParams.placeOrderErrCallback()
      }
      this.tradeState = 'fail'
      throw Error('trade fail')
    }
    if (response.data) {
      // notice order created
      const orderInfo = response.data.order
      const amount = new BigNumber(orderInfo.amount)
      const params = Object.assign({}, response.data.order, {
        side: amount.gt(0) ? ORDER_SIDE.Buy : ORDER_SIDE.Sell,
        symbol: orderParams.symbol,
        pendingDelta: new BigNumber(0), // ignore param
        confirmDelta: new BigNumber(0),  // ignore param
        canceledDelta: new BigNumber(0), // ignore param
        closed: false,  // ignore params
      })
      VUE_EVENT_BUS.emit(PLACE_ORDER_EVENT.OrderCreated, params)
      // on trade success, send google event
      this.onTradeSendGoogleEvent(
        params.amount.gte(0) ? 'long' : 'short',
        params.amount.abs(),
        new BigNumber(params.limitPrice),
      )
    }
    this.tradeState = 'success'
  }

  @Watch('tradingAccountCollateralBalance', { immediate: true })
  onCollateralWalletBalanceChange() {
    this.walletBalance = this.tradingAccountCollateralBalance
  }

  @Watch('refreshPerpetualAndAccount', { immediate: true })
  onRefreshPerpetualAndAccount() {
    if (this.refreshPerpetualAndAccount && this.tradingPerpetualID && this.tradingPerpetualID !== '') {
      this.refreshTimer = window.setInterval(this.updateAccountWithPerpetual, 10000)
      return
    }
    window.clearInterval(this.refreshTimer)
  }

  @Watch('tradingPerpetualCollateralAddress', { immediate: true })
  onPerpCollateralAddressChange() {
    if (this.tradingPerpetualCollateralAddress === '') {
      return
    }
    this.updateTokenPrice([this.tradingPerpetualCollateralAddress])
  }

  // Google Analytics Events
  onTradeSendGoogleEvent(side: 'long' | 'short', amount: BigNumber, price: BigNumber) {
    // only main chain
    if (currentChainConfig.chainID !== SUPPORTED_NETWORK_ID.BSC &&
      currentChainConfig.chainID !== SUPPORTED_NETWORK_ID.ARB) {
      return
    }
    // only send certified perpetual
    if (!this.tradingPerpetual || this.tradingPerpetual.perpetualStorage.symbol >= 10000) {
      return
    }
    let val: BigNumber = new BigNumber(0)
    if (USDTokenSet.has(this.tradingPerpetualCollateralAddress.toLowerCase())) {
      val = amount.times(price)
    } else if (this.tradingPerpetual.perpetualProperty.isInverse &&
      this.tradingPerpetual.perpetualProperty.underlyingAssetSymbol === 'USD') {
      val = amount
    } else if (this.collateralTokenPrice) {
      val = amount.times(price).times(this.collateralTokenPrice)
    }
    ga('send',
      {
        hitType: 'event',
        eventCategory: 'Trade',
        eventAction: side === 'long' ? 'Long' : 'Short',
        eventLabel: 'Trade',
        eventValue: Number(val.toFixed(0))
      })
  }
}
