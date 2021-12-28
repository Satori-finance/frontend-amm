<template>
  <div class="proposal-history-list">

    <div class="options-container">
      <div class="my-votes">
        <div class="value">{{ myVotes | bigNumberFormatter(votesDecimals) }} {{ $t('governance.votes') }}</div>
        <div class="text">{{ $t('dao.myVotes') }}</div>
      </div>
      <div class="button-box">
        <van-button class="info" :class="['round', 'middle']" @click="onClickAboutVotesButton">
          {{ $t('dao.about') }}
        </van-button>
        <van-button class="info" :class="['round', 'middle']" @click="onClickDelegateButton">
          {{ $t('dao.delegate') }}
        </van-button>
      </div>
    </div>

    <div class="proposal-list">
      <van-list
        v-model="listLoading"
        :finished="finishLoadAllProposal"
        :loading-text="$t('base.loading')+'...'"
        @load="onLoadData"
      >
        <div class="proposal-item" v-for="(item, index) in proposalList" :key="index" v-if="item"
             @click="toVotesPage(item.index)">
          <McMProposalCard :state="convertProposalState(item.state)" :index="item.index"
                           :end-timestamp="item.endTimestamp"
                           :title="item.description ? item.description.title.slice(0, 50) : ''"
                           :for-votes="item.for.toNumber()"
                           :against-votes="item.against.toNumber()"/>
        </div>

        <template slot="loading">
          <McLoadingIcon></McLoadingIcon>
        </template>
        <div slot='finished'>
          <span v-if="hideGOV">{{ $t('base.comingSoon') }}</span>
          <McMNoData v-else :label="$t('base.noMore')"></McMNoData>
        </div>
      </van-list>
    </div>

    <DelegatePopup :visible.sync="showDelegatePopup"/>
    <AboutVotesPopup :visible.sync="showAboutVotesPopup"/>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { McMNoData, McMProposalCard } from '@/mobile/components'
import { DaoProposalHistoryMixin, ProposalItem } from '@/template/components/DAO/daoProposalHistoryMixin'
import { ROUTE } from '@/mobile/router'
import DelegatePopup from '../Components/DelegatePopup.vue'
import AboutVotesPopup from '../Components/AboutVotesPopup.vue'
import { DaoProposalState } from '@/type'
import { SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/constants'
import { McLoadingIcon } from '@/components'

@Component({
  components: {
    McMProposalCard,
    DelegatePopup,
    McMNoData,
    AboutVotesPopup,
    McLoadingIcon,
  },
})
export default class ProposalHistoryList extends Mixins(DaoProposalHistoryMixin) {

  private hideGOV = TARGET_NETWORK_ID === SUPPORTED_NETWORK_ID.ARB
  private showDelegatePopup: boolean = false
  private showAboutVotesPopup: boolean = false
  private listLoading: boolean = false

  get proposalList(): ProposalItem[] {
    const result: any[] = []
    this.proposals.forEach(item => {
      result.push(this.convertProposal(item))
    })
    return result
  }

  convertProposalState(state: DaoProposalState): 'success' | 'fail' | 'voting' {
    if (state === DaoProposalState.Active) {
      return 'voting'
    }
    if (state === DaoProposalState.Failed || state === DaoProposalState.Defeated) {
      return 'fail'
    }
    if (state === DaoProposalState.Succeeded ||
      state === DaoProposalState.Executed ||
      state === DaoProposalState.Queued ||
      state === DaoProposalState.Expired) {
      return 'success'
    }
    return 'fail'
  }

  onClickDelegateButton() {
    this.showDelegatePopup = true
  }

  onClickAboutVotesButton() {
    this.showAboutVotesPopup = true
  }

  onClickStakeButton() {
    this.$router.push({ name: ROUTE.SATORI_STAKE })
  }

  toVotesPage(index: string) {
    this.$router.push({ name: 'daoProposalVote', params: { index: index } })
  }

  async onLoadData() {
    this.listLoading = true
    if (!this.loading && !this.finishLoadAllProposal) {
      this.pagination.currentPage += 1
      await this.load()
    }
    this.listLoading = false
  }
}
</script>

<style lang="scss" scoped>
.proposal-history-list {
  padding-top: 32px;
  height: 100%;

  .options-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    .value {
      font-size: 16px;
      line-height: 24px;
    }

    .text {
      font-size: 12px;
      line-height: 16px;
      color: var(--mc-text-color);
      margin-top: 4px;
    }

    .van-button {
      width: 101.5px;
      font-size: 16px;
      line-height: 22px;
    }

    .info {
      background: var(--mc-background-color);
      margin-right: 12px;

      &:last-child {
        margin-right: 0;
      }
    }
  }

  .proposal-list {
    height: calc(100% - 68px);
    overflow: scroll;

    .proposal-item {
      margin-bottom: 16px;
    }

    ::v-deep {
      .mc-loading-icon {
        justify-content: center;
      }

      .no-data {
        margin-top: 170px;
      }
    }
  }
}
</style>
