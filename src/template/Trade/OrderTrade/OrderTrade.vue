<template>
  <div>
    <div class="order-trade">
      <div class="top-info-box">
        <div class="info-line" v-show="!isMarketOrderType && !needAuth">
          <span class="label">
            <i class="iconfont icon-wallet-bold"></i>
            <el-tooltip placement="top" :open-delay="400">
              <span class="tip-text">{{ $t('base.available') }}</span>
              <div slot="content">
                <span>{{ $t('placeOrder.availablePrompt') }}</span>
              </div>
            </el-tooltip>
          </span>
          <span class="value">
            <span v-if="available"
            >{{ available | bigNumberFormatter(collateralFormatDecimals) }} {{ collateralTokenSymbol }}</span
            >
          </span>
        </div>
      </div>
      <el-form
        size="medium"
        :model="tradeForm"
        :rules="tradeRule"
        ref="orderTradeForm"
        @submit.native.prevent
        label-position="top"
      >
        <!-- trigger price input -->
        <div v-show="isStopOrderType" class="input-item">
          <el-form-item prop="triggerPrice" :inline-message="true">
            <template #label>
              <el-tooltip placement="top" :open-delay="400">
                <span class="tip-text">{{ $t('base.triggerPrice') }}</span>
                <div slot="content">
                  <span v-if="orderSide === 'buy'">{{ $t('placeOrder.tradePanel.triggerPriceBuyTip') }}</span>
                  <span v-if="orderSide === 'sell'">{{ $t('placeOrder.tradePanel.triggerPriceSellTip') }}</span>
                </div>
              </el-tooltip>
            </template>
            <div class="input-box" :class="{'input-box-focus': triggerPriceInputIsFocus}">
              <el-input v-model.trim="tradeForm.triggerPrice" size="medium" class="form-input"
                        :class="{'form-input-focus': triggerPriceInputIsFocus}"
                        @focus="triggerPriceInputIsFocus=true" @blur="triggerPriceInputIsFocus=false">
                <template slot="suffix">{{ priceUnit }}</template>
              </el-input>
            </div>
          </el-form-item>
        </div>
        <!-- price input -->
        <div class="input-item">
          <el-form-item prop="price" :inline-message="true">
            <template #label>
              <span v-if="!isMarketOrderType">{{ priceLabelName }}</span>
              <el-tooltip placement="top" :open-delay="400">
                <span v-show="isMarketOrderType" :class="{ 'tip-text': isMarketOrderType }">{{ priceLabelName }}</span>
                <div slot="content">
                  <span v-if="isMarketOrderType">{{ $t('placeOrder.ammPricePrompt') }}</span>
                </div>
              </el-tooltip>
            </template>
            <div class="input-box" :class="{'input-box-focus': priceInputIsFocus}">
              <el-input v-model.trim="price" size="medium" :disabled="isMarketOrderType" class="form-input"
                        :class="{'form-input-focus': priceInputIsFocus}"
                        @focus="priceInputIsFocus=true" @blur="priceInputIsFocus=false">
                <span slot="suffix">{{ priceUnit }}</span>
              </el-input>
            </div>
          </el-form-item>
        </div>
        <!-- amount/value input -->
        <div class="input-item" :class="{ 'custom-input-error': tradeAmountErrorType === 'insufficientMargin' }">
          <el-form-item prop="amountValue" :label="$t('base.amount')" :inline-message="true">
            <el-row type="flex" justify="space-between" :gutter="8">
              <el-col :span="12">
                <!-- amount -->
                <div class="input-box" :class="{'input-box-focus': amountInputIsFocus}">
                  <el-input v-model.trim="amount" size="medium" class="form-input"
                            :class="{'form-input-focus': amountInputIsFocus}"
                            @focus="amountInputIsFocus=true" @blur="amountInputIsFocus=false">
                    <span slot="suffix">
                      {{ underlyingAssetSymbol }}
                    </span>
                  </el-input>
                </div>
              </el-col>
              <el-col :span="12">
                <!-- value -->
                <div class="input-box" :class="{'input-box-focus': valueInputIsFocus}">
                  <el-input v-model.trim="value" size="medium" class="form-input"
                            :class="{'form-input-focus': valueInputIsFocus}"
                            @focus="valueInputIsFocus=true" @blur="valueInputIsFocus=false">
                    <span slot="suffix">
                      {{ collateralTokenSymbol }}
                    </span>
                  </el-input>
                </div>
              </el-col>
            </el-row>
            <!-- insufficient liquidity -->
            <div v-if="tradeAmountErrorType === 'insufficientLiquidity' && isConnectedWallet"
                 class="text-item option-warning-panel">
              {{ $t('placeOrder.tradePanel.insufficientLiquidityWarning') }}
              <span class="click-value" @click="onAmountErrorSetMaxAmount">
                {{
                  maxAvailableAmount | bigNumberFormatter(underlyingFormatDecimals, 1 /* ROUND_DOWN */)
                }} {{ underlyingAssetSymbol }}
              </span>
            </div>
            <!-- maxAvailableAmount -->
            <div v-if="tradeAmountErrorType === 'maxAvailableAmount' && isConnectedWallet"
                 class="text-item option-warning-panel">
              <template v-if="closeOnly">
                {{ $t('placeOrder.tradePanel.closeOnlyMaxAvailableAmountWarning') }}
                <span class="click-value" @click="onAmountErrorSetMaxAmount">
                  {{
                    maxTradableAmount | bigNumberFormatter(underlyingFormatDecimals, 1 /* ROUND_DOWN */)
                  }} {{ underlyingAssetSymbol }}
                </span>
                {{ $t('placeOrder.tradePanel.subCloseOnlyMaxAvailableAmountWarning') }}
              </template>
              <template v-else>
                {{
                  $t('placeOrder.tradePanel.maxAvailableAmountWarning', { collateralSymbol: collateralTokenBaseSymbol }).toString()
                }}
                <span class="click-value" @click="onAmountErrorSetMaxAmount">
                  {{
                    maxAvailableAmount | bigNumberFormatter(underlyingFormatDecimals, 1 /* ROUND_DOWN */)
                  }} {{ underlyingAssetSymbol }}
                </span>
              </template>
            </div>
            <!-- limitOrderMinTradeAmount -->
            <div v-if="tradeAmountErrorType === 'limitOrderMinTradeAmount' && isConnectedWallet"
                 class="text-item option-warning-panel">
              {{ $t('placeOrder.tradePanel.limitOrderMinAmountWarning') }}
              <span class="click-value" @click="onLimitOrderMinAmount">
                {{
                  minTradeAmount | bigNumberFormatter(underlyingFormatDecimals, 1 /* ROUND_DOWN */)
                }} {{ underlyingAssetSymbol }}
              </span>.
              {{ $t('placeOrder.tradePanel.subLimitOrderMinAmountWarning') }}
            </div>
          </el-form-item>
        </div>
      </el-form>
      <!-- slider -->
      <div class="slider-item text-item" v-if="isShowAmountSlider">
        <McSimpleSlider
          :value="amountProportion"
          :marks="[0, 25, 50, 75, 100]"
          @input="setAmountProportion"
          :step="1"
          :max="100"
          tooltip-placement="top"
          :tooltip-unit="'%'"
        />
      </div>
      <!-- text line 1 -->
      <div class="text-item layout-item">
        <div class="change-info-item">
          <!-- margin ratio text -->
          <div class="info-left">
            <div class="justify-text-item">
              <el-tooltip placement="top" :open-delay="400">
                <span class="tip-text">{{ $t('base.marginRatio') }}</span>
                <div slot="content">
                  <span v-html="marginRatioToolTip"></span>
                </div>
              </el-tooltip>
              <span class="text-right text-light">
                <span v-if="afterTradingMarginRatio"
                >{{ afterTradingMarginRatio.times(100) | bigNumberFormatter(1) }}%</span
                >
              </span>
            </div>
          </div>
          <div class="info-vertical-info" v-if="isShowLiqPriceText">
            <span class="vertical-line"></span>
          </div>
          <!-- liq price text -->
          <div class="info-right" v-if="isShowLiqPriceText">
            <div class="justify-text-item">
              <span>{{ $t('base.liqPrice') }}</span>
              <span class="text-light">
                <span v-if="newLiquidationPrice">{{
                    newLiquidationPrice | bigNumberFormatter(priceFormatDecimals)
                  }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
      <!-- text line 2 -->
      <!-- close only info line -->
      <div class="text-item layout-item" v-if="isShowCloseOnlyCheckBox">
        <div class="change-info-item">
          <!-- close only checkbox -->
          <div class="info-left single-checkbox">
            <el-checkbox v-model="closeOnly">{{ $t('placeOrder.tradePanel.closeOnly') }}</el-checkbox>
          </div>
          <div class="info-vertical-info" v-if="closeOnly">
            <span class="vertical-line"></span>
          </div>
          <!-- close position ratio -->
          <div class="info-right" v-if="closeOnly">
            <div class="justify-text-item">
              <span>{{ $t('placeOrder.tradePanel.closePosition') }}</span>
              <span class="text-right text-light">{{ closePositionRatio }}%</span>
            </div>
          </div>
        </div>
      </div>
      <!-- place order button -->
      <div class="layout-item place-order-button">
        <el-button
          :type="placeOrderButtonType"
          size="medium"
          :disabled="isWrongNetwork || confirmDisabled"
          @click="placeOrderEvent"
          class="confirm-button"
        >
            <span v-if="tradeIsShowPriceImpact && $i18n.locale === 'zh-CN'">
              {{ $t('base.anyway') }}
            </span>
          <span>
            {{ placeOrderButtonText }}
            <span v-if="isConnectedWallet && !needAuth">
              {{ tradeShowCollateral }}
            </span>
            <span v-if="tradeIsShowPriceImpact && $i18n.locale !== 'zh-CN'">
              {{ $t('base.anyway') }}
            </span>
          </span>
          <span><i v-if="buttonIsLoading" class="el-icon-loading"></i></span>
        </el-button>
      </div>
      <!-- trade amount tip -->
      <template>
        <div class="amount-error-button-msg" v-if="tradeAmountErrorType === 'insufficientLiquidity'"
        >{{ $t('commonErrors.insufficientLiquidityError') }}
        </div>
        <div class="amount-error-button-msg" v-if="tradeAmountErrorType === 'openInterestError'"
        >{{ $t('commonErrors.openInterestExceededError') }}
        </div>
        <div class="amount-error-button-msg" v-if="tradeAmountErrorType === 'insufficientMargin'"
        >{{ $t('commonErrors.insufficientMargin') }}
        </div>
      </template>
      <!-- gas warring -->
      <div class="warning-panel" v-if="isShowGasWaringText">
        {{ $t('commonErrors.insufficientTradeGasBalanceColor') }}
        <span class="click-button"
              @click="isShowOrderGasDialog = true">{{ $t('commonErrors.insufficientTradeGasBalanceDeposit') }}</span>
        <span class="value"> {{ ORDER_MIN_DEPOSIT_GAS_BALANCE }} {{ nativeToken ? nativeToken.symbol : '' }}</span>
      </div>
      <!-- cost -->
      <div class="layout-item text-item" v-if="isShowCostText">
        <div class="justify-text-item">
          <el-tooltip placement="top" :open-delay="400">
            <span class="tip-text">{{ $t('base.cost') }}</span>
            <div slot="content">
              <span>{{ $t('placeOrder.costPrompt') }}</span>
            </div>
          </el-tooltip>
          <span class="text-light">
            <span v-if="afterTradingCost">{{ afterTradingCost | bigNumberFormatter(collateralFormatDecimals) }}</span>
            {{ collateralTokenSymbol }}
          </span>
        </div>
      </div>
      <!-- price impact -->
      <div class="layout-item text-item" v-if="isShowPriceImpact">
        <div class="justify-text-item">
          <el-tooltip placement="top" :open-delay="400">
            <span class="tip-text">{{ $t('base.priceImpact') }}</span>
            <div slot="content">
              <span>{{ $t('placeOrder.pricePrompt') }}</span>
            </div>
          </el-tooltip>
          <span :class="[priceImpactColor]">
            <span v-if="tradePriceImpact">{{ tradePriceImpact | bigNumberFormatter(2) }}%</span>
          </span>
        </div>
      </div>
      <!-- fee -->
      <div class="layout-item text-item" v-if="isShowFeeText">
        <div class="justify-text-item">
          <span>{{ $t('base.fee') }}</span>
          <span class="text-light">
            <span v-if="afterTradingFee">{{ afterTradingFee | bigNumberFormatterByPrecision(2) }}</span>
            {{ collateralTokenSymbol }}
            <span v-if="tradeFeeRate">({{ tradeFeeRate.times(100) | bigNumberFormatterByPrecision(2) }}%)</span>
          </span>
        </div>
      </div>
      <!-- fee rebate -->
      <div class="layout-item text-item fee-rebate" v-if="isShowFeeRebate">
        <div class="justify-text-item">
          <el-tooltip placement="top" :open-delay="400">
            <span class="tip-text">{{ $t('base.feeRebate') }}</span>
            <div slot="content">
              <span class="fee-rebate-prompt" v-html="$t('placeOrder.feeRebatePrompt', {rebateRate: transactionMiningInfo ? transactionMiningInfo.rebateRate.times(100) : '?'})"></span>
            </div>
          </el-tooltip>
          <span>
            <span>{{ feeRebateSATORI | bigNumberFormatterByPrecision(2) }} SATORI </span>
            <span>(${{ feeRebate | bigNumberFormatterByPrecision(2) }})</span>
          </span>
        </div>
      </div>
      <!-- order gas line -->
      <div class="text-item layout-item" v-if="(isLimitOrderType || isStopOrderType) && isConnectedWallet">
        <div class="justify-text-item">
          <span>{{ $t('placeOrder.tradePanel.remainingOrderGas') }}</span>
          <span class="text-right flex-line">
            <span class="text-light">
              {{ remainingOrderGasBalance | bigNumberFormatter(nativeToken ? nativeToken.formatDecimals : 0) }}
              {{ nativeToken ? nativeToken.symbol : '' }}
            </span>
            <a href="#">
              <i class="iconfont icon-plus-frame-round icon-item" @click="isShowOrderGasDialog = true"></i>
            </a>
          </span>
        </div>
        <div class="layout-item line-error-tip" style="margin-top: 6px" v-if="isShowGasLineErrorTip">
          <div class="justify-text-line">
            <span>{{ gasLineErrorTipMsg }}</span>
            <span>
              <a @click="gasLineErrorTipMsg = ''">
                <i class="el-icon-close"></i>
              </a>
            </span>
          </div>
        </div>
      </div>
      <!-- advanced setting -->
      <div class="text-item text-right setting-button">
        <div @click="isShowAdvancedSetting = !isShowAdvancedSetting">
          {{ $t('placeOrder.tradePanel.advancedSetting') }}
          <i class="iconfont icon-arrow-up" :class="{ down: !isShowAdvancedSetting }"></i>
        </div>
      </div>
      <div class="advanced-setting">
        <el-collapse-transition>
          <div v-show="isShowAdvancedSetting">
            <!-- limit/stop order expire input -->
            <div class="radio-group-item" v-show="isLimitOrderType || isStopOrderType">
              <McRadio
                class="item"
                v-model="orderExpire"
                :items="['7', '30', '90']"
                suffix="D"
                :label="$t('base.expire')"
                :customPlaceholder="$t('base.custom')"
                :errors="orderExpireErrors"
                default-val="90"
              />
            </div>
            <!-- slippage tolerance input -->
            <div class="radio-group-item" v-show="isMarketOrderType">
              <McRadio
                v-model="slippageTolerance"
                class="item"
                :items="['0.1', '0.2', '0.5', '1']"
                suffix="%"
                :label="$t('base.slippageTolerance')"
                :customPlaceholder="$t('base.custom')"
                :errors="slippageToleranceErrors"
                :default-val="defaultSlippageTolerance"
                ref="slippageToleranceRef"
              />
            </div>
            <!-- min trade amount -->
            <div class="radio-group-item single-radio-group" v-show="isLimitOrderType || isStopOrderType">
              <McRadio
                v-if="showMinTradeAmount"
                v-model="minTradeAmount"
                class="item"
                :items="defaultMinTradeAmount === '' ? [] : [defaultMinTradeAmount]"
                :suffix="underlyingAssetSymbol"
                :suffix-margin="2"
                :label="$t('placeOrder.tradePanel.minTradeAmount').toString()"
                :customPlaceholder="$t('base.custom')"
                :errors="minTradeAmountErrors"
                :default-val="defaultMinTradeAmount"
                ref="minTradeAmountRef"
              />
            </div>
            <!-- safe max -->
            <div class="radio-group-item">
              <McRadio
                class="item"
                v-model="safeMax"
                :items="['90', '95', '99']"
                suffix="%"
                :label="$t('placeOrder.tradePanel.safeMax')"
                :customPlaceholder="$t('base.custom')"
                :errors="safeMaxErrors"
                default-val="95"
              />
            </div>
          </div>
        </el-collapse-transition>
      </div>
    </div>
    <OrderGasDialog :visible.sync="isShowOrderGasDialog"/>
    <OrderConfirmDialog
      :order-confirm-params="orderConfirmParams"
      :visible.sync="isShowOrderConfirm"
      :need-approve="needApproved"
      :liquidity-pool-storage="tradingLiquidityPoolStorage"
      :perpetual-property="tradingPerpetualProperty"
      :confirm-func="tradeConfirmEvent"
      :trade-state="tradeState"
      @closed="onClosedOrderConfirmDialog"
      :slippage.sync="setSlippageTolerance"
      :default-slippage="defaultSlippageTolerance"
    />
  </div>
</template>

<script lang="ts">
import { BigNumber } from 'bignumber.js'
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import AsyncComputed from '@romancow/vue-async-computed-decorator'
import { ORDER_SIDE, ORDER_TYPE } from '@/ts/types'
import { McRadio, McSimpleSlider } from '@/components'
import OrderConfirmDialog from '@/template/Dialogs/OrderConfirmDialog.vue'
import OrderGasDialog from '@/template/Dialogs/OrderGasDialog.vue'
import OrderTradeMixin from '@/template/components/Trade/orderTradeMixin'
import {
  NOTIFICATION_KEY,
  OrderApiRequestParams,
  OrderTypeParams,
  UnavailableWalletError,
  UserCanceledError,
} from '@/type'
import { _0, _1 } from '@mcdex/mai3.js'
import { BuildMarketTradeParams, BuildOrderApiParams } from '@/mixins'
import { ElForm } from 'element-ui/types/form'
import { TranslateResult } from 'vue-i18n'
import { validate } from '@/utils/validator'
import {
  ACCOUNT_EVENT,
  AUTH_EVENT,
  GLOBAL_NOTIFICATION_EVENT,
  PLACE_ORDER_EVENT,
  VUE_EVENT_BUS,
  WALLET_EVENT,
} from '@/event'
import { getReferralAddress, poolHasErrorOracle, toBigNumber } from '@/utils'
import { ORDER_MIN_DEPOSIT_GAS_BALANCE, ORDER_MIN_GAS_BALANCE } from '@/const'

@Component({
  components: {
    McRadio,
    OrderConfirmDialog,
    OrderGasDialog,
    McSimpleSlider,
  },
})
export default class OrderTrade extends Mixins(OrderTradeMixin) {
  @Prop({ required: true }) propOrderSide!: ORDER_SIDE
  @Prop({ required: true }) propOrderType!: ORDER_TYPE

  mounted() {
    this.isShowAdvancedSetting = false

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
      this.buttonIsLoading = false
    })
  }

  destroyed() {
    VUE_EVENT_BUS.off(ACCOUNT_EVENT.REFRESH_USER_DATA, this.onRefreshUserData)
    VUE_EVENT_BUS.emit(GLOBAL_NOTIFICATION_EVENT.HIDE, 'warn', NOTIFICATION_KEY.MarketClosedInfo)
    VUE_EVENT_BUS.emit(GLOBAL_NOTIFICATION_EVENT.HIDE, 'error', NOTIFICATION_KEY.OracleError)
  }

  ORDER_MIN_DEPOSIT_GAS_BALANCE = ORDER_MIN_DEPOSIT_GAS_BALANCE

  // input focus control
  triggerPriceInputIsFocus: boolean = false
  priceInputIsFocus: boolean = false
  amountInputIsFocus: boolean = false
  valueInputIsFocus: boolean = false

  private isShowAdvancedSetting: boolean = false
  private isShowOrderConfirm: boolean = false
  private isShowOrderGasDialog: boolean = false
  private buttonIsLoading: boolean = false
  private isTrading: boolean = false
  private showMinTradeAmount: boolean = true

  private tradeAmountErrorType: 'null' | 'insufficientMargin' | 'insufficientLiquidity'
    | 'openInterestError' | 'maxAvailableAmount' | 'limitOrderMinTradeAmount' = 'null'
  private gasLineErrorTipMsg: string = ''

  private slippageToleranceErrors: Array<TranslateResult> = []
  private orderExpireErrors: Array<TranslateResult> = []
  private minTradeAmountErrors: Array<TranslateResult> = []
  private safeMaxErrors: Array<TranslateResult> = []

  private tradeRule = {
    triggerPrice: [{ validator: this.validateInputNumber, trigger: 'change' }],
    price: [
      { validator: this.validateInputNumber, trigger: 'change' },
      { validator: this.validateInputStopLimitPrice, trigger: 'change' },
    ],
    amountValue: [{ validator: this.validateAmountValue, trigger: 'change' }],
  }

  get isShowGasLineErrorTip(): boolean {
    return this.gasLineErrorTipMsg !== ''
  }

  get isClosePosition(): boolean {
    return this.closeOnly && toBigNumber(this.amount).eq(this.position.abs())
  }

  get confirmDisabled(): boolean {
    if (this.buttonIsLoading) {
      return true
    }
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
    if (this.tradeAmountErrorType !== 'null') {
      return true
    }
    const validatorIsPass = this.formParamsValidatorIsPass
    if (!validatorIsPass || this.gasLineErrorTipMsg !== '' || this.isShowGasWaringText) {
      return true
    } else {
      return this.buttonIsLoading
    }
  }

  get isShowAmountSlider(): boolean {
    if (!this.maxTradableAmount || this.maxTradableAmount.isZero() || this.needAuth) {
      return false
    }
    return true
  }

  get isShowLiqPriceText(): boolean {
    if (!this.tradePanelIsNormalStatus || this.amountIsInvalid) {
      return false
    }
    if ((this.isLimitOrderType || this.isStopOrderType) && this.needAuth) {
      return false
    }
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

  get orderGasWarningText(): string {
    return this.$t('commonErrors.insufficientTradeGasBalanceColor', {
      amount: ORDER_MIN_DEPOSIT_GAS_BALANCE,
      symbol: this.nativeToken?.symbol || '',
    }).toString()
  }

  get isShowGasWaringText(): boolean {
    if (!this.amountIsInvalid && !this.valueIsInvalid &&
      (this.orderType === ORDER_TYPE.StopLimitOrder || this.orderType === ORDER_TYPE.LimitOrder)) {
      if (this.accountGasStorage && this.accountGasStorage.balance.lt(ORDER_MIN_GAS_BALANCE)) {
        return true
      }
    }
    return false
  }

  get isShowCloseOnlyCheckBox(): boolean {
    if (!this.tradePanelIsNormalStatus) {
      return false
    }
    if (!this.currentSideHasClosePosition) {
      return false
    }
    return true
  }

  get placeOrderButtonText(): string {
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

  get placeOrderButtonType(): string {
    if (this.isConnectedWallet) {
      if (this.needAuth) {
        return 'primary'
      }
      if (this.tradeIsShowPriceImpact && this.isMarketOrderType) {
        return 'danger'
      } else if (this.tradeIsShowPriceImpactOfWarning && this.isMarketOrderType) {
        return 'warning'
      } else {
        if (this.orderSide === ORDER_SIDE.Buy) {
          return 'blue'
        } else if (this.orderSide === ORDER_SIDE.Sell) {
          return 'orange'
        }
      }
    }
    return 'primary'
  }

  get isShowPriceImpact(): boolean {
    return !!(this.isMarketOrderType && !this.amountIsInvalid && this.afterTrading)
  }

  get tradeIsShowPriceImpact(): boolean {
    return !!(this.isShowPriceImpact && this.tradePriceImpact && this.tradePriceImpact.gt(5))
  }

  get tradeIsShowPriceImpactOfWarning(): boolean {
    return !!(this.isShowPriceImpact && this.tradePriceImpact && this.tradePriceImpact.gt(0.1) && this.tradePriceImpact.lte(5))
  }

  get price(): string {
    return this.tradeForm.price
  }

  set price(v: string) {
    this.tradeForm.price = v
    this.onPriceChanged()
  }

  get amount(): string {
    return this.tradeForm.amount
  }

  set amount(v: string) {
    this.tradeForm.amount = v
    this.onAmountChanged()
  }

  get value(): string {
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
      if (this.afterTrading) {
        this.tradeAmountErrorType = 'insufficientMargin'
      }
      return
    }
    this.tradeForm.amountProportion = val
    const amount = this.maxTradableAmount
      ?.times(val)
      .div(100)
      .toFixed(this.underlyingFormatDecimals, BigNumber.ROUND_DOWN) || ''
    this.tradeForm.amount = toBigNumber(amount).isZero() ? '' : amount
    this.computeValueByAmount()
  }

  get closeOnly(): boolean {
    return this.tradeForm.isCloseOnly
  }

  set closeOnly(v: boolean) {
    this.tradeForm.isCloseOnly = v
    this.onCloseOnlyChanged()
  }


  changeAmountByProportion() {
    this.setAmountProportion(this.tradeForm.amountProportion)
  }

  @AsyncComputed({
    watch: [
      'amount',
      'value',
      'price',
      'formParamsIsValid',
      'slippageTolerance',
      'orderExpire',
      'minTradeAmount',
      'safeMax',
      'walletBalance',
      'orders',
      // 'marketExpire',
    ],
  })
  get formValidatorStatus() {
    return this.placeOrderParamsCheck()
  }

  get formParamsValidatorIsPass(): boolean {
    if (this.formParamsIsValid) {
      const checkStatus = this.formValidatorStatus
      if (checkStatus) {
        return true
      }
    }
    return false
  }

  noticeErrorMsg(msg: string, title?: string) {
    this.$notify({
      type: 'error',
      title: title || this.$t('commonErrors.placeOrderError').toString(),
      message: msg,
      position: 'bottom-right',
      customClass: 'is-error',
    })
  }

  onAmountErrorSetMaxAmount() {
    if (!this.maxAvailableAmount) {
      this.amount = ''
    } else {
      if (this.closeOnly) {
        this.amount = this.maxTradableAmount?.toFixed() || ''
      } else {
        this.amount = this.maxAvailableAmount.toFixed()
      }
    }
  }

  onLimitOrderMinAmount() {
    if (!this.minTradeAmount) {
      this.amount = ''
    } else {
      this.amount = this.minTradeAmount
    }
  }

  resetFormFields() {
    const form = this.$refs.orderTradeForm as ElForm
    if (form) {
      form.resetFields()
    }
  }

  resetErrorTipMsg() {
    this.gasLineErrorTipMsg = ''
  }

  @Watch('propOrderSide', { immediate: true })
  onPropOrderSideChanged() {
    this.tradeForm.orderSide = this.propOrderSide
    this.tradeState = ''
    this.onStopOrderTypeSetDefaultCloseOnly()
  }

  @Watch('propOrderType', { immediate: true })
  onPropOrderTypeChanged() {
    this.orderType = this.propOrderType
    this.onStopOrderTypeSetDefaultCloseOnly()
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
    const ref = this.$refs.slippageToleranceRef as any
    if (ref) {
      ref.onValueChanged()
    }
  }

  @Watch('selectedPerpetualID', { immediate: true })
  onPerpetualChange() {
    this.loadDefaultSettingSucceeded = false
    this.tradingPerpetualID = this.selectedPerpetualID
    this.resetForm()
    this.tradeForm.orderSide = this.propOrderSide
    this.tradeAmountErrorType = 'null'
    this.resetFormFields()
    this.resetMinTradeAmountRadio()
    this.resetErrorTipMsg()
    this.tradeState = ''
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
    this.tradeAmountErrorType = 'null'
    // this.onAmountChanged()
    this.changeAmountByProportion()
  }

  @Watch('tradingPerpetualIsInverse', { immediate: true })
  onTradingPerpetualIsInverseChanged() {
    // amount / value inverse
    if (this.amountIsInvalid) {
      const price = toBigNumber(this.price)
      if (!price.isZero() && !price.isNaN() && this.price !== '') {
        this.price = _1.div(price).toFixed(this.priceFormatDecimals, this.priceFormatRound)
      }
      if (this.orderType === ORDER_TYPE.StopLimitOrder) {
        const triggerPrice = toBigNumber(this.tradeForm.triggerPrice)
        if (!triggerPrice.isZero() && this.tradeForm.triggerPrice !== '' && !triggerPrice.isNaN()) {
          this.tradeForm.triggerPrice = _1.div(triggerPrice).toFixed(this.priceFormatDecimals)
        }
      }
    } else {
      if (this.orderType === ORDER_TYPE.StopLimitOrder || this.orderType === ORDER_TYPE.LimitOrder) {
        const price = toBigNumber(this.price)
        if (!price.isZero() && !price.isNaN() && this.price !== '') {
          this.price = _1.div(price).toFixed(this.priceFormatDecimals, this.priceFormatRound)
        }
        if (this.orderType === ORDER_TYPE.StopLimitOrder) {
          const triggerPrice = toBigNumber(this.tradeForm.triggerPrice)
          if (!triggerPrice.isZero() && this.tradeForm.triggerPrice !== '' && !triggerPrice.isNaN()) {
            this.tradeForm.triggerPrice = _1.div(triggerPrice).toFixed(this.priceFormatDecimals)
          }
        }
      } else {
        // this.onAmountChanged()
        this.changeAmountByProportion()
      }
    }
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

  @Watch('isConnectedWallet')
  onConnectedWalletChange() {
    this.setAmountProportion(0) // reset slider
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
        this.refreshAmountSlider()
      }
    } else {
      if (Number(this.closePositionRatio) > 0) {
        // this.onAmountChanged()
        this.changeAmountByProportion()
      }
    }
  }

  @Watch('accountGasStorage', { deep: true })
  onGasBalanceChanged() {
    if (this.gasLineErrorTipMsg) {
      if (this.accountGasStorage && this.accountGasStorage.balance.gt(0)) {
        this.gasLineErrorTipMsg = ''
      }
    }
  }

  @Watch('tradingLiquidityPool', { immediate: true, deep: true })
  async onTradingLiquidityPoolChanged() {
    if (!this.tradingLiquidityPool || !this.tradingLiquidityPool.liquidityPoolStorage.isRunning) {
      return
    }
    if (poolHasErrorOracle(this.tradingLiquidityPool.liquidityPoolStorage)) {
      VUE_EVENT_BUS.emit(GLOBAL_NOTIFICATION_EVENT.SHOW, {
        type: 'error',
        key: NOTIFICATION_KEY.OracleError,
        i18nKey: 'globalNotification.oracleError',
      })
    } else {
      VUE_EVENT_BUS.emit(GLOBAL_NOTIFICATION_EVENT.HIDE, 'error', NOTIFICATION_KEY.OracleError)
    }
  }

  @Watch('needAuth')
  onAuthStatusChanged() {
    this.changeAmountByProportion()
  }

  onStopOrderTypeSetDefaultCloseOnly() {
    if (this.currentSideHasClosePosition && this.orderType === ORDER_TYPE.StopLimitOrder) {
      this.tradeForm.isCloseOnly = true
    }
 }

  refreshAmountSlider() {
    let amount = new BigNumber(this.tradeForm.amount)
    if (!amount.isFinite() || amount.lt(_0)) {
      return
    }
    if (!this.maxTradableAmount) {
      return
    }
    if (this.maxTradableAmount.isZero()) {
      this.tradeForm.amountProportion = 100
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
    let amountProportion = amount.div(maxTradableAmount).times(100)
    if (amountProportion.gt(100)) {
      amountProportion = new BigNumber(100)
    }
    this.tradeForm.amountProportion = amountProportion.toNumber()
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
    this.refreshAmountSlider()
  }

  onValueChanged() {
    this.computeAmountByValue()
    this.refreshAmountSlider()
  }

  onRefreshUserData() {
    this.buttonIsLoading = true
  }

  onSuccessRefresh() {
    if (!this.maxTradableAmount || this.maxTradableAmount.lte(0)) {
      this.closeOnly = false
      this.amount = ''
      this.tradeAmountErrorType = 'null'
    }
    const amount = Number(this.amount)
    if (this.maxTradableAmount && this.maxTradableAmount.gt(0) && !isNaN(amount)) {
      if (this.maxTradableAmount.lte(amount)) {
        if (this.maxTradableAmount.gt(this.inputMinTradeAmountByAmountDecimals)) {
          this.amount = this.maxTradableAmount.toFixed(this.underlyingFormatDecimals, BigNumber.ROUND_DOWN)
        } else {
          this.closeOnly= false
          this.amount = ''
          this.tradeAmountErrorType = 'null'
        }
      }
    }
  }

  onClosedOrderConfirmDialog() {
    if (!this.isTrading) {
      this.buttonIsLoading = false
    }
  }

  validateInputNumber(rule: any, value: string, callback: Function) {
    if (this.isSkipValidation) {
      callback()
      return
    }
    if (value === '') {
      callback()
      return
    }
    const valueFloat = Number(value)
    if (isNaN(valueFloat)) {
      callback(new Error(this.$t('commonErrors.inputNumberError').toString()))
    } else {
      callback()
    }
  }

  validateInputStopLimitPrice(rule: any, value: string, callback: Function) {
    if (this.isSkipValidation) {
      callback()
      return
    }
    if (this.orderType === ORDER_TYPE.StopLimitOrder) {
      const triggerPrice = Number(this.tradeForm.triggerPrice)
      if (isNaN(triggerPrice) || this.tradeForm.triggerPrice === '') {
        callback()
        return
      }
      const limitPrice = Number(this.price)
      if (this.orderSide === ORDER_SIDE.Buy) {
        if (triggerPrice > limitPrice) {
          callback(new Error(this.$t('placeOrder.tradePanel.stopLimitPriceBuyError').toString()))
        } else {
          callback()
        }
      }
      if (this.orderSide === ORDER_SIDE.Sell) {
        if (triggerPrice < limitPrice) {
          callback(new Error(this.$t('placeOrder.tradePanel.stopLimitPriceSellError').toString()))
        } else {
          callback()
        }
      }
    }
    callback()
  }

  validateAmountValue(rule: any, value: string, callback: Function) {
    // reset
    this.tradeAmountErrorType = 'null'

    // start check
    if (this.isSkipValidation) {
      if (this.hasInsufficientLiquidityError) {
        this.tradeAmountErrorType = 'insufficientLiquidity'
        // callback(new Error(this.$t('commonErrors.insufficientLiquidityError').toString()))
        callback()
        return
      }
      if (this.hasOpenInterestExceededError) {
        this.tradeAmountErrorType = 'openInterestError'
        // callback(new Error(this.$t('commonErrors.openInterestExceededError').toString()))
        callback()
        return
      }
      callback()
      return
    }

    if (this.amount === '' && this.value === '') {
      // the form is empty
      callback()
      return
    }

    const amountFloat = Number(this.amount)
    const valueFloat = Number(this.value)
    if (isNaN(valueFloat) || isNaN(amountFloat)) {
      // bad number
      callback(new Error(this.$t('commonErrors.inputNumberError').toString()))
      return
    }
    if (valueFloat < 0 || amountFloat < 0) {
      // bad number
      callback(new Error(this.$t('commonErrors.inputError').toString()))
      return
    }

    let newAmount = toBigNumber(this.amount)
    if (this.orderSide === ORDER_SIDE.Sell) {
      newAmount = newAmount.negated()
    }
    if (this.tradingPerpetualIsInverse) {
      newAmount = newAmount.negated()
    }

    if (this.hasInsufficientLiquidityError) {
      this.tradeAmountErrorType = 'insufficientLiquidity'
      callback()
      // callback(new Error(this.$t('commonErrors.insufficientLiquidityError').toString()))
      return
    }
    if (this.hasOpenInterestExceededError) {
      this.tradeAmountErrorType = 'openInterestError'
      // callback(new Error(this.$t('commonErrors.openInterestExceededError').toString()))
      callback()
      return
    }
    if (!this.afterTrading || !this.afterTradingResult || !this.tradingPerpetualStorage) {
      console.warn('FIXME: unknown error. afterTrading = null')
      callback()
      return
    }

    // limit order requires minTradeAmount
    if (this.orderType !== ORDER_TYPE.MarketOrder) {
      const minTradeAmount = new BigNumber(this.tradeForm.minTradeAmount)
      if (!newAmount.isZero() && newAmount.abs().lt(minTradeAmount)) {
        // callback(new Error(this.$t('placeOrder.tradePanel.minTradeAmountErr').toString()))
        this.tradeAmountErrorType = 'limitOrderMinTradeAmount'
        callback()
        return
      }
    }

    // mai3 compute max amount, check input amount value
    if (this.maxTradableAmount) {
      if (newAmount.abs().gt(this.maxTradableAmount)) {
        // callback(
        //   new Error(
        //     this.$t('placeOrder.tradePanel.tradeAmountErr', {
        //       amount: this.maxTradableAmount.toFixed(this.underlyingFormatDecimals, BigNumber.ROUND_DOWN),
        //       underlyingAssetSymbol: this.tradingPerpetualProperty?.underlyingAssetSymbol || '',
        //     }).toString()
        //   )
        // )
        this.tradeAmountErrorType = 'maxAvailableAmount'
        callback()
        return
      }
    }

    if (!this.afterTraderIsSafe) {
      this.tradeAmountErrorType = 'insufficientMargin'
      // callback(new Error(this.$t('commonErrors.insufficientMargin').toString()))
      callback()
      return
    }

    // done
    callback()
    return
  }

  @Watch('orderExpire')
  onOrderExpireChanged() {
    this.orderExpireErrors = validate([this.validateOrderExpire])
  }

  validateOrderExpire() {
    if (this.isSkipValidation) {
      return
    }
    const expire = Number(this.orderExpire)
    if (isNaN(expire) || expire < 0) {
      this.isShowAdvancedSetting = true
      return `${this.$t('base.expire').toString()} ${this.$t('commonErrors.inputError').toString()}`
    } else if (expire > 100) {
      this.isShowAdvancedSetting = true
      return this.$t('commonErrors.orderExpirationOutOfRangeError', { day: 100 }).toString()
    }
    return
  }

  @Watch('slippageTolerance')
  onSlippageToleranceChanged() {
    this.slippageToleranceErrors = validate([this.validateSlippageTolerance])
  }

  validateSlippageTolerance() {
    if (this.isSkipValidation) {
      return
    }
    const slippage = Number(this.slippageTolerance)
    if (isNaN(slippage) || slippage < 0) {
      this.isShowAdvancedSetting = true
      return this.$t('commonErrors.inputError').toString()
    } else if (slippage > 100) {
      this.isShowAdvancedSetting = true
      return this.$t('placeOrder.tradePanel.safeMaxError', { val: '100' }).toString()
    }
    return
  }

  @Watch('safeMax')
  onSafeMaxChanged() {
    this.safeMaxErrors = validate([this.validateSafeMax])
  }

  validateSafeMax() {
    if (this.isSkipValidation) {
      return
    }
    const safeMax = Number(this.safeMax)
    if (isNaN(safeMax) || safeMax < 0) {
      this.isShowAdvancedSetting = true
      return this.$t('commonErrors.inputError').toString()
    } else if (safeMax > 100) {
      this.isShowAdvancedSetting = true
      return this.$t('placeOrder.tradePanel.safeMaxError', { val: '100' }).toString()
    }
    return
  }

  @Watch('minTradeAmount')
  onMinTradeAmountChanged() {
    this.minTradeAmountErrors = validate([this.validateMinTradeAmount])
  }

  validateMinTradeAmount() {
    if (this.isSkipValidation) {
      return
    }
    const amount = Number(this.minTradeAmount)
    if (isNaN(amount) || amount <= 0) {
      this.isShowAdvancedSetting = true
      return this.$t('commonErrors.inputError').toString()
    }
    return
  }

  validateGasBalance() {
    if (this.orderType === ORDER_TYPE.LimitOrder || this.orderType === ORDER_TYPE.StopLimitOrder) {
      if (this.accountGasStorage && this.accountGasStorage.balance.lt(ORDER_MIN_GAS_BALANCE)) {
        this.gasLineErrorTipMsg = this.$t('commonErrors.insufficientTradeGasBalance', {
          amount: ORDER_MIN_DEPOSIT_GAS_BALANCE,
          symbol: this.nativeToken?.symbol || '',
        }).toString()
        return false
      }
    }
    this.gasLineErrorTipMsg = ''
    return true
  }

  // validate end

  async placeOrderParamsCheck(): Promise<boolean> {
    const formRef = this.$refs.orderTradeForm as ElForm
    let valid: boolean = false
    try {
      let result = true
      Object.keys(this.tradeRule).map((key) => {
        formRef.validateField(key, (message) => {
          result = result && !message
        })
      })
      valid = result
    } catch {
      valid = false
    }
    if (!valid) {
      return false
    }
    const slippageMsg = this.validateSlippageTolerance()
    if (slippageMsg) {
      return false
    }
    if (this.orderType !== ORDER_TYPE.MarketOrder) {
      const expireMgs = this.validateOrderExpire()
      if (expireMgs) {
        return false
      }
      const minTradeAmountMsg = this.validateMinTradeAmount()
      if (minTradeAmountMsg) {
        return false
      }
    }
    return true
  }

  onConnectedWalletEvent() {
    VUE_EVENT_BUS.emit(WALLET_EVENT.ShowConnectWallet)
  }

  async onMarketTradeEvent() {
    this.buttonIsLoading = true
    if (
      !this.contractAmount ||
      !this.tradeAccountAddress ||
      this.tradeAccountAddress === '' ||
      !this.tradingLiquidityPoolInfo ||
      !this.tradingLiquidityPoolStorage
    ) {
      this.noticeErrorMsg(`${this.$t('base.failed').toString()}: ${this.$t('commonErrors.walletError').toString()}`)
      this.buttonIsLoading = false
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
        if (err instanceof UserCanceledError) {
          this.noticeErrorMsg(this.$t('commonErrors.userCanceledTransaction').toString())
        } else if (err instanceof UnavailableWalletError) {
          this.noticeErrorMsg(this.$t('commonErrors.walletError').toString())
        } else {
          this.noticeErrorMsg(
            this.$t(err.helpKey || 'commonErrors.transactionFailedError', { message: err.message }).toString(),
            this.$t(err.helpCaptionKey).toString())
        }
        this.buttonIsLoading = false
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
  ): Promise<{ apiParams: OrderApiRequestParams | null, orderParams: BuildOrderApiParams } | null> {
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
        this.buttonIsLoading = false
        this.noticeErrorMsg(this.$t('commonErrors.getRelayerDataError').toString())
      },
      signErrCallback: (err: any) => {
        this.buttonIsLoading = false
        if (err instanceof UserCanceledError) {
          this.noticeErrorMsg(this.$t('commonErrors.userCanceledTransaction').toString())
        } else {
          this.noticeErrorMsg(this.$t('commonErrors.walletError').toString())
        }
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
    this.buttonIsLoading = true
    try {
      if (!this.tradingPerpetualStorage) {
        return
      }
      let params = await this.buildOrderRequestParamsDatas(orderType)
      if (!params || !params.apiParams) {
        return
      }
      await this.onPlaceApiOrder(params.apiParams, params.orderParams)
    } finally {
      this.buttonIsLoading = false
    }
  }

  async tradeConfirmEvent() {
    this.isTrading = true
    if (this.orderType === ORDER_TYPE.MarketOrder) {
      await this.onMarketTradeEvent()
    } else if (this.orderType === ORDER_TYPE.LimitOrder) {
      await this.onPlaceApiOrderEvent(ORDER_TYPE.LimitOrder)
    } else if (this.orderType === ORDER_TYPE.StopLimitOrder) {
      await this.onPlaceApiOrderEvent(ORDER_TYPE.StopLimitOrder)
    }
    this.isTrading = false
  }

  async placeOrderEvent() {
    if (this.isWrongNetwork || this.confirmDisabled) {
      return
    }
    if (!this.isConnectedWallet) {
      // connected wallet
      this.onConnectedWalletEvent()
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
      const gasBalanceStatus = this.validateGasBalance()
      if (!gasBalanceStatus) {
        return
      }
    }
    // order confirm dialog
    this.isShowOrderConfirm = true
  }
}
</script>

<style lang="scss" scoped>
@import '~@mcdex/style/common/var';

.order-trade {
  margin-top: -2px !important;
  width: 100%;

  a {
    cursor: pointer;
  }

  .warning-panel {
    background: rgba($--mc-color-error, 0.1);
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12px;
    margin-bottom: 10px;
    line-height: 18px;
    color: var(--mc-color-error);

    .click-button {
      color: var(--mc-color-error);
      cursor: pointer;
      text-decoration: underline;
    }

    ::v-deep {
      .value {
        color: var(--mc-color-error);
      }
    }
  }

  .option-warning-panel {
    background: rgba($--mc-color-error, 0.1);
    padding: 8px 12px;
    border-radius: var(--mc-border-radius-m);
    font-size: 12px;
    margin-top: 8px;
    line-height: 16px;
    color: var(--mc-color-error) !important;

    .click-value {
      text-decoration: underline;
      cursor: pointer;
    }
  }

  .top-info-box {
    .info-line {
      display: flex;
      justify-content: space-between;
      padding: 4px 0 12px 0;
      line-height: 20px;
      font-size: 12px;

      .label {
        display: flex;
        color: var(--mc-text-color);
      }

      .value {
        color: var(--mc-text-color-white);
      }

      i {
        font-size: 18px;
      }
    }

    .icon-wallet-bold {
      margin-right: 4px;
    }
  }

  ::v-deep .el-form-item {
    margin-bottom: 0;

    .input-box {
      &.input-box-focus {
        background: var(--mc-color-primary-gradient);
        height: 40px;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--mc-border-radius-m);
      }
    }

    .form-input {
      &.form-input-focus {
        border: unset;
        height: 38px;
        width: calc(100% - 2px) !important;
        border-radius: var(--mc-border-radius-m);
      }
    }

    .el-input--medium {
      height: 40px;
      padding: 0 12px;
    }

    .el-input__inner {
      height: 40px;
      line-height: 40px;
      font-size: 14px;
    }

    .el-form-item__label {
      width: 100%;
      text-align: left;
      font-size: 12px;
      line-height: 16px !important;
      padding: 0;
      color: var(--mc-text-color);
      margin-bottom: 4px;
    }
  }

  .custom-input-error {
    text-decoration: underline;
    cursor: pointer;

    ::v-deep {
      .value {
        color: var(--mc-text-color-white) !important;
      }

      .el-input {
        border-color: var(--mc-color-warning);
      }

      .el-form-item__content {
        line-height: 18px;
      }
    }

    color: var(--mc-color-warning);
  }

  .input-item {
    margin-bottom: 16px;
  }

  .justify-text-item {
    display: flex;
    justify-content: space-between;
    width: 100%;
    white-space: nowrap;
    height: 16px;
    line-height: 16px;
    align-items: center;
  }

  .justify-text-line {
    display: flex;
    justify-content: space-between;
    width: 100%;
    line-height: 16px;
  }

  .secondary-err-line {
    color: var(--mc-color-error);
    font-size: 14px;
  }

  .layout-item {
    margin: 0 0 8px 0;
  }

  .place-order-button {
    margin: 16px 0;
  }

  .text-item {
    font-size: 12px;
  }

  .slider-item {
    margin: 16px 11px;
    display: flex;
    align-items: center;

    .el-slider {
      flex: 1;
    }

    ::v-deep .el-button {
      width: 50px;
      height: 20px;
    }

    .slider-addon {
      width: 48px;
      margin-left: 12px;
    }
  }

  .change-info-item {
    display: flex;
    margin-top: 3px;
    height: 15px;
    align-items: center;

    .info-left {
      flex: 0.47;
      text-align: left;
    }

    .info-vertical-info {
      flex: 0.06;
      text-align: center;
    }

    .info-right {
      flex: 0.47;
    }
  }

  .input-radio-group-item {
    margin-top: 10px;
  }

  .radio-group-item {
    margin: 0 0 8px 0;
  }

  .single-radio-group {
    ::v-deep .radio-group {
      justify-content: flex-start;

      .custom {
        margin-left: calc(6%);
      }
    }
  }

  .icon-arrow-up {
    font-size: 16px;
  }

  .icon-arrow-up.down {
    display: inline-block;
    transform: rotate(-180deg);
  }

  .el-button {
    width: 100%;
  }

  .confirm-button {
    height: 40px;
    border-radius: 8px;
  }

  .text-right {
    text-align: right;
  }

  .flex-line {
    display: flex;
    align-items: center;
  }

  .setting-button {
    margin-top: 16px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    justify-content: flex-end;

    div {
      cursor: pointer;
      line-height: 16px;
      display: flex;
      align-items: center;

      .iconfont {
        margin-left: 8px;
        transition: all 0.3s;
      }
    }
  }

  ::v-deep .mc-radio-container {
    .radio-group {
      span,
      .custom {
        border-radius: 0.04rem;
      }
    }
  }

  .only-mc-radio {
    ::v-deep .mc-radio-container {
      .radio-group {
        .custom {
          width: 1.2rem;
        }

        .selected {
          border: unset;
        }
      }
    }
  }

  .vertical-line {
    display: inline-block;
    height: 12px;
    width: 1px;
    background-color: var(--mc-background-color-light);
  }


  .line-error-tip {
    font-size: 13px;
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

  .amount-error-button-msg {
    margin-top: 8px;
    padding: 8px 12px;
    font-size: 12px;
    background: rgba($--mc-color-error, 0.1);
    border-radius: var(--mc-border-radius-m);
    color: var(--mc-color-error);
    margin-bottom: 16px;
  }
}
</style>

<style lang="scss" scoped>
@import "~@mcdex/style/common/fantasy-var";

.satori-fantasy {
  .order-trade {
    ::v-deep .el-form-item {
      label {
        color: var(--mc-text-color);
      }
    }

    ::v-deep .el-input {
      border-radius: 8px;

      &.is-disabled .el-input__inner {
        color: var(--mc-text-color);
      }

      .el-input__suffix {
        color: var(--mc-text-color);
      }
    }

    .text-item {
      color: var(--mc-text-color);

      &.fee-rebate {
        color: var(--mc-color-blue);
      }
    }

    .text-light {
      color: var(--mc-text-color-white);
    }

    .single-checkbox {
      ::v-deep .el-checkbox__label {
        font-size: 13px;
        color: var(--mc-text-color);
        padding-left: 8px;
        line-height: 16px;
      }
    }

    .icon-item {
      margin-left: 4px;
      font-size: 16px;
      color: var(--mc-color-primary);
    }

    .line-error-tip {
      color: var(--mc-color-error);
    }

    ::v-deep .el-form-item__error {
      margin-top: 8px;
      padding: 8px 12px;
      font-size: 12px;
      background: rgba($--mc-color-error, 0.1);
      border-radius: var(--mc-border-radius-m);
    }


  }

  .fee-rebate-prompt ::v-deep  .rebate-rate {
    color: var(--mc-color-blue);
    font-weight: bold;
  }
}
</style>
