<template>
  <div class="select-wallet-container">

    <ul class="wallet-list">
      <li
        class="wallet-list-item"
        :class="{connected: item.connectedIsMe}"
        v-for="item in supportedWallet"
        :key="item.id"
        @click="$emit('input', item.id)"
      >
        <div class="left">
          <span class="is-connected" v-if="item.connectedIsMe"></span>
          <span class="wallet-name">{{ item.name }}</span>
        </div>
        <img class="icon" :src="item.icon" alt="">
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { SUPPORTED_WALLET, WALLET_ICON } from './wallet-connector'

const wallet = namespace('wallet')

@Component
export default class SelectWallet extends Vue {
  @wallet.State('walletType') walletType!: SUPPORTED_WALLET | null

  get supportedWallet() {
    return [
      {
        id: SUPPORTED_WALLET.MetaMask,
        name: SUPPORTED_WALLET[SUPPORTED_WALLET.MetaMask],
        icon: WALLET_ICON[SUPPORTED_WALLET.MetaMask], //require(walletIconURL(SUPPORTED_WALLET.MetaMask)),
        hint: this.$t('connectWallet.walletHint.metamask'),
        connectedIsMe: this.walletType && this.walletType === SUPPORTED_WALLET.MetaMask,
      },
      {
        id: SUPPORTED_WALLET.WalletConnect,
        name: SUPPORTED_WALLET[SUPPORTED_WALLET.WalletConnect],
        icon: WALLET_ICON[SUPPORTED_WALLET.WalletConnect],
        hint: this.$t('connectWallet.walletHint.wc'),
        connectedIsMe: this.walletType && this.walletType === SUPPORTED_WALLET.WalletConnect,
      },
      {
        id: SUPPORTED_WALLET.WalletLink,
        name: SUPPORTED_WALLET[SUPPORTED_WALLET.WalletLink],
        icon: WALLET_ICON[SUPPORTED_WALLET.WalletLink],
        hint: this.$t('connectWallet.walletHint.wl'),
        connectedIsMe: this.walletType && this.walletType === SUPPORTED_WALLET.WalletLink,
      },
      {
        id: SUPPORTED_WALLET['Trust Wallet'],
        name: SUPPORTED_WALLET[SUPPORTED_WALLET['Trust Wallet']],
        icon: WALLET_ICON[SUPPORTED_WALLET['Trust Wallet']],
        hint: '',
        connectedIsMe: this.walletType && this.walletType === SUPPORTED_WALLET['Trust Wallet'],
      },
      {
        id: SUPPORTED_WALLET['Coin98 Wallet'],
        name: SUPPORTED_WALLET[SUPPORTED_WALLET['Coin98 Wallet']],
        icon: WALLET_ICON[SUPPORTED_WALLET['Coin98 Wallet']],
        hint: '',
        connectedIsMe: this.walletType && this.walletType === SUPPORTED_WALLET['Coin98 Wallet'],
      },
      {
        id: SUPPORTED_WALLET.imToken,
        name: SUPPORTED_WALLET[SUPPORTED_WALLET.imToken],
        icon: WALLET_ICON[SUPPORTED_WALLET.imToken],
        hint: '',
        connectedIsMe: this.walletType && this.walletType === SUPPORTED_WALLET.imToken,
      },
    ]
  }
}
</script>

<style lang="scss" scoped>
.select-wallet-container {

  .wallet-list-item {
    height: 56px;
    margin-top: 12px;
    padding: 0 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: background 0.1s ease;
    border-radius: var(--mc-border-radius-l);

    .icon {
      height: 32px;
      width: 32px;
    }

    .wallet-name {
      font-size: 16px;
    }

    .left {
      display: flex;
      align-items: center;
    }

    .is-connected {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--mc-color-success);
      position: relative;
      margin-right: 8px;
    }
  }
}
</style>

<style lang="scss" scoped>
.dex-theme-dark {
  .select-wallet-container {
    .wallet-list-item {
      background: #ffffff;
      color: #333333;

      &:not(.unaleb-select):hover {
        background: var(--mc-icon-color-dark);
        color: var(--mc-text-color-white);
      }
    }
  }
}
</style>

<style lang="scss" scoped>
.satori-fantasy {
  .select-wallet-container {
    .wallet-list-item {
      background: var(--mc-background-color);
      color: var(--mc-text-color-white);

      &:hover, &.connected {
        background: var(--mc-icon-color-dark);
      }
    }
  }
}
</style>
