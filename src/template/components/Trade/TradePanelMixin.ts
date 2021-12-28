import { Component, Mixins, Vue, Watch } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { ACCOUNT_EVENT, PLACE_ORDER_EVENT, VUE_EVENT_BUS } from '@/event'
import { AccountWithSelectedPerpetualMixin } from '@/mixins'

const wallet = namespace('wallet')
const interactiveState = namespace('interactiveState')

@Component
export default class TradePanelMixin extends Mixins(AccountWithSelectedPerpetualMixin) {
  @wallet.Getter('address') userAddress !: string | null
  @wallet.Getter('isWrongNetwork') isWrongNetwork!: boolean
  @wallet.Getter('isConnectedWallet') isConnectedWallet!: boolean
  @interactiveState.State('tradePanelIsLoading') tradePanelIsLoading !: boolean
  @interactiveState.Mutation('updateTradePanelState') updateTradePanelState !: Function

  private loadingAccountDetails: boolean = false
  private refreshUserData: boolean = this.tradePanelIsLoading

  mounted() {
    VUE_EVENT_BUS.on(ACCOUNT_EVENT.REFRESH_USER_DATA, this.onRefreshUserData, this.onRefreshUserDataSuccessful)
    VUE_EVENT_BUS.on(PLACE_ORDER_EVENT.LoadAccountOrderDetails, this.onLoadingAccountDetails, this.onLoadingAccountDetailsSuccessful)
  }

  destroyed() {
    VUE_EVENT_BUS.off(ACCOUNT_EVENT.REFRESH_USER_DATA, this.onRefreshUserData)
    VUE_EVENT_BUS.off(PLACE_ORDER_EVENT.LoadAccountOrderDetails, this.onLoadingAccountDetails)
  }

  get isSkipLoading() {
    return !this.isConnectedWallet || this.isWrongNetwork || !this.selectedPerpetualID || this.selectedPerpetualID === ''
  }

  onRefreshUserData() {
    this.refreshUserData = true
  }

  onRefreshUserDataSuccessful() {
    this.refreshUserData = false
  }

  onLoadingAccountDetails() {
    this.loadingAccountDetails = true
  }

  onLoadingAccountDetailsSuccessful() {
    this.loadingAccountDetails = false
  }

  @Watch('selectedPerpetualStorage')
  @Watch('selectedAccountDetails')
  @Watch('loadingAccountDetails')
  @Watch('isSkipLoading', { immediate: true })
  onDataLoadingCompleted() {
    if (this.isSkipLoading) {
      this.updateTradePanelState(false)
      return
    }
    if (this.selectedPerpetualStorage && this.selectedAccountDetails && !this.loadingAccountDetails && !this.refreshUserData) {
      this.updateTradePanelState(false)
    } else {
      this.updateTradePanelState(true)
    }
  }
}
