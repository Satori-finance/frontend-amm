<template>
  <div class="perpetual-margin">
    <McMRadioGroupTabs v-model="currentSelectedRadio" :options="radioOptions"/>
    <div class="operating-panel">
      <template v-if="selectedRadio === 'deposit'">
        <div class="input-container">
          <van-skeleton :row="3" :loading="loadingData">
            <div class="label-line">
              <span>{{ $t('base.amount') }}</span>
              <span>
                {{ isBSC ? $t('base.walletBalance') : $t('base.l2walletBalance') }}
                {{ walletCollateral | bigNumberFormatter(collateralDecimals) }}
              </span>
            </div>
            <div class="form-box">
              <van-form validate-first>
                <McMNumberField
                  v-model="depositForm.amount"
                  @input="depositForm.amountProportion = 0"
                  placeholder="0.0"
                  :rules="depositRules.amount"
                  autocomplete="off"
                >
                  <div slot="right-icon" class="right-icon">
                    <McMTokenImageView :size="24" :token="perpetualProperty.collateralTokenSymbol" />
                    <div>{{ perpetualProperty ? perpetualProperty.collateralTokenSymbol : '' }}</div>
                  </div>
                </McMNumberField>
              </van-form>
            </div>
            <div class="proportion-box">
              <McMButtonRadioGroup
                :value="depositForm.amountProportion"
                @input="onDepositProportionChange"
                :values="[25, 50, 75, 100]"
                suffix="%"
                :class="[radioGroupSelectedClass]"
              />
            </div>
          </van-skeleton>
        </div>
      </template>
      <template v-if="selectedRadio === 'withdraw'">
        <div class="input-container">
          <van-skeleton :row="3" :loading="loadingData">
            <div class="label-line">
              <span>{{ $t('base.amount') }}</span>
              <span>
                {{ $t('base.balance') }}
                {{ withdrawableBalance | bigNumberFormatter(collateralDecimals) }}
              </span>
            </div>
            <div class="form-box">
              <van-form validate-first>
                <McMNumberField
                  v-model="withdrawForm.amount"
                  @input="withdrawForm.amountProportion = 0"
                  placeholder="0.0"
                  :rules="withdrawRules.amount"
                  autocomplete="off"
                  :disabled="position.isZero()"
                >
                  <div slot="right-icon" class="right-icon">
                    <McMTokenImageView :size="24" :token="perpetualProperty.collateralTokenSymbol" />
                    <div>{{ perpetualProperty ? perpetualProperty.collateralTokenSymbol : '' }}</div>
                  </div>
                </McMNumberField>
              </van-form>
            </div>
            <div class="proportion-box" v-if="!position.isZero()">
              <McMButtonRadioGroup
                :value="withdrawForm.amountProportion"
                @input="onWithdrawProportionChange"
                :values="[25, 50, 75, 100]"
                suffix="%"
                :class="[radioGroupSelectedClass]"
              />
            </div>
          </van-skeleton>
        </div>
      </template>
    </div>

    <div class="position-panel">
      <van-skeleton :row="0" title title-width="100%" :loading="loadingData">
        <div class="title-text">{{ $t('base.position') }}</div>
        <div>
          <div class="value" v-if="position.eq(0)">
            <span class="short">--</span>
          </div>
          <div class="value" v-else>
            <span class="side-box" :class="sideClass">
              <span class="short">{{ $t('base.short') }}</span>
              <span class="long">{{ $t('base.long') }}</span>
            </span>
            <span>{{ position | abs | bigNumberFormatter(underlyingDecimals) }} {{ underlyingSymbol }}</span>
            <span class="sub-value">
              ({{ positionValue | bigNumberFormatter(collateralDecimals) }}
              {{ perpetualProperty ? perpetualProperty.collateralTokenSymbol : '' }})
            </span>
          </div>
        </div>
      </van-skeleton>
    </div>

    <div class="info-panel">
      <van-skeleton :row="3" :loading="loadingData">
        <table>
          <tbody>
          <tr>
            <td class="label">{{ $t('base.marginBalance') }}</td>
            <td class="value">
              {{
                marginBalance ? marginBalance.plus(this.diffBalance) : null | bigNumberFormatter(collateralDecimals)
              }}
              {{ perpetualProperty ? perpetualProperty.collateralTokenSymbol : '' }}
            </td>
            <td class="diff" v-if="showDiff">
              <PNNumber :number="diffBalance" :decimals="collateralDecimals" show-plus-sign/>
            </td>
          </tr>
          <tr>
            <td class="label">
              <McMTooltip>
                {{ $t('base.newTotalLeverage') }}
                <template slot="content">
                  <span v-html="$t('placeOrder.newTotalLeveragePrompt')"></span>
                </template>
              </McMTooltip>
            </td>
            <td class="value">
              {{
                accountComputed ? accountComputed.leverage.plus(diffLeverage || 0) :
                  null | bigNumberFormatterTruncateByPrecision(2, 2)
              }}x
            </td>
            <td class="diff" v-if="showDiff">
              <PNNumber
                v-show="!position.eq(0)"
                :number="diffLeverage"
                :decimals="2"
                :suffix="'x'"
                show-plus-sign
              />
            </td>
          </tr>
          <tr>
            <td class="label">
              <McMTooltip>
                {{ $t('base.marginRatio') }}
                <template slot="content">
                  <span v-html="marginRatioToolTip"></span>
                </template>
              </McMTooltip>
            </td>
            <td class="value">
              {{
                accountComputed
                  ? accountComputed.marginRatio.plus(this.diffMarginRatio || 0).times(100)
                  : null | bigNumberFormatter(1)
              }}%
            </td>
            <td class="diff" v-if="showDiff">
              <PNNumber
                v-show="!position.eq(0)"
                :number="diffMarginRatio.times(100)"
                :decimals="1"
                :suffix="'%'"
                show-plus-sign
              />
            </td>
          </tr>
          <tr>
            <td class="label">{{ $t('base.liqPrice') }}</td>
            <td class="value" v-if="position.eq(0)">
              <span class="short">--</span>
            </td>
            <td class="value" v-else>
              {{
                accountComputed
                  ? accountComputed.liquidationPrice.plus(this.diffLiqPrice)
                  : null | bigNumberFormatter(collateralDecimals)
              }}
              {{ perpetualProperty ? perpetualProperty.collateralTokenSymbol : '' }}
            </td>
            <td class="diff" v-if="showDiff">
              <PNNumber
                v-show="!position.eq(0)"
                :number="diffLiqPrice"
                :decimals="collateralDecimals"
                show-plus-sign
              />
            </td>
          </tr>
          </tbody>
        </table>
      </van-skeleton>
    </div>
    <div class="actions" v-if="isConnectedWallet">
      <van-skeleton class="skeleton-bold" :row="0" title title-width="100%" :loading="loadingData">
        <template v-if="selectedRadio === 'deposit'">
          <div class="button-box">
            <div class="more-button">
              <McMSteps ref="steps" @start="depositState = 'loading'" @success="depositState = ''" @error="depositState = 'fail'" :start-label="$t('base.add')">
                <template #start="prop">
                  <McMStateButton
                    :button-class="['blue', 'large', 'round']"
                    :state="depositState"
                    @click="prop.start.start"
                    :disabled="prop.start.running || disabledDeposit"
                  >
                    {{ prop.start.label }}
                  </McMStateButton>
                </template>
                <McMStepItem
                  v-for="(step, index) in steps"
                  :label="$t(step.labelKey, { collateral: step.collateral })"
                  :action="step.action"
                  :key="index"
                />
              </McMSteps>
            </div>
          </div>
        </template>
        <template v-if="selectedRadio === 'withdraw'">
          <div class="button-box">
            <div class="single-button">
              <McMStateButton
                :button-class="['orange', 'large', 'round']"
                :state.sync="confirmState"
                @click="onConfirmEvent"
                :disabled="disabledWithdraw"
              >
                {{ $t('base.remove') }}
              </McMStateButton>
            </div>
            <div class="step withdrawStep" v-show="isHasApproved"></div>
          </div>
        </template>
      </van-skeleton>
    </div>
    <div class="actions" v-if="!isConnectedWallet">
      <van-button class="round" size="large" @click="onConnectWallet">
        <i class="iconfont icon-wallet-bold"></i>
        {{ $t('connectWalletButton.connectWallet') }}
      </van-button>
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Mixins, Prop, Ref, Watch } from 'vue-property-decorator'
import { BigNumber } from 'bignumber.js'
import { _0, AccountDetails, AccountStorage, computeAccount } from '@mcdex/mai3.js'
import {
  McMButtonRadioGroup,
  McMHorizontalSteps,
  McMNumberField,
  McMRadioGroupTabs,
  McMStateButton,
  McMStepItem,
  McMSteps, McMTokenImageView,
  McMTooltip,
} from '@/mobile/components'
import { PNNumber } from '@/components'
import { SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID, WithdrawRelaxFactor } from '@/constants'
import { DepositWithdrawMixin, ErrorHandlerMixin } from '@/mixins'
import ChangeLeverageMixin from '@/template/components/ChangeLeverage/changeLeverageMixin'
import { isLongPosition } from '@/utils'
import { ACCOUNT_EVENT, VUE_EVENT_BUS } from '@/event'
import { ButtonState } from '@/type'
import { COMMON_EVENT } from '@/mobile/event'

