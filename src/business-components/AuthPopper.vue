<template>
  <div class="auth-popper" v-if="show">
    <div class="auth-popper-container">
      <div class="close-icon" @click="show = false"><i class="el-icon-close"></i></div>
      <div class="title mc-font-h4">{{ $t('base.authorize') }}</div>
      <div class="content mc-font-p16">
        {{ $t('authorizePopper.hint') }}
      </div>
      <el-button round size="medium" type="primary" @click="showAuth()">{{ $t('base.authorize') }}</el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { AUTH_EVENT, VUE_EVENT_BUS } from '@/event'
import { namespace } from 'vuex-class'

const auth = namespace('auth')
const wallet = namespace('wallet')

@Component
export default class AuthPopper extends Vue {
  @auth.Mutation('clearAuthData') clearAuthData!: (params: { address: string }) => void
  @wallet.Getter('address') address!: string | null

  private show = false
  private emptyFunc = () => {
  }

  mounted() {
    VUE_EVENT_BUS.on(AUTH_EVENT.AUTH_ERROR, this.showPopper)
    VUE_EVENT_BUS.on(AUTH_EVENT.AUTH, this.emptyFunc, this.closePopper)
  }

  destroyed() {
    VUE_EVENT_BUS.off(AUTH_EVENT.AUTH_ERROR, this.showPopper)
    // VUE_EVENT_BUS.off(AUTH_EVENT.AUTH, this.emptyFunc, this.closePopper)
    VUE_EVENT_BUS.off(AUTH_EVENT.AUTH, this.emptyFunc)
  }

  private showPopper() {
    if (this.address) {
      this.clearAuthData({ address: this.address })
    }
    this.show = true
  }

  private closePopper() {
    this.show = false
  }

  private showAuth() {
    VUE_EVENT_BUS.emit(AUTH_EVENT.AUTH)
  }
}
</script>

<style lang="scss" scoped>
@import "~@mcdex/style/common/fantasy-var";
.auth-popper {
  position: fixed;
  bottom: 50px;
  right: 24px;
  width: 360px;
  background: var(--mc-color-primary-gradient);
  border-radius: var(--mc-border-radius-l);
  z-index: var(--index-top);

  .auth-popper-container {
    height: calc(100% - 1px);
    width: calc(100% - 2px);
    background: var(--mc-background-color-darkest);
    border-radius: var(--mc-border-radius-l);
    margin: 1px;
    padding: 20px;
  }

  .close-icon {
    position: absolute;
    top: 12px;
    right: 15px;
    height: 24px;
    width: 24px;
    font-weight: bold;
    font-size: 16px;
    color: rgba($--mc-text-color-white, 0.75);
    text-align: center;
    line-height: 24px;
    cursor: pointer;

    &:hover {
      color: var(--mc-text-color-white);
    }
  }

  .title {
    color: var(--mc-text-color-white);
    font-size: 16px;
  }

  .content {
    color: var(--mc-text-color);
    margin-top: 4px;
    margin-bottom: 15px;
    font-size: 14px;
  }

  .el-button {
    width: 100%;
    border-radius: var(--mc-border-radius-l);
  }
}
</style>
