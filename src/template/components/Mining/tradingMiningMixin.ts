import { Component, Mixins, Watch } from 'vue-property-decorator'
import BigNumber from 'bignumber.js'
import { namespace } from 'vuex-class'
import { ErrorHandlerMixin } from '@/mixins'
import { Provider } from '@ethersproject/providers'
import _ from 'lodash'
import {
  queryAccountTradingMiningMultiChainInfo,
  queryTotalTradingMiningInfo,
} from '@/api/tradingMiningV2'
import {
  AccountTradingMiningMultiChainInfo,
  TotalTradingMiningInfo,
  TradingMiningMultiChainID,
} from '@/type'
import { MINING_EVENT, VUE_EVENT_BUS } from '@/event'
import { SATORI_ADDRESS_CONFIG, NETWORK_ENV, SUPPORTED_NETWORK_ID } from '@/const'
import { queryPerpetualByPool } from '@/api/perpetual'
import { _0 } from '@mcdex/mai3.js'
import moment from 'moment'
import { bigNumberFormatterTruncateByPrecision, toBigNumber } from '@/utils'
import { currentChainConfig } from '@/config/chain'

const bscArbTradingMiningCurrentEpoch: number = 4

export const TradingMiningCurrentEpoch: { [chainID: number]: number } = {
  [SUPPORTED_NETWORK_ID.BSC]: bscArbTradingMiningCurrentEpoch,
  [SUPPORTED_NETWORK_ID.ARB]: bscArbTradingMiningCurrentEpoch,
  [SUPPORTED_NETWORK_ID.ARB_TESTNET]: 1,
}

export const TradingMiningMultiChain: { [chainID: number]: SUPPORTED_NETWORK_ID[]} = {
  [SUPPORTED_NETWORK_ID.ARB_TESTNET]: [SUPPORTED_NETWORK_ID.ARB_TESTNET, SUPPORTED_NETWORK_ID.BSC],
  [SUPPORTED_NETWORK_ID.ARB]: [SUPPORTED_NETWORK_ID.ARB, SUPPORTED_NETWORK_ID.BSC],
  [SUPPORTED_NETWORK_ID.BSC]: [SUPPORTED_NETWORK_ID.ARB, SUPPORTED_NETWORK_ID.BSC],
}

const bscArbTradingMiningEpochList: number[] = [0, 1, 2, 3].sort()

export const TradingMiningEpochList: { [chainID: number]: number[] } = {
  [SUPPORTED_NETWORK_ID.BSC]: bscArbTradingMiningEpochList,
  [SUPPORTED_NETWORK_ID.ARB]: bscArbTradingMiningEpochList,
  [SUPPORTED_NETWORK_ID.ARB_TESTNET]: [0].sort(),
}

type TradingMiningEpochConfig = {
  [id: number]: {
    totalReward: BigNumber
    startTimestamp: number
    endTimestamp: number
  }
}

const bscArbTradingMiningEpochInfo: TradingMiningEpochConfig = {
  0: {
    totalReward: new BigNumber(95000),
    startTimestamp: 1633305600,
    endTimestamp: 1634515200,
  },
  1: {
    totalReward: new BigNumber(72000),
    startTimestamp: 1634515200,
    endTimestamp: 1635724800,
  },
  2: {
    totalReward: new BigNumber(63000),
    startTimestamp: 1635724800,
    endTimestamp: 1636934400,
  },
  3: {
    totalReward: new BigNumber(54000),
    startTimestamp: 1636934400,
    endTimestamp: 1638144000,
  },
  4: {
    totalReward: new BigNumber(45000),
    startTimestamp: 1638144000,
    endTimestamp: 1639353600,
  },
  5: {
    totalReward: new BigNumber(36000),
    startTimestamp: 1639353600,
    endTimestamp: 1640563200,
  }
}

export const TradingMiningEpochInfo: { [chainId: number]: TradingMiningEpochConfig } = {
  [SUPPORTED_NETWORK_ID.BSC]: bscArbTradingMiningEpochInfo,
  [SUPPORTED_NETWORK_ID.ARB]: bscArbTradingMiningEpochInfo,
  [SUPPORTED_NETWORK_ID.ARB_TESTNET]: {
    0: {
      totalReward: new BigNumber(95000),
      startTimestamp: 1633176000,
      endTimestamp: 1634385600,
    },
    1: {
      totalReward: new BigNumber(72000),
      startTimestamp: 1634295600,
      endTimestamp: 1635505200,
    },
  },
}

const wallet = namespace('wallet')
const price = namespace('price')

