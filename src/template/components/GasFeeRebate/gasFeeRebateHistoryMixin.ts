import { Component, Mixins, Watch } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import { namespace } from 'vuex-class'
import BigNumber from 'bignumber.js'
import {
  currentChainEpochsConfig,
  currentChainEpochGasFeeRebateId,
  currentChainEpochHistoryList,
  MultiChainGasFeeRebateConfigs,
  gasFeeRebateIsEnd,
} from './gasFeeRebateConfig'
import { queryAccountGasFeeRebateInfo } from '@/api/gasFeeRebate'
import { AccountGasFeeInfo } from '@/type'
import { distributedTimeDelay, gasFeeRebateAllowClaimEpoch, GasFeeRebateClaimMixin } from './gasFeeRebateClaimMixin'
import { bigNumberFormatterTruncateByPrecision } from '@/utils'
import { currentChainConfig } from '@/config/chain'

interface EpochHistoryItem {
  epoch: number
  weekId: string
  gas: BigNumber
  startTimestamp: number
  endTimestamp: number
}

const wallet = namespace('wallet')

@Component
export class GasFeeRebateHistoryMixin extends Mixins(ErrorHandlerMixin, GasFeeRebateClaimMixin) {
  @wallet.Getter('address') accountAddress !: string

  private loadingData: boolean = false

  protected accountEpochsInfo: { [id: number]: AccountGasFeeInfo } = {}
  protected accountHistoryData: EpochHistoryItem[] = []

  get recentClaimEpoch(): null | {
    id: number
    claimTimestamp: number
  } {
    const chainMaxEpochInfo = Object.keys(currentChainEpochsConfig).map(i => Number(i))
    const maxEpochInfo = currentChainEpochsConfig[Math.max(...chainMaxEpochInfo)]
    const nowTimestamp = Date.now() / 1000
    if (gasFeeRebateIsEnd && nowTimestamp > (maxEpochInfo.endTimestamp+distributedTimeDelay)) {
      return null
    }

    if (currentChainEpochGasFeeRebateId === 0) {
      return {
        id: 0,
        claimTimestamp: currentChainEpochsConfig[0].endTimestamp + distributedTimeDelay
      }
    }
    const id = currentChainEpochGasFeeRebateId - 1
    if (gasFeeRebateAllowClaimEpoch[currentChainConfig.chainID].indexOf(id) === -1
      && currentChainEpochHistoryList.indexOf(id) > -1) {
      return {
        id: id,
        claimTimestamp: currentChainEpochsConfig[id].endTimestamp + distributedTimeDelay
      }
    }
    return {
      id: currentChainEpochGasFeeRebateId,
      claimTimestamp: currentChainEpochsConfig[currentChainEpochGasFeeRebateId].endTimestamp + distributedTimeDelay
    }
  }

  getGasFee(epochId: number): BigNumber {
    return this.accountEpochsInfo[epochId]?.gasFee as BigNumber || new BigNumber(0)
  }

  getRebatePriceView(epoch: number): string {
    const price = this.claimableHistoryInfo[epoch]?.price || null
    if (price) {
      return bigNumberFormatterTruncateByPrecision(price, 6, 2, 3)
    }
    return this.$t('base.currentlyUnknown').toString()
  }

  getRebatedValue(epoch: number): BigNumber {
    return this.claimableHistoryInfo[epoch]?.rebatedValue || new BigNumber(0)
  }

  getClaimedValue(epoch: number): BigNumber {
    return this.claimableHistoryInfo[epoch]?.claimedValue || new BigNumber(0)
  }

  async updateAccountGasFeeInfo() {
    const data = await queryAccountGasFeeRebateInfo(this.accountAddress)
    if (!data) {
      return
    }
    this.accountEpochsInfo = data.data
  }

  async updateHistoryData() {
    if (!this.accountAddress) {
      this.accountEpochsInfo = {}
      this.accountHistoryData = []
      return
    }
    this.loadingData = true
    let result: EpochHistoryItem[] = []
    try {
      await this.updateAccountGasFeeInfo()
      for (let index in currentChainEpochHistoryList) {
        const epochId = currentChainEpochHistoryList[index]
        const item = {
          epoch: epochId,
          weekId: String(epochId+1),
          gas: this.getGasFee(epochId),
          startTimestamp: currentChainEpochsConfig[epochId].startTimestamp,
          endTimestamp: currentChainEpochsConfig[epochId].endTimestamp
        }
        result.push(item)
      }
      this.accountHistoryData = result.reverse()
    } catch (e) {
      console.warn('update trader gas fee rebate history fail', e)
    }
    this.loadingData = false
  }

  @Watch('accountAddress')
  onWalletChanged() {
    this.updateHistoryData()
  }
}
