<template>
  <div>
    <el-dialog
      :title="title"
      append-to-body
      top="0"
      custom-class="is-round is-small change-margin-dialog"
      :close-on-click-modal="false"
      :visible.sync="currentVisible"
      @closed="dialogClosed"
    >
      <div slot="title">
        <span class="dialog-title">
          {{ title }}
          <span class="inverse-card"
                v-if="perpetualProperty ? perpetualProperty.isInverse : false">{{ $t('base.inverse') }}</span>
        </span>
      </div>
      <McLoading
        v-show="!showBody"
        :mask-color="'transparent'"
        :show-loading="loading"
        :min-show-time="500"
        :show-loading-text="false"
        @show="showBody = false"
        @hide="showBody = true"/>
      <template v-if="showBody">
        <div class="tabs-container">
          <McRadioTabs
            v-model="currentActiveType"
            :class="[currentActiveType]"
            :options="[
              {label: $t('base.add'), value: 'deposit'},
              {label: $t('base.remove'), value: 'withdraw'},
            ]"
          />
        </div>
        <div class="input-container">
          <template v-if="currentActiveType === 'deposit'">
            <div class="info-line">
              <span>{{ $t('base.amount') }}</span>
              <span>
                {{ $t('base.l2walletBalance') }}:
                {{ walletCollateral | bigNumberFormatter(collateralDecimals) }}
              </span>
            </div>
            <div class="input-line">
              <el-form size="medium" :model="form" :rules="formRule" ref="addForm" @submit.native.prevent>
                <el-form-item prop="depositAmount" :inline-message="true">
                  <el-input v-model="depositAmount" size="large" placeholder="0.0">
                    <template slot="suffix">
                      <TokenImageView :token="collateralTokenSymbol" :size="24"/>{{ collateralTokenSymbol }}
                    </template>
                  </el-input>
                </el-form-item>
              </el-form>
            </div>
            <div class="radio-line">
              <McRadioGroup v-model="depositAmountProportion"
                            :values="[25, 50, 75, 100]"
                            suffix="%"/>
            </div>
          </template>
          <template v-if="currentActiveType === 'withdraw'">
          <div class="info-line">
            <span>{{ $t('base.amount') }}</span>
            <span>
              {{ $t('base.availableMargin') }}:
              {{  withdrawableBalance | bigNumberFormatter(collateralDecimals) }}
            </span>
          </div>
          <div class="input-line">
            <el-form size="medium" :model="form" :rules="formRule" ref="removeForm" @submit.native.prevent>
              <el-form-item prop="withdrawAmount" :inline-message="true">
                <el-input v-model="withdrawAmount" size="large" placeholder="0.0" :disabled="position.isZero()">
                  <template slot="suffix">
                    <TokenImageView :token="collateralTokenSymbol" :size="24"/>{{ collateralTokenSymbol }}
                  </template>
                </el-input>
              </el-form-item>
            </el-form>
          </div>
            <div class="radio-line" v-if="!position.isZero()">
              <McRadioGroup v-model="withdrawAmountProportion"
                            :values="[25, 50, 75, 100]"
                            suffix="%"/>
            </div>
        </template>
        </div>
        <div class="position-box">
          <span class="label">{{ $t('base.position') }}</span>
          <span class="value">
            <span :class="sideClass" class="v-item">
              <span class="short">{{ $t('base.short') }}</span>
              <span class="long">{{ $t('base.long') }}</span>
            </span>
            <span class="v-amount v-item">
              {{ (position ? position.abs() : null) | bigNumberFormatter(underlyingDecimals) }} {{ underlyingAssetSymbol }}
            </span>
            <span class="v-value v-item">
              ({{ positionValue | bigNumberFormatter(collateralDecimals) }} {{ collateralTokenSymbol }})
            </span>
          </span>
        </div>
        <div class="info-panel">
          <table class="info-data">
              <tr>
                <td class="left-data">
                  <span>{{ $t('base.marginBalance') }}</span>
                </td>
                <td class="middle-data">
                    <span class="sub-text-item">
                      {{
                        accountComputed
                          ? accountComputed.marginBalance.plus(diffBalance || 0)
                          : null | bigNumberFormatter(collateralDecimals)
                      }}
                      {{ collateralTokenSymbol }}
                    </span>
                </td>
                <td class="right-data" v-if="diffBalance && !diffBalance.isZero()">
                  <PNNumber
                    class="suffix-text-item"
                    :number="diffBalance"
                    show-plus-sign
                    :decimals="collateralDecimals"
                  />
                </td>
              </tr>
            <tr>
              <td class="left-data">
                <el-tooltip placement="top" :open-delay="400">
                  <span class="tip-text">{{ $t('base.newTotalLeverage') }}</span>
                  <div slot="content">
                    <span v-html="$t('placeOrder.newTotalLeveragePrompt')"></span>
                  </div>
                </el-tooltip>
              </td>
              <td class="middle-data">
                <span class="sub-text-item">
                  {{
                    accountComputed ? accountComputed.leverage.plus(diffLeverage || 0) :
                      null | bigNumberFormatterTruncateByPrecision(2, 2)
                  }}x
                </span>
              </td>
              <td class="right-data" v-if="diffLeverage && !diffLeverage.isZero()">
                <PNNumber
                  v-show="!position.abs().eq(0)"
                  class="suffix-text-item"
                  :number="diffLeverage"
                  show-plus-sign
                  :decimals="2"
                  :suffix="'x'"
                />
              </td>
            </tr>
              <tr>
                <td class="left-data">
                  <el-tooltip placement="top" :open-delay="400">
                    <span class="tip-text">{{ $t('base.marginRatio') }}</span>
                    <div slot="content">
                      <span v-html="marginRatioToolTip"></span>
                    </div>
                  </el-tooltip>
                </td>
                <td class="middle-data">
                    <span class="sub-text-item">
                      {{
                        accountComputed ? accountComputed.marginRatio.plus(this.diffMarginRatio || 0).times(100) :
                          null | bigNumberFormatter(1)
                      }}%
                    </span>
                </td>
                <td class="right-data" v-if="diffMarginRatio && !diffBalance.isZero()">
                  <PNNumber
                    v-show="!position.abs().eq(0)"
                    class="suffix-text-item"
                    :number="diffMarginRatio.times(100)"
                    show-plus-sign
                    :decimals="1"
                    :suffix="'%'"
                  />
                </td>
              </tr>
              <tr>
                <td class="left-data">
                  <span>{{ $t('base.liquidationPrice') }}</span>
                </td>
                <td class="middle-data">
                  <span class="sub-text-item" v-if="position && position.abs().eq(0)"> -- </span>
                  <span class="sub-text-item" v-else-if="isInverse">
                    {{ liquidationPrice | bigNumberFormatter(collateralDecimals) }} {{ underlyingAssetSymbol }}
                  </span>
                  <span class="sub-text-item" v-else>
                    {{ liquidationPrice | bigNumberFormatter(collateralDecimals) }} {{ collateralTokenSymbol }}
                  </span>
                </td>
                <td class="right-data" v-if="diffLiqPrice && !diffBalance.isZero()">
                  <PNNumber
                    v-show="position && !position.abs().eq(0)"
                    class="suffix-text-item"
                    :number="diffLiqPrice"
                    show-plus-sign
                    :decimals="collateralDecimals"
                  />
                </td>
              </tr>
            </table>
        </div>
        <div class="button-container">
          <template v-if="actionType === 'deposit'">
            <McSteps ref="steps" :start-label="$t('base.add')">
              <template #start="prop">
                <el-button :disabled="disabledDeposit" size="medium" type="blue" :loading="prop.start.running"
                           @click="prop.start.start">{{ prop.start.label }}</el-button>
              </template>
                <McStepItem
                  v-for="(step, index) in steps"
                  :action="step.action"
                  :label="$t(step.labelKey, { collateral: step.collateral })"
                  :key="index"
                />
            </McSteps>
          </template>
          <template v-if="actionType === 'withdraw'">
            <el-button @click="confirmEvent" :loading="withdrawing" :disabled="disabledWithdraw" size="medium" type="orange">
              {{ $t('base.remove') }}
            </el-button>
          </template>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Ref, Watch } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { BigNumber } from 'bignumber.js'
