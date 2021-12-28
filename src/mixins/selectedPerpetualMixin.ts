import { Component, Vue, Watch } from 'vue-property-decorator'
import { AccountStorageDirectoryItem, LiquidityPoolDirectoryItem, PerpetualCombinedState } from '@/type'
import { namespace } from 'vuex-class'
import {
  _1,
  LiquidityPoolStorage,
  PerpetualState,
  PerpetualStorage
} from '@mcdex/mai3.js'
import BigNumber from 'bignumber.js'
import { processStoreErrors } from './errorHandlerMixin'
import { Provider } from '@ethersproject/providers'

const perpetual = namespace('perpetual')
const activePerpetual = namespace('activePerpetuals')
const wallet = namespace('wallet')
const account = namespace('account')

@Component
export class SelectedPerpetualMixin extends Vue {
  @activePerpetual.State('selectedPerpetualID') selectedPerpetualID!: string | null
  @perpetual.Getter('getPerpetualFunc') getPerpetualFunc!: (perpetualId: string) => PerpetualCombinedState | null
  @perpetual.Getter('getLiquidityPoolFunc') getLiquidityPoolFunc!: (address: string) => LiquidityPoolDirectoryItem | null
  @perpetual.Mutation('togglePerpetualIsInverse') togglePerpetualIsInverse!: (params: { perpetualID: string, isInverse: boolean }) => void
  @wallet.Getter('provider') provider !: Provider
  @wallet.Getter('address') address!: string | null
  @account.Getter('accountStorageFunc') accountStorageFunc!: (perpetualId: string) => AccountStorageDirectoryItem | null
  @account.Getter('targetLeverageFunc') targetLeverageFunc!: (perpetualId: string) => BigNumber | null

  get selectedPerpetual(): PerpetualCombinedState | null {
    if (!this.getPerpetualFunc || !this.selectedPerpetualID) {
      return null
    }
    try {
      return this.getPerpetualFunc(this.selectedPerpetualID) || null
    } catch (e) {
      processStoreErrors(this, e)
      return null
    }
  }

  get selectedLiquidityPool(): LiquidityPoolDirectoryItem | null {
    if (!this.getLiquidityPoolFunc || !this.selectedPerpetualProperty) {
      return null
    }
    try {
      return this.getLiquidityPoolFunc(this.selectedPerpetualProperty.liquidityPoolAddress) || null
    } catch (e) {
      processStoreErrors(this, e)
      return null
    }
  }

  get selectedPerpetualAccountStorage() {
    if (!this.accountStorageFunc || !this.selectedPerpetualID) {
      return null
    }
    try {
      return this.accountStorageFunc(this.selectedPerpetualID) || null
    } catch (e) {
      processStoreErrors(this, e)
      return null
    }
  }

  get selectPerpetualTargetLeverage() {
    return this.selectedPerpetualID ? this.targetLeverageFunc(this.selectedPerpetualID) : null
  }

  get selectedLiquidityPoolStorage(): LiquidityPoolStorage | null {
    return this.selectedLiquidityPool?.liquidityPoolStorage || null
  }

  get selectedPerpetualStorage(): PerpetualStorage | null {
    return this.selectedPerpetual?.perpetualStorage || null
  }

  get selectedPerpetualProperty() {
    return this.selectedPerpetual?.perpetualProperty || null
  }

  get perpetualCollateralTokenSymbol() {
    return this.selectedPerpetualProperty?.collateralTokenSymbol || null
  }

  get perpetualUnderlyingSymbol() {
    return this.selectedPerpetualProperty?.underlyingAssetSymbol || null
  }

  get selectedPerpetualSymbol() {
    return this.selectedPerpetualProperty?.symbol || null
  }

  get selectedPerpetualName() {
    return this.selectedPerpetualProperty?.name || null
  }

  get selectedPerpetualOracle() {
    return this.selectedPerpetualStorage?.oracle || null
  }

  get selectedPerpetualCollateralDecimals() {
    return this.selectedPerpetualProperty?.collateralTokenDecimals || null
  }

  get selectedPerpetualIndexPrice() {
    return this.selectedPerpetualStorage?.indexPrice || null
  }

  get selectedPerpetualMarkPrice() {
    return this.selectedPerpetualStorage?.markPrice || null
  }

  get selectedPerpetualIsInverse() {
    return !!this.selectedPerpetualStorage?.isInversePerpetual
  }

  get selectPerpetualMaxInitialLeverage(): BigNumber | null {
    if (!this.selectedPerpetual) {
      return null
    }
    return _1.div(this.selectedPerpetual.perpetualStorage.initialMarginRate)
  }

  get selectedPerpetualIsSettle(): boolean | null {
    if (!this.selectedPerpetualStorage) {
      return null
    }
    return this.selectedPerpetualStorage.state === PerpetualState.EMERGENCY || this.selectedPerpetualStorage.state === PerpetualState.CLEARED
  }

  get selectedPerpetualIsMarketClosed(): boolean | null {
    if (!this.selectedPerpetualStorage) {
      return null
    }
    return this.selectedPerpetualStorage.isMarketClosed
  }

  get selectedPerpetualAmmIsSafe(): boolean {
    if (!this.selectedPerpetual) {
      return true
    }
    return this.selectedPerpetual.liquidityPoolStorage.isAMMMaintenanceSafe
  }

  get selectedPerpetualOracleIsTerminated(): boolean {
    if (!this.selectedPerpetual) {
      return false
    }
    return this.selectedPerpetual.perpetualStorage.isTerminated
  }
}
