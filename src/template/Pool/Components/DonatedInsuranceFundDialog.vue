<template>
  <div>
    <el-dialog
      top="0"
      custom-class="is-medium donate-insurance-fund-dialog"
      append-to-body
      :title="$t('pool.poolInfo.donateInsuranceFund')"
      :close-on-click-modal="false"
      :visible.sync="currentVisible"
      @close="onCloseDialog"
    >
      <McLoading v-if="loadingBalance || loadingAllowance" class="loading-box" :min-show-time="500"
                 :show-loading="loadingBalance || loadingAllowance"></McLoading>
      <template v-else>
        <div class="donate-body">
          <div class="pair-item mc-font-p14">
            <label>{{ $t('pool.donatedAmount') }}</label>
            <span class="right">
              {{ $t('base.walletBalance') }}
              <span class="value">{{ walletCollateral | bigNumberFormatter(collateralDecimals) }}</span>
              <span class="unit">{{ collateralSymbol }}</span>
            </span>
          </div>
          <div>
            <el-form size="medium" :model="form" :rules="formRule" ref="form" @submit.native.prevent>
              <el-form-item prop="amount">
                <el-input v-model="form.amount" size="medium">
                <span slot="suffix" class="suffix">
                  <span>{{ collateralSymbol }}</span>
                </span>
                </el-input>
              </el-form-item>
            </el-form>
          </div>
        </div>
        <template slot="footer">
          <div class="footer-container">
            <div class="footer-button">
              <McSteps :start-label="$t('base.donate')">
                <template #start="prop">
                  <el-button type="blue" :disabled="disabledDonate" :loading="prop.start.running" size="medium"
                             @click="prop.start.start">
                    {{ prop.start.label }}
                  </el-button>
                </template>
                <McStepItem v-for="(step, index) in steps" :key="index" :action="step.action"
                            :label="step.label"></McStepItem>
              </McSteps>
            </div>
            <el-alert
              v-if="approveError"
              class="alert-error"
              :title="$t('transaction.error.approve')"
              type="error"
            ></el-alert>
          </div>
        </template>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import { McLoading, McStepItem, McSteps } from '@/components'
import { ErrorHandlerMixin } from '@/mixins'
import { ellipsisMiddle } from '@/utils'
import { getGasStationTxParams } from '@/utils/gasPrice'
import {
  _0,
  approveToken,
  erc20Decimals,
  getERC20Contract,
  getLiquidityPoolContract,
  donateInsuranceFund,
  LiquidityPoolStorage,
} from '@mcdex/mai3.js'
import BigNumber from 'bignumber.js'
import { TokenBalanceDirectoryItem } from '@/type'
import { ethers } from 'ethers'
import { namespace } from 'vuex-class'
import { gasLimitConfig } from '@/config/gas'
import { ALLOWANCE_AMOUNT, SUPPORTED_NETWORK_ID } from '@/constants'
import { waitTransaction } from '@/utils/transaction'
import { isNativeToken } from '@/utils/chain'

const account = namespace('account')
const wallet = namespace('wallet')
const perpetual = namespace('perpetual')

@Component({
  components: {
    McLoading,
    McSteps,
    McStepItem,
  },
})
export default class DonatedInsuranceFundDialog extends Mixins(ErrorHandlerMixin) {
  @Prop({ default: false }) visible!: boolean
  @Prop({ required: true }) liquidityPoolStorage !: LiquidityPoolStorage | null
  @Prop({ required: true, default: '' }) poolAddress !: string
  @Prop({ required: true, default: '' }) collateralSymbol !: string
  @Prop({ required: true, default: 0 }) collateralDecimals !: number
  @account.Getter('tokenBalanceFunc') tokenBalanceFunc!: (tokenAddress: string) => TokenBalanceDirectoryItem | null
  @account.Action('updateTokenBalance') updateTokenBalance!: (params: { tokenAddress: string }) => Promise<void>
  @wallet.Action('updateNativeTokenBalance') updateNativeTokenBalance!: Function
  @wallet.Getter('availableNativeTokenBalance') availableNativeTokenBalance!: BigNumber | null
  @wallet.Getter('address') userAddress!: string | null
  @wallet.Getter('signer') signer!: ethers.Signer
  @account.Getter('allowanceFunc') allowanceFunc!: (tokenAddress: string, spender: string) => BigNumber
  @account.Action('updateAllowance') updateAllowance!: (params: { tokenAddress: string, spenderAddress: string, networkId?: SUPPORTED_NETWORK_ID }) => Promise<void>
  @perpetual.Action('updateLiquidityPool') updateLiquidityPool!: (liquidityPoolAddress: string) => Promise<void>


