import { Component, Mixins } from 'vue-property-decorator'
import BigNumber from 'bignumber.js'
import { namespace } from 'vuex-class'
import { AccountWithSelectedPerpetualMixin } from '@/mixins'
import { gasLimitConfig } from '@/config/gas'
import {
  ButtonState, TokenBalanceDirectoryItem,
  WalletError,
} from '@/type'
import { getGasStationTxParams } from '@/utils/gasPrice'
import { getWrapContract, WETHDeposit, WETHWithdraw } from '@/utils/Wrap'
import { toBigNumber } from '@/utils'
import { ErrorHandlerMixin } from '@/mixins'
import { ETHTokenList } from '@/config/tokens'
import { ethers } from 'ethers'
import { Provider } from '@ethersproject/providers'
import { TARGET_NETWORK_ID } from '@/constants'
import { waitTransaction } from '@/utils/transaction'
import { currentChainConfig } from '@/config/chain'


const wallet = namespace('wallet')
const account = namespace('account')

@Component
export default class WrapMixin extends Mixins(AccountWithSelectedPerpetualMixin, ErrorHandlerMixin) {
  @wallet.Getter('provider') provider!: Provider
  @wallet.Getter('signer') signer!: ethers.Signer
  @wallet.Getter('availableNativeTokenBalance') availableNativeTokenBalance !: BigNumber | null
  @wallet.Action('updateNativeTokenBalance') updateNativeTokenBalance!: Function
  @account.Getter('tokenBalanceFunc') tokenBalanceFunc!: (tokenAddress: string | undefined) => TokenBalanceDirectoryItem | null

  loading = false

  protected wrapNumber = {
    amount: '',
  }
  protected wrapDirection: string = 'wrap' || 'unwrap'
  protected buttonIsLoading: boolean = false

  private confirmState: ButtonState = ''

  get fromTokenSymbol(): string {
    if (this.wrapDirection == 'wrap') {
      return 'ETH'
    } else {
      return 'WETH'
    }
  }

  get toTokenSymbol() {
    if (this.wrapDirection == 'wrap') {
      return 'WETH'
    } else {
      return 'ETH'
    }
  }

  get fromTokenIcon(): string {
    if (this.wrapDirection == 'wrap') {
      return require('@/assets/img/wrap-eth-icon.svg')
    } else {
      return require('@/assets/img/wrap-weth-icon.svg')
    }
  }

  get toTokenIcon() {
    if (this.wrapDirection == 'wrap') {
      return require('@/assets/img/wrap-weth-icon.svg')
    } else {
      return require('@/assets/img/wrap-eth-icon.svg')
    }
  }

  get fromTokenBalance(): BigNumber | null {
    if (!this.nativeTokenBalance) {
      return null
    }
    if (this.wrapDirection == 'wrap') {
      return this.nativeTokenBalance
    }
    else if (this.wrapDirection == 'unwrap') {
      return this.tokenBalanceFunc(ETHTokenList[TARGET_NETWORK_ID])?.balance || null
    }
    else {
      return null
    }
  }

  get toTokenBalance(): BigNumber | null {
    if (!this.nativeTokenBalance) {
      return null
    }
    if (this.wrapDirection == 'wrap') {
      return this.tokenBalanceFunc(ETHTokenList[TARGET_NETWORK_ID])?.balance || null
    }
    else if (this.wrapDirection == 'unwrap') {
      return this.nativeTokenBalance
    }
    else {
      return null
    }
  }

  get fromTokenMax(): BigNumber | null {
    if (!this.availableNativeTokenBalance) {
      return null
    }
    if (this.wrapDirection == 'wrap') {
      return BigNumber.maximum(0, this.availableNativeTokenBalance.minus(currentChainConfig.minGasLimit.times(5 /* so that trader can open + close */)))
    }
    else if (this.wrapDirection == 'unwrap') {
      return this.fromTokenBalance
    }
    else {
      return null
    }
  }

  get toTokenMax() {
    if (!this.availableNativeTokenBalance) {
      return null
    }
    if (this.wrapDirection == 'wrap') {
      return this.toTokenBalance
    }
    else if (this.wrapDirection == 'unwrap') {
      return this.availableNativeTokenBalance
    }
    else {
      return null
    }
  }

  get formParamsIsValid(): boolean {
    const valueBigNumber = toBigNumber(this.wrapNumber.amount)
    if (this.fromTokenMax && !valueBigNumber.isNaN() && valueBigNumber.lte(this.fromTokenMax) && !valueBigNumber.isZero()) {
      return true
    }
    else {
      return false
    }
  }

  get buttonIsDisabled(): boolean {
    if (!this.formParamsIsValid || this.buttonIsLoading) {
      return true
    } else {
      return false
    }
  }

  get confirmBtnText() {
    if (this.wrapNumber.amount == '' || toBigNumber(this.wrapNumber.amount).isZero() || this.formParamsIsValid) {
      return this.wrapDirection == 'wrap' ? this.$t('wrap.wrap') : this.$t('wrap.unwrap')
    }
    else {
      return this.wrapDirection == 'wrap' ? this.$t('commonErrors.wrapAmountError') : this.$t('commonErrors.unwrapAmountError')
    }
  }


  async onDeposit(amount: string,
    onSuccessfulCallback: () => void = () => { }) {
    if (!this.signer || !this.address) {
      throw new WalletError('wallet signer is null')
    }
    this.confirmState = 'loading'
    try {
      const contract = getWrapContract(this.signer)
      const gas = await getGasStationTxParams(gasLimitConfig.WRAP_ETH_GAS_LIMIT)
      const depositPromise = await WETHDeposit(contract, amount, gas)
      const transaction = waitTransaction(depositPromise)
      const transactionResult = await transaction
      this.confirmState = 'success'
      await this.getData()
      onSuccessfulCallback()
      return transactionResult
    }
    catch (e) {
      this.confirmState = 'fail'
      throw e
    }
  }

  async onWithdraw(amount: string,
    onSuccessfulCallback: () => void = () => { }) {
    if (!this.signer) {
      throw new WalletError('wallet signer is null')
    }
    this.confirmState = 'loading'
    try {
      const contract = getWrapContract(this.signer)
      const gas = await getGasStationTxParams(gasLimitConfig.UNWRAP_WETH_GAS_LIMIT)
      const withdrawPromise = await WETHWithdraw(contract, amount, gas)
      const transaction = waitTransaction(withdrawPromise)
      const transactionResult = await transaction
      this.confirmState = 'success'
      await this.getData()
      onSuccessfulCallback()
      return transactionResult
    }
    catch (e) {
      this.confirmState = 'fail'
      throw e
    }
  }

  async getData() {
    this.loading = true
    try {
      await this.updateNativeTokenBalance()
    } catch (e) {
      console.error(e)
    } finally {
      this.loading = false
    }
  }

  changeWrapDirection() {
    if (this.wrapDirection == 'wrap') {
      this.wrapDirection = 'unwrap'
    } else {
      this.wrapDirection = 'wrap'
    }
  }

  setMax() {
    if (!this.fromTokenMax) {
      return null
    } else {
      this.wrapNumber.amount = this.fromTokenMax.lt(0) ? "0" : this.fromTokenMax.toFixed()
    }
  }
}