@Component
export default class TradingMiningMixin extends Mixins(ErrorHandlerMixin) {
  @wallet.Getter('address') walletAddress !: string
  @wallet.Getter('provider') provider !: Provider
  @price.Getter('tokenPriceFunc') tokenPriceFunc!: (token: string, networkId: number) => BigNumber | null
  @price.Action('updateTokenPrice') updateTokenPrice!: (payload: { tokens: string[], networkId: number }) => Promise<void>

  protected TradingMiningMultiChainID = TradingMiningMultiChainID

  protected currentEpochStart: boolean = false

  protected lastAllTraderScore: BigNumber = new BigNumber(0)

  protected loading: boolean = false
  protected accountTradingMiningInfo: { [id: number]: AccountTradingMiningMultiChainInfo } = {}
  protected totalTradingMiningInfo: { [id: number]: TotalTradingMiningInfo } = {}

  protected timeInterval: number = 0

  mounted() {
    this.checkCurrentEpochIsStart()
    VUE_EVENT_BUS.on(MINING_EVENT.UpdateTradingMiningAccountInfo, this.updateAccountDebounce)
    this.initialUpdate()

    this.timeInterval = window.setInterval(() => {
      this.updateAccountDebounce()
    }, 60000)
    this.updateTokenPrice({ tokens: [SATORI_ADDRESS_CONFIG[SUPPORTED_NETWORK_ID.ARB]], networkId: SUPPORTED_NETWORK_ID.ARB })
  }

  beforeDestroy() {
    VUE_EVENT_BUS.off(MINING_EVENT.UpdateTradingMiningAccountInfo, this.updateAccountDebounce)
    window.clearInterval(this.timeInterval)
  }

  get isArbTestnet() {
    return currentChainConfig.chainID === SUPPORTED_NETWORK_ID.ARB_TESTNET
  }

  get multiChainSupported() {
    return TradingMiningMultiChain[currentChainConfig.chainID]
  }

  get allTraderScoreChangeSide(): 'up' | 'down' {
    if (!this.currentTotalInfo) {
      return 'up'
    }
    const totalScore = new BigNumber(this.currentTotalInfo.totalScore)
    if (totalScore.lt(this.lastAllTraderScore)) {
      return 'down'
    }
    return 'up'
  }

  get mcbTokenPrice() {
    return this.tokenPriceFunc(SATORI_ADDRESS_CONFIG[SUPPORTED_NETWORK_ID.ARB], SUPPORTED_NETWORK_ID.ARB)
  }

  get currentEpoch() {
    return TradingMiningCurrentEpoch[NETWORK_ENV.CHAIN_ID]
  }

  get currentEpochInfo() {
    return TradingMiningEpochInfo[NETWORK_ENV.CHAIN_ID][this.currentEpoch]
  }

  get currentAccountInfo(): AccountTradingMiningMultiChainInfo | null {
    return this.accountTradingMiningInfo[this.currentEpoch] || null
  }

  get currentTotalInfo(): TotalTradingMiningInfo | null {
    return this.totalTradingMiningInfo[this.currentEpoch] || null
  }

  get isWarningAvGStakingScore(): boolean {
    if ((!this.totalFeesPaid.isZero() || !this.averageOpenInterest.isZero())
      && this.averageStakingScore.isZero()) {
      return true
    }
    return false
  }

  get isNeedStakeMcb(): boolean {
    if (!this.currentEpochInfo || !this.currentAccountInfo
      || this.recommendStakeScore.isZero()
      || toBigNumber(this.currentAccountInfo.daoFee[TradingMiningMultiChainID.TOTAL]).isZero()
      || toBigNumber(this.currentAccountInfo.averageOI[TradingMiningMultiChainID.TOTAL]).isZero()) {
      return false
    }
    if (this.recommendStakeScore.gt(this.currentAccountInfo.averageStake[TradingMiningMultiChainID.TOTAL])) {
      return true
    }
    return false
  }

