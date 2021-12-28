import { Component, Mixins, Watch } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { AccountWithSelectedPerpetualMixin, TradeMixin } from '@/mixins'
import {
  AccountGasStorage,
  NOTIFICATION_KEY,
  OrderConfirmParams,
  TokenBalanceDirectoryItem,
  TransactionMiningInfo,
} from '@/type'
import { BigNumber } from 'bignumber.js'
import {
  contractPriceToUIPrice,
  fillDefaultTradeParams,
  LimitOrderTradeStrategy,
  MarketTradeStrategy,
  ORDER_SIDE,
  ORDER_TYPE,
  StopLimitOrderTradeStrategy,
} from '@/ts'
import { _0, _1, IOracleFactory } from '@mcdex/mai3.js'
import {
  formatPrice,
  getPerpetualMinTradeAmount,
  getPerpetualSlippageTolerance,
  setPerpetualMinTradeAmount,
  setPerpetualSlippageTolerance,
  toBigNumber,
} from '@/utils'
import { isNativeToken } from '@/utils/chain'
import { currentChainConfig } from '@/config/chain'
import { BTCTokenSet, ETHTokenSet, USDTokenSet } from '@/config/tokens'
import _ from 'lodash'
import { GLOBAL_NOTIFICATION_EVENT, PLACE_ORDER_EVENT, VUE_EVENT_BUS } from '@/event'
import { SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID, TRADE_DEFAULT_SLIPPAGE } from '@/constants'
import { queryTransactionMiningInfo } from '@/api/mining'
import { SATORIOracleConfigs } from '@/config/oracle'

const wallet = namespace('wallet')
const account = namespace('account')

@Component
export default class OrderTradeMixin extends Mixins(TradeMixin, AccountWithSelectedPerpetualMixin) {
  @account.Getter('accountGasStorage') accountGasStorage!: AccountGasStorage | null
  @account.Getter('tokenBalanceFunc') tokenBalanceFunc!: (tokenAddress: string) => TokenBalanceDirectoryItem | null
  @account.Action('updateTokenBalance') updateTokenBalance!: (params: { tokenAddress: string }) => Promise<void>
  @wallet.Getter('availableNativeTokenBalance') availableNativeTokenBalance!: BigNumber | null
  @wallet.Getter('isConnectedWallet') isConnectedWallet!: boolean
  @wallet.Getter('isWrongNetwork') isWrongNetwork!: boolean
  @account.Getter('allowanceFunc') allowanceFunc!: (tokenAddress: string, spender: string) => BigNumber
  @account.Action('updateAllowance') updateAllowance!: (params: { tokenAddress: string, spenderAddress: string, networkId?: SUPPORTED_NETWORK_ID }) => Promise<void>

  protected fixedParam: 'amount' | 'value' = 'amount' // the UI can set { price + amount } or { price + value }
  protected orderType: ORDER_TYPE = ORDER_TYPE.MarketOrder
  protected loadDefaultSettingSucceeded: boolean = false
  protected transactionMiningInfo: TransactionMiningInfo | null = null
  protected mcbPrice: BigNumber = _0
  protected transactionMiningTimer = 0

  get allowance(): BigNumber | null {
    if (!this.allowanceFunc || !this.tradingLiquidityPool || !this.tradingLiquidityPool) {
      return null
    }
    return this.allowanceFunc(
      this.tradingLiquidityPool.liquidityPoolStorage.collateral,
      this.tradingLiquidityPool.liquidityPoolAddress,
    )
  }

  get needApproved(): boolean {
    if (!this.afterTradingCost || !this.allowance) {
      return false
    }
    return this.allowance.lte(this.afterTradingCost)
  }

  get orderSide(): ORDER_SIDE {
    return this.tradeForm.orderSide
  }

  get isMarketOrderType(): boolean {
    return this.orderType && this.orderType === ORDER_TYPE.MarketOrder
  }

  get isLimitOrderType(): boolean {
    return this.orderType && this.orderType === ORDER_TYPE.LimitOrder
  }

  get isStopOrderType(): boolean {
    return this.orderType && this.orderType === ORDER_TYPE.StopLimitOrder
  }

  get available(): BigNumber | null {
    return this.orderAvailable
  }

  get priceLabelName(): string {
    return this.orderType === ORDER_TYPE.MarketOrder
      ? this.$t('base.AMMPrice').toString()
      : this.$t('base.limitPrice').toString()
  }

