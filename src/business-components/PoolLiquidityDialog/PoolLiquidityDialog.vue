<template>
  <div>
    <el-dialog
      @close="onCloseDialog"
      custom-class="is-large is-round pool-liquidity-dialog"
      append-to-body
      top="0"
      :visible.sync="visible"
      :close-on-click-modal="false"
      :title="title">
      <McLoading
        :mask-color="'transparent'"
        :show-loading="loadingData"
        :min-show-time="500"
        :show-loading-text="false"
        :hide-content="loadingData"
      >
        <div class="dialog-container">
          <!-- left container -->
          <div class="left-container">
            <div class="info-panel">
              <div class="panel-title">{{ $t('pool.liquidityPage.dialog.poolInfo') }}</div>
              <div class="panel-context">
                <div class="info-item">
                  <span class="label">{{ $t('base.address') }}</span>
                  <span class="value address-text">
                    {{ poolAddress | ellipsisMiddle }}
                    <i class="iconfont icon-copy-bold icon-item" @click.stop="copyToClipboard(poolAddress)"></i>
                  </span>
                </div>
                <div class="info-item">
                  <span class="label">
                    <el-popover
                      placement="bottom"
                      width="320"
                      popper-class="apy-popover fantasy"
                      trigger="hover"
                    >
                    <div class="apy-box">
                      <div class="apy-item">
                        <div>{{ $t('dao.totalAPY') }}</div>
                        <div>{{ totalApy | bigNumberFormatter(2) }}%</div>
                      </div>
                      <div class="apy-item">
                        <div>{{ $t('dao.lpAPY') }}</div>
                        <div>{{ lpApy | bigNumberFormatter(2) }}%</div>
                      </div>
                      <div class="apy-item">
                        <div>{{ $t('dao.miningAPY') }}</div>
                        <div>{{ miningApy | bigNumberFormatter(2) }}%</div>
                      </div>
                      <div v-html="$t('dao.totalAPYPromp')"></div>
                    </div>
                    <div class="tooltip-box" slot="reference">
                      {{ $t('base.APY') }}
                    </div>
                  </el-popover>
                  </span>
                  <span class="value">
                    <PNNumber
                      :number="totalApy"
                      :showPlusSign="true"
                      :decimals="2"
                      suffix="%"
                    />
                  </span>
                </div>
                <div class="info-item">
                  <span class="label">{{ $t('pool.liquidityPage.dialog.totalLiquidity') }}</span>
                  <span class="value">
                    <span v-if="poolBaseInfo && poolBaseInfo.poolMarginUSD">
                      ${{ poolBaseInfo.poolMarginUSD | bigNumberFormatter(2) }}
                    </span>
                    <span v-else>
                      {{ poolBaseInfo ? poolBaseInfo.poolMargin : 0 | bigNumberShortenFormat }} {{ collateralSymbol }}
                    </span>
                  </span>
                </div>
                <div class="info-item">
                  <span class="label">{{ $t('pool.liquidityPage.dialog.netAssetValue') }}</span>
                  <span class="value">
                    {{ netAssetValue | bigNumberFormatter(netAssetValueDecimals) }} {{ collateralSymbol }} / LP Token
                  </span>
                </div>
              </div>
            </div>
            <div class="info-panel">
              <div class="panel-title">{{ $t('pool.liquidityPage.dialog.selfInfo') }}</div>
              <div class="panel-context">
                <div class="info-item">
                  <span class="label">{{ $t('pool.liquidityPage.lpToken') }}</span>
                  <span class="value">{{ shareTokenBalance | bigNumberFormatter(1) }}</span>
                </div>
                <div class="info-item">
                  <span class="label">{{ $t('pool.liquidityPage.youShare') }}</span>
                  <span class="value">{{ shareTokenPercentage | bigNumberFormatter(2) }}%</span>
                </div>
                <div class="info-item">
                  <span class="label">
                    {{ $t('pool.liquidityPage.youPooled') }}
                  </span>
                  <span class="value">
                    {{ pooledCollateral | bigNumberFormatterTruncateByPrecision(6, 1, 2) }}
                    <TokenImageView :token="collateralSymbol" :size="18"/>
                  </span>
                </div>
                <div class="info-item claim-line" v-if="isMiningPool || !claimableReward.eq(0)">
                  <span class="label">{{ $t('pool.liquidityPage.claimableRewards') }}</span>
                  <span>
                    <span class="claim-value">
                      {{ claimableReward | bigNumberFormatterTruncateByPrecision(8, 1, 2) }}
                      <TokenImageView :token="'SATORI'" :size="18"/>
                    </span>
                    <el-button class="claim-button" size="small" type="primary" @click="onClaimEvent"
                               :disabled="invalidClaimReward || claimState==='loading'"
                               :loading="claimState==='loading'">
                      {{ $t('base.claim') }}
                    </el-button>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <!-- right container -->
          <div class="right-container">
            <div class="tabs-container">
              <McRadioTabs
                v-model="activatedLiquidityTab"
                :class="[activatedLiquidityTab]"
                :options="[
                  {label: $t('base.add'), value: 'add'},
                  {label: $t('base.remove'), value: 'remove'},
                ]"
              />
            </div>
            <template v-if="activatedLiquidityTab === 'add'">
              <div class="input-container">
                <div class="info-line">
                  <span>{{ $t('base.amount') }}</span>
                  <span>
                    {{ $t('base.walletBalance') }}:
                    {{ walletCollateralBalance | bigNumberFormatter(collateralDecimals) }}
                  </span>
                </div>
                <div class="input-line">
                  <el-form size="medium" :model="addForm" :rules="addFormRule" ref="addFormRef"
                           @submit.native.prevent>
                    <el-form-item prop="amount" :inline-message="true">
                      <el-input v-model="addAmount" size="large" placeholder="0.0">
                        <template slot="suffix">
                          <TokenImageView :token="collateralSymbol" :size="24"/>
                          {{ collateralSymbol }}
                        </template>
                      </el-input>
                    </el-form-item>
                  </el-form>
                </div>
                <div class="radio-line">
                  <McRadioGroup v-model="addAmountProportion"
                                :values="[25, 50, 75, 100]"
                                suffix="%"/>
                </div>
              </div>
              <div class="info-container">
                <div class="text-line">
                  <span class="label">{{ $t('pool.liquidityPage.lpTokensToMint') }}</span>
                  <span class="value">{{ deltaAddShareToken | bigNumberFormatterByPrecision }}</span>
                </div>
                <div class="text-line">
                  <span class="label">{{ $t('pool.shareOfPool') }}</span>
                  <span class="value">{{
                      deltaAddSharePercentage | bigNumberFormatterByPrecision(2)
                    }}<template v-if="deltaAddSharePercentage">%</template></span>
                </div>
              </div>
              <div class="button-container">
                <McSteps :start-label="$t('pool.liquidityPage.addLiquidity')">
                  <template #start="prop">
                    <div class="button-item">
                      <el-button size="large" type="blue" @click="prop.start.start" :loading="prop.start.running"
                                 :disabled="invalidAddAmount || invalidAccountAddAmount || !isConnectedWallet">
                        {{ prop.start.label }}
                      </el-button>
                    </div>
                  </template>
                  <McStepItem v-for="(step, index) in steps" :action="step.action" :label="step.label"
                              :key="index"></McStepItem>
                </McSteps>
              </div>
            </template>
            <template v-if="activatedLiquidityTab === 'remove'">
              <div class="input-container">
                <div class="info-line">
                  <span>{{ $t('base.amount') }}</span>
                  <span>
                  {{ $t('base.balance') }}:
                  {{ shareTokenBalance | bigNumberFormatterByPrecision }}
                </span>
                </div>
                <div class="input-line">
                  <el-form size="medium" :model="removeForm" :rules="removeFormRule" ref="removeFormRef"
                           @submit.native.prevent>
                    <el-form-item prop="amount" :inline-message="true">
                      <el-input v-model="removeAmount" size="large" placeholder="0.0">
                        <template slot="suffix">
                          <TokenImageView token="LP Token" :size="24"/>
                          LP Token
                        </template>
                      </el-input>
                    </el-form-item>
                  </el-form>
                </div>
                <div class="radio-line">
                  <McRadioGroup v-model="removeAmountProportion"
                                :values="[25, 50, 75, 100]"
                                suffix="%"/>
                </div>
              </div>
              <div class="info-container">
                <div class="text-line">
                  <span class="label">
                    <el-tooltip :content="$t('pool.liquidityPage.removalSlippagePrompt')" placement="top" :open-delay="400">
                      <span>{{ $t('pool.liquidityPage.removalSlippage') }}</span>
                    </el-tooltip>
                  </span>
                  <span class="value">
                    {{ penaltyAfterRemove | bigNumberFormatter(collateralDecimals) }}
                    {{ collateralSymbol }}</span>
                </div>
                <div class="text-line">
                  <span class="label">{{ $t('pool.liquidityPage.youWillReceive') }}</span>
                  <span class="value">
                    {{ receivedAfterRemove | bigNumberFormatter(collateralDecimals) }}
                    {{ collateralSymbol }}
                  </span>
                </div>
              </div>
              <div class="button-container">
                <el-button
                  :disabled="invalidRemoveAmount || invalidAccountRemoveAmount"
                  :loading="removing"
                  size="large"
                  type="orange"
                  @click="onRemoveLiquidityEvent"
                >
                  {{ $t('pool.liquidityPage.removeLiquidity') }}
                </el-button>
              </div>
            </template>
          </div>
        </div>
      </McLoading>
    </el-dialog>
    <AddLiquidityRiskDialog ref="riskDialog"/>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Ref, Watch } from 'vue-property-decorator'
