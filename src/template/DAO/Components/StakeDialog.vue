<template>
  <div class="stake-dialog">
    <el-dialog
      :title="$t('dao.mcbStaking')"
      append-to-body
      top="0"
      custom-class="is-large is-round stake-dialog"
      :close-on-click-modal="false"
      :visible.sync="currentVisible"
      @closed="onClosed"
    >
      <McLoading
        :mask-color="'transparent'"
        :show-loading="loading"
        :min-show-time="500"
        :show-loading-text="false"
        :hide-content="loading"
      >
        <div class="dialog-container">
          <!-- left container -->
          <div class="left-container">
            <div class="info-panel">
              <div class="panel-title">{{ $t('dao.stakeDialog.yourStake') }}</div>
              <div class="panel-context">
                <div class="info-item">
                  <span class="label">{{ $t('dao.stakeDialog.xmcbBalance') }}</span>
                  <span class="value">{{ myStakeBalance | bigNumberFormatter(tokenDecimals) }}</span>
                </div>
                <div class="info-item">
                  <span class="label">{{ $t('dao.yourShare') }}</span>
                  <span class="value">{{ myShare | bigNumberFormatter(2) }}%</span>
                </div>
                <div class="info-item">
                  <span class="label">
                    <el-tooltip placement="top">
                      <div slot="content"><span v-html="$t('dao.stakeDialog.unstakePenaltyPrompt')"></span></div>
                      <span>{{ $t('dao.stakeDialog.unstakePenalty') }}</span>
                    </el-tooltip>
                  </span>
                  <span class="value">{{ unstakePenalty | bigNumberFormatter(2) }}%</span>
                </div>
                <div class="info-item claim-line">
                  <span class="label">{{ $t('dao.claimableRewards') }}</span>
                  <div>
                    <div class="claim-value" v-for="(item, index) in claimableTokens" :key="index">
                      {{ item.value | bigNumberFormatter(2) }}<TokenImageView :token="item.tokenName" :size="18" />
                    </div>
                    <div v-if="!claimableTokens.length" class="claim-value">
                      0 <TokenImageView :token="SATORI_ADDRESS" :size="18" />
                    </div>
                    <div>
                      <el-button class="claim-button" size="small" type="primary" @click="onClaimEvent"
                                 :loading="claimState==='loading'" :disabled="claimIsDisabled">
                        {{ $t('base.claim') }}
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- right container -->
          <div class="right-container">
            <div class="tabs-container">
              <McRadioTabs
                v-model="activeRadioTab"
                :class="[activeRadioTab]"
                :options="[
                  {label: $t('dao.stake'), value: 'stake'},
                  {label: $t('dao.unstake'), value: 'unstake'},
                ]"
              />
            </div>
            <template v-if="activeRadioTab === 'stake'">
              <div class="input-container">
                <div class="info-line">
                  <span>{{ $t('base.amount') }}</span>
                  <span>
                    {{ $t('base.balance') }}:
                    {{ walletBalance || 0 | bigNumberFormatter(tokenDecimals) }}
                  </span>
                </div>
                <div class="input-line">
                  <el-form size="medium" :model="stakeForm" :rules="stakeFormRules" ref="orderGasForm" @submit.native.prevent>
                    <el-form-item prop="amount" :inline-message="true">
                      <el-input v-model="stakeAmount" size="large" placeholder="0.0">
                        <template slot="suffix">
                          <TokenImageView :token="daoTokenName" :size="24"/> {{ daoTokenName }}
                        </template>
                      </el-input>
                    </el-form-item>
                  </el-form>
                </div>
                <div class="radio-line">
                  <McRadioGroup v-model="stakeAmountProportion"
                                :values="[25, 50, 75, 100]"
                                suffix="%"/>
                </div>
              </div>
              <div class="info-container">
                <div class="text-line">
                  <span class="label">{{ $t('dao.stakeDialog.xSATORIToMint') }}</span>
                  <span class="value">{{ deltaStakeShareToken | bigNumberFormatterByPrecision(2) }}</span>
                </div>
                <div class="text-line">
                  <span class="label">{{ $t('dao.stakeDialog.shareOfPool') }}</span>
                  <span class="value">{{ deltaStakeSharePercentage | bigNumberFormatterByPrecision(2) }}%</span>
                </div>
              </div>
              <div class="button-container">
                <McSteps :start-label="$t('dao.stake')">
                  <template #start="prop">
                    <div class="button-item">
                      <el-button
                        :disabled="invalidStakeAmount || invalidAccountStakeAmount"
                        size="large"
                        type="blue"
                        @click="prop.start.start"
                        :loading="prop.start.running"
                      >
                        {{ prop.start.label }}
                      </el-button>
                    </div>
                  </template>
                  <McStepItem v-for="(step, index) in steps" :action="step.action" :label="step.label"
                              :key="index"></McStepItem>
                </McSteps>
              </div>
            </template>
            <template v-if="activeRadioTab==='unstake'">
              <div class="input-container">
                <div class="info-line">
                  <span>{{ $t('base.amount') }}</span>
                  <span>
                  {{ $t('base.balance') }}: {{ myStakeBalance | bigNumberFormatterByPrecision  }}
                </span>
                </div>
                <div class="input-line">
                  <el-form size="medium" :model="unstakeForm" :rules="unstakeFormRules" ref="orderGasForm" @submit.native.prevent>
                    <el-form-item prop="amount" :inline-message="true">
                      <el-input v-model="unstakeAmount" size="large" placeholder="0.0">
                        <template slot="suffix">
                          <TokenImageView :token="unstakeTokenName" :size="24"/>{{ unstakeTokenName }}
                        </template>
                      </el-input>
                    </el-form-item>
                  </el-form>
                </div>
                <div class="radio-line">
                  <McRadioGroup v-model="unstakeAmountProportion"
                                :values="[25, 50, 75, 100]"
                                suffix="%"/>
                </div>
              </div>
              <div class="info-container">
                <div class="text-line">
                  <span class="label">
                    {{ $t('dao.stakeDialog.mcbToReceive') }}
                  </span>
                  <span class="value">{{ receivedAfterUnstake | bigNumberFormatterByPrecision(2)  }}</span>
                </div>
              </div>
              <div class="button-container">
                <el-button
                  :disabled="invalidUnstakeAmount || invalidAccountUnstakeAmount"
                  size="large"
                  type="orange"
                  @click="onUnstakeEvent"
                  :loading="unstaking"
                >{{ $t('dao.unstake') }}</el-button>
              </div>
            </template>
          </div>
        </div>
      </McLoading>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins, Watch, Ref } from 'vue-property-decorator'
