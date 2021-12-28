<template>
  <div class="trading-mining-stake-popup">
    <van-popup
      v-model="showPopup"
      closeable
      position="bottom"
      round
      safe-area-inset-bottom
      ref="fixedDom">
      <div class="popup-header">
        <img :src="currentChainConfig.icon" alt="">
        {{ $t('tradingMining.stakeDialog.title') }}
      </div>
      <McMRadioGroupTabs v-model="activatedTab" :options="radioOptions"/>
      <div class="popup-container">
        <div class="operating-panel">
          <van-skeleton :row="9" :loading="loadingData" class="operating-panel-skeleton">
            <template v-if="activatedTab === 'stake'">
              <div class="input-container">
                <div class="label-line">
                  <div>{{ $t('base.amount') }}</div>
                  <div class="label-item">
                    {{ $t('base.balance') }}: {{ walletBalance | bigNumberFormatter(2) }}
                  </div>
                </div>
                <div class="form-box">
                  <van-form validate-first ref="stakeFormRef">
                    <McMNumberField v-model="stakeAmount" placeholder="0.0" :rules="stakeFormRule.amount" :fixed-dom="fixedDom">
                      <span slot="right-icon">
                        <McMTokenImageView :size="24" :token="SATORI_ADDRESS" />
                        <span>SATORI</span>
                      </span>
                    </McMNumberField>
                  </van-form>
                </div>
                <div class="proportion-box">
                  <McMButtonRadioGroup
                    v-model="stakeAmountProportion"
                    :values="[25, 50, 75, 100]"
                    suffix="%"
                  />
                </div>
              </div>
              <div class="input-container-sub-info">
                <div class="label-line line-item">
                  <span>{{ $t('tradingMining.stakeDialog.newScore') }}</span>
                  <span class="value">
                  <template v-if="!invalidStakeAmount">
                    {{ deltaNewStakingScore | bigNumberFormatter(0) }}
                    <span :class="{'blue-color': deltaNewStakingScoreRate.gt(0), 'orange-color': deltaNewStakingScoreRate.lt(0)}">(<template
                      v-if="deltaNewStakingScoreRate.gt(0)">+</template>{{ deltaNewStakingScoreRate | bigNumberFormatter(2)
                      }}%)</span>
                  </template>
                  <template v-else>--</template>
                </span>
                </div>
                <div class="label-line line-item">
                  <span>
                      {{ $t('tradingMining.stakeDialog.newUnlockTime', { name: currentChainConfig.chainName }).toString() }}
                  </span>
                  <span class="value">
                  <template v-if="deltaUnlockTime">
                    <span v-if="deltaUnlockTimeInfo.day">{{ deltaUnlockTimeInfo.day }} {{ $t('base.day') }}</span>
                    <span v-else>{{ deltaUnlockTimeInfo.hour }} {{ $t('base.hour') }}</span>
                  </template>
                  <template v-else>--</template>
                </span>
                </div>
                <div class="label-line line-item">
                  <span>{{ $t('tradingMining.stakeDialog.newEstimatedRewards') }}</span>
                  <span class="value">
                     <template v-if="!invalidStakeAmount">
                        {{ deltaNewEstimatedRewards | bigNumberFormatter(0) }}
                        <img :src="require('@/assets/img/tokens/SATORI.svg')" alt="">
                        <span v-if="!deltaNewEstimatedRewardsRate.isZero()"
                              :class="{'blue-color': deltaNewEstimatedRewardsRate.gt(0), 'orange-color': deltaNewEstimatedRewardsRate.lt(0)}"
                        >(<template v-if="deltaNewEstimatedRewardsRate.gt(0)">+</template>{{
                            deltaNewEstimatedRewardsRate | bigNumberFormatter(2) }}%)</span>
                      </template>
                      <template v-else>--</template>
                  </span>
                </div>
              </div>
              <div class="button-box">
                <McMSteps :start-label="$t('base.stake')" @error="stateButtonState = 'fail'"
                          @success="stateButtonState = 'success'" @start="stateButtonState = 'loading'">
                  <template #start="prop">
                    <McMStateButton
                      :button-class="['blue', 'round', 'large']"
                      :state="stateButtonState"
                      :disabled="stakeButtonDisabled"
                      @click="onStakeEventStart(prop)"
                    >
                      {{ prop.start.label }}
                    </McMStateButton>
                  </template>
                  <McMStepItem v-for="(step, index) in steps" :action="step.action" :label="step.label"
                               :key="index"></McMStepItem>
                </McMSteps>
              </div>
            </template>
            <template v-if="activatedTab === 'unstake'">
              <div class="input-container">
                <div class="label-line">
                  <span>{{ $t('base.amount') }}</span>
                </div>
                <div class="form-box">
                  <van-form validate-first ref="unstakeFormRef">
                    <van-field :value="currentChainStakedBalance | bigNumberFormatter(2)" type="number" readonly clickable :disabled="true"
                               autocomplete="off" :unselectable="true">
                      <span slot="right-icon">SATORI</span>
                    </van-field>
                  </van-form>
                </div>
              </div>
              <div class="button-box">
                <div class="single-button">
                  <McMStateButton
                    :button-class="['orange', 'round', 'large']"
                    :state.sync="unstakeButtonState"
                    :disabled="unStaleButtonDisabled"
                    @click="onUnStakeEventStart"
                  >
                    <i class="iconfont icon-plain-lock" v-if="unStaleButtonDisabled && currentChainStakedBalance.gt(0)"></i>
                    {{ $t('tradingMining.stakeDialog.unstakeSATORI') }}
                  </McMStateButton>
                </div>
                <div v-if="currentChainUnlockTimestamp === 0"></div>
                <div class="promp1" v-else-if="unStaleButtonDisabled">{{ unstakeToolTip }}</div>
                <div class="promp2" v-else>{{ $t('tradingMining.stakeDialog.unstakePromp2') }}</div>
              </div>
            </template>
          </van-skeleton>
        </div>
        <div class="info-panel">
          <div class="info-box2">
            <div class="top-box">
              <div class="box-title">
                <div class="left">{{ $t('tradingMining.stakeDialog.yourStakedSATORI') }}</div>
                <div class="right">
                  <span class="link-text" @click="showGetMcbPopup=true">{{ $t('tradingMining.stakeDialog.getMcb') }}</span>
                </div>
              </div>
              <div class="tabs-box">
                <McMTabs v-model="selectedViewChain" :tabs="viewChainOptions"
                        :equal-width="true" :margin="16"/>
              </div>
              <div class="value-line">
                <div class="value-item">
                  <div class="value">
                    <span>
                      {{ selectedChainStakedBalance | bigNumberFormatterTruncateByPrecision(6, 1, 2) }}
                      <img :src="require('@/assets/img/tokens/SATORI.svg')" alt="">
                    </span>
                    <span>
                      <van-button class="round blue restake-button" size="small" :disabled="restakeIsDisabled"
                                 @click="onReStakeEvent">
                        {{ $t('tradingMining.stakeDialog.restake') }}
                        <i v-if="reStaking" class="el-icon-loading"></i>
                      </van-button>
                    </span>
                  </div>
                  <div class="label">
                    <div>{{ $t('tradingMining.stakeDialog.stakedSATORI') }}</div>
                  </div>
                </div>
                <div class="value-item unlock-time">
                  <div class="value">
                    <template v-if="selectedChainUnlockTimestamp && selectedChainStakedBalance.gt(0)">
                      <span v-if="selectedChainUnlockTimeInfo.day">{{ selectedChainUnlockTimeInfo.day }} {{ $t('base.day') }}</span>
                      <span v-else>{{ selectedChainUnlockTimeInfo.hour }} {{ $t('base.hour') }}</span>
                    </template>
                    <template v-else>--</template>
                  </div>
                  <div class="label">
                    <McMTooltip>
                      <template slot="content"><span v-html="unlockTimeToolTip"></span></template>
                      {{ $t('tradingMining.stakeDialog.unlockTime') }}
                    </McMTooltip>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="info-box1">
            <div class="top-box">
              <div class="box-title">
                <div class="left">{{ $t('tradingMining.stakeDialog.youStakingScore') }}</div>
              </div>
              <div class="value-line">
                <div class="value-item">
                  <div class="value">{{ currentStakedScore | bigNumberFormatterTruncateByPrecision(6, 1, 0) }}</div>
                  <div class="label">
                    <McMTooltip>
                      <div slot="content" class="tooltip-content">
                        <div class="line-item">
                          <div class="multi-chain-value">
                            <span class="multi-chain-value-item">
                              {{ $t('base.total') }}:
                              <span class="blue-text">
                                ${{ currentStakedScore | bigNumberFormatterTruncateByPrecision(4, 1, 0)
                                }}</span><span class="split-icon">,</span>
                            </span>
                            <span class="multi-chain-value-item" v-if="multiChainStakedScore[SUPPORTED_NETWORK_ID.BSC]">
                              BSC:
                              <span class="blue-text">
                                ${{ multiChainStakedScore[SUPPORTED_NETWORK_ID.BSC] | bigNumberFormatterTruncateByPrecision(4, 1, 0)
                                }}</span><span class="split-icon">,</span>
                            </span>
                            <span class="multi-chain-value-item" v-if="multiChainStakedScore[SUPPORTED_NETWORK_ID.ARB]">
                              Arbitrum:
                              <span class="blue-text">
                                ${{ multiChainStakedScore[SUPPORTED_NETWORK_ID.ARB] | bigNumberFormatterTruncateByPrecision(4, 1, 0)
                                }}</span><span class="split-icon">,</span>
                            </span>
                            <span class="multi-chain-value-item" v-if="multiChainStakedScore[SUPPORTED_NETWORK_ID.ARB_TESTNET]">
                              Arbitrum Testnet:
                              <span class="blue-text">
                                ${{ multiChainStakedScore[SUPPORTED_NETWORK_ID.ARB_TESTNET] | bigNumberFormatterTruncateByPrecision(4, 1, 0)
                                }}</span><span class="split-icon">,</span>
                            </span>
                          </div>
                        </div>
                        <div class="line-item">
                          <span v-html="$t('tradingMining.stakeDialog.currentPromp')"></span>
                        </div>
                      </div>
                      {{ $t('tradingMining.stakeDialog.current') }}
                    </McMTooltip>
                  </div>
                </div>

                <div class="value-item">
                  <div class="value">{{ currentEpochAvgScore | bigNumberFormatterTruncateByPrecision(6, 1, 0) }}</div>
                  <div class="label">
                    <McMTooltip :content="$t('tradingMining.stakeDialog.currentPromp')">
                      <template slot="content"><span v-html="$t('tradingMining.stakeDialog.averageInEpochPromp')"></span></template>
                      {{ $t('tradingMining.stakeDialog.averageInEpoch', {id: currentEpoch}).toString() }}
                    </McMTooltip>
                  </div>
                </div>
              </div>
            </div>
            <div class="bottom-box">
              <div class="line1">{{ $t('tradingMining.stakeDialog.promp1') }}</div>
              <div class="line2">
                {{ $t('tradingMining.stakeDialog.promp2') }}
                <a class="link-text" target="_blank"
                   href="https://mcdex.medium.com/announcing-trading-mining-v2-on-bsc-46e9610d7bad">{{ $t('base.learnMore') }}</a>
              </div>
            </div>
          </div>
          <div class="info-box3" v-if="activatedTab === 'stake'">
            <div class="box-title">
              {{ $t('tradingMining.stakeDialog.desc.title') }}
            </div>
            <div class="box-container">
              <div class="desc">
                {{ $t('tradingMining.stakeDialog.desc.msg') }}
                <a class="link-text" target="_blank"
                   href="https://mcdex.medium.com/announcing-trading-mining-v2-on-bsc-46e9610d7bad">{{ $t('base.learnMore') }}</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </van-popup>
    <TradingMiningConfirmPopup :visible.sync="showConfirmPopup" @confirm="startStake"
                               :confirm-value="normalStakeAmount"
                               :total-value="normalStakeAmount.plus(currentChainStakedBalance)"
                               :locked-day="deltaUnlockTimeInfo.day" />
    <ReStakeRiskPopup ref="riskPopup" :staked-balance="currentChainStakedBalance"/>
    <GetMcbPopup  :visible.sync="showGetMcbPopup" />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Ref, Watch } from 'vue-property-decorator'
