import { ErrorHandlerMixin } from '@/mixins'
import { Component, Mixins, Watch } from 'vue-property-decorator'
import { Bytes, keccak256 } from 'ethers/lib/utils'
import { MerkleTree } from 'merkletreejs'
import { tradingMiningMerkleConfig } from './tradingMiningMerkleConfig'
import { BigNumberish, ethers } from 'ethers'
import _ from 'lodash'
import { namespace } from 'vuex-class'
import { Provider } from '@ethersproject/providers'
import {
  NETWORK_PROVIDER_RPC_CONFIG,
  SUPPORTED_NETWORK_ID,
  TRADING_MINING_CLAIM_CONTRACT_ADDRESS,
  TRADING_MINING_CLAIM_CONTRACT_ADDRESS_CONFIG,
} from '@/constants'
import { waitTransaction } from '@/utils/transaction'
import { MerkleRedeemFactory } from '@/assets/abi/MerkleRedeem/MerkleRedeemFactory'
import BigNumber from 'bignumber.js'
import { currentChainConfig } from '@/config/chain'
import { BytesLike } from '@ethersproject/bytes'
import { TradingMiningEpochList, TradingMiningMultiChain } from '@/template/components/Mining/tradingMiningMixin'
import { DECIMALS } from '@mcdex/mai3.js'
import { ButtonState } from '@/type'
import { bigNumberFormatterTruncateByPrecision } from '@/utils'


const allowClaimEpoch: { [chainId: number]: number[] } = {
  [SUPPORTED_NETWORK_ID.BSC]: [0, 1, 2, 3],
  [SUPPORTED_NETWORK_ID.ARB]: [0, 1, 2, 3],
  [SUPPORTED_NETWORK_ID.ARB_TESTNET]: [0],
}

function hash (x: Bytes): Buffer {
  return Buffer.from(keccak256(x).slice(2), 'hex')
}

function padAccount (accountInfo: string[]): string {
  return ethers.utils.solidityKeccak256(["address", "uint256"], [accountInfo[0], accountInfo[1]])
}

function epochTree(epoch: number, chainId: number): MerkleTree {
  const users = tradingMiningMerkleConfig[chainId][epoch]
  return new MerkleTree(
    users.map((x: string[]) => padAccount(x)),
    hash,
    { sortPairs: true }
  )
}

function getAccountInfo(epoch: number, chainId: number, account: string): string[] {
  const users = tradingMiningMerkleConfig[chainId][epoch]
  const r = _.filter(users, (item) => {
    return item[0].toLowerCase() === account.toLowerCase()
  })
  if (r.length === 0) {
    return []
  }
  return r[0]
}

function getHexProof (epoch: number, chainId: number, account: string) {
  const accountInfo = getAccountInfo(epoch, chainId, account)
  if (accountInfo.length === 0) {
    throw new Error(`account ${account} is not in epoch ${epoch} claim list`)
  }
  const leaf = padAccount(accountInfo)
  const tree = epochTree(epoch, chainId)
  const proof = tree.getHexProof(leaf)
  if (proof.length === 0) {
    throw new Error(`account ${account} is not in epoch ${epoch} claim list`)
  }
  return proof
}

const wallet = namespace('wallet')

@Component
export default class TradingMiningClaimMixin extends Mixins(ErrorHandlerMixin) {
  @wallet.Getter('provider') provider!: Provider
  @wallet.Getter('signer') signer!: ethers.Signer
  @wallet.Getter('address') address!: string

  protected claiming: ButtonState = ''

  protected allChainClaimInfo: {[chainId: number]: {
    claimableRewards: BigNumber
    allocatedRewards: BigNumber
    claimedRewards: BigNumber
  }} = {}

  get totalAllocatedRewards(): BigNumber | null {
    if (Object.keys(this.allChainClaimInfo).length === 0) {
      return null
    }
    let v = new BigNumber(0)
    Object.keys(this.allChainClaimInfo).forEach((chainId) => {
      v = v.plus(this.allChainClaimInfo[Number(chainId)].allocatedRewards)
    })
    return v
  }