import {
  McLoading,
  McRadioTabs,
  McRadioGroup,
  TokenImageView,
  McStepItem,
  McSteps,
  PNNumber,
} from '@/components'
import { PoolLiquidityMixin } from '@/template/components/Pool/poolLiquidityMixin'
import { copyToClipboard, toBigNumber } from '@/utils'
import { COMMON_EVENT, VUE_EVENT_BUS } from '@/event'
import BigNumber from 'bignumber.js'
import { _0, computeAMMShareToMint } from '@mcdex/mai3.js'
import { ElForm } from 'element-ui/types/form'
import { SATORI_ADDRESS_CONFIG, SUPPORTED_NETWORK_ID } from '@/const'
import AddLiquidityRiskDialog from '@/template/Dialogs/AddLiquidityRiskDialog.vue'

@Component({
  components: {
    McLoading,
    McRadioTabs,
    McRadioGroup,
    TokenImageView,
    McStepItem,
    McSteps,
    PNNumber,
    AddLiquidityRiskDialog,
  },
})
export default class PoolLiquidityDialog extends Mixins(PoolLiquidityMixin) {
  @Ref('riskDialog') riskDialog!: AddLiquidityRiskDialog

  private visible: boolean = false
  private activatedLiquidityTab: 'add' | 'remove' = 'add'

