<template>
  <div class="login-page">
    <el-alert v-if="topError" class="error-box" type="error" :closable="false" center>{{ topError.message }}
    </el-alert>
    <div class="left">
      <img src="~@/assets/img/login-bg.png" alt="">
    </div>
    <div class="right">
      <img class="logo" src="~@/assets/img/mcdex_logo.png" alt="">
      <h1 class="title">{{ $t('login.title') }}</h1>
      <h3 class="subtitle" v-html="$t('login.subtitle')"></h3>
      <el-button class="login-btn" :disabled="isWrongNetwork" type="blue" @click="login" :loading="loading">
        {{ address ? $t('login.login') : $t('connectWalletButton.connectWallet') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { VUE_EVENT_BUS, WALLET_EVENT } from '@/event'
import { AuthMixin } from '@/mixins'
import { NETWORK_ID_NAME, TARGET_NETWORK_ID } from '@/constants'

const wallet = namespace('wallet')

@Component
export default class Login extends Mixins(AuthMixin) {
  get topError() {
    return this.isWrongNetwork
      ? new Error(
          this.$t('globalNotification.wrongNetwork', {
            networkName: NETWORK_ID_NAME[TARGET_NETWORK_ID],
          }).toString()
        )
      : this.error
  }

  async login() {
    if (this.address) {
      await this.handleAuth()
    } else {
      VUE_EVENT_BUS.emit(WALLET_EVENT.ShowConnectWallet)
    }
  }

  getUrlKey(name: string, url: string) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(url) || [, ''])[1]?.replace(/\+/g, '%20') || '') || null
  }

  @Watch('jwt', { immediate: true })
  onJwtChange() {
    if (this.jwt && this.isValidateFunc()) {
      const url = this.getUrlKey('redirect', window.location.href)
      if (url) {
        window.location.href = url
      } else {
        window.location.href = 'https://mcdex.io'
      }
    }
  }
}
</script>

<style scoped lang="scss">
.login-page {
  background: linear-gradient(180deg, #110544 0%, #28176D 100%);
  height: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  .error-box {
    position: fixed;
    top: 0;
    left: 0;
  }

  .right {
    margin-left: 73px;

    .logo {
      width: 220px;
      margin-bottom: 50px;
    }

    .title {
      font-size: 36px;
      line-height: 41px;
      font-weight: bold;
      margin-bottom: 30px;
    }

    .subtitle {
      font-size: 24px;
      line-height: 28px;
      font-weight: bold;
      margin-bottom: 40px;
    }

    .login-btn {
      min-width: 200px;
    }
  }
}
</style>
