<template>
  <div class="trading-formula-popup">
    <van-popup
      v-model="currentVisible"
      closeable
      position="bottom"
      class="safe-area-inset-bottom"
      round
      safe-area-inset-bottom
      :close-on-click-overlay="false"
    >
      <div class="popup-header">{{ $t('tradingMining.tradingFormula') }}</div>
      <div class="popup-container">
        <div class="desc">
          {{ $t('tradingMining.desc') }}
          <a href="" target="_blank">{{ $t('base.learnMore') }}</a>
        </div>
        <div class="formula">
          <img :src="require('@/assets/img/trading-mining-formula2.svg')" alt="">
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script lang='ts'>
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class TradingFormulaPopup extends Vue {
  @Prop({ default: false }) visible !: boolean

  get currentVisible(): boolean {
    return this.visible
  }

  set currentVisible(v: boolean) {
    this.$emit('update:visible', v)
  }

}
</script>

<style lang="scss" scoped>
.trading-formula-popup {
  ::v-deep {
    .van-popup {
      padding: 16px;
      background-color: var(--mc-background-color-dark);
    }
  }

  .popup-container {
    margin-top: 28px;

    .desc {
      font-size: 14px;
      color: var(--mc-text-color);
      line-height: 20px;

      a {
        color: var(--mc-color-primary);
      }
    }

    .formula {
      margin-top: 12px;
      background: var(--mc-background-color-darkest);
      padding: 16px;
      border-radius: var(--mc-border-radius-l);
    }
  }
}
</style>