import {
  McMRadioGroupTabs,
  McMStateButton,
  McMButtonRadioGroup,
  McMNumberField,
  McMSteps,
  McMStepItem,
  McMTooltip,
  McMTabs, McMTokenImageView,
} from '@/mobile/components'
import TradingMiningStakeMixin from '@/template/components/Mining/tradingMiningStakeMixin'
import { ButtonState } from '@/type'
import { momentFormatter, toBigNumber } from '@/utils'
import BigNumber from 'bignumber.js'
import moment from 'moment'
import { _0 } from '@mcdex/mai3.js'
import ReStakeRiskPopup from './ReStakeRiskPopup.vue'
import TradingMiningConfirmPopup from './TradingMiningConfirmPopup.vue'
import GetMcbPopup from './GetMcbPopup.vue'
import { currentChainConfig } from '@/config/chain'
import { SATORI_ADDRESS } from '@/constants'

@Component({
  components: {
    McMRadioGroupTabs,
    McMStateButton,
    McMButtonRadioGroup,
    McMNumberField,
    McMSteps,
    McMStepItem,
    ReStakeRiskPopup,
    TradingMiningConfirmPopup,
    McMTooltip,
    GetMcbPopup,
    McMTabs,
    McMTokenImageView,
  }
})
export default class TradingMiningStakePopup extends Mixins(TradingMiningStakeMixin) {
  @Prop({ required: true }) visible !: boolean
  @Ref('riskPopup') riskPopup!: ReStakeRiskPopup
  @Prop({ default: new BigNumber(0) }) defaultStakeAmount !: BigNumber

