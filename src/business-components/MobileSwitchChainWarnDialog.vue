<template>
  <el-dialog
    append-to-body
    top="0"
    custom-class="is-round is-small mobile-switch-chain-warn-dialog"
    :close-on-click-modal="false"
    :title="$t('mobileSwitchChainDialog.title').toString()"
    :visible.sync="currentVisible"
    @closed="dialogClosed"
  >
    <div class="content-box">
      {{ $t('mobileSwitchChainDialog.content', {chainName: targetChainName}).toString() }}
    </div>
    <div class="button-box">
      <el-button size="large" @click="onDoneEvent" class="done-button">{{ $t('base.done') }}</el-button>
    </div>
  </el-dialog>
</template>

<script lang='ts'>
import { Vue, Component, Prop } from 'vue-property-decorator'
import { chainConfigs, currentChainConfig } from '@/config/chain'

@Component
export default class MobileSwitchChainWarnDialog extends Vue {
  @Prop({ default: true }) visible!: boolean
  @Prop({ default: 0 }) targetChainId !: number

  get currentVisible() {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
  }

  get selectedTargetChainId() {
    return this.targetChainId
  }

  set selectedTargetChainId(id: number) {
    this.$emit('update:targetChainId', id)
  }

  get targetChainName(): string {
    if (this.targetChainId === 0) {
      return currentChainConfig.chainName
    }
    return chainConfigs[this.targetChainId].chainName
  }

  dialogClosed() {
    this.selectedTargetChainId = 0
  }

  onDoneEvent() {
    this.$emit('changeChainFunc', this.targetChainId)
    this.currentVisible = false
  }
}
</script>

<style lang='scss' scoped>
.mobile-switch-chain-warn-dialog {
  .content-box {
    margin-top: 12px;
    font-size: 14px;
    color: var(--mc-text-color-white);
    line-height: 20px;
    word-break: keep-all;
  }

  .button-box {
    margin-top: 24px;

    .el-button {
      height: 56px;
      width: 100%;
      border-radius: var(--mc-border-radius-m);
    }
  }
}
</style>
