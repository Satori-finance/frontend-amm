<template>
  <div class="restake-risk-popup">
    <van-popup
      v-model="visible"
      round
      position="bottom"
      class="safe-area-inset-bottom"
      safe-area-inset-bottom
      closeable
      @closed="onClose">
      <div class="popup-header">
        <span>
          {{ $t('tradingMining.restakeRiskDialog.title') }}
        </span>
      </div>

      <div class="popup-container">
        <div class="text"
             v-html="$t('tradingMining.restakeRiskDialog.riskWarningText', {value: stakedBalance.toFixed(2) }).toString()"></div>

        <div class="dont-show">
          <van-checkbox v-model="isCheckKnow" class="mc-mobile__checkbox">
            {{ $t('tradingMining.restakeRiskDialog.understand') }}
            <template #icon="props">
              <div class="selected box" v-if="props.checked">
                <i class="iconfont icon-select"></i>
              </div>
              <div class="un-selected box" v-else></div>
            </template>
          </van-checkbox>
        </div>

        <div class="conform-btn">
          <van-button class="round" size="large" @click="confirm" :disabled="!isCheckKnow">
            {{ $t('tradingMining.restakeRiskDialog.bntText') }}
          </van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import BigNumber from 'bignumber.js'

@Component
export default class ReStakeRiskPopup extends Vue {
  @Prop({ default: () => new BigNumber(0) }) stakedBalance !: BigNumber
  private visible = false
  private isCheckKnow: boolean = false
  private callback: (confirmed: boolean) => void = (confirmed: boolean) => {}

  show(callback: (confirmed: boolean) => void) {
    this.callback = callback
    this.visible = true
  }

  private onClose() {
    this.callback(false)
    this.isCheckKnow = false
  }

  private confirm() {
    this.callback(true)
    this.callback = (confirmed: boolean) => {}
    this.visible = false
  }
}
</script>

<style lang="scss" scoped>
@import '~@mcdex/style/common/var';
.restake-risk-popup {
  ::v-deep {
    .van-popup {
      padding: 16px;
      background-color: var(--mc-background-color);
      min-height: 120px;
    }

    .van-popup__close-icon {
      color: var(--mc-text-color-white);
    }
  }

  .popup-header {
    display: flex;
    align-items: center;
  }

  .popup-container {
    .head {
      display: flex;

      .head-title {
        margin-left: 8px;
        font-size: 18px;
        line-height: 24px;
      }
    }

    .text {
      font-size: 14px;
      line-height: 20px;
      word-break: keep-all;
      margin-top: 28px;

      ::v-deep a {
        text-decoration: underline;
      }
    }

    ::v-deep .mc-mobile__checkbox .van-checkbox__label{
      color: var(--mc-text-color-white);
      font-size: 14px;
      line-height: 16px;
    }

    .dont-show {
      margin-top: 24px;
    }

    .conform-btn {
      font-size: 16px;
      margin-top: 16px;

      ::v-deep {
        .van-button__text {
          font-size: 16px;
        }
      }
    }
  }
}
</style>