  get afterTradingFee(): BigNumber | null {
    if (!this.afterTradingResult) return null
    return this.afterTradingResult.fee
  }

  get maxFeeRebateSATORI(): BigNumber | null {
    return this.transactionMiningInfo ? toBigNumber(this.transactionMiningInfo.budget).minus(this.transactionMiningInfo.minedBudget) : null
  }

  get feeRebate(): BigNumber | null {
    if (!this.supportTransactionMining || !this.afterTradingFee) return null
    return this.afterTradingFee.times(this.transactionMiningInfo!.rebateRate)
  }

  get feeRebateSATORI(): BigNumber | null {
    const result = this.feeRebate && this.mcbPrice.gt(0) && this.maxFeeRebateSATORI ? BigNumber.min(this.feeRebate.div(this.mcbPrice), this.maxFeeRebateSATORI) : null
    return result?.isZero() ? null : result
  }

  get afterTradingCost(): BigNumber | null {
    if (!this.afterTradingResult) return null
    return this.afterTradingResult.cost
  }

  get afterTraderIsSafe(): boolean {
    if (!this.afterTradingResult) {
      return true
    }
    return this.afterTradingResult.tradeIsSafe
  }

  get tradeFeeRate(): BigNumber | null {
    if (!this.tradingPerpetualStorage || !this.tradingLiquidityPoolStorage) {
      return null
    }
    return this.tradingLiquidityPoolStorage.vaultFeeRate
      .plus(this.tradingPerpetualStorage.lpFeeRate)
      .plus(this.tradingPerpetualStorage.operatorFeeRate)
  }

  get needAuth(): boolean {
    return !this.isMarketOrderType && !this.jwtIsValidateFunc()
  }

  computeAmountByValue() {
    this.fixedParam = 'value'
    try {
      const strategyResult = this.tradeStrategy.getAmountByValue(this.tradeStrategyContext)
      if (strategyResult) {
        if (strategyResult.newPrice) {
          this.tradeForm.price = strategyResult.newPrice.toFixed(this.priceFormatDecimals, this.priceFormatRound)
        }
        this.tradeForm.amount = strategyResult.newAmount.toFixed(this.underlyingFormatDecimals, BigNumber.ROUND_DOWN)
      }
    } catch (e) {
      // amm compute has err
      console.warn('onValueChanged', e)
    }
    if (this.valueIsInvalid) {
      this.tradeForm.amount = ''
      this.tradeForm.amountProportion = 0
    }
  }

  computeValueByAmount() {
    if (!this.tradingPerpetualProperty) {
      return
    }
    this.fixedParam = 'amount'
    try {
      const strategyResult = this.tradeStrategy.getValueByAmount(this.tradeStrategyContext)
      if (strategyResult) {
        if (strategyResult.newPrice) {
          this.tradeForm.price = strategyResult.newPrice.toFixed(this.priceFormatDecimals, this.priceFormatRound)
        }
        this.tradeForm.value = strategyResult.newValue.toFixed(this.collateralFormatDecimals)
      }
    } catch (e) {
      // amm compute has err
      console.warn('onAmountChanged', e)
    }
    if (this.amountIsInvalid) {
      this.tradeForm.value = ''
      this.tradeForm.amountProportion = 0
    }
  }

  get slippageTolerance(): string {
    return this.setSlippageTolerance
  }

  set slippageTolerance(val: string) {
    this.setSlippageTolerance = val
    const slippage = Number(val)
    if (isNaN(slippage) || slippage < 0 || val === '') {
      return
    }
    setPerpetualSlippageTolerance(this.tradingPerpetualID || '', Number(val) > 100 ? TRADE_DEFAULT_SLIPPAGE : val)
  }

  get minTradeAmount(): string {
    return this.tradeForm.minTradeAmount
  }

  set minTradeAmount(val: string) {
    this.tradeForm.minTradeAmount = val
    const amount = Number(val)
    if (isNaN(amount) || amount < 0 || val === '') {
      return
    }
    setPerpetualMinTradeAmount(this.tradingPerpetualID || '', val)
  }

  get amountIsInvalid(): boolean {
    const amount = Number(this.tradeForm.amount)
    return isNaN(amount) || amount <= 0 || this.tradeForm.amount === ''
  }

  get valueIsInvalid(): boolean {
    const value = Number(this.tradeForm.value)
    return isNaN(value) || value <= 0 || this.tradeForm.value === ''
  }

