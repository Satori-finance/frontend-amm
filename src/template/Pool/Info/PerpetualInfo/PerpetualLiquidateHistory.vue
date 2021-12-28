<template>
  <div class="perpetual-liquidate-history">
    <McLoading :show-loading="loading" :min-show-time="500">
      <div class="table-container">
        <table class="mc-data-table mc-data-table--border" :class="{ 'no-data-table': noData }">
          <thead>
            <tr>
              <th class="is-left">{{ $t('base.time') }}</th>
              <th class="is-left">{{ $t('base.positionSide') }}</th>
              <th class="is-left">{{ $t('base.estPrice') }}</th>
              <th class="is-left">{{ $t('base.actPrice') }}</th>
              <th class="is-left">{{ $t('base.amount') }}</th>
              <th class="is-left">{{ $t('base.penalty') }}</th>
              <th class="is-right">{{ $t('base.account') }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="noData">
              <td colspan="100">
                <McNoData></McNoData>
              </td>
            </tr>
            <tr v-for="(item, index) in tableBody" :key="index">
              <template v-if="!item">
                <td colspan="100"></td>
              </template>
              <template v-else>
                <td class="is-left">
                  <div class="cell">
                    {{ item.timestamp | timestampFormatter('MM-DD') }}
                    <span class="newline">
                      {{ item.timestamp | timestampFormatter('HH:mm:ss') }}
                    </span>
                  </div>
                </td>
                <td class="is-left">
                  <div class="cell">
                    <span class="side-box" :class="getSideClass(item).concat(['close-item'])">
                      <span class="short">{{ $t('base.short') }}</span>
                      <span class="long">{{ $t('base.long') }}</span>
                    </span>
                    <span class="unit newline light-color"> {{ item.perpetualProperty.contractSymbol }}</span>
                  </div>
                </td>
                <td class="is-left">
                  <div class="cell" v-if="perpetualProperty.isInverse">
                    <span>{{ item.markPrice | priceFormatter(perpetualProperty.isInverse) | bigNumberFormatter(item.perpetualProperty.underlyingAssetFormatDecimals) }}</span>
                    <span class="unit position-size-unit"> {{ item.perpetualProperty.underlyingAssetSymbol }}</span>
                  </div>
                  <div class="cell" v-else>
                    <span>{{ item.markPrice | bigNumberFormatter(item.perpetualProperty.collateralFormatDecimals) }}</span>
                    <span class="unit position-size-unit"> {{ item.perpetualProperty.collateralTokenSymbol }}</span>
                  </div>
                </td>
                <td class="is-left">
                  <div class="cell" v-if="perpetualProperty.isInverse">
                    <span>{{ item.price | priceFormatter(perpetualProperty.isInverse) | bigNumberFormatter(item.perpetualProperty.underlyingAssetFormatDecimals) }}</span>
                    <span class="unit"> {{ item.perpetualProperty.underlyingAssetSymbol }}</span>
                  </div>
                  <div class="cell" v-else>
                    <span>{{ item.price | bigNumberFormatter(item.perpetualProperty.collateralFormatDecimals) }}</span>
                    <span class="unit"> {{ item.perpetualProperty.collateralTokenSymbol }}</span>
                  </div>
                </td>
                <td class="is-left">
                  <div class="cell">
                    <span>{{
                      item.amount.abs() | bigNumberFormatter(item.perpetualProperty.underlyingAssetFormatDecimals)
                    }}</span>
                    <span class="unit"> {{ item.perpetualProperty.underlyingAssetSymbol }}</span>
                    <span class="newline light-color">
                      <span>{{
                        item.amount.abs().times(formatPrice(item.price))
                          | bigNumberFormatter(item.perpetualProperty.collateralFormatDecimals)
                      }}</span>
                      <span class="unit position-size-unit"> {{ item.perpetualProperty.collateralTokenSymbol }}</span>
                    </span>
                  </div>
                </td>
                <td class="is-left">
                  <div class="cell">
                    {{ item.penalty | bigNumberFormatter(item.perpetualProperty.collateralFormatDecimals) }}
                    <span class="unit"> {{ item.perpetualProperty.collateralTokenSymbol }}</span>
                  </div>
                </td>
                <td class="is-right">
                  <div class="cell">
                    <EllipsisText :text="item.trader" />
                    <el-link
                      target="_blank"
                      class="icon"
                      :href="item.transactionHash | etherBrowserTxFormatter"
                      :underline="false"
                    >
                      <i class="iconfont icon-transmit"></i>
                    </el-link>
                  </div>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
        <div class="table-pagination">
          <McPagination
            :page-size.sync="pagination.pageSize"
            :total="pagination.count"
            :current-page.sync="pagination.currentPage"
          >
          </McPagination>
        </div>
      </div>
    </McLoading>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins, Watch } from 'vue-property-decorator'