import { DepositWithdrawMixin, ErrorHandlerMixin } from '@/mixins'
import { ElForm } from 'element-ui/types/form'
import { _0, _1, AccountDetails, AccountStorage, computeAccount } from '@mcdex/mai3.js'
import {
  McLoading,
  McSimpleSlider,
  McSimpleStep,
  PNNumber,
  McRadioTabs,
  McRadioGroup,
  TokenImageView,
} from '@/components'
import ChangeLeverageMixin from '@/template/components/ChangeLeverage/changeLeverageMixin'
import { isLongPosition, toBigNumber } from '@/utils'
import { ACCOUNT_EVENT, VUE_EVENT_BUS } from '@/event'
import McSteps from '@/components/Steps/McSteps.vue'
import McStepItem from '@/components/Steps/McStepItem.vue'

const wallet = namespace('wallet')
const perpetual = namespace('perpetual')
const account = namespace('account')

enum STEP_TYPE {
  APPROVE = 'ARRROVE',
  ADD = 'ADD',
  REMOVE = 'REMOVE',
}

@Component({
  components: {
    PNNumber,
    McLoading,
    McSimpleStep,
    McSimpleSlider,
    McStepItem,
    McSteps,
    McRadioTabs,
    McRadioGroup,
    TokenImageView
  },
})
export default class ChangeMarginDialog extends Mixins(DepositWithdrawMixin, ChangeLeverageMixin, ErrorHandlerMixin) {

