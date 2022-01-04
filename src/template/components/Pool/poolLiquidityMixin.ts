import { Component, Mixins, Watch } from 'vue-property-decorator'
import { PoolMixins } from '@/template/components/Pool/poolMixins'
import { ButtonState, PerpetualProperty, TokenBalanceDirectoryItem } from '@/type'
import {
  ellipsisMiddle,
  getBeforeTimestamp,
  poolHasErrorOracle,
  toBigNumber,
} from '@/utils'
import { getGasStationTxParams } from '@/utils/gasPrice'
import { namespace } from 'vuex-class'
import BigNumber from 'bignumber.js'
import {
  _0,
  addLiquidity,
  approveToken,
  CHAIN_ID_TO_READER_ADDRESS,
  claimMiningReward,
  computeAMMCashToReturn,
  computeAMMPoolMargin,
  computeMaxRemovableShare,
  DECIMALS,
  erc20Decimals,
  getClaimableMiningReward,
  getERC20Contract,
  getLiquidityPoolContract,
  getLpGovernorContract,
  initAMMTradingContext,
  isAMMSafe,
  LiquidityPoolStorage,
  PerpetualState,
  ReaderFactory,
  removeLiquidity,
} from '@mcdex/mai3.js'
import { Provider } from '@ethersproject/providers'
import { ethers } from 'ethers'
import { gasLimitConfig } from '@/config/gas'
import {
  ALLOWANCE_AMOUNT,
  L1_NETWORK_ID,
  SATORI_ADDRESS_CONFIG,
  SUPPORTED_NETWORK_ID,
  TARGET_NETWORK_ID,
} from '@/const'
import { waitTransaction } from '@/utils/transaction'
import { chainConfigs, currentChainConfig } from '@/config/chain'
import { queryPoolLatestNAV, queryPoolsLiquidityHistory } from '@/api/pool'
import { estimateBlockTime, isNativeToken } from '@/utils/chain'
import { certifiedPoolsAddress } from '@/config/pool'
import { USDTokenSet } from '@/config/tokens'

const perpetual = namespace('perpetual')
const account = namespace('account')
const wallet = namespace('wallet')
const price = namespace('price')

@Component
export class PoolLiquidityMixin extends Mixins(PoolMixins) {
  @perpetual.Action('updateLiquidityPool') updateLiquidityPool!: (liquidityPoolAddress: string) => Promise<void>
  @account.Getter('tokenBalanceFunc') tokenBalanceFunc!: (tokenAddress: string) => TokenBalanceDirectoryItem | null
  @wallet.Getter('availableNativeTokenBalance') availableNativeTokenBalance!: BigNumber | null
  @account.Action('updateTokenBalance') updateTokenBalance!: (params: { tokenAddress: string }) => Promise<void>
  @account.Getter('allowanceFunc') allowanceFunc!: (tokenAddress: string, spender: string) => BigNumber
  @account.Action('updateAllowance') updateAllowance!: (params: { tokenAddress: string, spenderAddress: string, networkId?: SUPPORTED_NETWORK_ID }) => Promise<void>
  @wallet.Action('updateNativeTokenBalance') updateNativeTokenBalance!: Function
  @wallet.Getter('address') address!: string
  @wallet.Getter('provider') provider!: Provider
  @wallet.Getter('providerL1') providerL1!: Provider
  @wallet.Getter('signer') signer!: ethers.Signer
  @wallet.Getter('isConnectedWallet') isConnectedWallet!: boolean
  @wallet.State('nativeTokenBalance') nativeTokenBalance!: BigNumber | null
  @price.Action('updateTokenPrice') updateTokenPrice!: (payload: { tokens: string[], networkId: number } | string[]) => Promise<void>
  @price.Getter('tokenPriceFunc') tokenPriceFunc!: (token: string, network?: SUPPORTED_NETWORK_ID) => BigNumber | null

  loading: boolean = false
  approving: boolean = false
  adding: boolean = false
  removing: boolean = false
  claiming: boolean = false
  isLPTokenLocked: boolean = false
  lpTokenUnlockTime: string = ''
  claimableReward: BigNumber = new BigNumber('0')
  lpApy: BigNumber = new BigNumber(0)
  liquidityLockInfo = { currentBlockNumber: 0, lastMintBlock: 0 }
  liquidityLockTimer = 0
  l1BlockInterval = chainConfigs[L1_NETWORK_ID].blockGenerationInterval

