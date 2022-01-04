<template>
  <div class="liquidity scroll-container">
    <BackNavBar :title="title"></BackNavBar>
    <div class="liquidity-container page-container">
      <div>
        <McMIconHeader
          :image1="poolCollateralAddress | tokenIconUrlFormatter"
          :title="collateralSymbol"
        >
          <template slot="subTitle">
            {{ $t('base.poolAddress') }}
            <span>{{ poolAddress | ellipsisMiddle(6,4) }}
            <i class="iconfont icon-copy-bold" @click="copyAddress(poolAddress)"></i></span>
          </template>
        </McMIconHeader>
      </div>
      <div class="operating-panel">
        <McMRadioGroupTabs v-model="selectedRadio" :options="radioOptions"/>
        <van-skeleton :row="9" :loading="loadingData" class="operating-panel-skeleton">
          <template v-if="selectedRadio === 'add'">
            <div class="input-container">
              <div class="label-line">
                <div>{{ $t('base.amount') }}</div>
                <div v-if="isConnectedWallet" class="label-item">
                  {{ $t('base.balance') }}
                  <template>
                    <span v-if='!isNativeToken'>
                      {{ walletCollateralBalance | bigNumberFormatter(collateralDecimals) }} {{ collateralSymbol }}
                    </span>
                    <div v-else class='balance-item'>
                      <div>
                        {{ nativeTokenBalance | bigNumberFormatter(collateralDecimals) }} {{ collateralSymbol }}
                      </div>
                      <div class='second-line'>
                        {{ walletCollateralBalance | bigNumberFormatter(collateralDecimals) }} WETH
                      </div>
                    </div>
                    <div class='icon-item' v-if='isNativeToken'>
                      <a @click="showWrapPop"> <i class="iconfont icon-transfericon"></i></a>
                    </div>
                  </template>
                </div>
              </div>
              <div class="form-box">
                <van-form validate-first ref="addForm">
                  <McMNumberField v-model="addForm.amount" placeholder="0.0" :rules="addRules.amount">
                    <span slot="right-icon">{{ inputCollateralSymbol }}</span>
                  </McMNumberField>
                </van-form>
              </div>
              <div class="proportion-box">
                <McMButtonRadioGroup
                  v-model="addAmountProportion"
                  :values="[25, 50, 75, 100]"
                  suffix="%"
                  :class="[radioGroupSelectedClass]"
                />
              </div>
            </div>
            <div class="input-container-sub-info">
              <div class="label-line line-item">
                <span>{{ $t('pool.liquidityPage.lpToken') }}</span>
                <span class="value">{{ deltaAddShareToken | bigNumberFormatterByPrecision }}</span>
              </div>
              <div class="label-line line-item">
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
            <div class="button-box" v-if="isConnectedWallet">
              <McMSteps :start-label="$t('base.add')" @error="addLiquidityState = 'fail'"
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
            <div class="button-box" v-if="!isConnectedWallet">
              <div class="single-button">
                <van-button class="round" size="large" @click="onConnectWallet">
                  <i class="iconfont icon-wallet-bold"></i>
                  {{ $t('connectWalletButton.connectWallet') }}
                </van-button>
              </div>
            </div>
          </template>
          <template v-if="selectedRadio === 'remove'">
            <div class="input-container">
              <div class="label-line">
                <span>{{ $t('base.amount') }}</span>
                <span v-if="isConnectedWallet">
                  {{ $t('base.balance') }}
                  <template>
                    {{ shareTokenBalance | bigNumberFormatterByPrecision }}
                  </template>
                </span>
              </div>
              <div class="form-box">
                <van-form validate-first ref="removeForm">
                  <McMNumberField v-model="removeForm.amount" placeholder="0.0" :rules="removeRules.amount">
                    <span slot="right-icon">{{ $t('pool.liquidityPage.lpToken') }}</span>
                  </McMNumberField>
                </van-form>
              </div>
              <div class="proportion-box">
                <McMButtonRadioGroup
                  v-model="removeAmountProportion"
                  :values="[25, 50, 75, 100]"
                  suffix="%"
                  :class="[radioGroupSelectedClass]"
                />
              </div>
            </div>
            <div class="input-container-sub-info">
              <div class="label-line">
                <McMTooltip :content="$t('pool.liquidityPage.removePenaltyPrompt')">
                  <span>{{ $t('pool.liquidityPage.removePenalty') }}</span>
                </McMTooltip>
                <span class="value">{{
                    penaltyAfterRemove | bigNumberFormatter(collateralDecimals)
                  }} {{ collateralSymbol }}</span>
              </div>
              <div class="label-line">
                <span>{{ $t('pool.liquidityPage.receive') }}</span>
                <span class="value">{{
                    receivedAfterRemove | bigNumberFormatter(collateralDecimals)
                  }} {{ collateralSymbol }}</span>
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
              <span class="click-value" @click="setMaxRemoveShare">
                {{ maxRemoveShare | bigNumberFormatter() }} {{ $t('pool.liquidityPage.lpToken') }}
              </span>
            </div>
            <div class="button-box" v-if="isConnectedWallet">
              <div class="single-button">
                <McMStateButton
                  :button-class="['orange', 'round', 'large']"
                  :state.sync="removeLiquidityState"
                  :disabled="invalidRemoveAmount || invalidAccountRemoveAmount"
                  @click="onRemoveLiquidityEvent"
                >
                  {{ $t('base.remove') }}
                  <McMTooltip>
                    <span slot="content">
                      <i18n path="pool.liquidityPage.removeLiquidityLockPrompt" tag="span">
                        <template slot="time">
                          {{ liquidityLockComputed.unlockTime | timestampFormatter('YYYY.MM.DD hh:mm') }}
                        </template>
                      </i18n>
                    </span>
                    <i v-if="liquidityLockComputed.isLocked" class="iconfont icon-lock"></i>
                  </McMTooltip>
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
          <div class="title">
            <span v-if="isMiningPool">{{ $t('pool.liquidityPage.myShareReward') }}</span>
            <span v-else>{{ $t('pool.liquidityPage.myShare') }}</span>
          </div>
          <div class="content">
            <div class="label-line line-item">
              <span>{{ $t('pool.liquidityPage.myShare') }}</span>
              <span class="value">{{ shareTokenPercentage | bigNumberFormatterByPrecision(2) }}%</span>
            </div>
            <div class="label-line line-item">
              <span>{{ $t('pool.liquidityPage.pooled') }}</span>
              <span class="value"
              >{{ pooledCollateral | bigNumberFormatter(collateralDecimals) }} {{ collateralSymbol }}</span
              >
            </div>
            <div class="label-line line-item" v-if="liquidityLockComputed.isLocked">
              <span>{{ $t('pool.liquidityPage.liquidityLpLocked') }}</span>
              <span class="value">{{ shareTokenBalance | bigNumberFormatterByPrecision }} LP Token</span>
            </div>
            <div class="label-line line-item multiple-line" v-if="liquidityLockComputed.isLocked">
              <span>{{ $t('pool.liquidityPage.liquidityUnlockTime') }}</span>
              <span class="value">
                <span>{{ liquidityLockComputed.remainingBlocks }} blocks</span><br/>
                ( ≈ {{ liquidityLockComputed.unlockTime | timestampFormatter('YYYY.MM.DD hh:mm') }})
              </span>
            </div>
            <div class="label-line line-item" v-if="isMiningPool || !claimableReward.isZero()">
              <span>{{ $t('pool.liquidityPage.claimable') }}</span>
              <span class="value">{{ claimableReward | bigNumberFormatterTruncateByPrecision(8, 1, 2) }} {{ miningTokenSymbol }}</span>
            </div>
          </div>
          <div class="button-box" v-if="isMiningPool || !claimableReward.isZero()">
            <div class="single-button">
              <McMStateButton
                :button-class="['orange', 'round', 'large']"
                :state.sync="claimState"
                :disabled="invalidClaimReward"
                @click="onClaimEvent"
              >
                {{ $t('base.claim') }}
              </McMStateButton>
            </div>
          </div>
        </van-skeleton>
      </div>

      <div class="lock-time-box"
           v-if="selectedRadio === 'add' && liquidityPoolStorage && liquidityPoolStorage.shareTransferDelay">
        <div class="title">{{ $t('pool.liquidityPage.liquidityLockTime') }}</div>
        <div class="lock-time-prompt">
          <i18n path="pool.liquidityPage.lockTimeDetail" tag="span">
            <template slot="lockTime">
              <McMTooltip>
                <span slot="content"
                      v-html="$t('pool.liquidityPage.lockTimePrompt', {number: liquidityPoolStorage.shareTransferDelay, time: l1BlockInterval + 's'})"></span>
                <span>{{ $t('pool.liquidityPage.lockTime') }}</span>
              </McMTooltip>
            </template>
          </i18n>
        </div>
      </div>

    </div>

    <AddLiquidityRiskPopup ref="riskPopup"/>
  </div>
