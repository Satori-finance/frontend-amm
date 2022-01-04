import { Component, Vue } from 'vue-property-decorator'
import { SUPPORTED_WALLET } from '@/business-components/wallet/wallet-connector'
import { NETWORK_ID_NAME, NETWORK_OPTIONS, SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/const'
import { supportChainAutoChange, connectChain } from '@/utils/chain'
import { CHAIN_EVENT, VUE_EVENT_BUS } from '@/event'
import { namespace } from 'vuex-class'
import { chainConfigs } from '@/config/chain'

const wallet = namespace('wallet')

@Component
export default class WrongChainMixin extends Vue {
  @wallet.Getter('address') walletAddress!: string
  @wallet.Getter('networkId') networkId!: number
  @wallet.Getter('walletNetworkId') walletNetworkId!: number | null
  @wallet.State('walletType') walletType!: SUPPORTED_WALLET | null

  private targetNetworkId: SUPPORTED_NETWORK_ID | null = null

  get visible() {
    return this.targetNetworkId && this.targetNetworkId !== this.walletNetworkId
  }

  get networkName() {
    return this.targetNetworkId ? NETWORK_ID_NAME[this.targetNetworkId] : ''
  }

  get supportChange() {
    return this.targetNetworkId && this.walletType === SUPPORTED_WALLET.MetaMask ? supportChainAutoChange(this.targetNetworkId) : false
  }

  get networkOptions() {
    return NETWORK_OPTIONS.map(item => {
      return {
        chainId: item,
        name: NETWORK_ID_NAME[item],
        icon: chainConfigs[item].icon,
      }
    })
  }

  mounted() {
    VUE_EVENT_BUS.on(CHAIN_EVENT.WRONG_CHAIN, this.show)
  }

  destroyed() {
    VUE_EVENT_BUS.off(CHAIN_EVENT.WRONG_CHAIN, this.show)
  }

  show(targetNetworkId: SUPPORTED_NETWORK_ID) {
    this.targetNetworkId = targetNetworkId
  }

  close() {
    this.targetNetworkId = null
  }

  async changeNetwork(chainId: number) {
    try {
      await connectChain(chainId, this.walletType!)
      this.close()
    } catch (e) {
      // nothing to do
    }
  }
}
