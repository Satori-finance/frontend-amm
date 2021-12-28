import { Component, Mixins } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import { ethers } from 'ethers'
import { namespace } from 'vuex-class'
import { getXmcbContract, CHAIN_ID_TO_DAO_XSATORI_ADDRESS } from '@mcdex/mcdex-governance.js'
import { getOperatorName } from '@/config/operator'
import { ellipsisMiddle } from '@/utils'
import { Provider } from '@ethersproject/providers'
import { DAO_GOVERNANCE_EVENT, VUE_EVENT_BUS } from '@/event'
import { SATORI_ADDRESS, SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/constants'
import { waitTransaction } from '@/utils/transaction'

const wallet = namespace('wallet')

@Component
export default class DelegateMixin extends Mixins(ErrorHandlerMixin) {
  @wallet.Getter('signer') signer !: ethers.Signer | null
  @wallet.Getter('provider') provider !: Provider
  @wallet.Getter('address') userAddress !: string | null
  @wallet.Getter('isConnectedWallet') isConnectedWallet!: boolean

  protected currentViewType: 'edit' | 'show' = 'edit'
  protected delegateToAddress: string = ''

  protected form = {
    delegateAddress: '',
  }

  get delegateAddress(): string {
    return this.form.delegateAddress
  }

  set delegateAddress(val: string) {
    this.form.delegateAddress = val
  }

  get hasDelegateUser(): boolean {
    if (!this.userAddress || this.userAddress === '' || this.delegateToAddress === ''
      || this.delegateToAddress === this.userAddress.toLowerCase()) {
      return false
    }
    return true
  }

  get existingDelegationAlias(): string {
    return getOperatorName(this.delegateToAddress)
  }

  async initialDelegateData() {
    this.loadAccountDelegateInfo()
  }

  async onDelegateVote(userAddress: string, callType: 'delegate' | 'remove' = 'delegate'): Promise<boolean> {
    const txResult = await this.callChainFunc(async () => {
      if (this.userAddress === '' || !this.userAddress || !this.signer) {
        return false
      }
      const xmcbAddress = TARGET_NETWORK_ID === SUPPORTED_NETWORK_ID.BSC ? SATORI_ADDRESS : CHAIN_ID_TO_DAO_XSATORI_ADDRESS[TARGET_NETWORK_ID] // todo delete

      const contract = getXmcbContract(xmcbAddress, this.signer)
      const transaction = await contract.delegate(userAddress)
      const transactionResult = waitTransaction(transaction)
      const txKey = callType === 'remove' ? 'transaction.removeDelegateVotes' : 'transaction.delegateVotes'
      const txFormatAddress = callType === 'remove' ? this.delegateToAddress : this.delegateAddress
      this.$transaction({
        location: 'top',
        transaction: transactionResult,
        content: this.$t(txKey, { address: ellipsisMiddle(txFormatAddress)}).toString(),
        transactionHash: transaction.hash ? transaction.hash : '',
      })
      const result = await transactionResult
      VUE_EVENT_BUS.emit(DAO_GOVERNANCE_EVENT.UpdateMyVotes)
      return result
    })
    this.loadAccountDelegateInfo()
    if (!txResult) {
      return false
    }
    return true
  }

  async loadAccountDelegateInfo() {
   await this.callChainReadFunc(async () => {
      if (!this.provider || !this.userAddress || this.userAddress === '') {
        return
      }
     const xmcbAddress = TARGET_NETWORK_ID === SUPPORTED_NETWORK_ID.BSC ? SATORI_ADDRESS : CHAIN_ID_TO_DAO_XSATORI_ADDRESS[TARGET_NETWORK_ID] // todo delete

     const xSATORIContract = getXmcbContract(xmcbAddress, this.provider)
      this.delegateToAddress = (await xSATORIContract.getDelegate(this.userAddress)).toLowerCase()
      if (this.hasDelegateUser) {
        this.currentViewType = 'show'
      } else {
        this.currentViewType = 'edit'
      }
    })
  }

  async onConfirmDelegate(): Promise<boolean> {
    return await this.onDelegateVote(this.delegateAddress, 'delegate')
  }

  async onRemoveDelegate(): Promise<boolean> {
    if (!this.userAddress) {
      return false
    }
    return await this.onDelegateVote(this.userAddress, 'remove')
  }
}
