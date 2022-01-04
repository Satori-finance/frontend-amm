<template>
  <div class="mcb-stake scroll-container">
    <BackNavBar :title="title"></BackNavBar>
    <div class="mcb-stake-container page-container">
      <div class="info-title">
        <McMIconHeader :image1="mcbAddress | tokenIconUrlFormatter" :title="daoStakeTokenSymbol"
                    :sub-title="poolAddressSubTitle"/>
      </div>
      <div class="operating-panel">
        <McMRadioGroupTabs v-model="selectedRadio" :options="radioOptions" />
        <van-skeleton :row="9" :loading="loadingData" class="operating-panel-skeleton">
          <template v-if="selectedRadio === 'stake'">
            <div class="input-container">
              <div class="label-line">
                <span>{{ $t('base.amount') }}</span>
                <span v-if="isConnectedWallet">
                  {{ $t('base.balance') }}
                  {{ walletBalance | bigNumberFormatter(tokenDecimals) }}
                </span>
              </div>
              <div class="form-box">
                <van-form validate-first ref="stakeForm">
                  <McMNumberField v-model="stakeAmount" placeholder="0.0" :rules="stakeRules.amount">
                    <span slot="right-icon">{{ daoStakeTokenSymbol }}</span>
                  </McMNumberField>
                </van-form>
              </div>
              <div class="proportion-box">
                <McMButtonRadioGroup v-model="stakeAmountProportion" :values="[25, 50, 75, 100]" suffix="%" :class="[radioGroupSelectedClass]" />
              </div>
            </div>
            <div class="input-container-sub-info">
              <div class="label-line">
                <span>{{ $t('base.share') }}</span>
                <span class="value">{{ deltaStakeSharePercentage | bigNumberFormatterByPrecision(2) }}%</span>
              </div>
            </div>
            <div class="button-box" v-if="isConnectedWallet">
              <McMSteps :start-label="$t('dao.stake')" @error="stakingState = 'fail'" @success="stakingState = 'success'" @start="stakingState = 'loading'">
                <template #start="prop">
                  <McMStateButton
                    :button-class="['blue', 'round', 'large']"
                    :state="stakingState"
                    :disabled="invalidStakeAmount || invalidAccountStakeAmount"
                    @click="prop.start.start"
                  >
                    {{ prop.start.label }}
                  </McMStateButton>
                </template>
                <McMStepItem v-for="(step, index) in steps" :action="step.action" :label="step.label" :key="index"></McMStepItem>
              </McMSteps>
            </div>
            <div class="button-box" v-if="!isConnectedWallet">
              <div class="single-button">
                <van-button class="round" size="large" @click="onConnectWallet">
                  <i class="iconfont icon-wallet-bold"></i>
                  {{ $t('connectWalletButton.connectWallet') }}
                </van-button>
              </div>
            </div>
          </template>
          <template v-if="selectedRadio === 'unstake'">
            <div class="input-container">
              <div class="label-line">
                <span>{{ $t('base.amount') }}</span>
                <span v-if="isConnectedWallet">
                  {{ $t('base.balance') }}
                  {{ myStakeBalance | bigNumberFormatter(tokenDecimals) }}
                </span>
              </div>
              <div class="form-box">
                <van-form validate-first ref="unstakeForm">
                  <McMNumberField v-model="unstakeAmount" placeholder="0.0" :rules="unstakeRules.amount">
                    <span slot="right-icon">{{ daoUnstakeTokenSymbol }}</span>
                  </McMNumberField>
                </van-form>
              </div>
              <div class="proportion-box">
                <McMButtonRadioGroup v-model="unstakeAmountProportion" :values="[25, 50, 75, 100]" suffix="%" :class="[radioGroupSelectedClass]" />
              </div>
            </div>
            <div class="input-container-sub-info">
              <div class="label-line">
                <span>{{ $t('dao.receive') }}</span>
                <span class="value">{{ receivedAfterUnstake | bigNumberFormatterByPrecision(2) }} {{ daoStakeTokenSymbol }}</span>
              </div>
            </div>
            <div class="button-box" v-if="isConnectedWallet">
              <div class="single-button">
                <McMStateButton :button-class="['orange', 'round', 'large']" :state.sync="unstakeSATORIState"
                                :disabled="invalidUnstakeAmount || invalidAccountUnstakeAmount" @click="onUnstakeEvent">
                  {{ $t('base.unstake') }}
                </McMStateButton>
              </div>
            </div>
            <div class="button-box" v-if="!isConnectedWallet">
              <div class="single-button">
                <van-button class="round" size="large" @click="onConnectWallet">
                  <i class="iconfont icon-wallet-bold"></i>
                  {{ $t('connectWalletButton.connectWallet') }}
                </van-button>
              </div>
            </div>
          </template>
        </van-skeleton>
      </div>
      <div class="info-panel" v-if="isConnectedWallet">
        <van-skeleton :row="6" :loading="loadingData">
          <div class="title">{{ $t('dao.myShareReward') }}</div>
          <div class="content">
            <div class="label-line line-item">
              <span>{{ $t('dao.myShare') }}</span>
              <span class="value">{{ myShare | bigNumberFormatter(tokenDecimals)}} %</span>
            </div>
            <div class="label-line line-item">
              <span>{{ $t('dao.myStaked') }}</span>
              <span class="value">{{ myStakeBalance | bigNumberFormatter(tokenDecimals) }} {{ daoUnstakeTokenSymbol }}</span>
            </div>
            <div class="label-line line-item">
              <span>{{ $t('dao.stakeDialog.unstakePenalty') }}</span>
              <span class="value">{{ unstakePenalty | bigNumberFormatter(2)}} %</span>
            </div>
            <div class="label-line line-item">
              <span>{{ $t('dao.claimable') }}</span>
              <div class="claimable-list">
                <div v-for="(item, index) in claimableTokens" :key="index">
                  {{ item.value | bigNumberFormatter}} {{ item.tokenName }}
                </div>
              </div>
            </div>
          </div>
          <div class="button-box">
            <div class="single-button">
              <McMStateButton :button-class="['orange', 'round', 'large']" :state.sync="claimState"
                              :disabled="claimIsDisabled" @click="onClaimEvent" v-if="isConnectedWallet">
                <template v-if="claimableTokens.length > 1">
                  {{ $t('base.claimAll') }}
                </template>
                <template v-else>
                  {{ $t('base.claim') }}
                </template>
              </McMStateButton>
            </div>
          </div>
        </van-skeleton>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BigNumber from 'bignumber.js'
