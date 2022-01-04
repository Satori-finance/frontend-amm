<template>
  <div class="pool-governance">
    <div class="justify-line governance-list-head">
      <div class="head-title">
        {{ $t('pool.poolInfo.governance') }}
        <span class="badge">{{ pagination.count }}</span>
      </div>
      <div class="right">
        <el-button size="mini" @click="toCreateProposalPage">{{
          $t('pool.poolInfo.governanceList.createProposal')
        }}</el-button>
      </div>
    </div>
    <div class="table-container">
      <McLoading :show-loading="loading" :min-show-time="300">
        <table class="mc-data-table mc-data-table--border">
          <tbody v-if="noData || loading" class="no-data">
            <tr>
              <td colspan="4">
                <McNoData v-if="noData && !loading" :label="$t('base.empty')"></McNoData>
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr v-for="(item, index) in tableBody" :key="index" @click="toProposalPage(item.index)">
              <template v-if="!item">
                <td colspan="100"></td>
              </template>
              <template v-else>
                <td>
                  <span class="status" :class="[getProposalColorClass(item.status)]">
                    {{ getProposalText(item.status) }}
                  </span>
                </td>
                <td>{{ `${$t('governance.proposal')}-${item.index}` }}</td>
                <td>{{ item.title }}</td>
                <td>
                  <span class="secondary-text">
                    {{ item.startTimestamp | timestampFormatter('lll') }}
                    ～
                    {{ item.endTimestamp | timestampFormatter('lll') }}
                  </span>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </McLoading>
      <div class="table-pagination">
        <el-pagination
          background
          layout="prev, pager, next"
          v-if="tableBody.length > 0"
          hide-on-single-page
          :page-size.sync="pagination.pageSize"
          :total="pagination.count"
          :current-page.sync="pagination.currentPage"
        >
        </el-pagination>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { McLoading, McNoData } from '@/components'
import { PoolBaseInfo } from '@/template/components/Pool/poolMixins'
import { queryPoolProposalList } from '@/api/pool'
import { Provider } from '@ethersproject/providers'
import { LiquidityPoolDirectoryItem, PoolProposal, PoolProposalState } from '@/type'
import { formatProposalIndex, getBlockTimestampFromList, parseLpProposalState } from '@/utils'
import debounceAsync from '@seregpie/debounce-async'
import * as _ from 'lodash'
import { PoolProposalMixin } from '@/template/components/Pool/poolProposalMixin'
import { getLpGovernorContract } from '@mcdex/mai3.js'
import { chainConfigs } from '@/config/chain'
import { queryTimeStampByBlockNumber } from '@/api/block'
import { L1_NETWORK_ID } from '@/const'
import { estimateBlockTime } from '@/utils/chain'

interface ProposalItem {
  status: PoolProposalState
  index: string
  title: string
  startTimestamp: number
  endTimestamp: number
}

const wallet = namespace('wallet')

@Component({
  components: {
    McNoData,
    McLoading,
  }
})
export default class PoolGovernance extends Mixins(PoolProposalMixin) {
  @Prop({ required: true }) poolBaseInfo !: PoolBaseInfo | null
  @Prop({ required: true }) liquidityPool !: LiquidityPoolDirectoryItem | null
  @wallet.Getter('provider') provider !: Provider
  @wallet.Getter('providerL1') providerL1 !: Provider

  private pagination = {
    count: 0,
    pageSize: 10,
    currentPage: 1,
  }

  private loading: boolean = false
  private currentBlockNumber: number = 0
  private proposals: PoolProposal[] = []
  private debounceProposals = debounceAsync(this.getProposals, 500)

  mounted() {
    this.load()
  }

  get offset() {
    return Math.max((this.pagination.currentPage - 1) * this.pagination.pageSize, 0)
  }

  get tableBody() {
    const result: any[] = []
    const currentPageData = _.slice(this.proposals, this.offset, this.offset + this.pagination.pageSize)
    currentPageData.forEach(item => {
      result.push(this.convertProposal(item))
    })
    return result
  }

  get noData(): boolean {
    return this.tableBody.length === 0
  }

  get voteAddress(): string {
    if (!this.poolBaseInfo) {
      return ''
    }
    return this.poolBaseInfo.voteAddress
  }

  convertProposal(data: PoolProposal | undefined): ProposalItem | undefined {
    if (data) {
      return {
        status: parseLpProposalState(data?.state || 0),
        index: formatProposalIndex(data.index as number, 3),
        title: this.getProposalTitle(this.liquidityPool, data.description, data.calldatas, data.signatures),
        startTimestamp: data.startTimestamp ? data.startTimestamp : estimateBlockTime(this.currentBlockNumber, data.startBlock as number),
        endTimestamp: data.endTimestamp ? data.endTimestamp : estimateBlockTime(this.currentBlockNumber, data.endBlock as number),
      }
    }
    return undefined
  }

  getProposalText(status: PoolProposalState): string {
    if (status === PoolProposalState.Active) {
      return this.$t('governance.active').toString()
    }
    if (status === PoolProposalState.Failed) {
      return this.$t('governance.failed').toString()
    }
    if (status === PoolProposalState.Succeeded ||
      status === PoolProposalState.Executed ||
      status === PoolProposalState.Queued ||
      status === PoolProposalState.Expired) {
      return this.$t('governance.succeeded').toString()
    }
    return this.$t('governance.created').toString()
  }

