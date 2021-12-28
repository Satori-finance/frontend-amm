import { Component, Mixins } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import { Bytes, keccak256 } from 'ethers/lib/utils'
import { BigNumberish, ethers } from 'ethers'
import { MerkleTree } from 'merkletreejs'
import _ from 'lodash'
import { gasFeeRebateMerkle } from './gasFeeRebateMerkle'
import { currentChainConfig } from '@/config/chain'
import { GAS_FEE_REBATE_CLAIM_CONTRACT_ADDRESS, SUPPORTED_NETWORK_ID } from '@/constants'
import BigNumber from 'bignumber.js'
import { namespace } from 'vuex-class'
import { MerkleRedeemFactory } from '@/assets/abi/MerkleRedeem/MerkleRedeemFactory'
import { Provider } from '@ethersproject/providers'
import { currentChainEpochHistoryList, currentChainEpochsConfig } from './gasFeeRebateConfig'
import { BytesLike } from '@ethersproject/bytes'
import { waitTransaction } from '@/utils/transaction'
import { ButtonState } from '@/type'
import { DECIMALS } from '@mcdex/mai3.js'

export const distributedTimeDelay: number = 86400 * 3  // 3 day

interface claimableHistoryInfoItem {
  distributedTime: number
  price: BigNumber | null
  rebatedValue: BigNumber
  allowClaimableValue: BigNumber
  claimedValue: BigNumber
}

export const gasFeeRebateAllowClaimEpoch: { [chainId: number]: number[] } = {
  [SUPPORTED_NETWORK_ID.BSC]: [0, 1, 2],
  [SUPPORTED_NETWORK_ID.ARB_TESTNET]: [0],
}

function hash (x: Bytes): Buffer {
  return Buffer.from(keccak256(x).slice(2), 'hex')
}

function padAccount (accountInfo: string[]): string {
  return ethers.utils.solidityKeccak256(["address", "uint256"], [accountInfo[0], accountInfo[1]])
}

function epochTree(epoch: number): MerkleTree {
  const users = gasFeeRebateMerkle[currentChainConfig.chainID][epoch]
  return new MerkleTree(
    users.map((x: string[]) => padAccount(x)),
    hash,
    { sortPairs: true }
  )
}

function getAccountInfo(epoch: number, account: string): string[] {
  const users = gasFeeRebateMerkle[currentChainConfig.chainID][epoch]
  const r = _.filter(users, (item) => {
    return item[0].toLowerCase() === account.toLowerCase()
  })
  if (r.length === 0) {
    return []
  }
  return r[0]
}

function getHexProof (epoch: number, account: string) {
  const accountInfo = getAccountInfo(epoch, account)
  if (accountInfo.length === 0) {
    throw new Error(`account ${account} is not in epoch ${epoch} claim list`)
  }
  const leaf = padAccount(accountInfo)
  const tree = epochTree(epoch)
  const proof = tree.getHexProof(leaf)
  if (proof.length === 0) {
    throw new Error(`account ${account} is not in epoch ${epoch} claim list`)
  }
  return proof
}

const wallet = namespace('wallet')

@Component
export class GasFeeRebateClaimMixin extends Mixins(ErrorHandlerMixin) {
  @wallet.Getter('address') accountAddress !: string
  @wallet.Getter('provider') provider !: Provider
  @wallet.Getter('signer') signer !: ethers.Signer

  protected claiming: ButtonState = ''

  protected allowClaimableValueLoading: boolean = false
  protected claimableHistoryInfoLoading: boolean = false

  protected accountAllEpochIsClaimed: boolean = false
  protected allowClaimableValue: BigNumber = new BigNumber(0)
  protected claimableHistoryInfo: { [epochId: number]: claimableHistoryInfoItem } = {}

  async checkAccountEpochsClaimStatus(epochs: number[]): Promise<boolean[]> {
    if (!this.provider || !this.accountAddress || epochs.length === 0) {
      return []
    }
    try {
      const claimContract = MerkleRedeemFactory.connect(GAS_FEE_REBATE_CLAIM_CONTRACT_ADDRESS, this.provider)
      return await claimContract.claimStatus(
        this.accountAddress,
        epochs[0],
        epochs[epochs.length - 1]
      )
    } catch (e) {
      console.log("check account gas fee rebate claim status")
    }
    return []
  }

  async checkAccountAllEpochIsClaimed() {
    const claimStatus = await this.checkAccountEpochsClaimStatus(currentChainEpochHistoryList)
    if (currentChainEpochHistoryList.length === 0 || claimStatus.length === 0) {
      this.accountAllEpochIsClaimed = false
      return
    }
    for (let index in claimStatus) {
      const s = claimStatus[index]
      if (!s) {
        this.accountAllEpochIsClaimed = false
        return
      }
    }
    this.accountAllEpochIsClaimed = true
  }

