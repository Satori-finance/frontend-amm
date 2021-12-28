<template>
  <div class="pool-liquidity-container">
    <McLoading :show-loading="loading" :hide-content="true" :mask-color="'transparent'">
      <div class="pool-liquidity">
        <div class="container">
          <div class="info-panel">
            <div class="perps-box">
              <PerpetualsPanel
                :perpetuals="poolBaseInfo ? poolBaseInfo.perpetuals : []"
                :collateral-symbol="poolBaseInfo ? poolBaseInfo.collateralSymbol : ''"
              />
            </div>
            <div class="my-info">
              <div class="title">{{ $t('pool.myLiquidity') }}</div>
              <div class="info-box">
                <div class="info-box-container">
                  <div>
                    <span>{{ $t('pool.liquidityPage.liquidityPool') }}</span>
                    <span class="value">{{ poolAddress | ellipsisMiddle }} ({{ collateralSymbol }})</span>
                  </div>
                  <div>
                    <span>{{ $t('pool.liquidityPage.myLpToken') }}</span>
                    <span class="value" v-if='isConnectedWallet'>{{
                        shareTokenBalance | bigNumberFormatterByPrecision
                      }}</span>
                  </div>
                  <div>
                    <span>{{ $t('base.share') }}</span>
                    <span class="value" v-if='isConnectedWallet'>{{
                        shareTokenPercentage | bigNumberFormatterByPrecision(2)
                      }} %</span>
                  </div>
                  <div>
                    <span>{{ $t('pool.liquidityPage.pooled') }}</span>
                    <span class="value" v-if='isConnectedWallet'
                    >{{ pooledCollateral | bigNumberFormatter(collateralDecimals) }} {{ collateralSymbol }}</span
                    >
                  </div>
                  <div v-if="isLPTokenLocked">
                    <span>{{ $t('pool.liquidityPage.lockedByVoting') }}</span>
                    <span class="value">{{ shareTokenBalance | bigNumberFormatterByPrecision }} LP Token</span>
                  </div>
                  <div v-if="isLPTokenLocked">
                    <span>{{ $t('pool.liquidityPage.unlockTime') }}</span>
                    <span class="value">{{ lpTokenUnlockTime | timestampFormatter }}</span>
                  </div>
                  <div v-if="liquidityLockComputed.isLocked">
                    <span>{{ $t('pool.liquidityPage.liquidityLpLocked') }}</span>
                    <span class="value">{{ shareTokenBalance | bigNumberFormatterByPrecision }} LP Token</span>
                  </div>
                  <div v-if="liquidityLockComputed.isLocked" class="multiple-line">
                    <span>{{ $t('pool.liquidityPage.liquidityUnlockTime') }}</span>
                    <span class="value">
                      <span>{{ liquidityLockComputed.remainingBlocks }} blocks</span><br/>
                      ( ≈ {{ liquidityLockComputed.unlockTime | timestampFormatter('YYYY.MM.DD hh:mm') }})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="operating-panel">
            <div class="tabs">
              <el-radio-group v-model="activatedLiquidityTab" size="medium">
                <el-radio-button label="add">{{ $t('base.add') }}</el-radio-button>
                <el-radio-button label="remove">{{ $t('base.remove') }}</el-radio-button>
              </el-radio-group>
            </div>
            <template v-if="isAddTab">
              <div class="input">
                <div class="input-head">
                  <span>{{ $t('base.collateralAmount') }}</span>
                  <span v-if="isConnectedWallet">
                    {{ $t('base.walletBalance') }}
                    <span class="value">
                      <template>
                        <span v-if='isNativeToken'>
                          {{ nativeTokenBalance | bigNumberFormatter(collateralDecimals) }} {{ collateralSymbol }}
                        </span>
                        <span v-else>
                          {{ walletCollateralBalance | bigNumberFormatter(collateralDecimals) }} {{ collateralSymbol }}
                        </span>
                        <div class="label-group" v-if='isNativeToken'>
                          <span>
                            {{ walletCollateralBalance | bigNumberFormatter(collateralDecimals) }} WETH</span>
                            <a @click="showWrapDialog"> <i class="iconfont icon-h-switch"></i></a>
                        </div>
                      </template>
                    </span>
                  </span>
                </div>
                <div class="input-box">
                  <el-form
                    size="large"
                    :model="addForm"
                    :rules="addFormRule"
                    ref="addLiquidityForm"
                    :inline-message="true"
                    @submit.native.prevent
                  >
                    <div class="input-item">
                      <el-form-item prop="amount">
                        <el-input v-model.trim="addAmount" size="large">
                          <template slot="suffix">
                            <div class="suffix-box">
                              <span class="max-btn" v-if="isConnectedWallet">
                                <el-button type="primary" plain @click="setAddMax" size="mini" round>
                                  {{ $t('base.max') }}
                                </el-button>
                              </span>
                              <span class="symbol">
                                <span>{{ inputCollateralSymbol }}</span>
                              </span>
                            </div>
                          </template>
                        </el-input>
                      </el-form-item>
                    </div>
                  </el-form>
                </div>
                <div class="slider">
                  <span class="left">
                    <McSimpleSlider
                      :disabled="!walletCollateralBalance || walletCollateralBalance.isZero()"
                      :value="addAmountProportion"
                      @input="setAddAmountProportion"
                      :step="1"
                      :max="100"
                      :tooltip-unit="'%'"
                    />
                  </span>
                  <span class="right value"> {{ addAmountProportion | bigNumberFormatter(0) }} % </span>
                </div>
                <div class="share-info">
                  <div>
                    <span>{{ $t('pool.liquidityPage.lpToken') }}</span>
                    <span class="value">{{ deltaAddShareToken | bigNumberFormatterByPrecision }}</span>
                  </div>
                  <div>
                    <span>{{ $t('pool.shareOfPool') }}</span>
                    <span class="value">{{ deltaAddSharePercentage | bigNumberFormatterByPrecision(2) }} %</span>
                  </div>
                </div>
                <div
                  v-if="
                    this.liquidityPoolStorage &&
                    (!this.liquidityPoolStorage.isSynced ||
                      !this.liquidityPoolStorage.isRunning ||
                      !this.normalStatusPerpetual)
                  "
                  class="warning-tip-panel"
                >
                  {{ addPromptText }}
                </div>
                <div class="button-box" v-if='isConnectedWallet'>
                  <McSteps :start-label="$t('pool.liquidityPage.addLiquidity')">
                    <template #start="prop">
                      <div class="button-item">
                        <el-button
                          :disabled="invalidAddAmount || invalidAccountAddAmount"
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
                <div class="button-box" v-if='!isConnectedWallet'>
                  <div class="button-item">
                    <el-button
                      size="large"
                      @click="onConnectWallet"
                    >
                      {{ $t('connectWalletButton.connectWallet') }}
                    </el-button>
                  </div>
                </div>
              </div>
              <div class="lock-time-box" v-if="liquidityPoolStorage && liquidityPoolStorage.shareTransferDelay">
                <div class="title">{{ $t('pool.liquidityPage.liquidityLockTime') }}</div>
                <div class="lock-time-prompt">
                  <i18n path="pool.liquidityPage.lockTimeDetail" tag="span">
                    <template slot="lockTime">
                      <el-tooltip
                        placement="top"
                        :open-delay="400"
                      >
                        <span slot="content"
                              v-html="$t('pool.liquidityPage.lockTimePrompt', {number: liquidityPoolStorage.shareTransferDelay, time: l1BlockInterval + 's'})"></span>
                        <span>{{ $t('pool.liquidityPage.lockTime') }}</span>
                      </el-tooltip>
                    </template>
                  </i18n>
                </div>
              </div>
            </template>

            <template v-if="isRemoveTab">
              <div class="input">
                <div class="input-head">
                  <span>{{ $t('pool.lpTokenAmount') }}</span>
                  <span v-if="isConnectedWallet">
                    {{ $t('pool.balance') }}
                    <span class="value">
                      {{ shareTokenBalance | bigNumberFormatterByPrecision }}
                      {{ $t('pool.liquidityPage.lpToken') }}
                    </span>
                  </span>
                </div>
                <div class="input-box">
                  <el-form
                    size="large"
                    :model="removeForm"
                    :rules="removeFormRule"
                    ref="removeLiquidityForm"
                    :inline-message="true"
                    @submit.native.prevent
                  >
                    <div class="input-item">
                      <el-form-item prop="amount">
                        <el-input v-model.trim="removeAmount" size="large">
                          <template slot="suffix">
                            <div class="suffix-box">
                              <span class="max-btn" v-if="isConnectedWallet">
                                <el-button type="primary" plain @click="setRemoveMax" size="mini" round>
                                  {{ $t('base.max') }}
                                </el-button>
                              </span>
                              <span class="symbol">
                                <span>{{ $t('pool.liquidityPage.lpToken') }}</span>
                              </span>
                            </div>
                          </template>
                        </el-input>
                      </el-form-item>
                    </div>
                  </el-form>
                </div>
                <div class="slider">
                  <span class="left">
                    <McSimpleSlider
                      :disabled="maxRemoveShare.isZero()"
                      :value="removeAmountProportion"
                      @input="setRemoveAmountProportion"
                      :step="1"
                      :max="100"
                      :tooltip-unit="'%'"
                    />
                  </span>
                  <span class="right value"> {{ removeAmountProportion | bigNumberFormatter(0) }} % </span>
                </div>
                <div class="share-info">
                  <div v-if="penaltyAfterRemove">
                    <el-tooltip
                      :content="$t('pool.liquidityPage.removePenaltyPrompt')"
                      placement="top"
                      :open-delay="400"
                    >
                      <span>{{ $t('pool.liquidityPage.removePenalty') }}</span>
                    </el-tooltip>
                    <span class="value"
                    >{{ penaltyAfterRemove | bigNumberFormatter(collateralDecimals) }} {{ collateralSymbol }}</span
                    >
                  </div>
                  <div>
                    <span>{{ $t('pool.liquidityPage.receive') }}</span>
                    <span class="value"
                    >{{ receivedAfterRemove | bigNumberFormatter(collateralDecimals) }} {{ collateralSymbol }}</span
                    >
                  </div>
                </div>
                <div v-if="hasEmergencyStatusPerpetual" class="warning-tip-panel">
                  {{ $t('pool.liquidityPage.withdrawSettlePrompt') }}
                </div>
                <div
                  class="warning-tip-panel"
                  v-else-if="
                    !this.liquidityPoolStorage.isSynced ||
                    !this.isSafe ||
                    this.isLPTokenLocked ||
                    !this.liquidityPoolStorage.isRunning
                  "
                >
                  {{ removePromptText }}
                </div>
                <div class="warning-insufficient-liquidity" v-else-if='isShowRemoveInsufficientTip'>
                  {{ $t('pool.liquidityPage.maxRemoveShare') }}
                  <span class="click-value" @click="setRemovableMax">
                    {{ maxRemoveShare | bigNumberFormatter() }} {{ $t('pool.liquidityPage.lpToken') }}
                  </span>
                </div>
                <div class="button-box" v-if='isConnectedWallet'>
                  <div class="button-item">
                    <el-button
                      :disabled="invalidRemoveAmount || invalidAccountRemoveAmount || liquidityLockComputed.isLocked"
                      :loading="removing"
                      size="large"
                      type="orange"
                      @click="onRemoveLiquidityEvent"
                    >
                      {{ $t('pool.liquidityPage.removeLiquidity') }}
                      <el-tooltip
                        placement="top"
                        :open-delay="400"
                      >
                        <span slot="content">
                          <i18n path="pool.liquidityPage.removeLiquidityLockPrompt" tag="span">
                            <template slot="time">
                              {{ liquidityLockComputed.unlockTime | timestampFormatter('YYYY.MM.DD hh:mm') }}
                            </template>
                          </i18n>
                        </span>
                        <i v-if="liquidityLockComputed.isLocked" class="iconfont icon-lock"></i>
                      </el-tooltip>
                    </el-button>
                  </div>
                </div>
                <div class="button-box" v-if='!isConnectedWallet'>
                  <div class="button-item">
                    <el-button
                      size="large"
                      @click="onConnectWallet"
                    >
                      {{ $t('connectWalletButton.connectWallet') }}
                    </el-button>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </McLoading>
    <WrapDialog :visible.sync="isShowWrapDialog"/>
    <AddLiquidityRiskDialog ref="riskDialog"/>

  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch, Prop, Ref } from 'vue-property-decorator'
