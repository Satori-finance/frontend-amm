import { Component, Prop, Vue } from 'vue-property-decorator'
import BigNumber from 'bignumber.js'
import { namespace } from 'vuex-class'
import { ethers } from 'ethers'
import {
  AccountStorageDirectoryItem,
  LiquidityPoolDirectoryItem,
  PerpetualCombinedState,
  PerpetualProperty,
  TokenBalanceDirectoryItem,
} from '@/type'
import {
  _0,
  AccountComputed,
  AccountDetails,
  computeAccount,
  PerpetualState,
  PerpetualStorage,
} from '@mcdex/mai3.js'
import { isNativeToken } from '@/utils/chain'
import _ from 'lodash'
import { SUPPORTED_NETWORK_ID, WithdrawRelaxFactor } from '@/constants'

const perpetual = namespace('perpetual')
const wallet = namespace('wallet')
const account = namespace('account')

@Component
export default class ChangeLeverageMixin extends Vue {
  @wallet.Getter('signer') signer!: ethers.Signer | null
  @wallet.Getter('address') address!: string | null
  @account.Action('updateAccountStorage') updateAccountStorage!: (perpetualID: string) => Promise<void>
  @account.Getter('accountStorageFunc') accountStorageFunc!: (perpetualID: string) => AccountStorageDirectoryItem | null
  @account.Getter('tokenBalanceFunc') tokenBalanceFunc!: (tokenAddress: string) => TokenBalanceDirectoryItem | null
  @account.Action('updateTokenBalance') updateTokenBalance!: (params: { tokenAddress: string }) => Promise<void>
  @perpetual.Getter('getPerpetualFunc') getPerpetualFunc!: (perpetualID: string) => PerpetualCombinedState | null
  @perpetual.Getter('getLiquidityPoolFunc') getLiquidityPoolFunc!: (liquidityPoolAddress: string) => LiquidityPoolDirectoryItem | null
  @perpetual.Action('updatePerpetual') updatePerpetual!: (perpetualID: string) => Promise<void>
  @wallet.State('nativeTokenBalance') nativeTokenBalance!: BigNumber | null
  @wallet.Getter('availableNativeTokenBalance') availableNativeTokenBalance!: BigNumber | null
  @wallet.Action('updateNativeTokenBalance') updateNativeTokenBalance!: Function
  @account.Getter('allowanceFunc') allowanceFunc!: (tokenAddress: string, spender: string) => BigNumber
  @account.Action('updateAllowance') updateAllowance!: (params: { tokenAddress: string, spenderAddress: string, networkId?: SUPPORTED_NETWORK_ID }) => Promise<void>

  @Prop({ required: true }) perpetualID!: string | null

  loading = false
  getDataFunc = _.debounce(this.getData, 200)

  get tokenBalanceInfo(): TokenBalanceDirectoryItem | null {
    if (!this.tokenBalanceFunc || !this.liquidityPool) {
      return null
    }
    return this.tokenBalanceFunc(this.liquidityPool.liquidityPoolStorage.collateral)
  }

  get isNativeToken() {
    if (!this.liquidityPool) {
      return false
    }
    return isNativeToken(this.liquidityPool.liquidityPoolStorage.collateral)
  }

  get isInverse(): boolean | null {
    if (!this.perpetualProperty){
      return null
    }
    return this.perpetualProperty.isInverse
  }

  get allowance(): BigNumber | null {
    if (!this.allowanceFunc || !this.liquidityPool || !this.perpetualProperty) {
      return null
    }
    return this.allowanceFunc(this.liquidityPool.liquidityPoolStorage.collateral, this.perpetualProperty.liquidityPoolAddress)
  }

  get walletCollateral(): BigNumber | null {
    if (!this.collateralDecimals) {
      return null
    }
    // TODO : Support L2
    // TODO wrap WETH
    return this.tokenBalanceInfo?.balance || _0
    // return (this.isNativeToken ? this.nativeTokenBalance : this.tokenBalanceInfo?.balance) || _0
  }

