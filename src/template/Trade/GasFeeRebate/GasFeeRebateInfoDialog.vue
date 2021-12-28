<template>
  <div>
    <el-dialog
      append-to-body
      top="0"
      custom-class="is-round is-small gas-fee-rebate-dialog"
      :close-on-click-modal="false"
      :visible.sync="currentVisible"
      @closed="dialogClosed"
    >
      <template slot="title">
        <img :src="currentChainConfig.icon" alt=''>
        {{ $t('gasFeeRebate.infoTitle') }}
      </template>
      <McLoading
        :mask-color="'transparent'"
        :show-loading="isLoading"
        :min-show-time="500"
        :hide-content="isLoading"
        :show-loading-text="false"
      >
        <div class="dialog-container" :class="{'end-container': gasFeeRebateIsEnd }">
          <div class="top-container">
            <div class="line-1">
              <div class="left">
                <template v-if="!gasFeeRebateIsEnd">
                  <span class="label">{{ $t('gasFeeRebate.week') }} {{ currentGasFeeRebateEpochViewStr }}:</span>
                  <span class="value" >
                    <template v-if="currentGasFeeRebateInfo">
                      {{ currentGasFeeRebateInfo.startTimestamp | timestampFormatter('MMM D, YYYY') }}
                      - {{ currentGasFeeRebateInfo.endTimestamp | timestampFormatter('MMM D, YYYY') }}
                    </template>
                    <template v-else>n/a</template>
                  </span>
                </template>
                <template v-else>
                  <span class="label">{{ $t('gasFeeRebate.endTitleTip') }}</span>
                </template>
              </div>
              <div class="right">
                <span class="link-text" @click="showHistoryDialog=true">{{ $t('base.history') }}</span>
              </div>
            </div>
            <div class="line-2">
              <div class="value-item">
                <div class="value">
                  <template v-if="currentGasFeeRebateRate>-1 && !gasFeeRebateIsEnd">
                    {{ currentGasFeeRebateRate }}%
                  </template>
                  <template v-else>N/A</template>
                </div>
                <div class="label">
                  <el-tooltip placement="top">
                    <div slot="content" class="gas-fee-rebate-tooltip-content rebate-rate-tooltip">
                      <div>{{ $t('gasFeeRebate.prompts.rebateRate') }}</div>
                      <div class="br-text"></div>
                      <div class="flex-item">
                        <span>From Nov. 15, 2021 to Dec. 14, 2021:</span>
                        <span class="blue-text">100%</span>
                      </div>
                      <div class="flex-item">
                        <span>From Dec. 15, 2021 to Jan. 14, 2022:</span>
                        <span class="blue-text">90%</span>
                      </div>
                      <div class="flex-item">
                        <span>From Jan. 15, 2022 to Feb. 14, 2022:</span>
                        <span class="blue-text">80%</span>
                      </div>
                    </div>
                    <div>{{ $t('gasFeeRebate.rebateRate') }}</div>
                  </el-tooltip>
                </div>
              </div>
              <div class="vertical-split-line"></div>
              <div class="value-item">
                <div class="value">
                  {{ currentEpochAccountGasFee | bigNumberFormatterTruncateByPrecision(6, 2, 3) }}
                  <img :src="currentChainConfig.symbol | tokenIconUrlFormatter" alt=''>
                </div>
                <div class="label">{{ $t('gasFeeRebate.gasSpent') }}</div>
              </div>
            </div>
            <div class="horizontal-split-line"></div>
            <div class="line-3">
              <div class="value-item">
                <div class="value">
                  <template v-if="currentGasFeeRebateInfo && !gasFeeRebateIsEnd">
                    <McCountDown :end-timestamp="currentGasFeeRebateInfo.endTimestamp" :module="2"/>
                  </template>
                  <template v-else>N/A</template>
                </div>
                <div class="label">
                  {{ $t('gasFeeRebate.weekCountdown', {epoch: currentGasFeeRebateEpochViewStr}).toString() }}
                </div>
              </div>
              <div class="vertical-split-line"></div>
              <div class="value-item">
                <div class="value">
                  {{ allowClaimableValue | bigNumberFormatterTruncateByPrecision(6, 1, 2) }}
                  <img :src="require('@/assets/img/tokens/SATORI.svg')" alt="">
                </div>
                <div class="label">
                  <el-tooltip>
                    <div slot="content" class="gas-fee-rebate-tooltip-content rebate-claimable-now-tooltip">
                      <div class="flex-item" v-for="(epoch, index) in allowClaimableList" v-if="!getHistoryAllowClaimableValue(epoch).isZero()">
                        <span>{{ $t('gasFeeRebate.week') }} {{ epoch + 1}}:</span>
                        <span class="blue-text">
                          {{ getHistoryAllowClaimableValue(epoch) | bigNumberFormatterTruncateByPrecision(6, 1, 2) }}SATORI
                        </span>
                      </div>
                      <div class="br-text" v-if="allowClaimableList.length>0"></div>
                      <div v-for="(epoch, index) in allowClaimableList" v-if="!getHistoryAllowClaimableValue(epoch).isZero()">
                        <div>{{ $t('gasFeeRebate.prompts.claimableNow1', {
                            weekId: epoch + 1,
                            time: formatTime(getHistoryDistributedTime(epoch)),
                            price: formatPrice(getHistoryPrice(epoch))
                          }).toString() }}</div>
                        <div class="br-text"></div>
                      </div>
                      <div v-if="recentClaimEpoch">
                        {{ $t('gasFeeRebate.prompts.claimableNow2', {
                          weekId: recentClaimEpoch.id + 1,
                          time: formatTime(recentClaimEpoch.claimTimestamp),
                        }).toString() }}
                        <div class="br-text"></div>
                      </div>
                      <div v-if="!gasFeeRebateIsEnd">
                        {{ $t('gasFeeRebate.prompts.claimableNow2', {
                          weekId: currentGasFeeRebateEpochViewStr,
                          time: formatTime(currentEpochDistributedTime),
                        }).toString() }}
                      </div>
                    </div>
                    <div>{{ $t('gasFeeRebate.claimableNow') }}</div>
                  </el-tooltip>
                </div>
              </div>
              <div class="value-item">
                <el-button size="medium" class="claim-button" @click="onClaimAllEpochReward"
                           :disabled="allowClaimableValue.isZero() || claiming === 'loading'">
                  <i class="el-icon-loading" v-if="claiming === 'loading'"></i>
                  {{ $t('base.claim') }}
                </el-button>
              </div>
            </div>
          </div>
          <div class="bottom-container">
            <template v-if="!gasFeeRebateIsEnd">
              <div class="text-item">
                {{ $t('gasFeeRebate.prompts.infoDesc1') }}
                <a class="link-text" href="https://mcdex.medium.com/announcing-gas-fee-rebate-program-d108cb071616" target="_blank">{{ $t('base.learnMore') }}</a>
              </div>
              <div class="text-item li-item">
                <ul>
                  <li>{{ $t('gasFeeRebate.prompts.infoDesc2') }}</li>
                  <li>{{ $t('gasFeeRebate.prompts.infoDesc3') }}</li>
                  <li>{{ $t('gasFeeRebate.prompts.infoDesc4') }}</li>
                  <li>{{ $t('gasFeeRebate.prompts.infoDesc5') }}</li>
                  <li>
                    {{ $t('gasFeeRebate.prompts.infoDesc6Before') }}
                    <el-tooltip :content="$t('gasFeeRebate.prompts.infoDesc6Prompt')" placement="top" :open-delay="400">
                      <span>{{ $t('gasFeeRebate.prompts.infoDesc6Center') }}</span>
                    </el-tooltip>
                    {{ $t('gasFeeRebate.prompts.infoDesc6After') }}
                  </li>
                </ul>
              </div>
            </template>
            <template v-else>
              <div class="text-item">
                {{ $t('gasFeeRebate.prompts.endInfoDesc', {name: currentChainConfig.chainName}).toString() }}
              </div>
            </template>
          </div>
        </div>
      </McLoading>
    </el-dialog>
    <GasFeeRebateHistoryDialog :visible.sync="showHistoryDialog" />
  </div>