import { PoolLiquidityMixin } from '@/template/components/Pool/poolLiquidityMixin'
import PerpetualsPanel from './Components/PerpetualsPanel.vue'
import { McLoading, McSimpleSlider, McStepItem, McSteps } from '@/components'
import BigNumber from 'bignumber.js'
import { _0, computeAMMShareToMint } from '@mcdex/mai3.js'
import { ElForm } from 'element-ui/types/form'
import { GLOBAL_NOTIFICATION_EVENT, VUE_EVENT_BUS, WALLET_EVENT } from '@/event'
import { NOTIFICATION_KEY } from '@/type'
import { SATORI_ADDRESS, MiningTokenSymbol } from '@/constants'
import WrapDialog from '@/template/Dialogs/WrapDialog.vue'
import AddLiquidityRiskDialog from '@/template/Dialogs/AddLiquidityRiskDialog.vue'
import { namespace } from 'vuex-class'

const wallet = namespace('wallet')

@Component({
  components: {
    PerpetualsPanel,
    McSimpleSlider,
    McLoading,
    WrapDialog,
    McSteps,
    McStepItem,
    AddLiquidityRiskDialog,
  },
})
export default class PoolLiquidity extends Mixins(PoolLiquidityMixin) {
  @Prop({ required: true }) _poolAddress !: string
  @wallet.State('nativeTokenBalance') nativeTokenBalance!: BigNumber | null

