<template>
  <div class="pool-perpetuals">
    <span class="head-title">
      {{ $t('pool.poolInfo.perpetualContracts') }}
      <span class="badge">{{ perpetualCount }}</span>
    </span>
    <div class="table-container">
      <table class="mc-data-table mc-data-table--border">
        <thead>
        <tr>
          <th class="is-left">{{ $t('pool.poolInfo.perpetuals.perpetual') }}</th>
          <th class="is-left">{{ $t('pool.poolInfo.perpetuals.status') }}</th>
          <th class="is-left">{{ $t('pool.poolInfo.perpetuals.ammSide') }}</th>
          <th class="is-left">{{ $t('pool.poolInfo.perpetuals.ammPosition') }}</th>
<!--          <th class="is-left">{{ $t('pool.poolInfo.perpetuals.entryPrice') }}</th>-->
          <th class="is-left">{{ $t('pool.poolInfo.perpetuals.volume24H') }}</th>
          <th class="is-right">{{ $t('pool.poolInfo.perpetuals.volume7D') }}</th>
        </tr>
        </thead>
        <tbody v-if="noData || loading" class="no-data">
        <tr>
          <td colspan="7">
            <McNoData v-if="noData&&!loading" :label="$t('base.empty')"></McNoData>
            <McLoading v-else :show-loading="loading"></McLoading>
          </td>
        </tr>
        </tbody>
        <tbody v-else>
        <tr class="click-tr" v-for="(item, index) in perpetuals" :key="index" @click="toPerpetualInfo(item.symbol)">
          <td class="is-left">
            <span class="symbol">
              {{ item.underlying }}-{{ collateralSymbol }}
              <div class="flex-line">
                <span class="sub-value">{{ item.symbol }}</span>
                <span class="inverse-card" v-if="perpetualsSubTable[getPerpID(item.index)].isInverse">{{ $t('base.inverse') }}</span>
              </div>
            </span>
          </td>
          <td :class="[getPerpetualStatusColor(item.status)]" class="is-left">
            {{ getPerpetualStatusText(item.status) }}
          </td>
          <td class="is-left">
            <div v-if="!item.ammPosition.isZero()">
              <span :class="[getSideColorClass(item.ammPosition, perpetualsSubTable[getPerpID(item.index)].isInverse)]">
                {{ getSideText(item.ammPosition, perpetualsSubTable[getPerpID(item.index)].isInverse) }}
              </span>
              <div>
                <span class="sub-value">{{ perpetualsSubTable[getPerpID(item.index)].sideSymbol }}</span>
              </div>
            </div>
          </td>
          <td class="is-left">
            <div>
              {{ item.ammPosition.abs() |
              bigNumberFormatter(perpetualsSubTable[getPerpID(item.index)]===undefined?0:
              perpetualsSubTable[getPerpID(item.index)].underlyingDecimals)
              }} {{ item.underlying }}
            </div>
            <div class="sub-value">
              {{ computePositionValue(item.index, item.ammPosition) | bigNumberFormatter(collateralDecimals) }} {{ collateralSymbol }}
            </div>
          </td>
<!--          <td class="is-left">-->
<!--            <span v-if="perpetualsSubTable[getPerpID(item.index)].isInverse">-->
<!--              {{ item.ammEntryPrice | priceFormatter(true) | bigNumberFormatter(collateralDecimals) }} {{ item.underlying }}-->
<!--            </span>-->
<!--            <span v-else>-->
<!--              {{ item.ammEntryPrice | bigNumberFormatter(underlyingAssetFormatDecimals) }} {{ collateralSymbol }}-->
<!--            </span>-->
<!--          </td>-->
          <td class="is-left">
            {{ item.volume24Hours | bigNumberFormatter(collateralDecimals) }} {{ collateralSymbol }}
          </td>
          <td class="is-right">
            {{ item.volume7Day | bigNumberFormatter(collateralDecimals) }} {{ collateralSymbol }}
          </td>

        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { McNoData, McLoading } from '@/components'
import PoolPerpetualsMixin from '@/template/components/Pool/PoolInfo/poolPerpetualsMixin'
import { PerpetualState } from '@mcdex/mai3.js'
import BigNumber from 'bignumber.js'
import { isLongPosition } from '@/utils'

@Component({
  components: {
    McNoData,
    McLoading,
  },
})
export default class PoolPerpetuals extends Mixins(PoolPerpetualsMixin) {
  getPerpetualStatusColor (status: PerpetualState) {
    if (status === PerpetualState.INVALID) return 'invalid-status'
    if (status === PerpetualState.INITIALIZING) return 'initializing-status'
    if (status === PerpetualState.NORMAL) return 'normal-status'
    if (status === PerpetualState.EMERGENCY) return 'emergency-status'
    if (status === PerpetualState.CLEARED) return 'cleared-status'
    return ''
  }

  getSideColorClass(position: BigNumber, isInverse: boolean = true): string {
    if (position.isZero()) {
      return ''
    }
    if (isLongPosition(position, isInverse)) {
      return 'long-side'
    } else {
      return 'short-side'
    }
  }

  toPerpetualInfo (symbol: string) {
    this.$router.push({ name: 'poolPerpetualInfo', params: { symbol: symbol } })
  }
}
</script>

<style scoped lang="scss">
@import "../info.scss";

.pool-perpetuals {
  .table-container {
    table {

      thead {
        th {
          width: 14.2%;
        }
      }

      th {
        height: 50px;
      }

      td {
        height: 60px;
      }

      th, td {
        font-size: 13px;
        font-weight: 400;
        padding: 8px 0;
        line-height: 21px;
      }

      th:first-child, td:first-child {
        padding-left: 20px;
      }

      th:last-child, td:last-child {
        padding-right: 20px;
      }

      .click-tr {
        cursor: pointer;

        .symbol {
          color: var(--mc-color-primary);
        }
      }

      .no-data {
        td {
          height: 300px;
        }
      }

      tbody {
        text-align: center;
      }
    }

    .sub-value {
      color: var(--mc-text-color);
    }

    .long-side {
      color: var(--mc-color-blue);
    }

    .short-side {
      color: var(--mc-color-orange);
    }

    .invalid-status {
      color: var(--mc-color-secondary);
    }

    .initializing-status {
      color: var(--mc-color-info);
    }

    .normal-status {
      color: var(--mc-color-blue);
    }

    .emergency-status {
      color: var(--mc-color-error);
    }

    .cleared-status {
      color: var(--mc-color-warning);
    }

    .flex-line {
      display: flex;
      align-items: center;
    }
  }
}
</style>
