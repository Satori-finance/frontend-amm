<template>
  <div class="auth-mask" :class="{'show-mask': showMask}">
    <div class="content">
      <div class="title">{{ $t('connectWalletButton.authTitle') }}</div>
      <van-button class="primary" size="small" :disabled='isWrongNetwork' @click="handleAuth()">{{ $t('connectWalletButton.auth') }}</van-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator'
import { AuthMixin } from '@/mixins'
import { AUTH_EVENT, VUE_EVENT_BUS } from '@/event';

@Component
export default class AuthMask extends Mixins(AuthMixin) {
  @Prop({ default: true }) showMask!: boolean

  mounted() {
    VUE_EVENT_BUS.on(AUTH_EVENT.AUTH, this.auth)
  }

  destroyed() {
    VUE_EVENT_BUS.off(AUTH_EVENT.AUTH, this.auth)
  }
}
</script>

<style lang="scss" scoped>
.auth-mask {
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  pointer-events: none;
  padding: 52px 0;

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
      font-size: 14px;
      line-height: 20px;
    }

    .van-button {
      min-width: 99px;
      border-radius: 8px;
    }
  }
}
</style>