  @Ref('riskDialog') riskDialog!: AddLiquidityRiskDialog

  mounted() {
    this.updateData()
  }

  private activatedLiquidityTab: 'add' | 'remove' = 'add'
  private isShowWrapDialog: boolean = false
  protected miningTokenSymbol: string = MiningTokenSymbol

  private addFormRule = {
    amount: [
      { validator: this.validateInputNumber, trigger: 'change' },
      { validator: this.validateAddAmount, trigger: 'change' },
    ],
  }
  private removeFormRule = {
    amount: [
      { validator: this.validateInputNumber, trigger: 'change' },
      { validator: this.validateMaxRemoveAmount, trigger: 'change' },
      { validator: this.validateRemoveAmount, trigger: 'change' },
    ],
  }

  destroyed() {
    VUE_EVENT_BUS.emit(GLOBAL_NOTIFICATION_EVENT.HIDE, 'error', NOTIFICATION_KEY.OracleError)
  }

  get isAddTab(): boolean {
    return this.activatedLiquidityTab === 'add'
  }

  get isRemoveTab(): boolean {
    return this.activatedLiquidityTab === 'remove'
  }

  // add liquidity getter
  get addAmount(): string {
    return this.addForm.amount
  }

  set addAmount(val: string) {
    this.addForm.amount = val
    if (this.walletCollateralBalance && !this.walletCollateralBalance.isZero()) {
      const num = new BigNumber(val)
      this.addForm.amountProportion = num.isNaN()
        ? 0
        : Math.max(
          0,
          Math.min(
            100,
            num
              .div(this.walletCollateralBalance)
              .times(100)
              .toNumber(),
          ),
        )
    }
  }