enum STEP_TYPE {
  APPROVE = 'ARRROVE',
  ADD = 'ADD',
  REMOVE = 'REMOVE',
}

@Component({
  components: {
    McMRadioGroupTabs,
    McMButtonRadioGroup,
    McMHorizontalSteps,
    PNNumber,
    McMNumberField,
    McMStateButton,
    McMSteps,
    McMStepItem,
    McMTooltip,
    McMTokenImageView
  },
  filters: {
    abs: (num: BigNumber | null) => {
      return num ? new BigNumber(num).abs() : null
    },
  },
})
export default class PerpetualMargin extends Mixins(DepositWithdrawMixin, ChangeLeverageMixin, ErrorHandlerMixin) {
  @Prop({ default: 'deposit' }) selectedRadio!: string
  @Prop({ default: 'false' }) currentVisible!: boolean

  @Ref('steps') stepsElement!: McMSteps

  private depositForm = {
    amount: '',
    amountProportion: 0,
  }

  private depositRules = {
    amount: [
      {
        validator: () => {
          const errorMsg = this.validateDepositAmount()
          if (errorMsg) {
            this.$mcmToastErrorMsg(errorMsg)
          }
          return !errorMsg
        },
        message: '',
        trigger: 'onChange',
      },
    ],
  }

  private withdrawForm = {
    amount: '',
    amountProportion: 0,
  }

