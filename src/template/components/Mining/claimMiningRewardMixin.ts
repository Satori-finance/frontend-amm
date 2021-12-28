import { Component, Mixins } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import { getLpGovernorContract } from '@mcdex/mai3.js'
import { getRewardDistributionContract } from '@mcdex/mcdex-governance.js'
import { getGasStationTxParams } from '@/utils/gasPrice'
import { gasLimitConfig } from '@/config/gas'
import { namespace } from 'vuex-class'
import { ethers } from 'ethers'
import { ButtonState } from '@/type'
import { waitTransaction } from '@/utils/transaction'
const wallet = namespace('wallet')

@Component
export class ClaimMiningRewardMixin extends Mixins(ErrorHandlerMixin) {
  protected claiming: boolean = false
  protected claimState: ButtonState = ''
  @wallet.Getter('signer') signer!: ethers.Signer

  protected async claimingMiningReward(contractAddress: string, contractType: string) {
    this.claiming = true
    this.claimState = 'loading'
    try {
      if (!contractAddress || !contractType) {
        return null
      }

      const gas = await getGasStationTxParams(gasLimitConfig.CLAIM_SATORI_MINING_REWARD)
      let promiseInstance: any = ''
      if (contractType == 'liquidityMining') {
        const governorContract = getLpGovernorContract(
          contractAddress,
          this.signer
        )
        promiseInstance = await governorContract.getReward(gas)
      } else if (contractType == 'uniswapMining') {
        // TODO
        return null
      } else if (contractType == 'daoMining') {
        const daoContract = getRewardDistributionContract(
          contractAddress,
          this.signer
        )
        promiseInstance = await daoContract.getAllRewards(gas)
      }
      if (!promiseInstance) {
        return null
      }
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.claimMiningReward', {}).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      const result = await transaction
      this.claimState = 'success'
      return result

    } catch (e) {
      console.error('claim SATORI reward', e)
      this.claimState = 'fail'
      throw e
    } finally {
      this.claiming = false
    }
  }
}