  get inputCollateralSymbol(): string {
    return this.isNativeToken ? 'WETH' : this.collateralSymbol
  }

  get afterAddInfo(): { shareToMint: BigNumber; poolMargin: BigNumber; newPoolMargin: BigNumber } | null {
    if (!this.liquidityPoolStorage || this.invalidAddAmount) {
      return null
    }
    try {
      return computeAMMShareToMint(this.liquidityPoolStorage, this.shareTotalSupply, this.normalizeAddAmount)
    } catch (e) {
      console.warn(`add liquidity failed. share amount too large. ${this.normalizeAddAmount.toFixed()}`)
      return null
    }
  }

  get deltaAddShareToken(): BigNumber | null {
    if (!this.afterAddInfo) {
      return null
    }
    return this.afterAddInfo.shareToMint
  }

  get deltaAddSharePercentage() {
    if (!this.afterAddInfo) {
      return null
    }
    return this.afterAddInfo.shareToMint.div(this.shareTotalSupply.plus(this.afterAddInfo.shareToMint)).times(100)
  }

  get addAmountProportion(): number {
    return this.addForm.amountProportion
  }

  // remove liquidity getter
  get removeAmount(): string {
    return this.removeForm.amount
  }

  set removeAmount(val: string) {
    this.removeForm.amount = val
    if (this.shareTokenBalance && !this.shareTokenBalance.isZero()) {
      const num = new BigNumber(val)
      this.removeForm.amountProportion = num.isNaN()
        ? 0
        : Math.max(
          0,
          Math.min(
            100,
            num
              .div(this.shareTokenBalance)
              .times(100)
              .toNumber(),
          ),
        )
    }
  }