  @Prop({ default: 'deposit' }) actionType!: 'deposit' | 'withdraw'
  @Prop({ default: false }) visible!: boolean
  @Prop({ default: '' }) inputDepositAmount!: string

  @Ref('addForm') addFormElement!: ElForm
  @Ref('removeForm') removeFormElement!: ElForm
  @Ref('steps') stepsElement!: McSteps

  private form = {
    depositAmount: '',
    depositAmountProportion: 0,
    withdrawAmount: '',
    withdrawAmountProportion: 0
  }

  private formRule = {
    depositAmount: [
      { validator: this.validateInputNumber, trigger: 'change' },
      { validator: this.validateDepositAmount, trigger: 'change' },
    ],
    withdrawAmount: [
      { validator: this.validateInputNumber, trigger: 'change' },
      { validator: this.validateWithdrawAmount, trigger: 'change' },
    ],
  }
  private showBody = true
  private approveError: Error | null = null
  private isHasApproved: boolean = false

  get steps(): Array<{ labelKey: string; type: STEP_TYPE; collateral?: string, action: () => Promise<void> }> {
    let steps = new Array<{ labelKey: string; type: STEP_TYPE; collateral?: string, action: () => Promise<void> }>()
    if (this.needApprove) {
      steps.push({
        labelKey: 'base.approve',
        type: STEP_TYPE.APPROVE,
        action: this.confirmApprove.bind(this),
      })
    }
    steps.push({ labelKey: 'base.add', type: STEP_TYPE.ADD, action: this.confirmEvent.bind(this) })
    return steps
  }

  get currentVisible() {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
  }

  get currentActiveType() {
    return this.actionType
  }

  set currentActiveType(val: string) {
    this.$emit('update:actionType', val)
  }

  get depositAmount(): string {
    return this.form.depositAmount
  }

