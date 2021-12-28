<template>
  <div class="liquidation">
      <BaseCardFrame :title="$t('pool.poolList.liquidation')">
        <template slot="content">
          <div class="header-box">
            <div class="title">{{ $t('pool.liquidationPage.unsafePosition') }}</div>
          </div>
          <div class="table-container">
            <table class="mc-data-table">
              <thead>
                <tr>
                  <th>{{ $t('pool.liquidationPage.trader') }}</th>
                  <th>{{ $t('pool.liquidationPage.perpetual') }}</th>
                  <th>{{ $t('pool.liquidationPage.side') }}</th>
                  <th>{{ $t('pool.liquidationPage.size') }}</th>
                  <th>{{ $t('pool.liquidationPage.MarkPrice') }}</th>
                  <th>{{ $t('pool.liquidationPage.notionalSize') }}</th>
                  <th>{{ $t('pool.liquidationPage.liquidationPenalty') }}</th>
                  <th>{{ $t('pool.liquidationPage.keeperGasReward') }}</th>
                  <th>
                    {{ $t('pool.liquidationPage.operation') }}
                    <el-tooltip placement="top" :open-delay="400">
                      <div slot="content"><span v-html="$t('pool.liquidationPage.operationTip')"></span></div>
                      <i class="iconfont icon-help-icon"></i>
                    </el-tooltip>
                  </th>
                </tr>
              </thead>
              <tbody :class="{'no-data': noData || loading}">
                <tr v-if="noData || loading">
                  <td colspan="9">
                    <McLoading v-if="loading" :show-loading="loading" min-show-time="0"></McLoading>
                    <McNoData v-else-if="noData" :label="$t('base.empty')"></McNoData>
                  </td>
                </tr>
                <tr v-else v-for="(item, index) in tableData" :key="index">
                  <td>
                    {{ item.trader | ellipsisMiddle }}
                    <el-link class="icon" :underline="false" target="_blank"
                             :href="item.trader | etherBrowserAddressFormatter">
                      <i class="iconfont icon-transmit"></i>
                    </el-link>
                  </td>
                  <td>
                    <span class="symbol-box">
                      <span class="is-danger">
                        <i class="iconfont icon-danger" v-if="isDangerPerpetual(item.symbol)"></i>
                      </span>
                      <span class="value symbol-link">
                        {{ `${padLeft(item.symbol, 5)} ${item.underlyingSymbol}-${item.collateralSymbol}` }}
                      </span>
                    </span>
                  </td>
                  <td>
                    <span :class="[getSideColorClass(item.position)]">{{ getSideText(item.position)}}</span>
                    {{ item.underlyingSymbol }}
                  </td>
                  <td>
                    {{ item.position | bigNumberFormatter(item.underlyingDecimals) }}
                    {{ item.underlyingSymbol }}
                  </td>
                  <td>
                    {{ item.markPrice | bigNumberFormatter(item.collateralDecimals) }}
                    {{ item.collateralSymbol }}
                  </td>
                  <td>
                    {{ item.notionalSize | bigNumberFormatter(item.collateralDecimals) }}
                    {{ item.collateralSymbol }}
                  </td>
                  <td>
                    {{ item.liquidationPenalty | bigNumberFormatter(item.collateralDecimals) }}
                    {{ item.collateralSymbol }} / {{ item.underlyingSymbol }}
                  </td>
                  <td>
                    {{ item.keeperGasReward | bigNumberFormatter(item.collateralDecimals) }}
                    {{ item.collateralSymbol }}
                  </td>
                  <td>
                    <span class="operation-item table-inter-button">
                      <el-button size="mini" type="secondary" @click="onTakeOverEvent(item)">
                        {{ $t('pool.liquidationPage.takeOver') }}
                      </el-button>
                    </span>
                    <span class="operation-item table-inter-button">
                      <el-button size="mini" type="secondary" @click="onLiquidateEvent">
                        {{ $t('pool.liquidationPage.liquidate') }}
                      </el-button>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="table-pagination">
              <el-pagination background layout="prev, pager, next"
                             hide-on-single-page
                             :page-size.sync="tablePageSize"
                             :total="listCount"
                             :current-page.sync="currentPage">
              </el-pagination>
            </div>
          </div>
        </template>
      </BaseCardFrame>
    <LiquidationTakeOver :visible.sync="showTakeOverDialog"
                         :liquidation-info="currentLiquidationItem"
                          @closed="onLiquidationTakeOverClosed"/>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { BaseCardFrame, McLoading, McNoData } from '@/components'