  get removeAmountProportion(): number {
    return this.removeForm.amountProportion
  }

  get receivedAfterRemove(): BigNumber | null {
    if (!this.afterRemoveInfo) {
      return null
    }
    return this.afterRemoveInfo.cashToReturn
  }

  get steps() {
    const steps = [{ label: this.$t('pool.liquidityPage.addLiquidity'), action: this.onAddLiquidityEvent.bind(this) }]
    if (!this.isApproved) {
      steps.unshift({
        label: `${this.$t('base.approve')} ${this.collateralSymbol}`,
        action: this.onApproveEvent.bind(this),
      })
    }
    return steps
  }

  setAddAmountProportion(val: number) {
    this.addForm.amountProportion = val
    if (this.walletCollateralBalance) {
      this.addForm.amount =
        val === 100
          ? this.walletCollateralBalance.toFixed()
          : val !== 0
            ? new BigNumber(val)
              .div(100)
              .times(this.walletCollateralBalance)
              .toFixed(this.collateralDecimals)
            : ''
    }
  }

  setRemoveAmountProportion(val: number) {
    if (this.isLPTokenLocked) {
      return
    }
    this.removeForm.amountProportion = val
    if (this.shareTokenBalance) {
      this.removeForm.amount =
        val === 100
          ? this.shareTokenBalance.toFixed()
          : val !== 0
            ? new BigNumber(val)
              .div(100)
              .times(this.shareTokenBalance)
              .precision(5, BigNumber.ROUND_DOWN)
              .toFixed()
            : ''
    }
  }

  setAddMax() {
    if (this.isConnectedWallet) {
      this.addForm.amount = this.walletCollateralBalance?.toFixed() || ''
      this.addForm.amountProportion = 100
    } else {
      this.addForm.amount = ''
      this.addForm.amountProportion = 0
    }
  }

  setRemoveMax() {
    if (this.isConnectedWallet) {
      this.removeForm.amount = this.shareTokenBalance.toFixed()
      this.removeForm.amountProportion = 100
    } else {
      this.removeForm.amount = ''
      this.removeForm.amountProportion = 0
    }
  }

  setRemovableMax() {
    if (this.isLPTokenLocked) {
      this.removeForm.amount = '0'
      return
    }
    if (this.maxRemoveShare && this.shareTotalSupply) {
      this.removeForm.amount = this.maxRemoveShare.toFixed()
      const v = this.maxRemoveShare.div(this.shareTokenBalance).times(100)
      this.removeForm.amountProportion = v.isNaN() ? 0 : v.toNumber()
    }
  }

  async onApproveEvent() {
    await this.callChainFunc(async () => {
      await this.approve()
    }, undefined, true)
  }

  async onAddLiquidityEvent() {
    if (this.poolOracleHasError) {
      return
    }
    await new Promise((resolve, reject) => {
      this.riskDialog.show(confirmed => {
        if (confirmed) {
          resolve()
        } else {
          reject()
        }
      })
    })
    try {
      await this.callChainFunc(async () => {
        await this.addLiquidity(this.normalizeAddAmount)
      }, undefined, true)
    } catch (e) {
      this.$notify({
        type: 'error',
        title: this.$t(e.helpCaptionKey).toString(),
        message: this.$t(e.helpKey, { message: e.message }).toString(),
        position: 'bottom-right',
        customClass: 'is-error',
      })
      throw e
    }
    await this.updateData()
    this.getLiquidityUnlockTime()
    // refresh form validate
    await this.validateAddForm()
    this.addForm.amount = ''
    this.addForm.amountProportion = 0
  }