import { _0 } from '@mcdex/mai3.js'
import {
  McMIconHeader,
  McMRadioGroupTabs,
  McMButtonRadioGroup,
  McMHorizontalSteps,
  McMStateButton, McMNumberField,
  McMStepItem,
  McMSteps,
} from '@/mobile/components'
import { ellipsisMiddle, toBigNumber } from '@/utils'
import {
  DAOUnstakePenalty,
  SATORI_ADDRESS,
} from '@/const'
import BackNavBar from '@/mobile/template/Header/BackNavBar.vue'
import { DaoStakingMixin } from '@/template/components/DAO/daoStakingMixin'
import { ElForm } from 'element-ui/types/form'
import { VUE_EVENT_BUS } from '@/event'
import { COMMON_EVENT } from '@/mobile/event'
import { DAO_STAKE_TOKEN_SYMBOL, DAO_UNSTAKE_TOKEN_SYMBOL } from '@mcdex/mcdex-governance.js'
import { ButtonState } from '@/type'

@Component({
  components: {
    McMIconHeader,
    McMRadioGroupTabs,
    McMButtonRadioGroup,
    McMHorizontalSteps,
    BackNavBar,
    McMStateButton,
    McMNumberField,
    McMStepItem,
    McMSteps,
  }
})
export default class DAOSATORIStaking extends Mixins(DaoStakingMixin) {

