<template>
  <div ref="orderTrade">
    <div class="skeleton-container" v-if="!isInitialSuccessful">
      <van-skeleton title :row="6"/>
      <van-skeleton title :row="4"/>
    </div>
    <McLoading :show-loading="isInitialSuccessful && tradePanelIsLoading" :delay="500" :margin="8">
      <div class="order-trade" v-show="isInitialSuccessful">
        <!-- select order side -->
        <McMRadioBevelTabs :class="[activeOrderSide]" v-model="activeOrderSide" :options="orderSideOptions"/>
        <!-- select order type -->
        <div class="line-item">
          <McMPopupSelector v-model="activeOrderType" :options="orderTypeOptions"/>
        </div>
        <!-- available -->
        <div class="line-item just-line" v-show="!isMarketOrderType">
          <McMTooltip :content="$t('placeOrder.availablePrompt')">
            <div>{{ $t('base.available') }}</div>
          </McMTooltip>
          <div>
            <span class="value" v-if="available">
              {{ available | bigNumberFormatter(collateralFormatDecimals) }} {{ collateralTokenSymbol }}</span>
            <span v-else>--</span>
          </div>
        </div>
        <van-form ref="orderTradeForm">
          <!-- input triggerPrice -->
          <div class="line-item" v-show="isStopOrderType">
            <McMNumberField
              v-model="tradeForm.triggerPrice"
              :rules="tradeFormRules.triggerPrice"
              :placeholder="$t('base.triggerPrice')"
              name="triggerPrice"
            >
              <span slot="right-icon">{{ priceUnit }}</span>
            </McMNumberField>
          </div>
          <!-- input price -->
          <div class="line-item">
            <McMNumberField
              v-model="price"
              :rules="tradeFormRules.price"
              :disabled="isMarketOrderType"
              :placeholder="priceLabelName"
              name="price"
            >
              <span slot="right-icon">{{ priceUnit }}</span>
            </McMNumberField>
          </div>
          <!-- input amount and value -->
          <div class="line-item just-input">
            <div class="input-item">
              <div class="label">{{ underlyingAssetSymbol }}</div>
              <McMNumberField
                v-model="amount"
                :rules="tradeFormRules.amountValue"
                :placeholder="$t('base.amount')"
                name="amountValue"
              >
              </McMNumberField>
            </div>
            <div class="input-join">≈</div>
            <div class="input-item">
              <div class="label">{{ collateralTokenSymbol }}</div>
              <McMNumberField
                v-model="value"
                :rules="tradeFormRules.amountValue"
                :placeholder="$t('base.amount')"
                name="amountValue"
              >
              </McMNumberField>
            </div>
          </div>
          <!-- amount proportion slider -->
          <div class="line-item slider-item">
            <McMSimpleSlider
              :value="amountProportion"
              :marks="[0, 25, 50, 75, 100]"
              @input="setAmountProportion"
              :step="1"
              :max="100"
              :tooltip-unit="'%'"
            />
          </div>
        </van-form>
        <!-- insufficient liquidity -->
        <div v-if="hasInsufficientLiquidityError && isConnectedWallet" class="text-item option-warning-panel">
          {{ $t('placeOrder.tradePanel.insufficientLiquidityWarning') }}
          <span class="click-value" @click="onInsufficientLiquiditySetMaxAmount">
            {{ maxAvailableAmount | bigNumberFormatter(underlyingFormatDecimals, 1 /* ROUND_DOWN */) }}
            {{ underlyingAssetSymbol }}
          </span>
        </div>
        <!-- close only -->
        <div class="line-item close-only-line" v-if="isShowCloseOnlyCheckBox">
          <!-- close only checkbox -->
          <div class="left">
            <van-checkbox v-model="closeOnly" class="mc-mobile__checkbox">
              {{ $t('placeOrder.tradePanel.closeOnly') }}
              <template #icon="props">
                <div class="selected box" v-if="props.checked">
                  <i class="iconfont icon-select"></i>
                </div>
                <div class="un-selected box" v-else></div>
              </template>
            </van-checkbox>
          </div>
          <div class="dividing-line" v-if="closeOnly"><span></span></div>
          <!-- close position ratio -->
          <div class="right" v-if="closeOnly">
            <div>{{ $t('placeOrder.tradePanel.closePosition') }}</div>
            <div class="value">{{ closePositionRatio }}%</div>
          </div>
        </div>
        <!-- trade confirm button -->
        <div class="line-item">
          <McMStateButton
            :button-class="[confirmButtonClassType, 'medium', 'round__medium']"
            :state.sync="tradeState"
            @click="confirmTradeButtonEvent"
            :disabled="isWrongNetwork || orderConfirmButtonIsDisabled"
          >
            <span v-if="tradeIsShowPriceImpact && $i18n.locale === 'zh-CN'">
              {{ $t('base.anyway') }}
            </span>
            {{ confirmButtonText }}
            <span v-if="isConnectedWallet && !needAuth">
              {{ tradeShowCollateral }}
            </span>
            <span v-if="tradeIsShowPriceImpact && $i18n.locale !== 'zh-CN'">
              {{ $t('base.anyway') }}
            </span>
          </McMStateButton>
        </div>
        <div class="info-panel">
          <!-- cost -->
          <div class="just-text-line">
            <div>
              <McMTooltip :content="$t('placeOrder.costPrompt')">
                <div>{{ $t('base.cost') }}</div>
              </McMTooltip>
            </div>
            <div class="value">
              <span v-if="afterTradingCost && isShowCostText">
                {{ afterTradingCost | bigNumberFormatter(collateralFormatDecimals) }}
              </span>
              {{ collateralTokenSymbol }}
            </div>
          </div>
          <!-- price impact -->
          <div class="just-text-line" v-if="isShowPriceImpact">
            <div>
              <McMTooltip :content="$t('placeOrder.pricePrompt')">
                {{ $t('base.priceImpact') }}
              </McMTooltip>
            </div>
            <div class="value">
              <span v-if="tradePriceImpact && !amountIsInvalid" :class="[priceImpactColor]">
                {{ tradePriceImpact | bigNumberFormatter(2) }}%
              </span>
              <span v-else>--</span>
            </div>
          </div>
          <!-- trade fee -->
          <div class="just-text-line">
            <div>{{ $t('base.fee') }}</div>
            <div class="value">
              <span v-if="afterTradingFee && isShowFeeText">
                {{ afterTradingFee | bigNumberFormatterByPrecision(2) }}
              </span>
              <span v-if="tradeFeeRate">({{ tradeFeeRate.times(100) | bigNumberFormatterByPrecision(2) }}%)</span>
            </div>
          </div>

          <!-- fee rebate -->
          <div class="just-text-line fee-rebate" v-if="isShowFeeRebate">
            <McMTooltip>
              {{ $t('base.feeRebate') }}
              <template #content>
                <span class="fee-rebate-prompt"
                      v-html="$t('placeOrder.feeRebatePrompt', {rebateRate: transactionMiningInfo ? transactionMiningInfo.rebateRate.times(100) : '?'})"></span>
              </template>
            </McMTooltip>
            <div class="value">
              <span>{{ feeRebateSATORI | bigNumberFormatterByPrecision(2) }} SATORI </span>
              <span>(${{ feeRebate | bigNumberFormatterByPrecision(2) }})</span>
            </div>
          </div>
        </div>
        <div class="line-item icon-click-group">
          <!-- setting icon click -->
          <div class="icon-click-item" @click="showAdvancedPopup = !showAdvancedPopup">
            <i class="iconfont icon-settings"></i>
            <span class="label">{{ $t('base.setting') }}</span>
          </div>
          <div class="vertical-item" v-if="!isMarketOrderType && isConnectedWallet">
            <span class="vertical-line"></span>
          </div>
          <!-- deposit broker gas icon click -->
          <div
            class="icon-click-item"
            v-if="!isMarketOrderType && isConnectedWallet"
            @click="showBrokerGasDepositPopup = !showBrokerGasDepositPopup"
          >
            <i class="iconfont icon-ring"></i>
            <span class="label">{{ $t('base.brokerGas') }}</span>
          </div>
        </div>

        <!-- popups container -->
        <div class="popups">
          <!-- advanced setting -->
          <van-popup
            v-model="showAdvancedPopup"
            closeable
            position="bottom"
            round
            class="safe-area-inset-bottom"
            safe-area-inset-bottom
            ref="advancedSettingFixedDom"
          >
            <div class="popup-header" v-if="isMarketOrderType">
              {{ $t('placeOrder.tradePanel.marketAdvancedSettings') }}
            </div>
            <div class="popup-header" v-else>{{ $t('placeOrder.tradePanel.limitAdvancedSettings') }}</div>
            <div class="popup-container">
              <!-- market advanced  -->
              <div v-show="isMarketOrderType">
                <!-- slippage tolerance -->
                <div class="popup-line slippage">
                  <div class="label-line">{{ $t('base.slippageTolerance') }} (%)</div>
                  <McMInputRadio
                    v-model="slippageTolerance"
                    :default-val="defaultSlippageTolerance"
                    :items="['0.1', '0.2', '0.5', '1']"
                    :fixed-dom="advancedSettingFixedDom"
                    :validate-messages="slippageToleranceErrors"
                    :suffix="'%'"
                    ref="slippageToleranceRef"
                  />
                </div>
              </div>
              <!-- limit and stop order advanced setting -->
              <div v-show="isStopOrderType || isLimitOrderType">
                <!-- order expire -->
                <div class="popup-line">
                  <div class="label-line">{{ $t('base.expire') }}</div>
                  <McMInputRadio
                    v-model="orderExpire"
                    :fixed-dom="advancedSettingFixedDom"
                    :items="['7', '30', '90']"
                    :validate-messages="orderExpireErrors"
                    :suffix="'D'"
                  />
                </div>
                <!-- min trade amount -->
                <div class="popup-line">
                  <div class="label-line">
                    {{ $t('placeOrder.tradePanel.minTradeAmount') }}
                  </div>
                  <McMInputRadio
                    v-if="showMinTradeAmount"
                    v-model="minTradeAmount"
                    :items="defaultMinTradeAmount === '' ? [] : [defaultMinTradeAmount]"
                    :fixed-dom="advancedSettingFixedDom"
                    :default-val="defaultMinTradeAmount"
                    :validate-messages="minTradeAmountErrors"
                    ref="minTradeAmountRef"
                    :suffix="` ${underlyingAssetSymbol}`"
                  />
                </div>
              </div>
              <!-- safe max -->
              <div class="popup-line">
                <div class="label-line">{{ $t('placeOrder.tradePanel.safeMax') }}</div>
                <McMInputRadio
                  v-model="safeMax"
                  :fixed-dom="advancedSettingFixedDom"
                  default-val="95"
                  :items="['90', '95', '99']"
                  :validate-messages="safeMaxErrors"
                  :suffix="'%'"
                />
              </div>
            </div>
          </van-popup>
        </div>
      </div>
    </McLoading>
    <BrokerGasPopup :visible.sync="showBrokerGasDepositPopup"/>
    <OrderConfirmPopup
      :visible.sync="showOrderConfirmPopup"
      :order-confirm-params="orderConfirmParams"
      :need-approve="needApproved"
      :liquidity-pool-storage="tradingLiquidityPoolStorage"
      :perpetual-property="tradingPerpetualProperty"
      :confirm-func="tradeConfirmEvent"
      :trade-state.sync="tradeState"
      :slippage.sync="setSlippageTolerance"
      :default-slippage="defaultSlippageTolerance"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Ref, Watch } from 'vue-property-decorator'
