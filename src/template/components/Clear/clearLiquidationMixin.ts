import { Component, Mixins, Watch } from 'vue-property-decorator'
import { AccountWithSelectedPerpetualMixin, ErrorHandlerMixin } from '@/mixins'
import { ethers } from 'ethers'
import { namespace, State } from 'vuex-class'
import {
  DECIMALS,
  getLiquidityPoolContract,
  getPerpetualClearGasReward,
  getPerpetualClearProgress,
  perpetualClear,
  PerpetualState,
} from '@mcdex/mai3.js'
import { ButtonState, DataNotFoundError } from '@/type'
import { getGasStationTxParams } from '@/utils/gasPrice'
import { gasLimitConfig } from '@/config/gas'
import BigNumber from 'bignumber.js'
import { Provider } from '@ethersproject/providers'
import { waitTransaction } from '@/utils/transaction'

const wallet = namespace('wallet')
const perpetual = namespace('perpetual')

@Component
export default class ClearLiquidationMixin extends Mixins(AccountWithSelectedPerpetualMixin, ErrorHandlerMixin) {
  @wallet.Getter('signer') walletSigner!: ethers.Signer | null
  @wallet.Getter('provider') provider!: Provider
  @wallet.Getter('isConnectedWallet') isConnectedWallet!: boolean
  @State('latestBlockNumber') latestBlockNumber !: number | null
  @perpetual.Action('updatePerpetual') updatePerpetual!: (perpetualID: string) => Promise<void>

  protected clearButtonState: ButtonState = ''
  protected buttonIsLoading: boolean = false
  protected loadTimer = 0
  protected clearIncentivesValue: string = ''
  protected totalClearAccount: string = ''
  protected leftClearAccount: string = ''

  mounted() {
    this.loadTimer = window.setInterval(() => {
      this.updateClearAccount()
    }, 10000)
  }

  destroyed() {
    window.clearInterval(this.loadTimer)
  }

  get isGlobalCleared(): boolean {
    if (!this.selectedPerpetualStorage) return false
    return this.selectedPerpetualStorage.state === PerpetualState.CLEARED
  }

  get collateralFormatDecimals(): number {
    return this.selectedPerpetualProperty?.collateralFormatDecimals || 0
  }

  get underlyingTokenSymbol(): string {
    return this.selectedPerpetualProperty?.underlyingAssetSymbol || ''
  }

  get underlyingTokenDecimals(): number {
    return this.selectedPerpetualProperty?.underlyingAssetFormatDecimals || 0
  }

  get collateralTokenSymbol(): string {
    return this.selectedPerpetualProperty?.collateralTokenSymbol || ''
  }

  get confirmButtonIsDisabled(): boolean {
    if (this.isGlobalCleared || this.buttonIsLoading) {
      return true
    }
    else if (this.completedClearAccount === Number(this.totalClearAccount) && Number(this.totalClearAccount) !== 0) {
      return true
    }
    else {
      return false
    }
  }

  get priceUnit() {
    return this.selectedPerpetualProperty?.priceSymbol || ''
  }

  get priceFormatDecimals() {
    return this.selectedPerpetualProperty?.priceFormatDecimals || 0
  }

  get completedClearAccount(): number {
    return Number(this.totalClearAccount) - Number(this.leftClearAccount)
  }

  async getLiquidityPoolContract() {
    // initial perpetual contract
    return await this.callChainReadFunc(async () => {
      if (!this.selectedLiquidityPool) {
        throw new DataNotFoundError('selected perpetual is null')
      }
      if (!this.provider) {
        throw new DataNotFoundError('wallet provider is null')
      }
      return getLiquidityPoolContract(this.selectedLiquidityPool.liquidityPoolAddress, this.provider)
    })
  }

  get accountMarginBalance(): BigNumber | null {
    if (!this.selectedAccountDetails) {
      return null
    }
    return this.selectedAccountDetails.accountComputed.marginBalance
  }

  get accountPosition(): BigNumber | null {
    if (!this.selectedAccountDetails) {
      return null
    }
    return this.selectedAccountDetails.accountStorage.positionAmount
  }

  get accountPositionValue(): BigNumber | null {
    if (!this.accountPosition || !this.globalSettlePrice) {
      return null
    }
    return this.accountPosition.abs().times(this.globalSettlePrice)
  }

  get globalSettlePrice(): BigNumber | null {
    if (!this.selectedPerpetualStorage) return null
    return this.selectedPerpetualStorage.markPrice
  }

  @Watch('selectedPerpetualID', { immediate: true })
  async updateClearIncentivesValue() {
    if (!this.selectedPerpetualProperty) {
      return
    }
    const liquidityPoolContract = await this.getLiquidityPoolContract()
    if (!liquidityPoolContract) {
      return
    }
    const perpetualIndex = this.selectedPerpetualProperty.perpetualIndex
    const clearGasReward = await getPerpetualClearGasReward(liquidityPoolContract, perpetualIndex, DECIMALS)
    this.clearIncentivesValue = clearGasReward.toFixed(this.selectedPerpetualProperty?.collateralFormatDecimals || 0)
  }

  @Watch('selectedPerpetualID', { immediate: true })
  @Watch('latestBlockNumber')
  async updateClearAccount() {
    if (!this.selectedPerpetualProperty) {
      return
    }
    const liquidityPoolContract = await this.getLiquidityPoolContract()
    if (!liquidityPoolContract) {
      return
    }
    const perpetualIndex = this.selectedPerpetualProperty.perpetualIndex
    const clearProgressInfo = await getPerpetualClearProgress(liquidityPoolContract, perpetualIndex)
    this.totalClearAccount = clearProgressInfo.total.toFixed()
    this.leftClearAccount = clearProgressInfo.left.toFixed()
  }

  async clearEvent() {
    // call contract clear function, return transaction
    const txResult = await this.callChainFunc(async () => {
      // perpetual is cleared status, return
      if (this.isGlobalCleared || !this.walletSigner || !this.selectedPerpetualProperty) {
        return
      }
      this.buttonIsLoading = true
      this.clearButtonState = 'loading'
      // initial perpetual contract
      const liquidityPoolContract = getLiquidityPoolContract(
        this.selectedPerpetualProperty.liquidityPoolAddress,
        this.walletSigner
      )
      if (!liquidityPoolContract) {
        this.buttonIsLoading = false
        this.clearButtonState = 'fail'
        return
      }
      if (!this.selectedPerpetualProperty) {
        return
      }
      const gas = await getGasStationTxParams(gasLimitConfig.PERP_SETTLE_CLEAR_GAS_LIMIT)
      const perpetualIndex = this.selectedPerpetualProperty.perpetualIndex
      const clearPromise = await perpetualClear(liquidityPoolContract, perpetualIndex, gas)
      const transaction = waitTransaction(clearPromise)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.clear', {
          symbol: this.selectedPerpetualProperty.symbolStr,
        }).toString(),
        transactionHash: clearPromise.hash ? clearPromise.hash : '',
      })
      // refresh perpetual
      const txResult = await transaction
      await this.updatePerpetual(this.selectedPerpetualProperty.perpetualID)
      this.clearButtonState = 'success'
      return txResult
    })
    if (!txResult) {
      this.clearButtonState = 'fail'
    }
    this.buttonIsLoading = false
  }
}