  private removeLiquidityState: ButtonState = ''
  private claimState: ButtonState = ''
  protected shareTotalSupply: BigNumber = _0
  protected netAssetValue: BigNumber | null = null

  protected addForm = {
    amount: '',
    amountProportion: 0,
  }
  protected removeForm = {
    amount: '',
    amountProportion: 0,
  }

  get netAssetValueDecimals(): number {
    return this.collateralDecimals
  }

  get mcbTokenPrice(): BigNumber | null {
    return this.tokenPriceFunc(SATORI_ADDRESS_CONFIG[SUPPORTED_NETWORK_ID.ARB], SUPPORTED_NETWORK_ID.ARB)
  }

  get isMiningPool(): boolean {
    if (!this.poolBaseInfo) {
      return false
    }
    return this.poolBaseInfo.isMiningPool
  }

  get totalApy(): BigNumber {
    return this.lpApy.plus(this.miningApy)
  }

  get shareTokenAddress(): string {
    return this.liquidityPool?.liquidityPoolStorage.shareToken || ''
  }

  get isApproved(): boolean {
    const amount = toBigNumber(this.addForm.amount)
    if (!amount.isNaN() && !amount.isZero()) {
      return !this.allowance.lt(amount)
    }
    return !this.allowance.isZero()
  }

  get liquidityLockComputed() {
    const unlockBlock = this.liquidityLockInfo.lastMintBlock + (this.liquidityPoolStorage?.shareTransferDelay || 0)
    const remainingBlocks = Math.max(unlockBlock - this.liquidityLockInfo.currentBlockNumber, 0)

    return {
      isLocked: remainingBlocks > 0,
      lastMintBlock: this.liquidityLockInfo.lastMintBlock,
      currentBlockNumber: this.liquidityLockInfo.currentBlockNumber,
      remainingBlocks,
      unlockBlock,
      unlockTime: estimateBlockTime(this.liquidityLockInfo.currentBlockNumber, unlockBlock, L1_NETWORK_ID),
    }
  }

  async isVoteLPTokenLocked(): Promise<boolean> {
    if (!this.poolBaseInfo || !this.signer || !this.address) return false
    const lpGovernorContract = getLpGovernorContract(this.poolBaseInfo.voteAddress.toLowerCase(), this.signer)
    return await lpGovernorContract.callStatic.isLockedByVoting(this.address)
  }

  async getUnlockTime() {
    return await this.callChainReadFunc(async () => {
      if (!this.poolBaseInfo || !this.provider || !this.address || !this.providerL1) return '-'
      const lpGovernorContract = getLpGovernorContract(this.poolBaseInfo.voteAddress, this.provider)
      const unlockBlockNumber = await lpGovernorContract.callStatic.getUnlockBlock(this.address)
      const l1Reader = ReaderFactory.connect(CHAIN_ID_TO_READER_ADDRESS[TARGET_NETWORK_ID], this.provider)
      const currentBlockNumber = await l1Reader.callStatic.getL1BlockNumber()
      return estimateBlockTime(currentBlockNumber.toNumber(), unlockBlockNumber.toNumber(), L1_NETWORK_ID)
    })
  }

  async getLiquidityUnlockTime() {
    return await this.callChainReadFunc(async () => {
      if (!this.poolBaseInfo || !this.provider || !this.address || !this.providerL1) return '-'
      const lpGovernorContract = getLpGovernorContract(this.poolBaseInfo.voteAddress, this.provider)
      const lastMintBlock = await lpGovernorContract.callStatic.lastMintBlock(this.address)
      const l1Reader = ReaderFactory.connect(CHAIN_ID_TO_READER_ADDRESS[TARGET_NETWORK_ID], this.provider)
      const currentBlockNumber = await l1Reader.callStatic.getL1BlockNumber()
      this.liquidityLockInfo = {
        lastMintBlock: lastMintBlock.toNumber(),
        currentBlockNumber: currentBlockNumber.toNumber(),
      }
    })
  }

  get shareTokenPercentage() {
    return this.shareTotalSupply.isZero() ? _0 : this.shareTokenBalance.div(this.shareTotalSupply).times(100)
  }