  get priceIsInvalid(): boolean {
    const price = Number(this.tradeForm.price)
    return isNaN(price) || price <= 0 || this.tradeForm.price === ''
  }

  get triggerPriceIsInvalid(): boolean {
    const triggerPrice = Number(this.tradeForm.triggerPrice)
    return isNaN(triggerPrice) || triggerPrice <= 0 || this.tradeForm.triggerPrice === ''
  }

  get slippageIsInvalid(): boolean {
    const slippage = Number(this.slippageTolerance)
    return isNaN(slippage) || slippage < 0 || this.slippageTolerance === ''
  }

  get marketExpireIsInvalid(): boolean {
    const expire = Number(this.marketExpire)
    return isNaN(expire) || expire <= 0 || this.marketExpire === ''
  }

  get orderExpireIsInvalid(): boolean {
    const expire = Number(this.orderExpire)
    return isNaN(expire) || expire <= 0 || this.orderExpire === ''
  }

  get minTradeAmountIsInvalid(): boolean {
    const amount = Number(this.minTradeAmount)
    return isNaN(amount) || amount < 0 || this.minTradeAmount === ''
  }

  get formParamsIsValid(): boolean {
    if (!this.priceIsInvalid && !this.amountIsInvalid && !this.valueIsInvalid) {
      if (this.orderType === ORDER_TYPE.MarketOrder && !this.marketExpireIsInvalid && !this.slippageIsInvalid) {
        return true
      }
      if (this.orderType === ORDER_TYPE.LimitOrder && !this.orderExpireIsInvalid && !this.minTradeAmountIsInvalid) {
        return true
      }
      if (
        this.orderType === ORDER_TYPE.StopLimitOrder &&
        !this.orderExpireIsInvalid &&
        !this.triggerPriceIsInvalid &&
        !this.minTradeAmountIsInvalid
      ) {
        return true
      }
    }
    return false
  }

  get orderExpireSecond(): number {
    if (!this.orderExpireIsInvalid) {
      const expire = Number(this.orderExpire)
      return expire * 86400 // day to second
    }
    return 0
  }

  get closePositionRatio(): number {
    // example: 30%
    const amount = toBigNumber(this.tradeForm.amount)
    if (amount.isNaN() || amount.lte(0) || this.tradeForm.amount === '') {
      return 0
    }
    if (!this.position || this.position.isZero()) {
      return 0
    }
    if (this.position.abs().gte(amount)) {
      return Number(
        amount
          .div(this.position.abs())
          .times(100)
          .toFixed(0),
      )
    }
    return 100
  }

  get afterTradingMarginRatio(): BigNumber | null {
    if ((this.isLimitOrderType || this.isStopOrderType) && this.needAuth) {
      return null
    }
    // show current margin ratio
    if ((this.amountIsInvalid || this.valueIsInvalid) && this.tradingAccountDetails) {
      return this.tradingAccountDetails.accountComputed.marginRatio
    }

    // show new margin ratio
    if (!this.afterTrading || !this.afterTradingResult) {
      return null
    }
    return this.afterTrading.accountComputed.marginRatio
  }

  get afterTradingLeverage(): BigNumber | null {
    if ((this.isLimitOrderType || this.isStopOrderType) && this.needAuth) {
      return null
    }
    // show current margin ratio
    if ((this.amountIsInvalid || this.valueIsInvalid) && this.tradingAccountDetails) {
      return this.tradingAccountDetails.accountComputed.leverage
    }

    // show new margin ratio
    if (!this.afterTrading || !this.afterTradingResult) {
      return null
    }
    return this.afterTrading.accountComputed.leverage
  }

  get newLiquidationPrice(): BigNumber | null {
    if (!this.afterTrading && this.tradingAccountDetails) {
      return contractPriceToUIPrice(
        this.tradeStrategyContext,
        this.tradingAccountDetails.accountComputed.liquidationPrice,
      )
    }
    if (!this.afterTrading) {
      return null
    }
    const p = this.afterTrading.accountComputed.liquidationPrice
    const result = contractPriceToUIPrice(this.tradeStrategyContext, p)
    return result.isFinite() ? result : _0
  }

  get tradePanelIsNormalStatus(): boolean {
    return this.isConnectedWallet && !this.isWrongNetwork
  }