import {
  McMStateButton,
  McMPopupSelector,
  McMInputRadio,
  McMNumberField,
  McMSimpleSlider,
  McMTooltip,
  McMRadioBevelTabs,
} from '@/mobile/components'
import { ORDER_SIDE, ORDER_TYPE } from '@/ts'
import BrokerGasPopup from '../BrokerGasPopup.vue'
import OrderConfirmPopup from '../OrderConfirmPopup.vue'
import AsyncComputed from '@romancow/vue-async-computed-decorator'
import { BuildMarketTradeParams, BuildOrderApiParams } from '@/mixins'
import OrderTradeMixin from '@/template/components/Trade/orderTradeMixin'
import { ACCOUNT_EVENT, AUTH_EVENT, PLACE_ORDER_EVENT, VUE_EVENT_BUS } from '@/event'
import { COMMON_EVENT } from '@/mobile/event'
import { getReferralAddress, toBigNumber } from '@/utils'
import { McLoading, McRadio } from '@/components'
import { OrderApiRequestParams, OrderTypeParams } from '@/type'
import { BigNumber } from 'bignumber.js'
import { splitAmount, _0 } from '@mcdex/mai3.js'
import elementResizeDetectorMaker from 'element-resize-detector'
import TradePanelMixin from '@/template/components/Trade/TradePanelMixin'
import { ORDER_MIN_DEPOSIT_GAS_BALANCE, ORDER_MIN_GAS_BALANCE } from '@/const'