  get isNativeToken(): boolean {
    if (!this.poolBaseInfo) {
      return false
    }
    return isNativeToken(this.poolBaseInfo.collateralAddress)
  }

  get collateralDecimals(): number {
    if (!this.liquidityPool) {
      return 0
    }
    const perpetual = this.liquidityPool.perpetualPropertyMap.values().next().value as PerpetualProperty | undefined
    return perpetual?.contractFormatDecimals || 0
  }

  get collateralSymbol(): string {
    return this.poolBaseInfo?.collateralSymbol || ''
  }

  get poolCollateralAddress(): string {
    return this.poolBaseInfo?.collateralAddress || ''
  }

  get poolCollateralTokenPrice(): BigNumber | null {
    return this.tokenPriceFunc(this.poolCollateralAddress)
  }

  get walletCollateralBalance(): BigNumber {
    const erc20Balance = this.collateralTokenBalanceInfo?.balance
    return erc20Balance?.dp(this.collateralDecimals, BigNumber.ROUND_DOWN) || _0
  }

  get collateralTokenBalanceInfo(): TokenBalanceDirectoryItem | null {
    if (!this.tokenBalanceFunc || !this.poolBaseInfo) {
      return null
    }
    return this.tokenBalanceFunc(this.poolBaseInfo.collateralAddress)
  }

  get shareTokenBalanceInfo(): TokenBalanceDirectoryItem | null {
    if (!this.tokenBalanceFunc || !this.poolBaseInfo) {
      return null
    }
    return this.tokenBalanceFunc(this.poolBaseInfo.shareAddress)
  }

  get allowance() {
    if (!this.allowanceFunc || !this.poolBaseInfo) {
      return _0
    }
    return this.allowanceFunc(this.poolBaseInfo.collateralAddress, this.poolBaseInfo.poolAddress)
  }

  get shareTokenBalance() {
    return this.shareTokenBalanceInfo?.balance || _0
  }

  get liquidityPoolStorage(): LiquidityPoolStorage | null {
    return this.liquidityPool?.liquidityPoolStorage || null
  }

  get poolMargin(): BigNumber | null {
    if (!this.liquidityPoolStorage) {
      return null
    }
    return this.computePoolMargin(this.liquidityPoolStorage)
  }

  get pooledCollateral(): BigNumber | null {
    if (!this.poolMargin) {
      return null
    }
    return this.poolMargin.times(this.shareTokenPercentage).div(100)
  }

  get hasEmergencyStatusPerpetual(): boolean {
    if (!this.liquidityPoolStorage) {
      return false
    }
    for (let item of this.liquidityPoolStorage.perpetuals) {
      const perp = item[1]
      if (perp.state === PerpetualState.EMERGENCY) {
        return true
      }
    }
    return false
  }

  get poolOracleHasError(): boolean {
    if (!this.liquidityPool) return false
    return poolHasErrorOracle(this.liquidityPool.liquidityPoolStorage)
  }

  get normalizeAddAmount() {
    return this.addForm.amount ? new BigNumber(this.addForm.amount) : _0
  }

  get invalidAddAmount() {
    return (
      this.normalizeAddAmount.isNaN() ||
      this.normalizeAddAmount.lte(_0) ||
      this.poolOracleHasError ||
      !this.liquidityPoolStorage?.isRunning ||
      !this.liquidityPoolStorage.isSynced ||
      !this.normalStatusPerpetual ||
      (this.shareTotalSupply.gt(0) && this.poolMargin?.eq(0))
    )
  }

  get invalidAccountAddAmount() {
    return (
      !this.walletCollateralBalance ||
      this.normalizeAddAmount.gt(this.walletCollateralBalance)
    )
  }

  get isShowRemoveInsufficientTip(): boolean {
    return this.maxRemoveShare === null ? false : this.normalizeRemoveAmount.gt(this.maxRemoveShare)
  }

  get maxRemoveShare(): BigNumber | null {
    if (!this.liquidityPoolStorage) {
      return null
    }
    const share = computeMaxRemovableShare(this.liquidityPoolStorage, this.shareTotalSupply)
    return BigNumber.min(share, this.shareTokenBalance)
  }