  private fixedDom: any = null
  private SATORI_ADDRESS: string = SATORI_ADDRESS

  get showPopup(): boolean {
    return this.visible
  }

  set showPopup(val: boolean) {
    this.$emit('update:visible', val)
  }

  private timer: number = 0

  private showGetMcbPopup: boolean = false
  private showConfirmPopup: boolean = false
  private stateButtonState: ButtonState = ''
  private unstakeButtonState: ButtonState = ''
  private stakeStartFunc: Function | null = null

  stakeFormRule = {
    amount: [
      {
        validator: (val: string, rule: any) => {
          const errorMsg = this.validatorStakeAmount(val)
          this.$mcmToastErrorMsg(errorMsg)
          return errorMsg === ''
        },
        message: '',
        trigger: 'onChange',
      },
    ],
  }

  mounted() {
    this.fixedDom = this.$refs.fixedDom
    this.initialUpdateAccountDebounce()
    this.updateBaseInfo()
    this.timer = window.setInterval(() => {
      this.updateAccountInfo()
      this.updateBaseInfo()
    }, 60000)
  }

  beforeDestroy() {
    window.clearInterval(this.timer)
  }

  get currentChainConfig() {
    return currentChainConfig
  }

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
      },
    ]
  }

  get steps() {
    const steps = [{ label: this.$t('tradingMining.stakeDialog.stakedSATORI'), action: this.onStakeEvent.bind(this) }]
    if (!this.isApproved) {
      steps.unshift({
        label: this.$t('base.approve').toString(),
        action: this.onApproveEvent.bind(this),
      })
    }
    return steps
  }

  get stakeButtonDisabled(): boolean {
    return this.invalidStakeAmount || this.normalStakeAmount.gt(this.walletBalance)
  }

  get unStaleButtonDisabled(): boolean {
    return this.currentChainUnlockTimestamp === 0 || this.currentChainUnlockTimestamp >= Date.now() / 1000
      || this.currentChainStakedBalance.lte(0)
  }

  get stakeAmount(): string {
    return this.stakeForm.amount
  }

  set stakeAmount(val: string) {
    this.stakeForm.amount = val
    const v = toBigNumber(val)
    if (!this.walletBalance || this.walletBalance.isZero() || v.isNaN() || v.isZero()) {
      this.stakeForm.amountProportion = 0
    } else {
      this.stakeForm.amountProportion = Number(v.div(this.walletBalance).times(100)
        .toFixed(0, BigNumber.ROUND_DOWN))
    }
  }

  get stakeAmountProportion(): number {
    return this.stakeForm.amountProportion
  }

  set stakeAmountProportion(val: number) {
    this.stakeForm.amountProportion = val
    if (!this.walletBalance || this.walletBalance.isZero()) {
      this.stakeForm.amount = '0'
    } else {
      this.stakeForm.amount = this.walletBalance.times(val).div(100).toFixed(2, BigNumber.ROUND_DOWN)
    }
  }

  get unlockTimeToolTip() {
    return this.$t('tradingMining.stakeDialog.unlockTimePromp',
      {
        time: this.selectedChainUnlockTimestamp === 0 || this.selectedChainStakedBalance.lte(0) ? '--'
          : momentFormatter(moment.unix(this.selectedChainUnlockTimestamp).local(), this.timeFormatter)
      }
    ).toString()
  }

  onStakeEventStart(prop: any) {
    this.showConfirmPopup = true
    this.stakeStartFunc = prop.start.start
  }

  startStake() {
    if (this.stakeStartFunc) {
      this.stakeStartFunc()
    }
  }

  async onUnStakeEventStart() {
    this.unstakeButtonState = 'loading'
    try {
      await this.onUnstakeEvent()
      this.unstakeButtonState = 'success'
    } catch (e) {
      this.unstakeButtonState = 'fail'
    }
  }

  validatorStakeAmount(val: string): string {
    if (val === '' || !this.walletBalance || !this.isConnectedWallet) {
      return ''
    }
    const amount = Number(val)
    if (amount <= 0 || isNaN(amount)) {
      return this.$t('commonErrors.inputError').toString()
    }
    if (this.walletBalance.lt(_0)) {
      return this.$t('commonErrors.InsufficientWallet').toString()
    }
    if (this.normalStakeAmount.gt(this.walletBalance) || this.normalStakeAmount.lt(_0)) {
      return this.$t('commonErrors.exceedMaxAmountError', {
        max: this.walletBalance.toFormat(2),
      }).toString()
    }
    return ''
  }

  async onReStakeEvent() {
    await new Promise((resolve, reject) => {
      this.riskPopup.show(confirmed => {
        if (confirmed) {
          resolve()
        } else {
          reject()
        }
      })
    })
    await this.onReStakeTokenEvent()
  }


  @Watch('showPopup', { immediate: true })
  async onShowPopupChanged() {
    if (this.showPopup) {
      if (this.defaultStakeAmount.isZero()) {
        this.stakeAmount = ''
      } else {
        if (this.defaultStakeAmount.gt(10**-2)) {
          this.stakeAmount = this.defaultStakeAmount.toFixed(2, BigNumber.ROUND_UP)
        } else {
          this.stakeAmount = this.defaultStakeAmount.toFixed(6, BigNumber.ROUND_UP)
        }
      }
      await this.initialAccountInfo()
      this.updateBaseInfo()
      this.timer = window.setInterval(() => {
        this.updateAccountInfo()
        this.updateBaseInfo()
      }, 60000)
      const stakeForm = this.$refs.stakeFormRef as any
      if (stakeForm) {
        stakeForm.validate()
      }
    } else {
      window.clearInterval(this.timer)
    }
  }
}
</script>