@Component({
  components: {
    McMSimpleSlider,
    McMStateButton,
    McMPopupSelector,
    McMInputRadio,
    BrokerGasPopup,
    McMNumberField,
    OrderConfirmPopup,
    McLoading,
    McMTooltip,
    McMRadioBevelTabs,
  },
})
export default class OrderTrade extends Mixins(OrderTradeMixin, TradePanelMixin) {
  @Ref('orderTrade') orderTrade!: HTMLElement

  private activeOrderSide: ORDER_SIDE = ORDER_SIDE.Buy
  private activeOrderType: ORDER_TYPE = ORDER_TYPE.MarketOrder

  private showAdvancedPopup: boolean = false
  private showBrokerGasDepositPopup: boolean = false
  private showOrderConfirmPopup: boolean = false
  private advancedSettingFixedDom: any = null

  private slippageToleranceErrors: Array<string> = []
  private orderExpireErrors: Array<string> = []
  private minTradeAmountErrors: Array<string> = []
  private safeMaxErrors: Array<string> = []

  private showMinTradeAmount: boolean = true
  private refreshDefaultSlippage: boolean = false
  protected refreshDefaultSlippageTimer = 0

  private toastErrorMsgFlag = true
  private erd: elementResizeDetectorMaker.Erd | null = null

  mounted() {
    this.erd = elementResizeDetectorMaker({ strategy: 'scroll', callOnAdd: true })
    this.erd.listenTo(this.orderTrade, (el) => {
      this.$emit('heightChange', el.clientHeight)
    })
    this.advancedSettingFixedDom = this.$refs.advancedSettingFixedDom

    VUE_EVENT_BUS.on(
      PLACE_ORDER_EVENT.SetLimitPrice,
      (side: 'buy' | 'sell', price: BigNumber, totalAmount: BigNumber) => {
        if (this.orderType != ORDER_TYPE.MarketOrder) {
          this.price = price.toFixed(this.priceFormatDecimals, this.priceFormatRound)
          return
        }

        // AMM
        if ((this.orderSide === 'buy' && side === 'sell') || (this.orderSide === 'sell' && side === 'buy')) {
          if (this.maxTradableAmount) {
            this.amount = BigNumber.minimum(totalAmount, this.maxTradableAmount).toFixed(
              this.underlyingFormatDecimals,
              BigNumber.ROUND_DOWN,
            )
          }
        }
      },
    )

    VUE_EVENT_BUS.on(ACCOUNT_EVENT.REFRESH_USER_DATA, this.onRefreshUserData, () => {
      this.onSuccessRefresh()
      if (!this.amountIsInvalid) {
        // this.onAmountChanged()
        this.changeAmountByProportion()
      } else if (!this.valueIsInvalid) {
        this.onValueChanged()
      } else {
        // this.onAmountChanged()
        this.changeAmountByProportion()
      }
    })
  }

  beforeDestroy() {
    this.erd?.removeAllListeners(this.orderTrade)
  }

  destroyed() {
    VUE_EVENT_BUS.off(ACCOUNT_EVENT.REFRESH_USER_DATA, this.onRefreshUserData)
  }

  private tradeFormRules = {
    triggerPrice: [
      {
        validator: (val: string, rule: any) => {
          const errorMsg = this.validateInputNumber(val)
          this.showErrorMsg(errorMsg)
          return errorMsg === ''
        },
        message: '',
        trigger: 'onChange',
      },
    ],
    price: [
      {
        validator: (val: string, rule: any) => {
          const errorMsg = this.validateInputNumber(val)
          this.showErrorMsg(errorMsg)
          return errorMsg === ''
        },
        message: '',
        trigger: 'onChange',
      },
      {
        validator: (val: string, rule: any) => {
          const errorMsg = this.validateInputStopLimitPrice(val)
          this.showErrorMsg(errorMsg)
          return errorMsg === ''
        },
        message: '',
        trigger: 'onChange',
      },
    ],
    amountValue: [
      {
        validator: (val: string, rule: any) => {
          const errorMsg = this.validateAmountValue()
          this.showErrorMsg(errorMsg)
          return errorMsg === ''
        },
        message: '',
        trigger: 'onChange',
      },
    ],
  }

  get isInitialSuccessful(): boolean {
    if (this.isWrongNetwork) {
      return !!this.selectedPerpetualStorage
    }
    if (this.isConnectedWallet) {
      return !!this.selectedPerpetualStorage && !!this.selectedAccountDetails
    }
    return !!this.selectedPerpetualStorage
  }

  get orderSideOptions() {
    return [
      {
        label: this.$t('placeOrder.sideSelector.buy').toString(),
        value: ORDER_SIDE.Buy,
      },
      {
        label: this.$t('placeOrder.sideSelector.sell').toString(),
        value: ORDER_SIDE.Sell,
      },
    ]
  }

  get orderTypeOptions() {
    return [
      {
        label: this.$t('placeOrder.orderTypeSelect.market').toString(),
        value: ORDER_TYPE.MarketOrder,
      },
      {
        label: this.$t('placeOrder.orderTypeSelect.limitOrder').toString(),
        value: ORDER_TYPE.LimitOrder,
      },
      {
        label: this.$t('placeOrder.orderTypeSelect.stopLimitOrder').toString(),
        value: ORDER_TYPE.StopLimitOrder,
      },
    ]
  }

  get isClosePosition(): boolean {
    return this.closeOnly && toBigNumber(this.amount).eq(this.position.abs())
  }

  get confirmButtonClassType(): string {
    if (this.isConnectedWallet) {
      if (this.needAuth) {
        return 'primary'
      }
      if (this.tradeIsShowPriceImpact && this.isMarketOrderType) {
        return 'error'
      } else if (this.tradeIsShowPriceImpactOfWarning && this.isMarketOrderType) {
        return 'warning'
      } else {
        if (this.orderSide === ORDER_SIDE.Sell) {
          return 'orange'
        }
        return 'blue'
      }
    }
    return 'primary'
  }