  get stakingScorePromp2() {
    if (!this.currentAccountInfo || !this.currentTotalInfo) {
      return ''
    }
    let fee = Number(new BigNumber(this.currentAccountInfo.totalFee[TradingMiningMultiChainID.TOTAL]).toFixed())
    if (this.currentEpoch > 0) {
      fee = Number(new BigNumber(this.currentAccountInfo.daoFee[TradingMiningMultiChainID.TOTAL]).toFixed())
    }
    const oi = Number(new BigNumber(this.currentAccountInfo.averageOI[TradingMiningMultiChainID.TOTAL]).toFixed())
    const stakingScore = Number(this.recommendStakeScore.toFixed())
    const otherTradeTrader = toBigNumber(this.currentTotalInfo.totalScore).minus(this.currentAccountInfo.score)
    const newScore = toBigNumber((fee**0.7) * (oi**0.3) * (stakingScore**0.3))
    const percentage = newScore.div(newScore.plus(otherTradeTrader))
    const reward = this.currentEpochInfo.totalReward.times(percentage)
    return this.$t('tradingMining.stakingScorePromp2', {
      newStakingScore: bigNumberFormatterTruncateByPrecision(stakingScore, 6, 1, 0),
      stake: bigNumberFormatterTruncateByPrecision(this.recommendStakeMcb, 6, 1, 2),
      percentage: bigNumberFormatterTruncateByPrecision(percentage, 6, 2, 2),
      reward: bigNumberFormatterTruncateByPrecision(reward, 6, 2, 2)
    }).toString()
  }

  get estimatedValue(): BigNumber {
    const proportion = new BigNumber(this.currentAccountInfo?.proportion || 0)
    return this.currentEpochInfo.totalReward.times(proportion)
  }

  get totalFeesPaid(): BigNumber {
    return new BigNumber(this.currentAccountInfo?.totalFee[TradingMiningMultiChainID.TOTAL] || 0)
  }

  get daoFeePaid(): BigNumber {
    return new BigNumber(this.currentAccountInfo?.daoFee[TradingMiningMultiChainID.TOTAL] || 0)
  }

  get baseDaoFeePaid(): BigNumber {
    return new BigNumber(this.currentAccountInfo?.baseDaoFee[TradingMiningMultiChainID.TOTAL] || 0)
  }

  get daoFeePaidMultiChain() {
    return this.currentAccountInfo?.daoFee || null
  }

  get daoFeePaidStr(): string {
    return bigNumberFormatterTruncateByPrecision(this.daoFeePaid, 6, 1, 0)
  }

  get baseDaoFeePaidMultiChain() {
    return this.currentAccountInfo?.baseDaoFee || null
  }

  get baseDaoFeePaidStr(): string {
    return bigNumberFormatterTruncateByPrecision(this.baseDaoFeePaid, 6, 1, 0)
  }

  get totalFeePaidMultiChain() {
    return this.currentAccountInfo?.totalFee  || null
  }

  get totalFeePaidStr(): string {
    return bigNumberFormatterTruncateByPrecision(this.totalFeesPaid, 6, 1, 0)
  }

  get averageOpenInterestMultiChain() {
    return this.currentAccountInfo?.averageOI || null
  }

  get averageOpenInterest(): BigNumber {
    if (!this.currentAccountInfo) {
      return new BigNumber(0)
    }
    return new BigNumber(this.currentAccountInfo.averageOI[TradingMiningMultiChainID.TOTAL])
  }

  get averageStakingScoreMultiChain() {
    return this.currentAccountInfo?.averageStake || null
  }

  get averageStakingScore(): BigNumber {
    if (!this.currentAccountInfo) {
      return new BigNumber(0)
    }
    return new BigNumber(this.currentAccountInfo.averageStake[TradingMiningMultiChainID.TOTAL])
  }

  get allTraderScore(): BigNumber {
    if (!this.currentTotalInfo) {
      return new BigNumber(0)
    }
    return new BigNumber(this.currentTotalInfo.totalScore)
  }

  get accountScore(): BigNumber {
    if (!this.currentAccountInfo) {
      return new BigNumber(0)
    }
    return new BigNumber(this.currentAccountInfo.score)
  }

  get accountScoreOfPool(): BigNumber {
    if (!this.currentAccountInfo) {
      return new BigNumber(0)
    }
    return new BigNumber(this.currentAccountInfo.proportion).times(100)
  }

