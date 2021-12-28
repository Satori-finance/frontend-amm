import { Component, Mixins, Watch } from 'vue-property-decorator'
import { ethers } from 'ethers'
import {
  _0,
  DECIMALS,
  getLiquidityPoolContract,
  LiquidityPool,
  perpetualSettle,
  PerpetualState,
} from '@mcdex/mai3.js'
import BigNumber from 'bignumber.js'
import { ButtonState, DataNotFoundError } from '@/type'
import { toBigNumber } from '@/utils'
import { getGasStationTxParams } from '@/utils/gasPrice'
import { gasLimitConfig } from '@/config/gas'
import { ACCOUNT_EVENT, VUE_EVENT_BUS } from '@/event'
import { AccountWithSelectedPerpetualMixin, ErrorHandlerMixin } from '@/mixins'
import { namespace } from 'vuex-class'
import { Provider } from '@ethersproject/providers'
import { waitTransaction } from '@/utils/transaction'

const wallet = namespace('wallet')

@Component
export default class ClearMyPositionMixin extends Mixins(AccountWithSelectedPerpetualMixin, ErrorHandlerMixin) {
  @wallet.Getter('signer') walletSigner!: ethers.Signer | null
  @wallet.Getter('provider') provider !: Provider

  protected withdrawButtonState: ButtonState = ''
  protected marginBalance: BigNumber = _0
  protected buttonIsLoading: boolean = false
  protected settleableMargin: BigNumber = new BigNumber(0)

  get confirmButtonIsDisabled(): boolean {
    if (this.settleableMargin.lte(0)) {
      return true
    }
    return this.buttonIsLoading
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

  get priceUnit() {
    return this.selectedPerpetualProperty?.priceSymbol || ''
  }

  get priceFormatDecimals() {
    return this.selectedPerpetualProperty?.priceFormatDecimals || 0
  }

  get isClearEnd(): boolean {
    if (!this.selectedPerpetualStorage) return false
    return this.selectedPerpetualStorage.state === PerpetualState.CLEARED
  }

  get settlePrice(): BigNumber | null {
    if (!this.selectedPerpetual) {
      return null
    }
    return this.selectedPerpetual.perpetualStorage.markPrice
  }

  get accountMarginBalance(): BigNumber | null {
    if (!this.selectedAccountDetails) {
      return null
    }
    return this.selectedAccountDetails.accountComputed.marginBalance
  }

  @Watch('selectedPerpetualProperty', { immediate: true })
  @Watch('tradeAccountAddress', { immediate: true })
  @Watch('provider', { immediate: true })
  async settleMarginBalance() {
    if (!this.selectedPerpetualProperty || !this.tradeAccountAddress || !this.provider) {
      return
    }
    const liquidityPoolContract = getLiquidityPoolContract(this.selectedPerpetualProperty.liquidityPoolAddress, this.provider)
    if (!liquidityPoolContract) {
      return
    }
    const perpetualIndex = this.selectedPerpetualProperty.perpetualIndex
    const { settleableMargin } = await liquidityPoolContract.getMarginAccount(perpetualIndex, this.tradeAccountAddress)
    this.settleableMargin = new BigNumber(settleableMargin.toString())
    this.marginBalance = new BigNumber(settleableMargin.toString()).shiftedBy(-DECIMALS)
  }

  get positionSide(): string | null {
    if (!this.selectedAccountDetails) return null
    const positionAmount = this.selectedAccountDetails.accountStorage.positionAmount
    if (positionAmount.gt(0)) {
      return 'long'
    }
    if (positionAmount.lt(0)) {
      return 'short'
    }
    return null
  }

  get position(): BigNumber | null {
    if (!this.selectedAccountDetails) return null
    return this.selectedAccountDetails.accountStorage.positionAmount.abs()
  }

  get positionValue(): BigNumber | null {
    if (!this.position || !this.settlePrice) {
      return null
    }
    return this.position.abs().times(this.settlePrice)
  }

  async withdrawToWalletEvent() {
    if (!this.selectedPerpetualProperty || !this.tradeAccountAddress || !this.walletSigner) {
      return
    }
    this.buttonIsLoading = true
    this.withdrawButtonState = 'loading'
    const liquidityPoolContract = getLiquidityPoolContract(this.selectedPerpetualProperty.liquidityPoolAddress, this.walletSigner)
    if (!liquidityPoolContract) {
      this.buttonIsLoading = false
      this.withdrawButtonState = 'fail'
      return
    }
    // call contract withdraw function, return transaction
    const txResult = await this.callChainFunc(async () => {
      if (!this.selectedPerpetualProperty || !this.tradeAccountAddress) {
        return
      }
      const gas = await getGasStationTxParams(gasLimitConfig.PERP_SETTLE_WITHDRAW_GAS_LIMIT)
      const settleWithdrawPromise = await perpetualSettle(
        liquidityPoolContract,
        this.selectedPerpetualProperty.perpetualIndex,
        this.tradeAccountAddress,
        gas
      )
      const transaction = waitTransaction(settleWithdrawPromise)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.withdraw', {
          amount: toBigNumber(this.marginBalance).toFixed(this.selectedPerpetualProperty?.collateralFormatDecimals || 0),
          token: this.selectedPerpetualProperty?.collateralTokenSymbol || '',
          symbol: this.selectedPerpetualProperty?.symbolStr || '',
        }).toString(),
        transactionHash: settleWithdrawPromise.hash ? settleWithdrawPromise.hash : '',
      })
      await transaction
      // update my balance
      const txResult = await this.settleMarginBalance()
      VUE_EVENT_BUS.emit(ACCOUNT_EVENT.REFRESH_USER_DATA)
      this.withdrawButtonState = 'success'
      return txResult
    })
    if (!txResult) {
      this.withdrawButtonState = 'fail'
    }
    this.buttonIsLoading = false
  }
}
