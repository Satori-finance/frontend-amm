<template>
  <div class="recent-trades">
    <header class="head mc-font-p14">
      <slot name="head">
        <span>{{ $t('recentTrades') }}</span>
      </slot>
    </header>

    <div ref="recentTrades" class="content">
      <div class="title">
        <div class="price-info">
          <el-tooltip :content="$t('hintInfos.recentTrades.price')" placement="top" :open-delay="400">
            <span>{{ tableTitle[0] }}</span>
          </el-tooltip>
        </div>
        <div class="amount">{{ tableTitle[1] }}</div>
        <div class="executed-at">{{ tableTitle[2] }}</div>
      </div>
      <McLoading :show-loading="loading" :hide-content="true" mask-color="none">
        <div class="table" v-if="trades.length > 0">
          <div class="table-item" v-for="(info, index) in trades">
            <div class="price-info">
              <span class="side price"
                    :class="{ buy: toBigNumber(info.amount).gt(0), sell: toBigNumber(info.amount).lt(0) }">{{
                  info.price | priceFormatter(isInverse) | bigNumberFormatter(priceFormatDecimals)
                }}</span>
              <span class="up-down">
                <i class="iconfont icon-up" v-if="isIncrease(index)"></i>
                <i class="iconfont icon-down" v-else-if="isDecrease(index)"></i>
              </span>
            </div>
            <div class="amount is-right">
              {{
                info.amount | tradeAmountFormatter | bigNumberFormatterTruncateByPrecision(5, 2, contractFormatDecimals)
              }}
            </div>
            <div class="executed-at">
              <span>{{ info.timestamp | timestampFormatter('HH:mm:ss') }}</span>
              <el-tooltip :content="$t('hintInfos.viewTransaction')" placement="top">
                <a :href="getEthScanUrl(info)" target="_blank" class="address-link">
                  <i class="iconfont icon-view mc-icon-btn"></i>
                </a>
              </el-tooltip>
            </div>
          </div>
        </div>
        <McNoData v-else></McNoData>
      </McLoading>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Watch, Mixins } from 'vue-property-decorator'
import { McLoading, McNoData } from '@/components'
import RecentTradeMixin from '@/template/components/Trade/recentTradeMixin'
import { etherBrowserTxURL } from '@/utils/ethers'

@Component({
  components: {
    McLoading,
    McNoData,
  },
})

export default class RecentTrades extends Mixins(RecentTradeMixin) {

  isIncrease(i: number) {
    if (i >= this.trades.length - 1) {
      return false
    }
    return (
      this.trades[i].price.gt(this.trades[i + 1].price) &&
      (!this.trades[i + 2] || this.trades[i + 1].price.lte(this.trades[i + 2].price))
    )
  }

  isDecrease(i: number) {
    if (i >= this.trades.length - 1) {
      return false
    }
    return (
      this.trades[i].price.lt(this.trades[i + 1].price) &&
      (!this.trades[i + 2] || this.trades[i + 1].price.gte(this.trades[i + 2].price))
    )
  }

  getEthScanUrl(data: any): string {
    return etherBrowserTxURL(data.transactionHash)
  }

  get tableTitle() {
    return [
      // columns.flag,
      `${this.$t('tableTitle.price')} (${this.selectedPerpetualProperty?.priceSymbol || ''})`,
      `${this.$t('tableTitle.amount')} (${this.selectedPerpetualProperty?.underlyingAssetSymbol || ''})`,
      this.$t('tableTitle.time'),
    ]
  }
}
</script>

<style lang="scss" scoped>
@import '~@mcdex/style/common/var';

.recent-trades {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  background-color: var(--mc-background-color-darkest);

  .head {
    display: flex;
    box-sizing: content-box;
    align-items: center;
    height: 48px;
    padding: 0 16px;
    overflow: hidden;
    border-bottom: 1px solid #242d43;
    color: var(--mc-text-color-white);
  }

  .content {
    display: flex;
    flex-direction: column;
    height: calc(100% - 42px);
    padding-left: 8px;
    padding-right: 8px;
    background-color: var(--mc-background-color-darkest);
    padding-bottom: 8px;

    .title {
      padding: 8px;
      color: var(--mc-text-color);
    }

    .table-item {
      height: 20px;
    }

    .table .table-item,
    .title {
      display: flex;
      align-items: center;
      text-align: right;
      font-size: 12px;
      line-height: 16px;

      .price-info {
        width: 36%;
        text-align: left;
        margin: 0 4px 0 0;
      }

      .amount {
        width: 34%;
        text-align: right;
        margin: 0 4px 0 0;
      }

      .is-right {
        text-align: right;
      }

      .executed-at {
        width: 30%;
        text-align: right;
        margin: 0px;
      }
    }

    .mc-loading {
      flex: 1;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      overflow-y: overlay;
      padding: 0 8px 10px 8px;
    }

    .table {
      width: 100%;

      .iconfont.icon-up {
        color: var(--mc-color-blue);
      }

      .iconfont.icon-down {
        color: var(--mc-color-orange);
      }

      .executed-at {
        color: var(--mc-text-color);
      }

      .side {
        &.buy {
          color: var(--mc-color-blue);
        }

        &.sell {
          color: var(--mc-color-orange);
        }
      }

      .up-down .iconfont {
        font-size: 0.08rem;
      }

      .iconfont.icon-title {
        cursor: help;
      }

      .iconfont.mc-icon-btn {
        margin-left: 4px;
      }

      .new-list {
        width: 100%;
        height: 100%;
      }

      .iconfont {
        color: var(--mc-icon-color-light);
        font-size: 16px;
        cursor: pointer;
      }

      ::v-deep .list-enter-active,
      ::v-deep .list-leave-active {
        transition: all 0.5s;
      }

      ::v-deep .list-enter,
      ::v-deep .list-leave-to {
        opacity: 0;
        transform: translateY(-0.1rem);
      }

      .address-link {
        text-decoration: none;

        &:hover .iconfont {
          color: #8694B9;
        }
      }
    }
  }
}
</style>
