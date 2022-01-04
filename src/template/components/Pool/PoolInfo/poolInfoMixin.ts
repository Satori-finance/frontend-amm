import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import { PoolBaseInfo } from '@/template/components/Pool/poolMixins'
import { ButtonState, LiquidityPoolDirectoryItem, PerpetualProperty } from '@/type'
import { ethers } from 'ethers'
import BigNumber from 'bignumber.js'
import { getBeforeTimestamp, toBigNumber } from '@/utils'
import { getGasStationTxParams } from '@/utils/gasPrice'
import {
  SATORI_ADDRESS_CONFIG,
  MiningTokenSymbol,
  OPERATOR_CHECK_IN_EXPIRE_TIMESTAMP,
  SUPPORTED_NETWORK_ID,
} from '@/const'
import {
  claimMiningReward,
  DECIMALS,
  getClaimableMiningReward,
  getLiquidityPoolContract,
  getLpGovernorContract,
  LiquidityPoolStorage,
  PerpetualState,
  takerOverOperator,
} from '@mcdex/mai3.js'
import { getOperatorName } from '@/config/operator'
import { queryPoolLatestNAV, queryPoolVolumeHistory } from '@/api/pool'
import * as _ from 'lodash'
import { gasLimitConfig } from '@/config/gas'
import { namespace } from 'vuex-class'
import { currentChainConfig } from '@/config/chain'
import { waitTransaction } from '@/utils/transaction'
import { isNativeToken } from '@/utils/chain'

const wallet = namespace('wallet')
const perpetual = namespace('perpetual')
const price = namespace('price')

@Component
export default class PoolInfoMixin extends Mixins(ErrorHandlerMixin) {
  @Prop({ required: true }) poolBaseInfo !: PoolBaseInfo | null
  @Prop({ required: true }) liquidityPool !: LiquidityPoolDirectoryItem | null
  @Prop({ required: true }) perpetualProperty !: PerpetualProperty | null
  @perpetual.Action('updateLiquidityPool') updateLiquidityPool!: (liquidityPoolAddress: string) => Promise<void>
  @wallet.Getter('address') userAddress !: string | null
  @wallet.Getter('signer') signer!: ethers.Signer
  @wallet.Getter('provider') provider!: ethers.Signer
  @price.Getter('tokenPriceFunc') tokenPriceFunc!: (token: string, networkId: SUPPORTED_NETWORK_ID) => BigNumber | null
  @price.Action('updateTokenPrice') updateTokenPrice!: (tokens: string[] | { tokens: string[], networkId: SUPPORTED_NETWORK_ID }) => Promise<void>

  protected checkButtonState: ButtonState = ''

  // fix donatedInsuranceFund value
  protected isGetPoolInfoFromGetter: boolean = false
  protected unChangeLiquidityPoolInfo: any = null
  protected takeoverOperatorDisabled: boolean = false
  protected runPoolLoading: boolean = false
  protected checkInDisabled: boolean = false
  protected claiming: boolean = false

  // private lpApy: BigNumber = toBigNumber('0')
  private totalVolume: BigNumber = toBigNumber('0')
  private netAssetValue: BigNumber = toBigNumber('0')
  private claimableReward: BigNumber = new BigNumber('0')

  protected miningTokenSymbol = MiningTokenSymbol

  private isNativeToken = isNativeToken

  async mounted() {
    // await this.getPoolLiquidity()
    await this.getPoolVolume()
    await this.getNetAssetValue()
    // get SATORI token price
    await this.updateTokenPrice({ tokens: [SATORI_ADDRESS_CONFIG[SUPPORTED_NETWORK_ID.ARB]], networkId: SUPPORTED_NETWORK_ID.ARB })
  }

  get poolAddress(): string {
    if (!this.poolBaseInfo) return ''
    return this.poolBaseInfo.poolAddress.toLowerCase()
  }

  get collateralDecimals(): number {
    return this.perpetualProperty?.collateralFormatDecimals || 0
  }

  get collateralAddress(): string {
    return this.poolBaseInfo?.collateralAddress || ''
  }

  get netAssetValueDecimals(): number {
    return this.collateralDecimals + 4
  }

  get operatorCheckInExpireTime(): number {
    if (!this.liquidityPoolStorage) {
      return 0
    }
    return this.liquidityPoolStorage.operatorExpiration
  }

  get operatorLastCheckTimestamp(): number {
    if (this.operatorCheckInExpireTime === 0) {
      return 0
    }
    return this.operatorCheckInExpireTime - OPERATOR_CHECK_IN_EXPIRE_TIMESTAMP
  }

  get runningPoolDisabled(): boolean {
    if (this.runPoolLoading || !this.poolHasPerpetual) {
      return true
    }
    return false
  }

