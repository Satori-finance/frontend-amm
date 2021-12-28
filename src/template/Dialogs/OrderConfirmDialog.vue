<template>
  <div>
    <el-dialog
      :title="confirmDialogTitle"
      append-to-body
      top="0"
      custom-class="is-small is-round"
      class="order-confirm-dialog"
      :close-on-click-modal="false"
      :visible.sync="currentVisible"
      @closed="dialogClosed"
    >
      <div class="info-container">
        <h1 :class="[orderSideLabelColor]">
          {{ orderSideLabel }} {{ orderConfirmParams.tradeSymbol }}
        </h1>
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
              {{ orderConfirmParams.amount | bigNumberFormatter(amountDecimals) }} {{ amountSymbol }}
              ({{ positionValue | bigNumberFormatter(orderConfirmParams.collateralDecimals) }} {{
                valueSymbol
              }})
            </span>
          </div>
          <div class="warning-line" v-if="isInsufficientLiquidity">
            <div class="left">
              <div class="icon-item"><i class="iconfont icon-warning-triangle"></i></div>
              <div class="text-item">{{ insufficientLiquidityWarning }}</div>
            </div>
            <div class="right">
              <el-button size="medium" class="accept-button" @click="toSetMaxTradeAmount">{{ $t('base.accept') }}</el-button>
            </div>
          </div>
          <div class="table-row" v-if="isMarketOrder">
            <span>{{ $t('base.priceImpact') }}</span>
            <span class="table-value">
              <span v-if="orderConfirmParams.priceImpact" :class="[priceImpactColor]">
                {{ orderConfirmParams.priceImpact | bigNumberFormatter(2) }}%
              </span>
            </span>
          </div>
          <div class="table-row">
            <span>
              <el-tooltip placement="top" :open-delay="400">
                <span class="tip-text">{{ $t('base.newTotalLeverage') }}</span>
                <div slot="content">
                  <span v-html="$t('placeOrder.newTotalLeveragePrompt')"></span>
                </div>
              </el-tooltip>
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
              <el-tooltip placement="top" :open-delay="400">
                <span class="tip-text">{{ $t('base.marginRatio') }}</span>
                <div slot="content">
                  <span v-html="marginRatioToolTip"></span>
                </div>
              </el-tooltip>
            </span>
            <span class="table-value">
              {{ marginRatio | bigNumberFormatter(1) }}%
            </span>
          </div>
          <div class="table-row">
            <span>{{ $t('orderConfirmDialog.liqPrice') }}</span>
            <span class="table-value">
              {{ orderConfirmParams.liqPrice | bigNumberFormatter(priceDecimals) }} {{ priceUnit }}
            </span>
          </div>
          <div class="table-row" v-if="isMarketOrder && orderConfirmParams.isClosePosition">
            <el-tooltip :content="$t('orderConfirmDialog.realizePnlPrompt')" placement="top" :open-delay="400">
              <span>{{ $t('orderConfirmDialog.realizePnl') }}</span>
            </el-tooltip>
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
            <span class="table-value">
              {{ setSlippageTolerance }} %
            </span>
          </div>
        </div>
        <div v-show="isMarketOrder">
          <McRadio v-model="setSlippageTolerance" :default-val="defaultSlippage"
                   :items="['0.1', '0.2', '0.5', '1']" suffix="%"
                   :errors="slippageToleranceErrors"
                   :disabled="inputRadioIsDisabled"
                   ref="slippageRadioRef" />
        </div>
      </div>
      <div class="footer">
        <div class="footer-button">
          <McSteps ref="steps" @start="inputRadioIsDisabled = true" @finish="inputRadioIsDisabled = false" @success="currentVisible = false">
            <template #start="prop">
              <el-button @click="prop.start.start" class="confirm-btn" size="medium" :type="confirmButtonType"
                         :disabled="prop.start.success || buttonIsDisabled">
                <template v-if="prop.start.failed">{{ $t('base.retry') }}</template>
                <span v-if="tradeIsShowPriceImpact && $i18n.locale === 'zh-CN'">{{ $t('base.anyway') }}</span>
                {{ confirmButtonText }}
                <span v-if="tradeIsShowPriceImpact && $i18n.locale !== 'zh-CN'">{{ $t('base.anyway') }}</span>
                <i v-if="prop.start.running" class="el-icon-loading"></i>
              </el-button>
            </template>
            <McStepItem v-for="(step, index) in steps" :label="step.label" :action="step.action"
                        :key="index"></McStepItem>
          </McSteps>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Ref, Watch } from 'vue-property-decorator'
import OrderConfirmMixin from '@/template/components/Trade/orderConfirmMixin'
import { ORDER_SIDE } from '@/ts'
import { McStepItem, McSteps, PNNumber, McRadio } from '@/components'
import { toBigNumber, validate } from '@/utils'
import { TranslateResult } from 'vue-i18n'

@Component({
  components: {
    McSteps,
    McStepItem,
    PNNumber,
    McRadio,
  },
})
export default class OrderConfirmDialog extends Mixins(OrderConfirmMixin) {
  @Prop({ default: false }) visible!: boolean

  @Ref('steps') stepsElements!: McSteps

  private slippageToleranceErrors: Array<TranslateResult> = []

