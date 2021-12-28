import { Component, Mixins, Watch } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { LOGIN_SESSION_EVENT, VUE_EVENT_BUS, WALLET_EVENT } from '@/event'
import { ErrorHandlerMixin } from '../errorHandlerMixin'
import { connectChain } from '@/utils/chain'
import { SUPPORTED_WALLET } from '@/business-components/wallet/wallet-connector'

const wallet = namespace('wallet')

@Component
export class WalletSingletonMixin extends Mixins(ErrorHandlerMixin) {
  @wallet.Mutation('clearNativeTokenBalance') walletClearNativeTokenBalance!: () => void
  @wallet.Action('updateNativeTokenBalance') walletUpdateNativeTokenBalance!: () => Promise<void>
  @wallet.Getter('address') walletAddress!: string
  @wallet.State('walletType') walletType!: SUPPORTED_WALLET | null

  protected loadTimer = 0

  mounted() {
    this.loadTimer = window.setInterval(async () => {
      await this.callChainReadFunc(async () => {
        await this.walletUpdateNativeTokenBalance()
      })
    }, 10000)
    VUE_EVENT_BUS.on(WALLET_EVENT.AddressChanged, this.walletRefreshNativeTokenBalance)
    VUE_EVENT_BUS.on(LOGIN_SESSION_EVENT.NetworkChanged, this.onNetworkChange)
  }

  beforeDestroy() {
    window.clearInterval(this.loadTimer)
    VUE_EVENT_BUS.off(WALLET_EVENT.AddressChanged, this.walletRefreshNativeTokenBalance)
    VUE_EVENT_BUS.off(LOGIN_SESSION_EVENT.NetworkChanged, this.onNetworkChange)
  }

  async walletRefreshNativeTokenBalance() {
    await this.callChainReadFunc(async () => {
      this.walletClearNativeTokenBalance()
      return await this.walletUpdateNativeTokenBalance()
    })
  }

  onNetworkChange() {
    connectChain(this.networkId, this.walletType)
  }

  @Watch('walletAddress')
  onWalletAddressChanged(newAddress: string, oldAddress: string) {
    if (oldAddress) {
      window.location.reload()
    }
  }
}
