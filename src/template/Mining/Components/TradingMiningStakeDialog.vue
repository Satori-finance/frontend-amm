<template>
  <div>
    <el-dialog
      @close="onCloseDialog"
      custom-class="is-large is-round trading-mining-stake-dialog"
      append-to-body
      top="0"
      :visible.sync="currentVisible"
      :close-on-click-modal="false"
      >
      <template slot="title">
        <img :src="currentChainConfig.icon" alt="">
        {{ $t('tradingMining.stakeDialog.title') }}
      </template>
      <McLoading
        :mask-color="'transparent'"
        :show-loading="loadingData"
        :min-show-time="500"
        :show-loading-text="false"
      >
      </McLoading>
      <div v-show="!loadingData" class="dialog-container" :class="[`${activatedTab}-box`]">
        <div class="top-container">
          <!-- left container -->
          <div class="left-container">
            <div class="info-panel2">
              <div class="top-box">
                <div class="title">
                  <div class="left">{{ $t('tradingMining.stakeDialog.yourStakedSATORI') }}</div>
                  <div class="right link-text">
                    <span @click="showGetMcbDialog=true">{{ $t('tradingMining.stakeDialog.getMcb') }}</span>
                  </div>
                </div>
                <div class="tabs-box">
                  <McTabs v-model="selectedViewChain" :tabs="viewChainOptions"
                          :equal-width="true"/>
                </div>
                <div class="value-box">
                  <div class="item">
                    <div>
                        <span>
                          {{ selectedChainStakedBalance | bigNumberFormatterTruncateByPrecision(6, 1, 2) }}
                          <img :src="require('@/assets/img/tokens/SATORI.svg')" alt="">
                        </span>
                      <span>
                        <el-tooltip placement="bottom" class="un-desc-tooltip" :disabled="selectedChainIsCurrentChain">
                          <div slot="content">{{ $t('tradingMining.switchChainPromp', { name: chainConfigs[selectedViewChain].chainName }).toString() }}</div>
                          <span>
                            <el-button class="restake-button" type="blue" size="medium" :disabled="restakeIsDisabled"
                                       @click="onReStakeEvent">
                              {{ $t('tradingMining.stakeDialog.restake') }}
                              <i v-if="reStaking" class="el-icon-loading"></i>
                            </el-button>
                          </span>
                        </el-tooltip>
                        </span>
                    </div>
                    <div>{{ $t('tradingMining.stakeDialog.stakedSATORI') }}</div>
                  </div>
                  <div class="vertical-split-line"></div>
                  <div class="item">
                    <div>
                      <template v-if="selectedChainUnlockTimestamp && selectedChainStakedBalance.gt(0)">
                          <span v-if="selectedChainUnlockTimeInfo.day">{{ selectedChainUnlockTimeInfo.day
                            }} {{ $t('base.day') }}</span>
                        <span v-else>{{ selectedChainUnlockTimeInfo.hour }} {{ $t('base.hour') }}</span>
                      </template>
                      <template v-else>--</template>
                    </div>
                    <div>
                      <el-tooltip placement="top">
                        <div slot="content"><span v-html="unlockTimeToolTip"></span></div>
                        <span>{{ $t('tradingMining.stakeDialog.unlockTime') }}</span>
                      </el-tooltip>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="info-panel1">
              <div class="top-box">
                <div class="title">{{ $t('tradingMining.stakeDialog.youStakingScore') }}</div>
                <div class="value-box">
                  <div class="item">
                    <div>
                      {{ currentStakedScore | bigNumberFormatterTruncateByPrecision(4, 1, 0) }}
                    </div>
                    <div>
                      <el-popover
                        placement="top"
                        width="342"
                        popper-class="tooltip-popover fantasy trading-mining-popover"
                        trigger="hover"
                      >
                        <div class="tooltip-content">
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
                        <div class="tooltip-box tooltip-line" slot="reference">{{ $t('tradingMining.stakeDialog.current') }}</div>
                      </el-popover>

                    </div>
                  </div>
                  <div class="vertical-split-line"></div>
                  <div class="item">
                    <div>
                      {{ currentEpochAvgScore | bigNumberFormatterTruncateByPrecision(4, 1, 0) }}
                    </div>
                    <div>
                      <el-tooltip placement="top">
                        <div slot="content"><span v-html="$t('tradingMining.stakeDialog.averageInEpochPromp')"></span></div>
                        <span>{{ $t('tradingMining.stakeDialog.averageInEpoch', {id: currentEpoch}).toString() }}</span>
                      </el-tooltip>
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
          </div>
          <!-- right container -->
          <div class="right-container">
            <div class="tabs-container">
              <McRadioTabs
                v-model="activatedTab"
                :class="[activatedTab]"
                :options="[
                  {label: $t('base.stake'), value: 'stake'},
                  {label: $t('base.unstake'), value: 'unstake'},
                ]"
              />
            </div>
            <template v-if="activatedTab === 'stake'">
              <div class="input-container">
                <div class="info-line">
                  <span>{{ $t('base.amount') }}</span>
                  <span>
                    {{ $t('base.walletBalance') }}:
                    {{ walletBalance | bigNumberFormatter(2) }}
                  </span>
                </div>
                <div class="input-line">
                  <el-form size="medium" :model="stakeForm" :rules="stakeFormRule" ref="stakeFormRef"
                           @submit.native.prevent>
                    <el-form-item prop="amount" :inline-message="true">
                      <el-input v-model="stakeAmount" size="large" placeholder="0.0">
                        <template slot="suffix">
                          <img :src="require('@/assets/img/tokens/SATORI.svg')" alt="">SATORI
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
                  <span class="label">{{ $t('tradingMining.stakeDialog.newScore') }}</span>
                  <span class="value">
                      <template v-if="!invalidStakeAmount">
                        {{ deltaNewStakingScore | bigNumberFormatter(0) }}
                        <span v-if="!deltaNewStakingScoreRate.isZero()"
                              :class="{'blue-color': deltaNewStakingScoreRate.gt(0), 'orange-color': deltaNewStakingScoreRate.lt(0)}"
                        >(<template v-if="deltaNewStakingScoreRate.gt(0)">+</template>{{
                            deltaNewStakingScoreRate | bigNumberFormatter(2) }}%)</span>
                      </template>
                      <template v-else>--</template>
                  </span>
                </div>
                <div class="text-line">
                    <span class="label">
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
                <div class="text-line">
                    <span class="label">
                      {{ $t('tradingMining.stakeDialog.newEstimatedRewards') }}
                    </span>
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
              <div class="button-container">
                <McSteps :start-label="$t('tradingMining.stakeDialog.stakedSATORIBtn', {name: currentChainConfig.chainName}).toString()">
                  <template #start="prop">
                    <div class="button-item">
                      <el-button size="large" type="blue" @click="onStakeEventStart(prop)" :loading="prop.start.running"
                                 :disabled="stakeButtonDisabled">
                        {{ prop.start.label }}
                      </el-button>
                    </div>
                  </template>
                  <McStepItem v-for="(step, index) in stakeSteps" :action="step.action" :label="step.label"
                              :key="index"></McStepItem>
                </McSteps>
              </div>
            </template>
            <template v-if="activatedTab === 'unstake'">
              <div class="input-container">
                <div class="info-line">
                  <span>{{ $t('base.amount') }}</span>
                </div>
                <div class="input-line">
                  <el-form size="medium" @submit.native.prevent>
                    <el-form-item prop="amount" :inline-message="true">
                      <el-input :value="currentChainStakedBalance | bigNumberFormatter(2)" readonly size="large" disabled>
                        <template slot="suffix">
                          <img :src="require('@/assets/img/tokens/SATORI.svg')" alt="">SATORI
                        </template>
                      </el-input>
                    </el-form-item>
                  </el-form>
                </div>
              </div>
              <div class="button-container">
                <el-tooltip placement="bottom" :disabled="!unStakeButtonDisabled">
                  <div slot="content">{{ unstakeToolTip }}</div>
                  <el-button
                    :class="{'is-disabled': unStakeButtonDisabled }"
                    :disabled="currentChainStakedBalance.lte(0)"
                    size="large"
                    type="orange"
                    :loading="unstaking"
                    @click="onUnstakeEvent"
                  >
                    <i class="iconfont icon-plain-lock" v-if="unStakeButtonDisabled && currentChainStakedBalance.gt(0)"></i>
                    {{ $t('tradingMining.stakeDialog.unstakeSATORI') }}
                  </el-button>
                </el-tooltip>
              </div>
            </template>
          </div>
        </div>
        <div class="bottom-container" v-if="activatedTab==='stake'">
          <div class="title">{{ $t('tradingMining.stakeDialog.desc.title') }}</div>
          <div class="desc">
            {{ $t('tradingMining.stakeDialog.desc.msg') }}
            <a class="link-text" target="_blank"
               href="https://mcdex.medium.com/announcing-trading-mining-v2-on-bsc-46e9610d7bad">{{ $t('base.learnMore') }}</a>
          </div>
        </div>
      </div>
    </el-dialog>
    <TradingMiningConfirmDialog :visible.sync="showConfirmDialog" @confirm="startStake"
                                :confirm-value="normalStakeAmount"
                                :total-value="normalStakeAmount.plus(currentChainStakedBalance)"
                                :locked-day="deltaUnlockTimeInfo.day" />
    <ReStakeRiskDialog ref="riskDialog" :staked-balance="currentChainStakedBalance" />
    <GetMcbDialog :visible.sync="showGetMcbDialog"></GetMcbDialog>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Ref, Watch } from 'vue-property-decorator'
