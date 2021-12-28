<template>
  <div class="wallet-viewer">
    <template v-if="isConnectedWallet">
      <div class="connected-container" @click="selectWallet">
        <img v-if="currentChainConfig.chainID === SUPPORTED_NETWORK_ID.BSC" :src="require('@/assets/img/BSC-m.svg')" alt=''>
        <img v-else-if='currentChainConfig.chainID === SUPPORTED_NETWORK_ID.ARB || currentChainConfig.chainID === SUPPORTED_NETWORK_ID.ARB_TESTNET'
             :src='require("@/assets/img/arbitrum-m.svg")' alt=''>
        <img v-else :src="currentChainConfig.icon" alt='' />
        <template v-if="isImToken || isTrustWallet">
          <div class="split"></div>
          <img v-if="isImToken" src="@/assets/img/wallet/imToken.svg" alt="">
          <img v-if="isTrustWallet" src="@/assets/img/wallet/TrustWallet.svg" alt="">
        </template>
        <span class="wallet-address">{{ walletAddress | ellipsisMiddle(isImToken || isTrustWallet ? 4 : undefined, isImToken || isTrustWallet ? 2 : undefined) }}</span>
      </div>
    </template>
    <template v-else>
      <div class="connect-wallet-container">
        <van-button class="primary medium round__medium" @click="connectWallet">
          {{ $t('connectWalletButton.header') }}
        </van-button>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { currentChainConfig } from '@/config/chain'
import { VUE_EVENT_BUS } from '@/event'
import { COMMON_EVENT } from '@/mobile/event'
import { InjectWallet, SUPPORTED_WALLET, Wallet } from '@/business-components/wallet/wallet-connector'
import { SUPPORTED_NETWORK_ID } from '@/constants'

const wallet = namespace('wallet')

@Component
export default class WalletViewer extends Vue {
  @wallet.Getter('isConnectedWallet') isConnectedWallet !: boolean
  @wallet.Getter('address') walletAddress !: string
  @wallet.State('walletType') walletType!: SUPPORTED_WALLET | null
  @wallet.State('wallet') wallet!: Wallet | null

  get currentChainConfig() {
    return currentChainConfig
  }

  get SUPPORTED_NETWORK_ID() {
    return SUPPORTED_NETWORK_ID
  }

  get isImToken() {
    return this.walletType === SUPPORTED_WALLET.imToken || (this.wallet?.type === SUPPORTED_WALLET.Injected && (this.wallet as InjectWallet).isImToken)
  }

  get isTrustWallet() {
    return this.walletType === SUPPORTED_WALLET['Trust Wallet'] || (this.wallet?.type === SUPPORTED_WALLET.Injected && (this.wallet as InjectWallet).isTrust)
  }

  connectWallet() {
    VUE_EVENT_BUS.emit(COMMON_EVENT.SHOW_SELECT_WALLET_POPUP)
  }

  private selectWallet() {
    if (this.walletAddress && this.walletType === SUPPORTED_WALLET.InvalidType) {
      return
    }
    VUE_EVENT_BUS.emit(COMMON_EVENT.SHOW_SELECT_WALLET_POPUP)
  }
}
</script>

<style lang="scss" scoped>
.wallet-viewer {
  .connected-container {
    display: flex;
    align-self: center;
    align-items: center;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 14px;
    line-height: 24px;
    color: var(--mc-text-color-white);
    background: var(--mc-background-color);

    img {
      width: 24px;
      height: 24px;
      margin-right: 8px;
    }

    .split {
      margin-right: 8px;
      width: 1px;
      background: var(--mc-background-color-light);
      height: 14px;
    }
  }

  .connect-wallet-container {
    .van-button {
      height: 32px;
      width: 119px;
      font-size: 14px;
      padding: 0;
    }
  }
}
</style>
