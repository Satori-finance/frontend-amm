<template>
  <div class="my-votes-info">
    <div class="info-panel">
      <div>
        <div>{{ $t('pool.poolProposal.myVotes') }}</div>
        <div class="value">
          {{ myVotes | bigNumberFormatter(votesDecimals) }} {{ $t('base.votes') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import BigNumber from 'bignumber.js'
import { ErrorHandlerMixin } from '@/mixins'
import { getLpGovernorContract } from '@mcdex/mai3.js'
import { namespace } from 'vuex-class'
import { Provider } from '@ethersproject/providers'
import { POOL_GOVERNOR_VOTES_DECIMALS } from '@/const'
import { POOL_GOVERNANCE_EVENT, VUE_EVENT_BUS } from '@/event'

const wallet = namespace('wallet')

@Component
export default class MyVotesInfo extends Mixins(ErrorHandlerMixin) {
  @Prop({ required: true }) voteAddress !: string
  @wallet.Getter('provider') provider !: Provider
  @wallet.Getter('address') userAddress !: string

  mounted() {
    VUE_EVENT_BUS.on(POOL_GOVERNANCE_EVENT.UpdateMyVotes, () => {
      this.onVoteAddressChanged()
    })
  }

  destroyed() {
    VUE_EVENT_BUS.off(POOL_GOVERNANCE_EVENT.UpdateMyVotes)
  }

  private balanceOf: BigNumber = new BigNumber(0)
  votesDecimals = POOL_GOVERNOR_VOTES_DECIMALS

  get myVotes(): BigNumber {
    return this.balanceOf
  }

  @Watch('voteAddress', { immediate: true })
  @Watch('userAddress', { immediate: true })
  @Watch('provider', { immediate: true })
  async onVoteAddressChanged() {
    await this.callChainReadFunc(async () => {
      if (!this.provider || !this.userAddress || this.userAddress === '' || this.voteAddress === '') {
        return
      }
      const lpGovernanceContract = getLpGovernorContract(this.voteAddress, this.provider)
      this.balanceOf = new BigNumber((await lpGovernanceContract.balanceOf(this.userAddress)).toString()).shiftedBy(-18)
    })
  }
}
</script>

<style scoped lang="scss">
@import "./governance.scss";
@import '~@mcdex/style/common/var';

.my-votes-info {
  display: flex;
  justify-content: flex-end;

  .info-panel {
    right: 0;
    height: 68px;
    min-width: 152px;
    background-color: rgba($--mc-background-color-dark, 0.6);
    border-radius: 8px;
    padding: 12px;
    font-size: 14px;
    font-weight: 400;
    color: var(--mc-text-color);
    text-align: center;

    .value {
      margin-top: 10px;
      color: var(--mc-text-color-white);
    }
  }
}
</style>