</template>
<script lang="ts">
import { Component, Mixins, Watch, Prop, Ref } from 'vue-property-decorator'
import { PoolLiquidityMixin } from '@/template/components/Pool/poolLiquidityMixin'
import BigNumber from 'bignumber.js'
import { _0, computeAMMShareToMint } from '@mcdex/mai3.js'
import {
  McMIconHeader,
  McMRadioGroupTabs,
  McMButtonRadioGroup,
  McMStateButton,
  McMNumberField,
  McMStepItem,
  McMSteps,
  McMTooltip,
} from '@/mobile/components'
import { copyToClipboard } from '@/utils'
import { SATORI_ADDRESS_CONFIG, MiningTokenSymbol, SUPPORTED_NETWORK_ID } from '@/const'
import BackNavBar from '@/mobile/template/Header/BackNavBar.vue'
import { ACCOUNT_EVENT, VUE_EVENT_BUS } from '@/event'
import { COMMON_EVENT } from '@/mobile/event'
import { AccountWithSelectedPerpetualMixin } from '@/mixins'
import { ButtonState } from '@/type'
import AddLiquidityRiskPopup from '@/mobile/business-components/AddLiquidityRiskPopup.vue'

@Component({
  components: {
    McMIconHeader,
    McMRadioGroupTabs,
    McMButtonRadioGroup,
    McMStateButton,
    McMNumberField,
    BackNavBar,
    McMSteps,
    McMStepItem,
    McMTooltip,
    AddLiquidityRiskPopup,
  },
})
export default class Liquidity extends Mixins(PoolLiquidityMixin, AccountWithSelectedPerpetualMixin) {
  @Prop({ required: true }) _poolAddress !: string

