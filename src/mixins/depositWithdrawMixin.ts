import { Component, Vue } from 'vue-property-decorator'
import {
  approveToken,
  erc20Decimals,
  getERC20Contract,
  getLiquidityPoolContract,
  LiquidityPoolStorage,
  perpetualDeposit,
  perpetualWithdraw,
} from '@mcdex/mai3.js'
import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'
import { namespace } from 'vuex-class'
import { getGasStationTxParams } from '@/utils/gasPrice'
import { gasLimitConfig } from '@/config/gas'
import { PerpetualProperty } from '@/type'
import { isNativeToken } from '@/utils/chain'
import { ALLOWANCE_AMOUNT } from '@/constants'
import { waitTransaction } from '@/utils/transaction'

const wallet = namespace('wallet')

@Component
export class DepositWithdrawMixin extends Vue {
  @wallet.Getter('signer') signer!: ethers.Signer | null
  @wallet.Getter('isConnectedWallet') isConnectedWallet !: boolean

  depositing: boolean = false
  withdrawing: boolean = false
  approving: boolean = false

  get depositingOrWithdrawing() {
    return this.depositing || this.withdrawing
  }

  async approve(
    liquidityPoolStorage: LiquidityPoolStorage,
    props: PerpetualProperty,
    address: string,
    onTransactionStart: () => void = () => {
    },
  ): Promise<ethers.providers.TransactionReceipt | undefined> {
    if (!this.signer) {
      return
    }
    this.approving = true
    try {
      const erc20Contract = getERC20Contract(liquidityPoolStorage.collateral, this.signer)
      const decimals = await erc20Decimals(erc20Contract)
      const promiseInstance = await approveToken(erc20Contract, props.liquidityPoolAddress, new BigNumber(ALLOWANCE_AMOUNT), decimals)
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.approve', {
          amount: '∞',
          token: props.collateralTokenSymbol,
          symbol: `${props.symbolStr} ${props.name}`,
        }).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      onTransactionStart()
      return await transaction
    } catch (e) {
      console.error('approve', e)
      throw e
    } finally {
      this.approving = false
    }
  }

  async deposit(
    liquidityPoolStorage: LiquidityPoolStorage,
    props: PerpetualProperty,
    address: string,
    amount: BigNumber,
    onTransactionStart: () => void = () => {
    },
  ): Promise<ethers.providers.TransactionReceipt | undefined> {
    if (!this.signer) {
      return
    }
    this.depositing = true
    try {
      const poolContract = getLiquidityPoolContract(props.liquidityPoolAddress, this.signer)
      const gas = await getGasStationTxParams(gasLimitConfig.DEPOSIT_GAS_LIMIT)
      let promiseInstance = await perpetualDeposit(poolContract, props.perpetualIndex, address, amount, gas)
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.deposit', {
          amount: amount.toFormat(props.collateralFormatDecimals),
          token: props.collateralTokenSymbol,
          symbol: `${props.symbolStr} ${props.name}`,
        }).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      onTransactionStart()
      return await transaction
    } finally {
      this.depositing = false
    }
  }

  async withdraw(
    liquidityPoolStorage: LiquidityPoolStorage,
    props: PerpetualProperty,
    address: string,
    amount: BigNumber,
    onTransactionStart: () => void = () => {
    },
  ): Promise<ethers.providers.TransactionReceipt | undefined> {
    if (!this.signer) {
      return
    }
    this.withdrawing = true
    try {
      const poolContract = getLiquidityPoolContract(props.liquidityPoolAddress, this.signer)
      const gasLimit = liquidityPoolStorage.perpetuals.size * gasLimitConfig.WITHDRAW_GAS_LIMIT_K + gasLimitConfig.WITHDRAW_GAS_LIMIT_B
      const gas = await getGasStationTxParams(gasLimit)
      const promiseInstance = await perpetualWithdraw(poolContract, props.perpetualIndex, address, amount, gas)
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.withdraw', {
          amount: amount.toFormat(props.collateralFormatDecimals),
          token: props.collateralTokenSymbol,
          symbol: `${props.symbolStr} ${props.name}`,
        }).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      onTransactionStart()
      return await transaction
    } finally {
      this.withdrawing = false
    }
  }
}
