<template>
  <div class="order-confirm-popup">
    <van-popup
      v-model="showPopup"
      closeable
      position="bottom"
      round
      class="safe-area-inset-bottom"
      safe-area-inset-bottom
      :close-on-click-overlay="false"
      @close="onPopupClosed"
      ref="fixedDom"
    >
      <div class="popup-header">{{ confirmPopupTitle }}</div>
      <div class="popup-container">
        <div class="info-container">
          <h1 :class="[orderSideLabelColor]">{{ orderSideLabel }} {{ orderConfirmParams.tradeSymbol }}</h1>
          <div class="table">
            <div class="table-row">
              <span>{{ $t('base.type') }}</span>
              <span class="table-value">{{ orderType }}</span>
            </div>
            <div class="table-row" v-if="isStopLimitOrder">
              <span>{{ $t('orderConfirmDialog.triggerPrice') }}</span>
              <span class="table-value">
                {{ triggerPrice | bigNumberFormatter(priceDecimals) }} {{ priceUnit }}
              </span>
            </div>
            <div class="table-row">
              <span>{{ isMarketOrder ? $t('base.price') : $t('orderConfirmDialog.limitPrice') }}</span>
              <span class="table-value">
                {{ orderConfirmParams.price | bigNumberFormatter(priceDecimals) }} {{ priceUnit }}
              </span>
            </div>
            <div class="table-row">
              <span>{{ $t('base.amount') }}</span>
              <span class="table-value">
                {{ orderConfirmParams.amount | bigNumberFormatter(amountDecimals) }} {{ amountSymbol }} ({{
                  positionValue | bigNumberFormatter(orderConfirmParams.collateralDecimals)
                }}
                {{ valueSymbol }})
              </span>
            </div>
            <div class="warning-line" v-if="isInsufficientLiquidity">
              <div class="left">
                <div class="icon-item"><i class="iconfont icon-warning-triangle"></i></div>
                <div class="text-item">{{ insufficientLiquidityWarning }}</div>
              </div>
              <div class="right">
                <van-button class="accept-button round__medium" size="small" @click="toSetMaxTradeAmount">{{
                  $t('base.accept')
                }}</van-button>
              </div>
            </div>
            <div class="table-row">
              <McMTooltip :content="$t('placeOrder.pricePrompt')">
                <span>{{ $t('base.priceImpact') }}</span>
              </McMTooltip>
              <span class="table-value">
                <span v-if="orderConfirmParams.priceImpact" :class="[priceImpactColor]">
                  {{ orderConfirmParams.priceImpact | bigNumberFormatter(2) }}%
                </span>
              </span>
            </div>
            <div class="table-row">
              <span>
                <McMTooltip>
                  {{ $t('base.newTotalLeverage') }}
                  <template slot="content">
                    <span v-html="$t('placeOrder.newTotalLeveragePrompt')"></span>
                  </template>
                </McMTooltip>
              </span>
              <span class="table-value">
                <template v-if="newTotalLeverage.gt(0)">
                  {{ newTotalLeverage | bigNumberFormatterTruncateByPrecision(2,2) }}x
                </template>
                <template v-else>{{$t('placeOrder.positionWillClose')}}</template>
              </span>
            </div>
            <div class="table-row">
              <span>
                <McMTooltip>
                  {{ $t('base.marginRatio') }}
                  <template slot="content">
                    <span v-html="marginRatioToolTip"></span>
                  </template>
                </McMTooltip>
              </span>
              <span class="table-value"> {{ marginRatio | bigNumberFormatter(1) }}% </span>
            </div>
            <div class="table-row">
              <span>{{ $t('orderConfirmDialog.liqPrice') }}</span>
              <span class="table-value">
                {{ orderConfirmParams.liqPrice | bigNumberFormatter(priceDecimals) }} {{ priceUnit }}
              </span>
            </div>
            <div class="table-row" v-if="isMarketOrder && orderConfirmParams.isClosePosition">
              <McMTooltip :content="$t('placeOrder.realizePnlPrompt')">
                <span>{{ $t('orderConfirmDialog.realizePnl') }}</span>
              </McMTooltip>
              <span class="table-value">
                <PNNumber
                  v-if="orderConfirmParams.closePositionPnl"
                  :number="orderConfirmParams.closePositionPnl"
                  :decimals="orderConfirmParams.collateralDecimals"
                  show-plus-sign
                />
                {{ orderConfirmParams.collateralSymbol }}
              </span>
            </div>
            <div class="table-row" v-show="isMarketOrder">
              <span>{{ $t('base.slippageTolerance') }}</span>
              <span class="table-value"> {{ setSlippageTolerance }} % </span>
            </div>
            <div v-show="isMarketOrder">
              <McMInputRadio
                v-model="setSlippageTolerance"
                :default-val="defaultSlippage"
                :items="['0.1', '0.2', '0.5', '1']"
                :fixed-dom="fixedDom"
                suffix="%"
                :show-error-line="true"
                :validate-messages="slippageToleranceErrors"
                ref="slippageRadioRef"
              />
            </div>
          </div>
        </div>
        <div class="footer-button">
          <McMSteps ref="steps" @success="onSuccess" @error="currentTradeState = 'fail'">
            <template #start="prop">
              <McMStateButton
                :button-class="['large', 'round', confirmButtonType]"
                :state="prop.start.running ? 'loading' : ''"
                @click="prop.start.start"
                :disabled="buttonIsDisabled"
              >
                <template v-if="prop.start.failed">{{ $t('base.retry') }}</template>
                <span v-if="tradeIsShowPriceImpact && $i18n.locale === 'zh-CN'">{{ $t('base.anyway') }}</span>
                {{ confirmButtonText }}
                <span v-if="tradeIsShowPriceImpact && $i18n.locale !== 'zh-CN'">{{ $t('base.anyway') }}</span>
              </McMStateButton>
            </template>
            <McMStepItem
              v-for="(step, index) in steps"
              :label="step.label"
              :action="step.action"
              :key="index"
            ></McMStepItem>
          </McMSteps>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Ref, Watch } from 'vue-property-decorator'
