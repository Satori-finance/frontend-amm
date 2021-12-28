import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import { DaoProposalState } from '@/type'
import { Provider } from '@ethersproject/providers'
import _ from 'lodash'
import { getBlockTimestampFromList } from '@/utils'
import { namespace } from 'vuex-class'
import { queryTimeStampByBlockNumber } from '@/api/block'
import { arbChainConfig, chainConfigs } from '@/config/chain'
import { L1_NETWORK_ID } from '@/constants'
import { ErrorHandlerMixin } from '@/mixins'

const wallet = namespace('wallet')

@Component
export default class ProposalHistoryStateMixin extends Mixins(ErrorHandlerMixin) {
  @Prop({ required: true }) currentStatus !: DaoProposalState
  @Prop({ required: true }) etaTimestamp !: number
  @Prop({ required: true }) statusBlocks !: {
    created: number,
    active: number,
    end: number,
    executed: number,
    expired: number
  }
  @Prop({ required: true }) currentBlock !: number
  @wallet.Getter('providerL1') providerL1 !: Provider

  private DaoProposalState = DaoProposalState

  private stateTimestamp = {
    created: this.currentTimestamp(),
    active: this.currentTimestamp(),
    end: this.currentTimestamp(),
    executed: this.currentTimestamp(),
  }

  currentTimestamp() {
    return Math.floor(Date.now() / 1000)
  }

  get expireTimestamp(): number {
    return this.etaTimestamp + (30 * 86400)
  }

  get currentActive(): number {
    if (this.currentStatus === DaoProposalState.Created) return 0
    if (this.currentStatus === DaoProposalState.Active || this.isFailed
      || this.currentStatus === DaoProposalState.Succeeded) return 2
    if (this.isSucceeded) return 3
    return 0
  }

  get isQueued(): boolean {
    return this.currentStatus === DaoProposalState.Queued
  }

  get isExecuted(): boolean {
    return this.currentStatus === DaoProposalState.Executed
  }

  get isExpired(): boolean {
    return this.currentStatus === DaoProposalState.Expired
  }

  get finishStatus(): string {
    if (this.isSucceeded) {
      if (this.isExecuted) {
        return 'success'
      }
      if (this.isExpired) {
        return 'error'
      }
      return 'wait'
    }
    if (this.isFailed) {
      return 'error'
    }
    return ''
  }

  get isSucceeded(): boolean {
    if (this.currentStatus === DaoProposalState.Succeeded
      || this.currentStatus === DaoProposalState.Queued
      || this.currentStatus === DaoProposalState.Executed
      || this.currentStatus === DaoProposalState.Expired) {
      return true
    }
    return false
  }

  get isFailed(): boolean {
    return this.currentStatus === DaoProposalState.Failed || this.currentStatus === DaoProposalState.Defeated
  }

  get isActive(): boolean {
    return this.currentStatus === DaoProposalState.Active
  }

  getBlockTimestampFunc = _.debounce(this.updateStateTimestamp)

  async updateStateTimestamp() {
    if (!this.providerL1) {
      return
    }
    const currentBlockNumber = await this.providerL1.getBlockNumber()
    const blockNumber = new Set<number>([this.statusBlocks.created, this.statusBlocks.active, this.statusBlocks.end])
    const [timestamp, executeTimestamp]= await Promise.all([
      this.callGraphApiFunc(() => {
        return queryTimeStampByBlockNumber(Array.from(blockNumber.values()), chainConfigs[L1_NETWORK_ID].subgraphConfig.blockSubgraph)
      }),
      this.callGraphApiFunc(() => {
        return queryTimeStampByBlockNumber([this.statusBlocks.executed], arbChainConfig.subgraphConfig.blockSubgraph)
      })
    ])
    this.stateTimestamp = {
      created: getBlockTimestampFromList(timestamp?.blockList || null, this.statusBlocks.created, currentBlockNumber),
      active: getBlockTimestampFromList(timestamp?.blockList || null, this.statusBlocks.active, currentBlockNumber),
      end: getBlockTimestampFromList(timestamp?.blockList || null, this.statusBlocks.end, currentBlockNumber),
      executed: getBlockTimestampFromList(executeTimestamp?.blockList || null, this.statusBlocks.executed, currentBlockNumber),
    }
  }

  @Watch('statusBlocks', { immediate: true })
  @Watch('providerL1', { immediate: true })
  @Watch('currentStatus', { immediate: true })
  @Watch('currentActive', { immediate: true })
  async onStatusBlocksChanged() {
    if (!this.providerL1 || this.statusBlocks.created === 0) {
      return
    }
    this.getBlockTimestampFunc()
  }
}
