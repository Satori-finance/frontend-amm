<template>
  <div>
    <van-popup
      class="safe-area-inset-bottom pool-liquidity-popup"
      position="bottom"
      round closeable
      safe-area-inset-bottom
      @closed="onCloseDialog"
      v-model="visible">
      <div class="title">{{ title }}</div>
      <McLoading
        :mask-color="'transparent'"
        :show-loading="loadingData"
        :min-show-time="500"
        :show-loading-text="false"
        :hide-content="loadingData"
      >
        <div class="popup-container">
          <div class="top-container">
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
                    <McMTokenImageView :token="collateralSymbol" :size="18"/>
                  </span>
              </div>
              <div class="info-item claim-line" v-if="isMiningPool || !claimableReward.eq(0)">
                <span class="label">{{ $t('pool.liquidityPage.claimableRewards') }}</span>
                <span>
                    <span class="claim-value">
                      {{ claimableReward | bigNumberFormatterTruncateByPrecision(8, 1, 2) }}
                      <McMTokenImageView :token="'SATORI'" :size="18"/>
                    </span>
                    <van-button class="claim-button" @click="onClaimEvent"
                                :disabled="invalidClaimReward || claimState==='loading'"
                                :loading="claimState==='loading'">
                      {{ $t('base.claim') }}
                    </van-button>
                  </span>
              </div>
            </div>
          </div>

          <div class="bottom-container">
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
                  <van-form validate-first ref="addForm">
                    <McMNumberField
                      v-model="addForm.amount"
                      placeholder="0.0"
                      :rules="addFormRule.amount"
                    >
                      <div slot="right-icon" class="right-icon">
                        <McMTokenImageView :size="24" :token="collateralSymbol" />
                        <div>{{ collateralSymbol }}</div>
                      </div>
                    </McMNumberField>
                  </van-form>
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
                  <span class="value">{{ deltaAddShareToken || 0 | bigNumberFormatterByPrecision }}</span>
                </div>
                <div class="text-line">
                  <span class="label">{{ $t('pool.shareOfPool') }}</span>
                  <span class="value">{{
                      deltaAddSharePercentage || 0 | bigNumberFormatterByPrecision(2)
                    }}%</span>
                </div>
              </div>
              <div class="button-container">
                <McMSteps :start-label="$t('pool.liquidityPage.addLiquidity')" @error="addLiquidityState = 'fail'"
                          @success="addLiquidityState = 'success'" @start="addLiquidityState = 'loading'">
                  <template #start="prop">
                    <McMStateButton
                      :button-class="['blue', 'round', 'large']"
                      :state="addLiquidityState"
                      :disabled="invalidAddAmount || invalidAccountAddAmount"
                      @click="prop.start.start"
                    >
                      {{ prop.start.label }}
                    </McMStateButton>
                  </template>
                  <McMStepItem v-for="(step, index) in steps" :action="step.action" :label="step.label"
                               :key="index"></McMStepItem>
                </McMSteps>
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
                  <van-form validate-first ref="removeForm">
                    <McMNumberField
                      v-model="removeForm.amount"
                      placeholder="0.0"
                      :rules="removeFormRule.amount"
                    >
                      <div slot="right-icon" class="right-icon">
                        <McMTokenImageView :size="24" token="LP Token" />
                        <div>LP Token</div>
                      </div>
                    </McMNumberField>
                  </van-form>
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
                    <McMTooltip>
                      {{ $t('pool.liquidityPage.removalSlippage') }}
                      <template slot="content">
                        <span v-html="$t('pool.liquidityPage.removalSlippagePrompt')"></span>
                      </template>
                    </McMTooltip>
                  </span>
                  <span class="value">
                    {{ penaltyAfterRemove || 0 | bigNumberFormatter(collateralDecimals) }}
                    {{ collateralSymbol }}</span>
                </div>
                <div class="text-line">
                  <span class="label">{{ $t('pool.liquidityPage.youWillReceive') }}</span>
                  <span class="value">
                    {{ receivedAfterRemove || 0 | bigNumberFormatter(collateralDecimals) }}
                    {{ collateralSymbol }}
                  </span>
                </div>
              </div>
              <div class="button-container">
                <McMStateButton
                  :button-class="['orange', 'round', 'large']"
                  :state.sync="removeLiquidityState"
                  :disabled="invalidRemoveAmount || invalidAccountRemoveAmount"
                  @click="onRemoveLiquidityEvent"
                >
                  {{ $t('base.remove') }}
                </McMStateButton>
              </div>
            </template>
          </div>

          <div class="pool-info-container">
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
                <span class="label">{{ $t('base.APY') }}</span>
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
        </div>
      </McLoading>
    </van-popup>
    <AddLiquidityRiskPopup ref="riskPopup"/>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Ref } from 'vue-property-decorator'
import {
  McLoading,
  McRadioTabs,
  McRadioGroup,
  PNNumber,
} from '@/components'
import { PoolLiquidityMixin } from '@/template/components/Pool/poolLiquidityMixin'
import { copyToClipboard, toBigNumber } from '@/utils'
import { VUE_EVENT_BUS } from '@/event'
import BigNumber from 'bignumber.js'
import { _0, computeAMMShareToMint } from '@mcdex/mai3.js'
import { SATORI_ADDRESS_CONFIG, SUPPORTED_NETWORK_ID } from '@/const'
import AddLiquidityRiskPopup from '@/mobile/business-components/AddLiquidityRiskPopup.vue'
import {
  McMNumberField,
  McMStateButton,
  McMStepItem,
  McMSteps,
  McMTokenImageView,
  McMTooltip,
} from '@/mobile/components'
import { ButtonState } from '@/type'
import { COMMON_EVENT } from '@/mobile/event'

