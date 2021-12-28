<template>
  <div>
    <SelectWalletDialog :visible.sync="isSelectWallet" @onSelectWallet="onSelectWallet"/>
    <WalletConnectDialog :visible.sync="isWalletConnect" :type="walletType"/>
  </div>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator'
import SelectWalletDialog from './SelectWalletDialog.vue'
import WalletConnectDialog from './WalletConnectDialog.vue'
import { normalizeWalletError, SUPPORTED_WALLET } from '@/business-components/wallet/wallet-connector'
import { namespace } from 'vuex-class'

const wallet = namespace('wallet')

enum DIALOG_TYPE {
  NONE = 0,
  SELECT = 1,
  HARDWARE = 2,
  WALLET_CONNECT = 3,
}

@Component({
  components: {
    SelectWalletDialog,
    WalletConnectDialog,
  },
})
export default class ConnectWalletDialog extends Vue {
  @wallet.Action('connectWallet') connectWallet!: (walletType: SUPPORTED_WALLET) => Promise<void>
  private walletType: SUPPORTED_WALLET = SUPPORTED_WALLET.InvalidType
  private currentDialog = DIALOG_TYPE.NONE

  get isWalletConnect() {
    return this.currentDialog === DIALOG_TYPE.WALLET_CONNECT
  }

  set isWalletConnect(val: boolean) {
    if (val) {
      this.currentDialog = DIALOG_TYPE.WALLET_CONNECT
    } else {
      this.currentDialog = DIALOG_TYPE.NONE
    }
  }

  get isSelectWallet() {
    return this.currentDialog === DIALOG_TYPE.SELECT
  }

  set isSelectWallet(val: boolean) {
    if (val) {
      this.currentDialog = DIALOG_TYPE.SELECT
    } else {
      this.currentDialog = DIALOG_TYPE.NONE
    }
  }

  show() {
    this.isSelectWallet = true
  }

  private onSelectWallet(walletType: SUPPORTED_WALLET) {
    this.walletType = walletType
    if (walletType === SUPPORTED_WALLET.WalletConnect || walletType === SUPPORTED_WALLET.imToken || walletType === SUPPORTED_WALLET['Trust Wallet']) {
      this.isWalletConnect = true
    } else {
      this.connect()
      if (walletType === SUPPORTED_WALLET.WalletLink) {
        this.currentDialog = DIALOG_TYPE.NONE
      }
    }
  }

  private async connect() {
    try {
      await this.connectWallet(this.walletType)
      this.currentDialog = DIALOG_TYPE.NONE
    } catch (reason) {
      console.warn('connect wallet error:', reason)
      if (reason.code === 4001) {
        return
      }
      const error = normalizeWalletError(reason)
      if (error) {
        this.$notify({
          type: 'error',
          title: this.$t(error.helpCaptionKey).toString(),
          message: this.$t(error.helpKey, { message: error.message }).toString(),
          position: 'bottom-right',
          customClass: 'is-error',
        })
      }
    }
  }
}
</script>