  get recommendStakeScore(): BigNumber {
    // (K/(R*P/TotalFee - 1) / (DaoFee^0.7) / (OI ^ 0.3)) ^ (10/3)
    if (!this.currentAccountInfo || !this.currentEpochInfo || !this.mcbTokenPrice || !this.currentTotalInfo) {
      return new BigNumber(0)
    }
    const r = this.currentEpochInfo.totalReward
    const k = toBigNumber(this.currentTotalInfo.totalScore).minus(this.currentAccountInfo.score)
    const p = this.mcbTokenPrice.times(0.9)
    const totalFee = Number(new BigNumber(this.currentAccountInfo.totalFee[TradingMiningMultiChainID.TOTAL]).toFixed())
    let fee = Number(new BigNumber(this.currentAccountInfo.totalFee[TradingMiningMultiChainID.TOTAL]).toFixed())
    if (this.currentEpoch > 0) {
      fee = Number(new BigNumber(this.currentAccountInfo.daoFee[TradingMiningMultiChainID.TOTAL]).toFixed())
    }
    const oi = Number(new BigNumber(this.currentAccountInfo.averageOI[TradingMiningMultiChainID.TOTAL]))
    // t = (R*P/TotalFee - 1)
    const t = r.times(p).div(totalFee).minus(1)
    // (K/(R*P/TotalFee - 1) / (DaoFee^0.7) / (OI ^ 0.3))
    const s = Number(k.div(t).div(fee**0.7).div(oi**0.3).toFixed())
    const result = new BigNumber(s ** (10/3))
    return result.isNaN() ? new BigNumber(0) : result
  }

  get recommendStakeMcb() {
    if (this.recommendStakeScore.isZero() || !this.currentAccountInfo) {
      return new BigNumber(0)
    }

    const remainTraderScore = this.recommendStakeScore.minus(this.currentAccountInfo.averageStake[TradingMiningMultiChainID.TOTAL])
    const remainEpochTimestamp = this.currentEpochInfo.endTimestamp - Math.ceil(Date.now() / 1000)
    const totalEpochTimestamp = this.currentEpochInfo.endTimestamp - this.currentEpochInfo.startTimestamp
    const remainEpochDays = Math.floor(remainEpochTimestamp / 86400)

    return remainTraderScore.div(100).div(remainEpochTimestamp / totalEpochTimestamp)
      .div(1-remainEpochDays/100/2)
  }

  getMinedSATORI() {
    const r = Math.min((moment().unix() - this.currentEpochInfo.startTimestamp) / (this.currentEpochInfo.endTimestamp - this.currentEpochInfo.startTimestamp), 1)
    return this.currentEpochInfo.totalReward.times(r)
  }

  getAvgTimeRemainingDay(): number {
    const r = (Date.now() / 1000) - this.currentEpochInfo.startTimestamp
    return Math.ceil(r / 86400)
  }

  getAvgTimeRemainingMinute(): number {
    const r = (Date.now() / 1000) - this.currentEpochInfo.startTimestamp
    return Math.ceil(r / 60)
  }

  private updateAccountDebounce = _.debounce(() => {
    this.updateAccountData()
    this.updateEpochTotalData()
  }, 200)

  async initialUpdate() {
    this.loading = true
    await this.updateAccountData()
    await this.updateEpochTotalData()
    this.loading = false
  }

  async getTotalFeeOfPool(poolAddress: string, blockNumber?: number) {
    const [nowPerpetuals, startPerpetuals] = await Promise.all([
      queryPerpetualByPool(poolAddress),
      queryPerpetualByPool(poolAddress, blockNumber),
    ])
    const nowFee = nowPerpetuals.perpetuals.reduce<BigNumber>((fee: BigNumber, p): BigNumber => {
      return fee.plus(p.totalFee || 0)
    }, _0)
    const startFee = startPerpetuals.perpetuals.reduce<BigNumber>((fee: BigNumber, p): BigNumber => {
      return fee.plus(p.totalFee || 0)
    }, _0)
    return nowFee.minus(startFee)
  }

  async updateAccountData() {
    if (!this.currentEpochStart || !this.walletAddress) {
      return
    }
    try {
      const result = await queryAccountTradingMiningMultiChainInfo(this.walletAddress)
      if (result) {
        this.accountTradingMiningInfo = result.data
      }
    } catch (e) {
      console.warn('update account trading mining data fail', e)
    }
  }

  async updateEpochTotalData() {
    try {
      const result = await queryTotalTradingMiningInfo()
      if (result) {
        // update last all trader score
        this.lastAllTraderScore = this.currentTotalInfo?.totalScore as BigNumber || new BigNumber(0)
        this.totalTradingMiningInfo = result.data
      }
    } catch (e) {
      console.warn('update epoch total trading mining data fail', e)
    }
  }

  get stakeButtonText() {
    return this.$t('tradingMining.boostBy', {
      amount: this.isNeedStakeMcb ? bigNumberFormatterTruncateByPrecision(this.recommendStakeMcb, 2, 1, 0)
        : this.$t('tradingMining.staking').toString()
    }).toString()
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
  @Watch('currentEpochStart')
  onDataChangeInitialData() {
    if (!this.walletAddress || !this.currentEpochStart) {
      return
    }
    this.updateAccountDebounce()
  }
}