@Component({
  components: {
    McLoading,
    McRadioTabs,
    McRadioGroup,
    McMTokenImageView,
    McMStepItem,
    McMSteps,
    PNNumber,
    AddLiquidityRiskPopup,
    McMNumberField,
    McMStateButton,
    McMTooltip,
  },
})
export default class PoolLiquidityPopup extends Mixins(PoolLiquidityMixin) {
  @Ref('riskPopup') riskPopup!: AddLiquidityRiskPopup

  private visible: boolean = false
  private activatedLiquidityTab: 'add' | 'remove' = 'add'
  private addLiquidityState: ButtonState = ''

  mounted() {
    VUE_EVENT_BUS.on(COMMON_EVENT.CHANGE_POOL_LIQUIDITY, this.showPopup)
  }

  destroyed() {
    VUE_EVENT_BUS.off(COMMON_EVENT.CHANGE_POOL_LIQUIDITY, this.showPopup)
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
      {
        validator: (val: string, rule: any) => {
          const errorMsg = this.validatorAddAmount(val)
          this.$mcmToastErrorMsg(errorMsg)
          return errorMsg === ''
        },
        message: '',
        trigger: 'onChange',
      },
    ],
  }
  private removeFormRule = {
    amount: [
      {
        validator: (val: string, rule: any) => {
          const errorMsg = this.validatorRemoveAmount(val)
          this.$mcmToastErrorMsg(errorMsg)
          return errorMsg === ''
        },
        message: '',
        trigger: 'onChange',
      },
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

  showPopup(poolAddress: string) {
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
    await this.callChainFunc(async () => {
      await this.approve()
    }, undefined, true)
  }

  async onAddLiquidityEvent() {
    if (this.poolOracleHasError) {
      return
    }
    await new Promise((resolve, reject) => {
      this.riskPopup.show(confirmed => {
        if (confirmed) {
          resolve()
        } else {
          reject()
        }
      })
    })
    await this.callChainFunc(async () => {
      await this.addLiquidity(this.normalizeAddAmount)
      await this.updateData()
    }, undefined, true)
    // refresh form validate
    await this.validateAddForm()
    this.addForm.amount = ''
    this.addForm.amountProportion = 0
  }

  async onRemoveLiquidityEvent() {
    if (this.poolOracleHasError) {
      return
    }
    await this.callChainFunc(async () => {
      await this.removeLiquidity(this.normalizeRemoveAmount)
      await this.updateData()
    }, undefined, true)
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

  validatorAddAmount(val: string): string {
    if (val === '' || !this.walletCollateralBalance || !this.isConnectedWallet) {
      return ''
    }
    const amount = Number(val)
    if (amount < 0 || isNaN(amount)) {
      return this.$t('commonErrors.inputError').toString()
    }
    if (this.walletCollateralBalance.lt(_0)) {
      return this.$t('commonErrors.InsufficientWallet').toString()
    }
    if (this.normalizeAddAmount.gt(this.walletCollateralBalance) || this.normalizeAddAmount.lt(_0)) {
      return this.$t('commonErrors.exceedMaxAmountError', {
        max: this.walletCollateralBalance.toFormat(this.collateralDecimals || 0),
      }).toString()
    }
    return ''
  }

  validatorRemoveAmount(val: string): string {
    if (val === '' || !this.isConnectedWallet) {
      return ''
    }
    const amount = Number(val)
    if (amount < 0 || isNaN(amount)) {
      return this.$t('commonErrors.inputError').toString()
    }
    if (this.normalizeRemoveAmount.gt(this.shareTokenBalance)) {
      return this.$t('commonErrors.insufficientShareAmount').toString()
    }
    if (this.maxRemoveShare && this.normalizeRemoveAmount.gt(this.maxRemoveShare)) {
      return this.$t('commonErrors.insufficientLiquidityError').toString()
    }
    if (this.normalizeRemoveAmount.gt(this.shareTokenBalance) || this.normalizeRemoveAmount.lt(_0)) {
      return this.$t('commonErrors.exceedMaxAmountError', {
        max: this.shareTokenBalance.toFormat(this.collateralDecimals || 0),
      }).toString()
    }
    return ''
  }

  validateAddForm() {
    const from = this.$refs.addForm as any
    from.validate()
  }

  validateRemoveForm() {
    const from = this.$refs.removeForm as any
    from.validate()
  }
}
</script>

<style lang="scss" scoped>
@import "~@mcdex/style/common/fantasy-var";

.pool-liquidity-popup {
  padding: 16px;

  .title {
    padding: 0;
  }

  .mc-loading {
    position: unset;
    height: calc(100vh - 160px);
    width: 100%;

    ::v-deep .mc-loading__mask {
      top: 54px;
    }
  }

  .popup-container {
    max-height: calc(100vh - 160px);
    overflow: scroll;

    .top-container, .pool-info-container {
      padding: 16px;
      width: 100%;
      border: 1px solid var(--mc-border-color);
      border-radius: var(--mc-border-radius-l);
      margin: 28px 0 32px;

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
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 14px;
          align-items: center;
          line-height: 20px;

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

          .claim-value {
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

    .bottom-container {
      width: 100%;

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

        .van-button {
          width: 100%;
          height: 56px;
          border-radius: var(--mc-border-radius-l);
        }

        ::v-deep .blue {
          border: 0;
        }
      }
    }

    .pool-info-container {
      margin-bottom: 16px !important;
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
