<template>
  <div class="dao-proposal-vote">
    <BaseCardFrame>
      <template slot="title">
        <div class="back-item" @click="onToBack">
          <i class="el-icon-arrow-left"></i>
          {{ $t('base.back') }}
        </div>
      </template>
      <template slot="content">
        <div class="vote-box">
          <div class="left">
            <div class="proposal-title">
              {{ $t('governance.proposal') }}<span>-</span>{{ proposalIndex }}
            </div>
            <div class="proposal-status" :class="[proposalStateClass]">
              {{ proposalStateText }}
            </div>
            <div class="proposal-name-title">
              {{ proposalTitle }}
            </div>
            <div class="vote-panel">
              <div class="vote-panel-item vote-for">
                <VoteCardPanel vote-side="for" :need-votes="quorumVotes" :account-votes-list="accountsVotes['for']"
                               :vote-end="voteIsEnd" @toVote="onVoteForEvent" :account-is-voted="accountIsVoted"
                               :is-start-vote="isStartVote" :vote-token-name="$t('governance.votes')"
                               :my-votes="myVotes" :votes-decimals="votesDecimals" :voting="voting"
                               :current-vote-side="voteSide" key="for" />
              </div>
              <div class="vote-panel-item">
                <VoteCardPanel vote-side="against" :need-votes="quorumVotes" :account-votes-list="accountsVotes['against']"
                               :vote-end="voteIsEnd" @toVote="onVoteAgainstEvent" :account-is-voted="accountIsVoted"
                               :is-start-vote="isStartVote" :vote-token-name="$t('governance.votes')"
                               :my-votes="myVotes" :votes-decimals="votesDecimals" :voting="voting"
                               :current-vote-side="voteSide" key="against"/>
              </div>
            </div>
            <div class="vote-sub-panel">
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
              <MyVotesInfo />
            </div>
            <div class="proposal-proposer-box">
              <ProposalProposer :proposer-address="proposerAddress" />
            </div>
            <div class="proposal-history-box">
              <ProposalHistoryState :current-status="proposalState" :status-blocks="statusBlocks"
                                    :current-block="currentBlockNumber" :eta-timestamp="etaTimestamp" />
            </div>
            <div class="history-button-box" v-if="isShowQueueButton">
              <el-button size="medium" type="primary" round @click="onRunQueueEvent" :disabled="queuing">
                {{ $t('governance.queue') }}
                <i v-if="queuing" class="el-icon-loading"></i>
              </el-button>
            </div>
            <div class="history-button-box" v-if="isShowExecuteButton">
              <el-button size="medium" type="primary" round @click="onRunExecuteEvent" :disabled="executing">
                {{ $t('governance.execute') }}
                <i v-if="executing" class="el-icon-loading"></i>
              </el-button>
            </div>
          </div>
        </div>
        <div class="proposal-details">
          <ProposalDetails :proposal-ipfs-store="proposalIPFSStore" :proposal-actions="proposalActions"
                           :proposal-description="proposalDescription" :loading="loading" />
        </div>
      </template>
    </BaseCardFrame>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { BaseCardFrame, ProposalProposer, VoteCardPanel } from '@/components'
import MyVotesInfo from './MyVotesInfo.vue'
import ProposalDetails from './ProposalDetails.vue'
import ProposalHistoryState from './ProposalHistoryState.vue'
import { ProposalVoteMixin } from '@/template/components/DAO/ProposalVoteMixin'
import { DaoProposalState } from '@/type'
import { Route } from 'vue-router'
import store from '@/store'
import { TARGET_NETWORK_ID } from '@/constants'
import { CHAIN_ID_TO_DAO_GOVERNOR_ADDRESS, getDaoGovernorContract } from '@mcdex/mcdex-governance.js'
import { PageRouteMixinFactory } from '@/mixins'
import { promiseTimeout } from '@/utils'

const routeValidator = async (to: Route) => {
  if (store.getters['routePassed'](`dao-proposal-${to.params.index}`)) {
    return
  }
  const provider = store.getters['wallet/provider']
  const daoGovernanceContract = getDaoGovernorContract(CHAIN_ID_TO_DAO_GOVERNOR_ADDRESS[TARGET_NETWORK_ID], provider)
  try {
    await promiseTimeout(daoGovernanceContract.state(Number(to.params.index)), 5000)
    store.commit('setRouteValidatorPassport', `dao-proposal-${to.params.index}`)
  } catch (e) {
    if (e.message.includes('invalid proposal id')) {
      throw e
    }
  }
}

@Component({
  components: {
    ProposalHistoryState,
    BaseCardFrame,
    VoteCardPanel,
    ProposalProposer,
    MyVotesInfo,
    ProposalDetails,
  },
})
export default class DaoProposalVote extends Mixins(ProposalVoteMixin, PageRouteMixinFactory(routeValidator)) {

  proposalStateType = DaoProposalState

  get proposalStateClass(): string {
    if (!this.daoProposalDetail) {
      return 'proposal-status-failed'
    }
    if (this.proposalState === DaoProposalState.Active || this.proposalState === DaoProposalState.Created) {
      return 'proposal-status-active'
    }
    if (this.proposalState === DaoProposalState.Failed || this.proposalState === DaoProposalState.Defeated) {
      return 'proposal-status-failed'
    }
    if (this.proposalState === DaoProposalState.Succeeded
        || this.proposalState === DaoProposalState.Executed
        || this.proposalState === DaoProposalState.Expired
        || this.proposalState === DaoProposalState.Queued) {
      return 'proposal-status-success'
    }
    return 'proposal-status-failed'
  }

  get totalVotes(): number {
    return this.forVotes + this.againstVotes + this.cacheCurrentUserVotes
  }

  get statusBlocks() {
    let blocks = {
      created: 0,
      active: 0,
      end: 0,
      executed: 0
    }
    if (!this.daoProposalDetail) {
      return blocks
    }
    const startBlock = this.daoProposalDetail.startBlock as number
    const endBlock = this.daoProposalDetail.endBlock as number
    blocks = {
      created: startBlock,
      active: startBlock + 1,
      end: endBlock,
      executed: this.daoProposalDetail.executedBlockNumber as number
    }
    return blocks
  }

  onVoteForEvent() {
    this.voteSide = 'for'
    this.onVoteEvent()
  }

  onVoteAgainstEvent() {
    this.voteSide = 'against'
    this.onVoteEvent()
  }

  onToBack() {
    this.$router.push({ name: 'daoMain' })
  }
}
</script>

<style scoped lang="scss">
.dao-proposal-vote {
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
      font-size: 18px;
      font-weight: 700;
      color: var(--mc-text-color-white);
      margin-top: 25px;
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

    .history-button-box {
      margin-left: 88px;

      ::v-deep {
        .el-button {
          width: 100%;
        }
      }
    }
  }

  .proposal-details {
    padding-top: 32px;
  }
}
</style>

<style scoped lang="scss">
.dao-proposal-vote {
  width: 1440px;
  min-width: 1440px;
  margin: auto;
  display: flex;
  flex-direction: column;

  .base-card-frame {
    flex: 1;
  }

  ::v-deep .base-card-frame {
    .title {
      font-size: 14px;

      .el-breadcrumb__inner {
        color: var(--mc-text-color);
        font-weight: 400 !important;
        cursor: pointer;
      }
    }
    .content {
      padding: 30px;
      min-height: 970px;
    }
  }

  .back-item {
    color: var(--mc-text-color);
    font-size: 14px;
    font-weight: 400;
    cursor: pointer;
  }
}
</style>