  get currentVisible() {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
  }

  private loadingBalance = false
  private loadingAllowance = false
  private approving = false
  private approveError: Error | null = null
  private donating: boolean = false

  private form = {
    amount: '',
  }
  private formRule = {
    amount: [
      { validator: this.validateInputNumber, trigger: 'change' },
      { validator: this.validateAmount, trigger: 'change' },
    ],
  }

  get isNativeToken() {
    if (!this.liquidityPoolStorage) {
      return false
    }
    return isNativeToken(this.liquidityPoolStorage.collateral)
  }

  get normalizeAmount() {
    const amount = new BigNumber(this.form.amount)
    return amount.isNaN() ? _0 : amount
  }

  get invalidAmount() {
    if (!this.walletCollateral) {
      return true
    }
    return this.normalizeAmount.gt(this.walletCollateral) || this.normalizeAmount.lte(_0)
  }

  get needApprove() {
    return this.allowance?.lt(this.normalizeAmount) || false
  }

  get allowance(): BigNumber | null {
    if (!this.tokenBalanceFunc || !this.liquidityPoolStorage) {
      return null
    }
    return this.allowanceFunc(this.liquidityPoolStorage.collateral, this.poolAddress)
  }

  get disabledDonate() {
    return this.normalizeAmount.lte(0) || this.normalizeAmount.isNaN() || this.invalidAmount
  }

  get disabledApprove() {
    return !this.needApprove || this.normalizeAmount.lte(0) || this.normalizeAmount.isNaN()
  }

  get steps() {
    const steps = [
      { label: this.$t('base.donate'), action: this.donate.bind(this) },
    ]

    if (this.needApprove) {
      steps.unshift({ label: this.$t('base.approve'), action: this.confirmApprove.bind(this) })
    }
    return steps
  }

  async confirmApprove() {
    await this.callChainFunc(async () => {
      this.approveError = null
      try {
        await this.approve()
      } catch (e) {
        this.approveError = e
        throw e
      }
    }, undefined, true)
  }

  async donate() {
    await this.callChainFunc(async () => {
      if (!this.liquidityPoolStorage) {
        return
      }
      await this.donateInsuranceFund(this.normalizeAmount, () => {
        this.currentVisible = false
      })
      await this.updateBalance()
      await this.updateAllowanceFunc()
    }, undefined, true)
  }

  validateInputNumber(rule: any, value: string, callback: Function) {
    if (value === '') {
      return
    }
    const valueFloat = Number(value)
    if (isNaN(valueFloat)) {
      callback(new Error(this.$t('commonErrors.inputError').toString()))
    } else if (valueFloat < 0) {
      callback(new Error(this.$t('commonErrors.inputError').toString()))
    } else {
      callback()
    }
  }

  validateAmount(rule: any, value: string, callback: Function) {
    if (!this.normalizeAmount || !this.walletCollateral) {
      callback()
      return
    }
    if (this.normalizeAmount.gt(this.walletCollateral) || this.normalizeAmount.lt(_0)) {
      callback(
        new Error(
              this.$t('commonErrors.exceedMaxAmountError', {
            max: this.walletCollateral.toFormat(this.collateralDecimals || 0),
          }).toString(),
        ),
      )
      return
    }
    callback()
  }

  get tokenBalanceInfo(): TokenBalanceDirectoryItem | null {
    if (!this.tokenBalanceFunc || !this.liquidityPoolStorage) {
      return null
    }
    return this.tokenBalanceFunc(this.liquidityPoolStorage.collateral)
  }