  private withdrawRules = {
    amount: [
      {
        validator: () => {
          const errorMsg = this.validateWithdrawAmount()
          if (errorMsg) {
            this.$mcmToastErrorMsg(errorMsg)
          }
          return !errorMsg
        },
        message: '',
        trigger: 'onChange',
      },
    ],
  }

  private approveError: Error | null = null
  private depositState: ButtonState = ''
  private confirmState: ButtonState = ''
  private approveState: ButtonState = ''
  private isHasApproved: boolean = false

  get isBSC() {
    return TARGET_NETWORK_ID === SUPPORTED_NETWORK_ID.BSC
  }

  get steps(): Array<{ labelKey: string; type: STEP_TYPE; collateral?: string, action: () => Promise<void> }> {
    let steps = new Array<{ labelKey: string; type: STEP_TYPE; collateral?: string, action: () => Promise<void> }>()
    if (this.needApprove) {
      steps.push({
        labelKey: 'base.approve',
        type: STEP_TYPE.APPROVE,
        action: this.onApproveEvent.bind(this),
      })
    }
    steps.push({ labelKey: 'base.add', type: STEP_TYPE.ADD, action: this.onConfirmEvent.bind(this) })
    return steps
  }

  get normalizeDepositAmount(): BigNumber | null {
    const result = new BigNumber(this.depositForm.amount)
    return result.isNaN() ? null : result
  }

  get normalizeWithdrawAmount(): BigNumber | null {
    const result = new BigNumber(this.withdrawForm.amount)
    return result.isNaN() ? null : result
  }