  set depositAmount(val: string) {
    this.form.depositAmount = val
    const v = toBigNumber(val)
    if (!this.walletCollateral || v.isNaN() || this.walletCollateral.isZero() || v.isZero()) {
      this.form.depositAmountProportion = 0
    } else {
      this.form.depositAmountProportion = Number(v.div(this.walletCollateral).times(100).toFixed(
        0, BigNumber.ROUND_DOWN))
    }
  }

  get depositAmountProportion(): number {
    return this.form.depositAmountProportion
  }

  set depositAmountProportion(v: number) {
    this.form.depositAmountProportion = v
    if (!this.walletCollateral || this.walletCollateral.isZero()) {
      this.form.depositAmount = '0'
    } else {
      this.form.depositAmount = this.walletCollateral.times(v).div(100).toFixed(
        this.collateralDecimals || 0, BigNumber.ROUND_DOWN)
    }
  }

  get normalizeDepositAmount(): BigNumber | null {
    const result = new BigNumber(this.form.depositAmount)
    return result.isNaN() ? null : result
  }

  get withdrawAmount(): string {
    return this.form.withdrawAmount
  }

  set withdrawAmount(val: string) {
    this.form.withdrawAmount = val
    const v = toBigNumber(val)
    if (!this.withdrawableBalance || v.isNaN() || this.withdrawableBalance.isZero() || v.isZero()) {
      this.form.withdrawAmountProportion = 0
    } else {
      this.form.withdrawAmountProportion = Number(v.div(this.withdrawableBalance).times(100).toFixed(
        0, BigNumber.ROUND_DOWN))
    }
  }

  get withdrawAmountProportion(): number {
    return this.form.withdrawAmountProportion
  }

  set withdrawAmountProportion(v: number) {
    this.form.withdrawAmountProportion = v
    if (!this.withdrawableBalance || this.withdrawableBalance.isZero()) {
      this.form.withdrawAmount = '0'
    } else {
      if (this.position?.isZero()) {
        this.form.withdrawAmount = this.withdrawableBalance.toFixed()
      } else {
        this.form.withdrawAmount = this.withdrawableBalance.times(v).div(100).toFixed(
          this.collateralDecimals || 0, BigNumber.ROUND_DOWN)
      }
    }
  }

  get normalizeWithdrawAmount(): BigNumber | null {
    const result = new BigNumber(this.form.withdrawAmount)
    return result.isNaN() ? null : result
  }

  get underlyingDecimals() {
    return this.perpetualProperty?.underlyingAssetFormatDecimals || 0
  }

  get collateralTokenSymbol() {
    return this.perpetualProperty ? this.perpetualProperty.collateralTokenSymbol : '--'
  }

  get underlyingAssetSymbol() {
    return this.perpetualProperty ? this.perpetualProperty.underlyingAssetSymbol : '--'
  }

  get diffBalance(): BigNumber | null {
    if (!this.marginBalance) {
      return null
    }
    return this.actionType === 'deposit' ? this.normalizeDepositAmount : this.normalizeWithdrawAmount?.negated() || null
  }

  get afterLiquidityPrice(): BigNumber | null {
    return this.afterAccountDetail ? this.afterAccountDetail.accountComputed.liquidationPrice : null
  }

  get afterAccountStorage(): AccountStorage | null {
    if (!this.diffBalance || !this.accountStorage) {
      return null
    }
    return {
      ...this.accountStorage,
      cashBalance: this.accountStorage.cashBalance.plus(this.diffBalance),
    }
  }

  get afterAccountDetail(): AccountDetails | null {
    if (!this.afterAccountStorage || !this.liquidityPool || !this.perpetualProperty) {
      return null
    }

    return computeAccount(
      this.liquidityPool.liquidityPoolStorage,
      this.perpetualProperty.perpetualIndex,
      this.afterAccountStorage,
    )
  }