  get walletCollateral(): BigNumber | null {
    if (!this.collateralDecimals) {
      return null
    }
    const erc20Balance = this.tokenBalanceInfo?.balance
    // TODO wrap WETH
    // if (this.isNativeToken) {
    //   return this.availableNativeTokenBalance?.dp(this.collateralDecimals, BigNumber.ROUND_DOWN) || null
    // } else {
    return erc20Balance?.dp(this.collateralDecimals, BigNumber.ROUND_DOWN) || null
    // }
  }

  async updateBalance() {
    if (!this.liquidityPoolStorage || !this.userAddress) {
      return
    }
    this.loadingBalance = true
    // TODO wrap WETH
    // if (this.isNativeToken) {
    //   await this.updateNativeTokenBalance()
    // } else {
    await this.updateTokenBalance({ tokenAddress: this.liquidityPoolStorage.collateral })
    // }
    this.loadingBalance = false
  }

  async updateAllowanceFunc() {
    if (!this.liquidityPoolStorage || this.poolAddress === '') {
      return
    }
    this.loadingAllowance = true
    await this.updateAllowance({
      tokenAddress: this.liquidityPoolStorage.collateral,
      spenderAddress: this.poolAddress,
    })
    this.loadingAllowance = false
  }

  @Watch('currentVisible', { immediate: true })
  async onDialogViewChange() {
    if (!this.currentVisible) {
      return
    }
    await this.updateBalance()
    await this.updateAllowanceFunc()
  }


  onCloseDialog() {
    this.form.amount = ''
  }

  async approve(): Promise<ethers.providers.TransactionReceipt | undefined> {
    if (!this.signer || !this.liquidityPoolStorage || this.poolAddress === '') {
      return
    }
    this.approving = true
    try {
      const erc20Contract = getERC20Contract(this.liquidityPoolStorage.collateral, this.signer)
      const decimals = await erc20Decimals(erc20Contract)
      const promiseInstance = await approveToken(
        erc20Contract,
        this.poolAddress,
        new BigNumber(ALLOWANCE_AMOUNT),
        decimals,
      )
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.approve', {
          amount: '∞',
          token: this.collateralSymbol,
          symbol: ellipsisMiddle(this.poolAddress),
        }).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      return await transaction
    } catch (e) {
      console.error('approve', e)
      throw e
    } finally {
      this.approving = false
    }
  }

  async donateInsuranceFund(
    amount: BigNumber,
    transactionSucceeded: () => void,
  ): Promise<ethers.providers.TransactionReceipt | undefined> {
    if (this.poolAddress === '' || !this.signer || !this.liquidityPoolStorage) {
      return
    }
    this.donating = true
    try {
      const poolContract = getLiquidityPoolContract(this.poolAddress, this.signer)
      const gasLimit = gasLimitConfig.DONATE_INSURANCE_FUND_GAS_LIMIT
      const gas = await getGasStationTxParams(gasLimit)
      const promiseInstance = await donateInsuranceFund(poolContract, amount, gas)
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.donateInsuranceFund', {
          amount: amount.toFormat(this.collateralDecimals),
          token: this.collateralSymbol,
          symbol: ellipsisMiddle(this.poolAddress),
        }).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      const txResult = await transaction
      this.updateLiquidityPool(this.poolAddress)
      transactionSucceeded()
      return txResult
    } catch (e) {
      console.error('donate insurance fund', e)
      throw e
    } finally {
      this.donating = false
    }
  }
}
</script>

<style scoped lang="scss">
.donate-insurance-fund-dialog {
  ::v-deep {
    .el-dialog {
      min-height: 350px;

    }
  }

  .pair-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--mc-text-color);
    margin-bottom: 5px;

    .right {
      text-align: right;
    }

    .value {
      color: white;
    }

    .unit {
      display: inline-block;
      margin-left: 4px;
    }
  }

  .loading-box {
    width: 100%;
    height: 181px;

    ::v-deep {
      .mc-loading__mask {
        background: transparent !important;
      }
    }
  }

  .donate-body {
    padding-top: 49px;
    width: 400px;
    margin: auto;
  }

  .step-container {
    margin-top: 20px;
  }

  .footer-container {
    width: 400px;
    margin: 80px auto auto;

    .el-button {
      width: 100%;
    }
  }
}
</style>
