import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { McbCrowdsaleAccountStorage, McbCrowdsaleStorage } from '@/utils/SATORICrowdsale/type'
import { ethers, Signer } from 'ethers'
import { ButtonState, TokenBalanceDirectoryItem } from '@/type'
import BigNumber from 'bignumber.js'
import { namespace } from 'vuex-class'
import { ellipsisMiddle, padLeft } from '@/utils'
import { getGasStationTxParams } from '@/utils/gasPrice'
import { McStepStatus } from '@/components'
import {
  ALLOWANCE_AMOUNT,
  L1_NETWORK_ID,
  SATORI_CROWD_SALE_ADDRESS,
  SATORI_CROWD_SALE_SATORI,
  SATORI_CROWD_SALE_USDC,
  SUPPORTED_NETWORK_ID,
} from '@/constants'
import { _0, approveToken, erc20Decimals, getERC20Contract } from '@mcdex/mai3.js'
import { gasLimitConfig } from '@/config/gas'
import { getMcbCrowdsaleContract, settle, subscribe } from '@/utils/SATORICrowdsale'
import { waitTransaction } from '@/utils/transaction'

const wallet = namespace('wallet')
const account = namespace('account')

@Component
export class StakeMixin extends Vue {
  @wallet.Getter('signer') signer!: Signer | null
  @wallet.Getter('address') address!: string | null
  @account.Getter('tokenBalanceFunc') tokenBalanceFunc!: (tokenAddress: string) => TokenBalanceDirectoryItem | null
  @account.Getter('allowanceFunc') allowanceFunc!: (tokenAddress: string, spender: string) => BigNumber
  @account.Action('updateTokenBalance') updateTokenBalance!: (params: { tokenAddress: string }) => Promise<void>
  @account.Action('updateAllowance') updateAllowance!: (params: {
    tokenAddress: string,
    spenderAddress: string,
    networkId?: SUPPORTED_NETWORK_ID,
  }) => Promise<void>

  @Prop({ default: () => null }) mcbCrowdsaleAccountStorage!: McbCrowdsaleAccountStorage | null
  @Prop({ default: () => null }) mcbCrowdsaleStorage!: McbCrowdsaleStorage | null

  protected unstaking = false
  protected confirmedDoc = false
  protected timer = 0
  protected now = Date.now()
  protected activeStep = 0
  protected unstakeState: ButtonState = ''
  protected stepStatus = McStepStatus.NONE
  protected subscribeForm = {
    amount: '',
  }

  protected steps: Array<{ labelKey: string, type: 'approveSATORI' | 'approveUSDC' | 'subscribe' }> = []

  get normalizeSubscribeAmount(): BigNumber | null {
    const num = new BigNumber(this.subscribeForm.amount)
    return num.isNaN() ? null : num
  }

  get currentStep() {
    return this.steps[this.activeStep] || null
  }

  get isSubscribable() {
    return !!this.mcbCrowdsaleStorage?.isSubscribable
  }

  get isSettleable() {
    return !!this.mcbCrowdsaleStorage?.isSettleable
  }

  get isAccountSettled() {
    return !!this.mcbCrowdsaleAccountStorage?.isAccountSettled
  }

  get unlockTimeLeft() {
    if (!this.mcbCrowdsaleStorage) {
      return '--'
    }
    const minuteDuration = 1000 * 60
    const hourDuration = minuteDuration * 60
    const dayDuration = hourDuration * 24
    const milliseconds = this.mcbCrowdsaleStorage.unlockTime * 1000 - this.now
    const day = Math.max(Math.floor(milliseconds / dayDuration), 0)
    const hour = Math.max(Math.floor(milliseconds % dayDuration / hourDuration), 0)
    const minutes = Math.max(Math.floor(milliseconds % hourDuration / minuteDuration), 0)
    return `${padLeft(day, 2)}D ${padLeft(hour, 2)}H ${padLeft(minutes, 2)}M`
  }

  get needStakeSATORI(): BigNumber | null {
    if (!this.normalizeSubscribeAmount) {
      return null
    }
    return this.mcbCrowdsaleStorage?.mcbDepositRate.times(this.normalizeSubscribeAmount) || null
  }

  get needStakeUSDC(): BigNumber | null {
    if (!this.normalizeSubscribeAmount) {
      return null
    }
    return this.mcbCrowdsaleStorage?.usdcDepoistRate.times(this.normalizeSubscribeAmount) || null
  }

  get mcbAddress() {
    return SATORI_CROWD_SALE_SATORI || this.mcbCrowdsaleStorage?.mcbAddress || null
  }

  get usdcAddress() {
    return SATORI_CROWD_SALE_USDC || this.mcbCrowdsaleStorage?.usdcAddress || null
  }


