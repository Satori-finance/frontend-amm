import { Component, Mixins, Watch } from 'vue-property-decorator'
import BigNumber from 'bignumber.js'
import moment from 'moment'
import { ellipsisMiddle, momentFormatter } from '@/utils'
import { namespace } from 'vuex-class'
import {
  TradingMiningCurrentEpoch,
  TradingMiningEpochInfo,
  TradingMiningMultiChain,
} from '@/template/components/Mining/tradingMiningMixin'
import _ from 'lodash'
import { ErrorHandlerMixin } from '@/mixins'
import { ethers } from 'ethers'
import { Provider } from '@ethersproject/providers'
import { McbStakingFactory } from '@/assets/abi/TradingMining/McbStakingFactory'
import {
  ALLOWANCE_AMOUNT,
  SATORI_ADDRESS,
  NETWORK_ENV,
  NETWORK_PROVIDER_RPC_CONFIG,
  SUPPORTED_NETWORK_ID,
  TRADING_MINING_STAKE_CONTRACT_ADDRESS,
  TRADING_MINING_STAKE_CONTRACT_ADDRESS_CONFIG,
} from '@/const'
import { approveToken, DECIMALS, erc20Decimals, getERC20Contract, normalizeBigNumberish } from '@mcdex/mai3.js'
import { waitTransaction } from '@/utils/transaction'
import { DAO_STAKE_TOKEN_SYMBOL } from '@mcdex/mcdex-governance.js'
import { AccountTradingMiningMultiChainInfo, TotalTradingMiningInfo, TradingMiningMultiChainID } from '@/type'
import { queryAccountTradingMiningMultiChainInfo, queryTotalTradingMiningInfo } from '@/api/tradingMiningV2'
import { chainConfigs, currentChainConfig } from '@/config/chain'

const wallet = namespace('wallet')

@Component
export default class TradingMiningStakeMixin extends Mixins(ErrorHandlerMixin) {
  @wallet.Getter('isConnectedWallet') isConnectedWallet !: boolean
  @wallet.Getter('address') walletAddress !: string
  @wallet.Getter('provider') provider !: Provider
  @wallet.Getter('signer') signer !: ethers.Signer

  // status
  protected approving: boolean = false
  protected staking: boolean = false
  protected unstaking: boolean = false
  protected reStaking: boolean = false

  protected TradingMiningMultiChainID = TradingMiningMultiChainID

  protected selectedViewChain: SUPPORTED_NETWORK_ID = SUPPORTED_NETWORK_ID.BSC
  protected SUPPORTED_NETWORK_ID = SUPPORTED_NETWORK_ID

  protected currentEpochStart: boolean = false

  protected tradingMiningInfo: { [id: number]: AccountTradingMiningMultiChainInfo} = {}
  protected totalTradingMiningInfo: { [id: number]: TotalTradingMiningInfo } = {}

  protected lockPeriod: number = 0

  protected stakedInfo: {[id: number]: {
    stakedBalance: BigNumber
    unlockTimestamp: number
  }} = {}

  protected loadingData: boolean = true
  protected timeFormatter = 'YYYY-MM-DD HH:MM A'
  protected mTimeFormatter = 'YYYY-MM-DD HH:MM'
  protected walletBalance: BigNumber = new BigNumber(0)
  protected allowance: BigNumber = new BigNumber(0)
  protected isApproved: boolean = false

  activatedTab: 'stake' | 'unstake' = 'stake'

  stakeForm = {
    amount: '',
    amountProportion: 0
  }

  mounted() {
    this.checkCurrentEpochIsStart()
  }

  get viewChainOptions() {
    return TradingMiningMultiChain[currentChainConfig.chainID].map((item) => {
      return {
        label:  chainConfigs[item].chainName,
        value: item
      }
    })
  }

  get selectedChainStakedBalance() {
    return this.stakedInfo[this.selectedViewChain]?.stakedBalance || new BigNumber(0)
  }

