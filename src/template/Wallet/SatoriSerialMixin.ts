import { Component, Mixins, Watch } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { ErrorHandlerMixin } from '@/mixins'
import { Provider } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import { claimableToken, claimedBalances, claimToken, commitments, getMcbVestingContract } from '@/utils/SatoriVesting'
import { ethers, Signer } from 'ethers'
import { gasLimitConfig } from '@/config/gas'
import { getGasStationTxParams } from '@/utils/gasPrice'
import { ButtonState } from '@/type'
import { waitTransaction } from '@/utils/transaction'

const wallet = namespace('wallet')

@Component({
  components: {},
})
export default class SatoriSerialMixin extends Mixins(ErrorHandlerMixin) {
  @wallet.Getter('address') address!: string | null
  @wallet.Getter('provider') provider!: Provider
  @wallet.Getter('signer') signer!: Signer | null
  @wallet.Getter('isL2') isL2!: boolean
  @wallet.Getter('isConnectedWallet') isConnectedWallet !: boolean

  protected loading = false
  protected claiming = false
  protected claimState: ButtonState = ''
  protected claimable: BigNumber | null = null
  protected claimedBalance: BigNumber | null = null
  protected allocation: BigNumber | null = null

  get disable() {
    return !this.claimable || this.claimable.lte(0) || !this.isL2
  }

  get isShowSATORISerialA() {
    if (!this.isConnectedWallet || !this.allocation || this.allocation.eq(0)) {
      return false
    }
    return true
  }

  @Watch('provider', { immediate: true })
  @Watch('address', { immediate: true })
  async getData() {
    try {
      this.loading = true
      await Promise.all([
        this.getClaimableToken(),
      ])
    } finally {
      this.loading = false
    }
  }

  async getClaimableToken() {
    await this.callChainReadFunc(async () => {
      if (!this.provider || !this.address) {
        return
      }
      const contract = getMcbVestingContract(this.provider)
      const [
        claimable,
        claimedBalance,
        allocation,
      ] = await Promise.all([
        claimableToken(contract, this.address),
        claimedBalances(contract, this.address),
        commitments(contract, this.address),
      ])
      this.claimable = claimable
      this.claimedBalance = claimedBalance
      this.allocation = allocation
    })
  }

  async claim() {
    await this.callChainFunc(async () => {
      if (!this.signer || !this.address || !this.claimable || this.disable) {
        return null
      }
      this.claiming = true
      this.claimState = 'loading'
      try {
        const contract = getMcbVestingContract(this.signer)
        const gasLimit = gasLimitConfig.CLAIM_SATORI_GAS_LIMIT
        const gas = await getGasStationTxParams(gasLimit, true)
        const promiseInstance = await claimToken(contract, gas)
        const transaction = waitTransaction(promiseInstance)
        this.$transaction({
          transaction: transaction,
          content: this.$t('transaction.claimSATORI', {
            amount: this.claimable.toFormat(2),
          }).toString(),
          transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
        })
        const transactionResult = await transaction
        this.getClaimableToken()
        this.claimState = 'success'
        return transactionResult
      } catch (e) {
        this.claimState = 'fail'
        console.error('unstake', e)
        throw e
      } finally {
        this.claiming = false
      }
    }, undefined, true)
  }
}
