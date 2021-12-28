import { Component, Vue, Watch } from 'vue-property-decorator'
import {
  TradingMiningCurrentEpoch,
  TradingMiningEpochInfo,
  TradingMiningEpochList,
} from '@/template/components/Mining/tradingMiningMixin'
import { currentChainConfig } from '@/config/chain'
import { namespace } from 'vuex-class'
import {
  AccountTradingMiningInfo,
  AccountTradingMiningMultiChainInfo,
  TotalTradingMiningInfo,
  TradingMiningMultiChainID
} from '@/type'
import {
  queryAccountTradingMiningInfo,
  queryAccountTradingMiningMultiChainInfo,
  queryTotalTradingMiningInfo,
} from '@/api/tradingMiningV2'
import BigNumber from 'bignumber.js'
import _ from 'lodash'
import { NETWORK_ENV, SUPPORTED_NETWORK_ID } from '@/constants'

const wallet = namespace('wallet')

@Component
export default class TradingMiningHistoryMixin extends Vue {
  @wallet.Getter('address') address !: string

  protected nowTimestamp: number = Math.ceil(Date.now() / 1000)

  protected selectedEpoch: number = TradingMiningCurrentEpoch[currentChainConfig.chainID] > 0
    ? TradingMiningCurrentEpoch[currentChainConfig.chainID] - 1 : TradingMiningCurrentEpoch[currentChainConfig.chainID]
  protected accountTradingMiningInfo: { [id: number]: AccountTradingMiningMultiChainInfo } = {}
  protected totalTradingMiningInfo: { [id: number]: TotalTradingMiningInfo } = {}

  protected TradingMiningMultiChainID = TradingMiningMultiChainID

  get isArbTestnet() {
    return currentChainConfig.chainID === SUPPORTED_NETWORK_ID.ARB_TESTNET
  }

  get currentEpoch() {
    return TradingMiningCurrentEpoch[NETWORK_ENV.CHAIN_ID]
  }

  get epochsOption() {
    let currentChainEpochList: number[] = []
    TradingMiningEpochList[currentChainConfig.chainID].forEach((item => {
      if (item !== this.currentEpoch) {
        currentChainEpochList.push(item)
      }
    }))
    return currentChainEpochList.map((id) => {
      return {
        label: this.$t('tradingMining.epoch', { id: id }).toString(),
        value: id,
      }
    })
  }

  get selectedEpochInfo() {
    return TradingMiningEpochInfo[currentChainConfig.chainID][this.selectedEpoch]
  }

  get selectedEpochClaimTime(): number {
    const delayTimestamp = 86400 * 5  // 5 day
    return this.selectedEpochInfo.endTimestamp + delayTimestamp
  }

  get accountReward(): BigNumber {
    if (!this.accountTradingMiningInfo[this.selectedEpoch]) {
      return new BigNumber(0)
    }
    const proportion = this.accountTradingMiningInfo[this.selectedEpoch].proportion as BigNumber
    const totalReward = this.selectedEpochInfo.totalReward
    return totalReward.times(proportion)
  }

  get accountTotalFeePaidMultiChain() {
    return this.accountTradingMiningInfo[this.selectedEpoch]?.totalFee || null
  }

  get accountDaoFeePaidMultiChain() {
    return this.accountTradingMiningInfo[this.selectedEpoch]?.daoFee || null
  }

  get accountBaseDaoFeePaidMultiChain() {
    return this.accountTradingMiningInfo[this.selectedEpoch]?.baseDaoFee || null
  }

  get accountAverageOpenInterestMultiChain() {
    return this.accountTradingMiningInfo[this.selectedEpoch]?.averageOI || null
  }

  get accountAverageStakingScoreMultiChain() {
    return this.accountTradingMiningInfo[this.selectedEpoch]?.averageStake || null
  }

  get accountTotalFee(): BigNumber {
    return this.accountTradingMiningInfo[this.selectedEpoch]?.totalFee[TradingMiningMultiChainID.TOTAL] as BigNumber || new BigNumber(0)
  }

  get accountDaoFee(): BigNumber {
    return this.accountTradingMiningInfo[this.selectedEpoch]?.daoFee[TradingMiningMultiChainID.TOTAL] as BigNumber || new BigNumber(0)
  }

  get accountBaseDaoFee(): BigNumber {
    return this.accountTradingMiningInfo[this.selectedEpoch]?.baseDaoFee[TradingMiningMultiChainID.TOTAL] as BigNumber || new BigNumber(0)
  }

  get accountOpenInterest(): BigNumber {
    return this.accountTradingMiningInfo[this.selectedEpoch]?.averageOI[TradingMiningMultiChainID.TOTAL] as BigNumber || new BigNumber(0)
  }

  get accountStakingScore(): BigNumber {
    return this.accountTradingMiningInfo[this.selectedEpoch]?.averageStake[TradingMiningMultiChainID.TOTAL] as BigNumber || new BigNumber(0)
  }

  get accountTraderScore(): BigNumber {
    return this.accountTradingMiningInfo[this.selectedEpoch]?.score as BigNumber || new BigNumber(0)
  }

  get accountShareOfPool(): BigNumber {
    if (!this.accountTradingMiningInfo[this.selectedEpoch]) {
      return new BigNumber(0)
    }
    return new BigNumber(this.accountTradingMiningInfo[this.selectedEpoch].proportion).times(100)
  }

  get totalRewardsPool(): BigNumber {
    return this.selectedEpochInfo.totalReward
  }

  get totalFee(): BigNumber {
    return this.totalTradingMiningInfo[this.selectedEpoch]?.totalFee as BigNumber || new BigNumber(0)
  }

  get totalOpenInterest(): BigNumber {
    return this.totalTradingMiningInfo[this.selectedEpoch]?.totalOI as BigNumber || new BigNumber(0)
  }

  get totalStakingScore(): BigNumber {
    return this.totalTradingMiningInfo[this.selectedEpoch]?.totalStakeScore as BigNumber || new BigNumber(0)
  }

  get totalTraderScore(): BigNumber {
    return this.totalTradingMiningInfo[this.selectedEpoch]?.totalScore as BigNumber || new BigNumber(0)
  }

  protected updateData = _.debounce(() => {
    this.updateAccountData()
    this.updateTotalEpochData()
  }, 200)

  async updateAccountData() {
    if (!this.address) {
      return
    }
    try {
      const result = await queryAccountTradingMiningMultiChainInfo(this.address)
      if (result) {
        this.accountTradingMiningInfo = result.data
      }
    } catch (e) {
      console.warn('update account trading mining data fail', e)
    }
  }

  async updateTotalEpochData() {
    try {
      const result = await queryTotalTradingMiningInfo()
      if (result) {
        this.totalTradingMiningInfo = result.data
      }
    } catch (e) {
      console.warn('update total trading mining data fail', e)
    }
  }

  onSelectedEpochIdChanged() {
    this.nowTimestamp = Math.ceil(Date.now() / 1000)
  }

  @Watch('address')
  onInfoChangeUpdateData() {
    this.updateData()
  }
}
