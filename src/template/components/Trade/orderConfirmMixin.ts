import { Component, Mixins, Prop } from 'vue-property-decorator'
import { ButtonState, DataNotFoundError, OrderConfirmParams, PerpetualProperty } from '@/type'
import { ORDER_SIDE, ORDER_TYPE } from '@/ts'
import { ALLOWANCE_AMOUNT, TRADE_DEFAULT_SLIPPAGE, SUPPORTED_NETWORK_ID } from '@/constants'
import { ErrorHandlerMixin } from '@/mixins'
import { _1, approveToken, erc20Decimals, getERC20Contract, LiquidityPoolStorage } from '@mcdex/mai3.js'
import { ethers } from 'ethers'
import { BigNumber } from 'bignumber.js'
import { namespace } from 'vuex-class'
import { waitTransaction } from '@/utils/transaction'

const wallet = namespace('wallet')
const account = namespace('account')

@Component
export default class OrderConfirmMixin extends Mixins(ErrorHandlerMixin) {
  @Prop({ required: true }) orderConfirmParams!: OrderConfirmParams
  @Prop({ default: TRADE_DEFAULT_SLIPPAGE /* 0.5% */ }) defaultSlippage!: string
  @Prop({ required: true }) slippage!: string
  @Prop({ default: false }) needApprove!: boolean
  @Prop({ required: true }) confirmFunc!: () => Promise<any>
  @Prop({ required: true }) tradeState!: ButtonState
  @Prop({ required: false, default: null }) liquidityPoolStorage!: LiquidityPoolStorage | null
  @Prop({ required: false, default: null }) perpetualProperty!: PerpetualProperty | null
  @Prop({ default: false }) isInsufficientLiquidity !: boolean
  // bind 'confirm' func, when click confirm button callback 'confirm func
  // bind 'setMaxAvailableAmount' fund, When the liquidity is not enough to set the maximum available amount
  @wallet.Getter('signer') signer!: ethers.Signer | null
  @wallet.Getter('isConnectedWallet') isConnectedWallet!: boolean
  @account.Action('updateAllowance') updateAllowance!: (params: { tokenAddress: string, spenderAddress: string, networkId?: SUPPORTED_NETWORK_ID }) => Promise<void>

  protected approveButtonState: ButtonState = ''

  get triggerPrice(): BigNumber | null {
    if (!this.orderConfirmParams.triggerPrice) {
      return null
    }
    let price = this.orderConfirmParams.triggerPrice
    if (this.orderConfirmParams.isInverse) {
      price = _1.div(price)
    }
    return price
  }

  get positionValue(): BigNumber {
    let price = this.orderConfirmParams.price
    if (this.orderConfirmParams.isInverse) {
      price = _1.div(price)
    }
    return price.times(this.orderConfirmParams.amount)
  }

  get setSlippageTolerance(): string {
    return this.slippage
  }

  set setSlippageTolerance(v: string) {
    this.$emit('update:slippage', v)
  }

  get isMarketOrder(): boolean | null {
    return this.orderConfirmParams.orderType === ORDER_TYPE.MarketOrder
  }

  get isLimitOrder(): boolean {
    return this.orderConfirmParams.orderType === ORDER_TYPE.LimitOrder
  }

  get isStopLimitOrder(): boolean {
    return this.orderConfirmParams.orderType === ORDER_TYPE.StopLimitOrder
  }

  get tradeShowCollateral(): string {
    if (this.orderConfirmParams.isInverse) {
      return this.orderConfirmParams.collateralSymbol
    }
    return this.orderConfirmParams.underlyingSymbol
  }

  get confirmButtonText(): string {
    if (this.orderConfirmParams.orderSide === ORDER_SIDE.Buy) {
      return `${this.$t('placeOrder.sideSelector.buy').toString()} ${this.tradeShowCollateral}`
    } else if (this.orderConfirmParams.orderSide === ORDER_SIDE.Sell) {
      return `${this.$t('placeOrder.sideSelector.sell').toString()} ${this.tradeShowCollateral}`
    }
    return this.$t('base.confirm').toString()
  }

  get orderSideLabel(): string {
    if (this.orderConfirmParams.orderSide === ORDER_SIDE.Buy) {
      return this.$t('orderConfirmDialog.buy').toString()
    }
    if (this.orderConfirmParams.orderSide === 'sell') {
      return this.$t('orderConfirmDialog.sell').toString()
    }
    return ''
  }

  get insufficientLiquidityWarning(): string {
    return this.$t('orderConfirmDialog.insufficientLiquidityWarning', {
      amount: this.orderConfirmParams.maxAvailableAmount?.toFixed(this.orderConfirmParams.underlyingDecimals) || 0,
      symbol: this.orderConfirmParams.underlyingSymbol
    }).toString()
  }