  get selectedChainUnlockTimestamp() {
    return this.stakedInfo[this.selectedViewChain]?.unlockTimestamp || 0
  }

  get currentChainStakedBalance() {
    return this.stakedInfo[currentChainConfig.chainID]?.stakedBalance || new BigNumber(0)
  }

  get currentChainUnlockTimestamp() {
    return this.stakedInfo[currentChainConfig.chainID]?.unlockTimestamp || 0
  }

  get chainConfigs() {
    return chainConfigs
  }

  get currentEpoch() {
    return TradingMiningCurrentEpoch[NETWORK_ENV.CHAIN_ID]
  }

  get currentEpochInfo() {
    return TradingMiningEpochInfo[NETWORK_ENV.CHAIN_ID][this.currentEpoch]
  }

  get currentAccountInfo(): AccountTradingMiningMultiChainInfo | null {
    return this.tradingMiningInfo[this.currentEpoch] || null
  }

  get selectedChainIsCurrentChain() {
    return this.selectedViewChain === currentChainConfig.chainID
  }

  get restakeIsDisabled() {
    return this.reStaking || this.currentChainStakedBalance.isZero() || !this.selectedChainIsCurrentChain
  }

  get currentStakedToken(): BigNumber {
    let v: BigNumber = new BigNumber(0)
    Object.keys(this.stakedInfo).forEach((chainId) => {
      const item = this.stakedInfo[Number(chainId)]
      v = v.plus(item.stakedBalance)
    })
    return v
  }

  get currentStakedScore(): BigNumber {
    let v: BigNumber = new BigNumber(0)
    Object.keys(this.stakedInfo).forEach((chainId) => {
      const item = this.stakedInfo[Number(chainId)]
      v = v.plus(item.stakedBalance.times(this.computeUnlockTimeInfo(item.unlockTimestamp).day))
    })
    return v
  }

  get multiChainStakedScore() {
    let r: { [id: number]: BigNumber } = {}
    Object.keys(this.stakedInfo).forEach((chainId) => {
      const item = this.stakedInfo[Number(chainId)]
      r[Number(chainId)] = item.stakedBalance.times(this.computeUnlockTimeInfo(item.unlockTimestamp).day)
    })
    return r
  }

  get currentEpochAvgScore(): BigNumber {
    if (!this.currentAccountInfo) {
      return new BigNumber(0)
    }
    return new BigNumber(this.currentAccountInfo.averageStake[this.TradingMiningMultiChainID.TOTAL])
  }

  getAvgTimeRemainingDay(): number {
    const r = (Date.now() / 1000) - this.currentEpochInfo.startTimestamp
    return Math.ceil(r / 86400)
  }

  getAvgTimeRemainingMinute(): number {
    const r = (Date.now() / 1000) - this.currentEpochInfo.startTimestamp
    return Math.ceil(r / 60)
  }

  get normalStakeAmount(): BigNumber {
    return new BigNumber(this.stakeForm.amount)
  }

  get invalidStakeAmount(): boolean {
    return this.stakeForm.amount === '' || this.normalStakeAmount.isZero() || this.normalStakeAmount.isNaN()
  }

  get currentEstimatedRewards(): BigNumber {
    const proportion = this.currentAccountInfo?.proportion || 0
    const totalReward = this.currentEpochInfo.totalReward
    return totalReward.times(proportion)
  }