import OrderConfirmMixin from '@/template/components/Trade/orderConfirmMixin'
import { McMStateButton, McMTooltip, McMInputRadio, McMSteps, McMStepItem } from '@/mobile/components'
import { ORDER_SIDE } from '@/ts'
import { PNNumber, McInputRadio } from '@/components'
import { ButtonState } from '@/type'
import { toBigNumber } from '@/utils'

@Component({
  components: {
    McMStateButton,
    McMSteps,
    McMStepItem,
    McMTooltip,
    PNNumber,
    McMInputRadio,
  },
})
export default class OrderConfirmPopup extends Mixins(OrderConfirmMixin) {
  @Prop({ required: true }) visible !: boolean

  @Ref('steps') stepsElement!: McMSteps

  private slippageToleranceErrors: Array<string> = []

  fixedDom: any = null

  mounted() {
    this.fixedDom = this.$refs.fixedDom
  }

  get showPopup(): boolean {
    return this.visible
  }

  set showPopup(val: boolean) {
    this.$emit('update:visible', val)
  }

  get steps() {
    const result = [
      { label: this.$t('base.confirm'), action: this.onConfirmEvent.bind(this) },
    ]
    if (this.propNeedApprove) {
      result.unshift({ label: this.$t('base.approve'), action: this.onApproveEvent.bind(this) })
    }
    return result
  }

  get confirmPopupTitle(): string {
    if (this.isMarketOrder) {
      return this.$t('orderConfirmDialog.ammOrderConfirmation').toString()
    }
    return this.$t('orderConfirmDialog.orderConfirmation').toString()
  }

  private propNeedApprove: boolean = false

  get orderSideLabelColor(): string {
    if (this.orderConfirmParams.orderSide === ORDER_SIDE.Buy) {
      return 'buy-color'
    }
    if (this.orderConfirmParams.orderSide === ORDER_SIDE.Sell) {
      return 'sell-color'
    }
    return ''
  }