  async onRemoveLiquidityEvent() {
    if (this.poolOracleHasError) {
      return
    }
    try {
      await this.callChainFunc(async () => {
        await this.removeLiquidity(this.normalizeRemoveAmount)
        await this.updateData()
      }, undefined, true)
    } catch (e) {
      this.$notify({
        type: 'error',
        title: this.$t(e.helpCaptionKey).toString(),
        message: this.$t(e.helpKey, { message: e.message }).toString(),
        position: 'bottom-right',
        customClass: 'is-error',
      })
    }
    // refresh form validate
    await this.validateRemoveForm()
    this.removeForm.amount = ''
    this.removeForm.amountProportion = 0
  }

  @Watch('poolOracleHasError', { immediate: true })
  onLiquidityPoolOracleChanged() {
    if (!this.liquidityPool || !this.liquidityPool.liquidityPoolStorage.isRunning) {
      return
    }
    if (this.poolOracleHasError) {
      VUE_EVENT_BUS.emit(GLOBAL_NOTIFICATION_EVENT.SHOW, {
        type: 'error',
        key: NOTIFICATION_KEY.OracleError,
        i18nKey: 'globalNotification.oracleError',
      })
    } else {
      VUE_EVENT_BUS.emit(GLOBAL_NOTIFICATION_EVENT.HIDE, 'error', NOTIFICATION_KEY.OracleError)
    }
  }