  get deltaNewMultiEstimatedScore(): {[chainId: number]: BigNumber} {
    // EstimatedScore = (1 - RemainEpochDays / UnlockTimeDays / 2) * CurrentStakingScore * RemainEpochMinutes
    let r: { [chainId: number]: BigNumber } = {}
    const nowTimestamp = Math.ceil(Date.now() / 1000)
    const remainEpochDays = Math.ceil((this.currentEpochInfo.endTimestamp - nowTimestamp) / 86400)
    const remainEpochMinutes = Math.ceil((this.currentEpochInfo.endTimestamp - nowTimestamp) / 60)
    const chainIdList = Object.keys(this.stakedInfo)
    for (let i = 0; i < chainIdList.length; i++) {
      const chainId = Number(chainIdList[i])
      const chainStakedInfo = this.stakedInfo[chainId]
      const currentStakingScore = this.deltaNewMultiChainStakingScore[chainId]
      let unlockTimeDays = Math.ceil((chainStakedInfo.unlockTimestamp - nowTimestamp) / 86400)
      if (unlockTimeDays < 0) {
        unlockTimeDays = 0
      }
      r[chainId] = new BigNumber(1).minus(remainEpochDays).div(unlockTimeDays).div(2)
        .times(currentStakingScore).times(remainEpochMinutes)
    }
    return r
  }


  get deltaNewMultiChainStakingScore(): {[chainId: number]: BigNumber} {
    let r: {[chainId: number]: BigNumber} = {}
    const nowTimestamp = Math.ceil(Date.now() / 1000)
    const chainIdList = Object.keys(this.stakedInfo)
    for (let i=0;i<chainIdList.length; i++) {
      const chainId = Number(chainIdList[i])
      const chainStakedInfo = this.stakedInfo[chainId]
      let unlockTimeDays = Math.ceil((chainStakedInfo.unlockTimestamp - nowTimestamp) / 86400)
      if (unlockTimeDays < 0) {
        unlockTimeDays = 0
      }
      r[chainId] = chainStakedInfo.stakedBalance.times(unlockTimeDays)
    }
    return r
  }

  get deltaNewAvgStakingScore(): BigNumber {
    // (CumulativeStakingScore + EstimatedScore) / TotalEpochMinutes
    let r: BigNumber = new BigNumber(0)
    const totalEpochMinutes = Math.ceil((this.currentEpochInfo.endTimestamp - this.currentEpochInfo.startTimestamp) / 60)
    const chainIdList = Object.keys(this.deltaNewMultiChainStakingScore)
    for (let i=0;i<chainIdList.length; i++) {
      const chainId = Number(chainIdList[i])
      r = r.plus(
        this.deltaNewMultiChainStakingScore[chainId].plus(this.deltaNewMultiChainStakingScore[chainId]).div(totalEpochMinutes)
      )
    }
    return r
  }

  get deltaNewTraderScore(): BigNumber {
    const fee = new BigNumber(this.currentAccountInfo?.daoFee[this.TradingMiningMultiChainID.TOTAL] || 0)
    const oi = new BigNumber(this.currentAccountInfo?.averageOI[this.TradingMiningMultiChainID.TOTAL]|| 0)
    const cFee = Math.pow(Number(fee.toFixed()), 0.7)
    const cOi = Math.pow(Number(oi.toFixed()), 0.3)
    const cStakingScore = Math.pow(Number(this.deltaNewAvgStakingScore.toFixed()), 0.3)
    return new BigNumber(cFee).times(cOi).times(cStakingScore)
  }

  get deltaNewEstimatedRewards(): BigNumber | null  {
    if (!this.totalTradingMiningInfo[this.currentEpoch]) {
      return null
    }
    const accountCurrentTraderScore = this.currentAccountInfo?.score || new BigNumber(0)
    const oldTotalTraderScore = this.totalTradingMiningInfo[this.currentEpoch].totalScore
    const newTotalTraderScore = this.deltaNewTraderScore.plus(oldTotalTraderScore)
    const proportion = this.deltaNewTraderScore.plus(accountCurrentTraderScore).div(newTotalTraderScore)
    return this.currentEpochInfo.totalReward.times(proportion)
  }

  get deltaNewEstimatedRewardsRate(): BigNumber | null {
    if (!this.deltaNewEstimatedRewards) {
      return null
    }
    if (this.currentEstimatedRewards.isZero()) {
      return new BigNumber(0)
    }
    return this.deltaNewEstimatedRewards.minus(this.currentEstimatedRewards)
      .div(this.currentEstimatedRewards).times(100)
  }

