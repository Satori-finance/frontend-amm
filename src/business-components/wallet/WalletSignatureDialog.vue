<template>
  <el-dialog
    class="wallet-signature-dialog"
    custom-class="is-round"
    append-to-body
    top="0"
    :visible.sync="visible"
    :title="$t('connectWallet.walletSignature')">
    <div class="body-container">
      <div class="message" :class="{pending: status==='pending', success: status==='success', error: status==='error'}">
        <span class="icon-box">
          <img v-if="status==='pending'" class="fantasy-loading" src="@/assets/img/satori-fantasy/loading.svg" alt="">
          <img v-if="status==='success'" class="fantasy-success" src="@/assets/img/satori-fantasy/success.svg" alt="">
          <img v-if="status==='error'" class="fantasy-fail" src="@/assets/img/satori-fantasy/failed.svg" alt="">
        </span>
        <div class="prompt">
          <template v-if="status==='pending'">
            {{ $t('connectWallet.requestSignaturePrompt') }}
          </template>
          <template v-if="status==='success'">
            {{ $t('connectWallet.authSuccess') }}
          </template>
          <template v-if="status==='error'">
            <span>{{ $t('connectWallet.authFailed') }}</span>
            <el-button class="retry-btn" type="primary" plain size="mini">{{ $t('retry') }}</el-button>
          </template>
        </div>
      </div>
      <div class="wallet-info">
        <div class="address-info">
          <div class="wallet-name">{{ walletName }}</div>
          <div class="address">{{ address }}</div>
        </div>
        <div class="icon">
          <svg class="svg-icon" aria-hidden="true">
            <use :xlink:href="`#icon-${walletIcon}`"></use>
          </svg>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { SUPPORTED_WALLET } from '@/business-components/wallet/wallet-connector'
import { VUE_EVENT_BUS, AUTH_EVENT } from '@/event'
import { AuthMixin } from '@/mixins'

const wallet = namespace('wallet')
const auth = namespace('auth')

@Component
export default class WalletSignatureDialog extends Mixins(AuthMixin) {
  @wallet.State('walletType') walletType!: SUPPORTED_WALLET | null

  get walletIcon() {
    let icon = 'wallet-metamask'
    switch (this.walletType) {
      case SUPPORTED_WALLET.WalletConnect:
        icon = 'wallet-connect'
        break
      case SUPPORTED_WALLET.WalletLink:
        icon = 'wallet-link'
        break
    }
    return icon
  }

  get walletName() {
    let name = 'MetaMask'
    switch (this.walletType) {
      case SUPPORTED_WALLET.WalletConnect:
        name = 'Wallet Connect'
        break
      case SUPPORTED_WALLET.WalletLink:
        name = 'Wallet Link'
        break
    }
    return name
  }

  mounted() {
    VUE_EVENT_BUS.handle(AUTH_EVENT.AUTH, this.handleAuth)
  }

  destroyed() {
    VUE_EVENT_BUS.off(AUTH_EVENT.AUTH, this.handleAuth)
  }
}
</script>

<style lang="scss" scoped>
@import "~@mcdex/style/common/var";

.wallet-signature-dialog {
  ::v-deep .el-dialog {
    width: 400px;
    height: auto;
    min-height: 0;
  }

  .body-container {
    .message {
      display: flex;
      align-items: center;
      padding: 1px;
      position: relative;
      border-radius: var(--mc-border-radius-l);
      height: 56px;
      margin-top: 12px;

      &:before {
        content: ' ';
        position: absolute;
        pointer-events: none;
        height: calc(100% - 2px);
        width: calc(100% - 2px);
        background-color: var(--mc-background-color-dark);
        z-index: 0;
        border-radius: var(--mc-border-radius-l);
      }

      .icon-box {
        height: 24px;
        width: 24px;
        display: inline-block;
        border-radius: 50%;
        text-align: center;
        z-index: 1;
        margin: 0 16px;
      }

      .prompt {
        flex: 1;
        z-index: 1;
        color: var(--mc-text-color-white);
        font-size: 14px;
        line-height: 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-right: 16px;
      }

      &.pending {
        background: var(--mc-color-primary-gradient);

        .fantasy-loading {
          animation: rotating 2s linear infinite;
        }
      }

      &.success {
        background: linear-gradient(90deg, #0EB195 0%, #11CCAB 100%);
      }

      &.error {
        background: linear-gradient(90deg, #EF4751 0%, #F0455A 100%);
      }

      @keyframes rotating {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(1turn);
        }
      }
    }

    .wallet-info {
      margin-top: 12px;
      border-radius: var(--mc-border-radius-l);
      border: 1px solid var(--mc-border-color);
      padding: 16px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: space-between;

      .icon {
        height: 28px;
        width: 28px;
        display: flex;
        align-items: center;
        justify-content: center;

        .svg-icon {
          height: 28px;
          width: 28px;
        }
      }

      .address-info {
        color: var(--mc-text-color-white);

        .address {
          font-size: 12px;
          line-height: 16px;
          margin-top: 4px;
        }

        .wallet-name {
          font-size: 16px;
          line-height: 24px;
        }
      }
    }
  }

  .retry-btn {
    height: 24px;
    padding: 4px 8px;
    border-radius: var(--mc-border-radius-m);

    &:hover {
      -webkit-filter: unset !important;
      filter: unset !important;
    }
  }
}
</style>