import { LiquidationMixin, LiquidationTableItem } from '@/template/components/Liquidation/liquidationMixin'
import BigNumber from 'bignumber.js'
import LiquidationTakeOver from './Components/LiquidationTakeOver.vue'

@Component({
  components: {
    BaseCardFrame,
    McLoading,
    McNoData,
    LiquidationTakeOver
  },
})
export default class Liquidation extends Mixins(LiquidationMixin) {
  tablePageSize: number = 10

  private showTakeOverDialog: boolean = false

  getSideColorClass(position: BigNumber): string {
    if (position.gt(0)) {
      return 'long-side'
    }
    if (position.lt(0)) {
      return 'short-side'
    }
    return ''
  }

  getSideText(position: BigNumber): string {
    if (position.gt(0)) {
      return this.$t('base.long').toString()
    }
    if (position.lt(0)) {
      return this.$t('base.short').toString()
    }
    return ''
  }

  onLiquidationTakeOverClosed() {
    this.currentLiquidationItem = null
  }

  onTakeOverEvent(data: LiquidationTableItem) {
    this.currentLiquidationItem = data
    this.showTakeOverDialog = true
  }
}
</script>

<style scoped lang="scss">
.liquidation {
  width: 1440px;
  max-width: 1440px;
  margin: auto;
  display: flex;
  flex-direction: column;

  .base-card-frame {
    flex: 1;
  }

  ::v-deep .base-card-frame {
    .title {
      font-size: 14px;
    }
    .content {
      padding: 30px;
    }
  }

  .header-box {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;

    .title {
      font-size: 16px;
      font-weight: 700;
      color: var(--mc-text-color-white);
    }
  }

  .table-container {
    .mc-data-table {
      width: 100%;
    }

    .no-data {
      tr{
        height: 633px;
      }
    }

    table {
      tr {
        height: 50px;
        border: 1px solid var(--mc-border-color);
        font-size: 13px;
        font-weight: 400;
        text-align: center;
      }

      th {
        color: var(--mc-text-color);
      }

      td {
        color: var(--mc-text-color-white);
        font-size: 12px;
      }

      th:nth-of-type(1), td:nth-of-type(1) {
        width: 10%;
      }

      th:nth-of-type(2), td:nth-of-type(2) {
        width: 12%;
      }

      th:nth-of-type(3), td:nth-of-type(3) {
        width: 7%;
      }

      th:nth-of-type(4), td:nth-of-type(4) {
        width: 10%;
      }

      th:nth-of-type(5), td:nth-of-type(5) {
        width: 10%;
      }

      th:nth-of-type(6), td:nth-of-type(6) {
        width: 10%;
      }

      th:nth-of-type(7), td:nth-of-type(7) {
        width: 10%;
      }

      th:nth-of-type(8), td:nth-of-type(8) {
        width: 10%;
      }

      th:nth-of-type(9), td:nth-of-type(9) {
        width: 18%;
      }
    }

    .table-pagination {
      text-align: right;
      margin-top: 20px;

      ::v-deep .el-pagination {
        padding: unset;
      }
    }

    .table-inter-button {
      ::v-deep {
        .el-button {
          width: 100px;
          height: 24px;
        }
      }
    }

    .operation-item {
      margin: 0 5px;
    }

    .icon {
      width: 10px;
      height: 10px;
      font-size: 10px;
      color: var(--mc-text-color);
      margin-left: 7px;
      display: inline;
    }

    .icon:hover {
      color: var(--mc-color-primary);
    }

    .symbol-box {
      display: flex;
      align-items: center;
      justify-content: center;

      .is-danger {
        margin: 0 4px 0 4px;
        display: inline-block;
        width: 18px;

        .icon-danger {
          font-size: 16px;
          color: var(--mc-color-error);
        }
      }
    }

    .long-side {
      color: var(--mc-color-blue);
    }

    .short-side {
      color: var(--mc-color-orange);
    }
  }
}
</style>
