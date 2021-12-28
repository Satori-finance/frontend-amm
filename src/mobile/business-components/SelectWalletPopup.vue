<template>
  <van-popup
    class="select-wallet-popup safe-area-inset-bottom"
    round closeable v-model="show"
    position="bottom"
    safe-area-inset-bottom
    get-container="body">
    <div class="title">{{ $t('connectWallet.selectWallet') }}</div>
    <div class="wallet-list">
      <div class="wallet" :class="{'is-connected': item.connectedIsMe}" v-for="item in supportedWallet" :key="item.id" @click="onSelectWallet(item.id)">
        <span class="label">
          <span class="connected-flag" v-if="item.connectedIsMe"></span>
          <span>{{ item.name }}</span>
        </span>

        <img class="icon" :src="item.icon" alt="">
      </div>
    </div>
  </van-popup>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { VUE_EVENT_BUS } from '@/event'
import { COMMON_EVENT } from '@/mobile/event'
import { namespace } from 'vuex-class'
import { SUPPORTED_WALLET, WALLET_ICON } from '@/business-components/wallet/wallet-connector'

const wallet = namespace('wallet')

interface Wallet {
  id: SUPPORTED_WALLET
  name: string
  connectedIsMe: boolean
  icon: string
}

@Component
export default class SelectWalletPopup extends Vue {
  @wallet.State('walletType') walletType!: SUPPORTED_WALLET | null
  @wallet.Mutation('setWallet') setWallet!: (payload: { wallet: Wallet | null, type: SUPPORTED_WALLET | null }) => void
  @wallet.Action('connectWallet') connectWallet!: (type: SUPPORTED_WALLET) => Promise<void>

  show = false

  get supportedWallet(): Wallet[] {
    return [
      {
        id: SUPPORTED_WALLET.WalletConnect,
        name: SUPPORTED_WALLET[SUPPORTED_WALLET.WalletConnect],
        icon: WALLET_ICON[SUPPORTED_WALLET.WalletConnect],
        connectedIsMe: !!this.walletType && this.walletType === SUPPORTED_WALLET.WalletConnect,
      },
      {
        id: SUPPORTED_WALLET.WalletLink,
        name: SUPPORTED_WALLET[SUPPORTED_WALLET.WalletLink],
        icon: WALLET_ICON[SUPPORTED_WALLET.WalletLink],
        connectedIsMe: !!this.walletType && this.walletType === SUPPORTED_WALLET.WalletLink,
      },
      {
        id: SUPPORTED_WALLET['Trust Wallet'],
        name: SUPPORTED_WALLET[SUPPORTED_WALLET['Trust Wallet']],
        icon: WALLET_ICON[SUPPORTED_WALLET['Trust Wallet']],
        connectedIsMe: !!this.walletType && this.walletType === SUPPORTED_WALLET['Trust Wallet'],
      },
      {
        id: SUPPORTED_WALLET.imToken,
        name: SUPPORTED_WALLET[SUPPORTED_WALLET.imToken],
        icon: WALLET_ICON[SUPPORTED_WALLET.imToken],
        connectedIsMe: !!this.walletType && this.walletType === SUPPORTED_WALLET.imToken,
      },
    ]
  }

  mounted() {
    VUE_EVENT_BUS.on(COMMON_EVENT.SHOW_SELECT_WALLET_POPUP, this.showPopup)
  }

  destroyed() {
    VUE_EVENT_BUS.off(COMMON_EVENT.SHOW_SELECT_WALLET_POPUP, this.showPopup)
  }

  showPopup() {
    this.show = true
  }

  private onSelectWallet(walletType: SUPPORTED_WALLET) {
    if (this.walletType === walletType) {
      return
    }
    this.connectWallet(walletType)
  }
}
</script>

<style lang="scss" scoped>
.select-wallet-popup {

  .title {
    padding: 16px;
    font-size: 18px;
    line-height: 20px;
  }

  .wallet-list {
    padding: 16px;

    .wallet {
      border: 1px solid var(--mc-border-color);
      background-color: var(--mc-background-color);
      font-size: 16px;
      line-height: 18px;
      padding: 13px 16px;
      margin-bottom: 12px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;

      &:last-of-type {
        margin-bottom: 0;
      }

      &.is-connected {
        background-color: var(--mc-background-color-light);
      }

      .label {
        display: flex;
        align-items: center;

        .connected-flag {
          height: 8px;
          width: 8px;
          border-radius: 50%;
          background-color: var(--mc-color-success);
          margin-right: 8px;
        }
      }

      .icon {
        height: 32px;
        width: 32px;
      }
    }
  }
}
</style>