  get diffLiqPrice(): BigNumber | null {
    if (this.isInverse) {
      return this.afterLiquidityPrice && this.accountComputed
        ? _1.div(this.afterLiquidityPrice).minus(_1.div(this.accountComputed.liquidationPrice))
        : null
    }
    return this.afterLiquidityPrice && this.accountComputed
      ? this.afterLiquidityPrice.minus(this.accountComputed.liquidationPrice)
      : null
  }

  get liquidationPrice(): BigNumber | null {
    if (!this.accountComputed) {
      return null
    }
    if (this.isInverse) {
      return _1.div(this.accountComputed.liquidationPrice).plus(this.diffLiqPrice || 0)
    }
    return this.accountComputed.liquidationPrice.plus(this.diffLiqPrice || 0)
  }

  get afterMarginRatio(): BigNumber | null {
    return this.afterAccountDetail?.accountComputed.marginRatio || null
  }

  get diffMarginRatio(): BigNumber | null {
    return this.afterMarginRatio && this.accountComputed
      ? this.afterMarginRatio.minus(this.accountComputed.marginRatio)
      : null
  }

  get afterLeverage(): BigNumber | null {
    return this.afterAccountDetail?.accountComputed.leverage || null
  }

  get diffLeverage(): BigNumber | null {
    return this.afterLeverage && this.accountComputed
      ? this.afterLeverage.minus(this.accountComputed.leverage)
      : null
  }

  get title(): string {
    return this.$t('changeMarginDialog.caption', {
      symbol: this.perpetualProperty ? this.perpetualProperty.name : '',
    }).toString()
  }

  get disabledWithdraw() {
    return (
      this.diffBalance === null ||
      !this.normalizeWithdrawAmount ||
      !this.withdrawableBalance ||
      this.diffBalance.isNaN() ||
      this.diffBalance.isZero() ||
      this.withdrawing ||
      !this.canUserWithdraw ||
      this.normalizeWithdrawAmount.gt(this.withdrawableBalance) ||
      this.perpetualStateIsNotNormal
    )
  }

  get canUserWithdraw(): boolean {
    if (!this.perpetualStorage || !this.position) {
      return true
    }
    if (this.perpetualStorage.isMarketClosed && !this.position.isZero()) {
      return false
    }
    return true
  }

  get disabledDeposit() {
    return (
      this.depositing ||
      !this.diffBalance ||
      this.diffBalance.isNaN() ||
      this.diffBalance.isZero() ||
      this.perpetualStateIsNotNormal ||
      this.accountStorage?.positionAmount.eq(0) ||
      this.insufficientCollateral
    )
  }

  get disabledApprove() {
    return (
      !this.needApprove || !this.diffBalance || this.diffBalance.isNaN() || this.diffBalance.isZero() || this.approving
    )
  }

  get insufficientCollateral() {
    return !this.walletCollateral || !this.normalizeDepositAmount || this.normalizeDepositAmount.gt(this.walletCollateral)
  }

  get sideClass() {
    if (!this.position || this.position.isZero()) {
      return []
    }
    return isLongPosition(this.position, this.perpetualProperty?.isInverse) ? ['is-long'] : ['is-short']
  }

  get needApprove() {
    if (!this.diffBalance) {
      return false
    }
    return this.allowance?.lt(this.diffBalance) || false
  }

  get marginRatioToolTip(): string {
    return this.$t('placeOrder.marginRatioPrompt', {
      mmBalance: this.maintenanceMargin ? this.maintenanceMargin.toFixed(this.collateralDecimals || 0) : '0',
      marginBalance: this.marginBalance
        ? this.marginBalance.plus(this.diffBalance || 0).toFixed(this.collateralDecimals || 0)
        : '0',
      symbol: this.perpetualProperty?.collateralTokenSymbol || '',
    }).toString()
  }

  reset() {
    this.form = {
      depositAmount: '',
      depositAmountProportion: 0,
      withdrawAmount: '',
      withdrawAmountProportion: 0
    }
  }

  dialogClosed() {
    this.$emit('closed')
    this.stepsElement?.reset()
    this.reset()
  }