  get confirmButtonText() {
    if (this.isConnectedWallet) {
      if (this.needAuth) {
        return this.$t('connectWalletButton.auth').toString()
      }
      if (this.orderSide === ORDER_SIDE.Buy) {
        return this.$t('placeOrder.sideSelector.buy').toString()
      } else if (this.orderSide === ORDER_SIDE.Sell) {
        return this.$t('placeOrder.sideSelector.sell').toString()
      }
    }
    return this.$t('connectWalletButton.header').toString()
  }

  get isShowCloseOnlyCheckBox(): boolean {
    // if (!this.tradePanelIsNormalStatus) {
    //   return false
    // }
    // if (!this.currentSideHasClosePosition) {
    //   return false
    // }
    return true
  }

  get isShowCostText(): boolean {
    if ((this.isLimitOrderType || this.isStopOrderType) && this.needAuth) {
      return false
    }
    return !this.amountIsInvalid && this.isConnectedWallet
  }

  get isShowFeeText(): boolean {
    if ((this.isLimitOrderType || this.isStopOrderType) && this.needAuth) {
      return false
    }
    return !this.amountIsInvalid && this.isConnectedWallet
  }

  get isShowFeeRebate(): boolean {
    return !!(this.isShowFeeText && this.supportTransactionMining && this.feeRebateSATORI)
  }

  get isShowPriceImpact(): boolean {
    return this.isMarketOrderType
  }

  get tradeIsShowPriceImpact(): boolean {
    return !!(this.isShowPriceImpact && this.tradePriceImpact && this.tradePriceImpact.gt(5))
  }

  get tradeIsShowPriceImpactOfWarning(): boolean {
    return !!(this.isShowPriceImpact && this.tradePriceImpact && this.tradePriceImpact.gt(0.1) && this.tradePriceImpact.lte(5))
  }

  get orderConfirmButtonIsDisabled(): boolean {
    if (!this.isConnectedWallet || this.needAuth) {
      return false
    }
    if (this.isWrongNetwork) {
      return true
    }
    if (this.tradingPerpetualIsMarketClosed || !this.walletBalance ||
      this.hasInsufficientLiquidityError || this.hasOpenInterestExceededError) {
      // NOTE: wallet balance == 0 is normal, because trader can close positions
      return true
    }
    const validatorIsPass = this.formParamsValidatorIsPass
    if (validatorIsPass) {
      return false
    }
    return true
  }

  @AsyncComputed({
    watch: ['slippageTolerance', 'orderExpire', 'minTradeAmount', 'safeMax'],
    lazy: true,
  })
  get baseDataValidatorStatus() {
    return this.placeOrderParamsCheck(true)
  }

  @AsyncComputed({
    watch: ['amount', 'value', 'price', 'formParamsIsValid'],
    lazy: true,
  })
  get formValidatorStatus() {
    return this.placeOrderParamsCheck(false)
  }

  get formParamsValidatorIsPass(): boolean {
    if (this.formParamsIsValid) {
      const checkStatus = this.formValidatorStatus && this.baseDataValidatorStatus
      if (checkStatus) {
        return true
      }
    }
    return false
  }

  get price() {
    return this.tradeForm.price
  }

  set price(v: string) {
    this.tradeForm.price = v
    this.onPriceChanged()
  }

  get amount() {
    return this.tradeForm.amount
  }

  set amount(v: string) {
    this.tradeForm.amount = v
    this.onAmountChanged()
  }

  get value() {
    return isFinite(Number(this.tradeForm.value)) ? this.tradeForm.value : '0'
  }

  set value(v: string) {
    this.tradeForm.value = v
    this.onValueChanged()
  }

  get amountProportion(): number {
    return this.tradeForm.amountProportion
  }

  setAmountProportion(val: number) {
    if (this.maxTradableAmount && this.maxTradableAmount?.lt(this.inputMinTradeAmountByAmountDecimals)) {
      this.tradeForm.amountProportion = val
      this.tradeForm.amount = ''
      this.tradeForm.value = ''
      return
    }
    this.tradeForm.amountProportion = val
    const amount = this.maxTradableAmount
      ?.times(val)
      .div(100)
      .toFixed(this.underlyingFormatDecimals, BigNumber.ROUND_DOWN) || ''
    this.tradeForm.amount = toBigNumber(amount).isZero() ? '' : amount
    this.computeValueByAmount()
    this.onAmountChanged()
  }

  get closeOnly(): boolean {
    return this.tradeForm.isCloseOnly
  }

  set closeOnly(v: boolean) {
    this.tradeForm.isCloseOnly = v
    this.onCloseOnlyChanged()
  }

  onPriceChanged() {
    if (this.fixedParam === 'amount') {
      this.onAmountChanged()
    } else if (this.fixedParam === 'value') {
      this.onValueChanged()
    }
  }

  onAmountChanged() {
    this.computeValueByAmount()
    this.refreshAmountProportion()
  }

  onValueChanged() {
    this.computeAmountByValue()
    this.refreshAmountProportion()
  }

  refreshAmountProportion() {
    let amount = new BigNumber(this.tradeForm.amount)
    if (!amount.isFinite() || amount.lt(_0)) {
      return
    }
    if (!this.maxTradableAmount) {
      return
    }
    if (this.maxTradableAmount.isZero()) {
      this.tradeForm.amountProportion = this.amountProportion
      return
    }
    if (amount.gt(this.maxTradableAmount)) {
      amount = this.maxTradableAmount
    }

    let maxTradableAmount = this.maxTradableAmount
    if (this.tradingPerpetualProperty) {
      const underlyingAssetFormatDecimals = this.tradingPerpetualProperty.underlyingAssetFormatDecimals
      maxTradableAmount = this.maxTradableAmount.dp(underlyingAssetFormatDecimals, BigNumber.ROUND_DOWN)
    }
    this.tradeForm.amountProportion = Number(
      amount
        .div(maxTradableAmount)
        .times(100)
        .toFixed(0),
    )
  }

  changeAmountByProportion() {
    this.setAmountProportion(this.tradeForm.amountProportion)
  }

  resetFormFields() {
    // current none
  }

