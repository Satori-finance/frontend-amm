<template>
  <McLoading :show-loading="reloading" :margin="8" :hide-content="noData">
    <div class="close-position position-order-common-container scroll">
      <div class="filter-box">
        <div class="left">
          <el-checkbox v-model="showAllMarket">{{ $t('filters.allMarkets') }}</el-checkbox>
          <McSimpleTimeRange v-model="timeRange" :options="timeRangeOptions"/>
        </div>
      </div>
      <div class="table-box" ref="tableContainer" v-fixed-table>
        <table class="mc-data-table is-small fixed-table" :class="{ 'no-data-table': address && noData }">
          <thead>
          <tr>
            <th class="is-left">
              <span>{{ $t('base.time') }}</span>
            </th>
            <th class="is-left symbol-row">
              <span>{{ $t('base.contract') }}</span>
            </th>
            <th class="is-left">
              <span>{{ $t('base.side') }}</span>
            </th>
            <th class="is-left">
              <span>{{ $t('base.price') }}</span>
            </th>
            <th class="is-left">
              <span>{{ $t('base.amount') }}</span>
            </th>
            <th class="is-left">
              <span>{{ $t('base.fee') }} / {{ $t('base.penalty') }}</span>
            </th>
            <th class="is-left">
              <span>{{ $t('base.type') }}</span>
            </th>
            <th class="is-right">
              <span>{{ $t('base.pnl') }}</span>
            </th>
          </tr>
          </thead>
          <tbody v-if="address">
            <tr v-if="noData && !loading && !reloading" class="no-data">
              <td colspan="100">
                <McNoData></McNoData>
              </td>
            </tr>
            <tr v-for="(item, index) in tableBody" :key="index">
              <td class="is-left">
                <div class="cell">
                  {{ item.timestamp | i18nTimeFormatter($i18n.locale, 'day') }}
                  <span class="newline">
                    {{ item.timestamp | i18nTimeFormatter($i18n.locale, 'time') }}
                  </span>
              </div>
            </td>
            <td class="is-left symbol-row">
              <div class="cell symbol-box">
                  <span>
                    <McTokenPairView :underlyingSymbol="item.underlyingSymbol"
                                     :collateralAddress="item.collateralSymbol" :size="36" />
                  </span>
                <span class="value symbol-link more-line" @click="switchContract(item)">
                    {{ item.perpetualProperty.name }}
                    <span class="newline light-color down">
                      {{ item.perpetualProperty.symbolStr }}
                      <span class="inverse-card" v-if="item.perpetualProperty.isInverse">{{ $t('base.inverse') }}</span>
                    </span>
                  </span>
              </div>
            </td>
            <td class="is-left">
              <div class="cell">
                  <span class="side-box" :class="getSideClass(item).concat(item.isClose ? ['close-item'] : [])">
                    <span class="short">{{ $t('base.short') }}</span>
                    <span class="long">{{ $t('base.long') }}</span>
                  </span>
                <span class="unit newline light-color">{{ item.perpetualProperty.contractSymbol }}</span>
              </div>
            </td>
            <td class="is-left">
              <div class="cell">
                  <span>{{
                      item.price
                        | priceFormatter(item.perpetualProperty.isInverse)
                        | bigNumberFormatter(item.perpetualProperty.priceFormatDecimals)
                    }}</span>
              </div>
            </td>
            <td class="is-left">
              <div class="cell">
                  <span>{{
                      item.amount.abs() | bigNumberFormatter(item.perpetualProperty.underlyingAssetFormatDecimals)
                    }}</span>
                <span class="unit"> {{ item.perpetualProperty.underlyingAssetSymbol }}</span>
                <span class="newline light-color">
                    {{
                    item.amount.abs().times(item.price)
                      | bigNumberFormatter(item.perpetualProperty.collateralFormatDecimals)
                  }}
                    {{ item.perpetualProperty.collateralTokenSymbol }}
                  </span>
              </div>
            </td>
            <td class="is-left">
              <div class="cell">
                {{ item.fee | bigNumberFormatter(item.perpetualProperty.collateralFormatDecimals) }}
                <span class="unit"> {{ item.perpetualProperty.collateralTokenSymbol }}</span>
              </div>
            </td>
            <td class="is-left">
              <div class="cell">
                <span>{{ getType(item) }}</span>
              </div>
            </td>
            <td class="is-right">
              <div class="cell">
                <template v-if="item.isClose">
                  <PNNumber :number="item.pnl" :decimals="item.perpetualProperty.collateralFormatDecimals"
                            show-plus-sign/>
                  <span class="unit"> {{ item.perpetualProperty.collateralTokenSymbol }}</span>
                </template>
                <template v-else>
                  <span class="with-no-profit">--</span>
                </template>
                <el-link class="txid" target="_blank" :href="item.transactionHash | etherBrowserTxFormatter"
                         :underline="false">
                  <i class="iconfont icon-view"></i>
                </el-link>
              </div>
            </td>
          </tr>
          <tr v-show="!noData" class="load-more-box">
            <td v-if="loading && !reloading"><McLoadingIcon :height="22"></McLoadingIcon></td>
            <td v-else-if="noMore" class="no-more">{{ $t('base.noMore') }}</td>
            <td v-else @click="load" class="load-more">
              {{ $t('base.loadMoreEntries', {pageSize: pageSize}) }}
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <ConnectWalletMask v-if="!address" :show-mask="false"></ConnectWalletMask>
    </div>
  </McLoading>