  @Ref('riskPopup') riskPopup!: AddLiquidityRiskPopup

  mounted() {
    this.updateData()
    this.updateTokenPrice({
      tokens: [SATORI_ADDRESS_CONFIG[SUPPORTED_NETWORK_ID.ARB]],
      networkId: SUPPORTED_NETWORK_ID.ARB,
    })
  }

  private miningTokenSymbol: string = MiningTokenSymbol
  private addLiquidityState: ButtonState = ''

  private addRules = {
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

  private removeRules = {
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

  private selectedRadio: 'add' | 'remove' = 'add'

  get radioOptions() {
    return [
      {
        label: this.$t('base.add').toString(),
        value: 'add',
        itemSelectedClass: 'blue-radio',
      },
      {
        label: this.$t('base.remove').toString(),
        value: 'remove',
        itemSelectedClass: 'orange-radio',
      },
    ]
  }

  get inputCollateralSymbol(): string {
    return this.isNativeToken ? 'WETH' : this.collateralSymbol
  }

  get loadingData() {
    if (!this.isConnectedWallet) {
      return false
    }
    return !this.poolAddress || !this.signer || !this.address || !this.liquidityPool
  }

  get addAmountProportion(): number {
    return this.addForm.amountProportion
  }

  set addAmountProportion(val: number) {
    if (!this.walletCollateralBalance || this.walletCollateralBalance.isZero()) {
      this.addForm.amount = '0'
    } else {
      this.addForm.amount = this.walletCollateralBalance
        .times(val)
        .div(100)
        .toFixed(this.collateralDecimals, BigNumber.ROUND_DOWN)
    }
    this.addForm.amountProportion = val
  }

  get removeAmountProportion(): number {
    return this.removeForm.amountProportion
  }

  set removeAmountProportion(val: number) {
    if (!this.shareTokenBalance || this.shareTokenBalance.isZero()) {
      this.removeForm.amount = '0'
    } else {
      this.removeForm.amount = this.shareTokenBalance
        .times(val)
        .div(100)
        .toFixed()
    }
    this.removeForm.amountProportion = val
  }

  get title() {
    if (this.isMiningPool) {
      return this.$t('dao.ammLiquidityMining').toString()
    }
    return this.$t('base.liquidity').toString()
  }

  get radioGroupSelectedClass() {
    if (this.selectedRadio === 'add') return 'blue-selected'
    if (this.selectedRadio === 'remove') return 'orange-selected'
    return ''
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
      return _0
    }
    return this.afterAddInfo.shareToMint
  }

  get deltaAddSharePercentage() {
    if (!this.afterAddInfo) {
      return new BigNumber(0)
    }
    return this.afterAddInfo.shareToMint.div(this.shareTotalSupply.plus(this.afterAddInfo.shareToMint)).times(100)
  }

  get deltaRemoveSharePercentage() {
    if (!this.afterRemoveInfo) {
      return new BigNumber(0)
    }
    return this.afterRemoveInfo.cashToReturn.div(this.shareTotalSupply).times(100)
  }

  get invalidClaimReward() {
    return !this.claimableReward.gt(0)
  }

  setMaxRemoveShare() {
    if (this.isLPTokenLocked) {
      this.removeForm.amount = '0'
      return
    }
    if (this.maxRemoveShare && this.shareTotalSupply) {
      this.removeForm.amount = this.maxRemoveShare.toFixed()
      this.removeForm.amountProportion = 0
    }
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

  showWrapPop() {
    VUE_EVENT_BUS.emit(ACCOUNT_EVENT.WRAP_ETH)
  }

  copyAddress(address: string) {
    if (!address) {
      return
    }
    copyToClipboard(address)
    this.$toast(this.$t('base.copySuccess').toString())
  }

  @Watch('normalizeAddAmount')
  onNormalizeAddAmountChanged() {
    if (this.normalizeAddAmount.isZero()) {
      this.addForm.amountProportion = 0
    }
  }

  @Watch('normalizeRemoveAmount')
  onNormalizeRemoveAmountChanged() {
    if (this.normalizeRemoveAmount.isZero()) {
      this.removeForm.amountProportion = 0
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

  onConnectWallet() {
    VUE_EVENT_BUS.emit(COMMON_EVENT.SHOW_SELECT_WALLET_POPUP)
  }

  reSetAddForm() {
    this.addForm.amount = ''
    this.addForm.amountProportion = 0
  }

  reSetRemoveForm() {
    this.removeForm.amount = ''
    this.removeForm.amountProportion = 0
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
      this.reSetAddForm()
      this.validateAddForm()
    }, undefined, true)
    this.getLiquidityUnlockTime()
  }

  async onRemoveLiquidityEvent() {
    if (this.poolOracleHasError) {
      return
    }
    await this.callChainFunc(async () => {
      await this.removeLiquidity(this.normalizeRemoveAmount)
      await this.updateData()
      this.reSetRemoveForm()
      this.validateRemoveForm()
    })
  }

  async onClaimEvent() {
    await this.callChainFunc(async () => {
      await this.claimReward()
      await this.updateMiningInfo()
    })
  }

  @Watch('_poolAddress', { immediate: true })
  _onPoolAddressChanged() {
    this.poolAddress = this._poolAddress
  }
}
</script>

<style lang="scss">

</style>

<style lang="scss" scoped>
@import '~@mcdex/style/common/var';

.liquidity {
  .liquidity-container {
    padding: 16px;

    .operating-panel {
      margin-top: 16px;
      padding: 16px;
      width: 100%;
      border-radius: 24px;
      background: var(--mc-background-color-dark);
      border: 1px solid var(--mc-border-color);

      .operating-panel-skeleton {
        margin-top: 12px;
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

      .input-container {
        margin-top: 12px;
        width: 100%;
        border: 1px solid var(--mc-border-color);
        border-radius: 12px;
        padding: 16px;
      }

      .input-container-sub-info {
        margin-top: 8px;
        padding: 0 4px;
      }

      .form-box {
        margin-top: 14px;

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

            input::-webkit-input-placeholder {
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
      background: var(--mc-background-color-dark);
      border: 1px solid var(--mc-border-color);
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
          line-height: 26px;
        }
      }

      .button-box {
        margin-top: 24px;
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
      color: var(--mc-text-color);
      line-height: 24px;

      .label-item {
        display: flex;
        align-items: center;

        .balance-item {
          margin-left: 8px;
          color: var(--mc-text-color-white);
          text-align: right;

          .second-line {
            margin-top: 2px;
          }
        }

        .icon-item {
          color: var(--mc-text-color-white);
          line-height: 34px;
          margin: 0 0 0 10px;
        }
      }
    }

    .value {
      color: var(--mc-text-color-white);
      text-align: right;
    }
  }

  .warning-tip-panel {
    margin-top: 10px;
    border-radius: 12px;
    background-color: rgba($--mc-color-warning, 0.1);
    padding: 10px;
    color: var(--mc-color-warning);
    font-size: 12.8px !important;
    line-height: 16px;
  }

  .warning-insufficient-liquidity {
    @extend .warning-tip-panel;
    font-size: 14px !important;
    line-height: 20px;

    .click-value {
      text-decoration: underline;
      cursor: pointer;
    }
  }

  .lock-time-box {
    margin-top: 16px;
    background: var(--mc-background-color-dark);
    border: 1px solid var(--mc-border-color);
    border-radius: 24px;
    padding: 16px;
    font-size: 14px;
    line-height: 20px;

    .title {
      font-size: 16px;
    }

    .lock-time-prompt {
      margin-top: 8px;
      color: var(--mc-text-color);
    }
  }

  .icon-lock {
    text-decoration: none;
  }
}
</style>
