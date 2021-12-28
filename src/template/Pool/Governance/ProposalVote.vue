<template>
  <div>
    <div class="pool-proposal-vote">
      <div class="vote-box">
        <div class="left">
          <div class="proposal-title">
            {{ $t('governance.proposal') }} {{ proposalIndex }}
          </div>
          <div class="proposal-status" :class="[proposalStateClass]">
            {{ proposalStateText }}
          </div>
          <div class="proposal-name-title">
              {{ proposalTitle }}
              <span class="address-line" v-if="proposalType === poolProposalTypes.AppointNewOperator">
                {{ newOperatorAddress }}
                <el-link class="icon" :underline="false" target="_blank"
                         :href="newOperatorAddress | etherBrowserAddressFormatter">
                  <i class="iconfont icon-transmit"></i>
                </el-link>
              </span>
          </div>
          <div class="vote-panel">
            <div class="vote-panel-item vote-for">
              <VoteCardPanel vote-side="for" :need-votes="totalVotes" :account-votes-list="accountsVotes['for']"
                             :vote-end="voteIsEnd" @toVote="onVoteForEvent" :account-is-voted="accountIsVoted"
                             :is-start-vote="isStartVote" :votes-decimals="votesDecimals" :current-vote-side="voteSide"
                             :my-votes="myVotes" :voting="voting" key="for"/>
            </div>
            <div class="vote-panel-item">
              <VoteCardPanel vote-side="against" :need-votes="totalVotes" :account-votes-list="accountsVotes['against']"
                             :vote-end="voteIsEnd" @toVote="onVoteAgainstEvent" :account-is-voted="accountIsVoted"
                             :is-start-vote="isStartVote" :votes-decimals="votesDecimals" :current-vote-side="voteSide"
                             :my-votes="myVotes" :voting="voting" key="against"/>
            </div>
          </div>
          <div class="vote-sub-panel">
            <div class="warning-tip-line" v-if="!voteIsEnd">{{ $t('pool.poolProposal.liquidityTip') }}</div>
            <table class="mc-data-table mc-data-table--border is-medium">
              <tbody>
              <tr>
                <td>{{ $t('governance.votesThreshold') }}</td>
                <td>{{ quorumVotes | bigNumberFormatter(votesDecimals) }} {{ $t('governance.votes') }}</td>
              </tr>
              <tr>
                <td>{{ $t('governance.totalVotes') }}</td>
                <td>{{ totalVotes | bigNumberFormatter(votesDecimals) }} {{ $t('governance.votes') }}</td>
              </tr>
              <tr v-if="isConnectedWallet">
                <td>{{ $t('dao.myVotes') }}</td>
                <td>
                  <span v-if="accountVotesSide === 'for'">
                    <span class="for">{{ $t('governance.for') }} </span>
                    <span class="value">({{ accountVotedVotes | bigNumberFormatter(votesDecimals) }}</span>
                  </span>
                  <span v-else-if="accountVotesSide === 'against'">
                    <span class="against">{{ $t('governance.against') }} </span>
                      <span class="value">({{ accountVotedVotes | bigNumberFormatter(votesDecimals) }}</span>
                  </span>
                  <span v-else>
                    <span class="no-votes">{{ $t('dao.notYetVoted') }} </span>
                    <span class="value">({{ accountVotedVotes | bigNumberFormatter(votesDecimals) }}</span>
                  </span>
                  {{ $t('governance.votes') }})
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="right">
          <div class="my-vote-info-box">
            <MyVotesInfo :vote-address="voteAddress" />
          </div>
          <div class="proposal-proposer-box">
            <ProposalProposer :proposer-address="proposerAddress" />
          </div>
          <div class="proposal-history-box">
            <ProposalHistoryState :current-status="proposalState" :status-blocks="statusBlocks"
                             :current-block="currentBlockNumber" />
          </div>
          <div class="execute-proposal-result-box" v-if="isShowExecuteButton">
            <el-button size="medium" type="primary" round @click="onExecuteEvent" :disabled="executeButtonIsLoading">
              {{ $t('governance.execute') }}
              <i v-if="executeButtonIsLoading" class="el-icon-loading"></i>
            </el-button>
          </div>
        </div>
      </div>
      <div class="proposal-details">
        <ModifyPerpParamsDetails v-if="proposalType === poolProposalTypes.ModifyPerpParams"
                                 :proposal="poolProposalObject" />
        <CreateNewPerpetualDetails v-if="proposalType === poolProposalTypes.CreateNewPerpetual"
                                   :proposal="poolProposalObject" :liquidity-pool="liquidityPool" />
        <ChangeInsuranceFundCapDetails v-if="proposalType === poolProposalTypes.ChangeInsuranceFundCap"
                                   :proposal="poolProposalObject" :pool-base-info="poolBaseInfo" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import { BaseCardFrame, ProposalProposer, VoteCardPanel } from '@/components'
import {
  LiquidityPoolDirectoryItem,
  PoolProposal,
  PoolProposalState,
} from '@/type'
import ProposalHistoryState from './ProposalHistoryState.vue'
import {
  IPoolProposalBuilder,
  PoolProposalMixin,
  CombinedPoolProposalTypes,
  AppointNewOperatorPoolProposal,
} from '@/template/components/Pool/poolProposalMixin'
import MyVotesInfo from './MyVotesInfo.vue'
import ModifyPerpParamsDetails from './VoteDetails/ModifyPerpParamsDetails.vue'
import CreateNewPerpetualDetails from './VoteDetails/CreateNewPerpetualDetails.vue'
import ChangeInsuranceFundCapDetails  from './VoteDetails/ChangeInsuranceFundCapDetails.vue'
import { queryPoolProposalDetails } from '@/api/pool'
import { namespace } from 'vuex-class'
import { parseLpProposalState, toBigNumber } from '@/utils'
import { getGasStationTxParams } from '@/utils/gasPrice'
import {
  DECIMALS,
  getLiquidityPool,
  getLpGovernorContract,
  getReaderContract,
  normalizeBigNumberish,
} from '@mcdex/mai3.js'
import { ethers } from 'ethers'
import { Provider } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import { PoolBaseInfo } from '@/template/components/Pool/poolMixins'
import { POOL_GOVERNOR_VOTES_DECIMALS } from '@/constants'
import { waitTransaction } from '@/utils/transaction'
import { gasLimitConfig } from '@/config/gas'
import { Route } from 'vue-router'
import store from '@/store'
import { PageRouteMixinFactory } from '@/mixins'

const perpetual = namespace('perpetual')
const wallet = namespace('wallet')

interface accountVoteItem {
  address: string
  vote: number
}

const routeValidator = async (to: Route) => {
  if (store.getters['routePassed'](`${to.params.poolAddress}-proposal-${to.params.index}`)) {
    return
  }
  const provider = store.getters['wallet/provider']
  try {
    const reader = await getReaderContract(provider)
    const liquidityPoolStorage = await getLiquidityPool(reader, to.params.poolAddress.toLowerCase())
    const lpGovernanceContract = getLpGovernorContract(liquidityPoolStorage.governor, provider)
    await lpGovernanceContract.state(Number(to.params.index))
    store.commit('setRouteValidatorPassport', `${to.params.poolAddress}-proposal-${to.params.index}`)
  } catch (e) {
    if (e.message.includes('invalid proposal id') || e.data?.message?.includes('invalid proposal id')) {
      throw e
    }
  }
}

@Component({
  components: {
    BaseCardFrame,
    MyVotesInfo,
    VoteCardPanel,
    ProposalHistoryState,
    ProposalProposer,
    ModifyPerpParamsDetails,
    CreateNewPerpetualDetails,
    ChangeInsuranceFundCapDetails,
  },
})
export default class PoolProposalVote extends Mixins(PoolProposalMixin, PageRouteMixinFactory(routeValidator)) {
  @Prop({ required: true }) poolBaseInfo !: PoolBaseInfo | null
  @perpetual.Getter('getLiquidityPoolFunc') getLiquidityPoolFunc!: (liquidityPoolAddress: string) => LiquidityPoolDirectoryItem | null
  @wallet.Getter('provider') provider !: Provider
  @wallet.Getter('providerL1') providerL1 !: Provider
  @wallet.Getter('signer') signer!: ethers.Signer
  @wallet.Getter('address') userAddress !: string

  votesDecimals = POOL_GOVERNOR_VOTES_DECIMALS

  // temp
  private cacheCurrentUserVotes: number = 0
  private forVotes: number = 0
  private againstVotes: number = 0

  private voting: boolean = false
  private proposalIndex: string = ''
  private poolAddress: string = ''
  private poolProposalTypes = CombinedPoolProposalTypes
  private poolProposalDetails: PoolProposal | null = null
  private poolProposalObject: IPoolProposalBuilder | null = null
  private quorumVotes: number = 0
  private proposalType: CombinedPoolProposalTypes | null = null
  private currentBlockNumber: number = 0
  private voteSide: 'for' | 'against' = 'for'
  private accountIsVoted: boolean = true
  private accountVotedVotes: number = 0
  private accountVotesSide: 'for' | 'against' | '' = ''
  private myVotes: number = 0
  private executeButtonIsLoading: boolean = false
  private successUnlockDelayBlock: number = 0
  private successExecuteDelayBlock: number = 0
  private accountsVotes: {
    for: accountVoteItem[],
    against: accountVoteItem[]
  } = {
    for: [],
    against: []
  }

  get isShowExecuteButton(): boolean {
    if (this.poolProposalDetails && this.voteIsEnd
        && this.proposalState === PoolProposalState.Queued) {
      return true
    }
    return false
  }

  get proposalState(): PoolProposalState {
    if (!this.poolProposalDetails || !this.poolProposalDetails.state) {
      return PoolProposalState.Created
    }
    return parseLpProposalState(this.poolProposalDetails.state)
  }

  get liquidityPool(): LiquidityPoolDirectoryItem | null {
    if (this.poolAddress === '') {
      return null
    }
    return this.getLiquidityPoolFunc(this.poolAddress)
  }

  get voteIsEnd(): boolean {
    if (this.proposalState === PoolProposalState.Failed
        || this.proposalState === PoolProposalState.Succeeded
        || this.proposalState === PoolProposalState.Queued
        || this.proposalState === PoolProposalState.Executed
        || this.proposalState === PoolProposalState.Expired
    ) {
      return true
    }
    return false
  }

  get isStartVote(): boolean {
    return this.proposalState === PoolProposalState.Active
  }

  get voteAddress(): string {
    if (!this.liquidityPool) {
      return ''
    }
    return this.liquidityPool.liquidityPoolStorage.governor.toLowerCase()
  }

  get proposalStateClass(): string {
    if (!this.poolProposalDetails) {
      return 'proposal-status-active'
    }
    const status = this.poolProposalDetails.state
    if (status === PoolProposalState.Active || status === PoolProposalState.Created) {
      return 'proposal-status-active'
    }
    if (status === PoolProposalState.Failed) {
      return 'proposal-status-failed'
    }
    if (status === PoolProposalState.Succeeded
        || status === PoolProposalState.Executed
        || status === PoolProposalState.Expired
        || status === PoolProposalState.Queued) {
      return 'proposal-status-success'
    }
    return 'proposal-status-active'
  }

  get proposalStateText (): string {
    if (!this.poolProposalDetails) {
      return''
    }
    const status = this.poolProposalDetails.state
    if (status === PoolProposalState.Active) {
      return this.$t('governance.active').toString()
    }
    if (status === PoolProposalState.Failed) {
      return this.$t('governance.failed').toString()
    }
    if (status === PoolProposalState.Succeeded
        || status === PoolProposalState.Executed
        || status === PoolProposalState.Expired
        || status === PoolProposalState.Queued) {
      return this.$t('governance.succeeded').toString()
    }
    return this.$t('governance.created').toString()
  }

  get proposalTitle(): string {
    if (!this.poolProposalDetails) {
      return ''
    }
    return this.getProposalTitle(
        this.liquidityPool,
        this.poolProposalDetails.description,
        this.poolProposalDetails.calldatas,
        this.poolProposalDetails.signatures,
    )
  }

  get newOperatorAddress(): string {
    if (this.proposalType !== CombinedPoolProposalTypes.AppointNewOperator || !this.poolProposalObject) {
      return ''
    }
    return (this.poolProposalObject as AppointNewOperatorPoolProposal).newOperatorAddress
  }

  get proposerAddress(): string {
    if (!this.poolProposalDetails) {
      return ''
    }
    return this.poolProposalDetails.proposer?.id || ''
  }

  get statusBlocks() {
    let blocks = {
      created: 0,
      active: 0,
      end: 0,
      executed: 0,
      executeDelay: 0,
      unLock: 0
    }
    if (!this.poolProposalDetails) {
      return blocks
    }
    const startBlock = this.poolProposalDetails.startBlock as number
    const endBlock = this.poolProposalDetails.endBlock as number
    blocks = {
      created: startBlock,
      active: startBlock + 1,
      end: endBlock + 1,
      unLock: endBlock + this.successUnlockDelayBlock + this.successExecuteDelayBlock + 1,
      executeDelay: endBlock + this.successExecuteDelayBlock + 1,
      executed:  this.poolProposalDetails.executedBlockNumber as number,
    }
    return blocks
  }

  get totalVotes(): number {
    return this.forVotes + this.againstVotes + this.cacheCurrentUserVotes
  }

  @Watch('$route', { immediate: true, deep: true })
  async onRouterChange() {
    this.proposalIndex = this.$route.params?.index || ''
    this.poolAddress = this.$route.params?.poolAddress.toLowerCase() || ''
  }

  @Watch('voteAddress', { immediate: true })
  @Watch('provider', { immediate: true })
  async loadProposalDetails() {
    const proposalResult = await this.callGraphApiFunc(() => {
      if (this.voteAddress === '' || this.proposalIndex === ''
          || isNaN(Number(this.proposalIndex)) || !this.liquidityPool || !this.provider) {
        return null
      }
      return queryPoolProposalDetails(
          this.liquidityPool.liquidityPoolStorage.governor.toLowerCase(),
          Number(this.proposalIndex)
      )
    })

    if (!proposalResult || proposalResult.proposals.length === 0) {
      return
    }
    const poolProposalDetails = proposalResult.proposals[0]
    if (this.providerL1) {
      this.currentBlockNumber = await this.providerL1.getBlockNumber()
    }
    this.poolProposalObject = this.parsePoolProposal(
      this.liquidityPool,
      this.parsePoolDescription(poolProposalDetails.description),
      poolProposalDetails.calldatas,
      poolProposalDetails.signatures
    )
    this.proposalType = this.poolProposalObject?.type || null

    this.poolProposalDetails = poolProposalDetails
    this.cacheCurrentUserVotes = 0

    await this.callChainReadFunc(async () => {
      const lpGovernanceContract = getLpGovernorContract(this.voteAddress, this.provider)
      if (this.poolProposalDetails) {
        this.updateProposalState()
        // need vote
        const needVoteVal = normalizeBigNumberish(
          await lpGovernanceContract.getQuorumVotes(this.poolProposalDetails.index as number)).shiftedBy(-DECIMALS)
        this.quorumVotes = needVoteVal.toNumber()
      }
      this.successUnlockDelayBlock = new BigNumber((await lpGovernanceContract.unlockDelay()).toString()).toNumber()
      this.successExecuteDelayBlock = new BigNumber((await lpGovernanceContract.executionDelay()).toString()).toNumber()
    })
  }

  async updateProposalState() {
    await this.callChainReadFunc(async () => {
      if (!this.poolProposalDetails) {
        return
      }
      const lpGovernanceContract = getLpGovernorContract(this.voteAddress, this.provider)
      const proposalState = await lpGovernanceContract.state(this.poolProposalDetails.index as number)
      this.poolProposalDetails.state = parseLpProposalState(proposalState)
    })
  }

  @Watch('userAddress', { immediate: true })
  @Watch('provider', { immediate: true })
  @Watch('proposalType')
  async loadAccountData() {
    await this.callChainReadFunc(async () => {
      if (!this.provider || this.voteAddress === '' || this.proposalIndex === '' ||
          isNaN(Number(this.proposalIndex)) || !this.proposalType || !this.userAddress || this.userAddress === '') {
        return
      }
      const lpGovernanceContract = getLpGovernorContract(this.voteAddress, this.provider)
      if (this.userAddress && this.userAddress !== '') {
        const userVoteDetails = await lpGovernanceContract.getReceipt(Number(this.proposalIndex), this.userAddress as string)
        this.accountIsVoted = userVoteDetails.hasVoted
        this.myVotes = new BigNumber((await lpGovernanceContract.balanceOf(this.userAddress)).toString()).shiftedBy(-18).toNumber()
        this.accountVotedVotes = normalizeBigNumberish(userVoteDetails.votes).shiftedBy(-DECIMALS).toNumber()
        if (this.accountIsVoted) {
          this.accountVotesSide = userVoteDetails.support ? 'for' : 'against'
        }
      }
    })
  }

  @Watch('poolProposalDetails', { deep: true })
  onProposalUserVotesChanged() {
    let votes: { for: accountVoteItem[], against: accountVoteItem[] } = {
      for: [],
      against: []
    }
    if (!this.poolProposalDetails || !this.poolProposalDetails.votes || this.proposalState === PoolProposalState.Created) {
      this.accountsVotes = votes
      return
    }
    this.poolProposalDetails.votes.forEach((val) => {
      if (val.support) {
        votes.for.push({
          address: val.voter.id,
          vote: Number((val.votes as String))
        })
      } else {
        votes.against.push({
          address: val.voter.id,
          vote: Number((val.votes as String))
        })
      }
    })
    this.accountsVotes = votes

    // need votes
    this.forVotes = toBigNumber(this.poolProposalDetails.for).toNumber()
    this.againstVotes = toBigNumber(this.poolProposalDetails.against).toNumber()
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
    // await this.loadProposalDetails()
  }

  async onVoteForEvent() {
    this.voteSide = 'for'
    await this.onVoteEvent()
  }

  async onVoteAgainstEvent() {
    this.voteSide = 'against'
    await this.onVoteEvent()
  }

  async onExecuteEvent() {
    this.executeButtonIsLoading = true
    await this.callChainFunc(async () => {
      if (!this.signer || !this.liquidityPool) {
        return
      }
      const lpGovernorContract = getLpGovernorContract(this.liquidityPool.liquidityPoolStorage.governor, this.signer)
      // the gasLimit of different proposals are very different. use auto-estimated gas instead
      const gasLimit = undefined
      const gas = await getGasStationTxParams(gasLimit)
      const promiseInstance = await lpGovernorContract.execute(
          Number(this.proposalIndex),
          gas
      )
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        location: 'top',
        transaction: transaction,
        content: this.$t('transaction.executePoolProposalResult', {
          index: this.proposalIndex
        }).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      const result = await transaction
      await this.loadProposalDetails()
      return result
    })
    this.executeButtonIsLoading = false
  }

  async onVoteEvent() {
    this.voting = true
    await this.callChainFunc(async () => {
      if (!this.signer || !this.liquidityPool) {
        return
      }
      const lpGovernorContract = getLpGovernorContract(this.liquidityPool.liquidityPoolStorage.governor, this.signer)
      const gas = await getGasStationTxParams(gasLimitConfig.VOTE_POOL_PROPOSAL_GAS_LIMIT)

      const promiseInstance = await lpGovernorContract.castVote(
        this.proposalIndex,
        this.voteSide==='for',
        gas
      )
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        location: 'top',
        transaction: transaction,
        content: this.$t('transaction.voteProposal', {
          index: this.proposalIndex
        }).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      const result = await transaction
      this.onVoteEventSuccessUpdateData()
      return result
    })
    this.voting = false
  }
}
</script>

<style scoped lang="scss">
@import "./governance.scss";

.pool-proposal-vote {
  .vote-box {
    height: 100%;
    display: flex;
    justify-content: space-between;

    .proposal-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--mc-text-color-white);
    }

    .proposal-status {
      margin-top: 12px;
      width: 80px;
      height: 26px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 400;
      color: var(--mc-text-color-white);
      text-align: center;
      line-height: 26px;
    }

    .proposal-status-active {
      background: var(--mc-color-warning);
    }

    .proposal-status-success {
      background: var(--mc-color-success);
    }

    .proposal-status-failed {
      background: var(--mc-color-error);
    }

    .proposal-name-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--mc-text-color-white);
      margin-top: 50px;
    }

    .address-line {
      margin-left: 30px;
      color: var(--mc-text-color);
      font-weight: 400;
    }

    .vote-panel  {
      margin-top: 30px;
      display: flex;
      align-items: stretch;

      .vote-panel-item {
        display: flex;
      }

      .vote-for {
        margin-right: 38px;
      }
    }

    .vote-sub-panel {
      margin-top: 36px;

      .mc-data-table {
        width: 100%;

        tbody {
          font-size: 14px;
        }

        td {
          border: unset;
        }

        tr {
          border: 1px solid var(--mc-border-color);
        }

      }

      td:nth-of-type(1) {
        width: 15%;
        text-align: left;
        padding-left: 10px;
        color: var(--mc-text-color);
      }
      td:nth-of-type(2) {
        width: 85%;
        text-align: left;
        padding-left: 10px;
        color: var(--mc-text-color-white);
      }

      .no-votes {
        color: var(--mc-color-info);
      }

      .for {
        color: var(--mc-color-success);
      }

      .against {
        color: var(--mc-color-error);
      }
    }


    .proposal-proposer-box {
      margin-top: 30px;
      margin-left: 88px;
    }

    .proposal-history-box {
      margin-top: 30px;
      margin-left: 88px;
    }

    .execute-proposal-result-box {
      margin-left: 88px;

      ::v-deep {
        .el-button {
          width: 100%;
        }
      }
    }
  }

  .warning-tip-line {
    font-size: 14px;
    color: var(--mc-color-warning);
    text-align: center;
    margin-bottom: 18px;
  }

  .proposal-details {
    padding-top: 60px;
  }
}
</style>