  get normalizeRemoveAmount(): BigNumber {
    return this.removeForm.amount ? new BigNumber(this.removeForm.amount) : _0
  }

  get invalidRemoveAmount() {
    return (
      this.normalizeRemoveAmount.isNaN() ||
      this.normalizeRemoveAmount.lte(_0) ||
      this.poolOracleHasError ||
      !this.liquidityPoolStorage?.isRunning ||
      this.isLPTokenLocked ||
      !this.liquidityPoolStorage.isSynced ||
      !this.isSafe
    )
  }

  get invalidAccountRemoveAmount() {
    return this.normalizeRemoveAmount.gt(this.shareTokenBalance) || (this.maxRemoveShare === null ? true : this.normalizeRemoveAmount.gt(this.maxRemoveShare))
  }

  get afterRemoveInfo(): { cashToReturn: BigNumber; poolMargin: BigNumber; newPoolMargin: BigNumber } | null {
    if (this.invalidRemoveAmount) {
      return null
    }
    if (!this.liquidityPoolStorage) {
      return null
    }
    try {
      return computeAMMCashToReturn(this.liquidityPoolStorage, this.shareTotalSupply, this.normalizeRemoveAmount)
    } catch (InsufficientLiquidityError) {
      console.warn(`remove liquidity failed. share amount too large. ${this.normalizeRemoveAmount.toFixed()}`)
      return null
    }
  }

  get penaltyAfterRemove(): BigNumber | null {
    if (this.invalidRemoveAmount || this.invalidAccountRemoveAmount || !this.afterRemoveInfo || !this.liquidityAccount) {
      return null
    }
    if (
      this.shareTotalSupply.isZero() ||
      (this.liquidityAccount.shareAmount as BigNumber).isZero() ||
      this.normalizeRemoveAmount.isZero()
    ) {
      return _0
    }
    // penalty = -share * ((ctk2/share - ctk1/share) - (nav2 - nav1))
    const nav1 = (this.liquidityAccount.entryPoolMargin as BigNumber).div(
      this.liquidityAccount.shareAmount as BigNumber,
    )
    const nav2 = this.afterRemoveInfo.poolMargin.div(this.shareTotalSupply)
    const ctk1 = this.liquidityAccount.entryCollateralAmount as BigNumber
    const ctk2 = this.afterRemoveInfo.cashToReturn
    let penalty = ctk2.div(this.normalizeRemoveAmount)
    penalty = penalty.minus(ctk1.div(this.liquidityAccount.shareAmount))
    penalty = penalty.minus(nav2)
    penalty = penalty.plus(nav1)
    penalty = penalty.times(this.normalizeRemoveAmount).negated()
    penalty = BigNumber.max(0, penalty)
    return penalty
  }

  get receivedAfterRemove(): BigNumber | null {
    if (!this.afterRemoveInfo) {
      return null
    }
    return this.afterRemoveInfo.cashToReturn
  }

  get isSafe() {
    if (this.liquidityPoolStorage) {
      let context = initAMMTradingContext(this.liquidityPoolStorage)
      let beta = context.openSlippageFactor
      return isAMMSafe(context, beta)
    }
    return false
  }

  get normalStatusPerpetual() {
    let status = false
    this.liquidityPoolStorage?.perpetuals.forEach((i) => {
      if (i.state === PerpetualState.NORMAL) {
        status = true
        return
      }
    })
    return status
  }

  get addPromptText() {
    if (!this.liquidityPoolStorage?.isRunning) {
      return this.$t('pool.liquidityPage.addLiqNotRunningPrompt').toString()
    } else if (!this.liquidityPoolStorage?.isSynced || !this.normalStatusPerpetual) {
      return this.$t('pool.liquidityPage.addLiqPerpetualErrorPrompt').toString()
    }
  }

  get removePromptText() {
    if (!this.liquidityPoolStorage?.isRunning) {
      return this.$t('pool.liquidityPage.removeLiqNotRunningPrompt').toString()
    } else if (!this.liquidityPoolStorage?.isSynced || !this.isSafe) {
      return this.$t('pool.liquidityPage.removeLiqPerpetualErrorPrompt').toString()
    } else if (this.isLPTokenLocked) {
      return this.$t('pool.liquidityPage.removeLiqLPLockedPrompt').toString()
    }
  }