  validateInputNumber(rule: any, value: string, callback: Function) {
    if (value === '') {
      return
    }
    const valueFloat = Number(value)
    if (isNaN(valueFloat)) {
      callback(new Error(this.$t('commonErrors.inputError').toString()))
    } else if (valueFloat < 0) {
      callback(new Error(this.$t('commonErrors.inputError').toString()))
    } else {
      callback()
    }
  }

  validateDepositAmount(rule: any, value: string, callback: Function) {
    if (!this.normalizeDepositAmount || !this.walletCollateral) {
      callback()
      return
    }
    if (this.normalizeDepositAmount.gt(this.walletCollateral) || this.normalizeDepositAmount.lt(_0)) {
      callback(
        new Error(
          this.$t('commonErrors.exceedMaxAmountError', {
            max: this.walletCollateral.toFormat(this.collateralDecimals || 0),
          }).toString(),
        ),
      )
      return
    }
    callback()
  }

  validateWithdrawAmount(rule: any, value: string, callback: Function) {
    if (!this.normalizeWithdrawAmount || !this.withdrawableBalance) {
      callback()
      return
    }
    if (this.normalizeWithdrawAmount.gt(this.withdrawableBalance) || this.normalizeWithdrawAmount.lt(_0)) {
      callback(
        new Error(
          this.$t('commonErrors.exceedMaxAmountError', {
            max: this.withdrawableBalance.toFormat(this.collateralDecimals || 0),
          }).toString(),
        ),
      )
      return
    }
    callback()
  }

  async confirmEvent() {
    await this.callChainFunc(async () => {
      if (
        !this.perpetualID ||
        !this.signer ||
        !this.address ||
        !this.liquidityPool ||
        !this.perpetualProperty ||
        !this.diffBalance
      ) {
        return
      }
      try {
        let transactionResult
        if (this.diffBalance.lt(0)) {
          transactionResult = await this.withdraw(
            this.liquidityPool.liquidityPoolStorage,
            this.perpetualProperty,
            this.address,
            this.diffBalance.negated(),
            () => {
              this.currentVisible = false
            },
          )
        } else {
          transactionResult = await this.deposit(
            this.liquidityPool.liquidityPoolStorage,
            this.perpetualProperty,
            this.address,
            this.diffBalance,
            () => {
              this.currentVisible = false
            },
          )
        }
        this.$emit('success', 'success')
        await this.getData()
        VUE_EVENT_BUS.emit(ACCOUNT_EVENT.REFRESH_USER_DATA)
        return transactionResult
      } catch (e) {
        this.$emit('fail', 'fail')
        console.error(e)
        throw e
      }
    }, undefined, true)
  }

  async confirmApprove() {
    this.approveError = null
    await this.callChainFunc(async () => {
      if (
        !this.perpetualID ||
        !this.signer ||
        !this.address ||
        !this.liquidityPool ||
        !this.perpetualProperty ||
        !this.diffBalance
      ) {
        return
      }
      try {
        const transaction = await this.approve(
          this.liquidityPool.liquidityPoolStorage,
          this.perpetualProperty,
          this.address,
        )
        this.approveError = null
        return transaction
      } catch (e) {
        this.approveError = e
        throw e
      }
    }, undefined, true)
  }

  @Watch('currentVisible', { immediate: true })
  private updateWithdrawAmount() {
    if (this.position && this.position.isZero() && this.withdrawableBalance) {
      this.form.withdrawAmount = this.withdrawableBalance.toFixed()
      this.form.withdrawAmountProportion = 100
    }
  }

  @Watch('perpetualID')
  @Watch('signer')
  @Watch('address')
  @Watch('currentVisible')
  private async refresh() {
    if (!this.currentVisible || !this.perpetualID || !this.signer || !this.address) {
      return
    }
    await this.getDataFunc()
    if (
      this.inputDepositAmount !== '' &&
      Number(this.inputDepositAmount) > 0 &&
      !isNaN(Number(this.inputDepositAmount))
    ) {
      this.depositAmount = this.inputDepositAmount
    }
  }