  get marginRatio(): BigNumber {
    // 20%
    return this.orderConfirmParams.marginRatio.times(100)
  }

  get newTotalLeverage(): BigNumber {
    return this.orderConfirmParams.newTotalLeverage
  }

  get priceImpactColor(): string {
    if (!this.orderConfirmParams.priceImpact) {
      return ''
    }
    const v = this.orderConfirmParams.priceImpact
    if (v.lte(0.1)) {
      return 'safe-color-text'
    }
    if (v.gt(0.1) && v.lte(5)) {
      return 'warning-color-text'
    }
    if (v.gt(5)) {
      return 'unsafe-color-text'
    }
    return ''
  }

  get tradeIsShowPriceImpact(): boolean {
    return !!(this.orderConfirmParams.priceImpact && this.orderConfirmParams.priceImpact.gt(5) && this.isMarketOrder)
  }

  get orderType(): string {
    if (this.isMarketOrder) {
      return this.$t('orderConfirmDialog.marketOrder').toString()
    }
    if (this.isLimitOrder) {
      return this.$t('orderConfirmDialog.limitOrder').toString()
    }
    if (this.isStopLimitOrder) {
      return this.$t('orderConfirmDialog.stopLimitOrder').toString()
    }
    return ''
  }

  get priceUnit(): string {
    return this.orderConfirmParams.priceUnit
  }

  get priceDecimals(): number {
    return this.orderConfirmParams.priceDecimals
  }

  get amountDecimals(): number {
    return this.orderConfirmParams.amountDecimals
  }

  get amountSymbol(): string {
    if (this.orderConfirmParams.isInverse) {
      return this.priceUnit
    }
    return this.orderConfirmParams.tradeSymbol
  }

  get valueSymbol(): string {
    if (this.orderConfirmParams.isInverse) {
      return this.orderConfirmParams.tradeSymbol
    }
    return this.priceUnit
  }

  get marginRatioToolTip(): string {
    return this.$t('placeOrder.marginRatioPrompt', {
      mmBalance: this.orderConfirmParams.maintenanceMargin
        ? this.orderConfirmParams.maintenanceMargin.toFixed(this.orderConfirmParams.collateralDecimals)
        : '0',
      marginBalance: this.orderConfirmParams.marginBalance
        ? this.orderConfirmParams.marginBalance.toFixed(this.orderConfirmParams.collateralDecimals)
        : '0',
      symbol: this.orderConfirmParams.collateralSymbol,
    }).toString()
  }

  confirmClosed() {
    if (this.needApprove) {
      this.toUpdateAllowance()
    }
  }

  async toUpdateAllowance() {
    if (!this.liquidityPoolStorage || !this.perpetualProperty) {
      return
    }
    await this.updateAllowance({
      tokenAddress: this.liquidityPoolStorage.collateral,
      spenderAddress: this.perpetualProperty.liquidityPoolAddress,
    })
  }

  async onApproveEvent() {
    await this.callChainFunc(async () => {
      this.approveButtonState = 'loading'
      if (!this.liquidityPoolStorage || !this.perpetualProperty) {
        this.approveButtonState = 'fail'
        return
      }
      try {
        const result = await this.approve(this.liquidityPoolStorage, this.perpetualProperty)
        if (result !== undefined) {
          this.approveButtonState = 'success'
        }
        return result
      } catch (e) {
        this.approveButtonState = 'fail'
        throw e
      }
    }, undefined, true)
  }

  async approve(
    liquidityPoolStorage: LiquidityPoolStorage,
    props: PerpetualProperty,
    onTransactionStart: () => void = () => { }
  ): Promise<ethers.providers.TransactionReceipt | undefined> {
    try {
      if (!this.signer) {
        throw new DataNotFoundError('wallet singer is null')
      }
      const erc20Contract = getERC20Contract(liquidityPoolStorage.collateral, this.signer)
      const decimals = await erc20Decimals(erc20Contract)
      const promiseInstance = await approveToken(
        erc20Contract,
        props.liquidityPoolAddress,
        new BigNumber(ALLOWANCE_AMOUNT),
        decimals
      )
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.approve', {
          amount: '∞',
          token: props.collateralTokenSymbol,
          symbol: `${props.symbolStr} ${props.name}`,
        }).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      onTransactionStart()
      return await transaction
    } catch (e) {
      console.error('approve', e)
      throw e
    }
  }

  toSetMaxTradeAmount() {
    this.$emit('setMaxAvailableAmount')
  }

  async onConfirm() {
    await this.confirmFunc()
  }
}