  get position(): BigNumber {
    if (!this.tradingAccountDetails) {
      return _0
    }
    let positionAmount = this.tradingAccountDetails.accountStorage.positionAmount
    if (this.tradingPerpetualIsInverse) {
      return positionAmount.negated()
    }
    return positionAmount
  }

  get currentSideHasClosePosition(): boolean {
    return (
      (this.tradeForm.orderSide === ORDER_SIDE.Buy && this.position.lt(0)) ||
      (this.tradeForm.orderSide === ORDER_SIDE.Sell && this.position.gt(0))
    )
  }

  get tradingPerpetualMarkPrice() {
    return this.tradingPerpetualStorage?.markPrice || null
  }

  // example:
  // decimals: 2   return: 0.01
  // decimals: 6   return: 0.000001
  // control slider
  get inputMinTradeAmountByAmountDecimals(): number {
    if (this.tradingPerpetualProperty) {
      const underlyingAssetFormatDecimals = this.tradingPerpetualProperty.underlyingAssetFormatDecimals
      return _1.shiftedBy(-underlyingAssetFormatDecimals).toNumber()
    }
    return 0
  }

  get inputMarketPrice(): BigNumber | null {
    if (!this.tradingPerpetualMarkPrice) {
      return null
    }
    return formatPrice(this.tradingPerpetualMarkPrice, this.tradingPerpetualIsInverse)
  }

  get nativeToken() {
    return currentChainConfig || null
  }

  get priceUnit() {
    return this.tradingPerpetualProperty?.priceSymbol || ''
  }

  get remainingOrderGasBalance(): BigNumber | null {
    return this.accountGasStorage?.balance || null
  }

  get underlyingAssetSymbol(): string {
    if (!this.tradingPerpetualProperty) {
      return ''
    }
    return this.tradingPerpetualProperty.underlyingAssetSymbol
  }

  get collateralTokenSymbol(): string {
    if (!this.tradingPerpetualProperty) {
      return ''
    }
    return this.tradingPerpetualProperty.collateralTokenSymbol
  }

  get collateralTokenBaseSymbol(): string {
    if (!this.tradingPerpetualProperty) {
      return ''
    }
    return this.tradingPerpetualProperty.collateralTokenBaseSymbol
  }


  get fullPerpetualName(): string {
    if (!this.tradingPerpetualProperty) {
      return ''
    }
    return `${this.tradingPerpetualProperty.symbolStr} ${this.tradingPerpetualProperty.name}`
  }

  get priceFormatDecimals() {
    return this.tradingPerpetualProperty?.priceFormatDecimals || 0
  }

  get collateralFormatDecimals() {
    return this.tradingPerpetualProperty?.collateralFormatDecimals || 0
  }

  get underlyingFormatDecimals() {
    return this.tradingPerpetualProperty?.underlyingAssetFormatDecimals || 0
  }

  get tokenBalanceInfo(): TokenBalanceDirectoryItem | null {
    if (!this.tokenBalanceFunc || !this.tradingLiquidityPool) {
      return null
    }
    return this.tokenBalanceFunc(this.tradingLiquidityPool.liquidityPoolStorage.collateral)
  }

  get isNativeToken() {
    if (!this.tradingLiquidityPool) {
      return false
    }
    return isNativeToken(this.tradingLiquidityPool.liquidityPoolStorage.collateral)
  }

  get walletCollateralBalance(): BigNumber | null {
    if (!this.collateralFormatDecimals) {
      return null
    }
    const erc20Balance = this.tokenBalanceInfo?.balance
    return erc20Balance?.dp(this.collateralFormatDecimals, BigNumber.ROUND_DOWN) || null
  }

  get marginRatioToolTip(): string {
    return this.$t('placeOrder.marginRatioPrompt', {
      mmBalance: this.afterTradingMaintenanceMargin
        ? this.afterTradingMaintenanceMargin.toFixed(this.collateralFormatDecimals)
        : '0',
      marginBalance: this.afterTradingMarginBalance
        ? this.afterTradingMarginBalance.toFixed(this.collateralFormatDecimals)
        : '0',
      symbol: this.collateralTokenSymbol,
    }).toString()
  }

  get priceImpactColor(): string {
    if (!this.tradePriceImpact) {
      return ''
    }
    if (this.tradePriceImpact.lte(0.1)) {
      return 'safe-color-text'
    }
    if (this.tradePriceImpact.gt(0.1) && this.tradePriceImpact.lte(5)) {
      return 'warning-color-text'
    }
    if (this.tradePriceImpact.gt(5)) {
      return 'unsafe-color-text'
    }
    return ''
  }