  onInsufficientLiquiditySetMaxAmount() {
    if (!this.maxAvailableAmount) {
      this.amount = ''
    } else {
      this.amount = this.maxAvailableAmount.toFixed()
    }
  }

  onStopOrderTypeSetDefaultCloseOnly() {
    if (this.currentSideHasClosePosition && this.orderType === ORDER_TYPE.StopLimitOrder) {
      this.tradeForm.isCloseOnly = true
    }
  }

  @Watch('activeOrderSide', { immediate: true })
  onActiveOrderSideChanged() {
    this.tradeForm.orderSide = this.activeOrderSide
    this.onStopOrderTypeSetDefaultCloseOnly()
  }

  @Watch('activeOrderType', { immediate: true })
  onActiveOrderTypeChanged() {
    this.orderType = this.activeOrderType
    this.onStopOrderTypeSetDefaultCloseOnly()
  }

  @Watch('selectedPerpetualID', { immediate: true })
  onSelectedPerpetualIDChanged() {
    this.tradingPerpetualID = this.selectedPerpetualID
    this.resetForm()
    this.tradeForm.orderSide = this.activeOrderSide
    this.resetFormFields()
    this.loadDefaultSettingSucceeded = false
  }

  @Watch('position', { immediate: true })
  onPositionChangedUpdateCloseOnly() {
    if (this.closeOnly && this.position.isZero()) {
      this.closeOnly = false
      this.amount = ''
    }
  }

  @Watch('accountAddress')
  onAccountChange() {
    // this.onAmountChanged()
    this.changeAmountByProportion()
  }

  @Watch('orderType', { immediate: true })
  async onOrderTypeChanged() {
    // amount or value input error initial
    if (this.amountIsInvalid || this.valueIsInvalid) {
      this.tradeForm.amount = ''
      this.tradeForm.value = ''
      this.resetFormFields()
    }
    // price input error initial
    if ((this.priceIsInvalid || this.amountIsInvalid || this.valueIsInvalid) && this.inputMarketPrice &&
      (this.isMarketOrderType || this.isLimitOrderType)) {
      this.price = this.inputMarketPrice.toFixed(this.priceFormatDecimals, this.priceFormatRound)
    } else if (this.isStopOrderType && (this.amountIsInvalid || this.valueIsInvalid)) {
      this.price = ''
    }
    // this.onAmountChanged()
    this.changeAmountByProportion()
    await this.placeOrderParamsCheck()
  }

  @Watch('orderSide', { immediate: true })
  onOrderSideChanged(v: ORDER_SIDE) {
    // amount or value input error initial
    if (this.amountIsInvalid || this.valueIsInvalid) {
      this.tradeForm.amount = ''
      this.tradeForm.value = ''
      if (this.orderType !== ORDER_TYPE.StopLimitOrder) {
        this.resetFormFields()
      }
    }
    // price input error initial
    if (this.priceIsInvalid && this.inputMarketPrice && (this.isMarketOrderType || this.isLimitOrderType)) {
      this.price = this.inputMarketPrice.toFixed(this.priceFormatDecimals, this.priceFormatRound)
    } else if (this.isStopOrderType && (this.amountIsInvalid || this.valueIsInvalid)) {
      this.price = ''
    }
    this.closeOnly = false
    this.onStopOrderTypeSetDefaultCloseOnly()
    this.changeAmountByProportion()
    if (this.price) {
      this.onPriceChanged()
    }
  }

  @Watch('inputMarketPrice', { immediate: true })
  @Watch('amount', { immediate: true })
  onMarketPriceChange() {
    if (this.inputMarketPrice && this.orderType === ORDER_TYPE.MarketOrder) {
      if (this.amountIsInvalid) {
        this.price = this.inputMarketPrice.toFixed(this.priceFormatDecimals, this.priceFormatRound)
      }
    }
  }

  @Watch('inputMarketPrice', { immediate: true })
  onMarketPriceChangeAmount() {
    if (this.inputMarketPrice && this.orderType === ORDER_TYPE.MarketOrder) {
      if (!this.amountIsInvalid) {
        this.onAmountChanged()
      }
    }
  }

  onCloseOnlyChanged() {
    // show close text body
    if (this.tradeForm.isCloseOnly) {
      const amount = Number(this.amount)
      if (this.amountIsInvalid) {
        this.amount = this.position.abs().toFixed()
        return
      }
      if (this.position.abs().lte(amount)) {
        this.amount = this.position.abs().toFixed()
      } else {
        this.refreshAmountProportion()
      }
      this.onAmountChanged()
    } else {
      if (Number(this.closePositionRatio) > 0) {
        // this.onAmountChanged()
        this.changeAmountByProportion()
      }
    }
  }

  @Watch('needAuth')
  onAuthStatusChanged() {
    this.changeAmountByProportion()
  }

  onRefreshUserData() {
    // current none
  }

  onSuccessRefresh() {
    if (!this.maxTradableAmount || this.maxTradableAmount.lte(0)) {
      this.closeOnly = false
      this.amount = ''
    }
    const amount = Number(this.amount)
    if (this.maxTradableAmount && this.maxTradableAmount.gt(0) && !isNaN(amount)) {
      if (this.maxTradableAmount.lte(amount)) {
        if (this.maxTradableAmount.gt(this.inputMinTradeAmountByAmountDecimals)) {
          this.amount = this.maxTradableAmount.toFixed(this.underlyingFormatDecimals, BigNumber.ROUND_DOWN)
        } else {
          this.closeOnly = false
          this.amount = ''
        }
      }
    }
  }

  @Watch('defaultMinTradeAmount')
  resetMinTradeAmountRadio() {
    // change perpetual address custom, dom reload
    this.showMinTradeAmount = false
    setTimeout(() => {
      this.showMinTradeAmount = true
    }, 1)
    setTimeout(() => {
      const ref = this.$refs.minTradeAmountRef as McRadio
      if (ref) {
        ref.onValueChanged()
      }
    }, 100)
  }

  @Watch('defaultSlippageTolerance')
  resetDefaultSlippageToleranceRadio() {
    if (!this.refreshDefaultSlippage) {
      this.refreshDefaultSlippageTimer = window.setInterval(() => {
        const ref = this.$refs.slippageToleranceRef as McMInputRadio
        if (ref) {
          ref.onValueChanged()
          this.refreshDefaultSlippage = true
          window.clearInterval(this.refreshDefaultSlippageTimer)
        }
      }, 100)
    }
  }