  get liquidityPool(): LiquidityPoolDirectoryItem | null {
    if (!this.perpetualProperty || !this.getLiquidityPoolFunc) {
      return null
    }
    return this.getLiquidityPoolFunc(this.perpetualProperty.liquidityPoolAddress)
  }

  get perpetual(): PerpetualCombinedState | null {
    if (!this.perpetualID || !this.getPerpetualFunc) {
      return null
    }
    return this.getPerpetualFunc(this.perpetualID)
  }

  get perpetualProperty(): PerpetualProperty | null {
    return this.perpetual ? this.perpetual.perpetualProperty : null
  }

  get collateralDecimals() {
    return this.perpetualProperty ? this.perpetualProperty.collateralFormatDecimals : null
  }

  get underlyingDecimals() {
    return this.perpetualProperty ? this.perpetualProperty.underlyingAssetFormatDecimals : null
  }

  get perpetualStorage(): PerpetualStorage | null {
    return this.perpetual ? this.perpetual.perpetualStorage : null
  }

  get disableChangeLeverage() {
    return this.perpetualStorage?.state === PerpetualState.EMERGENCY || this.perpetualStorage?.state === PerpetualState.CLEARED
  }

  get perpetualStateIsNotNormal(): boolean | null {
    if (!this.perpetualStorage) {
      return null
    }
    return this.perpetualStorage.state !== PerpetualState.NORMAL
  }

  get accountDetail(): AccountDetails | null {
    if (!this.liquidityPool || !this.accountStorage || !this.perpetualProperty) {
      return null
    }
    return computeAccount(this.liquidityPool.liquidityPoolStorage, this.perpetualProperty.perpetualIndex, this.accountStorage)
  }

  get accountStorage(): AccountStorageDirectoryItem | null {
    if (!this.perpetualID || !this.accountStorageFunc) {
      return null
    }
    return this.accountStorageFunc(this.perpetualID)
  }

  get accountComputed(): AccountComputed | null {
    return this.accountDetail ? this.accountDetail.accountComputed : null
  }

  get maintenanceMargin(): BigNumber | null {
    return this.accountDetail ? this.accountDetail.accountComputed.maintenanceMargin : null
  }

  get marginBalance(): BigNumber | null {
    return this.accountDetail ? this.accountDetail.accountComputed.marginBalance : null
  }

  get position(): BigNumber | null {
    return this.accountStorage ? this.accountStorage.positionAmount : null
  }

  get positionValue(): BigNumber | null {
    if (!this.perpetualStorage || !this.position) {
      return null
    }
    return this.position.abs().times(this.perpetualStorage.markPrice)
  }

  get availableMargin(): BigNumber | null {
    return this.accountComputed?.availableMargin || null
  }

  get withdrawableBalance(): BigNumber | null {
    if (!this.collateralDecimals || !this.accountStorage || !this.accountComputed) {
      return null
    }
    if (this.accountStorage.positionAmount.isZero()) {
      return this.accountComputed.withdrawableBalance
    }

    return new BigNumber(this.accountComputed.withdrawableBalance.times(WithdrawRelaxFactor).toFixed(this.collateralDecimals, BigNumber.ROUND_DOWN))
  }

  protected async getData() {
    if (!this.perpetualID || !this.signer || !this.address || !this.liquidityPool || !this.perpetualProperty) {
      return
    }
    this.loading = true
    try {
      await Promise.all([
        this.updatePerpetual(this.perpetualID),
        this.updateAccountStorage(this.perpetualID),
        this.updateTokenBalance({ tokenAddress: this.liquidityPool.liquidityPoolStorage.collateral }),
        this.updateAllowance({
          tokenAddress: this.liquidityPool.liquidityPoolStorage.collateral,
          spenderAddress: this.perpetualProperty.liquidityPoolAddress,
        }),
        this.updateNativeTokenBalance(),
      ])
    } catch (e) {
      console.error(e)
    } finally {
      this.loading = false
    }
  }
}
