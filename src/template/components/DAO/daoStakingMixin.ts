import { Component, Mixins, Watch } from 'vue-property-decorator'
import { Provider } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import {
  _0,
  approveToken,
  DECIMALS,
  erc20Decimals,
  erc20Name,
  getERC20Contract,
  normalizeBigNumberish,
} from '@mcdex/mai3.js'
import {
  CHAIN_ID_TO_DAO_MINING_ADDRESS,
  CHAIN_ID_TO_DAO_XSATORI_ADDRESS,
  DAO_STAKE_TOKEN_SYMBOL,
  getRewardDistributionContract,
  getXmcbContract,
  stakeSATORI,
  unstakeSATORI,
} from '@mcdex/mcdex-governance.js'
import { namespace } from 'vuex-class'
import { ClaimMiningRewardMixin } from '@/template/components/Mining/claimMiningRewardMixin'
import { ALLOWANCE_AMOUNT, DAOUnstakePenalty, SATORI_ADDRESS, SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/constants'
import { ButtonState, TokenBalanceDirectoryItem } from '@/type'
import { ethers } from 'ethers'
import { ellipsisMiddle, nullIfNotDeployed } from '@/utils'
import _ from 'lodash'
import { currentChainConfig } from '@/config/chain'
import { DAO_GOVERNANCE_EVENT, MINING_EVENT, VUE_EVENT_BUS } from '@/event'
import { waitTransaction } from '@/utils/transaction'

const wallet = namespace('wallet')
const account = namespace('account')
const price = namespace('price')

export interface daoClaimableItem {
  tokenName: string | null
  tokenAddress: string | null
  tokenDecimals: number | null
  value: string
}

@Component
export class DaoStakingMixin extends Mixins(ClaimMiningRewardMixin) {
  @wallet.Getter('provider') provider !: Provider
  @wallet.Getter('providerL1') providerL1 !: Provider
  @wallet.Getter('signer') signer!: ethers.Signer
  @wallet.Getter('address') userAddress !: string | null
  @wallet.Getter('isConnectedWallet') isConnectedWallet !: boolean
  @account.Getter('tokenBalanceFunc') tokenBalanceFunc!: (tokenAddress: string) => TokenBalanceDirectoryItem | null
  @account.Action('updateTokenBalance') updateTokenBalance!: (params: { tokenAddress: string }) => Promise<void>
  @account.Action('updateAllowance') updateAllowance!: (params: { tokenAddress: string, spenderAddress: string, networkId?: SUPPORTED_NETWORK_ID }) => Promise<void>
  @account.Getter('allowanceFunc') allowanceFunc!: (tokenAddress: string, spender: string) => BigNumber
  @price.Getter('tokenPriceFunc') tokenPriceFunc!: (token: string) => BigNumber | null
  @price.Action('updateTokenPrice') updateTokenPrice!: (tokens: string[]) => Promise<void>

  protected xmcbAddress: string = ''
  protected currentBlockNumber = 0
  protected miningApy: BigNumber = new BigNumber('0')
  protected myShareBalance: BigNumber = new BigNumber('0')
  protected totalShareSupply: BigNumber = new BigNumber('0')
  protected myShareRate: BigNumber = new BigNumber('0')
  protected unstakePenalty: BigNumber = new BigNumber(DAOUnstakePenalty).times(100)
  protected rewardValuePerDayUSD: BigNumber = new BigNumber('0')
  protected claimableTokens: Array<daoClaimableItem> = []
  protected liveRewardTokens: Array<string> = []

  protected loading: boolean = false
  protected approving: boolean = false
  protected staking: boolean = false
  protected unstaking: boolean = false
  private approveState: ButtonState = ''
  private stakeSATORIState: ButtonState = ''
  private unstakeSATORIState: ButtonState = ''

  mounted() {
    this.updateTokenPrice([SATORI_ADDRESS])
    this.xmcbAddress = TARGET_NETWORK_ID === SUPPORTED_NETWORK_ID.BSC ? SATORI_ADDRESS : CHAIN_ID_TO_DAO_XSATORI_ADDRESS[TARGET_NETWORK_ID] // todo delete

    VUE_EVENT_BUS.on(MINING_EVENT.SATORIStakingRefreshAccount, () => {
      this.updateUserDataDebounce()
    })
  }

  destroyed() {
    VUE_EVENT_BUS.off(MINING_EVENT.SATORIStakingRefreshAccount)
  }

  get myStakeBalance() {
    return this.myShareBalance
  }

  get myShare() {
    return this.myShareRate
  }

  get walletBalance(): BigNumber | null {
    const erc20Balance = this.daoTokenBalanceInfo?.balance
    return erc20Balance?.dp(2, BigNumber.ROUND_DOWN) || null
  }

  get daoTokenBalanceInfo(): TokenBalanceDirectoryItem | null {
    if (!this.tokenBalanceFunc) {
      return null
    }
    return this.tokenBalanceFunc(SATORI_ADDRESS)
  }

  get claimIsDisabled(): boolean {
    if (this.claimableTokens.length === 0 || this.isWrongNetwork ||
      !this.isConnectedWallet || this.claiming) {
      return true
    }
    return this.claimableTokens.reduce(
      (total, currentValue) => {
        return new BigNumber(total).plus(new BigNumber(currentValue.value))
      }, new BigNumber(0)).lte(0) ? true : false
  }

  get mcbPrice() {
    return this.tokenPriceFunc(SATORI_ADDRESS)
  }

  get allowance() {
    if (!this.allowanceFunc) {
      return _0
    }
    return this.allowanceFunc(SATORI_ADDRESS, this.xmcbAddress)
  }

  get isApproved(): boolean {
    return !this.allowance.isZero()
  }

  @Watch('provider', { immediate: true })
  @Watch('mcbPrice', { immediate: true })
  @Watch('rewardValuePerDay')
  async computeMiningApy() {
    if (!this.provider || !this.mcbPrice || this.xmcbAddress === '') {
      return
    }
    const erc20Contract = getERC20Contract(this.xmcbAddress, this.provider)
    const xmcbTotalSupply = normalizeBigNumberish(await erc20Contract.totalSupply()).shiftedBy(-DECIMALS)
    if (!this.mcbPrice || !xmcbTotalSupply) {
      return
    }
    const poolTotalValueUSD = xmcbTotalSupply.times(this.mcbPrice)
    this.miningApy = this.rewardValuePerDayUSD.times(365).times(100).div(poolTotalValueUSD)
  }

  async miningRewardAmount(tokenAddress: string, daoMiningAddress: string, rewardTokenDecimals: number): Promise<BigNumber> {
    const reward = await this.callChainReadFunc(async () => {
      if (!this.provider || !this.userAddress || daoMiningAddress === '') {
        return new BigNumber(0)
      }
      const daoContract = getRewardDistributionContract(
        daoMiningAddress,
        this.provider
      )
      return await daoContract.callStatic.earned(tokenAddress, this.userAddress)
    })
    return normalizeBigNumberish(reward).shiftedBy(-rewardTokenDecimals)
  }

  async updateUserShareRate() {
    await this.callChainReadFunc(async () => {
      if (!this.provider || !this.userAddress) {
        return this.myShareRate = new BigNumber(0)
      }
      const erc20Contract = getERC20Contract(this.xmcbAddress, this.provider)
      const balanceOf = normalizeBigNumberish((await erc20Contract.balanceOf(this.userAddress))).shiftedBy(-DECIMALS)
      this.myShareBalance = balanceOf
      this.myShareRate = balanceOf.div(this.totalShareSupply).times(100)
    })
  }

  async updateUserBalance() {
    await this.callChainReadFunc(async () => {
      await this.updateTokenBalance({ tokenAddress: SATORI_ADDRESS })
    })
  }

  async updateAllowanceInfo() {
    await this.updateAllowance({
      tokenAddress: SATORI_ADDRESS,
      spenderAddress: this.xmcbAddress,
    })
  }

  private updateUserDataDebounce = _.debounce(async () => {
    this.loading = true
    await Promise.all([
      this.updateUserShareRate(),
      this.updateUserBalance(),
      this.updateAllowanceInfo(),
      this.updateUserClaimList()
    ])
    this.loading = false
  }, 200)

  @Watch('provider', { immediate: true })
  @Watch('userAddress', { immediate: true })
  updateUserData() {
    if (!this.userAddress || !this.provider) {
      return
    }
    this.updateUserDataDebounce()
  }

  private updateDataDebounce = _.debounce(async () => {
    this.loading = true
    await Promise.all([
      this.updateDaoStakingInfo(),
    ])
    this.loading = false
  }, 200)

  @Watch('provider', { immediate: true })
  @Watch('userAddress', { immediate: true })
  async updateData() {
    if (!this.provider) {
      return
    }
    if (this.providerL1) {
      this.currentBlockNumber = await this.providerL1.getBlockNumber()
    }
    this.updateDataDebounce()
  }

  @Watch('xmcbAddress', { immediate: true })
  async updateTotalShareSupply() {
    if (!this.provider || !this.xmcbAddress) {
      return
    }
    const erc20Contract = getERC20Contract(this.xmcbAddress, this.provider)
    this.totalShareSupply = normalizeBigNumberish(await erc20Contract.totalSupply()).shiftedBy(-DECIMALS)
  }

  async updateDaoStakingInfo() {
    if (!this.provider) {
      return
    }
    const rewardDistributionContract = getRewardDistributionContract(CHAIN_ID_TO_DAO_MINING_ADDRESS[TARGET_NETWORK_ID], this.provider)
    const rewardTokens = await rewardDistributionContract.getRewardTokens()

    let rewardValuePerDayUSD = new BigNumber(0)

    let tmpClaimableTokens: daoClaimableItem[] = []
    let tmpLiveRewardTokens: string[] = []

    for (let i in rewardTokens) {
      const rewardTokenAddress: string = rewardTokens[i]
      const erc20Contract = getERC20Contract(rewardTokenAddress, this.provider)
      const [
        rewardTokenDecimals,
        rewardTokenName
      ] = await Promise.all([
        erc20Decimals(erc20Contract).catch((e: Error) => nullIfNotDeployed(e)),
        erc20Name(erc20Contract).catch((e: Error) => nullIfNotDeployed(e)),
      ])
      if (!rewardTokenDecimals) {
        continue
      }
      const rewardPlan = await rewardDistributionContract.getRewardPlan(rewardTokenAddress)
      const periodFinish = rewardPlan['0']
      if (periodFinish.lt(this.currentBlockNumber)) {
        continue
      }
      const rewardRate = new BigNumber(rewardPlan['1'].toString()).shiftedBy(-rewardTokenDecimals)
      // live reward tokens
      tmpLiveRewardTokens.push(rewardTokenAddress)
      await this.updateTokenPrice([rewardTokenAddress])
      const rewardTokenPrice = this.tokenPriceFunc(rewardTokenAddress)
      if (rewardTokenPrice) {
        const rewardTokenValuePerDayUSD = rewardTokenPrice.times(rewardRate.toNumber()).times(currentChainConfig.blockNumberPerDay)
        rewardValuePerDayUSD = rewardValuePerDayUSD.plus(rewardTokenValuePerDayUSD)
      }

      tmpClaimableTokens.push({
        tokenName: rewardTokenName,
        tokenAddress: rewardTokenAddress,
        tokenDecimals: rewardTokenDecimals,
        value: '0',
      })
    }
    this.liveRewardTokens = tmpLiveRewardTokens
    this.claimableTokens = tmpClaimableTokens
    this.rewardValuePerDayUSD = rewardValuePerDayUSD
  }

  @Watch('liveRewardTokens', { immediate: true, deep: true })
  async updateUserClaimList() {
    if (!this.provider || !this.userAddress || this.userAddress === ''
      || this.liveRewardTokens.length === 0) {
      return
    }
    for (let i = 0; i < this.claimableTokens.length; i++) {
      const item = this.claimableTokens[i]
      const tokenAddress = item.tokenAddress || ''
      const tokenDecimals = item.tokenDecimals || 0
      this.$set(this.claimableTokens, i, {
        ...item,
        value: (await this.miningRewardAmount(tokenAddress, CHAIN_ID_TO_DAO_MINING_ADDRESS[TARGET_NETWORK_ID], tokenDecimals)).toFixed()
      })
    }
  }

  async approve(onTransactionStart: () => void = () => {
  },
  ): Promise<ethers.providers.TransactionReceipt | null> {
    if (!this.signer) {
      return null
    }
    this.approving = true
    this.approveState = 'loading'
    try {
      const erc20Contract = getERC20Contract(SATORI_ADDRESS, this.signer)
      const decimals = await erc20Decimals(erc20Contract)
      const promiseInstance = await approveToken(erc20Contract, this.xmcbAddress, new BigNumber(ALLOWANCE_AMOUNT), decimals)
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.approve', {
          amount: '∞',
          token: DAO_STAKE_TOKEN_SYMBOL,
          symbol: ellipsisMiddle(this.xmcbAddress),
        }).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      onTransactionStart()
      const transactionResult = await transaction
      VUE_EVENT_BUS.emit(DAO_GOVERNANCE_EVENT.UpdateMyVotes)
      this.approveState = 'success'
      return transactionResult
    } catch (e) {
      console.error('approve', e)
      this.approveState = 'fail'
      throw e
    } finally {
      this.approving = false
    }
  }

  async stakeSATORIToken(
    amount: BigNumber,
    onTransactionStart: () => void = () => {
    },
  ): Promise<ethers.providers.TransactionReceipt | null> {
    if (!this.signer) {
      return null
    }
    this.staking = true
    this.stakeSATORIState = 'loading'
    try {
      const xmcbContract = getXmcbContract(this.xmcbAddress, this.signer)
      const promiseInstance = await stakeSATORI(xmcbContract, amount)
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.stake', {
          amount: amount.toFormat(2),
          token: DAO_STAKE_TOKEN_SYMBOL,
          poolId: ellipsisMiddle(this.xmcbAddress),
        }).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      onTransactionStart()
      const result = await transaction
      VUE_EVENT_BUS.emit(MINING_EVENT.SATORIStakingRefreshAccount)
      VUE_EVENT_BUS.emit(DAO_GOVERNANCE_EVENT.UpdateMyVotes)
      this.stakeSATORIState = 'success'
      return result
    } catch (e) {
      console.error('stake SATORI', e)
      this.stakeSATORIState = 'fail'
      throw e
    } finally {
      this.staking = false
    }
  }

  async unstakeSATORIToken(
    amount: BigNumber,
    onTransactionStart: () => void = () => {
    },
  ): Promise<ethers.providers.TransactionReceipt | null> {
    if (!this.signer) {
      return null
    }
    this.unstaking = true
    this.unstakeSATORIState = 'loading'
    try {
      const xmcbContract = getXmcbContract(this.xmcbAddress, this.signer)
      const promiseInstance = await unstakeSATORI(xmcbContract, amount)
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.unstake', {
          amount: amount.toFormat(2),
          token: DAO_STAKE_TOKEN_SYMBOL,
          poolId: ellipsisMiddle(this.xmcbAddress),
        }).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      onTransactionStart()
      const result = await transaction
      VUE_EVENT_BUS.emit(MINING_EVENT.SATORIStakingRefreshAccount)
      this.unstakeSATORIState = 'success'
      return result
    } catch (e) {
      console.error('stake SATORI', e)
      this.unstakeSATORIState = 'fail'
      throw e
    } finally {
      this.unstaking = false
    }
  }

  async onClaimEvent() {
    await this.callChainFunc(async () => {
      await this.claimingMiningReward(CHAIN_ID_TO_DAO_MINING_ADDRESS[TARGET_NETWORK_ID], 'daoMining')
      // refresh reward info
      VUE_EVENT_BUS.emit(MINING_EVENT.SATORIStakingRefreshAccount)
    })

  }
}