import {
  McSimpleSlider,
  McSteps,
  McStepItem,
  McLoading,
  McRadioTabs,
  McRadioGroup,
  TokenImageView
} from '@/components'
import { DAOUnstakePenalty, SATORI_ADDRESS } from '@/constants'
import BigNumber from 'bignumber.js'
import { DaoStakingMixin } from '@/template/components/DAO/daoStakingMixin'
import { _0 } from '@mcdex/mai3.js'
import { ElForm } from 'element-ui/types/form'
import { DAO_STAKE_TOKEN_SYMBOL, DAO_UNSTAKE_TOKEN_SYMBOL } from '@mcdex/mcdex-governance.js'
import { VUE_EVENT_BUS, WALLET_EVENT } from '@/event'

@Component({
  components: {
    McSimpleSlider,
    McSteps,
    McStepItem,
    McLoading,
    McRadioTabs,
    McRadioGroup,
    TokenImageView,
  },
})
export default class StakeDialog extends Mixins(DaoStakingMixin) {
  @Prop({ default: false }) visible!: boolean

  @Ref('steps') stepsElements!: McSteps

  private daoTokenName: string = DAO_STAKE_TOKEN_SYMBOL
  private unstakeTokenName: string = DAO_UNSTAKE_TOKEN_SYMBOL
  private tokenDecimals: number = 2
  private SATORI_ADDRESS: string = SATORI_ADDRESS

  private activeRadioTab: 'stake' | 'unstake' = 'stake'

  private stakeForm = {
    amount: '',
    amountProportion: 0,
  }

  private stakeFormRules = {
    amount: [
      { validator: this.validateInputNumber, trigger: 'change' },
      { validator: this.validateStakeAmount, trigger: 'change' },
    ],
  }