  get confirmButtonType(): string {
    if (this.orderConfirmParams.priceImpact && this.orderConfirmParams.priceImpact.gt(5) && this.isMarketOrder) {
      return 'error'
    }
    if (this.orderConfirmParams.priceImpact && this.orderConfirmParams.priceImpact.gt(0.1) && this.orderConfirmParams.priceImpact.lte(5) && this.isMarketOrder) {
      return 'warning'
    }
    if (this.orderConfirmParams.orderSide === ORDER_SIDE.Buy) {
      return 'blue'
    }
    if (this.orderConfirmParams.orderSide === ORDER_SIDE.Sell) {
      return 'orange'
    }
    return ''
  }

  get buttonIsDisabled(): boolean {
    return !this.isConnectedWallet || toBigNumber(this.setSlippageTolerance).gt(100) || this.isInsufficientLiquidity
      || this.orderConfirmParams.amount.isZero()
  }

  get currentTradeState(): ButtonState {
    return this.tradeState
  }

  set currentTradeState(val: ButtonState) {
    this.$emit('update:tradeState', val)
  }

  onPopupClosed() {
    this.confirmClosed()
    this.$emit('closed')
  }

  async onConfirmEvent() {
    await this.onConfirm()
  }

  onSuccess() {
    this.$nextTick(() => {
      this.currentTradeState = 'success'
      this.stepsElement.reset()
      this.showPopup = false
    })
  }

  @Watch('setSlippageTolerance')
  onSlippageToleranceChanged() {
    this.slippageToleranceErrors = [this.validateSlippageTolerance()]
  }

  validateSlippageTolerance() {
    const slippage = Number(this.setSlippageTolerance)
    if (isNaN(slippage) || slippage < 0) {
      return this.$t('commonErrors.inputError').toString()
    } else if (slippage > 100) {
      return this.$t('placeOrder.tradePanel.safeMaxError', { val: '100' }).toString()
    }
    return ''
  }

  @Watch('showPopup', { immediate: true })
  onShowPopupChanged() {
    this.propNeedApprove = this.needApprove
    if (this.showPopup) {
      // delayed loading
      window.setTimeout(() => {
        const slippageRadioRef = this.$refs.slippageRadioRef as McInputRadio
        if (slippageRadioRef) {
          slippageRadioRef.onValueChanged()
        }
      }, 100)
    }
  }
}
</script>

<style scoped lang="scss">
@import '~@mcdex/style/common/var';

.order-confirm-popup {
  .safe-color-text {
    color: var(--mc-color-success);
  }

  .warning-color-text {
    color: var(--mc-color-warning);
  }

  .unsafe-color-text {
    color: var(--mc-color-error);
  }

  ::v-deep {
    .van-popup {
      padding: 16px;
    }
  }

  .popup-container {
    padding: 28px 0 0 0;
  }

  .info-container {
    h1 {
      text-align: center;
      font-size: 18px;
      margin-bottom: 24px;
      line-height: 24px;
      font-weight: 400;
    }

    .table {
      .table-row {
        display: flex;
        justify-content: space-between;
        margin: 12px 0 8px;
        color: var(--mc-text-color);
        font-size: 14px;
        line-height: 20px;
      }

      .table-value {
        color: var(--mc-text-color-white);
      }
    }

    ::v-deep .end-item {
      width: 34.5%!important;
    }
  }

  .warning-line {
    display: flex;
    justify-content: space-between;
    background: rgba($--mc-color-warning, 0.1);
    font-size: 14px;
    padding: 8px 12px;
    border-radius: 12px;
    height: 56px;
    align-items: center;

    .left {
      display: flex;
      margin-right: 12px;
      color: var(--mc-color-warning);
      justify-items: center;

      .icon-item {
        display: flex;
        align-items: center;
        width: 24px;
      }

      .text-item {
        display: flex;
        align-items: center;
      }

      i {
        font-size: 18px;
        margin-right: 8px;
      }
    }

    .accept-button {
      width: 61px;
    }
  }

  .know-checkbox {
    margin-top: 24px;
  }

  .buy-color {
    color: var(--mc-color-blue) !important;
  }

  .sell-color {
    color: var(--mc-color-orange) !important;
  }

  .footer-button {
    margin-top: 24px;
    text-align: center;

    ::v-deep {
      .van-button {
        width: 100%;
      }
    }
  }
}
</style>