  @Watch('currentVisible')
  private resetData() {
    if (!this.currentVisible) {
      this.form.depositAmount = ''
      this.form.withdrawAmount = ''
      this.approveError = null
      this.showBody = false
    }
  }

  @Watch('normalizeDepositAmount', { immediate: true })
  onApprove() {
    this.isHasApproved = this.needApprove ? this.needApprove : false
    this.stepsElement?.reset()
  }
}
</script>

<style lang="scss" scoped>
@import '~@mcdex/style/common/var';

.dialog-title {
  display: flex;
  align-items: center;
}

.change-margin-dialog {

  ::v-deep &.is-small {
    min-height: 558px;
  }

  .mc-loading {
    position: unset;
    height: 90%;
    width: 100%;

    ::v-deep .mc-loading__mask {
      top: 54px;
    }
  }

  .tabs-container {
    margin-top: 12px;
    margin-bottom: 24px;

    .mc-radio-tabs.deposit ::v-deep .active {
      color: var(--mc-color-blue);
    }

    .mc-radio-tabs.withdraw ::v-deep .active {
      color: var(--mc-color-orange);
    }
  }

  .input-container {
    width: 100%;
    background: var(--mc-background-color-darkest);
    border-radius: var(--mc-border-radius-l);
    padding: 16px;

    .info-line {
      font-size: 14px;
      color: var(--mc-text-color);
      display: flex;
      justify-content: space-between;
    }

    .input-line {
      margin: 12px 0 0;

      .el-form-item {
        margin-bottom: 0;
      }

      ::v-deep .el-input {
        background: transparent;
        border: unset;
        padding: 0;
        height: 30px;

        .el-input__inner {
          height: 30px;
          line-height: 30px;
          font-size: 24px;
          font-weight: 700;
        }

        .el-input__suffix-inner {
          font-size: 18px;
          color: var(--mc-text-color-white);
          display: flex;
          align-items: center;

          .token-image-view {
            margin-right: 8px;
          }
        }
      }

      ::v-deep {
        .is-disabled .el-input__inner {
          cursor: not-allowed;
        }
      }
    }

    .radio-line {
      margin-top: 12px;
    }
  }

  .position-box {
    display: flex;
    justify-content: space-between;
    font-size: 16px;
    margin: 16px 0;

    .label {
      color: var(--mc-text-color);
    }

    .value {
      display: flex;
      align-items: center;

      .v-item {
        margin-right: 4px;

        &:last-child {
          margin-right: 0;
        }
      }

      .v-amount {
        color: var(--mc-text-color-white);
      }

      .v-value {
        color: var(--mc-text-color);
      }
    }

    .is-long .long {
      display: inline-block;
    }

    .is-short .short {
      display: inline-block;
    }

    .short {
      color: var(--mc-color-orange);
      display: none;
    }

    .long {
      display: none;
      color: var(--mc-color-blue);
    }
  }

  .info-panel {
    padding: 16px;
    border: 1px solid var(--mc-border-color);
    border-radius: var(--mc-border-radius-l);

    .info-data {
      width: 100%;
      font-size: 14px;

      td {
        padding: 0 0 12px 0;
        line-height: 20px;
      }

      tr:last-child {
        td {
          padding-bottom: 0;
        }
      }

      .left-data {
        white-space: nowrap;
        color: var(--mc-text-color);
      }

      .middle-data {
        text-align: right;
      }

      .right-data {
        width: auto;
        max-width: 130px;
        padding-left: 8px;
        white-space: normal;
        color: var(--mc-text-color-white);
      }
    }
  }

  .button-container {
    margin-top: 24px;
    padding: 2px 0;

    .el-button {
      height: 56px;
      width: 100%;
      font-size: 16px;
      border-radius: var(--mc-border-radius-l);
    }
  }
}
</style>
