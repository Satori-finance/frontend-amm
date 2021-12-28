import { Component, Prop, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { SUPPORTED_WALLET } from '@/business-components/wallet/wallet-connector'
import { L1_NETWORK_ID, NETWORK_ID_NAME, NETWORK_OPTIONS, SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/constants'
import { supportChainAutoChange } from '@/utils/chain'
import { getMetaProperty } from '@/utils'
import { chainConfigs } from '@/config/chain'
import { CHAIN_EVENT, VUE_EVENT_BUS } from '@/event'

const wallet = namespace('wallet')

@Component
export class SupportNetworkMixin extends Vue {
  @Prop({ default: false }) manual!: boolean
  @Prop({ default: null }) customToNetwork!: SUPPORTED_NETWORK_ID | null

  @wallet.Getter('isL1') isL1!: boolean
  @wallet.Getter('isL2') isL2!: boolean
  @wallet.Getter('networkId') networkId!: number
  @wallet.Getter('isWrongNetwork') isWrongNetwork!: boolean
  @wallet.State('walletType') walletType!: SUPPORTED_WALLET | null

  get toNetwork() {
    let network = null
    if (this.manual) {
      network = this.customToNetwork
    } else if (this.networkSuggestion.suggestToL1) {
      network = L1_NETWORK_ID
    } else if (this.networkSuggestion.suggestToL2) {
      network = TARGET_NETWORK_ID
    }
    return network === this.networkId ? null : network
  }

  get networkSupported() {
    return this.toNetwork && supportChainAutoChange(this.toNetwork)
  }

  get routeTargetNetwork() {
    return getMetaProperty<string>(this.$route, 'targetNetwork')
  }

  get networkSuggestion() {
    let suggestion = {
      suggestToL1: false,
      suggestToL2: false,
    }
    switch (this.routeTargetNetwork) {
      case 'none':
        break
      case null:
      case 'L2':
        if (!this.isL2) {
          suggestion = {
            suggestToL1: false,
            suggestToL2: true,
          }
        }
        break
      case 'L1':
        if (!this.isL1) {
          suggestion = {
            suggestToL1: true,
            suggestToL2: false,
          }
        }
        break
      default:
        if (!this.isL2 && !this.isL1) {
          suggestion = {
            suggestToL1: false,
            suggestToL2: true,
          }
        }
        break
    }

    return suggestion
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

  connectChain() {
    VUE_EVENT_BUS.emit(CHAIN_EVENT.WRONG_CHAIN)
  }
}
