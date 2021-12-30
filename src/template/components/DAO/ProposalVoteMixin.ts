import { Component, Mixins, Watch } from 'vue-property-decorator'
import { ButtonState, DaoGovernorProposal, DaoProposalState } from '@/type'
import { queryDaoProposalByIndex } from '@/api/daoGovernor'
import { DAO_GOVERNOR_VOTES_DECIMALS, L1_NETWORK_ID, TARGET_NETWORK_ID } from '@/constants'
import { DECIMALS, normalizeBigNumberish } from '@mcdex/mai3.js'
import {
  getDaoGovernorContract,
  getXmcbContract,
  CHAIN_ID_TO_DAO_XMCB_ADDRESS,
  CHAIN_ID_TO_DAO_GOVERNOR_ADDRESS
} from '@mcdex/mcdex-governance.js'
import { parseDaoProposalState, toBigNumber } from '@/utils'
import { namespace } from 'vuex-class'
import { Provider } from '@ethersproject/providers'
import { DaoActionBase, DaoProposalDescription, DaoProposalIpfsStoreData, DaoProposalMixin } from './daoProposalMixin'
import _ from 'lodash'
import { ethers } from 'ethers'
import { DAO_GOVERNANCE_EVENT, VUE_EVENT_BUS } from '@/event'
import { waitTransaction } from '@/utils/transaction'
import { queryTimeStampByBlockNumber } from '@/api/block'
import { chainConfigs } from '@/config/chain'

const wallet = namespace('wallet')

interface accountVoteItem {
  address: string
  vote: number
}

@Component
export class ProposalVoteMixin extends Mixins(DaoProposalMixin) {
  @wallet.Getter('provider') provider !: Provider
  @wallet.Getter('providerL1') providerL1 !: Provider
  @wallet.Getter('signer') signer!: ethers.Signer
  @wallet.Getter('address') userAddress !: string

  votesDecimals = DAO_GOVERNOR_VOTES_DECIMALS

  // temp
  protected cacheCurrentUserVotes: number = 0

  protected loading: boolean = true

  protected voting: boolean = false
  protected queuing: boolean = false
  protected executing: boolean = false

  protected votingButtonState: ButtonState = ''
  blocksTimestamp: Map<string, string> = new Map<string, string>()

  protected daoProposalDetail: DaoGovernorProposal | null = null
  protected proposalIPFSStore: DaoProposalIpfsStoreData | null = null
  protected proposalDescription: DaoProposalDescription | null = null
  protected proposalActions: DaoActionBase[] = []
  protected myVotes: number = 0
  protected accountIsVoted: boolean = true
  protected accountVotedVotes: number = 0
  protected accountVotesSide: 'for' | 'against' | '' = ''
  protected quorumVotes: number = 0
  protected proposerAddress: string = ''
  protected currentBlockNumber: number = 0
  // execute proposal timestamp
  private etaTimestamp: number = 0
  protected voteSide: 'for' | 'against' = 'for'
  protected accountsVotes: {
    for: accountVoteItem[],
    against: accountVoteItem[]
  } = {
    for: [],
    against: []
  }

  get proposalIndex(): string {
    return this.$route.params?.index || ''
  }

  get proposalStateText(): string {
    if (!this.daoProposalDetail) {
      return ''
    }
    if (this.proposalState === DaoProposalState.Active) {
      return this.$t('governance.active').toString()
    }
    if (this.proposalState === DaoProposalState.Failed || this.proposalState === DaoProposalState.Defeated) {
      return this.$t('governance.failed').toString()
    }
    if (this.proposalState === DaoProposalState.Succeeded
      || this.proposalState === DaoProposalState.Executed
      || this.proposalState === DaoProposalState.Expired
      || this.proposalState === DaoProposalState.Queued) {
      return this.$t('governance.succeeded').toString()
    }
    return this.$t('governance.created').toString()
  }

  get proposalState(): DaoProposalState {
    if (!this.daoProposalDetail || !this.daoProposalDetail.state) {
      return DaoProposalState.Created
    }
    return parseDaoProposalState(this.daoProposalDetail.state)
  }

  get proposalTitle(): string {
    return this.proposalDescription?.title.slice(0, 50) || ''
  }

  get voteIsEnd(): boolean {
    if (this.proposalState === DaoProposalState.Failed
      || this.proposalState === DaoProposalState.Defeated
      || this.proposalState === DaoProposalState.Succeeded
      || this.proposalState === DaoProposalState.Queued
      || this.proposalState === DaoProposalState.Executed
      || this.proposalState === DaoProposalState.Expired
    ) {
      return true
    }
    return false
  }

