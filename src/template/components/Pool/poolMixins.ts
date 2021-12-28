import { Mixins, Component, Watch } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import { queryPoolBaseInfo } from '@/api/pool'
import { LiquidityAccount, LiquidityPoolDirectoryItem } from '@/type'
import { namespace } from 'vuex-class'
import { Provider } from '@ethersproject/providers'
import { padLeft } from '@/utils'
import { isNativeToken} from '@/utils/chain'
import { currentChainConfig } from '@/config/chain'
import { DEFAULT_SYMBOL_LENGTH, TARGET_NETWORK_ID } from '@/constants'
import { ethers } from 'ethers'
import { CHAIN_ID_TO_POOL_CREATOR_ADDRESS, getPoolCreatorContract } from '@mcdex/mai3.js'
import { queryAccountLiquidityPool } from '@/api/account'

export interface PoolPerpBaseInfo {
  underlying: string
  symbol: string
  oracleAddress: string
}

export interface PoolGovernorInfo {
  id: string
  totalReward: string
  rewardRate: string
  periodFinish: string
}

export interface PoolBaseInfo {
  isMiningPool: boolean
  poolAddress: string
  operatorAddress: string
  collateralSymbol: string
  collateralAddress: string
  shareAddress: string
  voteAddress: string
  perpetualSymbol: string
  poolMarginUSD: string
  poolMargin: string
  perpetuals: Array<PoolPerpBaseInfo>
  governor: PoolGovernorInfo | null
}

const perpetual = namespace('perpetual')
const wallet = namespace('wallet')

@Component
export class PoolMixins extends Mixins(ErrorHandlerMixin) {
  @wallet.Getter('address') userAddress!: string | null
  @perpetual.Getter('getLiquidityPoolFunc') getLiquidityPoolFunc!: (
    liquidityPoolAddress: string
  ) => LiquidityPoolDirectoryItem | null
  @perpetual.Action('updateLiquidityPool') updateLiquidityPool!: (liquidityPoolAddress: string) => Promise<void>
  @wallet.Getter('provider') provider!: Provider
  @wallet.Getter('providerL1') providerL1!: Provider
  protected poolAddress: string = ''
  protected perpetualSymbol: string = ''
  protected poolBaseInfo: PoolBaseInfo | null = null
  protected liquidityAccount: LiquidityAccount | null = null
  protected poolLoading: boolean = true
  // private execute: string = 'first-loading'

  private loadBaseInfoRetryCount: number = 0
  protected loadTimer = 0

  get liquidityPool(): LiquidityPoolDirectoryItem | null {
    if (this.poolAddress === '') return null
    return this.getLiquidityPoolFunc(this.poolAddress)
  }

  get poolIsRunning(): boolean {
    if (!this.liquidityPool) return true
    return this.liquidityPool.liquidityPoolStorage.isRunning
  }

  destroyed() {
    window.clearInterval(this.loadTimer)
  }

  async convertPoolBaseInfo() {
    if (!this.liquidityPool) {
      return
    }
    const convertPerps = (): PoolPerpBaseInfo[] => {
      let newPerpetuals: PoolPerpBaseInfo[] = []
      if (this.liquidityPool) {
        this.liquidityPool.liquidityPoolStorage.perpetuals.forEach((val) => {
          newPerpetuals.push({
            underlying: val.underlyingSymbol,
            symbol: padLeft(val.symbol, DEFAULT_SYMBOL_LENGTH),
            oracleAddress: val.oracle,
          })
        })
      }
      return newPerpetuals
    }

    await this.onPoolBaseInfoChanged({
      isMiningPool: false,
      poolAddress: this.poolAddress,
      operatorAddress: this.liquidityPool.liquidityPoolStorage.operator,
      collateralSymbol: '',
      collateralAddress: this.liquidityPool.liquidityPoolStorage.collateral,
      shareAddress: this.liquidityPool.liquidityPoolStorage.shareToken,
      voteAddress: this.liquidityPool.liquidityPoolStorage.governor,
      perpetualSymbol: this.perpetualSymbol,
      poolMarginUSD: '0',
      poolMargin: '0',
      perpetuals: convertPerps(),
      governor: null,
    })
  }