  get otherChainStakingScore(): BigNumber {
    let r: BigNumber = new BigNumber(0)
    const chainIdList = Object.keys(this.stakedInfo)
    for (let i=0; i< chainIdList.length; i++) {
      const chainId = Number(chainIdList[i])
      if (chainId === currentChainConfig.chainID) {
        continue
      }
      const chainStakedInfo = this.stakedInfo[chainId]
      const unlockInfo = this.computeUnlockTimeInfo(chainStakedInfo.unlockTimestamp)
      r = r.plus(chainStakedInfo.stakedBalance.times(unlockInfo.day))
    }
    return r
  }

  get deltaNewStakingScore(): BigNumber {
    if (this.invalidStakeAmount) {
      return this.currentStakedScore
    }
    let unlockTime = this.deltaUnlockTime
    const currentTime = Date.now() / 1000
    if (unlockTime < currentTime) {
      return this.currentStakedScore
    }
    const currentStakedInfo = this.stakedInfo[currentChainConfig.chainID]
    const stakedToken = currentStakedInfo?.stakedBalance || new BigNumber(0)
    let days = Math.ceil((unlockTime - currentTime) / 86400)
    days = days > 100 ? 100 : days
    const totalStakeMcb = stakedToken.plus(this.normalStakeAmount)
    return new BigNumber(days).times(totalStakeMcb).plus(this.otherChainStakingScore)
  }

  get deltaNewStakingScoreRate(): BigNumber {
    if (this.currentStakedScore.isZero()) {
      return new BigNumber(0)
    }
    return this.deltaNewStakingScore.minus(this.currentStakedScore)
      .div(this.currentStakedScore).times(100)
  }

  get deltaUnlockTime(): number {
    if (this.stakeForm.amount === '' || isNaN(Number(this.stakeForm.amount))) {
      return 0
    }
    const eta = this.currentChainUnlockTimestamp
    if (this.invalidStakeAmount) {
      return eta
    }
    const current = Date.now() / 1000
    const remaining = eta > current ? eta - current : 0
    if (remaining == 0) {
      return current + this.lockPeriod
    }
    return current +
      (this.currentChainStakedBalance.toNumber() * remaining + this.normalStakeAmount.toNumber() * this.lockPeriod) /
      (this.currentChainStakedBalance.toNumber() + this.normalStakeAmount.toNumber())
  }

  computeUnlockTimeInfo(unlockTime: number): {
    day: number,
    hour: number
  } {
    let r = {
      day: 0,
      hour: 0
    }
    const d = unlockTime - (Date.now() / 1000)
    if (d <= 0) {
      return r
    }
    if (d < 86400) {
      return {
        ...r,
        hour: Math.ceil(d/3600)
      }
    }
    return {
      ...r,
      day: Math.ceil(d/86400)
    }
  }

  get deltaUnlockTimeInfo(): {
    day: number,
    hour: number,
  } {
    return this.computeUnlockTimeInfo(this.deltaUnlockTime)
  }

  get selectedChainUnlockTimeInfo(): {
    day: number,
    hour: number
  } {
   return this.computeUnlockTimeInfo(this.selectedChainUnlockTimestamp)
  }

  get unstakeToolTip(): string {
    const time = moment.unix(this.selectedChainUnlockTimestamp).local()
    return this.$t(
      'tradingMining.stakeDialog.unstakePromp',
      {
        time: momentFormatter(time, this.timeFormatter)
      }).toString()
  }

  get mcbAddress() {
    switch (NETWORK_ENV.CHAIN_ID) {
      case SUPPORTED_NETWORK_ID.ARB_TESTNET:
        return '0x292f76B159039Df190660f8E4A1535bb183B4592'
    }
    return SATORI_ADDRESS
  }

  checkIsApproved() {
    if (this.invalidStakeAmount && this.walletBalance.isZero()) {
      return true
    }
    this.isApproved = this.allowance.gt(this.normalStakeAmount) || this.allowance.gt(this.walletBalance)
  }