  private unstakeForm = {
    amount: '',
    amountProportion: 0,
  }

  private unstakeFormRules = {
    amount: [
      { validator: this.validateInputNumber, trigger: 'change' },
      { validator: this.validateUnstakeAmount, trigger: 'change' },
    ],
  }

  get currentVisible() {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
  }

  get isStakeTab(): boolean {
    return this.activeRadioTab === 'stake'
  }

  get isUnstakeTab(): boolean {
    return this.activeRadioTab === 'unstake'
  }

  get stakeAmount(): string {
    return this.stakeForm.amount
  }

  set stakeAmount(val: string) {
    this.stakeForm.amount = val
    const v = new BigNumber(val)
    if (!this.walletBalance || this.walletBalance.isZero() || v.isZero() || v.isNaN()) {
      this.stakeForm.amountProportion = 0
    } else {
      this.stakeForm.amountProportion = Number(
        v.div(this.walletBalance).times(100).toFixed(0, BigNumber.ROUND_UP)
      )
    }
  }

  get stakeAmountProportion(): number {
    return this.stakeForm.amountProportion
  }

  set stakeAmountProportion(val: number) {
    this.stakeForm.amountProportion = val
    const v = new BigNumber(val)
    if (!this.walletBalance || this.walletBalance.isZero()) {
      this.stakeForm.amount = '0'
    } else {
      this.stakeForm.amount = this.walletBalance.times(v).div(100).toFixed(this.tokenDecimals)
    }
  }

  get unstakeAmount(): string {
    return this.unstakeForm.amount
  }

  set unstakeAmount(val: string) {
    this.unstakeForm.amount = val
    const v = new BigNumber(val)
    if (!this.myShareBalance || this.myShareBalance.isZero() || v.isZero() || v.isNaN()) {
      this.unstakeForm.amountProportion = 0
    } else {
      this.unstakeForm.amountProportion = Number(
        v.div(this.myShareBalance).times(100).toFixed(0, BigNumber.ROUND_UP)
      )
    }
  }

  get unstakeAmountProportion(): number {
    return this.unstakeForm.amountProportion
  }

  set unstakeAmountProportion(val: number) {
    this.unstakeForm.amountProportion = val
    const v = new BigNumber(val)
    if (!this.myShareBalance || this.myShareBalance.isZero()) {
      this.unstakeForm.amount = '0'
    } else {
      if (v.gte(100)) {
        this.unstakeForm.amount = this.myShareBalance.toFixed()
      } else {
        this.unstakeForm.amount = this.myShareBalance.times(v).div(100)
          .toFixed(this.tokenDecimals, BigNumber.ROUND_DOWN)
      }
    }
  }

  get normalizeStakeAmount() {
    return this.stakeForm.amount ? new BigNumber(this.stakeForm.amount) : _0
  }

  get normalizeUnstakeAmount() {
    return this.unstakeForm.amount ? new BigNumber(this.unstakeForm.amount) : _0
  }

  get invalidStakeAmount() {
    return (
      this.normalizeStakeAmount.isNaN() ||
      this.normalizeStakeAmount.lte(_0)
    )
  }

  get invalidAccountStakeAmount() {
    return (
      !this.walletBalance ||
      this.normalizeStakeAmount.gt(this.walletBalance)
    )
  }

  get invalidUnstakeAmount() {
    return (
      this.normalizeUnstakeAmount.isNaN() ||
      this.normalizeUnstakeAmount.lte(_0)
    )
  }

  get invalidAccountUnstakeAmount() {
    return (
      this.normalizeUnstakeAmount.gt(this.myShareBalance)
    )
  }

  get deltaStakeShareToken(): BigNumber {
    if (this.invalidStakeAmount) {
      return new BigNumber(0)
    }
    return new BigNumber(this.stakeForm.amount)
  }

  get deltaStakeSharePercentage() {
    const amount = new BigNumber(this.stakeForm.amount)
    if (!this.totalShareSupply || amount.isNaN() || amount.isZero()) {
      return new BigNumber(0)
    }
    return amount.div(this.totalShareSupply.plus(amount)).times(100)
  }