  mounted() {
    VUE_EVENT_BUS.on(COMMON_EVENT.CHANGE_POOL_LIQUIDITY, this.showDialog)
  }

  destroyed() {
    VUE_EVENT_BUS.off(COMMON_EVENT.CHANGE_POOL_LIQUIDITY, this.showDialog)
  }

  get title(): string {
    return this.$t('pool.liquidityPage.dialog.title',
      { symbol: this.collateralSymbol },
    ).toString()
  }

  get loadingData(): boolean {
    return this.loading || this.poolLoading
  }

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

  get addAmount(): string {
    return this.addForm.amount
  }

  set addAmount(val: string) {
    this.addForm.amount = val
    const v = toBigNumber(val)
    if (!this.walletCollateralBalance || this.walletCollateralBalance.isZero()
      || v.isNaN() || v.isZero()) {
      this.addForm.amountProportion = 0
    } else {
      this.addForm.amountProportion = Number(v.div(this.walletCollateralBalance).times(100)
        .toFixed(0, BigNumber.ROUND_DOWN))
    }
  }

  get addAmountProportion(): number {
    return this.addForm.amountProportion
  }

  set addAmountProportion(val: number) {
    this.addForm.amountProportion = val
    if (!this.walletCollateralBalance || this.walletCollateralBalance.isZero()) {
      this.addForm.amount = '0'
    } else {
      this.addForm.amount = this.walletCollateralBalance.times(val).div(100).toFixed(
        this.collateralDecimals, BigNumber.ROUND_DOWN)
    }
  }

