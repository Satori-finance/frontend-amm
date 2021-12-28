<template>
  <transition name="fade">
    <el-dialog
      custom-class="is-small is-round wallet-connect-dialog"
      append-to-body
      top="0"
      :visible.sync="currentVisible"
      :title="title">
      <div class="hint mc-font-h4">{{ $t('connectWallet.confirmConnection2') }}</div>
      <div class="qr-box">
        <div class="svg-container" v-html="qr"></div>
      </div>
    </el-dialog>
  </transition>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import {
  connectImTokenWallet,
  connectTrustWallet,
  connectWCWallet,
  normalizeWalletError,
  SUPPORTED_WALLET,
  Wallet,
} from '@/business-components/wallet/wallet-connector'
import { imageSync } from 'qr-image'

import { namespace } from 'vuex-class'

const wallet = namespace('wallet')

@Component
export default class WalletConnectDialog extends Vue {
  @wallet.Mutation('setWallet') setWallet!: (payload: { wallet: Wallet | null, type: SUPPORTED_WALLET | null }) => void
  @Prop({ default: true }) visible!: boolean
  @Prop({ default: SUPPORTED_WALLET.WalletConnect }) type!: SUPPORTED_WALLET

  private qr: string | Buffer = ''

  get currentVisible() {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
  }

  get title() {
    return SUPPORTED_WALLET[this.type]
  }

  //IQRCodeModal
  open(uri: string, cb: Function): void {
    this.qr = imageSync(uri, { type: 'svg' })
  }

  //IQRCodeModal
  close(): void {
    this.$emit('update:visible', false)
  }

  private async connect() {
    try {
      this.qr = ''
      let wallet
      switch (this.type) {
        case SUPPORTED_WALLET.imToken:
          wallet = await connectImTokenWallet(this)
          break
        case SUPPORTED_WALLET['Trust Wallet']:
          wallet = await connectTrustWallet(this)
          break
        default:
          wallet = await connectWCWallet(this)
          break
      }
      this.setWallet({ wallet, type: this.type })
    } catch (reason) {
      console.warn('connect wallet error:', reason)
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

  @Watch('visible')
  onShow() {
    if (this.visible) {
      this.connect()
    }
  }
}
</script>

<style lang="scss">
.wallet-connect-dialog {
  width: 400px;
}
</style>

<style lang="scss" scoped>

.hint {
  margin-top: 12px;
  font-size: 16px;
  line-height: 22px;
  text-align: center;
  word-break: break-word;
}

.qr-box {
  width: 310px;
  height: 310px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin: 16px auto;
  border-radius: var(--mc-border-radius-l);

  .svg-container {
    width: 280px;
    height: 280px;
  }
}
</style>

<style scoped lang="scss">
.satori-fantasy {
  .hint {
    color: var(--mc-text-color);
  }

  .qr-box {
    background-color: white;
  }
}
</style>
