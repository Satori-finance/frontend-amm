<template>
  <div class="governance">
    <div class="panel-item-header">
      <span class="title">{{ $t('dao.daoGovernance') }}</span>
      <div class="right" v-if="!hideGOV">
        <div class="text-item">
          {{ $t('dao.myVotes') }}: <span class="value"> {{
            myVotes | bigNumberFormatter(votesDecimals) }} {{ $t('governance.votes') }}</span>
          <el-tooltip placement="top" popper-class="title-tooltip" :open-delay="400">
            <div slot="content"><span v-html="$t('dao.governancePage.myVotePrompt')"></span></div>
            <div class="tooltip-box">
              <svg class="svg-icon" aria-hidden="true">
                <use :xlink:href="`#icon-help`"></use>
              </svg>
            </div>
          </el-tooltip>
        </div>
<!--        <div class="button-item">-->
<!--          <el-button size="mini" type="secondary" @click="showStakeDialog = true">-->
<!--            {{ $t('dao.governancePage.stakeMcb') }}-->
<!--          </el-button>-->
<!--        </div>-->
        <div class="button-item">
          <el-button size="mini" type="secondary" @click="showDelegationDialog = true">
            {{ $t('dao.delegation') }}
          </el-button>
        </div>
        <div class="button-item">
          <el-button size="mini" type="secondary" @click="toCreateProposalPage">
            {{ $t('dao.createProposal') }}
          </el-button>
        </div>
      </div>
    </div>
    <div class="table-container">
      <table class="mc-data-table">
        <thead>
          <tr>
            <th class="is-left">{{ $t('governance.proposalNumber') }}</th>
            <th class="is-left">{{ $t('governance.title') }}</th>
            <th class="is-left">{{ $t('base.status') }}</th>
            <th class="is-left">{{ $t('governance.endTime') }}</th>
          </tr>
        </thead>
          <tbody v-if="noData || loading">
            <tr>
              <th colspan="4" class="empty-table">
                <div v-if="hideGOV" class="coming-soon">
                  <img src="@/assets/img/poolComingSoon.svg" alt="" />
                  <div>{{ $t('base.comingSoon') }}</div>
                </div>
                <McNoData v-else-if="noData && !loading" />
                <McLoading v-else :show-loading="loading" :show-loading-text="$t('base.loading')" />
              </th>
            </tr>
          </tbody>
          <tbody v-else>
            <tr  v-for="(item, index) in proposalList" :key="index" @click="toProposalPage(item.index)">
              <td class="is-left">{{ item.index }}</td>
              <td class="is-left">{{ item.description ? item.description.title.slice(0, 50) : '' }}</td>
              <td class="is-left">
                <span class="state-item" :class="[`${getProposalText(item.state).toLowerCase()}-state`]">
                  {{ getProposalText(item.state) }}</span>
              </td>
              <td class="is-left">{{ item.endTimestamp | timestampFormatter('lll') }}</td>
            </tr>
          </tbody>
      </table>
      <div class="table-pagination" v-if="proposalList.length > 0 && pagination.count/pagination.pageSize > 1">
        <McPagination :current-page.sync="pagination.currentPage" :total="pagination.count" :page-size="pagination.pageSize" />
      </div>
    </div>
    <DelegationDialog :visible.sync="showDelegationDialog" />
    <StakeDialog :visible.sync="showStakeDialog" />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import { McLoading, McNoData, McPagination } from '@/components'
