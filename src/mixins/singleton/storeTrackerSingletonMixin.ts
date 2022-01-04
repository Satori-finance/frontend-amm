import { Component, Watch, Mixins } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { Directory, OrderStruct, PerpetualCombinedState } from '@/type'
import { Provider } from '@ethersproject/providers'
import _ from 'lodash'
import {
  ACCOUNT_EVENT,
  PERPETUAL_EVENT,
  PLACE_ORDER_EVENT,
  VUE_EVENT_BUS,
  WALLET_EVENT,
} from '@/event'
import { PERP_SYMBOL_KEY, TARGET_NETWORK_ID } from '@/const'
import { ErrorHandlerMixin } from '../errorHandlerMixin'
import { getPerpetualID, setLocalStorage } from '@/utils'
import { CHAIN_ID_SYMBOL_SERVICE_ADDRESS, SymbolServiceFactory } from '@mcdex/mai3.js'

const activePerpetuals = namespace('activePerpetuals')
const wallet = namespace('wallet')
const perpetual = namespace('perpetual')
const account = namespace('account')

/**
 * update active perpetuals on userAddress change
 */
@Component
export class StoreTrackerSingletonMixin extends Mixins(ErrorHandlerMixin) {
  @wallet.Getter('address') userAddress!: string
  @wallet.Getter('provider') provider!: Provider
  @activePerpetuals.Getter('activePerpetualIds') activePerpetualIds!: string[]
  @activePerpetuals.Mutation('reset') resetActivePerpetuals!: Function
  @activePerpetuals.Action('loadActivePerpetuals') loadActivePerpetuals!: Function
  @perpetual.Action('updatePerpetual') updatePerpetual!: (perpetualID: string) => Promise<void>
  @activePerpetuals.State('selectedPerpetualID') selectedPerpetualID!: string | null
  @activePerpetuals.Getter('trackedPerpetualIds') trackedPerpetualIds!: string[]
  @activePerpetuals.Mutation('updateSelectPerpetualID') updateSelectPerpetualID!: Function
  @perpetual.State('perpetuals') perpetuals!: Array<PerpetualCombinedState>
  @perpetual.State('symbolToPerpetualID') symbolToPerpetualID!: Directory<string>
  @account.Action('updateAccountStorage') updateAccountStorage!: (perpetualID: string) => Promise<void>
  @account.Action('updateAccountGasStorage') updateAccountGasStorage!: (perpetualID: string) => Promise<void>
  @account.Mutation('reset') resetAccount!: Function
  @account.Mutation('setLoadingUserData') setLoadingUserData!: (loading: boolean) => void

  private updatePerpetualsTimer = 0

  mounted() {
    this.updatePerpetualsTimer = window.setInterval(() => {
      this.updatePerpetuals(this.trackedPerpetualIds, [])
      this.updateAccountData(this.trackedPerpetualIds, [])
    }, 10000)
    VUE_EVENT_BUS.handle([ACCOUNT_EVENT.REFRESH_USER_DATA, WALLET_EVENT.NetworkChanged], this.refreshUserData)
    VUE_EVENT_BUS.on(PLACE_ORDER_EVENT.OrderFilled, this.onOrderFilled)

    VUE_EVENT_BUS.on(PERPETUAL_EVENT.PERPETUAL_CHANGE, this.onPerpetualChange)
  }

  destroyed() {
    VUE_EVENT_BUS.off([ACCOUNT_EVENT.REFRESH_USER_DATA, WALLET_EVENT.NetworkChanged], this.refreshUserData)
    VUE_EVENT_BUS.off(PLACE_ORDER_EVENT.OrderFilled, this.onOrderFilled)
    VUE_EVENT_BUS.off(PERPETUAL_EVENT.PERPETUAL_CHANGE, this.onPerpetualChange)
    window.clearInterval(this.updatePerpetualsTimer)
  }

  async onPerpetualChange(symbol: string) {
    if (!(/^[0-9]+$/.test(symbol))) {
      console.warn('[Invalid symbol]: ', symbol)
      return
    }
    await this.callChainReadFunc(async () => {
      let perpetualID: string | null | undefined = this.symbolToPerpetualID.get(symbol)
      if (!perpetualID) {
        const symbolServiceContract = SymbolServiceFactory.connect(CHAIN_ID_SYMBOL_SERVICE_ADDRESS[TARGET_NETWORK_ID], this.provider)
        const perpetual = await symbolServiceContract.getPerpetualUID(symbol)
        perpetualID = getPerpetualID(perpetual.liquidityPool.toLowerCase(), perpetual.perpetualIndex.toNumber())
      }
      if (perpetualID) { // TODO when null
        setLocalStorage(PERP_SYMBOL_KEY, symbol)
        this.updateSelectPerpetualID(perpetualID)

        if (this.provider) {
          await this.updatePerpetual(perpetualID)
        }
      }
    })
  }

  async refreshUserData() {
    // update old perpetuals and new perpetuals, cover closed position perpetual
    const oldTrackedPerpetualIds = new Array<string>().concat(this.trackedPerpetualIds) // fixed issue https://github.com/mcarloai/mcdex-fe/issues/1057
    this.setLoadingUserData(true)
    await this.callChainReadFunc(async () => {
      await this.loadActivePerpetuals()
      await this.updateAccountData(_.union(this.trackedPerpetualIds, oldTrackedPerpetualIds), [])
    })
    this.setLoadingUserData(false)
  }

  async onOrderFilled(order: OrderStruct) {
    await this.callChainReadFunc(() => {
      return this.callGraphApiFunc(() => {
        this.updateAccountStorage(`${order.liquidityPoolAddress}-${order.perpetualIndex}`.toLowerCase())
      })
    })
  }

  @Watch('userAddress', { immediate: true })
  async needResetActivePerpetuals() {
    this.resetActivePerpetuals()

    if (!this.userAddress) {
      return
    }
    await this.callChainReadFunc(async () => {
      this.loadActivePerpetuals() // never throw
    })
  }

  @Watch('trackedPerpetualIds', { immediate: true })
  async updatePerpetuals(newValue: string[], oldValue: string[]) {
    const diffIds = _.difference(newValue, oldValue)
    const updates = diffIds.map(perpetualID =>
      this.updatePerpetual(perpetualID),
    )
    await this.callChainReadFunc(async () => {
      await Promise.all(updates)
    })
  }

  @Watch('trackedPerpetualIds', { immediate: true })
  async onTrackedPerpetualIdsChange(newValue: string[], oldValue: string[]) {
    this.setLoadingUserData(true)
    await this.updateAccountData(newValue, oldValue)
    this.setLoadingUserData(false)
  }

  async updateAccountData(newValue: string[], oldValue: string[]) {
    if (!this.userAddress) {
      return
    }
    const diffIds = _.difference(newValue, oldValue)
    const updates = diffIds.map(perpetualID => {
      return Promise.all([
        this.callChainReadFunc(() => {
          return this.callGraphApiFunc(() => {
            this.updateAccountStorage(perpetualID)
          })
        }),
        this.callChainReadFunc(() => {
          return this.updateAccountGasStorage(perpetualID)
        })
      ])
    })
    await Promise.all(updates)
  }
}
