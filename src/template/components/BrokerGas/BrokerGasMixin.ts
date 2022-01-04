import { Component, Mixins, Watch } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import { namespace } from 'vuex-class'
import { AccountGasStorage, ButtonState, WalletError } from '@/type'
import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'
import { currentChainConfig } from '@/config/chain'
import { _0, brokerDeposit, brokerWithdraw, CHAIN_ID_TO_BROKER_ADDRESS, getBrokerContract } from '@mcdex/mai3.js'
import { TARGET_NETWORK_ID } from '@/const'
import { getGasStationTxParams } from '@/utils/gasPrice'
import { gasLimitConfig } from '@/config/gas'
import { waitTransaction } from '@/utils/transaction'
import { toBigNumber } from '@/utils'
import { getSymbolIconUrl } from '@/utils/token'

const wallet = namespace('wallet')
const account = namespace('account')

interface form {
  amount: string
  amountProportion: number
}

function emptyForm(): form {
  return {
    amount: '',
    amountProportion: 0,
  }
}

@Component
export default class BrokerGasMixin extends Mixins(ErrorHandlerMixin) {
  @account.Action('updateAccountGasStorage') updateAccountGasStorage !: Function
  @account.Getter('accountGasStorage') accountGasStorage !: AccountGasStorage | null
  @wallet.State('nativeTokenBalance') nativeTokenBalance !: BigNumber | null
  @wallet.Getter('availableNativeTokenBalance') availableNativeTokenBalance !: BigNumber | null
  @wallet.Action('updateNativeTokenBalance') updateNativeTokenBalance!: Function
  @wallet.Getter('signer') signer!: ethers.Signer | null

  protected selectedRadio: 'deposit' | 'withdraw' = 'deposit'

  protected depositForm = emptyForm()
  protected withdrawForm = emptyForm()

  private depositState: ButtonState = ''
  private withdrawState: ButtonState = ''

  get nativeIcon(): string {
    return getSymbolIconUrl(this.nativeTokenSymbol)
  }

  get depositAmount(): string {
    return this.depositForm.amount
  }

  set depositAmount(v: string) {
    this.depositForm.amount = v
    if (!this.availableNativeTokenBalance) {
      this.depositForm.amountProportion = 0
    } else {
      this.depositForm.amountProportion = Number(toBigNumber(v).div(this.availableNativeTokenBalance).times(100).toFixed(0))
    }
  }

  get withdrawAmount(): string {
    return this.withdrawForm.amount
  }

  set withdrawAmount(v: string) {
    this.withdrawForm.amount = v
    if (!this.gasBalance) {
      this.withdrawForm.amountProportion = 0
    } else {
      this.withdrawForm.amountProportion = Number(toBigNumber(v).div(this.gasBalance).times(100).toFixed(0))
    }
  }

  get depositAmountProportion(): number {
    return this.depositForm.amountProportion
  }

  set depositAmountProportion(val: number) {
    this.depositForm.amountProportion = val
    if (!this.availableNativeTokenBalance || this.availableNativeTokenBalance.isZero()) {
      this.depositForm.amount = '0'
    } else {
      this.depositForm.amount = this.availableNativeTokenBalance.div(100).times(val).toFixed(this.nativeTokenDecimals, BigNumber.ROUND_DOWN)
    }
  }

  get withdrawAmountProportion(): number {
    return this.withdrawForm.amountProportion
  }

  set withdrawAmountProportion(val: number) {
    this.withdrawForm.amountProportion = val
    if (!this.gasBalance || this.gasBalance.isZero()) {
      this.withdrawForm.amount = '0'
    } else {
      this.withdrawForm.amount = this.gasBalance.div(100).times(val).toFixed()
    }
  }

  get nativeToken() {
    return currentChainConfig || null
  }

  get nativeTokenSymbol(): string {
    if (!this.nativeToken) {
      return ''
    }
    return this.nativeToken.symbol
  }

  get nativeTokenDecimals(): number {
    if (!this.nativeToken) {
      return 2
    }
    return this.nativeToken.formatDecimals
  }

