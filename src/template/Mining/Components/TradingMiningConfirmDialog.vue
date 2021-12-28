<template>
  <el-dialog
    @close="onCloseDialog"
    custom-class="is-small is-round trading-mining-stake-dialog"
    append-to-body
    top="0"
    :visible.sync="currentVisible"
    :close-on-click-modal="false"
    :title="$t('tradingMining.confirmDialog.title')">
    <div class="dialog-container">
      <div class="desc">{{ confirmDesc }}</div>
      <div class="checkbox">
        <el-checkbox v-model="isConfirm">{{ $t('tradingMining.confirmDialog.checkboxLabel') }}</el-checkbox>
      </div>
      <div class="confirm-button">
        <el-button size="large" :disabled="!isConfirm" @click="confirmEvent">
          {{ $t('tradingMining.confirmDialog.stakeSATORI') }}
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script lang='ts'>
import { Component, Prop, Vue } from 'vue-property-decorator'
import BigNumber from 'bignumber.js'

@Component
export default class TradingMiningConfirmDialog extends Vue {
  @Prop({ default: false, required: true }) visible !: boolean
  @Prop({ default: 0 }) lockedDay !: number
  @Prop({default: () => new BigNumber(0 )}) confirmValue !: BigNumber
  @Prop({default: () => new BigNumber(0 )}) totalValue !: BigNumber

  private isConfirm: boolean = false

  get currentVisible() {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
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

  onCloseDialog() {
    this.isConfirm = false
  }
}
</script>

<style lang='scss' scoped>
.trading-mining-stake-dialog {
  ::v-deep &.is-small {
    min-height: 236px;
    width: 400px;
  }

  .dialog-container {
    .desc {
      margin-top: 12px;
      font-size: 14px;
      color: var(--mc-text-color-white);
      line-height: 20px;
    }

    .checkbox {
      margin-top: 24px;
    }

    .confirm-button {
      margin-top: 12px;
      .el-button {
        width: 100%;
        border-radius: var(--mc-border-radius-l);
        height: 56px;
      }
    }
  }
}
</style>