  get operatorAddress(): string {
    if (!this.liquidityPoolStorage) return ''
    return this.liquidityPoolStorage.operator.toLowerCase()
  }

  get isPoolOperator(): boolean {
    if (!this.userAddress || this.userAddress === '' || this.operatorAddress === '') return false
    return this.userAddress.toLowerCase() === this.operatorAddress
  }

  get isRunningPool(): boolean {
    if (!this.liquidityPoolStorage) return true
    return this.liquidityPoolStorage.isRunning
  }

  get liquidityPoolStorage(): LiquidityPoolStorage | null {
    return this.liquidityPool?.liquidityPoolStorage || null
  }

  get isTakerOverOperator(): boolean {
    if (!this.liquidityPoolStorage || !this.userAddress || this.userAddress === '') return false
    const transferringOperator = this.liquidityPoolStorage.transferringOperator.toLowerCase()
    return !(transferringOperator === '' || transferringOperator !== this.userAddress.toLowerCase())
  }

  get operatorName(): string {
    const name = getOperatorName(this.operatorAddress.toLowerCase())
    if (name === this.operatorAddress.toLowerCase()) return ''
    return name
  }

  get collateralSymbol(): string {
    return this.perpetualProperty?.collateralTokenSymbol ||
      (this.poolBaseInfo?.collateralSymbol || '')
  }

  get poolMarginUSD(): BigNumber {
    if (!this.poolBaseInfo) return toBigNumber('0')
    return toBigNumber(this.poolBaseInfo.poolMarginUSD)
  }

  get poolMargin(): BigNumber {
    if (!this.poolBaseInfo) return toBigNumber('0')
    return toBigNumber(this.poolBaseInfo.poolMargin)
  }

  get donatedInsuranceFund(): BigNumber {
    if (!this.liquidityPoolStorage) {
      return new BigNumber(0)
    }

    return this.isGetPoolInfoFromGetter && this.unChangeLiquidityPoolInfo && this.unChangeLiquidityPoolInfo.intNums[4]
      ? toBigNumber(this.unChangeLiquidityPoolInfo.intNums[4].toString()).shiftedBy(-DECIMALS)
      : this.liquidityPoolStorage.donatedInsuranceFund
  }

  get isMiningPool(): boolean {
    if (!this.poolBaseInfo) return false
    return this.poolBaseInfo.isMiningPool
  }

  get miningApy(): BigNumber {
    const mcbPrice = this.tokenPriceFunc(SATORI_ADDRESS_CONFIG[SUPPORTED_NETWORK_ID.ARB], SUPPORTED_NETWORK_ID.ARB)
    if (!this.poolBaseInfo || !mcbPrice || !this.poolBaseInfo.governor || this.poolBaseInfo.poolMarginUSD == '0') {
      return new BigNumber('0')
    }
    const mcbNumPerDay = Number(this.poolBaseInfo.governor.rewardRate) * currentChainConfig.blockNumberPerDay
    return new BigNumber(mcbNumPerDay).times(mcbPrice).times(365).times(100).div(this.poolBaseInfo.poolMarginUSD)
  }

  get miningRelease(): BigNumber {
    if (!this.poolBaseInfo || !this.poolBaseInfo.governor) return new BigNumber('0')
    return new BigNumber(Number(this.poolBaseInfo.governor.rewardRate) * currentChainConfig.blockNumberPerDay)
  }

  get isFourColumnsTable(): boolean {
    if (!this.isPoolOperator && !this.isTakerOverOperator) {
      return true
    }
    if (this.isMiningPool) {
      return true
    }
    return false
  }

  get poolHasPerpetual(): boolean {
    if (!this.liquidityPoolStorage) {
      return false
    }
    return this.liquidityPoolStorage.perpetuals.size > 0
  }

