import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import { SetLiquidityMiningRateActionDatas } from './types'
import BigNumber from 'bignumber.js'
import { _0 } from '@mcdex/mai3.js'
import { ethers } from 'ethers'
import { Provider } from '@ethersproject/providers'
import { namespace } from 'vuex-class'
import { LiquidityMiningPoolMixin } from './liquidityMiningPoolMixin'
import { computeDayBlockTotalCount } from '@/utils'
import { currentChainConfig } from '@/config/chain'

const wallet = namespace('wallet')

@Component
export default class SetLiquidityMiningRateActionMixin extends Mixins(LiquidityMiningPoolMixin) {
  @Prop({ required: true }) actionIndex !: number
  @Prop({ required: true }) actionDefaultDatas !: SetLiquidityMiningRateActionDatas
  @wallet.Getter('provider') provider!: Provider | null

  protected actionDatasForm: SetLiquidityMiningRateActionDatas = this.actionDefaultDatas

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
    for (let i=0; i<this.liquidityMiningPoolOptions.length; i++) {
      const item = this.liquidityMiningPoolOptions[i]
      if (item.value.toLowerCase() === this.actionDatasForm.miningPoolAddress.toLowerCase()) {
        return false
      }
    }
    return true
  }

  get invalidGovernorAddress(): boolean {
    return this.invalidPoolAddress || this.actionDatasForm.governorAddress === ''
  }

  get releaseDay(): BigNumber {
    if (this.invalidMiningRate) {
      return new BigNumber(0)
    }
    const blockCount = computeDayBlockTotalCount(currentChainConfig.blockGenerationInterval)
    return this.normalizeMiningRate.times(blockCount)
  }

  @Watch('actionDatasForm.miningPoolAddress', { immediate: true })
  onSelectLiquidityPoolChange() {
    const hitPools = this.pools.filter(item => {
      return item.id.toLowerCase() === this.actionDatasForm.miningPoolAddress.toLowerCase()
    })
    if (hitPools.length === 0 || this.actionDatasForm.miningPoolAddress === '') {
      this.actionDatasForm.governorAddress = ''
    } else {
      this.actionDatasForm.governorAddress = hitPools[0].governor!.id
    }
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