  get gasBalance(): BigNumber | null {
    return this.accountGasStorage?.balance || null
  }

  get normalizeDepositAmount() {
    return this.depositForm.amount ? new BigNumber(this.depositForm.amount) : _0
  }

  get invalidDepositAmount() {
    return this.normalizeDepositAmount.isNaN() || this.normalizeDepositAmount.lte(_0) ||
      !this.nativeTokenBalance || this.normalizeDepositAmount.gt(this.nativeTokenBalance)
  }

  get normalizeWithdrawAmount() {
    return this.withdrawForm.amount ? new BigNumber(this.withdrawForm.amount) : _0
  }

  get invalidWithdrawAmount() {
    return this.normalizeWithdrawAmount.isNaN() || this.normalizeWithdrawAmount.lte(_0) ||
      !this.gasBalance || this.normalizeWithdrawAmount.gt(this.gasBalance)
  }

  changeReset() {
    this.depositForm = emptyForm()
    this.withdrawForm = emptyForm()
  }

  @Watch('selectedRadio')
  onSelectedRadioChanged() {
    this.changeReset()
  }

  @Watch('normalizeDepositAmount')
  onNormalizeDepositAmount() {
    if (this.normalizeDepositAmount.isZero()) {
      this.depositForm.amountProportion = 0
    }
  }

  @Watch('normalizeWithdrawAmount')
  onNormalizeWithdrawAmount() {
    if (this.normalizeWithdrawAmount.isZero()) {
      this.withdrawForm.amountProportion = 0
    }
  }

  async onDeposit(
    amount: string,
    onSuccessfulCallback: () => void = () => {}
  ): Promise<ethers.providers.TransactionReceipt | undefined> {
    if (!this.signer) {
      throw new WalletError('wallet signer is null')
    }
    this.depositState = 'loading'
    try {
      const contract = getBrokerContract(CHAIN_ID_TO_BROKER_ADDRESS[TARGET_NETWORK_ID], this.signer)
      if (!contract) {
        return
      }
      const gas = await getGasStationTxParams(gasLimitConfig.GAS_FEE_DEPOSIT_GAS_LIMIT)
      const depositPromise = await brokerDeposit(contract, amount, gas)
      const transaction = waitTransaction(depositPromise)
      this.$transaction({
        location: 'top',
        transaction: transaction,
        content: this.$t('transaction.depositGas', {
          amount: amount,
          token: this.nativeToken?.symbol || ''
        }).toString(),
        transactionHash: depositPromise.hash ? depositPromise.hash : '',
      })
      const transactionResult = await transaction
      this.depositState = 'success'
      onSuccessfulCallback()
      return transactionResult
    } catch (e) {
      console.error('deposit broker gas,', e)
      this.depositState = 'fail'
      throw e
    }
  }

  async onWithdraw(
    amount: string,
    onSuccessfulCallback: () => void = () => {}
  ): Promise<ethers.providers.TransactionReceipt | undefined> {
    if (!this.signer) {
      throw new WalletError('wallet signer is null')
    }
    this.withdrawState = 'loading'
    try {
      const contract = getBrokerContract(CHAIN_ID_TO_BROKER_ADDRESS[TARGET_NETWORK_ID], this.signer)
      if (!contract) {
        return
      }
      const gas = await getGasStationTxParams(gasLimitConfig.GAS_FEE_WITHDRAW_GAS_LIMIT)
      const withdrawPromise = await brokerWithdraw(contract, amount, gas)
      const transaction = waitTransaction(withdrawPromise)
      this.$transaction({
        location: 'top',
        transaction: transaction,
        content: this.$t('transaction.withdrawGas', {
          amount: amount,
          token: this.nativeToken?.symbol || ''
        }).toString(),
        transactionHash: withdrawPromise.hash ? withdrawPromise.hash : '',
      })
      const transactionResult = await transaction
      this.withdrawState = 'success'
      onSuccessfulCallback()
      return transactionResult
    } catch (e) {
      console.error('withdraw broker gas,', e)
      this.withdrawState = 'fail'
      throw e
    }
  }

}