  private mcbAddress: string = SATORI_ADDRESS
  private tokenDecimals: number = 2
  private stakingState: ButtonState = ''
  private daoStakeTokenSymbol: string = DAO_STAKE_TOKEN_SYMBOL
  protected daoUnstakeTokenSymbol: string = DAO_UNSTAKE_TOKEN_SYMBOL

  private stakeForm = {
    amount: '',
    amountProportion: 0,
    activeStep: 0
  }

  private stakeRules = {
    amount: [
      { validator: (val: string, rule: any) => {
          let errorMsg: string = ''
          errorMsg = this.validateInputNumber(val)
          if (errorMsg !== '') {
            rule.msg = errorMsg
            return false
          }
          errorMsg = this.validateStakeAmount()
          if (errorMsg !== '') {
            rule.msg = errorMsg
            return false
          }
          return errorMsg === ''
        },
        message: (val: string, rule: any) => {
          this.$mcmToastErrorMsg(rule.msg)
        },
        trigger: 'onChange'
      }
    ]
  }

  private unstakeForm = {
    amount: '',
    amountProportion: 0
  }

  private unstakeRules = {
    amount: [
      { validator: (val: string, rule: any) => {
          let errorMsg: string = ''
          errorMsg = this.validateInputNumber(val)
          if (errorMsg !== '') {
            rule.msg = errorMsg
            return false
          }
          errorMsg = this.validateUnstakeAmount()
          if (errorMsg !== '') {
            rule.msg = errorMsg
            return false
          }
          return errorMsg === ''
        },
        message: (val: string, rule: any) => {
          this.$mcmToastErrorMsg(rule.msg)
        },
        trigger: 'onChange'
      }
    ]
  }

  private selectedRadio: 'stake' | 'unstake' = 'stake'
  get radioOptions() {
    return [
      {
        label: this.$t('base.stake').toString(),
        value: 'stake',
        itemSelectedClass: 'blue-radio',
      },
      {
        label: this.$t('base.unstake').toString(),
        value: 'unstake',
        itemSelectedClass: 'orange-radio',
      }
    ]
  }

  get loadingData() {
    if (!this.isConnectedWallet) {
      return false
    }
    return !this.signer || !this.userAddress || !this.walletBalance
  }

  get title() {
    return this.$t('dao.mcbStaking').toString()
  }

  get radioGroupSelectedClass() {
    if (this.selectedRadio === 'stake') return 'blue-selected'
    if (this.selectedRadio === 'unstake') return 'orange-selected'
    return ''
  }

  get poolAddressSubTitle(): string {
    return `${this.$t('base.poolAddress').toString()} ${ellipsisMiddle(this.xmcbAddress, 6, 4)}`
  }

  get stakeAmount(): string {
    return this.stakeForm.amount
  }

  set stakeAmount(val: string) {
    this.stakeForm.amount = val
    this.refreshStakeAmountProportion()
  }

  get stakeAmountProportion(): number {
    return this.stakeForm.amountProportion
  }

  set stakeAmountProportion(val: number) {
    if (!this.walletBalance || this.walletBalance.isZero()) {
      this.stakeForm.amount = '0'
    } else {
      this.stakeForm.amount = this.walletBalance.times(val).div(100).toFixed(
        this.tokenDecimals,
        BigNumber.ROUND_DOWN
      )
    }
    this.stakeForm.amountProportion = val
  }

  refreshStakeAmountProportion() {
    if (!this.walletBalance || this.walletBalance.isZero() || this.invalidStakeAmount || this.invalidAccountStakeAmount) {
      this.stakeForm.amountProportion = 0
    } else {
      this.stakeForm.amountProportion = toBigNumber(this.stakeAmount).div(this.walletBalance).times(100).toNumber()
    }
  }

  get unstakeAmount(): string {
    return this.unstakeForm.amount
  }

  set unstakeAmount(val: string) {
    this.unstakeForm.amount = val
    this.refreshUnStakeAmountProportion()
  }

