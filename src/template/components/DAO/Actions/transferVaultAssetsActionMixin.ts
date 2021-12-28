import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import { TransferVaultAssetsActionDatas } from './types'
import BigNumber from 'bignumber.js'
import { _0  } from '@mcdex/mai3.js'
import { ethers } from 'ethers'
import { VaultAssetsMixin } from '@/template/components/DAO/Actions/vaultAssetsMixin'
import { VaultAssetItem } from '@/template/components/DAO/Info/vaultAssetDetailsMixin'

@Component
export default class TransferVaultAssetsActionMixin extends Mixins(VaultAssetsMixin) {
  @Prop({ required: true }) actionIndex !: number
  @Prop({ required: true }) actionDefaultDatas !: TransferVaultAssetsActionDatas

  protected actionDatasForm: TransferVaultAssetsActionDatas = this.actionDefaultDatas

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

  get normalizeAssetAmount(): BigNumber {
    return this.actionDatasForm.assetsAmount ? new BigNumber(this.actionDatasForm.assetsAmount) : _0
  }

  get invalidAssetAmount(): boolean {
    return this.normalizeAssetAmount.isNaN() || this.normalizeAssetAmount.lte(_0) ||
      this.normalizeAssetAmount.gt(this.selectedVaultAssetBalance)
  }

  get invalidReceiveAddress(): boolean {
    return !ethers.utils.isAddress(this.actionDatasForm.receiveAddress)
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