  get diffBalance(): BigNumber {
    if (!this.marginBalance) {
      return _0
    }

    return this.selectedRadio === 'deposit'
      ? this.normalizeDepositAmount || _0
      : this.normalizeWithdrawAmount?.negated() || _0
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

  get afterLeverage(): BigNumber | null {
    return this.afterAccountDetail?.accountComputed.leverage || null
  }

  get diffLeverage(): BigNumber | null {
    return this.afterLeverage && this.accountComputed ? this.afterLeverage.minus(this.accountComputed.leverage) : _0
  }

  get afterLiquidityPrice(): BigNumber | null {
    return this.afterAccountDetail ? this.afterAccountDetail.accountComputed.liquidationPrice : null
  }

  get diffLiqPrice(): BigNumber | null {
    return this.afterLiquidityPrice && this.accountComputed
      ? this.afterLiquidityPrice.minus(this.accountComputed.liquidationPrice)
      : _0
  }

  get afterMarginRatio(): BigNumber | null {
    return this.afterAccountDetail?.accountComputed.marginRatio || null
  }

  get diffMarginRatio(): BigNumber | null {
    return this.afterMarginRatio && this.accountComputed && !this.diffBalance.isZero()
      ? this.afterMarginRatio.minus(this.accountComputed.marginRatio)
      : null
  }

  get showDiff() {
    return (this.diffLiqPrice || this.diffMarginRatio || this.diffBalance) && !this.diffBalance?.isZero()
  }

  get needApprove() {
    if (!this.diffBalance) {
      return false
    }
    return this.allowance?.lt(this.diffBalance) || false
  }

  get canUserWithdraw(): boolean {
    if (!this.perpetualStorage || !this.position) {
      return true
    }
    return !(this.perpetualStorage.isMarketClosed && !this.position.isZero())
  }

  get currentSelectedRadio() {
    return this.selectedRadio
  }

  set currentSelectedRadio(val: string) {
    this.$emit('update:selectedRadio', val)
  }

  get disabledDeposit() {
    return (
      !this.normalizeDepositAmount ||
      !this.walletCollateral ||
      this.depositing ||
      !this.diffBalance ||
      this.diffBalance.isNaN() ||
      this.diffBalance.isZero() ||
      this.normalizeDepositAmount.gt(this.walletCollateral) ||
      this.perpetualStateIsNotNormal ||
      this.accountStorage?.positionAmount.eq(0)
    )
  }

  get disabledApprove() {
    return (
      this.disableChangeLeverage ||
      !this.needApprove ||
      !this.diffBalance ||
      this.diffBalance.isNaN() ||
      this.diffBalance.isZero() ||
      this.approving
    )
  }

  get disabledWithdraw() {
    return (
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

  get sideClass() {
    if (!this.position || this.position.isZero()) {
      return []
    }
    return isLongPosition(this.position, this.perpetualProperty?.isInverse) ? ['is-long'] : ['is-short']
  }

  get positionSymbol() {
    if (!this.perpetualProperty) {
      return ''
    }
    return this.perpetualProperty.isInverse ? this.perpetualProperty.collateralTokenSymbol : this.perpetualProperty.underlyingAssetSymbol
  }

  get underlyingSymbol() {
    return this.perpetualProperty?.underlyingAssetSymbol || ''
  }

  get radioOptions() {
    return [
      {
        label: this.$t('base.add').toString(),
        value: 'deposit',
        itemSelectedClass: 'blue-radio',
      },
      {
        label: this.$t('base.remove').toString(),
        value: 'withdraw',
        itemSelectedClass: 'orange-radio',
      },
    ]
  }

  get radioGroupSelectedClass() {
    if (this.selectedRadio === 'deposit') return 'blue-selected'
    if (this.selectedRadio === 'withdraw') return 'orange-selected'
    return ''
  }

  get availableMargin(): BigNumber | null {
    return this.accountComputed?.availableMargin || null
  }

  get withdrawableBalance(): BigNumber | null {
    if (!this.collateralDecimals || !this.accountStorage || !this.accountComputed) {
      return null
    }
    if (this.accountStorage.positionAmount.isZero()) {
      return this.accountComputed.withdrawableBalance
    }

    return new BigNumber(
      this.accountComputed.withdrawableBalance
        .times(WithdrawRelaxFactor)
        .toFixed(this.collateralDecimals, BigNumber.ROUND_DOWN),
    )
  }

  get loadingData() {
    if (!this.isConnectedWallet) {
      return false
    }
    return !this.perpetualID || !this.signer || !this.address || !this.liquidityPool || !this.perpetualProperty
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

  mounted() {
    return this.getData()
  }

  validateDepositAmount() {
    if (!this.normalizeDepositAmount || !this.walletCollateral) {
      return
    }
    if (this.normalizeDepositAmount.gt(this.walletCollateral) || this.normalizeDepositAmount.lt(_0)) {
      return this.$t('commonErrors.exceedMaxAmountError', {
        max: this.walletCollateral.toFormat(this.collateralDecimals || 0),
      }).toString()
    }
  }

  validateWithdrawAmount() {
    if (!this.normalizeWithdrawAmount || !this.withdrawableBalance) {
      return
    }
    if (this.normalizeWithdrawAmount.gt(this.withdrawableBalance) || this.normalizeWithdrawAmount.lt(_0)) {
      return this.$t('commonErrors.exceedMaxAmountError', {
        max: this.withdrawableBalance.toFormat(this.collateralDecimals || 0),
      }).toString()
    }
  }

  private onDepositProportionChange(num: number) {
    this.depositForm.amountProportion = num
    if (this.walletCollateral) {
      this.depositForm.amount = this.walletCollateral
        .times(num)
        .div(100)
        .toFixed()
    }
  }

  private onWithdrawProportionChange(num: number) {
    this.withdrawForm.amountProportion = num
    if (this.withdrawableBalance) {
      this.withdrawForm.amount = this.withdrawableBalance
        .times(num)
        .div(100)
        .toFixed()
    }
  }

  reSetBaseDate() {
    this.depositState = ''
    this.approveState = ''
    this.confirmState = ''
    this.depositForm.amount = ''
    this.depositForm.amountProportion = 0
    this.withdrawForm.amount = ''
    this.withdrawForm.amountProportion = 0
    this.stepsElement?.reset()
  }

  @Watch('perpetualID')
  @Watch('signer')
  @Watch('address')
  @Watch('liquidityPool')
  @Watch('perpetualProperty')
  private async refresh() {
    if (!this.perpetualID || !this.signer || !this.address || !this.liquidityPool || !this.perpetualProperty) {
      return
    }
    await this.getDataFunc()
  }

  @Watch('currentVisible', { immediate: true })
  private updateWithdrawAmount() {
    if (this.position && this.position.isZero() && this.withdrawableBalance) {
      this.withdrawForm.amount = this.withdrawableBalance.toFixed()
      this.withdrawForm.amountProportion = 100
    }
  }

  @Watch('address')
  @Watch('normalizeDepositAmount', { immediate: true })
  onApprove() {
    this.isHasApproved = this.needApprove ? this.needApprove : false
    this.stepsElement?.reset()
  }

  onConnectWallet() {
    VUE_EVENT_BUS.emit(COMMON_EVENT.SHOW_SELECT_WALLET_POPUP)
  }

  async onApproveEvent() {
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
        this.approveState = 'loading'
        const transaction = await this.approve(
          this.liquidityPool.liquidityPoolStorage,
          this.perpetualProperty,
          this.address,
        )
        this.approveError = null
        this.approveState = 'success'
        return transaction
      } catch (e) {
        this.approveError = e
        this.approveState = 'fail'
        throw e
      }
    }, undefined, true)
  }

  async onConfirmEvent() {
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
        this.confirmState = 'loading'
        let transactionResult
        if (this.diffBalance.lt(0)) {
          transactionResult = await this.withdraw(
            this.liquidityPool.liquidityPoolStorage,
            this.perpetualProperty,
            this.address,
            this.diffBalance.negated(),
          )
        } else {
          transactionResult = await this.deposit(
            this.liquidityPool.liquidityPoolStorage,
            this.perpetualProperty,
            this.address,
            this.diffBalance,
          )
        }
        this.confirmState = 'success'
        await this.getData()
        VUE_EVENT_BUS.emit(ACCOUNT_EVENT.REFRESH_USER_DATA)
        this.reSetBaseDate()
        return transactionResult
      } catch (e) {
        console.error(e)
        this.confirmState = 'fail'
        throw e
      }
    }, undefined, true)
  }
}
</script>