  protected initialUpdateAccountDebounce = _.debounce(() => {
    this.initialAccountInfo()
  }, 200)

  async initialAccountInfo() {
    this.loadingData = true
    await this.updateAccountInfo()
    this.checkIsApproved()
    this.loadingData = false
  }

  async updateAccountInfo() {
    if (!this.currentEpochStart) {
      return
    }
    await Promise.all([
      this.updateAccountInfoFromChain(),
      this.updateAccountInfoFromServer()
    ])
  }

  async updateAccountInfoFromChain() {
    if (!this.walletAddress) {
      return
    }
    if (this.provider) {
      await this.callChainReadFunc(async () => {
        const mcbErc20Contract = getERC20Contract(this.mcbAddress, this.provider)
        const [ erc20Decimals, balanceOf, allowance ] = await Promise.all([
          mcbErc20Contract.decimals(),
          mcbErc20Contract.balanceOf(this.walletAddress),
          mcbErc20Contract.allowance(this.walletAddress, TRADING_MINING_STAKE_CONTRACT_ADDRESS),
        ])
        this.walletBalance = normalizeBigNumberish(balanceOf).shiftedBy(-erc20Decimals)
        this.allowance = normalizeBigNumberish(allowance).shiftedBy(-erc20Decimals)
      })
    }
    // update multi chain data
    for (let index in TradingMiningMultiChain[currentChainConfig.chainID]) {
      try {
        const chainId = TradingMiningMultiChain[currentChainConfig.chainID][index]
        const chainProvider = new ethers.providers.StaticJsonRpcProvider({
          url: NETWORK_PROVIDER_RPC_CONFIG[chainId],
          timeout: 30000,
        })
        const mcbStakeContract = McbStakingFactory.connect(
          TRADING_MINING_STAKE_CONTRACT_ADDRESS_CONFIG[chainId], chainProvider)
        const accountStakeInfo = await mcbStakeContract.stakedBalances(this.walletAddress)

        this.$set(this.stakedInfo, chainId, {
          unlockTimestamp: normalizeBigNumberish(accountStakeInfo.unlockTime).toNumber(),
          stakedBalance: normalizeBigNumberish(accountStakeInfo.balance).shiftedBy(-DECIMALS)
        })
      } catch (e) {
        console.warn("update trading mining multi chain data fail,", e)
      }
    }
  }

  async updateAccountInfoFromServer() {
    if (!this.walletAddress) {
      return
    }
    try {
      const result = await queryAccountTradingMiningMultiChainInfo(this.walletAddress)
      if (result) {
        this.tradingMiningInfo = result.data
      }
    } catch (e) {
      console.warn('update account trading mining data fail', e)
    }
  }

  async updateEpochTotalData() {
    try {
      const result = await queryTotalTradingMiningInfo()
      if (result) {
        this.totalTradingMiningInfo = result.data
      }
    } catch (e) {
      console.warn('update epoch total trading mining data fail', e)
    }
  }

  async updateBaseInfo() {
    if (!this.currentEpochStart) {
      return
    }
    if (!this.provider) {
      return
    }
    await this.callChainReadFunc(async () => {
      const mcbStakeContract = McbStakingFactory.connect(TRADING_MINING_STAKE_CONTRACT_ADDRESS, this.provider)
      this.lockPeriod = normalizeBigNumberish(await mcbStakeContract.lockPeriod()).toNumber()
    })
    await this.updateEpochTotalData()
  }

  onStakeSuccessReset() {
    this.stakeForm.amount = ''
    this.stakeForm.amountProportion = 0
  }

