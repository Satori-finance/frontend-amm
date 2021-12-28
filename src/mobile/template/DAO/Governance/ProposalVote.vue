<template>
  <div class="proposal-votes scroll-container">
    <BackNavBar :title="proposalHeaderTitle"></BackNavBar>
    <div class="container page-container">
      <div class="proposal-base-info-container">
        <div class="name">{{ proposalTitle }}</div>
        <div
          class="state"
          :class="[proposalStateClass]"
          v-if="proposalState !== proposalStateType.Active && proposalState !== proposalStateType.Created"
        >
          {{ proposalStateText }}
        </div>
        <div class="date">
          {{ $t('dao.governancePage.start') }}
          {{ startTimestamp | timestampFormatter(timestampFormatter) }}
          ～
          {{ $t('dao.governancePage.end') }}
          {{ endTimestamp | timestampFormatter(timestampFormatter) }}
        </div>
        <div class="proposer">
          {{ $t('governance.proposer') }}
          <span class="value">{{ proposerAddress | ellipsisMiddle }}</span>
        </div>
      </div>
      <div class="votes-panel-container">
        <McMVotesCardPanel
          :for-votes="forVotes"
          :against-votes="againstVotes"
          :my-votes="myVotes"
          :vote-decimals="votesDecimals"
          :vote-token="$t('governance.votes')"
          :vote-end="voteIsEnd"
          :my-votes-side="accountVotesSide"
          :voted="accountIsVoted"
          :my-voted-votes="accountVotedVotes"
          :voting-side="voteSide"
          :voting-button-state.sync="votingButtonState"
          @forVote="onVoteForEvent"
          @againstVote="onVoteAgainstEvent"
          :quorum-votes="quorumVotes"
          :account-votes="accountsVotes"
        />
      </div>
      <div class="proposal-details-container">
        <ProposalDetails
          :proposal-ipfs-store="proposalIPFSStore"
          :proposal-actions="proposalActions"
          :proposal-description="proposalDescription"
          :loading="loading"
        />
      </div>

      <div class="proposal-history-state">
        <div class="title-text-item">
          {{ $t('governance.proposalHistory') }}
        </div>
        <div class="content">
          <ProposalHistoryState
            :current-status="proposalState"
            :status-blocks="statusBlocks"
            :current-block="currentBlockNumber"
            :eta-timestamp="etaTimestamp"
          />
          <div class="history-button-box" v-if="isShowQueueButton">
            <van-button @click="onRunQueueEvent" :disabled="queuing">
              {{ $t('governance.queue') }}
              <i class="iconfont icon-loading-bold" v-if="queuing"></i>
            </van-button>
          </div>
          <div class="history-button-box" v-if="isShowExecuteButton">
            <van-button @click="onRunExecuteEvent" :disabled="executing">
              {{ $t('governance.execute') }}
              <i class="iconfont icon-loading-bold" v-if="executing"></i>
            </van-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { ProposalVoteMixin } from '@/template/components/DAO/ProposalVoteMixin'
import BackNavBar from '@/mobile/template/Header/BackNavBar.vue'
import ProposalDetails from './ProposalDetails.vue'
import { McMVotesCardPanel } from '@/mobile/components'
import { getBlockTimestampFromList, toBigNumber } from '@/utils'
import { DaoProposalState } from '@/type'
import ProposalHistoryState from '@/mobile/template/DAO/Governance/ProposalHistoryState.vue'

@Component({
  components: {
    ProposalHistoryState,
    BackNavBar,
    ProposalDetails,
    McMVotesCardPanel
  }
})
export default class ProposalVote extends Mixins(ProposalVoteMixin) {

  proposalStateType = DaoProposalState

  private timestampFormatter: string = 'MM/DD/YYYY HH:mm' // ui custom timestamp format

  get proposalHeaderTitle(): string {
    return `${this.$t('governance.proposal').toString()}-${this.proposalIndex}`
  }

  get startTimestamp(): number {
    if (!this.daoProposalDetail) {
      return 0
    }
    return getBlockTimestampFromList(
      this.blocksTimestamp,
      this.daoProposalDetail.startBlock as number,
      this.currentBlockNumber
    )
  }

  get endTimestamp(): number {
    if (!this.daoProposalDetail) {
      return 0
    }
    return getBlockTimestampFromList(
      this.blocksTimestamp,
      this.daoProposalDetail.endBlock as number,
      this.currentBlockNumber
    )
  }

  get proposalStateClass(): string {
    if (!this.daoProposalDetail) {
      return 'success'
    }
    if (this.proposalState === DaoProposalState.Active || this.proposalState === DaoProposalState.Created) {
      return 'success'
    }
    if (this.proposalState === DaoProposalState.Failed || this.proposalState === DaoProposalState.Defeated) {
      return 'fail'
    }
    if (this.proposalState === DaoProposalState.Succeeded
      || this.proposalState === DaoProposalState.Executed
      || this.proposalState === DaoProposalState.Expired
      || this.proposalState === DaoProposalState.Queued) {
      return 'success'
    }
    return 'success'
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

}
</script>

<style lang="scss" scoped>
@import '~@mcdex/style/common/var';

.proposal-votes {
  .container {
    padding: 16px;

    .proposal-base-info-container {
      .name {
        font-size: 20px;
        font-weight: 700;
        color: var(--mc-text-color-white);
        margin-bottom: 8px;
      }

      .state {
        font-size: 12px;
        width: 75px;
        height: 22px;
        line-height: 22px;
        border-radius: 8px;
        margin-bottom: 8px;
        text-align: center;

        &.success {
          color: var(--mc-color-success);
          background: rgba($--mc-color-success, 0.2);
        }

        &.fail {
          color: var(--mc-color-error);
          background: rgba($--mc-color-error, 0.2);
        }
      }

      .date {
        font-size: 14px;
        color: var(--mc-text-color);
        margin-bottom: 4px;
      }

      .proposer {
        font-size: 14px;
        color: var(--mc-text-color-white);
        .value {
          display: inline-block;
          margin-left: 4px;
          color: var(--mc-text-color);
        }
      }
    }

    .votes-panel-container {
      margin-top: 16px;
    }

    .proposal-details-container {
      margin-top: 32px;
    }

    .proposal-history-state {
      margin-top: 32px;
      .title-text-item {
        font-size: 20px;
        font-weight: 700;
        color: var(--mc-text-color-white);
        margin-bottom: 16px;
      }

      .content {
        padding: 16px;
        width: 100%;
        border-radius: 12px;
        background: var(--mc-background-color);

        .history-button-box {
          ::v-deep.van-button {
            width: 100%;
            height: 56px;
            border-radius: 12px;
            font-size: 16px;
            background: var(--mc-color-primary);
          }
        }
      }
    }
  }
}
</style>
