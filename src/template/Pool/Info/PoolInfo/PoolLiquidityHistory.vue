<template>
  <div class="pool-liquidity-history">
    <span class="head-title">{{ $t('pool.poolInfo.addRemove') }}</span>
    <McLoading :show-loading="loading" :min-show-time="300">
      <div class="table-container">
        <table class="mc-data-table mc-data-table--border">
          <thead>
          <tr>
            <th class="is-left">{{ $t('pool.poolInfo.liquidityHistory.time') }}</th>
            <th class="is-left">{{ $t('pool.poolInfo.liquidityHistory.type') }}</th>
            <th class="is-left">{{ $t('pool.poolInfo.liquidityHistory.collateral') }}</th>
            <th class="is-right">{{ $t('pool.poolInfo.liquidityHistory.account') }}</th>
          </tr>
          </thead>
          <tbody :class="{'no-data': noData}">
          <tr v-if="noData">
            <td colspan="4">
              <McNoData :label="$t('base.empty')"></McNoData>
            </td>
          </tr>
          <tr v-for="(item, index) in tableBody" :key="index">
            <template v-if="!item">
              <td colspan="100"></td>
            </template>
            <template v-else>
              <td class="is-left">{{ item.timestamp.local() / 1000 | timestampFormatter('lll') }}</td>
              <td :class="[getTypeColor(item.type)]" class="is-left">{{ getTypeText(item.type) }}</td>
              <td class="is-left">{{ item.amount.abs() | bigNumberFormatter(collateralDecimals) }} {{
                  collateralSymbol
                }}
              </td>
              <td class="is-right">
                {{ item.trader | ellipsisMiddle }}
                <el-link class="icon" :underline="false" target="_blank"
                         :href="item.transactionHash | etherBrowserTxFormatter">
                  <i class="iconfont icon-transmit"></i>
                </el-link>
              </td>
            </template>
          </tr>
          </tbody>
        </table>
        <div class="table-pagination">
          <McPagination v-if="tableBody.length>0"
                        :page-size.sync="pagination.pageSize"
                        :total="pagination.count"
                        :current-page.sync="pagination.currentPage">
          </McPagination>
        </div>
      </div>
    </McLoading>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import { McLoading, McNoData, McPagination } from '@/components'
import BigNumber from 'bignumber.js'
import { LiquidityPoolDirectoryItem, PerpetualProperty, PoolLiquidityHistory as LiquidityHistory } from '@/type'
import { PoolBaseInfo } from '@/template/components/Pool/poolMixins'
import { ErrorHandlerMixin } from '@/mixins'
import { queryPoolLiquidityHistoryList } from '@/api/pool'
import { toBigNumber } from '@/utils'
import moment from 'moment'
import debounceAsync from '@seregpie/debounce-async'
import * as _ from 'lodash'

enum liquidityType {
  AddLiquidity = 0,
  RemoveLiquidity = 1
}

interface HistoryTable {
  timestamp: moment.Moment
  type: liquidityType
  amount: BigNumber
  trader: string
  transactionHash: string
}

@Component({
  components: {
    McNoData,
    McLoading,
    McPagination,
  },
})
export default class PoolLiquidityHistory extends Mixins(ErrorHandlerMixin) {
  @Prop({ required: true }) poolBaseInfo !: PoolBaseInfo | null
  @Prop({ required: true }) liquidityPool !: LiquidityPoolDirectoryItem | null
  @Prop({ required: true }) perpetualProperty !: PerpetualProperty | null

  mounted() {
    this.load()
  }

  private pagination = {
    count: 0,
    pageSize: 10,
    currentPage: 1,
  }

  private loading: boolean = false
  private liquidityList: LiquidityHistory[] = []
  private debounceGetLiquidityList = debounceAsync(this.getLiquidityHistory, 500)

  get offset() {
    return Math.max((this.pagination.currentPage - 1) * this.pagination.pageSize, 0)
  }

  get tableBody() {
    const result: any = []
    const currentPageData = _.slice(this.liquidityList, this.offset, this.offset + this.pagination.pageSize)
    currentPageData.forEach(item => {
      result.push(this.convertLiquidity(item))
    })
    return result
  }

  get collateralSymbol(): string {
    return this.perpetualProperty?.collateralTokenSymbol ||
      (this.poolBaseInfo?.collateralSymbol || '')
  }

  get noData(): boolean {
    return this.tableBody.length === 0
  }

  get collateralDecimals(): number {
    return this.perpetualProperty?.collateralFormatDecimals || 0
  }

  convertLiquidity(data: LiquidityHistory | undefined): HistoryTable | undefined {
    if (data) {
      return {
        timestamp: data.timestamp as moment.Moment,
        type: Number(data.type),
        amount: toBigNumber(data.collateral),
        trader: data.trader,
        transactionHash: data.transactionHash,
      }
    }
    return undefined
  }

  getTypeText(tp: liquidityType): string {
    if (tp === liquidityType.AddLiquidity) {
      return this.$t('pool.poolInfo.liquidityHistory.addLiquidity').toString()
    }
    if (tp === liquidityType.RemoveLiquidity) {
      return this.$t('pool.poolInfo.liquidityHistory.removeLiquidity').toString()
    }
    return ''
  }

  getTypeColor(tp: liquidityType): string {
    if (tp === liquidityType.AddLiquidity) {
      return 'add-color'
    }
    if (tp === liquidityType.RemoveLiquidity) {
      return 'remove-color'
    }
    return ''
  }

  @Watch('pagination.currentPage')
  onCurrentPageChange() {
    if (this.tableBody[0] === undefined) {
      this.load()
    }
  }

  @Watch('poolBaseInfo')
  onPoolChange() {
    this.load()
  }

  protected async load() {
    if (this.loading) {
      return
    }
    try {
      await this.debounceGetLiquidityList()
    } catch (e) {
      console.warn(e)
    }
  }

  async getLiquidityHistory() {
    if (!this.poolBaseInfo || this.poolBaseInfo.poolAddress === '') {
      return
    }
    this.loading = true
    try {
      const poolAddress = this.poolBaseInfo.poolAddress
      const resultData = await this.callGraphApiFunc(() => {
        return queryPoolLiquidityHistoryList(poolAddress, this.offset, this.pagination.pageSize)
      })
      if (resultData && resultData.history.length > 0) {
        const history = resultData.history
        const count = Math.min(Number(history[0].liquidityPool?.liquidityHisCount || '0'), 5000)
        if (this.pagination.count === count) {
          this.liquidityList.splice(this.offset, history.length, ...history)
        } else {
          const data = new Array<LiquidityHistory>(count)
          data.splice(this.offset, history.length, ...history)
          this.pagination.count = count
          this.liquidityList = data
        }
      }
    } finally {
      this.loading = false
    }
  }
}
</script>

<style scoped lang="scss">
@import "../info.scss";

.pool-liquidity-history {
  .table-container {
    table {

      thead {
        th {
          width: 25%;
        }
      }

      th, td {
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
      }

      .add-color {
        color: var(--mc-color-blue);
      }

      .remove-color {
        color: var(--mc-color-orange);
      }

      th:first-child, td:first-child {
        padding-left: 20px;
      }

      th:last-child, td:last-child {
        padding-right: 20px;
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