</template>

<script lang='ts'>
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import { McLoading, McCountDown } from '@/components'
import GasFeeRebateHistoryDialog from './GasFeeRebateHistoryDialog.vue'
import { GasFeeRebateInfoMixin } from '@/template/components/GasFeeRebate/gasFeeRebateInfoMixin'
import { distributedTimeDelay, GasFeeRebateClaimMixin } from '@/template/components/GasFeeRebate/gasFeeRebateClaimMixin'
import { BigNumber } from 'bignumber.js'

@Component({
  components: {
    McLoading,
    GasFeeRebateHistoryDialog,
    McCountDown,
  }
})
export default class GasFeeRebateInfoDialog extends Mixins(GasFeeRebateInfoMixin, GasFeeRebateClaimMixin) {
  @Prop({ default: false }) visible!: boolean

  private showHistoryDialog: boolean = false
  private timer: number = 0

  get isLoading() {
    return this.loadingData || this.allowClaimableValueLoading || this.claimableHistoryInfoLoading
  }

  get currentVisible() {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
  }

  getHistoryAllowClaimableValue(epoch: number): BigNumber {
    return this.claimableHistoryInfo[epoch]?.allowClaimableValue || new BigNumber(0)
  }

  getHistoryDistributedTime(epoch: number): number {
    return this.claimableHistoryInfo[epoch]?.distributedTime ||
      this.currentGasFeeRebateInfo?.endTimestamp + distributedTimeDelay || 0
  }