  async getPoolVolume() {
    if (this.poolAddress === '') {
      return
    }
    const before24hTimestamp = getBeforeTimestamp('d')
    const volumes = await this.callGraphApiFunc(() => {
      return queryPoolVolumeHistory(this.poolAddress, 'h', before24hTimestamp)
    })
    if (!volumes || volumes.volumes.length === 0) {
      return
    }
    const totalVolume = _.sumBy(volumes.volumes, (o) => {
      return Number(o.volume)
    })
    this.totalVolume = new BigNumber(totalVolume)
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

  @Watch('provider')
  @Watch('userAddress')
  @Watch('liquidityPoolStorage', { immediate: true })
  async getClaimableMiningReward() {
    return await this.callChainReadFunc(async () => {
      if (!this.liquidityPoolStorage || !this.userAddress || this.userAddress === '') {
        this.claimableReward = new BigNumber(0)
        return
      }
      const lpGovernorContract = getLpGovernorContract(
        this.liquidityPoolStorage.governor,
        this.provider,
      )
      this.claimableReward = await getClaimableMiningReward(lpGovernorContract, this.userAddress)
    })
  }


  @Watch('liquidityPool', { immediate: true })
  @Watch('provider', { immediate: true })
  async onLiquidityPoolChangeCheckPerp() {
    if (!this.liquidityPool || !this.provider) {
      this.isGetPoolInfoFromGetter = false
      return
    }
    let allPerpIsSettle: boolean = true
    this.liquidityPool.liquidityPoolStorage.perpetuals.forEach(item => {
      if (item.state === PerpetualState.NORMAL || item.state === PerpetualState.INVALID) {
        allPerpIsSettle = false
      }
    })
    if (allPerpIsSettle) {
      this.isGetPoolInfoFromGetter = true
      this.getLiquidityPoolInfoFromGetter()
    }
  }

  async getLiquidityPoolInfoFromGetter() {
    if (!this.poolAddress || !this.provider) {
      return
    }
    const contract = getLiquidityPoolContract(this.poolAddress, this.provider)
    this.unChangeLiquidityPoolInfo = await contract.callStatic.getLiquidityPoolInfo()
  }

  @Watch('poolAddress')
  async onPoolAddressChanged() {
    // await this.getPoolLiquidity()
    await this.getPoolVolume()
    await this.getNetAssetValue()
  }

  async onTakerOverOperatorEvent() {
    if (!this.isTakerOverOperator) {
      return
    }
    this.takeoverOperatorDisabled = true
    await this.callChainFunc(async () => {
      const poolContract = getLiquidityPoolContract(this.poolAddress, this.signer)
      const gas = await getGasStationTxParams(gasLimitConfig.TAKER_OVER_OPERATOR_GAS_LIMIT)
      const promiseInstance = await takerOverOperator(poolContract, gas)
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.takerOverOperator').toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      const transactionResult = await transaction
      await this.updateLiquidityPool(this.poolAddress)
      return transactionResult
    })
    this.takeoverOperatorDisabled = false
  }

  async onRunPoolEvent() {
    if (!this.liquidityPool || !this.isPoolOperator || this.isRunningPool
      || this.poolAddress === '' || !this.signer || this.runningPoolDisabled) {
      return
    }
    try {
      this.runPoolLoading = true
      const liquidityPool = getLiquidityPoolContract(this.poolAddress, this.signer)
      const gasLimit = this.liquidityPool.liquidityPoolStorage.perpetuals.size * gasLimitConfig.RUN_POOL_GAS_LIMIT_K + gasLimitConfig.RUN_POOL_GAS_LIMIT_B
      const gas = await getGasStationTxParams(gasLimit)
      const promiseInstance = await liquidityPool.runLiquidityPool(gas)
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.runPool', { collateral: this.collateralSymbol }).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      await transaction
      await this.updateLiquidityPool(this.poolAddress)
    } catch (e) {
      console.error('run pool', e)
    } finally {
      this.runPoolLoading = false
    }
  }

  async onCheckInEvent() {
    await this.callChainFunc(async () => {
      if (!this.liquidityPool || !this.isPoolOperator || this.poolAddress === '' || !this.signer) {
        return
      }
      try {
        this.checkInDisabled = true
        this.checkButtonState = 'loading'
        const liquidityPool = getLiquidityPoolContract(this.poolAddress, this.signer)
        const gas = await getGasStationTxParams(gasLimitConfig.OPERATOR_CHECK_IN_GAS_LIMIT)
        const promiseInstance = await liquidityPool.checkIn(gas)
        const transaction = waitTransaction(promiseInstance)
        this.$transaction({
          transaction: transaction,
          content: this.$t('transaction.checkIn').toString(),
          transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
        })
        await transaction
        this.checkButtonState = 'success'
        this.updateLiquidityPool(this.poolAddress)
      } catch (e) {
        this.checkButtonState = 'fail'
        throw e
      } finally {
        this.checkInDisabled = false
      }
    })
  }

  async onClaimEvent() {
    this.claiming = true
    await this.callChainFunc(async () => {
      if (!this.signer || !this.liquidityPoolStorage) {
        return null
      }
      const voteContract = getLpGovernorContract(this.liquidityPoolStorage.governor, this.signer)
      const gas = await getGasStationTxParams(gasLimitConfig.CLAIM_SATORI_MINING_REWARD)
      const promiseInstance = await claimMiningReward(voteContract, gas)
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.claimMiningReward', {}).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      const result = await transaction
      await this.getClaimableMiningReward()
      return result
    })
    this.claiming = false
  }
}