<style lang="scss">

</style>

<style scoped lang="scss">
.trading-mining-stake-popup {
  ::v-deep {
    .van-popup {
      padding: 16px;
      background-color: var(--mc-background-color-dark);
    }
  }

  .popup-header {
    display: flex;

    img {
      width: 23.5px;
      height: 23.5px;
      margin-right: 8px;
    }
  }

  .radio-group-tabs {
    margin-top: 28px;
    margin-bottom: 24px;

    ::v-deep {
      .blue-radio {
        color: var(--mc-color-blue);
        background: var(--mc-background-color);
      }

      .orange-radio {
        color: var(--mc-color-orange);
        background: var(--mc-background-color);
      }
    }
  }

  .popup-container {
    max-height: calc(100vh - 260px);

    .operating-panel {
      width: 100%;
      border-radius: 24px;

      .operating-panel-skeleton {
        margin-top: 24px;
      }

      .input-container {
        width: 100%;
        border-radius: 12px;
        padding: 16px;
        background: var(--mc-background-color-darkest);
      }

      .input-container-sub-info {
        margin-top: 16px;
        padding: 0 4px;

        .line-item {
          font-size: 16px;
          line-height: 24px;
          margin-top: 12px;

          &:first-child {
            margin-top: 0;
          }
        }
      }

      .form-box {
        margin-top: 12px;

        ::v-deep {
          .van-form {
            .van-cell {
              height: 30px;
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
              font-weight: 700;
              color: var(--mc-text-color-dark);
            }

            .van-field__right-icon {
              color: var(--mc-text-color-white);
              font-size: 18px;
              font-weight: 400;

              span {
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

      .proportion-box {
        margin-top: 12px;
      }

      .button-box {
        margin-top: 24px;
      }

      .label-line {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;
        line-height: 20px;
        color: var(--mc-text-color);

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
        display: inline-flex;
        align-items: center;

        img {
          height: 22px;
          width: 22px;
          margin: 0 4px;
        }
      }
    }

    .steps {
      margin-top: 8px;
      text-align: center;
    }

    ::v-deep .van-field--disabled {
      background-color: transparent !important;
    }

    .link-text {
      color: var(--mc-color-primary);
    }

    .blue-color {
      color: var(--mc-color-blue);
    }

    .orange-color {
      color: var(--mc-color-orange);
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

      .promp1, .promp2 {
        margin-top: 8px;
        font-size: 14px;
        color: var(--mc-text-color-white);
        line-height: 20px;
      }
    }

    .info-panel {
      margin-top: 32px;

      .split-line {
        width: 1px;
        background: var(--mc-border-color);
        height: 48px;
      }

      .value-line {
        margin-top: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;

        .value-item {
          .value {
            font-size: 20px;
            color: var(--mc-text-color-white);
            line-height: 24px;
            display: flex;
            align-items: center;

            img {
              width: 22px;
              height: 22px;
            }
          }

          .label {
            font-size: 14px;
            color: var(--mc-text-color);
            line-height: 20px;
          }
        }

        .unlock-time {
          width: auto!important;
          border-left: 1px solid var(--mc-border-color);
          padding-left: 16px;

          .value {
            line-height: 32px;
          }
        }
      }
    }

    .info-box1 {
      margin-top: 16px;
      position: relative;

      .value-line {

        .split-line {
          margin: 0 16px;
        }

        .value-item:nth-of-type(1) {
          width: 50%;
        }

        .value-item:nth-of-type(2) {
          border-left: 1px solid var(--mc-border-color);
          padding-left: 16px;
          width: 50%;
        }
      }

      .top-box {
        position: relative;
        z-index: 2;
        padding: 16px;
        border: 1px solid var(--mc-border-color);
        border-radius: var(--mc-border-radius-l);
        background: var(--mc-background-color-dark);
        height: 120px;

        .box-title {
          display: flex;
          align-items: center;
          justify-content: space-between;

          .left {
            line-height: 24px;
            font-size: 16px;
            color: var(--mc-text-color-white);
          }
        }
      }

      .bottom-box {
        position: absolute;
        z-index: 1;
        width: 100%;
        margin-top: -24px;
        border: 1px solid var(--mc-border-color);
        border-radius: var(--mc-border-radius-l);
        background: var(--mc-background-color-darkest);
        padding: 38px 16px 16px 16px;

        .link-text {
          color: var(--mc-color-primary);
        }

        .line1, .line2 {
          color: var(--mc-text-color);
          font-size: 14px;
          line-height: 20px;
        }

        .line2 {
          margin-top: 8px;
        }
      }
    }

    .info-box2 {
      position: relative;

      .split-line {
        margin: 0 16px;
      }

      .value-item:nth-of-type(1) {
        width: 53%;
      }

      .value-item:nth-of-type(2) {
        width: 42%;
      }

      .value-item {
        span {
          display: inline-flex;
          align-items: center;
        }

        img {
          margin-left: 4px;
        }
      }

      .tabs-box {
        display: flex;

        .mc-m-tabs {
          height: 48px;
          line-height: 48px;
          border-bottom: 1px solid var(--mc-border-color);
        }

        ::v-deep .tab-item {
          margin-left: 16px;

          &:first-child {
            margin-left: 0;
          }
        }
      }

      .value-line {
        display: flex;
        align-items: flex-end;

        .split-line {
          margin: 0 16px;
        }

        .value-item:nth-of-type(1) {
          width: 53%;
        }

        .value-item:nth-of-type(2) {
          width: 48%;
        }
      }

      .top-box {
        position: relative;
        z-index: 2;
        padding: 16px;
        border: 1px solid var(--mc-border-color);
        border-radius: var(--mc-border-radius-l);
        background: var(--mc-background-color-dark);
        height: 176px;

        .box-title {
          line-height: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;

          .left {
            font-size: 16px;
            color: var(--mc-text-color-white);
          }

          .right {
            .link-text {
              font-size: 14px;
            }

            a {
              color: var(--mc-color-primary);
            }
          }
        }
      }

      .bottom-box {
        position: absolute;
        z-index: 1;
        height: 96px;
        width: 100%;
        margin-top: -24px;
        border: 1px solid var(--mc-border-color);
        border-radius: var(--mc-border-radius-l);
        background: var(--mc-background-color-darkest);
        padding: 38px 16px 16px 16px;

        .link-text {
          color: var(--mc-color-primary);
        }

        .line {
          color: var(--mc-text-color);
          font-size: 14px;
          line-height: 20px;

          ::v-deep .link-text {
            color: var(--mc-color-primary);
          }
        }
      }

      .restake-button {
        border-radius: 8px;
        margin-left: 12px;
        width: 76px;
        height: 32px;
        font-size: 14px;
      }
    }

    .info-box3 {
      margin-top: 132px;
      border: 1px solid var(--mc-border-color);
      background: var(--mc-background-color-darkest);
      border-radius: var(--mc-border-radius-l);
      padding: 16px;

      .box-title {
        line-height: 24px;
        color: var(--mc-text-color-white);
        font-size: 16px;
      }

      .box-container {
        margin-top: 16px;

        .desc {
          font-size: 14px;
          color: var(--mc-text-color);
          line-height: 20px;

          .line-text {
            color: var(--mc-color-primary);
          }
        }
      }
    }
  }
}
</style>