  getHistoryPrice(epoch: number): BigNumber {
    return this.claimableHistoryInfo[epoch]?.price || new BigNumber(0)
  }

  dialogClosed() {
    window.clearInterval(this.timer)
    this.accountEpochsInfo = {}
  }

  @Watch('currentVisible', { immediate: true })
  async onVisibleChanged() {
    if (this.currentVisible) {
      await Promise.all([
        this.initialAccountInfo(),
        this.initialAllowClaimableValue(),
        this.initialClaimableHistoryInfo(),
      ])
      this.timer = window.setInterval(() => {
        this.updateAccountGasFeeInfo()
      }, 1000*60)
    }
  }
}
</script>

<style lang='scss' scoped>
.gas-fee-rebate-dialog {
  ::v-deep &.is-small {
    width: 400px;
    padding: 16px 0 0 0;

    .el-dialog__body {
      padding: 0 !important;
    }

    .el-dialog__header {
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
    min-height: 258px;
    width: 100%;

    ::v-deep .mc-loading__mask {
      top: 54px;
    }
  }

  .link-text {
    cursor: pointer;
    color: var(--mc-color-primary);
  }

  .dialog-container {
    position: relative;
    width: 100%;
    height: 464px;
    left: 0;
    bottom: 0;
    z-index: 1;
    margin-top: 12px;

    .top-container {
      position: relative;
      width: 100%;
      height: 182px;
      border-bottom: 1px solid var(--mc-border-color);
      border-radius: var(--mc-border-radius-l);
      z-index: 2;
      background: var(--mc-background-color-dark);
      padding: 0 16px;
    }

    .bottom-container {
      position: absolute;
      padding: 16px;
      bottom: 0;
      height: 286px;
      width: 100%;
      border-bottom-left-radius: var(--mc-border-radius-l);
      border-bottom-right-radius: var(--mc-border-radius-l);
      background: var(--mc-background-color-darkest);
      z-index: 1;
    }
  }

  .end-container {
    height: 265px !important;

    .bottom-container {
      height: 88px !important;
    }
  }

  .claim-button {
    height: 32px;
    min-width: 80px;
    font-size: 12px;
    border-radius: var(--mc-border-radius-m);
  }

  .top-container {
    .line-1 {
      width: 100%;
      height: 20px;
      line-height: 20px;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;

      .left {
        .label {
          color: var(--mc-text-color);
        }

        .value {
          margin-left: 4px;
          color: var(--mc-text-color-white);
        }
      }

      .right {

      }
    }

    .line-2 {
      width: 100%;
    }

    .line-3 {
      width: 100%;
    }

    .line-2,.line-3 {
      display: flex;
      align-items: center;
      margin-top: 16px;

      .value-item {
        height: 48px;

        &:nth-of-type(1) {
          width: 40%;
        }

        &:nth-of-type(3) {
          min-width: 24%;
        }

        .value {
          font-size: 20px;
          line-height: 24px;
          color: var(--mc-text-color-white);
          display: inline-flex;
          align-items: center;

          .mc-count-down {
            font-size: 20px;
          }

          img {
            height: 22px;
            width: 22px;
            margin-left: 4px;
          }
        }

        .label {
          margin-top: 4px;
          color: var(--mc-text-color);
          line-height: 20px;
          font-size: 14px;
        }
      }
    }

    .horizontal-split-line {
      margin-top: 16px;
      width: 100%;
      height: 1px;
      background: var(--mc-border-color);
    }

    .vertical-split-line {
      width: 1px;
      height: 48px;
      background: var(--mc-border-color);
      margin: 0 16px;
    }
  }

  .bottom-container {
    word-break: keep-all;
    .text-item {
      font-size: 14px;
      color: var(--mc-text-color);
      line-height: 20px;
    }

    .li-item {
      li {
        list-style: disc;
        margin-left: 22px;
      }
    }
  }
}
</style>

<style lang="scss">
.gas-fee-rebate-tooltip-content {
  &.rebate-rate-tooltip {
    width: 288px;
  }

  &.rebate-claimable-now-tooltip {
    width: 238px;
  }

  .br-text {
    height: 16px;
  }

  .flex-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .blue-text {
    color: var(--mc-color-blue);
  }
}
</style>