  showErrorMsg(msg: string | string[]) {
    if (this.toastErrorMsgFlag) {
      this.$mcmToastErrorMsg(msg)
    }
  }

  validateInputNumber(value: string): string {
    if (this.isSkipValidation || value === '') {
      return ''
    }
    const valueFloat = Number(value)
    if (isNaN(valueFloat) || valueFloat < 0) {
      return this.$t('commonErrors.inputError').toString()
    }
    return ''
  }

  validateInputStopLimitPrice(value: string): string {
    if (this.isSkipValidation) {
      return ''
    }
    if (this.orderType === ORDER_TYPE.StopLimitOrder) {
      const triggerPrice = Number(this.tradeForm.triggerPrice)
      if (isNaN(triggerPrice) || this.tradeForm.triggerPrice === '') {
        return ''
      }
      const limitPrice = Number(this.price)
      if (this.orderSide === ORDER_SIDE.Buy) {
        if (triggerPrice > limitPrice) {
          return this.$t('placeOrder.tradePanel.stopLimitPriceBuyError').toString()
        } else {
          return ''
        }
      }
      if (this.orderSide === ORDER_SIDE.Sell) {
        if (triggerPrice < limitPrice) {
          return this.$t('placeOrder.tradePanel.stopLimitPriceSellError').toString()
        } else {
          return ''
        }
      }
    }
    return ''
  }

  validateAmountValue(): string {
    // start check
    if (this.isSkipValidation) {
      if (this.hasInsufficientLiquidityError) {
        return this.$t('commonErrors.insufficientLiquidityError').toString()
      }
      if (this.hasOpenInterestExceededError) {
        return this.$t('commonErrors.openInterestExceededError').toString()
      }
      return ''
    }

    if (this.amount === '' && this.value === '') {
      // the form is empty
      return ''
    }
    const amountFloat = Number(this.amount)
    const valueFloat = Number(this.value)
    if (isNaN(valueFloat) || valueFloat < 0 || isNaN(amountFloat) || amountFloat < 0) {
      // bad number
      return this.$t('commonErrors.inputError').toString()
    }

    let newAmount = toBigNumber(this.amount)
    if (this.orderSide === ORDER_SIDE.Sell) {
      newAmount = newAmount.negated()
    }
    if (this.tradingPerpetualIsInverse) {
      newAmount = newAmount.negated()
    }

    // if (this.hasInsufficientLiquidityError) {
    //   return this.$t('commonErrors.insufficientLiquidityError').toString()
    // }
    if (this.hasOpenInterestExceededError) {
      return this.$t('commonErrors.openInterestExceededError').toString()
    }
    if (!this.afterTrading || !this.afterTradingResult || !this.tradingPerpetualStorage) {
      console.warn('FIXME: unknown error. afterTrading = null')
      return ''
    }
    // limit order requires minTradeAmount
    if (this.orderType !== ORDER_TYPE.MarketOrder) {
      const minTradeAmount = new BigNumber(this.tradeForm.minTradeAmount)
      if (!newAmount.isZero() && newAmount.abs().lt(minTradeAmount)) {
        return this.$t('placeOrder.tradePanel.minTradeAmountErr').toString()
      }
    }

    // mai3 compute max amount, check input amount value
    if (this.maxTradableAmount) {
      if (newAmount.abs().gt(this.maxTradableAmount)) {
        return this.$t('placeOrder.tradePanel.tradeAmountErr', {
          amount: this.maxTradableAmount.toFixed(this.underlyingFormatDecimals, BigNumber.ROUND_DOWN),
          underlyingAssetSymbol: this.tradingPerpetualProperty?.underlyingAssetSymbol || '',
        }).toString()
      }
    }

    if (!this.afterTraderIsSafe) {
      return this.$t('commonErrors.insufficientMargin').toString()
    }

    return ''
  }

  @Watch('orderExpire')
  onOrderExpireChanged() {
    this.orderExpireErrors = [this.validateOrderExpire()]
    this.showErrorMsg(this.orderExpireErrors)
  }

  validateOrderExpire(): string {
    if (this.isSkipValidation) {
      return ''
    }
    const expire = Number(this.orderExpire)
    if (isNaN(expire) || expire < 0) {
      return `${this.$t('base.expire').toString()} ${this.$t('commonErrors.inputError').toString()}`
    } else if (expire > 100) {
      return this.$t('commonErrors.orderExpirationOutOfRangeError', { day: 100 }).toString()
    }
    return ''
  }

  @Watch('slippageTolerance')
  onSlippageToleranceChanged() {
    this.slippageToleranceErrors = [this.validateSlippageTolerance()]
    this.showErrorMsg(this.slippageToleranceErrors)
  }

  validateSlippageTolerance(): string {
    if (this.isSkipValidation) {
      return ''
    }
    const slippage = Number(this.slippageTolerance)
    if (isNaN(slippage) || slippage < 0) {
      return this.$t('commonErrors.inputError').toString()
    } else if (slippage > 100) {
      return this.$t('placeOrder.tradePanel.safeMaxError', { val: '100' }).toString()
    }
    return ''
  }

  @Watch('safeMax')
  onSafeMaxChanged() {
    this.safeMaxErrors = [this.validateSafeMax()]
    this.showErrorMsg(this.safeMaxErrors)
  }

  validateSafeMax(): string {
    if (this.isSkipValidation) {
      return ''
    }
    const safeMax = Number(this.safeMax)
    if (isNaN(safeMax) || safeMax < 0) {
      return this.$t('commonErrors.inputError').toString()
    } else if (safeMax > 100) {
      return this.$t('placeOrder.tradePanel.safeMaxError', { val: '100' }).toString()
    }
    return ''
  }

  @Watch('minTradeAmount')
  onMinTradeAmountChanged() {
    this.minTradeAmountErrors = [this.validateMinTradeAmount()]
    this.showErrorMsg(this.minTradeAmountErrors)
  }

  validateMinTradeAmount() {
    if (this.isSkipValidation || this.minTradeAmount === '') {
      return ''
    }
    const amount = Number(this.minTradeAmount)
    if (isNaN(amount) || amount <= 0) {
      return this.$t('commonErrors.inputError').toString()
    }
    return ''
  }

