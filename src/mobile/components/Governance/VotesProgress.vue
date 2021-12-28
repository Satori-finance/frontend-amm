<template>
  <div class="votes-progress">
    <div class="label-line space-between-line">
      <div>{{ $t('governance.for') }}</div>
      <div>{{ $t('governance.against') }}</div>
    </div>
    <div class="progress-bar-line space-between-line">
      <div class="bar" :class="{'for-bar': forBarWidth !== 100, 'all-for-bar': forBarWidth === 100 }"
           :style="{ width: `${forBarWidth}%`}"></div>
      <div class="bar" :class="{'against-bar': againstBarWidth !== 100, 'all-against-bar': againstBarWidth === 100}"
           :style="{ width: `${againstBarWidth}%`}"></div>
    </div>
    <div class="proportion-line space-between-line">
      <div>{{ forProportion | bigNumberFormatter(2) }}%</div>
      <div>{{ againstProportion | bigNumberFormatter(2) }}%</div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import BigNumber from 'bignumber.js';
import { toBigNumber } from '@/utils';

@Component
export default class VotesProgress extends Vue {
  @Prop({ default: 0 }) forVotes !: number
  @Prop({ default: 0 }) againstVotes !: number

  get totalVote(): BigNumber {
    return toBigNumber(this.forVotes).plus(this.againstVotes)
  }

  get forProportion(): BigNumber {
    if (this.totalVote.isZero()) {
      return toBigNumber(0)
    }
    if (this.forVotes === 0) {
      return toBigNumber(0)
    }
    return toBigNumber(this.forVotes).div(this.totalVote).times(100)
  }

  get againstProportion(): BigNumber {
    if (this.totalVote.isZero()) {
      return toBigNumber(0)
    }
    if (this.againstVotes === 0) {
      return toBigNumber(0)
    }
    return toBigNumber(this.againstVotes).div(this.totalVote).times(100)
  }

  get forBarWidth(): number {
    if (this.totalVote.isZero()) {
      return 50
    }
    if (this.forProportion.isZero()) {
      return 0
    }
    return this.forProportion.toNumber()
  }

  get againstBarWidth(): number {
    if (this.totalVote.isZero()) {
      return 50
    }
    if (this.againstProportion.isZero()) {
      return 0
    }
    return this.againstProportion.toNumber()
  }
}
</script>

<style lang="scss" scoped>
@import '~@mcdex/style/common/var';

.votes-progress {
  .space-between-line {
    display: flex;
    justify-content: space-between;
  }

  .label-line {
    margin-bottom: 8px;
    font-size: 14px;
    color: var(--mc-text-color-white);
  }

  .progress-bar-line {
    margin-bottom: 8px;

    .bar {
      height: 6px;
    }

    .for-bar {
      width: 50%;
      background: var(--mc-color-success-gradient);
      background: linear-gradient(-45deg, transparent 4px, $--mc-color-success 0);
      border-radius: 3px 0 0 3px;
    }

    .all-for-bar {
      width: 100%;
      background: var(--mc-color-success-gradient);
      border-radius: 3px;
    }

    .against-bar {
      width: 50%;
      background: var(--mc-color-error-gradient);
      background: linear-gradient(135deg, transparent 4px, $--mc-color-error 0);
      border-radius: 0 3px 3px 0;
    }

    .all-against-bar {
      width: 100%;
      background: var(--mc-color-error-gradient);
      border-radius: 3px;
    }
  }

  .proportion-line {
    font-size: 14px;
    color: var(--mc-text-color-white);
  }
}
</style>