  async onApproveEvent() {
    if (!this.signer || !this.walletAddress || this.approving) {
      return null
    }
    this.approving = true
    try {
      const erc20Contract = getERC20Contract(this.mcbAddress, this.signer)
      const decimals = await erc20Decimals(erc20Contract)
      const promiseInstance = await approveToken(
        erc20Contract,
        TRADING_MINING_STAKE_CONTRACT_ADDRESS,
        new BigNumber(ALLOWANCE_AMOUNT),
        decimals,
      )
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.approve', {
          amount: '∞',
          token: 'SATORI',
          symbol: ellipsisMiddle(TRADING_MINING_STAKE_CONTRACT_ADDRESS),
        }).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      const transactionResult = await transaction
      this.updateAccountInfo()
      return transactionResult
    } catch (e) {
      console.error('approve', e)
      throw e
    } finally {
      this.approving = false
    }
  }

  async onStakeEvent() {
    if (!this.signer || !this.walletAddress || this.invalidStakeAmount || this.staking) {
      return null
    }
    this.staking = true
    try {
      const stakeContract = McbStakingFactory.connect(TRADING_MINING_STAKE_CONTRACT_ADDRESS, this.signer)
      const promiseInstance = await stakeContract.stake(this.normalStakeAmount.shiftedBy(DECIMALS).toFixed())
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.stake', {
          amount: this.normalStakeAmount.toFixed(2),
          token: 'SATORI',
          poolId: ellipsisMiddle(TRADING_MINING_STAKE_CONTRACT_ADDRESS),
        }).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      const transactionResult =  await transaction
      window.setTimeout(() => {
        this.updateAccountInfo()
      }, 1000)
      this.onStakeSuccessReset()
      return transactionResult
    } catch (e) {
      console.error('stake', e)
      throw e
    } finally {
      this.staking = false
    }
  }

  async onUnstakeEvent() {
    if (!this.signer || !this.walletAddress || this.currentChainStakedBalance.lte(0) || this.currentChainUnlockTimestamp === 0
      || this.currentChainUnlockTimestamp >= Date.now() / 1000 || this.unstaking) {
      return null
    }
    this.unstaking = true
    try {
      const stakeContract = McbStakingFactory.connect(TRADING_MINING_STAKE_CONTRACT_ADDRESS, this.signer)
      const promiseInstance = await stakeContract.redeem()
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.unstake', {
          amount: this.currentChainStakedBalance.toFixed(2),
          token: DAO_STAKE_TOKEN_SYMBOL,
          poolId: ellipsisMiddle(TRADING_MINING_STAKE_CONTRACT_ADDRESS),
        }).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      const transactionResult =  await transaction
      window.setTimeout(() => {
        this.updateAccountInfo()
      }, 1000)
      return transactionResult
    } catch (e) {
      console.error('unstake', e)
      throw e
    } finally {
      this.unstaking = false
    }
  }

  async onReStakeTokenEvent() {
    if (!this.signer || !this.walletAddress || this.currentChainStakedBalance.lte(0) || this.reStaking) {
      return null
    }
    this.reStaking = true
    try {
      const stakeContract = McbStakingFactory.connect(TRADING_MINING_STAKE_CONTRACT_ADDRESS, this.signer)
      const promiseInstance = await stakeContract.restake()
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.reStake').toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      const transactionResult =  await transaction
      window.setTimeout(() => {
        this.updateAccountInfo()
      }, 1000)
      return transactionResult
    } catch (e) {
      console.error('reStake', e)
    } finally {
      this.reStaking = false
    }
  }

  checkCurrentEpochIsStart() {
    const currentTimestamp = Date.now() / 1000
    if (this.currentEpochInfo.startTimestamp > currentTimestamp) {
      this.currentEpochStart = false
    } else {
      this.currentEpochStart = true
    }
  }

  @Watch('walletAddress')
  onAccountChange() {
    this.initialUpdateAccountDebounce()
  }

  @Watch('provider')
  onProviderChange() {
    this.updateBaseInfo()
    this.initialUpdateAccountDebounce()
  }

  @Watch('normalStakeAmount')
  onStakeAmountChange() {
    this.checkIsApproved()
  }
}
