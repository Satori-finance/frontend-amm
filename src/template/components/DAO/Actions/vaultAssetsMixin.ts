import { Component, Mixins } from 'vue-property-decorator'
import { VaultAssetDetailsMixin } from '@/template/components/DAO/Info/vaultAssetDetailsMixin'
import BigNumber from 'bignumber.js'

export interface VaultAssetItem {
  amount: BigNumber
  address: string
  symbol: string
  decimals: number
}

@Component
export class VaultAssetsMixin extends Mixins(VaultAssetDetailsMixin) {

  get vaultAssetsOptions() {
    let result: Array<{label: string, value: string}> = []
    this.assetsList.forEach((item) => {
      result.push({
        label: item.tokenName,
        value: item.address,
      })
    })
    return result
  }

}
