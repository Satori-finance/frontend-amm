<template>
  <div class="votes-card-panel">
    <div class="progress-container">
      <VotesProgress :for-votes="forVotes" :against-votes="againstVotes" />
    </div>
    <div class="votes-button-container" v-if="!voteEnd && !voted">
      <StateButton class="button-item" :button-class="['round', 'large', 'success']" :key="'for'"
                   :state.sync="forButtonState" :disabled="votingButtonState === 'loading' || myVotedVotes === 0"
                   @click="onForClickEvent"  >
        {{ $t('governance.for') }}
      </StateButton>
      <StateButton class="button-item" :button-class="['round', 'large', 'error']" :key="'against'"
                   :state.sync="againstButtonState" :disabled="votingButtonState === 'loading' || myVotedVotes === 0"
                   @click="onAgainstClickEvent">
        {{ $t('governance.against') }}
      </StateButton>
    </div>
    <div class="info-line">
      <span class="label">{{ $t('governance.votesThreshold') }}</span>
      <span>{{ quorumVotes | bigNumberFormatter(voteDecimals) }} {{ voteToken }}</span>
    </div>
    <div class="info-line">
      <span class="label">{{ $t('governance.totalVotes') }}</span>
      <span>{{ totalVotes | bigNumberFormatter(voteDecimals) }} {{ voteToken }}</span>
    </div>
    <div class="info-line" v-if="isConnectedWallet && ((voteEnd && voted) || (!voteEnd))">
      <span class="label">{{ $t('dao.myVotes') }}</span>
      <span>
        <span v-if="!voted" class="no-votes">
          {{ $t('dao.notYetVoted') }}
          <span class="value">({{ myVotes | bigNumberFormatter(voteDecimals) }}</span>
        </span>
        <span v-if="voted && myVotesSide === 'for'" class="for">
          {{ $t('governance.for') }}
          <span class="value">({{ myVotedVotes | bigNumberFormatter(voteDecimals) }}</span>
        </span>
        <span v-if="voted && myVotesSide === 'against'" class="against">
          {{ $t('governance.against') }}
          <span class="value">({{ myVotedVotes | bigNumberFormatter(voteDecimals) }}</span>
        </span>
        {{ voteToken }})
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import VotesProgress from './VotesProgress.vue'
import StateButton from '../StateButton.vue'
import { ButtonState } from '@/type'
import { namespace } from 'vuex-class'

const wallet = namespace('wallet')

@Component({
  components: {
    VotesProgress,
    StateButton,
  }
})
export default class VotesCardPanel extends Vue {
  @Prop({ required: true }) voteEnd !: boolean
  @Prop({ required: true }) voted !: boolean
  @Prop({ default: 'for' }) votingSide !: 'for' | 'against'
  @Prop({ default: '' }) votingButtonState !: ButtonState
  @Prop({ default: '' }) voteToken !: string
  @Prop({ default: 0 }) voteDecimals !: number
  @Prop({ default: 0 }) myVotedVotes !: number
  @Prop({ default: 0 }) myVotes !: number
  @Prop({ default: '' }) myVotesSide !: 'for' | 'against' | ''
  @Prop({ default: 0 }) forVotes !: number
  @Prop({ default: 0 }) againstVotes !: number
  @Prop({ default: 0 }) quorumVotes !: number
  @wallet.Getter('isConnectedWallet') isConnectedWallet!: boolean

  // bind function: forVote/againstVote, on click vote button callback

  get forButtonState(): ButtonState {
    if (this.votingSide === 'for') {
      return this.votingButtonState
    }
    return ''
  }

  get totalVotes(): number {
    return this.forVotes + this.againstVotes
  }

  set forButtonState(state: ButtonState) {
    this.$emit('update:votingButtonState', state)
  }

  get againstButtonState(): ButtonState {
    if (this.votingSide === 'against') {
      return this.votingButtonState
    }
    return ''
  }

  set againstButtonState(state: ButtonState) {
    this.$emit('update:votingButtonState', state)
  }

  onForClickEvent() {
    this.$emit('forVote')
  }

  onAgainstClickEvent() {
    this.$emit('againstVote')
  }
}
</script>

<style lang="scss" scoped>
.votes-card-panel {
  min-height: 86px;
  border-radius: 16px;
  background: var(--mc-background-color);
  padding: 16px;

  .progress-container {}

  .votes-button-container {
    margin-top: 16px;
    display: flex;
    justify-content: space-between;

    .button-item {
      &:first-child {
        margin-right: 8px;
      }
    }
  }

  .info-line {
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
    font-size: 14px;

    &:first-child {
      margin-top: 24px;
    }

    .label {
      color: var(--mc-text-color);
    }

    .value {
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
}
</style>
