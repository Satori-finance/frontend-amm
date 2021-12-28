import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { AccountStorageDirectoryItem, ButtonState, PerpetualCombinedState } from '@/type'
import { processStoreErrors } from '@/mixins'
import {
  _1,
  PerpetualStorage,
} from '@mcdex/mai3.js'
import { VUE_EVENT_BUS, WALLET_EVENT } from '@/event'
import { getPerpetualFromID, toBigNumber } from '@/utils'
import { ethers } from 'ethers'
import BigNumber from 'bignumber.js'

const wallet = namespace('wallet')
const perpetual = namespace('perpetual')
const account = namespace('account')

@Component
export class ChangeTargetLeverageMixin extends Vue {
  @wallet.Getter('address') address!: string | null
  @perpetual.Getter('getPerpetualFunc') getPerpetualFunc!: (perpetualId: string) => PerpetualCombinedState | null
  @perpetual.Action('updatePerpetual') updatePerpetual!: (perpetualId: string) => Promise<void>
  @account.Getter('accountStorageFunc') accountStorageFunc!: (perpetualId: string) => AccountStorageDirectoryItem | null
  @account.Action('updateAccountStorage') updateAccountStorage!: (perpetualId: string) => Promise<void>
  @account.Mutation('updateTargetLeverage') updateTargetLeverage!: (payload: { accountAddress: string, perpetualId: string, leverage: BigNumber }) => void
  @account.Getter('targetLeverageFunc') targetLeverageFunc!: (perpetualId: string) => BigNumber | null
  @wallet.Getter('signer') signer!: ethers.Signer | null
  @wallet.Getter('isConnectedWallet') isConnectedWallet !: boolean

  protected perpetualID: string | null = null
  protected leverage: string = '1'
  protected loading: boolean = false
  protected setting: boolean = false
  protected settingState: ButtonState = ''

  get title(): string {
    return this.$t('changeLeverageDialog.caption', {
      // symbol: this.perpetual ? this.perpetual.perpetualProperty.name : '',
      symbol: '',
    }).toString()
  }

  get perpetualParams() {
    return this.perpetualID ? getPerpetualFromID(this.perpetualID) : null
  }

  get perpetual(): PerpetualCombinedState | null {
    if (!this.getPerpetualFunc || !this.perpetualID) {
      return null
    }
    try {
      return this.getPerpetualFunc(this.perpetualID) || null
    } catch (e) {
      processStoreErrors(this, e)
      return null
    }
  }

  get accountStorage() {
    if (!this.accountStorageFunc || !this.perpetualID) {
      return null
    }
    try {
      return this.accountStorageFunc(this.perpetualID) || null
    } catch (e) {
      processStoreErrors(this, e)
      return null
    }
  }

  get perpetualStorage(): PerpetualStorage | null {
    return this.perpetual?.perpetualStorage || null
  }

  get maxLeverage() {
    if (!this.perpetualStorage) {
      return null
    }
    const imLeverage = _1.div(this.perpetualStorage.initialMarginRate).dp(0, BigNumber.ROUND_DOWN)
    return BigNumber.min(this.perpetualStorage.defaultTargetLeverage.maxValue, imLeverage)
  }

  get maxNormalizeLeverage() {
    if (this.maxLeverage) {
      return Math.floor(this.maxLeverage.toNumber())
    } else {
      return 0
    }
  }

  get minNormalizeLeverage() {
    return 1
  }

  get targetLeverage() {
    if (!this.address || !this.perpetualID || !this.perpetualStorage) {
      return null
    }
    return this.targetLeverageFunc(this.perpetualID)
  }

  get normalizeTargetLeverage() {
    if (this.targetLeverage) {
      return Math.floor(this.targetLeverage.toNumber())
    } else {
      return 0
    }
  }

  get disableChangeTargetLeverage() {
    return this.leverage === '' || (this.isConnectedWallet && parseInt(this.leverage) === this.targetLeverage?.toNumber())
  }

  async loadData() {
    if (!this.perpetualID) {
      return
    }
    try {
      this.loading = true
      await Promise.all([this.updatePerpetual(this.perpetualID)])
    } finally {
      this.loading = false
    }
  }

  setPerpetualID(id: string) {
    this.perpetualID = id
  }

  showConnectWalletDialog() {
    VUE_EVENT_BUS.emit(WALLET_EVENT.ShowConnectWallet)
  }

  @Watch('normalizeTargetLeverage', { immediate: true })
  onTargetLeverageChange(newValue: number, oldValue: number) {
    if (newValue !== oldValue) {
      this.leverage = this.normalizeTargetLeverage.toString()
    }
  }

  reset() {
    this.leverage = this.normalizeTargetLeverage.toString()
  }

  setTargetLeverage() {
    if (!this.perpetualID || !this.address) {
      return
    }
    this.setting = true
    this.settingState = 'loading'
    try {
      this.updateTargetLeverage({
        accountAddress: this.address, perpetualId: this.perpetualID, leverage: toBigNumber(this.leverage),
      })
      this.settingState = 'success'
    } catch (e) {
      console.warn('change target leverage', e)
      this.settingState = 'fail'
      throw e
    } finally {
      this.setting = false
    }
  }
}