  // validate start
  // input value change, validate input value skip, e: not connected Wallet
  get isSkipValidation(): boolean {
    return !this.isConnectedWallet
  }

  get tradeShowCollateral(): string {
    if (!this.tradingPerpetualProperty) {
      return ''
    }
    if (this.tradingPerpetualIsInverse) {
      return this.collateralTokenSymbol
    } else {
      return this.underlyingAssetSymbol
    }
  }

  get orderConfirmParams(): OrderConfirmParams {
    let orderConfirmParams: OrderConfirmParams = {
      orderType: this.orderType,
      orderSide: this.orderSide,
      tradeSymbol: this.tradeShowCollateral,
      priceUnit: this.priceUnit,
      price: toBigNumber(this.tradeForm.price),
      priceImpact: this.tradePriceImpact,
      priceDecimals: this.priceFormatDecimals,
      amount: toBigNumber(this.tradeForm.amount),
      amountDecimals: this.underlyingFormatDecimals,
      marginRatio: this.afterTradingMarginRatio ? this.afterTradingMarginRatio : _0,
      newTotalLeverage: this.afterTradingLeverage ? this.afterTradingLeverage : _0,
      liqPrice: this.newLiquidationPrice || _0,
      isInverse: this.tradingPerpetualIsInverse,
      isClosePosition: this.isClosePosition,
      closePositionPnl: this.closePositionPnl,
      collateralSymbol: this.collateralTokenSymbol,
      underlyingSymbol: this.underlyingAssetSymbol,
      collateralDecimals: this.collateralFormatDecimals,
      underlyingDecimals: this.underlyingFormatDecimals,
      maintenanceMargin: this.afterTradingMaintenanceMargin,
      marginBalance: this.afterTradingMarginBalance,
      maxAvailableAmount: this.maxAvailableAmount,
    }
    if (this.orderType === ORDER_TYPE.MarketOrder) {
      return orderConfirmParams
    }
    if (this.orderType === ORDER_TYPE.LimitOrder) {
      return orderConfirmParams
    }
    if (this.orderType === ORDER_TYPE.StopLimitOrder) {
      orderConfirmParams.triggerPrice = toBigNumber(this.convertOrderTriggerPrice)
      return orderConfirmParams
    }
    return orderConfirmParams
  }

  get noticeLimitPrice(): string {
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
    return limitPrice.toFixed(this.collateralFormatDecimals)
  }

  get supportTransactionMining() {
    return !!(
      this.transactionMiningInfo
      && this.tradingLiquidityPoolInfo
      && this.transactionMiningInfo.pools.includes(this.tradingLiquidityPoolInfo.liquidityPoolAddress.toLowerCase())
    )
  }

  updateAccountDataFunc = _.debounce(this.updateAccountData, 200)

  mounted() {
    this.loadTransactionMiningData()
    this.transactionMiningTimer = window.setInterval(this.loadTransactionMiningData, 30000)
  }

  destroyed() {
    window.clearInterval(this.transactionMiningTimer)
  }

  loadDefaultMinTradeAmount() {
    let amount = getPerpetualMinTradeAmount(this.tradingPerpetualID || '')
    if (amount !== -1) {
      this.defaultMinTradeAmount = amount.toString()
      this.tradeForm.minTradeAmount = amount.toString()
      return
    }
    if (!this.tradingPerpetual) {
      this.defaultMinTradeAmount = '1'
      this.tradeForm.minTradeAmount = '1'
      return
    }
    const collateral = this.tradingPerpetual.liquidityPoolStorage.collateral.toLowerCase()
    const indexPrice = this.tradingPerpetual.perpetualStorage.indexPrice
    const isEthToken = isNativeToken(collateral) || ETHTokenSet.has(collateral)
    if (isEthToken) {
      this.defaultMinTradeAmount = '0.1'
      this.tradeForm.minTradeAmount = '0.1'
      return
    }
    if (BTCTokenSet.has(collateral)) {
      this.defaultMinTradeAmount = '0.01'
      this.tradeForm.minTradeAmount = '0.01'
      return
    }
    if (USDTokenSet.has(collateral)) {
      const minValue = 100 // $100
      const amount = toBigNumber(minValue)
        .div(indexPrice)
        .toFixed(this.underlyingFormatDecimals)
      this.defaultMinTradeAmount = amount
      this.tradeForm.minTradeAmount = amount
      return
    }
    this.defaultMinTradeAmount = '1'
    this.tradeForm.minTradeAmount = '1'
  }