  get receivedAfterUnstake(): BigNumber {
    if (!this.unstakeForm.amount || this.invalidUnstakeAmount) {
      return new BigNumber(0)
    }
    return new BigNumber(this.unstakeForm.amount).times(1 - DAOUnstakePenalty)
  }

  get steps() {
    const steps = [{ label: this.$t('dao.stake'), action: this.onStakeEvent.bind(this) }]
    if (!this.isApproved) {
      steps.unshift({
        label: `${this.$t('base.approve')} ${this.daoTokenName}`,
        action: this.onApproveEvent.bind(this),
      })
    }
    return steps
  }

  reSetForm() {
    this.stakeForm.amount = ''
    this.stakeForm.amountProportion = 0
    this.unstakeForm.amount = ''
    this.unstakeForm.amountProportion = 0
  }

  onConnectWallet() {
    VUE_EVENT_BUS.emit(WALLET_EVENT.ShowConnectWallet)
    this.currentVisible = false
  }

  onClosed() {
    this.$emit('closed')
  }

  setStakeMax() {
    this.stakeForm.amount = this.walletBalance?.toFixed() || ''
    if (this.walletBalance && !this.walletBalance.isZero()) {
      this.stakeForm.amountProportion = 100
    } else {
      this.stakeForm.amountProportion = 0
    }
  }

  setUnstakeMax() {
    this.unstakeForm.amount = this.myShareBalance.toFixed()
    if (!this.myShareBalance.isZero()) {
      this.unstakeForm.amountProportion = 100
    } else {
      this.unstakeForm.amountProportion = 0
    }
  }

  async onApproveEvent() {
    try {
      await this.callChainFunc(async () => {
        await this.approve()
      }, undefined, true)
    } catch (e) {
      this.showError(e)
    }
  }

  async onStakeEvent() {
    try {
      await this.callChainFunc(async () => {
        await this.stakeSATORIToken(this.normalizeStakeAmount)
        await this.updateData()
        this.reSetForm()
        this.stepsElements.reset()
      }, undefined, true)
    } catch (e) {
      this.showError(e)
    }
    // refresh form validate
    await this.validateStakeForm()
  }

