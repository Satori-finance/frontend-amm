import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import { SetUniswapMiningRateActionDatas } from './types'
import BigNumber from 'bignumber.js'
import { _0 } from '@mcdex/mai3.js'
import { ethers } from 'ethers'
import { UniswapMiningPoolMixin } from './uniswapMiningPoolMixin'
import { computeDayBlockTotalCount } from '@/utils'
import { currentChainConfig } from '@/config/chain'

@Component
export default class SetUniswapMiningRateActionMixin extends Mixins(UniswapMiningPoolMixin) {
  @Prop({ required: true }) actionIndex !: number
  @Prop({ required: true }) actionDefaultDatas !: SetUniswapMiningRateActionDatas

  protected actionDatasForm: SetUniswapMiningRateActionDatas = this.actionDefaultDatas

  get normalizeMiningRate(): BigNumber {
    return this.actionDatasForm.miningRate ? new BigNumber(this.actionDatasForm.miningRate) : _0
  }

  get invalidMiningRate(): boolean {
    return this.actionDatasForm.miningRate==='' || this.normalizeMiningRate.isNaN() || this.normalizeMiningRate.lt(_0)
  }

  get invalidPoolAddress(): boolean {
    if (!ethers.utils.isAddress(this.actionDatasForm.miningPoolAddress)) {
      return true
    }
    for (let i=0; i<this.uniswapMiningPoolOptions.length; i++) {
      const item = this.uniswapMiningPoolOptions[i]
      if (item.value.toLowerCase() === this.actionDatasForm.miningPoolAddress.toLowerCase()) {
        return false
      }
    }
    return true
  }

  get releaseDay(): BigNumber {
    if (this.invalidMiningRate) {
      return new BigNumber(0)
    }
    const blockCount = computeDayBlockTotalCount(currentChainConfig.blockGenerationInterval)
    return this.normalizeMiningRate.times(blockCount)
  }

  @Watch('actionDefaultDatas')
  onActionIndexChanged() {
    this.actionDatasForm = this.actionDefaultDatas
  }

  @Watch('actionDatasForm', { deep: true })
  onActionDatasChanged() {
    this.$emit('update', this.actionIndex, this.actionDatasForm)
  }
}