  get totalClaimableRewards(): BigNumber | null {
    if (Object.keys(this.allChainClaimInfo).length === 0) {
      return null
    }
    let v = new BigNumber(0)
    Object.keys(this.allChainClaimInfo).forEach((chainId) => {
      v = v.plus(this.allChainClaimInfo[Number(chainId)].claimableRewards)
    })
    return v
  }

  get totalClaimedRewards(): BigNumber {
    let v = new BigNumber(0)
    Object.keys(this.allChainClaimInfo).forEach((chainId) => {
      v = v.plus(this.allChainClaimInfo[Number(chainId)].claimedRewards)
    })
    return v
  }

  get currentChainClaimableRewards(): BigNumber {
    return this.allChainClaimInfo[currentChainConfig.chainID]?.claimableRewards || new BigNumber(0)
  }

  get currentChainIsAllowedAllClaim(): boolean {
    const currentChainEpochList = TradingMiningEpochList[currentChainConfig.chainID].sort()
    const allowClaimList = allowClaimEpoch[currentChainConfig.chainID].sort()
    if (currentChainEpochList.join('.') === allowClaimList.join('.')) {
      return true
    }
    return false
  }

  get claimRewardPromp1(): string {
    return this.$t('tradingMining.claimRewardPromp1', {
      v1: bigNumberFormatterTruncateByPrecision(this.totalClaimableRewards, 6, 1, 2),
      v2: bigNumberFormatterTruncateByPrecision(this.totalAllocatedRewards, 6, 1, 2),
      v3: bigNumberFormatterTruncateByPrecision(this.totalClaimedRewards, 6, 1, 2),
    }).toString()
  }

  get claimRewardPromp2(): string {
    return this.$t('tradingMining.claimRewardPromp2', {
      v1: bigNumberFormatterTruncateByPrecision(this.totalClaimableRewards, 6, 1, 2),
      v2: bigNumberFormatterTruncateByPrecision(this.totalAllocatedRewards, 6, 1, 2),
    }).toString()
  }

  async computeAccountClaimValue() {
    const multiChain = TradingMiningMultiChain[currentChainConfig.chainID]
    for (let i=0; i< multiChain.length; i++) {
      const chainId = multiChain[i]
      let allocatedRewardsAmountList: BigNumber[] = []
      let allocatedRewardsAmount: BigNumber = new BigNumber(0)

      let claimableRewardsAmountList: BigNumber[] = []
      let claimableRewardsAmount: BigNumber = new BigNumber(0)

      let claimedAmount: BigNumber = new BigNumber(0)

      const chainEpochList = TradingMiningEpochList[chainId]
      const allowClaimList = allowClaimEpoch[chainId]
      chainEpochList.forEach((item) => {
        const r = getAccountInfo(item, chainId, this.address)
        // allocated rewards
        if (r.length !== 0) {
          allocatedRewardsAmountList.push(new BigNumber(r[1]).shiftedBy(-DECIMALS))
        } else {
          allocatedRewardsAmountList.push(new BigNumber(0))
        }
        // claimable rewards
        if (r.length !== 0 && allowClaimList.indexOf(item) > -1) {
          claimableRewardsAmountList.push(new BigNumber(r[1]).shiftedBy(-DECIMALS))
        } else {
          claimableRewardsAmountList.push(new BigNumber(0))
        }
      })
      const claimStatus = await this.accountClaimStatus(chainId)
      claimStatus.forEach((item, index) => {
        const v1 = allocatedRewardsAmountList[index]
        const v2 = claimableRewardsAmountList[index]
        if (!item) {
          allocatedRewardsAmount = allocatedRewardsAmount.plus(v1)
          claimableRewardsAmount = claimableRewardsAmount.plus(v2)
        } else {
          claimedAmount = claimedAmount.plus(v1)
        }
      })

      // update data
      this.$set(this.allChainClaimInfo, chainId, {
        claimableRewards: claimableRewardsAmount,
        allocatedRewards: allocatedRewardsAmount,
        claimedRewards: claimedAmount,
      })
    }
  }