  get mcbBalance() {
    if (this.tokenBalanceFunc && this.mcbAddress) {
      return this.tokenBalanceFunc(this.mcbAddress)?.balance || null
    } else {
      return null
    }
  }

  get usdcBalance() {
    if (this.tokenBalanceFunc && this.usdcAddress) {
      return this.tokenBalanceFunc(this.usdcAddress)?.balance || null
    } else {
      return null
    }
  }

  get maxSubscribeAmount() {
    if (!this.mcbCrowdsaleStorage || !this.mcbBalance || !this.usdcBalance) {
      return _0
    }
    const maxBySATORI = this.mcbBalance.div(this.mcbCrowdsaleStorage.mcbDepositRate)
    const maxByUSDC = this.usdcBalance.div(this.mcbCrowdsaleStorage.usdcDepoistRate)
    return BigNumber.min(maxBySATORI, maxByUSDC)
  }

  get unstakableSATORI(): BigNumber {
    return this.isAccountSettled || !this.mcbCrowdsaleAccountStorage ? _0 : this.mcbCrowdsaleAccountStorage.stakedSATORI
  }

  get unstakaleUSDC(): BigNumber {
    return this.isAccountSettled || !this.mcbCrowdsaleAccountStorage ? _0 : this.mcbCrowdsaleAccountStorage.stakedUSDC.minus(this.mcbCrowdsaleAccountStorage.cost)
  }

  get disableAction() {
    return !this.confirmedDoc || !!this.normalizeSubscribeAmount?.lte(0) || !this.currentStep || this.stepStatus === McStepStatus.FAILED
  }

  get disableUnstake() {
    return !this.isSettleable || this.isAccountSettled || !!this.unstakableSATORI?.lte(0)
  }

  mounted() {
    this.timer = window.setInterval(() => {
      this.now = Date.now()
    }, 60000)
  }

  destroyed() {
    window.clearInterval(this.timer)
  }

  protected setSubscribeMax() {
    this.subscribeForm.amount = this.maxSubscribeAmount.dp(18, BigNumber.ROUND_DOWN).toFixed()
  }

  protected onSubscribeEvent() {
    if (!this.currentStep || !this.normalizeSubscribeAmount) {
      return
    }
    switch (this.currentStep.type) {
      case 'approveSATORI':
        this.approveSATORI()
        break
      case 'approveUSDC':
        this.approveUSDC()
        break
      default:
        this.stake(this.normalizeSubscribeAmount)
        break
    }
  }

  protected async approveSATORI() {
    if (!this.mcbAddress) {
      return
    }
    await this.approve(this.mcbAddress, 'SATORI', {
      onApproveStart: () => {
        this.stepStatus = McStepStatus.WAIT
      },
      onApproveSuccess: () => {
        this.activeStep++
        this.stepStatus = McStepStatus.NONE
        this.updateAllowance({
          tokenAddress: this.mcbAddress as string,
          spenderAddress: SATORI_CROWD_SALE_ADDRESS,
          networkId: L1_NETWORK_ID,
        })
      },
      onApproveFailed: () => {
        this.stepStatus = McStepStatus.FAILED
      },
    })
  }

  protected async approveUSDC() {
    if (!this.usdcAddress) {
      return
    }
    await this.approve(this.usdcAddress, 'USDC', {
      onApproveStart: () => {
        this.stepStatus = McStepStatus.WAIT
      },
      onApproveSuccess: () => {
        this.activeStep++
        this.stepStatus = McStepStatus.NONE
        this.updateAllowance({
          tokenAddress: this.usdcAddress as string,
          spenderAddress: SATORI_CROWD_SALE_ADDRESS,
          networkId: L1_NETWORK_ID,
        })
      },
      onApproveFailed: () => {
        this.stepStatus = McStepStatus.FAILED
      },
    })
  }

  protected onUnstakeEvent() {
    this.unstake()
  }

  @Watch('normalizeSubscribeAmount', { immediate: true })
  setSteps() {
    if (!this.needStakeSATORI || !this.needStakeUSDC || !this.mcbAddress || !this.usdcAddress || !this.normalizeSubscribeAmount || this.normalizeSubscribeAmount.lte(0)) {
      return
    }
    this.activeStep = 0
    this.stepStatus = McStepStatus.NONE
    const result = new Array<{ labelKey: string, type: 'approveSATORI' | 'approveUSDC' | 'subscribe' }>()
    if (this.needStakeSATORI.gt(this.allowanceFunc(this.mcbAddress, SATORI_CROWD_SALE_ADDRESS))) {
      result.push({ labelKey: this.$t('mcbSale.approveSATORI').toString(), type: 'approveSATORI' })
    }
    if (this.needStakeUSDC.gt(this.allowanceFunc(this.usdcAddress, SATORI_CROWD_SALE_ADDRESS))) {
      result.push({ labelKey: this.$t('mcbSale.approveUSDC').toString(), type: 'approveUSDC' })
    }
    result.push({ labelKey: this.$t('mcbSale.stakeSATORIAndUSDC').toString(), type: 'subscribe' })
    this.steps = result
  }