  getProposalColorClass(status: PoolProposalState): string {
    if (status === PoolProposalState.Active || status === PoolProposalState.Created) {
      return 'active-status'
    }
    if (status === PoolProposalState.Failed) {
      return 'failed-status'
    }
    if (status === PoolProposalState.Succeeded
      || status === PoolProposalState.Executed
      || status === PoolProposalState.Expired
      || status === PoolProposalState.Queued) {
      return 'succeeded-status'
    }
    return ''
  }

  async getLatestBlockNumber(): Promise<number> {
    return await this.providerL1.getBlockNumber()
  }

  @Watch('pagination.currentPage')
  onCurrentPageChange() {
    if (this.tableBody[0] === undefined) {
      this.load()
    }
  }

  @Watch('poolBaseInfo')
  @Watch('voteAddress', { immediate: true })
  @Watch('provider', { immediate: true })
  @Watch('providerL1', { immediate: true })
  onPoolChange() {
    this.load()
  }

  protected async load() {
    if (this.loading) {
      return
    }
    try {
      await this.debounceProposals()
    } catch (e) {
      console.warn(e)
    }
  }

  async getProposals() {
    if (this.voteAddress === '' || !this.provider) {
      return
    }
    if (!this.providerL1) {
      return
    }
    this.currentBlockNumber = await this.getLatestBlockNumber()

    this.loading = true
    try {
      const resultData = await this.callGraphApiFunc(() => {
        return queryPoolProposalList(this.voteAddress, this.offset, this.pagination.pageSize)
      })
      const lpGovernanceContract = getLpGovernorContract(this.voteAddress, this.provider)
      if (resultData && resultData.proposals.length > 0) {
        let proposals: PoolProposal[] = resultData.proposals
        const blockNumberArray = new Set<number>()
        proposals.forEach(item => {
          blockNumberArray.add(item.startBlock as number)
          blockNumberArray.add(item.endBlock as number)
        })
        await Promise.all(proposals.map(async i => {
          i.state = await lpGovernanceContract.state(Number(i.index))
        }))
        if (blockNumberArray.size > 0) {
          const timeStampRes = await this.callGraphApiFunc(() => {
            return queryTimeStampByBlockNumber(Array.from(blockNumberArray.values()), chainConfigs[L1_NETWORK_ID].subgraphConfig.blockSubgraph)
          })
          if (timeStampRes) {
            proposals = proposals.map((item) => {
              item.startTimestamp = getBlockTimestampFromList(timeStampRes.blockList, item.startBlock as number, this.currentBlockNumber)
              item.endTimestamp = getBlockTimestampFromList(timeStampRes.blockList, item.endBlock as number, this.currentBlockNumber)
              return item
            })
          }
        }
        const count = Number(proposals[0].governor.proposalCount)
        if (this.pagination.count === count) {
          this.proposals.splice(this.offset, proposals.length, ...proposals)
        } else {
          const data = new Array<PoolProposal>(count)
          data.splice(this.offset, proposals.length, ...proposals)
          this.pagination.count = count
          this.proposals = data
        }
      }
    } finally {
      this.loading = false
    }
  }

  toCreateProposalPage() {
    this.$router.push({ name: 'poolProposalCreate' })
  }

  toProposalPage(index: string) {
    this.$router.push({ name: 'poolProposalVote', params: { index } })
  }
}
</script>

<style scoped lang='scss'>
@import '../info.scss';
@import '~@mcdex/style/common/var';

.pool-governance {
  .governance-list-head {
    .right {
      ::v-deep .el-button {
        width: 121px;
      }
    }
  }

  .table-container {
    table {
      thead {
        th {
          width: 25%;
        }
      }

      tr {
        cursor: pointer;
      }

      th,
      td {
        font-size: 13px;
        font-weight: 400;
        padding: 13px 0;
        height: 50px;
      }

      .no-data {
        td {
          height: 300px;
        }
      }

      tbody {
        text-align: center;

        td:nth-of-type(1) {
          width: 9%;
          text-align: center;
        }

        td:nth-of-type(2) {
          text-align: center;
          width: 10%;
        }

        td:nth-of-type(3) {
          width: 49%;
          text-align: left;
        }

        td:nth-of-type(4) {
          width: 32%;
        }

        td {
          font-size: 16px;
          font-weight: 400;
          color: var(--mc-text-color-white);

          .status {
            display: inline-block;
            width: 78px;
            height: 24px;
            border-radius: 12px;
            line-height: 24px;
            text-align: center;
            font-size: 12px;
            color: var(--mc-text-color-white);
          }

          .secondary-text {
            font-size: 14px;
            color: var(--mc-text-color);
          }
        }
      }

      .failed-status {
        background: rgba($--mc-color-error, 0.6);
      }

      .active-status {
        background: rgba($--mc-color-warning, 0.6);
      }

      .succeeded-status {
        background: rgba($--mc-color-success, 0.6);
      }
    }

    .table-pagination {
      text-align: right;
      margin-top: 20px;

      ::v-deep .el-pagination {
        padding: unset;
      }
    }
  }
}
</style>