  async accountClaimStatus(chainId: number): Promise<boolean[]> {
    let provider: any = new ethers.providers.StaticJsonRpcProvider({
      url: NETWORK_PROVIDER_RPC_CONFIG[chainId],
      timeout: 30000,
    })
    if (chainId === currentChainConfig.chainID) {
      provider = this.provider
    }
    const chainEpochList = TradingMiningEpochList[chainId]
    let status = chainEpochList.map(x => true)
    if (!provider || !this.address) {
      return status
    }
    try {
      const claimContract = MerkleRedeemFactory.connect(TRADING_MINING_CLAIM_CONTRACT_ADDRESS_CONFIG[chainId], provider)
      status = await claimContract.claimStatus(
        this.address,
        chainEpochList[0],
        chainEpochList[chainEpochList.length - 1]
      )
      return status
    } catch (e) {
      console.warn("check account trading mining claim status")
    }
    return status
  }

  async onClaimEpochReward(epoch: number) {
    if (!this.signer || !this.address) {
      return
    }
    this.claiming = 'loading'
    try {
      const chainId = currentChainConfig.chainID
      const claimContract = MerkleRedeemFactory.connect(TRADING_MINING_CLAIM_CONTRACT_ADDRESS, this.signer)
      const accountInfo = getAccountInfo(epoch, chainId, this.address)
      if (accountInfo.length === 0) {
        throw new Error(`account ${this.address} is not in claim list`)
      }
      const proof = getHexProof(epoch, chainId, this.address)
      const promiseInstance = await claimContract.claimEpoch(epoch, accountInfo[1], proof)
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.claimToken', {
          amount: new BigNumber(accountInfo[1]).shiftedBy(-DECIMALS).toFixed(2),
          symbol: 'SATORI',
        }).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      const transactionResult =  await transaction
      this.claiming = 'success'
      this.computeAccountClaimValue()
      return transactionResult
    } catch (e) {
      this.claiming = 'fail'
      console.warn(e)
    }
  }

  buildAllEpochParams(): {
    epoch: BigNumberish
    amount: BigNumberish
    merkleProof: BytesLike[]
  }[] {
    if (!this.address) {
      return []
    }
    const chainId = currentChainConfig.chainID
    let result: {
      epoch: BigNumberish
      amount: BigNumberish
      merkleProof: BytesLike[]
    }[] = []
    const currentChainEpochList = allowClaimEpoch[chainId]
    currentChainEpochList.forEach(epoch => {
      try {
        const accountInfo = getAccountInfo(epoch, chainId, this.address)
        const proof = getHexProof(epoch, chainId, this.address)
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
    if (!this.signer || !this.address) {
      return
    }
    this.claiming = 'loading'
    try {
      const claimContract = MerkleRedeemFactory.connect(TRADING_MINING_CLAIM_CONTRACT_ADDRESS, this.signer)
      const params = this.buildAllEpochParams()
      if (params.length === 0) {
        throw new Error("account not claim reward")
      }
      const promiseInstance = await claimContract.claimEpochs(params)
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.claimToken', {
          amount: this.currentChainClaimableRewards.toFixed(2),
          symbol: 'SATORI',
        }).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      const transactionResult =  await transaction
      this.claiming = 'success'
      this.computeAccountClaimValue()
      return transactionResult
    } catch (e) {
      console.warn(e)
      this.claiming = 'fail'
    }
  }

  @Watch('address', { immediate: true })
  onWalletChanged() {
    if (!this.address) {
      this.allChainClaimInfo = {}
      return
    }
    this.computeAccountClaimValue()
  }
}