import { McLoading, McRadioGroup, McRadioTabs, McStepItem, McSteps, PNNumber, McTabs } from '@/components'
import TradingMiningConfirmDialog from './TradingMiningConfirmDialog.vue'
import TradingMiningStakeMixin from '@/template/components/Mining/tradingMiningStakeMixin'
import ReStakeRiskDialog from '../Components/ReStakeRiskDialog.vue'
import GetMcbDialog from '../Components/GetMcbDialog.vue'
import { momentFormatter, toBigNumber } from '@/utils'
import moment from 'moment'
import BigNumber from 'bignumber.js'
import { _0 } from '@mcdex/mai3.js'
import { MINING_EVENT, VUE_EVENT_BUS } from '@/event'
import { currentChainConfig } from '@/config/chain'
import { ElForm } from 'element-ui/types/form'

@Component({
  components: {
    McLoading,
    TradingMiningConfirmDialog,
    McRadioTabs,
    McRadioGroup,
    PNNumber,
    McSteps,
    McStepItem,
    ReStakeRiskDialog,
    GetMcbDialog,
    McTabs,
  },
})
export default class TradingMiningStakeDialog extends Mixins(TradingMiningStakeMixin) {
  @Prop({ default: false, required: true }) visible !: boolean
  @Prop({ default: new BigNumber(0) }) defaultStakeAmount !: BigNumber
  @Ref('riskDialog') riskDialog!: ReStakeRiskDialog

