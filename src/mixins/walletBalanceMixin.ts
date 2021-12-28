import { Component, Mixins } from 'vue-property-decorator'
import {
  balanceOf, erc20Decimals,
  getERC20Contract,
} from '@mcdex/mai3.js'
import { PerpetualStorageMixin } from './perpetualStorageMixin'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { namespace } from 'vuex-class'

const wallet = namespace('wallet')

@Component
export class WalletBalanceMixin extends Mixins(PerpetualStorageMixin) {
  @wallet.Getter('address') address!: string | null
  @wallet.Getter('signer') signer!: ethers.Signer | null

  walletBalance: BigNumber | null = null
  loadingWalletBalance: boolean = false

  async getWalletBalance(collateral: string) {
    if (!this.address || !this.signer) {
      return
    }
    this.loadingWalletBalance = true
    try {
      const contract = getERC20Contract(collateral, this.signer)
      const decimals = await erc20Decimals(contract)
      this.walletBalance = await balanceOf(contract, this.address, decimals)
    } finally {
      this.loadingWalletBalance = false
    }
  }
}
