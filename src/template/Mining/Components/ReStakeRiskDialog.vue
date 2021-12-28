<template>
  <div>
    <el-dialog
      append-to-body
      top="0"
      custom-class="is-small is-round"
      class="restake-risk-dialog"
      :close-on-click-modal="false"
      :visible.sync="visible"
      @close="onClose"
    >
      <div slot="title" class="head">
        <span class="head-title">{{ $t('tradingMining.restakeRiskDialog.title') }}</span>
      </div>

      <div class="text"
           v-html="$t('tradingMining.restakeRiskDialog.riskWarningText', {value: stakedBalance.toFixed(2) }).toString()"></div>

      <div class="dont-show">
        <el-checkbox v-model="isCheckKnow">{{ $t('tradingMining.restakeRiskDialog.understand') }}</el-checkbox>
      </div>

      <div class="confirm-btn">
        <el-button @click="confirm" :disabled="!isCheckKnow">
          {{ $t('tradingMining.restakeRiskDialog.bntText') }}
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import BigNumber from 'bignumber.js'

@Component
export default class ReStakeRiskDialog extends Vue {
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

  .dont-show {
    margin-top: 24px;
  }

  .confirm-btn {
    margin-top: 12px;

    .el-button {
      width: 100%;
      height: 56px;
      border-radius: 12px;
    }
  }
}
</style>