  get unstakeAmountProportion(): number {
    return this.unstakeForm.amountProportion
  }

  set unstakeAmountProportion(val: number) {
    if (!this.myShareBalance || this.myShareBalance.isZero()) {
      this.unstakeForm.amount = '0'
    } else {
      this.unstakeForm.amount = this.myShareBalance.times(val).div(100).toFixed()
    }
    this.unstakeForm.amountProportion = val
  }

  refreshUnStakeAmountProportion() {
    if (!this.myShareBalance || this.myShareBalance.isZero() || this.invalidUnstakeAmount || this.invalidAccountUnstakeAmount) {
      this.unstakeForm.amountProportion = 0
    } else {
      this.unstakeForm.amountProportion = toBigNumber(this.unstakeAmount).div(this.myShareBalance).times(100).toNumber()
    }
  }

  get invalidStakeAmount() {
    return this.normalizeStakeAmount.isNaN() ||
      this.normalizeStakeAmount.lte(_0)
  }

  get invalidAccountStakeAmount() {
    return !this.walletBalance ||
      this.normalizeStakeAmount.gt(this.walletBalance)
  }

  get invalidUnstakeAmount() {
    return this.normalizeUnstakeAmount.isNaN() ||
      this.normalizeUnstakeAmount.lte(_0)
  }

  get invalidAccountUnstakeAmount() {
    return this.normalizeUnstakeAmount.gt(this.myShareBalance)
  }

  get receivedAfterUnstake(): BigNumber {
    if (!this.unstakeForm.amount || this.invalidUnstakeAmount) {
      return new BigNumber(0)
    }
    return new BigNumber(this.unstakeForm.amount).times(1 - DAOUnstakePenalty)
  }

  get deltaStakeSharePercentage(): BigNumber {
    if (!this.totalShareSupply || this.invalidStakeAmount) {
      return new BigNumber(0)
    }
    return new BigNumber(this.stakeForm.amount).div(this.totalShareSupply.plus(this.stakeForm.amount)).times(100)
  }

  get normalizeStakeAmount() {
    return this.stakeForm.amount ? new BigNumber(this.stakeForm.amount) : _0
  }

  get normalizeUnstakeAmount() {
    return this.unstakeForm.amount ? new BigNumber(this.unstakeForm.amount) : _0
  }

  get steps() {
    const steps = [{ label: this.$t('dao.stake'), action: this.onStakeEvent.bind(this) }]
    if (!this.isApproved) {
      steps.unshift({
        label: `${this.$t('base.approve')}`,
        action: this.onApproveEvent.bind(this),
      })
    }
    return steps
  }

  validateInputNumber(value: string): string {
    if (value === '') {
      return ''
    }
    const valueFloat = Number(value)
    if (isNaN(valueFloat) || valueFloat < 0) {
      return this.$t('commonErrors.inputError').toString()
    }
    return ''
  }

  validateStakeAmount(): string {
    if (!this.normalizeStakeAmount || !this.walletBalance || !this.isConnectedWallet) {
      return ''
    }
    if (this.walletBalance.lt(_0)) {
      return this.$t('commonErrors.InsufficientWallet').toString()
    }
    if (this.normalizeStakeAmount.gt(this.walletBalance) || this.normalizeStakeAmount.lt(_0)) {
      return this.$t('commonErrors.inputMinMaxError', {
        min: _0.toFormat(0),
        max: this.walletBalance.toFormat(),
      }).toString()
    }
    return ''
  }

  validateUnstakeAmount(): string {
    if (!this.normalizeUnstakeAmount || !this.myShareBalance || !this.isConnectedWallet) {
      return ''
    }
    if (this.normalizeUnstakeAmount.gt(this.myShareBalance) || this.normalizeUnstakeAmount.lt(_0)) {
      return this.$t('commonErrors.inputMinMaxError', {
        min: _0.toFormat(0),
        max: this.myShareBalance.toFormat(),
      }).toString()
    }
    return ''
  }

