<template>
  <div class="liquidity-risk-popup">
    <van-popup
      v-model="visible" round class="safe-area-inset-bottom" safe-area-inset-bottom
      position="bottom" closeable @closed="onClose">
      <div class="popup-header">
        <span class="warn-svg">
          <img src="@/assets/img/Warning.svg" alt=''>
        </span>
        <span>
          {{ $t('pool.addLiquidityRiskDialog.title') }}
        </span>
      </div>

      <div class="popup-container">
        <div class="text" v-html="$t('pool.addLiquidityRiskDialog.riskWarningText')"></div>

        <div class="warn-box">
          <span class="warn">
            <i class="iconfont icon-warning-triangle"></i>
            <span class="unknown-text">
              {{ $t('pool.addLiquidityRiskDialog.warningText') }}
            </span>
          </span>
        </div>

        <div class="dont-show">
          <van-checkbox v-model="isCheckKnow" class="mc-mobile__checkbox">
            {{ $t('pool.addLiquidityRiskDialog.understand') }}
            <template #icon="props">
              <div class="selected box" v-if="props.checked">
                <i class="iconfont icon-select"></i>
              </div>
              <div class="un-selected box" v-else></div>
            </template>
          </van-checkbox>
        </div>

        <div class="add-liquidity-btn">
          <van-button class="round" size="large" @click="confirm" :disabled="!isCheckKnow">
            {{ $t('pool.liquidityPage.addLiquidity') }}
          </van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class AddLiquidityRiskPopup extends Vue {
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
.liquidity-risk-popup {
  ::v-deep {
    .van-popup {
      padding: 16px;
      min-height: 120px;
    }

    .van-popup__close-icon {
      color: var(--mc-text-color-white);
    }
  }

  .popup-header {
    display: flex;
    align-items: center;

    .warn-svg img {
      width: 24px;
      height: 24px;
      margin-right: 8px;
    }
  }

  .popup-container {
    .head {
      display: flex;

      .warn-svg {
        display: flex;
        justify-content: center;
        align-items: center;

        img {
          width: 24px;
        }
      }

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
      margin-top: 14px;

      ::v-deep a {
        text-decoration: underline;
      }
    }

    .warn-box {
      padding: 8px 0 24px;

      .warn {
        height: 24px;
        min-width: 155px;
        border-radius: 8px;
        padding: 4px 8px;
        display: inline-block;
        line-height: 1;
        background: rgba($--mc-color-warning, 0.1);

        i {
          font-size: 16px;
          height: 16px;
          color: var(--mc-color-warning);
        }

        .unknown-text {
          margin-left: 4px;
          font-size: 12px;
          line-height: 16px;
          color: var(--mc-color-warning);
        }
      }
    }

    ::v-deep .mc-mobile__checkbox .van-checkbox__label{
      font-size: 14px;
      line-height: 16px;
    }

    .add-liquidity-btn {
      margin-top: 16px;
    }
  }
}
</style>
