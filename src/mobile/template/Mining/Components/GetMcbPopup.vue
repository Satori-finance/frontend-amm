<template>
  <div class="get-mcb-popup">
    <van-popup
      v-model="currentVisible"
      closeable
      position="bottom"
      class="safe-area-inset-bottom"
      round
      safe-area-inset-bottom
    >
      <div class="popup-header">{{ $t('tradingMining.getMcbDialog.title') }}</div>
      <div class="popup-container">
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
    </van-popup>
  </div>
</template>

<script lang='ts'>
import { Component, Prop, Vue } from 'vue-property-decorator'
import { chainConfigs } from '@/config/chain'
import { SUPPORTED_NETWORK_ID } from '@/const'

@Component
export default class GetMcbPopup extends Vue {
  @Prop({ default: false }) visible !: boolean

  private SUPPORTED_NETWORK_ID = SUPPORTED_NETWORK_ID

  get currentVisible(): boolean {
    return this.visible
  }

  set currentVisible(v: boolean) {
    this.$emit('update:visible', v)
  }

  get chainConfigs() {
    return chainConfigs
  }
}
</script>

<style lang="scss" scoped>
.get-mcb-popup {
  ::v-deep {
    .van-popup {
      height: 378px;
      padding: 16px;
      background-color: var(--mc-background-color-dark);
    }
  }

  .popup-container {
    margin-top: 28px;

    .card-item {
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