  private showConfirmDialog: boolean = false
  private stakeStartFunc: Function | null = null
  private showGetMcbDialog: boolean = false
  private timer: number = 0

  get currentVisible() {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
  }

  get currentChainConfig() {
    return currentChainConfig
  }

  stakeFormRule = {
    amount: [
      { validator: this.validateInputNumber, trigger: 'change' },
      { validator: this.validateStakeAmount, trigger: 'change' },
    ]
  }

  get stakeButtonDisabled(): boolean {
    return this.invalidStakeAmount || this.normalStakeAmount.gt(this.walletBalance)
  }

  get unStakeButtonDisabled(): boolean {
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

  get stakeSteps() {
    const steps = [
      { label: this.$t('tradingMining.stakeDialog.stakedSATORI'),
        action: this.onStakeEvent.bind(this)
      }
    ]
    if (!this.isApproved) {
      steps.unshift({
        label: this.$t('base.approve').toString(),
        action: this.onApproveEvent.bind(this),
      })
    }
    return steps
  }

  get unlockTimeToolTip() {
    return this.$t('tradingMining.stakeDialog.unlockTimePromp',
      {
        time: this.selectedChainUnlockTimestamp === 0 || this.selectedChainStakedBalance.lte(0) ? '--'
          : momentFormatter(moment.unix(this.selectedChainUnlockTimestamp).local(), this.timeFormatter)
      }
    ).toString()
  }

  validateInputNumber(rule: any, value: string, callback: Function) {
    if (value === '') {
      return
    }
    const valueFloat = Number(value)
    if (isNaN(valueFloat)) {
      callback(new Error(this.$t('commonErrors.inputError').toString()))
    } else if (valueFloat <= 0) {
      callback(new Error(this.$t('commonErrors.inputError').toString()))
    } else {
      callback()
    }
  }

  validateStakeAmount(rule: any, value: string, callback: Function) {
    if (!this.walletBalance || !this.isConnectedWallet) {
      callback()
      return
    }
    if (this.walletBalance.lt(_0)) {
      callback(new Error(this.$t('commonErrors.InsufficientWallet').toString()))
      return
    }
    if (this.normalStakeAmount.gt(this.walletBalance) || this.normalStakeAmount.lt(_0)) {
      callback(
        new Error(
          this.$t('commonErrors.exceedMaxAmountError', {
            max: this.walletBalance.toFormat(2),
          }).toString()
        ),
      )
      return
    }
    callback()
  }

  onStakeEventStart(prop: any) {
    this.showConfirmDialog = true
    this.stakeStartFunc = prop.start.start
  }

  startStake() {
    if (this.stakeStartFunc) {
      this.stakeStartFunc()
    }
  }

  @Watch('currentVisible')
  async onShowDialog() {
    if (this.currentVisible) {
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
      // validate form
      const stakeFormRef = this.$refs.stakeFormRef as ElForm
      if (stakeFormRef) {
        stakeFormRef.validate()
      }
    } else {
      window.clearInterval(this.timer)
    }
  }

  async onReStakeEvent() {
    await new Promise((resolve, reject) => {
      this.riskDialog.show(confirmed => {
        if (confirmed) {
          resolve()
        } else {
          reject()
        }
      })
    })

    await this.onReStakeTokenEvent()
  }

  onCloseDialog() {
    VUE_EVENT_BUS.emit(MINING_EVENT.UpdateTradingMiningAccountInfo)
    this.loadingData = true
    this.activatedTab = 'stake'
    this.tradingMiningInfo = {}
    this.stakedInfo = {}
    this.lockPeriod = 0
    this.stakeForm.amount = ''
    this.stakeForm.amountProportion = 0
    this.walletBalance = new BigNumber(0)
    this.allowance = new BigNumber(0)
    this.isApproved = false
  }
}
</script>

<style lang="scss" scoped>
.trading-mining-stake-dialog {
  ::v-deep &.is-large {
    min-height: 532px;
    width: 784px;
    padding: 16px 0 0 0;
    .el-dialog__body {
      padding: 0 !important;
    }

    .el-dialog__header {
      padding-bottom: 28px;
      display: inline-flex;
      align-items: center;

      img {
        height: 23px;
        width: 23px;
        margin-right: 4px;
      }
    }
  }

  .mc-loading {
    position: unset;
    height: 90%;
    width: 100%;

    ::v-deep .mc-loading__mask {
      top: 54px;
    }
  }

  .stake-box {

  }

  .unstake-box {
    height: 481px !important;

    .top-container {
      border-bottom: unset !important;
    }
  }

  .dialog-container {
    position: relative;
    width: 100%;
    height: 618px;
    left: 0;
    bottom: 0;
    z-index: 1;

    .top-container {
      position: relative;
      width: 100%;
      height: 518px;
      border-bottom: 1px solid var(--mc-border-color);
      border-radius: var(--mc-border-radius-l);
      z-index: 2;
      background: var(--mc-background-color-dark);
      padding: 0 16px;
      display: flex;
    }

    .bottom-container {
      position: absolute;
      padding: 16px;
      bottom: 0;
      height: 120px;
      width: 100%;
      border-bottom-left-radius: var(--mc-border-radius-l);
      border-bottom-right-radius: var(--mc-border-radius-l);
      background: var(--mc-background-color-darkest);
      z-index: 1;

      .title {
        margin-top: 24px;
        font-size: 16px;
        color: var(--mc-text-color-white);
      }

      .desc {
        margin-top: 8px;
        color: var(--mc-text-color);
        font-size: 14px;

        .link-text {
          color: var(--mc-color-primary);
        }
      }
    }

    .left-container {
      width: 368px;

      .vertical-split-line {
        width: 1px;
        height: 48px;
        background: var(--mc-background-color);
        margin: 0 16px;
      }

      .info-panel1 {
        position: relative;
        z-index: 1;
        height: 222px;

        .top-box {
          margin-top: 16px;
          position: relative;
          z-index: 2;
          padding: 16px;
          border: 1px solid var(--mc-border-color);
          border-radius: var(--mc-border-radius-l);
          height: 120px;
          background: var(--mc-background-color-dark);

          .title {
            font-size: 16px;
            color: var(--mc-text-color-white);
          }

          .value-box {
            display: flex;
            margin-top: 16px;
            align-items: flex-end;

            .item {
              width: 50%;

              div:first-child {
                display: flex;
                align-items: center;
                font-size: 20px;
                color: var(--mc-text-color-white);
                line-height: 24px;
                img {
                  margin-left: 4px;
                  width: 22px;
                  height: 22px;
                }
              }

              div:last-child {
                margin-top: 4px;
                line-height: 20px;
                font-size: 14px;
                color: var(--mc-text-color);
                display: inline-block;
              }
            }
          }
        }

        .bottom-box {
          position: absolute;
          z-index: 1;
          width: 100%;
          background: var(--mc-background-color-darkest);
          margin-top: -18px;
          height: 120px;
          border: 1px solid var(--mc-border-color);
          border-radius: var(--mc-border-radius-l);
          font-size: 14px;
          color: var(--mc-text-color);
          padding: 34px 16px 16px;

          .line1, .line2 {
            line-height: 20px;
            word-break: keep-all;
          }

          .line2 {
            margin-top: 8px;
          }

          .link-text {
            color: var(--mc-color-primary);
          }
        }
      }

      .info-panel2 {
        position: relative;
        z-index: 1;
        height: 181px;

        .top-box {
          position: relative;
          z-index: 2;
          background: var(--mc-background-color-dark);
          border: 1px solid var(--mc-border-color);
          border-radius: var(--mc-border-radius-l);
          height: 181px;
          padding: 16px;

          .title {
            font-size: 16px;
            color: var(--mc-text-color-white);
            display: flex;
            justify-content: space-between;
            align-items: center;

            .link-text {
              font-size: 14px;
              color: var(--mc-color-primary);
              cursor: pointer;
            }
          }

          .value-box {
            margin-top: 16px;
            display: flex;
            align-items: flex-end;

            .item {
              &:nth-of-type(1) {
                width: 54%;
              }

              &:nth-of-type(2) {
                width: 46%;
              }

              div:first-child {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 20px;
                color: var(--mc-text-color-white);
                line-height: 24px;

                span:first-child {
                  display: flex;
                  align-items: center;
                }

                img {
                  margin-left: 4px;
                  width: 22px;
                  height: 22px;
                }
              }

              div:last-child {
                margin-top: 4px;
                line-height: 20px;
                font-size: 14px;
                color: var(--mc-text-color);
              }
            }

            .restake-button {
              height: 32px;
              min-width: 76px;
              border-radius: var(--mc-border-radius-m);
              padding: 0 12px;
            }
          }

          .tabs-box {
            margin-top: 16px;
            width: 45%;
            display: flex;
            border-bottom: 1px solid var(--mc-border-color);

            ::v-deep .tab-item {
              margin-left: 16px;

              &:first-child {
                margin-left: 0;
              }
            }
          }
        }

        .bottom-box {
          position: absolute;
          z-index: 1;
          width: 100%;
          background: var(--mc-background-color-darkest);
          margin-top: -18px;
          height: 90px;
          border: 1px solid var(--mc-border-color);
          border-radius: var(--mc-border-radius-l);
          font-size: 14px;
          color: var(--mc-text-color);
          padding: 34px 16px 16px;

          .line {
            font-size: 14px;
            color: var(--mc-text-color);
            line-height: 20px;

            ::v-deep {
              a {
                color: var(--mc-color-primary);
              }
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

        .mc-radio-tabs.stake ::v-deep .active {
          color: var(--mc-color-blue);
        }

        .mc-radio-tabs.unstake ::v-deep .active {
          color: var(--mc-color-orange);
        }
      }

      .input-container {
        min-height: 92px;
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

            &.is-disabled {
              .el-input__inner {
                color: var(--mc-text-color);
              }
            }

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

              img {
                width: 24px;
                height: 24px;
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
          line-height: 24px;

          img {
            height: 22px;
            width: 22px;
            margin: 0 4px;
          }

          &:last-child {
            margin-bottom: 0;
          }

          .label {
            color: var(--mc-text-color);
          }

          .value {
            color: var(--mc-text-color-white);
            display: inline-flex;
            align-items: center;
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

  .blue-color {
    color: var(--mc-color-blue);
  }

  .orange-color {
    color: var(--mc-color-orange);
  }
}
</style>

<style lang="scss">
.tooltip-line {
  text-decoration-color: inherit;
  text-underline-position: under;
  text-decoration-style: dashed;
  text-decoration-line: underline;
  cursor: pointer;
}

.un-desc-tooltip {
  text-decoration-line: none !important;
}
</style>