  onConnectWallet() {
    VUE_EVENT_BUS.emit(WALLET_EVENT.ShowConnectWallet)
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

  validateAddAmount(rule: any, value: string, callback: Function) {
    if (!this.normalizeAddAmount || !this.walletCollateralBalance || !this.isConnectedWallet) {
      callback()
      return
    }
    if (this.walletCollateralBalance.lte(_0)) {
      callback(new Error(this.$t('commonErrors.InsufficientWallet').toString()))
      return
    }
    if (this.normalizeAddAmount.gt(this.walletCollateralBalance) || this.normalizeAddAmount.lt(_0)) {
      callback(
        new Error(
          this.$t('commonErrors.exceedMaxAmountError', {
            max: this.walletCollateralBalance.toFormat(this.collateralDecimals || 0),
          }).toString(),
        ),
      )
      return
    }
    callback()
  }

  validateMaxRemoveAmount(rule: any, value: string, callback: Function) {
    if (!this.normalizeRemoveAmount || !this.maxRemoveShare || !this.isConnectedWallet) {
      callback()
      return
    }
    if (this.normalizeRemoveAmount.gt(this.shareTokenBalance)) {
      callback(new Error(this.$t('commonErrors.insufficientShareAmount').toString()))
      return
    }

    if (this.normalizeRemoveAmount.gt(this.maxRemoveShare)) {
      callback(new Error(this.$t('commonErrors.insufficientLiquidityError').toString()))
      return
    }
    callback()
  }

  validateAddForm() {
    const form = this.$refs.addLiquidityForm as ElForm
    try {
      form.validate()
    } catch (e) {
      // ignore validate error, form had handle error
    }
  }

  validateRemoveForm() {
    const form = this.$refs.removeLiquidityForm as ElForm
    try {
      form.validate()
    } catch (e) {
      // ignore validate error, form had handle error
    }
  }

  validateRemoveAmount(rule: any, value: string, callback: Function) {
    if (!this.normalizeRemoveAmount || !this.shareTokenBalance || !this.isConnectedWallet) {
      callback()
      return
    }
    if (this.normalizeRemoveAmount.gt(this.shareTokenBalance) || this.normalizeRemoveAmount.lt(_0)) {
      callback(
        new Error(
          this.$t('commonErrors.exceedMaxAmountError', {
            max: this.shareTokenBalance.toFormat(this.collateralDecimals || 0),
          }).toString(),
        ),
      )
      return
    }
    callback()
  }

  @Watch('_poolAddress', { immediate: true })
  _onPoolAddressChanged() {
    this.poolAddress = this._poolAddress
  }

  showWrapDialog() {
    this.isShowWrapDialog = true
  }
}
</script>

<style lang="scss" scoped>
@import '~@mcdex/style/common/var';

.pool-liquidity-container {

  .mc-loading {
    display: flex;
    min-height: 500px;
  }

  .pool-liquidity {
    min-height: 100%;

    .value {
      color: var(--mc-text-color-white);
      margin-left: 2px;
      text-align: right;

      .label-group {
        margin-top: 10px;
        text-align: right;

        .iconfont {
          margin-left: 6px;
          font-size: 14px;
          color: var(--mc-color-brand);
        }
      }
    }

    .container {
      margin: 70px 159px 142px 194px;
      display: flex;

      .info-panel {
        display: inline-block;
        width: 363px;
        margin-right: 200px;

        .perps-box {
          display: inline-block;
          width: 100%;
        }

        .my-info {
          margin-top: 20px;

          .title {
            color: var(--mc-text-color-white);
            font-size: 16px;
            font-weight: 700;
          }

          .info-box {
            display: inline-block;
            width: 100%;
            background-color: rgba($--mc-background-color-dark, 0.5);
            border-radius: 4px;
            margin-top: 20px;

            .info-box-container {
              padding: 12px 20px;

              div {
                display: flex;
                justify-content: space-between;
                font-size: 13px;
                font-weight: 400;
                color: var(--mc-text-color);
                padding: 8px;

                &.multiple-line {
                  align-items: flex-start;

                  .value {
                    line-height: 16px;
                  }
                }
              }
            }
          }
        }
      }

      .operating-panel {
        display: inline-block;
        width: 360px;

        .tabs {
          ::v-deep.el-radio-group {
            width: 100%;

            .el-radio-button {
              width: 180px;

              .el-radio-button__inner {
                width: 100%;
              }
            }
          }
        }

        .input {
          margin-top: 30px;

          .input-head {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            color: var(--mc-text-color);
          }

          .input-box {
            margin-top: 10px;

            ::v-deep .el-input__inner {
              font-size: 16px;
            }

            .symbol {
              font-size: 16px;
              color: var(--mc-text-color);
            }

            .suffix-box {
              display: flex;
              align-items: center;
              line-height: 1;
            }

            .max-btn {
              margin-right: 12px;

              .el-button {
                height: 24px;
                min-width: 49px;
              }
            }
          }
        }

        .slider {
          display: flex;
          justify-content: space-between;
          height: 23px;
          line-height: 23px;

          .left {
            width: 297px;
            margin-left: 7px;
          }

          .right {
            font-size: 12px;
            margin-right: 4px;
          }
        }

        .checkbox {
          margin-top: 20px;

          ::v-deep .el-checkbox__label {
            color: var(--mc-text-color);
          }
        }

        .share-info {
          margin-top: 20px;

          div {
            display: flex;
            justify-content: space-between;
            color: var(--mc-text-color);
            height: 24px;
            margin-top: 20px;
            line-height: 24px;
            font-size: 18px;
            font-weight: 700;
          }
        }

        .button-box {
          margin-top: 30px;

          .button-item {
            width: 100%;

            .el-button {
              width: 100%;
            }
          }
        }
      }
    }

    .warning-tip-panel {
      margin-top: 10px;
      border-radius: 4px;
      background-color: rgba($--mc-color-warning, 0.1);
      padding: 10px;
      color: var(--mc-color-warning);
      font-size: 12.8px !important;
      line-height: 16px;
    }

    .warning-insufficient-liquidity {
      @extend .warning-tip-panel;
      font-size: 13px !important;
      line-height: 16px;

      .click-value {
        text-decoration: underline;
        cursor: pointer;
      }
    }
  }

  .lock-time-box {
    background: var(--mc-background-color-dark);
    border: 1px solid var(--mc-border-color);
    box-sizing: border-box;
    border-radius: 12px;
    margin-top: 24px;
    padding: 16px;

    .title {
      font-size: 12px;
      line-height: 16px;
    }

    .lock-time-prompt {
      margin-top: 8px;
      font-size: 14px;
      line-height: 20px;
      color: var(--mc-text-color);
    }
  }

  .icon-lock {
    cursor: pointer;
  }
}
</style>
