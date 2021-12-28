import { Component, Mixins } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { SelectedPerpetualMixin } from '@/mixins/selectedPerpetualMixin'
import { AccountDetails } from '@mcdex/mai3.js'
import { MarginAccount, TokenBalanceDirectoryItem } from '@/type'
import { processStoreErrors } from './errorHandlerMixin'
import BigNumber from 'bignumber.js'
import { isNativeToken } from '@/utils/chain'
import { computeAccountDetails } from '@/utils/account'

const account = namespace('account')
const wallet = namespace('wallet')

@Component
export class AccountWithSelectedPerpetualMixin extends Mixins(SelectedPerpetualMixin) {
  @account.Getter('tokenBalanceFunc') tokenBalanceFunc!: (tokenAddress: string) => TokenBalanceDirectoryItem | null
  @account.Getter('marginAccountFunc') marginAccountFunc!: (perpetualID: string) => MarginAccount | null
  @wallet.Getter('address') tradeAccountAddress!: string | null
  @wallet.State('nativeTokenBalance') nativeTokenBalance!: BigNumber | null

  get selectedPerpetualMarginAccount() {
    if (!this.selectedPerpetualID) {
      return null
    }
    return this.marginAccountFunc(this.selectedPerpetualID)
  }

  get selectedAccountDetails(): AccountDetails | null {
    if (!this.selectedPerpetualID || !this.tradeAccountAddress || !this.selectedPerpetualAccountStorage || !this.selectedLiquidityPoolStorage) {
      return null
    }
    try {
      return computeAccountDetails(this.selectedPerpetualID, this.selectedPerpetualAccountStorage, this.selectedLiquidityPoolStorage, this.selectedPerpetualMarginAccount)
    } catch (e) {
      processStoreErrors(this, e)
      return null
    }
  }

  get collateralAddress(): string | null {
    if (!this.selectedLiquidityPool || !this.tradeAccountAddress) {
      return null
    }
    return this.selectedLiquidityPool.liquidityPoolStorage.collateral

  }

  get collateralMatch(): boolean {
    if (!this.selectedLiquidityPool || !this.tradeAccountAddress) {
      return false
    }
    return isNativeToken(this.selectedLiquidityPool.liquidityPoolStorage.collateral)
  }

  get collateralBalance(): BigNumber | null {
    if (!this.selectedLiquidityPool || !this.tradeAccountAddress) {
      return null
    }
    // TODO wrap WETH
    // if (isNativeToken(this.selectedLiquidityPool.liquidityPoolStorage.collateral)) {
    //   return this.nativeTokenBalance // TODO refined when support l2
    // }
    try {
      return this.tokenBalanceFunc(this.selectedLiquidityPool.liquidityPoolStorage.collateral)?.balance || null // TODO refined when support l2
    } catch (e) {
      processStoreErrors(this, e)
      return null
    }
  }

  get shareBalance(): TokenBalanceDirectoryItem | null {
    if (!this.selectedLiquidityPool || !this.tradeAccountAddress) {
      return null
    }
    try {
      return this.tokenBalanceFunc(this.selectedLiquidityPool.liquidityPoolStorage.shareToken)
    } catch (e) {
      processStoreErrors(this, e)
      return null
    }
  }

  get collateralTokenSymbol(): string {
    if (!this.selectedPerpetualProperty) {
      return ''
    }
    return this.selectedPerpetualProperty.collateralTokenSymbol
  }

  get collateralFormatDecimals() {
    return this.selectedPerpetualProperty?.collateralFormatDecimals
  }

  get l2WalletBalanceAndMargin(): BigNumber | null {
    if (!this.selectedAccountDetails || !this.collateralBalance) {
      return null
    }
    let balance = this.collateralBalance
    if (this.selectedAccountDetails.accountStorage.positionAmount.isZero()) {
      // show walletBalance + marginBalance if pos = 0
      balance = balance.plus(this.selectedAccountDetails.accountComputed.marginBalance)
    }
    return balance
  }
}
