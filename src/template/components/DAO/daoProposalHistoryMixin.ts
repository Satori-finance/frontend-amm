import { Component, Mixins, Watch } from 'vue-property-decorator'
import { DaoProposalDescription, DaoProposalMixin } from './daoProposalMixin'
import { queryDaoProposalList } from '@/api/daoGovernor'
import { DaoGovernorProposal, DaoProposalState } from '@/type'
import {
  formatProposalIndex,
  getBlockTimestampFromList,
  parseDaoProposalState,
  toBigNumber,
} from '@/utils'
import { estimateBlockTime} from '@/utils/chain'
import { Provider } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import { namespace } from 'vuex-class'
import { DECIMALS, normalizeBigNumberish } from '@mcdex/mai3.js'
import {
  getDaoGovernorContract,
  getXmcbContract,
  CHAIN_ID_TO_DAO_XMCB_ADDRESS,
  CHAIN_ID_TO_DAO_GOVERNOR_ADDRESS
} from '@mcdex/mcdex-governance.js'
import {
  DAO_GOVERNOR_VOTES_DECIMALS,
  L1_NETWORK_ID, SATORI_ADDRESS,
  MCDEX_DAO_GOVERNOR_ID, SUPPORTED_NETWORK_ID,
  TARGET_NETWORK_ID,
} from '@/const'
import debounceAsync from '@seregpie/debounce-async'
import { DAO_GOVERNANCE_EVENT, VUE_EVENT_BUS } from '@/event'
import { queryTimeStampByBlockNumber } from '@/api/block'
import { chainConfigs } from '@/config/chain'

const wallet = namespace('wallet')

export interface ProposalItem {
  state: DaoProposalState
  index: string
  description: DaoProposalDescription | null
  startTimestamp: number
  endTimestamp: number
  for: BigNumber
  against: BigNumber
}

@Component
export class DaoProposalHistoryMixin extends Mixins(DaoProposalMixin) {
  @wallet.Getter('provider') provider !: Provider
  @wallet.Getter('providerL1') providerL1 !: Provider
  @wallet.Getter('address') accountAddress !: string

  votesDecimals = DAO_GOVERNOR_VOTES_DECIMALS

  finishLoadAllProposal: boolean = false
  loading: boolean = false
  protected currentBlockNumber: number = 0
  protected myVotes: BigNumber = new BigNumber(0)
  protected proposals: DaoGovernorProposal[] = []
  protected pagination = {
    count: 0,
    pageSize: 10,
    currentPage: 0,
  }
  protected debounceProposals = debounceAsync(this.getProposals, 500)

  mounted() {
    VUE_EVENT_BUS.on(DAO_GOVERNANCE_EVENT.UpdateMyVotes, this.onDataChangeUpdateMyVotes)
  }

  destroyed() {
    VUE_EVENT_BUS.off(DAO_GOVERNANCE_EVENT.UpdateMyVotes, this.onDataChangeUpdateMyVotes)
  }

  get offset() {
    return Math.max((this.pagination.currentPage - 1) * this.pagination.pageSize, 0)
  }

  async getLatestBlockNumber(): Promise<number> {
    return await this.providerL1.getBlockNumber()
  }

  protected async load() {
    if (this.loading) {
      return
    }
    try {
      await this.debounceProposals()
    } catch (e) {
      console.warn(e)
    }
  }

  convertProposal(data: DaoGovernorProposal | undefined): ProposalItem | undefined {
    if (data) {
      return {
        state: parseDaoProposalState(data?.state || 0),
        index: formatProposalIndex(Number(data.proposalId), 3),
        description: this.parseDescription(data.description),
        startTimestamp: data.startTimestamp ? data.startTimestamp : estimateBlockTime(this.currentBlockNumber, data.startBlock as number),
        endTimestamp: data.endTimestamp ? data.endTimestamp : estimateBlockTime(this.currentBlockNumber, data.endBlock as number),
        for: toBigNumber(data.for),
        against: toBigNumber(data.against),
      }
    }
    return undefined
  }

  computeProposalState(params: {
    for: BigNumber
    against: BigNumber
    currentBlock: number
    endBlock: number
  }): DaoProposalState {
    if (params.endBlock > params.currentBlock) {
      return DaoProposalState.Active
    }
    if (params.for.gt(params.against)) {
      return DaoProposalState.Succeeded
    }
    return DaoProposalState.Failed
  }

  // header my voter value
  @Watch('provider', { immediate: true })
  @Watch('accountAddress', { immediate: true })
  @Watch('providerL1', { immediate: true })
  async onDataChangeUpdateMyVotes() {
    if (!this.provider || !this.accountAddress || this.accountAddress === '') {
      return
    }
    await this.callChainReadFunc(async () => {
      const xmcbAddress = TARGET_NETWORK_ID === SUPPORTED_NETWORK_ID.BSC ? SATORI_ADDRESS : CHAIN_ID_TO_DAO_XMCB_ADDRESS[TARGET_NETWORK_ID] // todo delete

      const xMcbContract = getXmcbContract(xmcbAddress, this.provider)
      this.myVotes = normalizeBigNumberish(await xMcbContract.getCurrentVotes(this.accountAddress)).shiftedBy(-DECIMALS)
    })
    if (this.providerL1) {
      this.currentBlockNumber = await this.providerL1.getBlockNumber()
    }
  }

  async getProposals() {
    if (!this.provider) {
      return
    }

    if (this.providerL1) {
      this.currentBlockNumber = await this.getLatestBlockNumber()
    }

    this.loading = true
    try {
      const resultData = await this.callGraphApiFunc(() => {
        return queryDaoProposalList(MCDEX_DAO_GOVERNOR_ID, this.offset, this.pagination.pageSize)
      })
      if (resultData && resultData.proposals.length > 0) {
        const daoGovernanceContract = getDaoGovernorContract(CHAIN_ID_TO_DAO_GOVERNOR_ADDRESS[TARGET_NETWORK_ID], this.provider)
        let proposals: DaoGovernorProposal[] = resultData.proposals
        const blockNumberArray = new Set<number>()
        proposals.forEach(item => {
          blockNumberArray.add(item.startBlock as number)
          blockNumberArray.add(item.endBlock as number)
        })
        await Promise.all(proposals.map(async i => {
          i.state = await daoGovernanceContract.state(Number(i.proposalId))
        }))
        // query
        if (blockNumberArray.size > 0) {
          const timeStampRes = await this.callGraphApiFunc(() => {
            return queryTimeStampByBlockNumber(Array.from(blockNumberArray.values()), chainConfigs[L1_NETWORK_ID].subgraphConfig.blockSubgraph)
          })
          if (timeStampRes) {
            proposals = proposals.map((item) => {
              item.startTimestamp = getBlockTimestampFromList(timeStampRes.blockList, item.startBlock as number, this.currentBlockNumber)
              item.endTimestamp = getBlockTimestampFromList(timeStampRes.blockList, item.endBlock as number, this.currentBlockNumber)
              return item
            })
          }
        }
        const count = Number(resultData.daoGovernor?.proposalCount)
        if (this.pagination.count === count) {
          this.proposals.splice(this.offset, proposals.length, ...proposals)
        } else {
          const data = new Array<DaoGovernorProposal>(count)
          data.splice(this.offset, proposals.length, ...proposals)
          this.pagination.count = count
          this.proposals = data
        }
      } else if (resultData && resultData.proposals.length === 0) {
        this.finishLoadAllProposal = true
      }
    } finally {
      this.loading = false
    }
  }
}