import DelegationDialog from '../Components/DelegationDialog.vue'
import StakeDialog from '../Components/StakeDialog.vue'
import { DaoProposalHistoryMixin, ProposalItem } from '@/template/components/DAO/daoProposalHistoryMixin'
import { DaoProposalState } from '@/type'
import * as _ from 'lodash'
import { SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/const'

@Component({
  components: {
    McNoData,
    McLoading,
    DelegationDialog,
    StakeDialog,
    McPagination,
  },
})
export default class ProposalHistoryList extends Mixins(DaoProposalHistoryMixin) {
  private showDelegationDialog: boolean = false
  private showStakeDialog: boolean = false
  private hideGOV = TARGET_NETWORK_ID === SUPPORTED_NETWORK_ID.ARB || TARGET_NETWORK_ID === SUPPORTED_NETWORK_ID.BSC

  mounted() {
    this.load()
  }

  get noData(): boolean {
    return this.proposalList.length === 0
  }

  get proposalList(): ProposalItem[] {
    const result: any[] = []
    const currentPageData = _.slice(this.proposals, this.offset, this.offset + this.pagination.pageSize)
    currentPageData.forEach((item) => {
      result.push(this.convertProposal(item))
    })
    return result
  }

  getProposalText(state: DaoProposalState): string {
    if (state === DaoProposalState.Active) {
      return this.$t('governance.voting').toString()
    }
    if (state === DaoProposalState.Failed || state === DaoProposalState.Defeated) {
      return this.$t('governance.failed').toString()
    }
    if (
      state === DaoProposalState.Succeeded ||
      state === DaoProposalState.Executed ||
      state === DaoProposalState.Queued ||
      state === DaoProposalState.Expired
    ) {
      return this.$t('governance.succeeded').toString()
    }
    return this.$t('governance.created').toString()
  }

  getProposalColorClass(state: DaoProposalState): string {
    if (state === DaoProposalState.Active || state === DaoProposalState.Created) {
      return 'active-status'
    }
    if (state === DaoProposalState.Failed || state === DaoProposalState.Defeated) {
      return 'failed-status'
    }
    if (
      state === DaoProposalState.Succeeded ||
      state === DaoProposalState.Executed ||
      state === DaoProposalState.Expired ||
      state === DaoProposalState.Queued
    ) {
      return 'succeeded-status'
    }
    return ''
  }

  @Watch('pagination.currentPage')
  onCurrentPageChange() {
    this.load()
  }

  toCreateProposalPage() {
    this.$router.push({ name: 'daoProposalCreate' })
  }

  toProposalPage(index: string) {
    this.$router.push({ name: 'daoProposalVote', params: { index } })
  }
}
</script>

<style scoped lang="scss">
@import '../DaoInfo/info';
@import '~@mcdex/style/common/fantasy-var';

.governance {
  min-height: 510px;

  .panel-item-header {
    .right {
      display: flex;
      align-items: center;
      .text-item {
        display: flex;
        align-items: center;
        height: 28px;
        line-height: 28px;
        font-size: 16px;
        color: var(--mc-text-color);
        font-weight: 400;
        margin-right: 1.5px;

        .value {
          color: var(--mc-text-color-white);
          margin-left: 4px;
        }
      }

      .button-item {
        display: inline-block;
        margin-left: 12px;

        .el-button {
          width: 162px;
          height: 44px;
          font-size: 16px;
          border-radius: var(--mc-border-radius-l);
          background: var(--mc-background-color);

          &:hover {
            background: var(--mc-background-color-light);
          }
        }
      }
    }
  }

  .table-container {
    table {
      width: 100%;
      border: 1px solid var(--mc-border-color);
      border-radius: 12px;
      border-collapse: collapse;
      border-style:hidden;
      box-shadow: 0 0 0 1px var(--mc-border-color);
      overflow: hidden;
      font-size: 14px;

      th, td {
        padding-left: 16px;
        font-size: 14px;
      }

      th:nth-child(1), td:nth-child(1) {
        width: 160px;
      }

      th:nth-child(2), td:nth-child(2) {
        width: 560px;
      }

      th:nth-child(3), td:nth-child(3) {
        width: 240px;
      }

      th:nth-child(4), td:nth-child(4) {
        width: auto;
      }

      thead {
        background: var(--mc-background-color-darkest);
        font-size: 14px;
        border-bottom: 1px solid var(--mc-border-color);

        tr {
          height: 50px;
        }
      }

      tbody {
        background: var(--mc-background-color-dark);
        tr {
          cursor: pointer;
          height: 72px;
          border-bottom: 1px solid var(--mc-border-color);
        }
      }

      .flex-line {
        display: flex;
        align-items: center;
      }

      .empty-table {
        height: 72*10px;
        background: var(--mc-background-color-dark);

        .coming-soon {
          color: var(--mc-text-color);
          font-size: 14px;
          line-height: 20px;
        }
      }
    }

    .text-item {
      line-height: 20px;
    }

    .table-pagination {
      margin-top: 24px;
    }
  }

  .state-item {
    width: 85px;
    height: 28px;
    display: inline-block;
    line-height: 28px;
    border-radius: var(--mc-border-radius-m);
    text-align: center;
  }

  .voting-state, .created-state {
    color: var(--mc-color-warning);
    background: rgba($--mc-color-warning, 0.1);
    border: 1px solid rgba($--mc-color-warning, 0.1);
  }

  .failed-state {
    color: var(--mc-color-error);
    background: rgba($--mc-color-error, 0.1);
    border: 1px solid rgba($--mc-color-error, 0.1);
  }

  .succeeded-state {
    color: var(--mc-color-success);
    background: rgba($--mc-color-success, 0.1);
    border: 1px solid rgba($--mc-color-success, 0.1);
  }
}
</style>