  validateGasBalance(): string {
    if (this.orderType === ORDER_TYPE.LimitOrder || this.orderType === ORDER_TYPE.StopLimitOrder) {
      if (this.accountGasStorage && this.accountGasStorage.balance.lt(ORDER_MIN_GAS_BALANCE)) {
        return this.$t('commonErrors.insufficientTradeGasBalance', {
          amount: ORDER_MIN_DEPOSIT_GAS_BALANCE,
          symbol: this.nativeToken?.symbol || '',
        }).toString()
      }
    }
    return ''
  }

  async placeOrderParamsCheck(setFlag: boolean = true): Promise<boolean> {
    const formRef = this.$refs.orderTradeForm as any
    let valid: boolean = false
    try {
      let result = true
      const keys = Object.keys(this.tradeFormRules)
      for (let i = 0; i < keys.length; i++) {
        const keyName = keys[i]
        if (setFlag) {
          this.toastErrorMsgFlag = false
        }
        const s = await formRef.validate(keyName)
        if (setFlag) {
          this.toastErrorMsgFlag = true
        }
        result = s === undefined && result
      }
      valid = result
    } catch (e) {
      if (setFlag) {
        this.toastErrorMsgFlag = true
      }
      valid = false
    }
    if (!valid) {
      return false
    }
    const slippageMsg = this.validateSlippageTolerance()
    if (slippageMsg !== '') {
      return false
    }
    if (this.orderType !== ORDER_TYPE.MarketOrder) {
      const expireMgs = this.validateOrderExpire()
      if (expireMgs !== '') {
        return false
      }
      const minTradeAmountMsg = this.validateMinTradeAmount()
      if (minTradeAmountMsg !== '') {
        return false
      }
    }
    return true
  }

  // validate end

  async onMarketTradeEvent() {
    if (
      !this.contractAmount ||
      !this.tradeAccountAddress ||
      this.tradeAccountAddress === '' ||
      !this.tradingLiquidityPoolInfo ||
      !this.tradingLiquidityPoolStorage
    ) {
      return
    }
    const tradeParams: BuildMarketTradeParams = {
      accountAddress: this.tradeAccountAddress,
      limitPrice: this.convertLimitPriceWithSlippage,
      amount: this.contractAmount,
      expire: Number(this.marketExpire),
      symbol: this.fullPerpetualName,
      referrer: getReferralAddress(this.tradeAccountAddress || ''),
      noticeAmount: this.amount,
      noticePrice: this.noticeLimitPrice,
      isCloseOnly: this.tradeForm.isCloseOnly,
      liquidityPoolAddress: this.tradingLiquidityPoolInfo.liquidityPoolAddress,
      perpetualIndex: this.tradingLiquidityPoolInfo.perpetualIndex,
      errorCallback: (err: any) => {
      },
    }
    await this.callChainFunc(async () => {
      if (!this.tradingLiquidityPoolStorage) {
        return
      }
      await this.onMarketTrade(tradeParams, this.tradingLiquidityPoolStorage, this.isClosePosition)
    }, undefined, true)
  }

  async buildOrderRequestParamsDatas(
    orderType: ORDER_TYPE,
  ): Promise<{ apiParams: OrderApiRequestParams | null; orderParams: BuildOrderApiParams } | null> {
    if (
      !this.contractAmount ||
      !this.tradeAccountAddress ||
      this.tradeAccountAddress === '' ||
      !this.tradeChainID ||
      !this.tradingLiquidityPoolInfo ||
      !this.tradingLiquidityPoolStorage
    ) {
      return null
    }

    const orderTypeID = (): OrderTypeParams => {
      if (orderType === ORDER_TYPE.LimitOrder) {
        return OrderTypeParams.LimitOrder
      }
      return OrderTypeParams.StopOrder
    }
    let placeOrderParams: BuildOrderApiParams = {
      accountAddress: this.tradeAccountAddress,
      limitPrice: this.convertOrderLimitPrice,
      amount: this.contractAmount,
      expire: Number(this.orderExpireSecond),
      symbol: this.fullPerpetualName,
      noticeAmount: this.amount,
      noticePrice: toBigNumber(this.convertOrderLimitPrice).toFixed(this.collateralFormatDecimals),
      chainID: this.tradeChainID.toString(),
      orderType: orderTypeID(),
      isCloseOnly: this.tradeForm.isCloseOnly,
      referrer: getReferralAddress(this.tradeAccountAddress || ''),
      liquidityPoolAddress: this.tradingLiquidityPoolInfo.liquidityPoolAddress,
      perpetualIndex: this.tradingLiquidityPoolInfo.perpetualIndex,
      minTradeAmount: Number(this.tradeForm.minTradeAmount),
      relayerErrCallback: () => {
      },
      signErrCallback: (err: any) => {
      },
    }
    if (orderType === ORDER_TYPE.StopLimitOrder) {
      placeOrderParams.triggerPrice = this.convertOrderTriggerPrice
    }
    return {
      apiParams: await this.getOrderApiRequestParams(placeOrderParams, this.tradingLiquidityPoolStorage, this.isClosePosition),
      orderParams: placeOrderParams,
    }
  }

  async onPlaceApiOrderEvent(orderType: ORDER_TYPE) {
    if (!this.tradingPerpetualStorage) {
      return
    }
    let params = await this.buildOrderRequestParamsDatas(orderType)
    if (!params || !params.apiParams) {
      return
    }
    await this.onPlaceApiOrder(params.apiParams, params.orderParams)
  }

  async tradeConfirmEvent() {
    if (this.orderType === ORDER_TYPE.MarketOrder) {
      await this.onMarketTradeEvent()
    } else if (this.orderType === ORDER_TYPE.LimitOrder) {
      await this.onPlaceApiOrderEvent(ORDER_TYPE.LimitOrder)
    } else if (this.orderType === ORDER_TYPE.StopLimitOrder) {
      await this.onPlaceApiOrderEvent(ORDER_TYPE.StopLimitOrder)
    }
  }