<style lang="scss">

</style>

<style lang="scss" scoped>
.perpetual-margin {
  ::v-deep .blue-radio {
    color: var(--mc-color-blue);
  }

  ::v-deep .orange-radio {
    color: var(--mc-color-orange);
  }

  .operating-panel {
    width: 100%;
    border-radius: 12px;
    background: var(--mc-background-color-darkest);

    .input-container {
      margin-top: 24px;
      width: 100%;
      min-height: 100px;
      padding: 16px;
    }

    .form-box {
      margin-top: 12px;

      ::v-deep {
        .van-form {
          .van-cell {
            padding: 0;
            background-color: transparent;
            height: 30px;
          }

          .van-field__control {
            color: var(--mc-text-color-white);
            font-size: 24px;
            font-weight: 700;
            caret-color: var(--mc-text-color-white);
          }

          input::-webkit-input-placeholder {
            color: var(--mc-text-color-dark);
            font-weight: 700;
          }

          .van-field__right-icon {
            color: var(--mc-text-color-white);
            font-size: 16px;
            font-weight: 400;
            display: flex;
            align-items: center;

            .right-icon {
              display: flex;
              align-items: center;

              .token-image-view {
                margin-right: 8px;
              }
            }
          }
        }

        .van-field--disabled {
          background-color: transparent!important;
        }
      }
    }

    .proportion-box {
      margin-top: 12px;

      .blue-selected {
        ::v-deep {
          .radio-item {
            height: 32px;
            line-height: 32px;
            background: var(--mc-background-color);
            color: var(--mc-text-color-white);
          }

          .is-selected {
            color: var(--mc-color-primary);
          }
        }
      }

      .orange-selected {
        ::v-deep {
          .radio-item {
            height: 32px;
            line-height: 32px;
            background: var(--mc-background-color);
            color: var(--mc-text-color-white);
          }

          .is-selected {
            color: var(--mc-color-primary);
          }
        }
      }
    }

    .button-box {
      margin-top: 16px;
    }
  }

  .position-panel {
    display: flex;
    justify-content: space-between;
    margin: 16px 0;
    font-size: 16px;
    line-height: 24px;

    .side-box {
      margin-right: 4px;

      .long,
      .short {
        display: none;
      }

      &.is-long .long {
        display: inline;
      }

      &.is-short .short {
        display: inline;
      }

      &.is-short {
        color: var(--mc-color-orange);
      }

      &.is-long {
        color: var(--mc-color-blue);
      }
    }

    .title-text {
      color: var(--mc-text-color);
    }

    .value {
      text-align: right;
    }

    .sub-value {
      font-size: 16px;
      color: var(--mc-text-color);
    }
  }

  .info-panel {
    margin-top: 16px;
    font-size: 14px;
    line-height: 16px;
    border: 1px solid var(--mc-border-color);
    border-radius: var(--mc-border-radius-l);
    padding: 16px;

    table {
      width: 100%;

      tr {
        td {
          line-height: 20px;
          padding: 0 0 12px 0;
        }


        &:nth-of-type(4) td {
          padding: 0;
        }
      }
    }

    .label {
      color: var(--mc-text-color);
    }

    .value {
      text-align: right;
    }
  }

  .actions {
    margin-top: 24px;

    .step {
      height: 68px;
    }

    .withdrawStep {
      margin-top: 20px;
    }
  }

  .button-box {
    .more-button {
      .state-button {
        width: 100%;
      }

      .state-button:first-child {
        margin-right: 16px;
      }
    }

    .single-button {
      ::v-deep {
        .van-button {
          width: 100%;
        }
      }
    }
  }

  .steps {
    margin-top: 8px;
    text-align: center;
  }

  .label-line {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    line-height: 20px;
    color: var(--mc-text-color);
  }

  .value {
    color: var(--mc-text-color-white);
  }
}

.van-skeleton {
  width: 100%;

  &.skeleton-bold {
    .van-skeleton__title {
      height: 60px;
    }
  }
}
</style>