  get removeAmount(): string {
    return this.removeForm.amount
  }

  set removeAmount(val: string) {
    this.removeForm.amount = val
    const v = toBigNumber(val)
    if (!this.shareTokenBalance || this.shareTokenBalance.isZero()
      || v.isNaN() || v.isZero()) {
      this.removeForm.amountProportion = 0
    } else {
      this.removeForm.amountProportion = Number(v.div(this.shareTokenBalance).times(100)
        .toFixed(0, BigNumber.ROUND_DOWN))
    }
  }

  get removeAmountProportion(): number {
    return this.removeForm.amountProportion
  }

  set removeAmountProportion(val: number) {
    this.removeForm.amountProportion = val
    if (!this.shareTokenBalance || this.shareTokenBalance.isZero()) {
      this.removeForm.amount = '0'
    } else {
      if (val === 100) {
        this.removeForm.amount = this.shareTokenBalance.toFixed()
      } else {
        this.removeForm.amount = this.shareTokenBalance.times(val).div(100).toFixed(3, BigNumber.ROUND_DOWN)
      }
    }
  }

  get invalidClaimReward() {
    return !this.claimableReward.gt(0)
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

  showDialog(poolAddress: string) {
    this.poolAddress = poolAddress
    this.visible = true
    this.updateData()
    this.updateTokenPrice({
      tokens: [SATORI_ADDRESS_CONFIG[SUPPORTED_NETWORK_ID.ARB]],
      networkId: SUPPORTED_NETWORK_ID.ARB,
    })
  }

  onCloseDialog() {
    this.activatedLiquidityTab = 'add'
    this.poolAddress = ''
    this.poolBaseInfo = null
    this.liquidityAccount = null
    this.addForm.amount = ''
    this.addForm.amountProportion = 0
    this.removeForm.amount = ''
    this.removeForm.amountProportion = 0
    this.lpApy = new BigNumber(0)
  }

  copyToClipboard(v: string) {
    copyToClipboard(v)
  }

  async onApproveEvent() {
    try {
      await this.callChainFunc(async () => {
        await this.approve()
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
      throw e
    }
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

  async onClaimEvent() {
    try {
      await this.callChainFunc(async () => {
        await this.claimReward()
        await this.updateMiningInfo()
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
}
</script>

<style lang="scss" scoped>
@import "~@mcdex/style/common/fantasy-var";

.pool-liquidity-dialog {
  ::v-deep &.is-large {
    min-height: 454px;
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

    .left-container {
      width: 368px;

      .info-panel {
        padding: 16px;
        width: 368px;
        border: 1px solid var(--mc-border-color);
        border-radius: var(--mc-border-radius-l);
        margin-bottom: 16px;

        &:last-child {
          margin-bottom: 0;
        }

        .panel-title {
          font-size: 16px;
          color: var(--mc-text-color-white);
          margin-bottom: 16px;
        }

        .panel-context {

          .info-item {
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

            .claim-value {
              display: flex;
              align-items: center;
              justify-content: flex-end;
              margin-bottom: 9px;

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
      width: 368px;

      .tabs-container {
        margin-bottom: 24px;

        .mc-radio-tabs.add ::v-deep .active {
          color: var(--mc-color-blue);
        }

        .mc-radio-tabs.remove ::v-deep .active {
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
        padding: 2px;

        .el-button {
          width: 100%;
          height: 56px;
          border-radius: var(--mc-border-radius-l);
        }
      }
    }
  }

  .address-text {
    color: var(--mc-color-primary) !important;
  }

  .icon-item {
    font-size: 14px;
    color: var(--mc-text-color);
    cursor: pointer;
    margin-left: 4px;

    &:hover {
      color: var(--mc-text-color-white);
    }

    &:active {
      color: var(--mc-color-primary);
    }
  }
}

.tooltip-box {
  border-bottom: 1px dashed var(--mc-text-color);
}
</style>

<style lang="scss">
.apy-popover {
  .apy-box {
    font-size: 14px;
    border-radius: 12px;
    padding: 16px;
    word-break: keep-all;

    .apy-item {
      line-height: 20px;
      margin-bottom: 12px;
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
}
</style>
