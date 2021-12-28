<template>
  <div class="perpetual-box">
    <div class="title">{{$t('home.toPerpetualContracts')}}</div>
    <div class="search-container">
      <div class="chain-selector" v-if="chains.length > 2">
        <McTabs v-model="activeChain" :tabs="chains" :auto-size="true"></McTabs>
      </div>

      <div class="input-box" :class="{'is-focus': searchFocus}">
        <el-input :placeholder="$t('home.searchPlaceholder')" v-model="searchKey" @focus="searchFocus = true" @blur="searchFocus = false">
          <template #prefix>
            <span><i class="iconfont icon-search-bold"></i></span>
          </template>
        </el-input>
      </div>
    </div>
    <div class="table-container">
      <table class="mc-data-table mc-data-table--border">
        <thead>
        <tr>
          <th>{{ $t('base.perpetual') }}</th>
          <th>{{ $t('base.liquidity') }}</th>
          <th>{{ $t('base.indexPrice') }}</th>
          <th>{{ $t('home.change24h') }}</th>
          <th>{{ $t('base.volume/24H') }}</th>
          <th>{{ $t('base.option') }}</th>
        </tr>
        </thead>
        <tbody v-if="noData || loading" class="no-data">
        <tr>
          <td colspan="6" style="height: 200px">
            <McNoData v-if="noData && !loading" :label="$t('base.empty')"></McNoData>
            <McLoading v-else :show-loading="loading"></McLoading>
          </td>
        </tr>
        </tbody>
        <tbody v-else>
        <tr class="click-tr" v-for="(item, index) in tableBody" :key="index">
          <td class="perpetual-tag-item">
              <span class="perpetual-tag" v-if="item.state === emergency || item.state === cleared">
                <span v-if="item.state === emergency">{{ $t('perpetualStatus.emergency') }}</span>
                <span v-else>{{ $t('perpetualStatus.cleared') }}</span>
              </span>
            <div class="cell">
              <span class="symbol-box">
                <span>
                  <McTokenPairView :underlyingSymbol="item.underlying"
                                   :collateralAddress="item.collateralAddress"
                                   :network-id="item.chainID"
                                   :size="40"/>
                </span>
                <div class="value symbol-link more-line">
                  <div>{{ item.underlying }}-{{ item.collateralSymbol }} <span class="chain-symbol">({{item.chain | shortChain}})</span></div>
                  <div class="newline light-color">
                    {{ `${padLeft(item.symbol, 5)}` }}
                    <span class="inverse-card" v-if="item.isInverse">{{ $t('base.inverse') }}</span>
                  </div>
                </div>
              </span>
            </div>
          </td>
          <td>
            <div class="cell">
              <span v-if="!item.liquidity">---</span>
              <span v-else>$ {{ item.liquidity | bigNumberFormatterByPrecision }}</span>
            </div>
          </td>
          <td>
            <div class="cell">
              <span v-if="priceLoading"><i class="el-icon-loading"></i></span>
              <span v-else-if="!item.indexPrice||item.indexPrice.toString()==='Infinity'">---</span>
              <span v-else>{{ item.indexPrice | bigNumberFormatterByPrecision }}&nbsp</span>
              <span v-if="item.isInverse">{{ item.underlying }}</span>
              <span v-else>{{ item.collateralSymbol }}</span>
            </div>
          </td>
          <td>
            <div class="cell">
              <span v-if="priceLoading"><i class="el-icon-loading"></i></span>
              <span v-else-if="!item.change24h">---</span>
              <PNNumber
                v-else
                :show-plus-sign="true"
                :number="item.change24h"
                suffix="%"
                :decimals="2"
              />
            </div>
          </td>
          <td>
            <div class="cell">
              <span v-if="!item.deltaTotalVolumeUSD">---</span>
              <span v-else>$ {{ item.deltaTotalVolumeUSD | bigNumberFormatterByPrecision }}</span>
            </div>
          </td>
          <td>
            <div class="cell">
              <el-tooltip :content="$t('home.wrongNetworkPrompt', {network: item.chainName})" :disabled="item.chainID === currentChainId">
                <el-button size="medium" :class="{'is-disabled': item.chainID !== currentChainId}" class="info" @click="goPerpetualInfo(item)">{{ $t('base.info') }}</el-button>
              </el-tooltip>
              <el-tooltip :content="$t('home.wrongNetworkPrompt', {network: item.chainName})" :disabled="item.chainID === currentChainId">
                <el-button size="medium" :class="{'is-disabled': item.chainID !== currentChainId}" class="info" @click="goPoolInfo(item)">{{ $t('base.pool') }}</el-button>
              </el-tooltip>
              <el-tooltip :content="$t('home.wrongNetworkPrompt', {network: item.chainName})" :disabled="item.chainID === currentChainId">
                <el-button size="medium" :class="{'is-disabled': item.chainID !== currentChainId}" @click="goTrade(item)">{{ $t('base.trade') }}</el-button>
              </el-tooltip>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { McTabs, McNoData, McLoading, PNNumber, McTokenPairView } from '@/components'