import { McNoData, McLoading, EllipsisText, McPagination } from '@/components'
import { Liquidate, PerpetualProperty } from '@/type'
import { ErrorHandlerMixin } from '@/mixins'
import moment from 'moment'
import debounceAsync from '@seregpie/debounce-async'
import { isLongPosition, formatPrice } from '@/utils'
import { queryLiquidates } from '@/api/liquidate'
import * as _ from 'lodash'
import BigNumber from 'bignumber.js'

@Component({
  components: {
    McNoData,
    McLoading,
    EllipsisText,
    McPagination,
  },
  filters: {
    formatMonth(val: moment.Moment): string {
      return val.local().format('MM/DD HH:mm')
    },
  },
})
export default class PerpetualLiquidateHistory extends Mixins(ErrorHandlerMixin) {
  @Prop({ default: () => null }) perpetualProperty!: PerpetualProperty | null

  private pagination = {
    count: 0,
    pageSize: 10,
    currentPage: 1,
  }
  private formatPrice = formatPrice
  private history: Liquidate[] = []
  private loading = false
  private debounceGetData = debounceAsync(this.getHistory, 500)

  get noData() {
    return this.tableBody.length <= 0
  }

  get offset() {
    return Math.max((this.pagination.currentPage - 1) * this.pagination.pageSize, 0)
  }

  get tableBody(): Array<(Liquidate & { perpetualProperty: PerpetualProperty } | undefined)> {
    const result: Array<(Liquidate & { perpetualProperty: PerpetualProperty } | undefined)> = []
    const currentPageData = _.slice(this.history, this.offset, this.offset + this.pagination.pageSize)
    currentPageData.forEach(item => {
      result.push(this.convertData(item))
    })
    return result
  }

  private getSideClass(item: Liquidate) {
    return !isLongPosition(item.amount as BigNumber) ? ['is-long'] : ['is-short']
  }

  @Watch('perpetualProperty.perpetualID', { immediate: true })
  onPerpetualPropertyChange() {
    if (!this.perpetualProperty?.perpetualID) {
      return
    }
    this.load()
  }

  @Watch('pagination.currentPage')
  onCurrentPageChange() {
    this.load()
  }

  protected async load() {
    if (this.loading) {
      return
    }
    try {
      await this.debounceGetData()
    } catch (e) {
      console.warn(e)
    }
  }

  private convertData(data: Liquidate | undefined): (Liquidate & { perpetualProperty: PerpetualProperty }) | undefined {
    return data
      ? Object.assign({
        perpetualProperty: this?.perpetualProperty || PerpetualProperty.emptyInstance(),
      }, data)
      : undefined
  }

  private async getHistory() {
    await this.callGraphApiFunc(async () => {
      if (!this.perpetualProperty) {
        return
      }
      this.loading = true
      try {
        const result = await queryLiquidates({
          trader: undefined,
          startTime: undefined,
          endTime: undefined,
          liquidator: undefined,
          pageSize: this.pagination.pageSize,
          offset: this.offset,
          perpetualID: this.perpetualProperty.perpetualID,
        })
        const liquidates = result.liquidates
        if (liquidates[0]) {
          const count = Math.min(Number(liquidates[0]?.perpetual.liqCount as string || '0'), 5000)
          if (this.pagination.count === count) {
            this.history.splice(this.offset, liquidates.length, ...liquidates)
          } else {
            const data = new Array<Liquidate>(count)
            data.splice(this.offset, liquidates.length, ...liquidates)
            this.pagination.count = count
            this.history = data
          }
        }
      } finally {
        this.loading = false
      }
    })
  }
}
</script>

<style scoped lang="scss">
@import '../info.scss';

.perpetual-liquidate-history {
  .table-container {
    table {
      width: 100%;
      .newline {
        display: flex;
        align-items: center;
      }
      .light-color {
        color: var(--mc-text-color);
      }
      .is-left {
        padding-left: 20px;
      }
      .is-right {
        padding-right: 20px;
      }
      th,
      td {
        font-weight: 400;
        padding: 13px 0;
        height: 50px;
      }
      th {
        font-size: 13px;
      }
      td {
        font-size: 12px;
        line-height: 22px;
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
      .position-size-unit {
        margin-left: 4px;
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

  .side-box {
    .long,
    .short {
      display: none;
    }

    &.is-long .long {
      display: inline;
    }

    &.is-short .short {
      display: inline;
    }

    &.is-short {
      color: var(--mc-color-orange);
    }

    &.is-long {
      color: var(--mc-color-blue);
    }

    &.close-item {
      text-decoration-line: line-through;
    }
  }

  .iconfont {
    font-size: 14px;
  }
}
</style>
