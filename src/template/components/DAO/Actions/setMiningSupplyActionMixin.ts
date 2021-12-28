import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import {
  MiningSupplyPoolType,
  SetMiningSupplyActionDatas,
} from './types'
import BigNumber from 'bignumber.js'
import { _0 } from '@mcdex/mai3.js'
import { ethers } from 'ethers'
import { UniswapMiningPoolMixin } from './uniswapMiningPoolMixin'
import { LiquidityMiningPoolMixin } from './liquidityMiningPoolMixin'
import { VaultAssetsMixin } from '@/template/components/DAO/Actions/vaultAssetsMixin'
import { VaultAssetItem } from '@/template/components/DAO/Info/vaultAssetDetailsMixin'
import { DAO_STAKE_TOKEN_SYMBOL } from '@mcdex/mcdex-governance.js'

@Component
export default class SetMiningSupplyActionMixin extends Mixins(VaultAssetsMixin, LiquidityMiningPoolMixin, UniswapMiningPoolMixin) {
  @Prop({ required: true }) actionIndex !: number
  @Prop({ required: true }) actionDefaultDatas !: SetMiningSupplyActionDatas

  protected daoTokenSymbol: string = DAO_STAKE_TOKEN_SYMBOL

  miningSupplyPoolType = MiningSupplyPoolType

  protected actionDatasForm: SetMiningSupplyActionDatas = this.actionDefaultDatas

  get miningSupplyPoolTypeOptions() {
    return [
      {
        label: this.$t('dao.actionCard.liquidityMining').toString(),
        value: MiningSupplyPoolType.Liquidity
      },
      // {
      //   label: this.$t('dao.actionCard.mcbUniswapMining').toString(),
      //   value: MiningSupplyPoolType.Uniswap
      // },
      {
        label: this.$t('dao.actionCard.mcbStakingMining').toString(),
        value: MiningSupplyPoolType.Staking
      },
    ]
  }

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

  get selectedVaultAssetBalance(): BigNumber {
    return this.selectedVaultAsset?.amount || new BigNumber(0)
  }

  get selectedVaultAssetDecimals(): number {
    return this.selectedVaultAsset?.decimals || 0
  }

  get normalizeSupplyAmount(): BigNumber {
    return this.actionDatasForm.supplyAmount ? new BigNumber(this.actionDatasForm.supplyAmount) : _0
  }

  get invalidSupplyAmount(): boolean {
    return this.normalizeSupplyAmount.isNaN() || this.normalizeSupplyAmount.lt(_0)
  }

  get invalidAssetsTokenAddress(): boolean {
    if (this.actionDatasForm.poolType === 'staking') {
      return !ethers.utils.isAddress(this.actionDatasForm.assetsTokenAddress)
    }
    return false
  }

  get invalidAssetsTokenDecimals(): boolean {
    if (this.actionDatasForm.poolType === 'liquidity') {
      return this.actionDatasForm.assetsTokenDecimals === 0
    }
    return false
  }

  get invalidPoolAddress(): boolean {
    if (this.actionDatasForm.poolType === 'liquidity') {
      return !ethers.utils.isAddress(this.actionDatasForm.poolAddress)
    }
    return false
  }

  get invalidGovernorAddress(): boolean {
    if (this.actionDatasForm.poolType === 'liquidity') {
      return this.invalidPoolAddress || this.actionDatasForm.governorAddress === ''
    }
    return false
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

  @Watch('actionDefaultDatas')
  onActionIndexChanged() {
    this.actionDatasForm = this.actionDefaultDatas
  }

  @Watch('actionDatasForm.poolAddress', { immediate: true })
  onSelectLiquidityPoolChange() {
    if(this.actionDatasForm.poolType !== 'liquidity') {
      this.actionDatasForm.governorAddress = ''
      return
    }
    const hitPools = this.pools.filter(item => {
      return item.id.toLowerCase() === this.actionDatasForm.poolAddress.toLowerCase()
    })
    if (hitPools.length === 0 || this.actionDatasForm.poolAddress === '') {
      this.actionDatasForm.governorAddress = ''
    } else {
      this.actionDatasForm.governorAddress = hitPools[0].governor!.id
    }
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