  get forVotes(): number {
    if (!this.daoProposalDetail) {
      return 0
    }
    return toBigNumber(this.daoProposalDetail.for).toNumber()
  }

  get againstVotes(): number {
    if (!this.daoProposalDetail) {
      return 0
    }
    return toBigNumber(this.daoProposalDetail.against).toNumber()
  }

  get isStartVote(): boolean {
    return this.proposalState === DaoProposalState.Active
  }

  get isShowQueueButton(): boolean {
    return this.proposalState === DaoProposalState.Succeeded
  }

  get isShowExecuteButton(): boolean {
    if (this.etaTimestamp === 0
      || this.proposalState === DaoProposalState.Executed
      || this.proposalState === DaoProposalState.Expired
    ) {
      return false
    }
    const currentTimestamp = Math.floor(Date.now() / 1000)
    return currentTimestamp >= this.etaTimestamp
  }

  async getBlocksTimestamp(blocks: number[]) {
    const t = await this.callGraphApiFunc(() => {
      return queryTimeStampByBlockNumber(blocks, chainConfigs[L1_NETWORK_ID].subgraphConfig.blockSubgraph)
    })
    if (!t) {
      return
    }
    this.blocksTimestamp = t.blockList
  }

  getProposalBaseDataFunc = _.debounce(async () => {
    await this.updateProposalBaseData()
  }, 200)

  async updateProposalBaseData() {
    this.loading = true
    try {
      const index = Number(this.proposalIndex)
      const resultData = await this.callGraphApiFunc(() => {
        return queryDaoProposalByIndex(index.toString())
      })
      if (resultData && resultData.proposals.length > 0) {
        await this.callChainReadFunc(async () => {
          this.daoProposalDetail = resultData.proposals[0]
          const daoGovernanceContract = getDaoGovernorContract(CHAIN_ID_TO_DAO_GOVERNOR_ADDRESS[TARGET_NETWORK_ID], this.provider)
          await this.updateProposalState()
          if (this.providerL1)  {
            // get last block number
            this.currentBlockNumber = await this.providerL1.getBlockNumber()
          }

          // need vote
          const needVoteVal = normalizeBigNumberish(await daoGovernanceContract.quorumVotes()).shiftedBy(-DECIMALS)
          this.quorumVotes = needVoteVal.toNumber()
        })
        this.cacheCurrentUserVotes = 0
      }
      if (!this.daoProposalDetail) {
        return
      }
      this.getBlocksTimestamp([
        this.daoProposalDetail.startBlock as number,
        this.daoProposalDetail.endBlock as number
      ])
      try {
        this.proposerAddress = this.daoProposalDetail.proposer?.id || ''
        this.proposalDescription = this.parseDescription(this.daoProposalDetail.description)
        if (this.proposalDescription) {
          this.proposalIPFSStore = await this.getDaoProposalIpfsStoreData(this.proposalDescription.ipfsHash)
        }
        this.proposalActions = await this.parseActions({
          targets: this.daoProposalDetail.targets,
          values: this.daoProposalDetail.newValues,
          signatures: this.daoProposalDetail.signatures,
          calldatas: this.daoProposalDetail.calldatas,
        })
      } catch (e) {
        console.error("get dao proposal base data fail, ", e)
      }
    } finally {
      this.loading = false
    }
  }

  async updateProposalState() {
    await this.callChainReadFunc(async () => {
      if (!this.daoProposalDetail) {
        return
      }
      const daoGovernanceContract = getDaoGovernorContract(CHAIN_ID_TO_DAO_GOVERNOR_ADDRESS[TARGET_NETWORK_ID], this.provider)
      this.daoProposalDetail.state = await daoGovernanceContract.state(Number(this.daoProposalDetail.proposalId))
      // get proposal execute timestamp
      const proposalData = await daoGovernanceContract.proposals(Number(this.daoProposalDetail.proposalId))
      this.etaTimestamp = normalizeBigNumberish(proposalData.eta).toNumber()
    })
  }

  @Watch('provider', { immediate: true })
  onProposalIndexChange() {
    if (!this.provider || this.proposalIndex === '') {
      return
    }
    this.getProposalBaseDataFunc()
  }