  loadDefaultSlippageTolerance() {
    const v = getPerpetualSlippageTolerance(this.tradingPerpetualID || '')
    this.defaultSlippageTolerance = v
    this.setSlippageTolerance = v
  }

  async updateAccountData() {
    if (
      !this.selectedPerpetualID ||
      !this.tradeAccountAddress ||
      !this.tradingLiquidityPool ||
      !this.tradingPerpetualProperty
    ) {
      return
    }
    try {
      await Promise.all([
        this.updateTokenBalance({ tokenAddress: this.tradingLiquidityPool.liquidityPoolStorage.collateral }),
        this.updateAllowance({
          tokenAddress: this.tradingLiquidityPool.liquidityPoolStorage.collateral,
          spenderAddress: this.tradingPerpetualProperty.liquidityPoolAddress,
        }),
      ])
    } catch (e) {
      console.warn(e)
    }
  }

  @Watch('ordersDetailsHasNull', { immediate: true })
  onOrdersDetailsHasNullChanged() {
    if (
      this.ordersDetailsHasNull &&
      (this.orderType === ORDER_TYPE.StopLimitOrder || this.orderType === ORDER_TYPE.LimitOrder) &&
      !this.needAuth
    ) {
      VUE_EVENT_BUS.emit(PLACE_ORDER_EVENT.LoadAccountOrderDetails)
    }
  }

  @Watch('tradingPerpetualIsMarketClosed', { immediate: true })
  onTradingPerpetualIsMarketClosedChanged(v: boolean) {
    if (v) {
      VUE_EVENT_BUS.emit(GLOBAL_NOTIFICATION_EVENT.SHOW, {
        type: 'warn',
        key: NOTIFICATION_KEY.MarketClosedInfo,
        i18nKey: 'globalNotification.marketClosedPrompt',
      })
    } else {
      VUE_EVENT_BUS.emit(GLOBAL_NOTIFICATION_EVENT.HIDE, 'warn', NOTIFICATION_KEY.MarketClosedInfo)
    }
  }

  @Watch('tradingAccountDetails', { immediate: true })
  onTradeAccountDetailsChanged() {
    fillDefaultTradeParams(this.tradeStrategyContext)
  }

  @Watch('tradingPerpetual', { immediate: true })
  onChangedUpdateDefaultMinTradeAmount() {
    if (!this.tradingPerpetual || this.loadDefaultSettingSucceeded) {
      return
    }
    this.updateAccountDataFunc()
    this.loadDefaultMinTradeAmount()
    this.loadDefaultSlippageTolerance()
    this.loadDefaultSettingSucceeded = true
  }

  @Watch('orderType', { immediate: true })
  onOrderTypeChangeInitialTradeObject() {
    if (this.orderType === ORDER_TYPE.MarketOrder) {
      this.tradeStrategy = new MarketTradeStrategy()
    } else if (this.orderType === ORDER_TYPE.LimitOrder) {
      this.tradeStrategy = new LimitOrderTradeStrategy()
    } else if (this.orderType === ORDER_TYPE.StopLimitOrder) {
      this.tradeStrategy = new StopLimitOrderTradeStrategy()
    }
    this.tradeState = ''
  }

  loadTransactionMiningData() {
    this.loadTransactionMiningInfo()
    this.loadSATORITWAPPrice()
  }

  async loadTransactionMiningInfo() {
    if (TARGET_NETWORK_ID !== SUPPORTED_NETWORK_ID.ARB) {
      return
    }
    await this.callGraphApiFunc(async () => {
      const data = await queryTransactionMiningInfo(currentChainConfig.subgraphConfig.transactionMiningSubgraph)
      this.transactionMiningInfo = data.miningInfo
    })
  }

  async loadSATORITWAPPrice() {
    const mcbOracleAddress = SATORIOracleConfigs[TARGET_NETWORK_ID]
    if (!mcbOracleAddress) {
      return
    }
    await this.callChainReadFunc(async () => {
      const mcbOracle = IOracleFactory.connect(mcbOracleAddress, this.provider)
      const price = await mcbOracle.callStatic.priceTWAPLong()
      this.mcbPrice = new BigNumber(price.newPrice.toString()).shiftedBy(-18)
    })
  }
}