import HomePerpetualMixin from '@/template/components/Home/HomePerpetualMixin'
import { CHAIN_SYMBOL, currentChainConfig } from '@/config/chain'
import { padLeft } from '@/utils'

@Component({
  components: {
    McTabs,
    McNoData,
    McLoading,
    PNNumber,
    McTokenPairView,
  },
  filters: {
    shortChain: (chain: CHAIN_SYMBOL) => {
      if (chain === 'BSC') {
        return 'BSC'
      } else if (chain === 'ARB_TESTNET' || chain === 'ARB') {
        return 'ARB'
      } else if (chain === 'OPTIMISM_TESTNET' || chain === 'OPTIMISM') {
        return 'OPTIMISTIC'
      }
      return chain
    },
  },
})
export default class PerpetualBox extends Mixins(HomePerpetualMixin) {
  currentChainId = currentChainConfig.chainID
  padLeft = padLeft
  searchFocus = false
}
</script>

<style lang="scss">
.perp-warning-tooltip {
  max-width: 420px;
}
</style>

<style scoped lang="scss">
@import '~@mcdex/style/common/var';

.perpetual-box {
  max-width: 1200px;
  margin: 48px auto auto;

  .title {
    font-size: 24px;
    line-height: 30px;
    margin-bottom: 24px;
  }

  .search-container {
    text-align: center;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .chain-selector {
      height: 48px;
      display: inline-block;
      border-bottom: 1px solid var(--mc-border-color);
      width: 456px;

      .mc-tabs {
        height: 48px;
        line-height: 48px;
      }
    }

    .input-box {
      border-radius: var(--mc-border-radius-l);
      padding: 1px;
      background-color: var(--mc-border-color);
      &.is-focus {
        background: var(--mc-color-primary-gradient);

        .iconfont {
          color: var(--mc-text-color-white);
        }
      }
    }

    .el-input {
      justify-self: flex-end;
      background-color: var(--mc-background-color-dark);
      border-radius: var(--mc-border-radius-l);
      border: none;
      width: 678px;
      height: 50px;
      font-size: 14px;
      padding: 0 16px;

      ::v-deep .el-input__inner {
        height: 50px;
      }
    }
  }

  .table-container {
    padding: 0 0 30px;

    .total-count {
      text-align: right;
      margin-bottom: 9px;

      .label {
        color: var(--mc-text-color);
      }
    }

    .perpetual-tag-item {
      position: relative;

      .perpetual-tag {
        background: rgba($--mc-color-orange, 0.1);
        position: absolute;
        top: 0;
        left: 0;
        padding: 0 8px;
        border-radius: 0 0 6px 0;
        font-size: 12px;
        line-height: 22px;

        span {
          color: #FFB110;
        }
      }
    }

  }

  table {
    width: 100%;
    border-radius: var(--mc-border-radius-l);
    border: 1px hidden var(--mc-border-color);
    border-collapse: collapse;
    box-shadow: 0 0 0 1px var(--mc-border-color);
    overflow: hidden;

    tr {
      border-bottom: 1px solid var(--mc-border-color);

      td,
      th {
        border: none;
        text-align: left;
        padding-left: 16px;

        &:first-of-type {
          border-left: 1px solid var(--mc-border-color);
        }

        &:last-of-type {
          border-right: 1px solid var(--mc-border-color);
        }

        &.border-cell {
          border: 1px solid var(--mc-border-color);
        }
      }

      td {
        text-align: center;

        .cell {
          display: flex;
          align-items: center;
        }
      }
    }

    thead {
      font-size: 14px;
      line-height: 20px;

      th {
        height: 52px;
      }
    }

    tbody {
      background-color: var(--mc-background-color-dark);
      font-size: 14px;
      line-height: 20px;

      td {
        height: 92px;
      }
    }
  }

  .symbol-box {
    display: inline-flex;
    align-items: center;
    text-align: left;

    .symbol-link {
      margin-left: 8px;
      font-size: 14px;
      line-height: 20px;

      .chain-symbol {
        color: var(--mc-text-color);
      }
    }

    .light-color {
      font-size: 12px;
      line-height: 16px;
      color: var(--mc-text-color);
    }

    .newline {
      display: flex;
      align-items: center;
    }
  }

  .chain {
    background: rgba(175, 214, 242, 0.05);
    border-radius: var(--mc-border-radius-l);
    display: inline-flex;
    align-items: center;
    margin-left: 6px;
    padding: 0 6px;
    color: var(--mc-color-primary);

    .point {
      display: inline-block;
      height: 4px;
      width: 4px;
      border-radius: 50%;
      margin: 0 4px 0 0;

      &.ARB {
        background-color: #ddb666;
      }

      &.BSC {
        background-color: #62a7a5;
      }
    }
  }

  .el-button {
    margin-right: 8px;
    width: 80px;
    height: 32px;
    border-radius: var(--mc-border-radius-m);
    font-size: 12px;

    &.info {
      background: var(--mc-background-color);
    }

    &:last-of-type {
      margin-right: 0;
    }
  }
}
</style>