  mounted() {
    this.onLiquidityLocked()
    this.updateTokenPrice({
      tokens: [SATORI_ADDRESS_CONFIG[SUPPORTED_NETWORK_ID.ARB]],
      networkId: SUPPORTED_NETWORK_ID.ARB,
    })
  }

  destroyed() {
    window.clearInterval(this.liquidityLockTimer)
  }

  computePoolMargin(pool: LiquidityPoolStorage): BigNumber {
    try {
      let context = initAMMTradingContext(pool)
      context = computeAMMPoolMargin(context, _0 /* useless */, true /* allow unsafe */)
      return context.poolMargin
    } catch (InsufficientLiquidityError) {
      return _0
    }
  }

  async getClaimableMiningReward(): Promise<BigNumber> {
    return await this.callChainReadFunc(async () => {
      if (!this.poolBaseInfo) return '0'
      const lpGovernorContract = getLpGovernorContract(this.poolBaseInfo.voteAddress.toLowerCase(), this.provider)
      return await getClaimableMiningReward(lpGovernorContract, this.address)
    })
  }

  @Watch('poolBaseInfo')
  async computeLpApy() {
    if (!this.poolAddress) {
      this.lpApy = new BigNumber(0)
      return
    }
    const timestamp = getBeforeTimestamp('d', 30)
    const poolData = await this.callGraphApiFunc(() => {
      return queryPoolsLiquidityHistory([this.poolAddress.toLowerCase()], timestamp)
    })
    if (!poolData) {
      this.lpApy = new BigNumber(0)
      return
    }
    const poolItem = poolData.data['pool_' + this.poolAddress.toLowerCase()]
    if (!poolItem || poolItem.length <= 1) {
      this.lpApy = new BigNumber(0)
      return
    }
    const leftInfoItem = poolItem[poolItem.length - 1]
    const rightInfoItem = poolItem[0]
    // nav0: -10 day, nav1: now >> (nav1 - nav0) / nav0 / 10 * 365 * 100 (10-day avg apy)
    const nav0 = toBigNumber(leftInfoItem.netAssetValue)
    const nav1 = toBigNumber(rightInfoItem.netAssetValue)
    if (nav0.isZero()) {
      return toBigNumber(0)
    }
    let leftTimestamp = Number(leftInfoItem.timestamp)
    if (TARGET_NETWORK_ID === SUPPORTED_NETWORK_ID.BSC) {
      leftTimestamp = Math.max(leftTimestamp, 1633219200) // BSC starts at 2021-10-04 00:00 UTC. You can remove this line after 1 month
      if (this.poolAddress.toLowerCase() === '0x0a848c92295369794d38dfa1e4d26612cad2dfa8'.toLowerCase()) { // usx 2021-10-18 00:00 UTC. You can remove this line after 1 month
        leftTimestamp = Math.max(leftTimestamp, 1634515200) // usx 2021-10-18 00:00 UTC. You can remove this line after 1 month
      }
    }
    const day = (Number(rightInfoItem.timestamp) - leftTimestamp) / 86400
    this.lpApy = nav1.minus(nav0).div(nav0).div(day).times(365).times(100)
  }

  get miningApy() {
    if (!this.poolBaseInfo || !this.mcbTokenPrice || !this.isMiningPool
      || toBigNumber(this.poolBaseInfo.poolMarginUSD).isZero() || !this.poolBaseInfo.governor) {
      return _0
    }
    const SATORINumPerDay = new BigNumber(this.poolBaseInfo.governor.rewardRate).times(currentChainConfig.blockNumberPerDay)
    return SATORINumPerDay.times(this.mcbTokenPrice).times(365).times(100).div(this.poolBaseInfo.poolMarginUSD)
  }

  async getNetAssetValue() {
    if (this.poolAddress === '') {
      return
    }
    const nav = await this.callGraphApiFunc(() => {
      return queryPoolLatestNAV(this.poolAddress)
    })
    if (!nav || nav.poolDayDatas.length === 0) {
      return
    }
    this.netAssetValue = toBigNumber(nav.poolDayDatas[0].netAssetValue)
  }

