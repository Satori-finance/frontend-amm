<template>
  <div class="connect-wallet-mask" :class="{'show-mask': showMask}">
    <div class="content">
      <div class="title mc-font-p13">{{ $t('connectWalletButton.connectWalletTitle') }}</div>
      <el-button round size="medium" type="primary" @click="showConnectWalletDialog">{{ $t('connectWalletButton.header') }}</el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { VUE_EVENT_BUS, WALLET_EVENT } from '@/event'

@Component
export default class ConnectWallet extends Vue {
  @Prop({ default: true }) showMask!: boolean

  private showConnectWalletDialog() {
    VUE_EVENT_BUS.emit(WALLET_EVENT.ShowConnectWallet)
  }
}
</script>

<style lang="scss" scoped>
.connect-wallet-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  pointer-events: none;

  &.show-mask {
    background: rgba(10, 16, 36, 0.7);
    backdrop-filter: blur(4px);
    pointer-events: visible;
  }

  .content {
    text-align: center;
    pointer-events: visible;

    .title {
      color: var(--mc-text-color);
      margin-bottom: 20px;
    }
  }

  .el-button {
    width: 150px;
  }
}
</style>
