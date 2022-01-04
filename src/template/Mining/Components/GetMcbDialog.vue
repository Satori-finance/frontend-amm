<template>
  <el-dialog
    @close="onCloseDialog"
    custom-class="is-small is-round get-mcb-dialog"
    append-to-body
    top="0"
    :visible.sync="currentVisible"
    :close-on-click-modal="false"
    :title="$t('tradingMining.getMcbDialog.title')">
    <div class="dialog-container">
      <div class="card-item">
        <div class="card-title">
          <img :src="chainConfigs[SUPPORTED_NETWORK_ID.ARB].icon" alt=""/>
          {{ chainConfigs[SUPPORTED_NETWORK_ID.ARB].chainName }}
        </div>
        <div class="card-content"><span v-html="$t('tradingMining.getMcbDialog.arb')"></span></div>
      </div>
      <div class="card-item">
        <div class="card-title">
          <img :src="chainConfigs[SUPPORTED_NETWORK_ID.BSC].icon" alt=""/>
          {{ chainConfigs[SUPPORTED_NETWORK_ID.BSC].chainName }}
        </div>
        <div class="card-content"><span v-html="$t('tradingMining.getMcbDialog.bsc')"></span></div>
      </div>
    </div>
  </el-dialog>
</template>

<script lang='ts'>
import { Component, Prop, Vue } from 'vue-property-decorator'
import { chainConfigs } from '@/config/chain'
import { SUPPORTED_NETWORK_ID } from '@/const'

@Component
export default class GetMcbDialog extends Vue {
  @Prop({ default: false, required: true }) visible !: boolean

  private SUPPORTED_NETWORK_ID = SUPPORTED_NETWORK_ID

  get currentVisible() {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
  }

  get chainConfigs() {
    return chainConfigs
  }

  onCloseDialog() {}
}
</script>

<style lang='scss' scoped>
.get-mcb-dialog {
  ::v-deep &.is-small {
    min-height: 312px;
    width: 400px;
  }

  .dialog-container {
    .card-item {
      height: 112px;
      width: 100%;
      background: var(--mc-background-color-darkest);
      border: 1px solid var(--mc-border-color);
      border-radius: var(--mc-border-radius-l);
      padding: 16px;
      margin-top: 16px;

      &:first-child {
        margin-top: 0;
      }

      .card-title {
        display: flex;
        align-items: center;

        img {
          height: 23px;
          width: 23px;
          margin-right: 4px;
        }
      }

      .card-content {
        margin-top: 16px;
        font-size: 14px;
        line-height: 20px;

        ::v-deep .link-text {
          color: var(--mc-color-primary);
        }
      }
    }
  }
}
</style>
