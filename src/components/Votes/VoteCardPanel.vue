<template>
  <div class="vote-card-panel">
    <div class="card-body">
      <div class="vote-card-title-item">
        <span>{{ cardTitle }}</span>
        <span>{{ countVoteNumber | bigNumberFormatter(votesDecimals) }} {{ voteTokenName!==''?voteTokenName:$t('governance.votes') }}</span>
      </div>
      <div :class="['vote-card-progress', progressColor]">
        <el-progress :percentage="percentage" :show-text="false"></el-progress>
      </div>
      <div class="vote-status-info">
        <span>{{ countVoteAccountNumber | bigNumberFormatter(0) }} {{ $t('governance.address') }}</span>
        <span>{{ voteTokenName!==''?voteTokenName:$t('governance.votes') }}</span>
      </div>
      <div class="account-vote-list">
        <div class="account-vote-item" v-for="item in accountVotesList" :key="item.address">
          <span class="account-vote-item-content">
            <span>{{ item.address | ellipsisMiddle }}</span>
            <span>{{ item.vote | bigNumberFormatter(votesDecimals) }} {{ voteTokenName!==''?voteTokenName:$t('governance.votes') }}</span>
          </span>

        </div>
      </div>
    </div>
    <div class="card-footer" :class="{'success-button': buttonType==='success'}">
      <el-button :type="buttonType" size="medium" round :disabled="voting || accountIsVoted || myVotes === 0"
                 v-if="isShowVoteButton"
                 @click="onToVoteEvent">
        {{ cardTitle }}
        <i v-if="voting && voteSide === currentVoteSide" class="el-icon-loading"></i>
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

@Component
export default class VoteCardPanel extends Vue {
  @Prop({ required: true }) voteSide !: 'for' | 'against'
  @Prop({ required: false, default: 0 }) myVotes !: number
  @Prop({ required: true }) needVotes !: number
  @Prop({ required: true }) isStartVote !: boolean
  @Prop({ required: true }) accountVotesList!: Array<{ address: string, vote: number }>
  @Prop({ default: true }) voteEnd!: boolean
  @Prop({ required: true }) accountIsVoted !: boolean
  @Prop( { default: '' }) voteTokenName !: string
  @Prop({ default: false }) voting !: boolean
  @Prop({ default: 0 }) votesDecimals !: number
  @Prop({ default: '' }) currentVoteSide!: 'for' | 'against' | ''
  // button call function  @toVote

  get cardTitle(): string {
    if (this.voteSide === 'for') {
      return this.$t('governance.for').toString()
    } else {
      return this.$t('governance.against').toString()
    }
  }

  get isShowVoteButton(): boolean {
    if (this.voteEnd) {
      return false
    }
    if (!this.isStartVote) {
      return false
    }
    if (this.accountIsVoted) {
      return false
    }
    return true
  }

  get percentage(): number {
    if (this.needVotes === 0 || this.countVoteNumber === 0) {
      return 0
    }
    if (this.accountVotesList.length === 0) {
      return 0
    }
    const p = this.countVoteNumber / this.needVotes * 100
    if (p >= 100) return 100
    return p
  }

  get countVoteNumber(): number {
    let count: number = 0
    this.accountVotesList.forEach((val) => {
      count += val.vote
    })
    return count
  }

  get countVoteAccountNumber(): number {
    return this.accountVotesList.length
  }

  get progressColor(): string {
    if (this.voteSide === 'for') {
      return 'for-progress-bg'
    } else {
      return 'against-progress-bg'
    }
  }

  get buttonType(): string {
    if (this.voteSide === 'for') {
      return 'success'
    }
    if (this.voteSide === 'against') {
      return 'danger'
    }
    return ''
  }

  onToVoteEvent() {
    this.$emit('toVote')
  }
}
</script>

<style lang="scss" scoped>
.vote-card-panel {
  width: 384px;
  height: 366px;

  .card-body {
    height: calc(100% - 32px);
    background-color: var(--mc-text-color-white);
    border-radius: 8px;
    padding: 20px;

    .vote-card-title-item {
      display: flex;
      justify-content: space-between;
      font-size: 18px;
      font-weight: 700;
      color: var(--mc-border-color-darkest);
    }

    .vote-card-progress {
      margin-top: 18px;
      text-align: center;

      ::v-deep .el-progress-bar__outer {
        height: 4px !important;
        /* public style undefined */
        background-color: #E4E4E4;
      }
    }

    .for-progress-bg {
      ::v-deep .el-progress-bar__inner {
        background-color: var(--mc-color-success);
      }
    }

    .against-progress-bg {
      ::v-deep .el-progress-bar__inner {
        background-color: var(--mc-color-error);
      }
    }

    .vote-status-info {
      margin-top: 28px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      font-size: 16px;
      font-weight: 400;
      color: var(--mc-border-color-darkest);
    }

    .account-vote-list::-webkit-scrollbar-thumb {
      background: #E4E4E4;
    }

    .account-vote-list {
      overflow-y: auto;
      height: 192px;

      .account-vote-item {
        /* public style undefined */
        border-top: 1px solid #C4C4C4;
        .account-vote-item-content {
          display: flex;
          justify-content: space-between;
          font-size: 16px;
          font-weight: 400;
          height: 46px;
          line-height: 46px;
          color: var(--mc-border-color-darkest);
        }
      }
    }
  }

  .success-button {
    ::v-deep {
      .el-button {
        background: var(--mc-color-blue-gradient);
      }
    }
  }

  .card-footer {
    text-align: center;
    margin-top: 20px;

    .el-button--medium {
      width: 120px;
    }
  }
}
</style>
