import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import { SetSATORIStakingMiningRateActionDatas } from '@/template/components/DAO/Actions/types'
import { Provider } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import { _0 } from '@mcdex/mai3.js'
import { getRewardDistributionContract, RewardDistribution, CHAIN_ID_TO_DAO_MINING_ADDRESS } from '@mcdex/mcdex-governance.js'
import { ethers } from 'ethers'
import { namespace } from 'vuex-class'
import { computeDayBlockTotalCount } from '@/utils'
import { currentChainConfig } from '@/config/chain'
import { VaultAssetsMixin } from '@/template/components/DAO/Actions/vaultAssetsMixin'
import { VaultAssetItem } from '@/template/components/DAO/Info/vaultAssetDetailsMixin'
import { TARGET_NETWORK_ID } from '@/constants'

const wallet = namespace('wallet')

@Component
export default class SetStakingMiningRateActionMixin extends Mixins(VaultAssetsMixin) {
  @Prop({ required: true }) actionIndex !: number
  @Prop({ required: true }) actionDefaultDatas !: SetSATORIStakingMiningRateActionDatas
  @wallet.Getter('provider') provider!: Provider

  protected actionDatasForm: SetSATORIStakingMiningRateActionDatas = this.actionDefaultDatas
  protected rewardDistributionContract: RewardDistribution |null = null

  get selectedVaultAsset(): VaultAssetItem | null{
    for (let i=0;i<this.assetsList.length;i++) {
      const item = this.assetsList[i]
      if (item.address === this.actionDatasForm.assetsTokenAddress) {
        return item
      }
    }
    return null
  }

  get selectedVaultAssetName(): string {
    return this.selectedVaultAsset?.tokenName || ''
  }

  get selectedVaultAssetDecimals(): number {
    return this.selectedVaultAsset?.decimals || 0
  }

  get releaseDay(): BigNumber {
    if (this.invalidMiningRate) {
      return new BigNumber(0)
    }
    const blockCount = computeDayBlockTotalCount(currentChainConfig.blockGenerationInterval)
    return this.normalizeMiningRate.times(blockCount)
  }

  get normalizeMiningRate(): BigNumber {
    return this.actionDatasForm.miningRate ? new BigNumber(this.actionDatasForm.miningRate) : _0
  }

  get invalidMiningRate(): boolean {
    return this.normalizeMiningRate.isNaN() || this.normalizeMiningRate.lt(_0)
  }

  get invalidAssetsTokenAddress(): boolean {
    return !ethers.utils.isAddress(this.actionDatasForm.assetsTokenAddress)
  }

  get invalidAssetsTokenDecimals(): boolean {
    return this.actionDatasForm.assetsTokenDecimals === 0
  }

  // @Watch('assetsList', { immediate: true })
  // onAssetsListChanged() {
  //   if (this.assetsList.length <= 0) {
  //     return
  //   }
  //   this.actionDatasForm = {
  //     ...this.actionDatasForm,
  //     assetsTokenAddress: this.assetsList[0].address
  //   }
  // }

  @Watch('provider', { immediate: true })
  onProviderChanged() {
    if (!this.provider) {
      return
    }
    this.rewardDistributionContract = getRewardDistributionContract(CHAIN_ID_TO_DAO_MINING_ADDRESS[TARGET_NETWORK_ID], this.provider)
  }

  @Watch('selectedVaultAsset', { immediate: true })
  async onSelectedVaultAssetChanged() {
    if(!this.selectedVaultAsset || !this.rewardDistributionContract) {
      return
    }
    this.actionDatasForm.isSetRewardPlan = await this.rewardDistributionContract.hasPlan(this.selectedVaultAsset.address)
  }

  @Watch('actionDefaultDatas')
  onActionIndexChanged() {
    this.actionDatasForm = this.actionDefaultDatas
  }

  @Watch('actionDatasForm', { deep: true })
  onActionDatasChanged() {
    this.$emit('update', this.actionIndex, this.actionDatasForm)
  }

  @Watch('selectedVaultAsset', { immediate: true })
  onSelectedAssetChange() {
    if (!this.selectedVaultAsset) {
      this.actionDatasForm.assetsTokenDecimals = 0
    } else {
      this.actionDatasForm.assetsTokenDecimals = this.selectedVaultAsset.decimals
    }
  }
}