  async confirmTradeButtonEvent() {
    if (!this.isConnectedWallet) {
      VUE_EVENT_BUS.emit(COMMON_EVENT.SHOW_SELECT_WALLET_POPUP)
      return
    }
    if (this.needAuth) {
      VUE_EVENT_BUS.emit(AUTH_EVENT.AUTH)
      return
    }
    if (this.tradingPerpetualIsMarketClosed) {
      return
    }
    // check params
    const formParamsValidatorIsPass = this.formParamsValidatorIsPass
    if (!formParamsValidatorIsPass) {
      return
    }
    // check gas
    if (this.orderType === ORDER_TYPE.LimitOrder || this.orderType === ORDER_TYPE.StopLimitOrder) {
      const validateMsg = this.validateGasBalance()
      if (validateMsg !== '') {
        this.showErrorMsg(validateMsg)
        return
      }
    }
    // order confirm dialog
    this.showOrderConfirmPopup = true
  }
}
</script>

<style scoped lang="scss">
@import '~@mcdex/style/common/var';

.order-trade {
  ::v-deep {
    .radio-group-tabs {
      .tabs {
        height: 38px;
        border-radius: 8px;
      }

      .label {
        border-radius: 4px;
      }

      .tab-item {
        line-height: 28px;
        font-size: 14px;
        border-radius: 4px;
      }
    }
  }

  ::v-deep {
    .van-field__right-icon {
      color: var(--mc-text-color);
      font-size: 12px;
    }

    .van-field__body {
      line-height: 16px;
    }

    .van-field__control {
      font-size: 14px;
      color: var(--mc-text-color-white);
    }

    input::-webkit-input-placeholder {
      color: var(--mc-text-color-dark);
    }

    .input-radio-group {
      .van-cell {
        padding: 11px 11px;
        height: 36px;
      }

      .van-field__body {
        line-height: 16px;
        height: 16px;
      }
    }
  }

  ::v-deep {
    .radio-group {
      .radio-item {
        margin: 0 2px;
      }
    }
  }

  .info-panel {
    margin-top: 12px;
  }

  .line-item {
    margin-top: 12px;
  }

  .just-line {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--mc-text-color);

    .value {
      color: var(--mc-text-color-white);
    }
  }

  .icon {
    font-size: 12px;
    color: var(--mc-color-primary);
    margin-left: 6px;
  }

  .just-input {
    display: flex;
    width: 100%;

    .input-join {
      margin: 0 4px;
      padding-top: 28px;
      width: 8px;
      font-size: 14px;
    }

    .label {
      font-size: 12px;
      color: var(--mc-text-color);
      font-weight: 400;
      margin-bottom: 5px;
      padding-left: 0;
    }

    .input-item {
      width: 100%;
    }
  }

  .option-warning-panel {
    background: rgba($--mc-color-warning, 0.1);
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 13px;
    margin-bottom: 10px;
    line-height: 18px;
    color: var(--mc-color-warning) !important;
    margin-top: -10px;

    .click-value {
      text-decoration: underline;
      cursor: pointer;
    }
  }

  .just-text-line {
    display: flex;
    justify-content: space-between;
    margin-top: 4px;
    font-weight: 400;
    font-size: 12px;
    color: var(--mc-text-color);
    line-height: 16px;

    .value {
      color: var(--mc-text-color-white);
    }

    &.fee-rebate {
      color: var(--mc-color-blue);

      .value {
        color: var(--mc-color-blue);
      }
    }
  }

  .slider-item {
    margin: 20px 8px 20px 8px;
  }

  .close-only-line {
    display: flex;
    align-items: center;
    margin-top: 7px;

    .left {
      flex: 0.5;
    }

    .dividing-line {
      display: flex;
      margin: 0 16px;
      align-items: center;

      span {
        display: flex;
        height: 12px;
        width: 1px;
        background-color: var(--mc-border-color);
      }
    }

    .right {
      display: flex;
      flex: 0.5;
      justify-content: space-between;
      font-size: 12px;
      color: var(--mc-text-color);
      line-height: 16px;

      .value {
        color: var(--mc-text-color-white);
      }
    }
  }

  .icon-click-group {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-top: 12px;

    .icon-click-item {
      display: flex;
      cursor: pointer;
      height: 16px;
      line-height: 16px;
      flex: 0.5;

      .label {
        display: flex;
        font-size: 12px;
        font-weight: 400;
        color: var(--mc-color-primary);
        margin-left: 4px;
        line-height: 16px;
      }

      i {
        font-size: 16px;
        color: var(--mc-color-primary);
      }
    }

    .vertical-item {
      display: flex;
      margin: 0 16px;

      .vertical-line {
        display: flex;
        height: 12px;
        width: 1px;
        background-color: var(--mc-border-color);
      }
    }

    .icon-click-item:last-child {
      margin-right: 0;
    }
  }

  .popups {
    ::v-deep {
      .van-popup {
        padding: 16px;
      }
    }

    .label-line {
      margin-bottom: 8px;
      font-size: 14px;
      line-height: 20px;
      font-weight: 400;
      color: var(--mc-text-color);
    }

    .popup-container {
      padding: 28px 0 16px 0;
    }

    .popup-line {
      margin-bottom: 16px;
    }

    .slippage {
      ::v-deep .end-item {
        width: 34.5%!important;
      }
    }
  }

  .safe-color-text {
    color: var(--mc-color-success);
  }

  .warning-color-text {
    color: var(--mc-color-warning);
  }

  .unsafe-color-text {
    color: var(--mc-color-error);
  }
}

.mc-loading {
  ::v-deep {
    .mc-loading__mask {
      border-radius: 16px;
      margin: -8px;

      .el-icon-loading {
        color: var(--mc-text-color-white);
      }

      .el-loading-text {
        color: var(--mc-text-color-white);
      }
    }
  }

  ::v-deep .van-field--disabled {
    .van-field__control {
      color: var(--mc-text-color-white) !important;
      -webkit-text-fill-color: var(--mc-text-color-white) !important;
    }
  }

}

.skeleton-container {
  ::v-deep {
    .van-skeleton:first-child {
      margin-top: 0;
    }

    .van-skeleton {
      margin-top: 16px;
    }
  }
}

.fee-rebate-prompt ::v-deep .rebate-rate {
  color: var(--mc-color-blue);
  font-weight: bold;
}
</style>


<style lang="scss" scoped>
.order-trade {
  .mc-m-radio-bevel-tabs {
    &.buy ::v-deep .radio-item.active {
      color: var(--mc-color-blue);
    }

    &.sell ::v-deep .radio-item.active {
      color: var(--mc-color-orange);
    }
  }
}
</style>
