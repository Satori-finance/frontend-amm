<template>
  <div class="perpetual-trade-history">
    <McLoading :show-loading="loading" :min-show-time="500">
      <div class="table-container">
        <table class="mc-data-table mc-data-table--border" :class="{ 'no-data-table': noData }">
          <thead>
            <tr>
              <th class="is-left">{{ $t('base.time') }}</th>
              <th class="is-left">{{ $t('base.type') }}</th>
              <th class="is-left">{{ $t('base.positionSide') }}</th>
              <th class="is-left">{{ $t('base.price') }}</th>
              <th class="is-left">{{ $t('base.amount') }}</th>
              <th class="is-left">{{ $t('base.fee') }}</th>
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
                  {{ item.timestamp | timestampFormatter('MM-DD') }}
                  <span class="newline">
                    {{ item.timestamp | timestampFormatter('HH:mm:ss') }}
                  </span>
                </td>
                <td class="is-left">
                  <div class="cell">
                    {{ getType(item) }}
                  </div>
                </td>
                <td class="is-left">
                  <div class="cell">
                    <span class="side-box" :class="getSideClass(item).concat(item.isClose ? ['close-item'] : [])">
                      <span class="short">{{ $t('base.short') }}</span>
                      <span class="long">{{ $t('base.long') }}</span>
                    </span>
                    <span v-if="perpetualProperty.isInverse" class="unit newline light-color"> {{ item.perpetualProperty.collateralTokenSymbol }}</span>
                    <span v-else class="unit newline light-color"> {{ item.perpetualProperty.underlyingAssetSymbol }}</span>
                  </div>
                </td>
                <td class="is-left">
                  <div class="cell">
                    <span>{{ item.price | priceFormatter(item.perpetualProperty.isInverse) | bigNumberFormatterByPrecision }} </span>
                    <span class="unit">
                      <template v-if="!item.perpetualProperty.isInverse">{{ item.perpetualProperty.collateralTokenSymbol }}</template>
                      <template v-else>{{ item.perpetualProperty.underlyingAssetSymbol }}</template>
                    </span>
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
                    {{ item.fee | bigNumberFormatter(item.perpetualProperty.collateralFormatDecimals) }}
                    <span class="unit"> {{ item.perpetualProperty.collateralTokenSymbol }}</span>
                  </div>
                </td>
                <td class="is-right">
                  <div class="cell">
                    <EllipsisText :text="item.trader.id" />
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
import { Component, Prop, Mixins, Watch, Vue } from 'vue-property-decorator'
import { McNoData, McLoading, EllipsisText, McPagination } from '@/components'
import { PerpetualProperty, Trade } from '@/type'
import { ErrorHandlerMixin } from '@/mixins'
import { queryTrades } from '@/api/trade'
import debounceAsync from '@seregpie/debounce-async'
import { isLongPosition, formatPrice } from '@/utils'
import * as _ from 'lodash'
import BigNumber from 'bignumber.js'

@Component({
  components: {
    McNoData,
    McLoading,
    EllipsisText,
    McPagination,
  },
})
export default class PerpetualTradeHistory extends Mixins(ErrorHandlerMixin) {
  @Prop({ default: () => null }) perpetualProperty!: PerpetualProperty | null
  private pagination = {
    count: 0,
    pageSize: 10,
    currentPage: 1,
  }
  private formatPrice = formatPrice
  private trades: Trade[] = []
  private loading = false
  private debounceGetTrades = debounceAsync(this.getTrades, 500)

  get noData() {
    return this.tableBody.length <= 0
  }

  get offset() {
    return Math.max((this.pagination.currentPage - 1) * this.pagination.pageSize, 0)
  }

  get tableBody(): Array<Trade & { perpetualProperty: PerpetualProperty } | undefined> {
    const result: Array<Trade & { perpetualProperty: PerpetualProperty } | undefined> = []
    const currentPageData = _.slice(this.trades, this.offset, this.offset + this.pagination.pageSize)
    currentPageData.forEach(item => {
      result.push(this.convertTrade(item))
    })
    return _.orderBy(
      result,
      [
        'blockNumber',
        'logIndex',
        'isClose'
      ],
      ['desc', 'desc', 'asc']
    )
  }

  protected getSideClass(item: Trade & { perpetualProperty: PerpetualProperty }) {
    if (item.isClose) {
      return !isLongPosition(item.amount as BigNumber, item.perpetualProperty.isInverse) ? ['is-long'] : ['is-short']
    } else {
      return isLongPosition(item.amount as BigNumber, item.perpetualProperty.isInverse) ? ['is-long'] : ['is-short']
    }
  }

  getType(trade: Trade) {
    if (trade.type === 0) {
      if (trade.isClose) {
        return this.$t('tradeType.close')
      } else {
        return this.$t('tradeType.open')
      }
    } else {
      return this.$t('tradeType.close')
    }
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
      await this.debounceGetTrades()
    } catch (e) {
      console.warn(e)
    }
  }

  protected convertTrade(trade: Trade | undefined): Trade & { perpetualProperty: PerpetualProperty } | undefined {
    return trade
      ? Object.assign({
        perpetualProperty: this?.perpetualProperty || PerpetualProperty.emptyInstance(),
      }, trade)
      : undefined
  }

  protected async getTrades() {
    await this.callGraphApiFunc(async () => {
      if (!this.perpetualProperty) {
        return
      }
      this.loading = true
      try {
        const result = await queryTrades({
          userAddress: undefined,
          startTime: undefined,
          endTime: undefined,
          pageSize: this.pagination.pageSize,
          offset: this.offset,
          perpetualID: this.perpetualProperty.perpetualID,
          type: 0
        })
        const trades = result.trades
        if (trades[0]) {
          const txCount = Number(trades[0]?.perpetual.txCount as string || '0')
          const liqCount = Number(trades[0]?.perpetual.liqCount as string || '0')
          const count = Math.min(txCount - liqCount, 5000)
          if (this.pagination.count === count) {
            this.trades.splice(this.offset, trades.length, ...trades)
          } else {
            const data = new Array<Trade>(count)
            data.splice(this.offset, trades.length, ...trades)
            this.pagination.count = count
            this.trades = data
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

.perpetual-trade-history {
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
    }

    .table-pagination {
      text-align: right;
      margin-top: 20px;

      ::v-deep .el-pagination {
        padding: unset;
      }
    }

    .position-size-unit {
      margin-left: 4px;
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
