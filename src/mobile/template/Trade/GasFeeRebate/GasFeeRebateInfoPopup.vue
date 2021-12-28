<template>
  <div class="gas-fee-rebate-info-popup">
    <van-popup
      v-model="currentVisible"
      closeable
      position="bottom"
      round
      safe-area-inset-bottom
      ref="fixedDom"
      class="safe-area-inset-bottom"
      @closed="popupClosed"
    >
      <div class="popup-header">
        <img :src="currentChainConfig.icon" alt=''>
        {{ $t('gasFeeRebate.infoTitle') }}
      </div>
      <div class="popup-container">
        <van-skeleton :row="6" :loading="isLoading">
          <div class="info-container">
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
                <span class="link-text" @click="onShowHistory">{{ $t('base.history') }}</span>
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
                  <McMTooltip placement="top">
                    <div slot="content" class="gas-fee-rebate-tooltip-content">
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
                  </McMTooltip>
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
                  <McMTooltip placement="top">
                    <div slot="content" class="gas-fee-rebate-tooltip-content">
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
                  </McMTooltip>
                </div>
              </div>
              <div class="value-item">
                <van-button size="medium" class="round claim-button" @click="onClaimAllEpochReward" :loading="claiming === 'loading'"
                            :disabled="allowClaimableValue.isZero() || claiming === 'loading'" :loading-text="$t('base.claim')">
                  {{ $t('base.claim') }}
                </van-button>
              </div>
            </div>
          </div>
        </van-skeleton>
        <div class="desc-container">
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
                  <McMTooltip :content="$t('gasFeeRebate.prompts.infoDesc6Prompt')">
                    <span>{{ $t('gasFeeRebate.prompts.infoDesc6Center') }}</span>
                  </McMTooltip>
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
    </van-popup>
    <GasFeeRebateHistoryPopup :visible.sync="showHistoryPopup" @closeHistoryPopup="onCloseHistoryPopup" />
  </div>
</template>

<script lang='ts'>
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import { McMTooltip } from '@/mobile/components'
import { McCountDown } from '@/components'
import GasFeeRebateHistoryPopup from './GasFeeRebateHistoryPopup.vue'
import { GasFeeRebateInfoMixin } from '@/template/components/GasFeeRebate/gasFeeRebateInfoMixin'
import { distributedTimeDelay, GasFeeRebateClaimMixin } from '@/template/components/GasFeeRebate/gasFeeRebateClaimMixin'
import { BigNumber } from 'bignumber.js'

@Component({
  components: {
    McMTooltip,
    GasFeeRebateHistoryPopup,
    McCountDown,
  }
})
export default class GasFeeRebateInfoPopup extends Mixins(GasFeeRebateInfoMixin, GasFeeRebateClaimMixin) {
  @Prop({ required: true }) visible !: boolean

  private showHistoryPopup: boolean = false
  private timer: number = 0

  get isLoading() {
    return this.loadingData || this.allowClaimableValueLoading || this.claimableHistoryInfoLoading
  }

  get currentVisible(): boolean {
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

  popupClosed() {
    window.clearInterval(this.timer)
    this.accountEpochsInfo = {}
  }

  onShowHistory() {
    this.showHistoryPopup = true
    this.currentVisible = false
  }

  onCloseHistoryPopup() {
    this.currentVisible = true
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
.gas-fee-rebate-info-popup {
  .van-popup {
    padding: 16px;

    .popup-header {
      display: inline-flex;
      align-items: center;

      img {
        height: 23px;
        width: 23px;
        margin-right: 4px;
      }
    }
  }

  .link-text {
    cursor: pointer;
    color: var(--mc-color-primary);
  }

  .popup-container {
    margin-top: 28px;
  }

  .claim-button {
    margin-left: 12px;
    height: 32px;
    min-width: 80px;
    font-size: 12px;
    border-radius: var(--mc-border-radius-m);
  }

  .info-container {
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

    .line-2 {
      .value-item {
        &:nth-of-type(1) {
          width: 36%;
        }

        &:nth-of-type(3) {
          min-width: 31%;
        }
      }
    }

    .line-3 {
      .value-item {
        &:nth-of-type(1) {
          width: 42%;
        }

        &:nth-of-type(3) {
          min-width: 28%;
        }
      }
    }

    .line-2,.line-3 {
      display: flex;
      align-items: center;
      margin-top: 16px;
      height: 48px;

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

  .desc-container {
    margin-top: 16px;
    padding: 16px;
    background: var(--mc-background-color-darkest);
    border-radius: var(--mc-border-radius-l);

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