  @Watch('mcbCrowdsaleStorage', { immediate: true })
  @Watch('address', { immediate: true })
  protected async updateTokenInfo() {
    if (!this.address || !this.mcbAddress || !this.usdcAddress) {
      return
    }

    await Promise.all([
      this.updateTokenBalance({ tokenAddress: this.mcbAddress }),
      this.updateTokenBalance({ tokenAddress: this.usdcAddress }),
      this.updateAllowance({
        tokenAddress: this.mcbAddress,
        spenderAddress: SATORI_CROWD_SALE_ADDRESS,
        networkId: L1_NETWORK_ID,
      }),
      this.updateAllowance({
        tokenAddress: this.usdcAddress,
        spenderAddress: SATORI_CROWD_SALE_ADDRESS,
        networkId: L1_NETWORK_ID,
      }),
    ])
  }

  async approve(
    tokenAddress: string,
    collateralSymbol: string,
    params: {
      onApproveStart?: Function,
      onTransactionStart?: Function,
      onApproveSuccess?: Function,
      onApproveFailed?: Function,
      onApproveEnd?: Function,
    },
  ): Promise<ethers.providers.TransactionReceipt | null> {
    if (!this.signer) {
      return null
    }
    if (params.onApproveStart) {
      params.onApproveStart()
    }
    try {
      const erc20Contract = getERC20Contract(tokenAddress, this.signer)
      const decimals = await erc20Decimals(erc20Contract)
      const promiseInstance = await approveToken(erc20Contract, SATORI_CROWD_SALE_ADDRESS, new BigNumber(ALLOWANCE_AMOUNT), decimals)
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.approve', {
          amount: '∞',
          token: collateralSymbol,
          symbol: ellipsisMiddle(SATORI_CROWD_SALE_ADDRESS),
        }).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      if (params.onTransactionStart) {
        params.onTransactionStart()
      }
      const transactionResult = await transaction
      if (params.onApproveSuccess) {
        params.onApproveSuccess()
      }
      return transactionResult
    } catch (e) {
      console.error('approve', e)
      if (params.onApproveFailed) {
        params.onApproveFailed()
      }
      throw e
    } finally {
      if (params.onApproveEnd) {
        params.onApproveEnd()
      }
    }
  }

  async stake(
    amount: BigNumber,
    onTransactionStart: () => void = () => {
    },
  ): Promise<ethers.providers.TransactionReceipt | null> {
    if (!this.signer) {
      return null
    }
    this.stepStatus = McStepStatus.WAIT
    try {
      const contract = getMcbCrowdsaleContract(this.signer)
      const gasLimit = gasLimitConfig.SUBSCRIBE_SATORI_GAS_LIMIT
      const gas = await getGasStationTxParams(gasLimit)
      const promiseInstance = await subscribe(contract, amount, gas)
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.subscribeSATORI', {
          amount: amount.toFormat(2),
          stakeSATORI: this.needStakeSATORI!.toFormat(2),
          stakeUSDC: this.needStakeUSDC!.toFormat(2),
        }).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      onTransactionStart()
      const transactionResult = await transaction
      this.setSteps()
      this.$emit('staked')
      return transactionResult
    } catch (e) {
      console.error('stake', e)
      this.stepStatus = McStepStatus.FAILED
      throw e
    }
  }

  async unstake(): Promise<ethers.providers.TransactionReceipt | null> {
    if (!this.signer || !this.address) {
      return null
    }
    this.unstaking = true
    this.unstakeState = 'loading'
    try {
      const contract = getMcbCrowdsaleContract(this.signer)
      const gasLimit = gasLimitConfig.SETTLE_SATORI_GAS_LIMIT
      const gas = await getGasStationTxParams(gasLimit)
      const promiseInstance = await settle(contract, this.address, gas)
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.crowdsaleUnstakeAll', {
          mcbAmount: this.unstakableSATORI.toFormat(2),
          usdcAmount: this.unstakaleUSDC.toFormat(2),
        }).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      this.unstakeState = 'success'
      const transactionResult = await transaction
      this.$emit('unstaked')
      return transactionResult
    } catch (e) {
      this.unstakeState = 'fail'
      console.error('unstake', e)
      throw e
    } finally {
      this.unstaking = false
    }
  }
}