  async initialAllowClaimableValue() {
    this.allowClaimableValueLoading = true
    await this.computeAllowClaimableValue()
    this.allowClaimableValueLoading = false
  }

  async initialClaimableHistoryInfo() {
    this.claimableHistoryInfoLoading = true
    await this.computeClaimableHistoryInfo()
    this.claimableHistoryInfoLoading = false
  }

  async computeAllowClaimableValue() {
    let value: BigNumber = new BigNumber(0)
    if (!this.accountAddress) {
      this.allowClaimableValue = new BigNumber(0)
      return
    }
    const allowClaimEpochList = gasFeeRebateAllowClaimEpoch[currentChainConfig.chainID].sort()
    const claimStatus = await this.checkAccountEpochsClaimStatus(allowClaimEpochList)
    if (claimStatus.length === 0) {
      this.allowClaimableValue = new BigNumber(0)
      return
    }
    let epochClaimValue = new BigNumber(0)
    for (let index in allowClaimEpochList) {
      const epochId = allowClaimEpochList[index]
      const accountInfo = getAccountInfo(epochId, this.accountAddress)
      if (accountInfo.length > 0 && !claimStatus[index]) {
        epochClaimValue = new BigNumber(accountInfo[1]).shiftedBy(-DECIMALS)
      }
      value = value.plus(epochClaimValue)
    }
    this.allowClaimableValue = epochClaimValue
  }

  async computeClaimableHistoryInfo() {
    let historyInfo: { [epochId: number]: claimableHistoryInfoItem } = {}
    if (!this.accountAddress) {
      this.claimableHistoryInfo = {}
      return
    }
    const claimStatus = await this.checkAccountEpochsClaimStatus(currentChainEpochHistoryList.sort())
    for (let index in currentChainEpochHistoryList) {
      const epochId = currentChainEpochHistoryList[index]
      const accountInfo = getAccountInfo(epochId, this.accountAddress)
      historyInfo[epochId] = {
        distributedTime: currentChainEpochsConfig[epochId].endTimestamp + distributedTimeDelay,
        price: currentChainEpochsConfig[epochId].rebatePrice,
        rebatedValue: (() => {
          if (accountInfo.length > 0) {
            return new BigNumber(accountInfo[1]).shiftedBy(-DECIMALS)
          }
          return new BigNumber(0)
        })(),
        allowClaimableValue: (() => {
          if (accountInfo.length > 0 && claimStatus.length !== 0 && !claimStatus[index]) {
            return new BigNumber(accountInfo[1]).shiftedBy(-DECIMALS)
          }
          return new BigNumber(0)
        })(),
        claimedValue: (() => {
          if (accountInfo.length >= 0 && claimStatus.length !== 0 && claimStatus[index]) {
            return new BigNumber(accountInfo[1]).shiftedBy(-DECIMALS)
          }
          return new BigNumber(0)
        })(),
      }
    }
    this.claimableHistoryInfo = historyInfo
  }

  buildAllEpochParams(): {
    epoch: BigNumberish
    amount: BigNumberish
    merkleProof: BytesLike[]
  }[] {
    if (!this.accountAddress) {
      return []
    }
    let result: {
      epoch: BigNumberish
      amount: BigNumberish
      merkleProof: BytesLike[]
    }[] = []
    const allowClaimEpochList = gasFeeRebateAllowClaimEpoch[currentChainConfig.chainID]
    allowClaimEpochList.forEach(epoch => {
      try {
        const accountInfo = getAccountInfo(epoch, this.accountAddress)
        const proof = getHexProof(epoch, this.accountAddress)
        result.push({
          epoch: epoch,
          amount: accountInfo[1],
          merkleProof: proof
        })
      } catch (e) {
        console.warn(e)
      }
    })
    return result
  }

  async onClaimAllEpochReward() {
    if (!this.signer || !this.accountAddress) {
      return
    }
    await this.callChainFunc(async () => {
      this.claiming = 'loading'
      try {
        const claimContract = MerkleRedeemFactory.connect(GAS_FEE_REBATE_CLAIM_CONTRACT_ADDRESS, this.signer)
        const params = this.buildAllEpochParams()
        if (params.length === 0) {
          throw new Error("account not claim reward")
        }
        const promiseInstance = await claimContract.claimEpochs(params)
        const transaction = waitTransaction(promiseInstance)
        this.$transaction({
          transaction: transaction,
          content: this.$t('transaction.claimToken', {
            amount: this.allowClaimableValue.toFixed(2),
            symbol: 'SATORI',
          }).toString(),
          transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
        })
        const transactionResult =  await transaction
        this.claiming = 'success'
        this.computeAllowClaimableValue()
        this.computeClaimableHistoryInfo()
        this.checkAccountAllEpochIsClaimed()
        return transactionResult
      } catch (e) {
        console.warn(e)
        this.claiming = 'fail'
      }
    })
  }
}