  @Watch('userAddress', { immediate: true })
  @Watch('provider', { immediate: true})
  async loadAccountData() {
    await this.callChainReadFunc(async () => {
      if (!this.provider || this.proposalIndex === '' || isNaN(Number(this.proposalIndex)) ) {
        return
      }
      const daoGovernanceContract = getDaoGovernorContract(CHAIN_ID_TO_DAO_GOVERNOR_ADDRESS[TARGET_NETWORK_ID], this.provider)
      if (this.userAddress && this.userAddress !== '') {
        const userVoteDetails = await daoGovernanceContract.getReceipt(Number(this.proposalIndex), this.userAddress as string)
        this.accountIsVoted = userVoteDetails.hasVoted
        this.accountVotedVotes = normalizeBigNumberish(userVoteDetails.votes).shiftedBy(-DECIMALS).toNumber()
        if (this.accountIsVoted) {
          this.accountVotesSide = userVoteDetails.support ? 'for' : 'against'
        }
      }

      const xSATORIContract = getXmcbContract(CHAIN_ID_TO_DAO_XMCB_ADDRESS[TARGET_NETWORK_ID], this.provider)
      if (this.userAddress && this.userAddress !== '') {
        this.myVotes = normalizeBigNumberish(await xSATORIContract.getCurrentVotes(this.userAddress)).shiftedBy(-DECIMALS).toNumber()
      }
    })
  }

  @Watch('daoProposalDetail', { deep: true })
  onProposalUserVotesChanged() {
    let votes: { for: accountVoteItem[], against: accountVoteItem[] } = {
      for: [],
      against: []
    }
    if (!this.daoProposalDetail || !this.daoProposalDetail.votes || this.proposalState === DaoProposalState.Created) {
      this.accountsVotes = votes
      return
    }
    this.daoProposalDetail.votes.forEach((val) => {
      if (val.support) {
        votes.for.push({
          address: val.voter?.id || '',
          vote: Number((val.votes as string))
        })
      } else {
        votes.against.push({
          address: val.voter?.id || '',
          vote: Number((val.votes as string))
        })
      }
    })
    this.accountsVotes = votes
  }

  async onVoteEvent() {
    this.voting = true
    this.votingButtonState = 'loading'
    const txResult = await this.callChainFunc( async () => {
      if (!this.signer) {
        return
      }
      const daoGovernorContract = getDaoGovernorContract(CHAIN_ID_TO_DAO_GOVERNOR_ADDRESS[TARGET_NETWORK_ID], this.signer)
      const transactionResult = await daoGovernorContract.castVote(this.proposalIndex, this.voteSide === 'for')
      const transaction = waitTransaction(transactionResult)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.voteProposal', {
          index: this.proposalIndex
        }).toString(),
        transactionHash: transactionResult.hash ? transactionResult.hash : '',
      })
      const txResult = await transaction
      VUE_EVENT_BUS.emit(DAO_GOVERNANCE_EVENT.UpdateMyVotes)
      this.votingButtonState = 'success'
      return txResult
    })
    if (!txResult) {
      this.votingButtonState = 'fail'
    }
    if (txResult) {
      this.onVoteEventSuccessUpdateData()
    }
    this.voting = false
  }

  async onVoteEventSuccessUpdateData() {
    this.updateProposalState()
    await this.loadAccountData()
    if (this.accountVotesSide) {
      this.cacheCurrentUserVotes = this.accountVotedVotes
      this.accountsVotes[this.accountVotesSide].push(
        {
          address: this.userAddress,
          vote: this.accountVotedVotes
        }
      )
    }
    // await this.getProposalBaseDataFunc()
  }

  async onRunQueueEvent() {
    this.queuing = true
    await this.callChainFunc( async () => {
      if (!this.signer) {
        return
      }
      const daoGovernorContract = getDaoGovernorContract(CHAIN_ID_TO_DAO_GOVERNOR_ADDRESS[TARGET_NETWORK_ID], this.signer)
      const promiseInstance = await daoGovernorContract.queue(Number(this.proposalIndex))
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.queuePoolProposalResult', {
          index: this.proposalIndex
        }).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      return await transaction
    })
    this.updateProposalState()
    this.queuing = false
  }

  async onRunExecuteEvent() {
    this.executing = true
    await this.callChainFunc( async () => {
      if (!this.signer) {
        return
      }
      const daoGovernorContract = getDaoGovernorContract(CHAIN_ID_TO_DAO_GOVERNOR_ADDRESS[TARGET_NETWORK_ID], this.signer)
      const transactionResult = await daoGovernorContract.execute(Number(this.proposalIndex))
      const transaction = waitTransaction(transactionResult)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.executePoolProposalResult', {
          index: this.proposalIndex
        }).toString(),
        transactionHash: transactionResult.hash ? transactionResult.hash : '',
      })
      return await transaction
    })
    this.updateProposalState()
    this.executing = false
  }
}
