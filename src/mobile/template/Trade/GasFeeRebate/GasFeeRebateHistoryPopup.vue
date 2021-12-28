<template>
  <div class="gas-fee-rebate-history-popup">
    <van-popup
      v-model="currentVisible"
      closeable
      position="bottom"
      round
      safe-area-inset-bottom
      ref="fixedDom"
      class="safe-area-inset-bottom"
      :close-on-click-overlay="false"
      @closed="popupClosed"
    >
      <div class="popup-header">
        <i class="iconfont icon-left2-back" @click="onBackInfoPage"></i>
        {{ $t('gasFeeRebate.historyTitle') }}
      </div>
      <div class="popup-container">
        <div class="tip-text" v-if="recentClaimEpoch">
          {{ $t('gasFeeRebate.prompts.claimTimeTip', {id: recentClaimEpoch.id+1}).toString() }}
          <span class="value">{{ recentClaimEpoch.claimTimestamp | timestampFormatter('MMM D, YYYY') }}</span>
        </div>
        <div class="table-box">
          <div class="table-header table-row">
            <div class="table-line-item">{{ $t('gasFeeRebate.week') }} #</div>
            <div class="table-line-item">{{ $t('gasFeeRebate.gasSpent') }}</div>
            <div class="table-line-item">
              <McMTooltip :content="$t('gasFeeRebate.prompts.rebatedClaimed')" placement="top">
                <span>{{ $t('gasFeeRebate.rebatedClaimed') }}</span>
              </McMTooltip>
            </div>
          </div>
          <div class="table-body">
            <McLoading
              :mask-color="'transparent'"
              :show-loading="loadingData || claimableHistoryInfoLoading"
              :min-show-time="500"
              :hide-content="loadingData || claimableHistoryInfoLoading"
              :show-loading-text="false"
            >
              <template v-if="accountHistoryData.length === 0">
                <McMNoData></McMNoData>
              </template>
              <template v-else>
                <div class="table-row" v-for="(item, index) in accountHistoryData" :key="index">
                  <div class="table-line-item">
                    <McMTooltip placement="top" :open-delay="400">
                      <span slot="content">
                        {{ item.startTimestamp | timestampFormatter('MMM D, YYYY') }} -
                        {{ item.endTimestamp | timestampFormatter('MMM D, YYYY') }}
                      </span>
                      <span>{{ item.weekId }}</span>
                    </McMTooltip>
                  </div>
                  <div class="table-line-item">
                    {{ item.gas | bigNumberFormatterTruncateByPrecision(6, 2, 3) }}
                    <img :src="currentChainConfig.symbol | tokenIconUrlFormatter" alt="">
                  </div>
                  <div class="table-line-item">
                    <McMTooltip placement="top" :open-delay="400">
                      <span slot="content">
                        {{ $t('gasFeeRebate.prompts.price', {price: getRebatePriceView(item.epoch)}).toString() }}
                      </span>
                      <span>{{ getRebatedValue(item.epoch) | bigNumberFormatterTruncateByPrecision(6, 2, 3) }}
                        / {{ getClaimedValue(item.epoch) | bigNumberFormatterTruncateByPrecision(6, 2, 3) }}</span>
                    </McMTooltip>
                    <img :src="require('@/assets/img/tokens/SATORI.svg')" alt="">
                  </div>
                </div>
              </template>
            </McLoading>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script lang='ts'>
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import { currentChainConfig } from '@/config/chain'
import { McMTooltip, McMNoData } from '@/mobile/components'
import { McLoading } from '@/components'
import { GasFeeRebateHistoryMixin } from '@/template/components/GasFeeRebate/gasFeeRebateHistoryMixin'

@Component({
  components: {
    McMTooltip,
    McLoading,
    McMNoData,
  }
})
export default class GasFeeRebateHistoryPopup extends Mixins(GasFeeRebateHistoryMixin) {
  @Prop({ required: true }) visible !: boolean

  get currentVisible(): boolean {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
  }

  get currentChainConfig() {
    return currentChainConfig
  }

  onBackInfoPage() {
    this.currentVisible = false
    this.$emit('closeHistoryPopup')
  }

  popupClosed() {
    this.accountEpochsInfo = {}
    this.accountHistoryData = []
    this.claimableHistoryInfo = {}
  }

  @Watch('currentVisible', { immediate: true })
  async onVisibleChanged() {
    if (this.currentVisible) {
      await Promise.all([
        this.updateHistoryData(),
        this.initialClaimableHistoryInfo()
      ])
    }
  }
}
</script>

<style lang='scss' scoped>
.gas-fee-rebate-history-popup {

  .van-popup {
    padding: 16px 16px 0 16px;
  }

  .popup-header {
    display: inline-flex;
    align-items: center;

    .icon-left2-back {
      font-size: 16px;
      margin-right: 16px;
      cursor: pointer;
      color: var(--mc-text-color-white);
    }
  }

  .popup-container {
    margin-top: 28px;

    .tip-text {
      margin-bottom: 8px;
      font-size: 8px;
      color: var(--mc-text-color);

      .value {
        color: var(--mc-text-color-white);
      }
    }

    .table-box {
      .table-row {
        display: flex;
        align-items: center;
        justify-content: space-around;

        .table-line-item {
          display: inline-flex;
          justify-content: left;
          align-items: center;

          &:nth-of-type(1) {
            width: 28%;
          }

          &:nth-of-type(2) {
            width: 36%;
          }

          &:nth-of-type(3) {
            width: 36%;
            justify-content: flex-end;
          }

          img {
            height: 18px;
            width: 18px;
            margin-left: 4px;
          }
        }
      }

      .table-header {
        border-bottom: 1px solid #1A2136;

        &.table-row {
          height: 36px;
          font-size: 14px;
          color: var(--mc-text-color);

          .table-line-item {
            line-height: 20px;
          }
        }
      }

      .table-body {
        overflow-y: auto;
        height: 208px;

        .table-row {
          height: 52px;
          border-bottom: 1px solid #1A2136;
          &:last-child {
            border-bottom: unset;
          }
        }

        .table-line-item:nth-of-type(3) {
          justify-content: right;
        }
      }
    }

    .mc-loading {
      height: 100%;
      width: 100%;
    }

    .no-data {
      height: 100%;
    }
  }
}
</style>