</template>

<script lang="ts">
import { Component, Mixins, Ref, Watch } from 'vue-property-decorator'
import TradeHistoryMixin from '@/template/components/TradeHistory/tradeHistoryMixin'
import { McSimpleTimeRange, McNoData, McTokenPairView, McLoadingIcon } from '@/components'
import moment from 'moment'
import { Trade } from '@/type'
import { namespace } from 'vuex-class'
import ConnectWalletMask from '@/business-components/ConnectWalletMask.vue'
import { isDangerPerpetual } from '@/utils'

const activePerpetuals = namespace('activePerpetuals')
@Component({
  components: {
    McSimpleTimeRange,
    McNoData,
    ConnectWalletMask,
    McTokenPairView,
    McLoadingIcon,
  },
})
export default class TradeHistory extends Mixins(TradeHistoryMixin) {
  @activePerpetuals.State('selectedPerpetualID') selectedPerpetualID!: string | null
  @Ref('tableContainer') tableContainer!: HTMLElement
  private timeRange = '1d'

  get timeRangeOptions() {
    return [
      { key: '1d', label: this.$t('timeRange.1d').toString() },
      { key: '1w', label: this.$t('timeRange.1w').toString() },
      { key: '1M', label: this.$t('timeRange.1m').toString() },
      { key: '3M', label: this.$t('timeRange.3m').toString() },
    ]
  }

  private showAllMarket = true
  private isDangerPerpetual = isDangerPerpetual

  @Watch('showAllMarket')
  onShowAllChange(val: boolean) {
    if (val) {
      this.filters.contract = ''
    } else {
      this.filters.contract = this.selectedPerpetualID || ''
    }
  }

  @Watch('selectedPerpetualID')
  onSelectPerpetualChange() {
    if (!this.showAllMarket) {
      this.filters.contract = this.selectedPerpetualID || ''
    }
  }

  @Watch('trades')
  onTradesChange(newVal: Trade[], oldVal: Trade[]) {
    if (newVal.length !== oldVal.length) {
      this.$emit('change', newVal.length)
    }
  }

  @Watch('timeRange', { immediate: true })
  private onTimeRangeChange() {
    const now = moment.utc()
    let start = null
    switch (this.timeRange) {
      case '1d':
        start = now.subtract(1, 'd')
        break
      case '1w':
        start = now.subtract(1, 'w')
        break
      case '1M':
        start = now.subtract(1, 'M')
        break
      case '3M':
        start = now.subtract(3, 'M')
        break
    }
    if (start) {
      this.filters.startDate = now.toDate()
    }
  }
}
</script>

<style lang="scss" scoped>
@import './positionsAndOrders.scss';
</style>

<style lang="scss" scoped>
@import 'filterBox';

.mc-loading {
  height: 100%;
}

.loading {
  height: 24px;
  text-align: center;
  color: var(--mc-text-color);
  padding-bottom: 8px;
}

.table-box {
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;

  td {
    height: 60px;
    line-height: 22px;

    .newline {
      display: flex;
      align-items: center;
    }

    .light-color {
      color: var(--mc-text-color);
    }
  }

  .mc-data-table {
    width: 100%;

    thead th,
    tbody td {
      margin: 0 8px;

      &:nth-child(1) {
        width: 6.434%;
      }

      &:nth-child(2) {
        width: 12.868%;
      }

      &:nth-child(3) {
        width: 7.149%;
      }

      &:nth-child(4) {
        width: 10.723%;
      }

      &:nth-child(5) {
        width: 14.298%;
      }

      &:nth-child(6) {
        width: 14.298%;
      }

      &:nth-child(7) {
        width: 8.724%;
      }

      &:nth-child(8) {
        width: 13.494%;
        padding-right: 8px;
      }
    }

    .close-item {
      text-decoration-line: line-through;
    }

    .txid {
      margin-left: 6px;
      margin-top: -3px;
    }

    tr.load-more-box {
      height: 52px;
      display: flex;
      justify-content: center;
      align-items: center;

      &:hover {
        background: transparent;
      }

      td {
        width: auto;
        height: auto;
        font-size: 14px;
        line-height: 20px;
      }

      .load-more {
        color: var(--mc-color-primary);

        &:hover {
          cursor: pointer;
          text-decoration: underline;
        }
      }

      .no-more {
        color: var(--mc-text-color);
      }
    }

    .no-data {
      border-bottom: unset;
    }
  }



  .symbol-link {
    cursor: pointer;
  }

  .symbol-box {
    justify-content: left;
  }

  .iconfont {
    font-size: 14px;
  }
  .icon-view {
    font-size: 16px;

    &:hover {
      color: #8694B9;
    }
  }
}

.connect-wallet-mask {
  top: 68px;
}
</style>

<style lang="scss" scoped>
@import '~@mcdex/style/common/fantasy-var';

.satori-fantasy {
  .txid {
    color: var(--mc-text-color);
  }

  .with-no-profit {
    color: var(--mc-text-color);
  }
}
</style>