  reSetForm() {
    this.stakeForm.amount = ''
    this.stakeForm.amountProportion = 0
    this.unstakeForm.amount = ''
    this.unstakeForm.amountProportion = 0
  }

  onConnectWallet() {
    VUE_EVENT_BUS.emit(COMMON_EVENT.SHOW_SELECT_WALLET_POPUP)
  }

  async onApproveEvent() {
    try {
      await this.callChainFunc(async () => {
        await this.approve()
      }, undefined, true)
    } catch (e) {
      this.showError(e)
    }

    if (!this.normalizeStakeAmount.isZero() &&this.allowance.gte(this.normalizeStakeAmount)) {
      this.stakeForm.activeStep = 1
    }
  }

  async onStakeEvent() {
    try {
      await this.callChainFunc(async () => {
        await this.stakeSATORIToken(this.normalizeStakeAmount)
        await this.updateData()
        this.reSetForm()
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
      }, undefined, true)
    } catch (e) {
      this.showError(e, false)
    }

    // refresh form validate
    await this.validateUnstakeForm()
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

<style lang="scss">

</style>

<style lang="scss" scoped>
.mcb-stake {
  .mcb-stake-container {
    padding: 16px;

    .operating-panel {
      margin-top: 16px;
      padding: 16px;
      width: 100%;
      border-radius: 24px;
      background: var(--mc-background-color);

      .input-container {
        margin-top: 12px;
        width: 100%;
        border: 1px solid var(--mc-border-color);
        min-height: 100px;
        border-radius: 12px;
        padding: 16px;
      }

      .radio-group-tabs ::v-deep {
        .blue-radio {
          color: var(--mc-color-blue);
          background: var(--mc-background-color);
        }

        .orange-radio {
          color: var(--mc-color-orange);
          background: var(--mc-background-color);
        }
      }

      .input-container-sub-info {
        margin-top: 8px;
        padding: 0 4px;
      }

      .form-box {
        margin-top: 16px;

        ::v-deep {
          .van-form {
            .van-cell {
              padding: 0;
              background-color: transparent;
            }

            .van-field__control {
              color: var(--mc-text-color-white);
              font-size: 24px;
              font-weight: 400;
              caret-color: var(--mc-text-color-white);
            }

            input::-webkit-input-placeholder{
              color: var(--mc-text-color-dark);
            }

            .van-field__right-icon {
              color: var(--mc-text-color-white);
              font-size: 16px;
              font-weight: 400;
            }
          }
        }
      }

      .proportion-box {
        margin-top: 20px;

        .blue-selected {
          ::v-deep {
            .is-selected {
              border: 1px solid var(--mc-color-blue);
              color: var(--mc-color-blue);
            }
          }
        }

        .orange-selected {
          ::v-deep {
            .is-selected {
              border-color: var(--mc-color-orange);
              color: var(--mc-color-orange);
            }
          }
        }
      }

      .button-box {
        margin-top: 16px;
      }
    }

    .info-panel {
      margin-top: 16px;
      border-radius: 24px;
      background: var(--mc-background-color);
      padding: 16px;

      .title {
        font-size: 18px;
        font-weight: 400;
        color: var(--mc-text-color-white);
      }

      .content {
        margin-top: 16px;
        width: 100%;
        border: 1px solid var(--mc-border-color);
        border-radius: 12px;
        padding: 16px;

        .line-item {
          line-height: 26px
        }
      }

      .button-box {
        margin-top: 24px;
      }

      .claimable-list {
        text-align: right;
        color: var(--mc-text-color-white);
      }
    }

    .button-box {
      .more-button {
        ::v-deep {
          .state-button {
            width: calc(50% - 8px);
          }
          .state-button:first-child {
            margin-right: 15px;
          }
        }
      }

      .single-button {
        ::v-deep {
          .state-button {
            width:  100%;
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
      color: var(--mc-text-color);
    }

    .value {
      color: var(--mc-text-color-white);
    }
  }
}
</style>
