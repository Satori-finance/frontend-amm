<template>
  <div class="trading-mining-confirm-popup">
    <van-popup
      v-model="currentVisible"
      closeable
      position="bottom"
      @closed="onClosePopup"
      class="safe-area-inset-bottom"
      round
      safe-area-inset-bottom
      :close-on-click-overlay="false"
    >
      <div class="popup-header">{{ $t('tradingMining.confirmDialog.title') }}</div>
      <div class="popup-container">
        <div class="desc">{{ confirmDesc }}</div>
        <div class="checkbox">
          <van-checkbox v-model="isConfirm" class="mc-mobile__checkbox">
            {{ $t('tradingMining.confirmDialog.checkboxLabel') }}
            <template #icon="props">
              <div class="selected box" v-if="props.checked">
                <i class="iconfont icon-select"></i>
              </div>
              <div class="un-selected box" v-else></div>
            </template>
          </van-checkbox>
        </div>
        <div class="confirm-button">
          <van-button class="round" size="large" :disabled="!isConfirm" @click="confirmEvent">
            {{ $t('tradingMining.confirmDialog.stakeSATORI') }}
          </van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script lang='ts'>
import { Component, Prop, Vue } from 'vue-property-decorator'
import BigNumber from 'bignumber.js'

@Component
export default class TradingMiningConfirmPopup extends Vue {
  @Prop({ default: false, required: true }) visible !: boolean
  @Prop({ default: 0 }) lockedDay !: number
  @Prop({default: () => new BigNumber(0 )}) confirmValue !: BigNumber
  @Prop({default: () => new BigNumber(0 )}) totalValue !: BigNumber

  private isConfirm: boolean = false

  get currentVisible(): boolean {
    return this.visible
  }

  set currentVisible(v: boolean) {
    this.$emit('update:visible', v)
  }

  get confirmDesc(): string {
    return this.$t('tradingMining.confirmDialog.desc', {
      value: this.confirmValue.toFixed(2),
      totalValue: this.totalValue.toFixed(2),
      lockedDay: this.lockedDay
    }).toString()
  }

  confirmEvent() {
    this.currentVisible = false
    this.$emit('confirm')
  }

  onClosePopup() {
    this.isConfirm = false
  }
}
</script>

<style lang="scss" scoped>
.trading-mining-confirm-popup {
  ::v-deep {
    .van-popup {
      height: 312px;
      padding: 16px;
    }
  }

  .popup-container {
    margin-top: 14px;

    .desc {
      font-size: 14px;
      color: var(--mc-text-color-white);
      line-height: 20px;
    }

    .checkbox {
      margin-top: 64px;

      ::v-deep .van-checkbox__label {
        font-size: 14px;
      }
    }

    .confirm-button {
      margin-top: 16px;
    }
  }
}
</style>