  async onUnstakeEvent() {
    try {
      await this.callChainFunc(async () => {
        await this.unstakeSATORIToken(this.normalizeUnstakeAmount)
        await this.updateData()
        this.reSetForm()
      })
    } catch (e) {
      this.showError(e, false)
    }
    // refresh form validate
    await this.validateUnstakeForm()
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

  validateStakeAmount(rule: any, value: string, callback: Function) {
    if (!this.normalizeStakeAmount || !this.walletBalance) {
      callback()
      return
    }
    if (this.walletBalance.lt(_0)) {
      callback(new Error(this.$t('commonErrors.InsufficientWallet').toString()))
      return
    }
    if (this.normalizeStakeAmount.gt(this.walletBalance) || this.normalizeStakeAmount.lt(_0)) {
      callback(
        new Error(
          this.$t('commonErrors.exceedMaxStakeAmountError', {
            max: this.walletBalance.toFormat(),
          }).toString()
        )
      )
      return
    }
    callback()
  }

  validateUnstakeAmount(rule: any, value: string, callback: Function) {
    if (!this.normalizeUnstakeAmount || !this.myShareBalance || !this.isConnectedWallet) {
      callback()
      return
    }
    if (this.normalizeUnstakeAmount.gt(this.myShareBalance) || this.normalizeUnstakeAmount.lt(_0)) {
      callback(
        new Error(
          this.$t('commonErrors.exceedMaxUnstakeAmountError', {
            max: this.myShareBalance.toFormat(),
          }).toString()
        )
      )
      return
    }
    callback()
  }

  validateStakeForm() {
    const form = this.$refs.stakeForm as ElForm
    try {
      form.validate()
    } catch (e) {
      // ignore validate error, form had handle error
    }
  }

  validateUnstakeForm() {
    const form = this.$refs.unstakeForm as ElForm
    try {
      form.validate()
    } catch (e) {
      // ignore validate error, form had handle error
    }
  }

  @Watch('currentVisible', { immediate: true })
  onCurrentVisible() {
    this.updateUserData()
  }

  @Watch('walletBalance')
  onWalletBalance() {
    this.walletBalance && !this.walletBalance.isZero() ?
      this.stakeForm.amountProportion = Math.max(
        0,
        Math.min(
          100,
          this.normalizeStakeAmount
            .div(this.walletBalance)
            .times(100)
            .toNumber()
        )) : this.stakeForm.amountProportion = 0
  }

  @Watch('myShareBalance')
  onMyShareBalance() {
    !this.myShareBalance.isZero() ?
      this.unstakeForm.amountProportion = Math.max(
        0,
        Math.min(
          100,
          this.normalizeUnstakeAmount
            .div(this.myShareBalance)
            .times(100)
            .toNumber()
        )
      ) : this.unstakeForm.amountProportion = 0
  }

  private showError(e: any, throwError = true) {
    this.$notify({
      type: 'error',
      title: this.$t(e.helpCaptionKey).toString(),
      message: this.$t(e.helpKey, { message: e.message }).toString(),
      position: 'bottom-right',
      customClass: 'is-error',
    })
    if (throwError) {
      throw e
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~@mcdex/style/common/fantasy-var';

.stake-dialog {
  ::v-deep &.is-large {
    min-height: 406px;
    width: 784px;
  }

  .mc-loading {
    position: unset;
    height: 90%;
    width: 100%;

    ::v-deep .mc-loading__mask {
      top: 54px;
    }
  }

  .dialog-container {
    display: flex;
    margin-top: 12px;

    .left-container {
      width: 367px;

      .info-panel {
        padding: 16px;
        width: 367px;
        border: 1px solid var(--mc-border-color);
        border-radius: var(--mc-border-radius-l);
        margin-bottom: 16px;

        &:last-child {
          margin-bottom: 0;
        }

        .panel-title {
          font-size: 16px;
          line-height: 24px;
          color: var(--mc-text-color-white);
          margin-bottom: 16px;
        }

        .panel-context {

          .info-item {
            line-height: 20px;
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            font-size: 14px;
            align-items: center;

            &:last-child {
              margin-bottom: 0;
            }

            .label {
              color: var(--mc-text-color);
            }

            .value {
              color: var(--mc-text-color-white);
              display: flex;
              align-items: center;

              .token-image-view {
                margin-left: 4px;
              }
            }
          }

          .claim-line {
            align-items: flex-start;
            margin-top: 16px;

            .claim-value{
              display: flex;
              align-items: center;
              justify-content: flex-end;
              margin-bottom: 8px;

              .token-image-view {
                margin-left: 4px;
              }
            }

            .claim-button {
              margin-left: 12px;
              border-radius: var(--mc-border-radius-m);
              width: 80px;
              height: 32px;
              background: rgba($--mc-color-primary, 0.2);
              color: var(--mc-color-primary);
            }
          }
        }
      }
    }

    .right-container {
      margin-left: 16px;
      width: 367px;

      .tabs-container {
        margin-bottom: 24px;

        .mc-radio-tabs.stake ::v-deep .active {
          color: var(--mc-color-blue);
        }

        .mc-radio-tabs.unstake ::v-deep .active {
          color: var(--mc-color-orange);
        }
      }

      .input-container {
        min-height: 138px;
        width: 100%;
        background: var(--mc-background-color-darkest);
        border-radius: var(--mc-border-radius-l);
        padding: 16px;

        .info-line {
          font-size: 14px;
          line-height: 20px;
          color: var(--mc-text-color);
          display: flex;
          justify-content: space-between;
        }

        .input-line {
          margin: 12px 0;

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
        }
      }

      .info-container {
        margin-top: 16px;

        .text-line {
          display: flex;
          justify-content: space-between;
          font-size: 16px;
          line-height: 24px;
          margin-bottom: 12px;

          &:last-child {
            margin-bottom: 0;
          }

          .label {
            color: var(--mc-text-color);
          }

          .value {
            color: var(--mc-text-color-white);
          }
        }
      }

      .button-container {
        margin-top: 24px;

        .el-button {
          width: 100%;
          height: 56px;
          border-radius: var(--mc-border-radius-l);
        }
      }
    }

    .el-form-item__error {
      line-height: 20px;
      padding: 8px 0 12px;
    }
  }
}
</style>