  async onPoolBaseInfoChanged(v: PoolBaseInfo) {
    const baseInfo = await this.callGraphApiFunc(() => {
      return queryPoolBaseInfo(this.poolAddress)
    })
    if (!baseInfo) {
      this.poolBaseInfo = v
      return
    }
    const newV = v
    newV.poolMarginUSD = (baseInfo.poolBaseInfo?.poolMarginUSD as string) || '0'
    newV.poolMargin = (baseInfo.poolBaseInfo?.poolMargin as string) || '0'
    newV.collateralSymbol = isNativeToken(baseInfo.poolBaseInfo?.collateralAddress || '')
      ? currentChainConfig.symbol
      : baseInfo.poolBaseInfo?.collateralName || ''
    newV.governor = {
      id: baseInfo.poolBaseInfo.governor?.id || '',
      totalReward: baseInfo.poolBaseInfo.governor?.totalReward.toString() || '',
      rewardRate: baseInfo.poolBaseInfo.governor?.rewardRate.toString() || '',
      periodFinish: baseInfo.poolBaseInfo.governor?.periodFinish.toString() || '',
    }
    this.poolBaseInfo = newV
  }

  async checkIsLiquidityPool(address: string): Promise<boolean> {
    const isAddress = ethers.utils.isAddress(address)
    if (!isAddress) {
      return false
    }
    const isLiquidityPool = await this.callChainReadFunc(() => {
      const poolCreator = getPoolCreatorContract(CHAIN_ID_TO_POOL_CREATOR_ADDRESS[TARGET_NETWORK_ID], this.provider)
      return poolCreator.isLiquidityPool(address)
    })
    // call chain error, fix page flashes
    if (isLiquidityPool === null) {
      return true
    }
    return !!isLiquidityPool
  }

  @Watch('provider', { immediate: true })
  @Watch('poolAddress', { immediate: true })
  @Watch('userAddress', { immediate: true })
  async onUpdatePoolStorage() {
    if (this.loadBaseInfoRetryCount === 0) {
      this.updatePoolStorage(false)
    }
  }

  async updatePoolStorage(isSilent: boolean) {
    if (!this.poolAddress || !this.provider) {
      if (!isSilent) {
        this.poolLoading = false
      }
      this.loadBaseInfoRetryCount = 0
      return
    }
    try {
      if (!isSilent) {
        this.poolLoading = true
      }
      this.loadBaseInfoRetryCount += 1
      // pool
      await this.updateLiquidityPool(this.poolAddress)
      await this.convertPoolBaseInfo()
      // account
      const accountLiquidityPools = await this.callGraphApiFunc(() => {
        if (!this.userAddress) {
          return null
        }
        return queryAccountLiquidityPool(this.userAddress)
      })
      if (accountLiquidityPools) {
        this.liquidityAccount = null
        accountLiquidityPools.liquidityPools.forEach((v: LiquidityAccount) => {
          if (v.liquidityPool?.id === this.poolAddress) {
            this.liquidityAccount = v
          }
        })
      } else {
        this.liquidityAccount = null
      }
      // success
      if (!isSilent) {
        this.poolLoading = false
      }
      this.loadBaseInfoRetryCount = 0
    } catch (e) {
      // provider error retry get data
      console.error('update pool failed, retry', this.loadBaseInfoRetryCount, e)
      if (this.loadBaseInfoRetryCount < 5) {
        // again
        this.updatePoolStorage(isSilent)
      } else {
        // abort
        if (!isSilent) {
          this.poolLoading = false
        }
        this.liquidityAccount = null
        this.loadBaseInfoRetryCount = 0
      }
    }
  }

  @Watch('provider', { immediate: true })
  @Watch('poolBaseInfo', { immediate: true })
  async onProviderChanged() {
    if (!this.provider || !this.poolBaseInfo || !this.poolBaseInfo.governor || !this.providerL1) {
      return
    }
    const latestBlockNumber = await this.providerL1.getBlockNumber()
    this.poolBaseInfo.isMiningPool = Number(this.poolBaseInfo.governor.periodFinish) >= latestBlockNumber
  }
}
