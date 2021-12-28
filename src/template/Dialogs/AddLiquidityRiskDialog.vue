<template>
  <div>
    <el-dialog
      append-to-body
      top="0"
      custom-class="is-small is-round"
      class="liquidity-risk-dialog"
      :close-on-click-modal="false"
      :visible.sync="visible"
      @close="onClose"
    >
      <div slot="title" class="head">
        <span class="warn-svg">
          <img src="@/assets/img/Warning.svg" alt="" />
        </span>
        <span class="head-title">{{ $t('pool.addLiquidityRiskDialog.title') }}</span>
      </div>

      <div class="text" v-html="$t('pool.addLiquidityRiskDialog.riskWarningText')">
      </div>

      <div class="warn-box">
        <span class="warn">
          <i class="iconfont icon-warning-triangle"></i>
          <span class="unknown-text">
            {{ $t('pool.addLiquidityRiskDialog.warningText') }}
          </span>
        </span>
      </div>

      <div class="dont-show">
        <el-checkbox v-model="isCheckKnow">{{ $t('pool.addLiquidityRiskDialog.understand') }}</el-checkbox>
      </div>

      <div class="add-liquidity-btn">
        <el-button @click="confirm" :disabled="!isCheckKnow">
          {{ $t('pool.liquidityPage.addLiquidity') }}
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class AddLiquidityRiskDialog extends Vue {
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

<style scoped lang='scss'>
@import '~@mcdex/style/common/var';

::v-deep .el-dialog {
  border-radius: 12px;
  padding: 16px;

  .el-dialog__header {
    padding: 0 0 28px;
    justify-content: space-between;
  }

  .el-dialog__body {
    padding: 0;
  }

  .el-dialog__headerbtn {
    position: static;
  }

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

    a {
      text-decoration: underline;
    }
  }

  .warn-box {
    padding: 8px 0 24px;

    .warn {
      height: 24px;
      width: 155px;
      border-radius: 8px;
      padding: 4px 8px;
      display: flex;
      align-items: center;
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

  .add-liquidity-btn {
    margin-top: 12px;

    .el-button {
      width: 100%;
      height: 56px;
      border-radius: 12px;
    }
  }
}
</style>