  @Watch('address')
  @Watch('poolBaseInfo')
  async updateData() {
    if (!this.poolBaseInfo) {
      return
    }
    try {
      this.loading = true
      await this.updateLiquidityPool(this.poolBaseInfo.poolAddress)
      if (this.address) {
        await Promise.all([
          this.updateNativeTokenBalance(),
          this.updateCollateralToken(),
          this.updateShareToken(),
          this.updateAllowanceInfo(),
          this.updateTokenTotalSupply(),
          this.getNetAssetValue()
        ])
      }
      await this.updateMiningInfo()
    } finally {
      this.loading = false
    }
  }

  @Watch('nativeTokenBalance')
  async updateWETHData() {
    if (!this.poolBaseInfo) {
      return
    }
    await this.updateLiquidityPool(this.poolBaseInfo.poolAddress)
    if (this.address) {
      await this.updateCollateralToken()
    }
  }

  onLiquidityLocked() {
    this.getLiquidityUnlockTime()
    this.liquidityLockTimer = window.setInterval(() => {
      this.getLiquidityUnlockTime()
    }, 30000)
  }

  @Watch('shareTokenAddress', { immediate: true })
  async updateTokenTotalSupply() {
    if (!this.provider || !this.poolBaseInfo) {
      return _0
    }
    const erc20Contract = getERC20Contract(this.poolBaseInfo.shareAddress, this.provider)
    await erc20Contract.totalSupply().then((supply) => {
      this.shareTotalSupply = new BigNumber(supply.toString()).shiftedBy(-DECIMALS)
    })
  }

  async updateMiningInfo() {
    if (!this.poolBaseInfo) {
      return
    }
    const [isLPTokenLocked, lpTokenUnlockTime, claimableReward] = await Promise.all([
      this.isVoteLPTokenLocked(),
      this.getUnlockTime(),
      this.getClaimableMiningReward(),
      this.getLiquidityUnlockTime(),
    ])
    this.isLPTokenLocked = isLPTokenLocked
    this.lpTokenUnlockTime = lpTokenUnlockTime
    this.claimableReward = claimableReward
  }

  async updateCollateralToken() {
    if (!this.poolBaseInfo) {
      return
    }
    await this.updateTokenBalance({ tokenAddress: this.poolBaseInfo.collateralAddress })
  }

  async updateShareToken() {
    if (!this.poolBaseInfo) {
      return
    }
    await this.updateTokenBalance({ tokenAddress: this.poolBaseInfo.shareAddress })
  }

  async updateAllowanceInfo() {
    if (!this.poolBaseInfo) {
      return
    }
    await this.updateAllowance({
      tokenAddress: this.poolBaseInfo.collateralAddress,
      spenderAddress: this.poolBaseInfo.poolAddress,
    })
  }

