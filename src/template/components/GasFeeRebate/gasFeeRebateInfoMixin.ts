import { Component, Vue, Watch } from 'vue-property-decorator'
import {
  currentChainEpochsConfig,
  currentChainEpochGasFeeRebateId,
  currentChainEpochGasFeeRebateRate,
  gasFeeRebateIsEnd,
  MultiChainGasFeeRebateConfigs,
  currentChainEpochHistoryList,
} from './gasFeeRebateConfig'
import { AccountGasFeeInfo } from '@/type'
import BigNumber from 'bignumber.js'
import { currentChainConfig } from '@/config/chain'
import { namespace } from 'vuex-class'
import { queryAccountGasFeeRebateInfo } from '@/api/gasFeeRebate'
import {
  distributedTimeDelay,
  gasFeeRebateAllowClaimEpoch,
} from '@/template/components/GasFeeRebate/gasFeeRebateClaimMixin'
import { bigNumberFormatterTruncateByPrecision, momentFormatter } from '@/utils'
import moment from 'moment'

const wallet = namespace('wallet')

@Component
export class GasFeeRebateInfoMixin extends Vue {
  @wallet.Getter('address') accountAddress !: string

  protected loadingData: boolean = false

  protected accountEpochsInfo: { [id: number]: AccountGasFeeInfo } = {}

  get currentChainConfig() {
    return currentChainConfig
  }

  get currentGasFeeRebateEpochViewStr(): string {
    if (currentChainEpochGasFeeRebateId < 0) {
      return ''
    }
    return String(currentChainEpochGasFeeRebateId + 1)
  }

  get currentEpochDistributedTime(): number {
    return this.currentGasFeeRebateInfo?.endTimestamp + distributedTimeDelay || 0
  }

  get recentClaimEpoch(): null | {
    id: number
    claimTimestamp: number
  } {
    const chainMaxEpochInfo = Object.keys(currentChainEpochsConfig).map(i => Number(i))
    const maxEpochInfo = currentChainEpochsConfig[Math.max(...chainMaxEpochInfo)]
    const nowTimestamp = Date.now() / 1000
    if (gasFeeRebateIsEnd && nowTimestamp > (maxEpochInfo.endTimestamp+distributedTimeDelay)
      || currentChainEpochGasFeeRebateId === 0) {
      return null
    }

    const id = currentChainEpochGasFeeRebateId - 1
    if (gasFeeRebateAllowClaimEpoch[currentChainConfig.chainID].indexOf(id) === -1
      && currentChainEpochHistoryList.indexOf(id) > -1) {
      return {
        id: id,
        claimTimestamp: currentChainEpochsConfig[id].endTimestamp + distributedTimeDelay
      }
    }
    return null
  }


  get allowClaimableList() {
    return gasFeeRebateAllowClaimEpoch[currentChainConfig.chainID].sort().reverse()
  }

  get currentGasFeeRebateInfo() {
    return currentChainEpochsConfig[currentChainEpochGasFeeRebateId] || null
  }

  get currentGasFeeRebateRate() {
    return currentChainEpochGasFeeRebateRate
  }

  get currentEpochAccountInfo(): AccountGasFeeInfo | null {
    return this.accountEpochsInfo[currentChainEpochGasFeeRebateId] || null
  }

  get currentEpochAccountGasFee(): BigNumber {
    return this.currentEpochAccountInfo?.gasFee as BigNumber || new BigNumber(0)
  }

  get gasFeeRebateIsEnd() {
    return gasFeeRebateIsEnd
  }

  formatTime(val: number): string {
    return momentFormatter(moment.unix(val).local(), 'MMM D, YYYY')
  }

  formatPrice(val: BigNumber): string {
    return bigNumberFormatterTruncateByPrecision(val, 6, 1, 2)
  }

  async initialAccountInfo() {
    this.loadingData = true
    await this.updateAccountGasFeeInfo()
    this.loadingData = false
  }

  async updateAccountGasFeeInfo() {
    if (!this.accountAddress) {
      this.accountEpochsInfo = {}
    }
    try {
      const data = await queryAccountGasFeeRebateInfo(this.accountAddress)
      if (!data) {
        return
      }
      this.accountEpochsInfo = data.data
    } catch (e) {
      console.warn("update trader gas fee rebate data fail", e)
    }
  }

  @Watch('accountAddress')
  onWalletChanged() {
    this.initialAccountInfo()
  }
}
