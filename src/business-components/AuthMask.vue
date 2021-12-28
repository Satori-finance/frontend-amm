<template>
  <div class="auth-mask" :class="{'show-mask': showMask}">
    <div class="content">
      <div class="title mc-font-p14">{{$t('connectWalletButton.authTitle')}}</div>
      <el-button size="medium" type="primary" :disabled='isWrongNetwork' @click="showAuth">{{ $t('connectWalletButton.auth') }}</el-button>
    </div>
  </div>
</template>

<script lang="ts">
import {Vue, Component, Prop} from 'vue-property-decorator'
import { AUTH_EVENT, VUE_EVENT_BUS, WALLET_EVENT } from '@/event'
import { namespace } from 'vuex-class'

const wallet = namespace('wallet')
@Component
export default class AuthMask extends Vue {
  @Prop({ default: true }) showMask!: boolean

  @wallet.Getter('isWrongNetwork') isWrongNetwork!: boolean
  private showAuth() {
    VUE_EVENT_BUS.emit(AUTH_EVENT.AUTH)
  }
}
</script>

<style lang="scss" scoped>
.auth-mask {
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

  .mc-font-p14 {
    line-height: 16px;
  }

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
      margin-bottom: 16px;
    }
  }

  .el-button {
    width: 99px;
    height: 32px;
    border-radius: var(--mc-border-radius-m);
    font-size: 12px;
    padding: 0 16px;
  }
}
</style>