  async addLiquidity(
    amount: BigNumber,
    onTransactionStart: () => void = () => {
    },
  ): Promise<ethers.providers.TransactionReceipt | null> {
    if (!this.signer || !this.poolBaseInfo || !this.liquidityPoolStorage) {
      return null
    }
    this.adding = true
    try {
      const poolContract = getLiquidityPoolContract(this.poolBaseInfo.poolAddress, this.signer)
      const gasLimit =
        this.poolBaseInfo.perpetuals.length * gasLimitConfig.ADD_LIQUIDITY_GAS_LIMIT_K +
        gasLimitConfig.ADD_LIQUIDITY_GAS_LIMIT_B
      const gas = await getGasStationTxParams(gasLimit)
      const promiseInstance = await addLiquidity(poolContract, amount, gas)
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.addLiquidity', {
          amount: amount.toFormat(this.collateralDecimals),
          token: this.collateralSymbol,
          poolId: ellipsisMiddle(this.poolBaseInfo.poolAddress),
        }).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      onTransactionStart()
      const result = await transaction
      this.onLiquiditySendGoogleEvent(
        'add',
        amount
      )
      return result
    } catch (e) {
      console.error('add liquidity', e)
      throw e
    } finally {
      this.adding = false
    }
  }

  async removeLiquidity(
    amount: BigNumber,
    onTransactionStart: () => void = () => {
    },
  ): Promise<ethers.providers.TransactionReceipt | null> {
    if (!this.signer || !this.poolBaseInfo) {
      return null
    }
    this.removing = true
    this.removeLiquidityState = 'loading'
    try {
      const poolContract = getLiquidityPoolContract(this.poolBaseInfo.poolAddress, this.signer)
      const gasLimit =
        this.poolBaseInfo.perpetuals.length * gasLimitConfig.REMOVE_LIQUIDITY_GAS_LIMIT_K +
        gasLimitConfig.REMOVE_LIQUIDITY_GAS_LIMIT_B
      const gas = await getGasStationTxParams(gasLimit)
      const promiseInstance = await removeLiquidity(poolContract, amount, 0, gas)
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.removeLiquidity', {
          amount: amount.toFormat(this.collateralDecimals),
          poolId: ellipsisMiddle(this.poolBaseInfo.poolAddress),
        }).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      onTransactionStart()
      const transactionResult = await transaction
      this.removeLiquidityState = 'success'
      this.onLiquiditySendGoogleEvent(
        'remove',
        amount
      )
      return transactionResult
    } catch (e) {
      console.error('remove liquidity', e)
      this.removeLiquidityState = 'fail'
      throw e
    } finally {
      this.removing = false
    }
  }

  async approve(onTransactionStart: () => void = () => {
  }): Promise<ethers.providers.TransactionReceipt | null> {
    if (!this.signer || !this.poolBaseInfo) {
      return null
    }
    this.approving = true
    try {
      const erc20Contract = getERC20Contract(this.poolBaseInfo.collateralAddress, this.signer)
      const decimals = await erc20Decimals(erc20Contract)
      const promiseInstance = await approveToken(
        erc20Contract,
        this.poolBaseInfo.poolAddress,
        new BigNumber(ALLOWANCE_AMOUNT),
        decimals,
      )
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.approve', {
          amount: '∞',
          token: this.collateralSymbol,
          symbol: ellipsisMiddle(this.poolBaseInfo.poolAddress),
        }).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      onTransactionStart()
      const transactionResult = await transaction
      return transactionResult
    } catch (e) {
      console.error('approve', e)
      throw e
    } finally {
      this.approving = false
    }
  }

  async claimReward(onTransactionStart: () => void = () => {
  }): Promise<ethers.providers.TransactionReceipt | null> {
    if (!this.signer || !this.poolBaseInfo) {
      return null
    }
    this.claiming = true
    this.claimState = 'loading'
    try {
      const voteContract = getLpGovernorContract(this.poolBaseInfo.voteAddress, this.signer)
      const gas = await getGasStationTxParams(gasLimitConfig.CLAIM_SATORI_MINING_REWARD)
      const promiseInstance = await claimMiningReward(voteContract, gas)
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.claimMiningReward', {}).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      onTransactionStart()
      const transactionResult = await transaction
      this.claimState = 'success'
      return transactionResult
    } catch (e) {
      console.error('claim mining reward', e)
      this.claimState = 'fail'
      throw e
    } finally {
      this.removing = false
    }
  }

  @Watch('poolCollateralAddress', { immediate: true })
  onCollateralAddressChange() {
    if (this.poolCollateralAddress === '') {
      return
    }
    this.updateTokenPrice([this.poolCollateralAddress])
  }


  // Google Analytics Events
  onLiquiditySendGoogleEvent(action: 'add' | 'remove', amount: BigNumber) {
    // only main chain
    if (currentChainConfig.chainID !== SUPPORTED_NETWORK_ID.BSC &&
      currentChainConfig.chainID !== SUPPORTED_NETWORK_ID.ARB) {
      return
    }
    // only send certified pools
    const certifiedPools = certifiedPoolsAddress()
    if (!this.poolAddress || certifiedPools.indexOf(this.poolAddress.toLowerCase()) < 0) {
      return
    }
    let val: BigNumber = new BigNumber(0)
    if (USDTokenSet.has(this.poolCollateralAddress.toLowerCase())) {
      val = amount
    } else if (this.poolCollateralTokenPrice) {
      val = amount.times(this.poolCollateralTokenPrice)
    }
    ga('send',
      {
        hitType: 'event',
        eventCategory: 'Pool',
        eventAction: action === 'add' ? 'Add' : 'Remove',
        eventLabel: 'Liquidity',
        eventValue: Number(val.toFixed(0))
      })
  }
}
