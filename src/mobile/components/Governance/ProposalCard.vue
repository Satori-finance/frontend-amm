<template>
  <div class="proposal-card">
    <div class="id-line space-between-line">
      <div class="name">
        {{ `${$t('governance.proposal')}-${index}` }}
      </div>
      <div class="button" v-if="state === 'voting'">{{ $t('governance.vote') }}</div>
      <i class="iconfont icon-right2" v-else></i>
    </div>
    <div class="title-line">
      {{ title }}
    </div>
    <div class="time-state-line">
      <span class="state" :class="{'success': state === 'success', 'fail': state === 'fail', 'voting': state === 'voting'}"
            v-if="state === 'fail' || state === 'success' || state === 'voting'">
        {{ stateText }}
      </span>
      <span class="time">
        {{ $t('governance.endDate') }} {{ endTimestamp | timestampFormatter('lll') }}
      </span>
    </div>
    <div class="progress-line" v-if="state === 'voting'">
      <VotesProgress :for-votes="forVotes" :against-votes="againstVotes" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import VotesProgress from './VotesProgress.vue'

@Component({
  components: {
    VotesProgress,
  }
})
export default class ProposalCard extends Vue {
  @Prop({ required: true }) state !: 'success' | 'fail' | 'voting'
  @Prop({ required: true }) index !: string
  @Prop({ required: true }) title !: string
  @Prop({ required: true }) endTimestamp !: number
  @Prop({ default: 0 }) forVotes !: number
  @Prop({ default: 0 }) againstVotes !: number

  get stateText(): string {
    if (this.state === 'success') {
      return this.$t('governance.succeeded').toString()
    }
    if (this.state === 'fail') {
      return this.$t('governance.failed').toString()
    }
    return this.$t('governance.created').toString()
  }
}
</script>

<style lang="scss" scoped>
@import '~@mcdex/style/common/var';

.proposal-card {
  border-radius: 12px;
  background-color: var(--mc-background-color-dark);
  min-height: 108px;
  width: 100%;
  padding: 16px;
  border: 1px solid var(--mc-border-color);

  .space-between-line {
    display: flex;
    justify-content: space-between;
  }

  .id-line {
    .name {
      font-size: 14px;
      line-height: 20px;
      color: var(--mc-text-color);
    }

    .button {
      width: 59px;
      height: 28px;
      line-height: 28px;
      text-align: center;
      border-radius: 8px;
      background: var(--mc-color-blue-gradient);
      font-size: 14px;
      color: var(--mc-text-color-white);
    }

    .icon-right2 {
      font-size: 16px;
      color: var(--mc-text-color-dark);
    }
  }

  .title-line {
    margin-top: 12px;
    line-height: 19px;
  }

  .time-state-line {
    margin-top: 12px;
    color: var(--mc-text-color-white);
    display: flex;
    align-items: center;

    .time {
      display: inline-block;
      font-size: 12px;
      line-height: 16px;
      color: var(--mc-text-color);
    }

    .state {
      display: inline-block;
      font-size: 12px;
      margin-right: 16px;
      width: 75px;
      height: 22px;
      line-height: 22px;
      border-radius: 8px;
      text-align: center;


      &.success {
        color: var(--mc-color-success);
        background: rgba($--mc-color-success, 0.1);
        border: 1px solid rgba($--mc-color-success, 0.1);
      }

      &.fail {
        color: var(--mc-color-error);
        background: rgba($--mc-color-error, 0.1);
        border: 1px solid rgba($--mc-color-error, 0.1);
      }

      &.voting {
        color: var(--mc-color-warning);
        background: rgba($--mc-color-warning, 0.1);
        border: 1px solid rgba($--mc-color-warning, 0.1);
      }
    }
  }

  .time-line {
    margin-top: 8px;
  }

  .progress-line {
    margin-top: 12px;
  }
}
</style>