  get currentVisible() {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
  }

  private propNeedApprove: boolean = false
  private inputRadioIsDisabled: boolean = false

  get steps() {
    const result = [
      { label: this.$t('base.confirm'), action: this.onConfirmEvent.bind(this) },
    ]
    if (this.propNeedApprove) {
      result.unshift({ label: this.$t('base.approve'), action: this.onApproveEvent.bind(this) })
    }
    return result
  }

  get buttonIsDisabled(): boolean {
    return !this.isConnectedWallet || toBigNumber(this.setSlippageTolerance).gt(100) || this.isInsufficientLiquidity
      || this.orderConfirmParams.amount.isZero()
  }

  get confirmButtonType(): string {
    if (this.orderConfirmParams.priceImpact && this.orderConfirmParams.priceImpact.gt(5) && this.isMarketOrder) {
      return 'danger'
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
    return 'primary'
  }

  get confirmDialogTitle(): string {
    if (this.isMarketOrder) {
      return this.$t('orderConfirmDialog.ammOrderConfirmation').toString()
    }
    return this.$t('orderConfirmDialog.orderConfirmation').toString()
  }

  get orderSideLabelColor(): string {
    if (this.orderConfirmParams.orderSide === ORDER_SIDE.Buy) {
      return 'blue-color'
    }
    if (this.orderConfirmParams.orderSide === ORDER_SIDE.Sell) {
      return 'orange-color'
    }
    return ''
  }

  dialogClosed() {
    this.confirmClosed()
    this.stepsElements?.reset()
    this.$emit('closed')
  }

  async onConfirmEvent() {
    await this.onConfirm()
    if (this.tradeState === 'success') {
      this.currentVisible = false
    }
  }

  @Watch('setSlippageTolerance')
  onSlippageToleranceChanged() {
    this.slippageToleranceErrors = validate([this.validateSlippageTolerance])
  }

  validateSlippageTolerance() {
    const slippage = Number(this.setSlippageTolerance)
    if (isNaN(slippage) || slippage < 0) {
      return this.$t('commonErrors.inputError').toString()
    } else if (slippage > 100) {
      return this.$t('placeOrder.tradePanel.safeMaxError', { val: '100' }).toString()
    }
    return
  }

  @Watch('currentVisible', { immediate: true })
  onCurrentVisibleChanged() {
    this.propNeedApprove = this.needApprove
    if (this.currentVisible) {
      // delayed loading
      window.setTimeout(() => {
        const slippageRadioRef = this.$refs.slippageRadioRef as McRadio
        if (slippageRadioRef) {
          slippageRadioRef.onValueChanged()
        }
      }, 100)
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~@mcdex/style/common/var';
.order-confirm-dialog {
  ::v-deep .el-dialog {
    .el-dialog__body {
      .info-container {
        h1 {
          text-align: center;
          font-size: 18px;
          margin-bottom: 20px;
          font-weight: 400;
          padding-top: 12px;
        }

        .table {
          .table-row {
            display: flex;
            justify-content: space-between;
            margin: 12px 0;
            font-size: 14px;
            line-height: 20px;

            &:last-child {
              margin: 8px 0;
            }
          }
        }
      }
    }

    .footer {
      margin-top: 24px;

      .footer-button {
        text-align: center;

        .el-button {
          width: 100%;
          height: 56px;
          font-size: 16px;
          border-radius: 12px;
        }
      }

      .mc-steps {
        ::v-deep .mc-step-items {
          padding: 6px;
        }
      }
    }
  }

  .warning-line {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    padding: 8px 12px;
    border-radius: 12px;
    height: 56px;
    align-items: center;

    .left {
      display: flex;
      margin-right: 12px;
      justify-items: center;

      .icon-item {
        display: flex;
        align-items: center;
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
      border-radius: 8px;
    }
  }

  ::v-deep .input-radio-group {
    .input-radio-item {
      font-size: 16px;
      height: 40px;
      border-radius: var(--mc-border-radius-l)
    }

    .custom-input-item {
      height: 40px;
      border-radius: var(--mc-border-radius-l);
      font-size: 16px;

      .el-input {
        font-size: 16px;
        height: 38px;
        border-radius: var(--mc-border-radius-l);
      }

      .el-input__inner {
        font-size: 16px;
        height: 38px;
        line-height: 40px;
      }

      .el-input__suffix-inner {
        font-size: 16px;
      }
    }
  }
}
</style>

<style scoped lang="scss">
@import '~@mcdex/style/common/var';
.satori-fantasy {
  .order-confirm-dialog {
    ::v-deep .el-dialog {
      .el-dialog__body {
        .info-container {

          .table {
            .table-row {
              color: var(--mc-text-color);
            }

            .table-value {
              color: var(--mc-text-color-white);
            }
          }
        }

        .blue-color {
          color: var(--mc-color-blue) !important;
        }

        .orange-color {
          color: var(--mc-color-orange) !important;
        }
      }
    }

    .warning-line {
      background: rgba($--mc-color-warning, 0.1);

      .left {
        color: var(--mc-color-warning);
      }

      .accept-button {
        background: var(--mc-color-success-gradient);
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

    .input-error-message {
      font-size: 14px;
      padding: 12px 16px;
    }
  }
}
</style>
