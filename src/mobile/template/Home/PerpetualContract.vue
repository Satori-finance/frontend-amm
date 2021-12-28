<template>
  <div class="perpetual-contract">
    <div class="chain-selector" v-if="chains.length > 2">
      <McTabs v-model="activeChain" :tabs="chains" :auto-size="true"></McTabs>
    </div>

    <div class="search">
      <div class="search-input-box" :class="{'search-input-box-focus': searchInputIsFocus}">
        <van-field class="search-input" :class="{'search-input-focus': searchInputIsFocus}"
                   :placeholder="$t('pool.poolList.searchTip')" v-model.trim="searchKey"
                   @focus="searchInputIsFocus=true" @blur="searchInputIsFocus=false">
          <template slot="left-icon">
            <i class="iconfont icon-search-bold"></i>
          </template>
        </van-field>
      </div>
    </div>

    <van-skeleton :loading="!!loading" :row="10" class="search-container">
      <div v-if="!noData">
        <div class="perpetual-item" v-for="(item, index) in perpetualList" :key="index">
          <div class="info-box">
            <div class="perpetual-tag" v-if="item.state === emergency || item.state === cleared">
              <span v-if="item.state === emergency">{{ $t('perpetualStatus.emergency') }}</span>
              <span v-else>{{ $t('perpetualStatus.cleared') }}</span>
            </div>
            <div class="top">
              <div class="left">
                <McMTokenPairView :collateral-address="item.collateralAddress"
                                  :underlying-symbol="item.underlying" :network-id="item.chainID" :size="40"/>
                <div>
                  <div class="name-box">
                    {{ item.underlying }}-{{ item.collateralSymbol }}
                    <span class="chain">({{ item.chain | shortChain }})</span>
                  </div>
                  <div class="symbol">
                    <span>{{ item.symbol }}</span>
                    <span v-if="item.isInverse" class="inverse-card">{{ $t('base.inverse') }}</span>
                  </div>
                </div>
              </div>
              <div class="right">
                <div class="value liquidity-value">${{ item.liquidity | bigNumberFormatterByPrecision }}</div>
                <div class="text">{{ $t('base.liquidity') }}</div>
              </div>
            </div>
            <div class="bottom">
              <div class="info-item">
                <div class="value">
                  <span v-if="!item.indexPrice||item.indexPrice.toString()==='Infinity'">---</span>
                  <span v-else>{{ item.indexPrice | bigNumberFormatterByPrecision }}&nbsp</span>
                  <span v-if="item.isInverse">{{ item.underlying }}</span>
                  <span v-else>{{ item.collateralSymbol }}</span>
                </div>
                <div class="text">{{ $t('base.indexPrice') }}</div>
              </div>
              <div class="info-item">
                <div class="value">
                  <span v-if="!item.change24h">---</span>
                  <PNNumber
                    v-else
                    :show-plus-sign="true"
                    :number="item.change24h"
                    suffix="%"
                    :decimals="2"
                  />
                </div>
                <div class="text">{{ $t('home.change24h') }}</div>
              </div>
              <div class="info-item">
                <div class="value">
                  <span v-if="!item.deltaTotalVolumeUSD">---</span>
                  <span v-else>${{ item.deltaTotalVolumeUSD | bigNumberFormatterByPrecision }}</span>
                </div>
                <div class="text">{{ $t('home.volume24H') }}</div>
              </div>
            </div>
          </div>
          <div class="button-box">
            <van-button :disabled="item.chainID !== currentChainId" class="info" @click="goPerpetualInfo(item)">{{ $t('base.info') }}</van-button>
            <van-button :disabled="item.chainID !== currentChainId" class="info" @click="goPoolInfo(item)">{{ $t('base.pool') }}</van-button>
            <van-button :disabled="item.chainID !== currentChainId" @click="goTrade(item)">{{ $t('base.trade') }}</van-button>
          </div>
        </div>
        <div class="split-line" v-if="isShowPagination && !noData && totalPage > 1" ></div>
        <div v-if="isShowPagination && !noData && totalPage > 1">
          <McMPagination :current-page.sync="currentPage" :total-page="totalPage"/>
        </div>
      </div>
      <div v-if="noData" class="nodata">
        <McNoData v-if="noData" :label="$t('base.noResults')"></McNoData>
      </div>
    </van-skeleton>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import _ from 'lodash'
import PNNumber from '@/components/PNNumber.vue'
import { McNoData, McTabs } from '@/components'
import HomePerpetualMixin from '@/template/components/Home/HomePerpetualMixin'
import { McMPagination, McMRadioGroupTabs, McMTokenPairView } from '@/mobile/components'
import { CHAIN_SYMBOL, currentChainConfig } from '@/config/chain'
import { PerpetualState } from '@mcdex/mai3.js'

@Component({
  components: {
    McMPagination,
    PNNumber,
    McNoData,
    McMRadioGroupTabs,
    McTabs,
    McMTokenPairView,
  },
  filters: {
    shortChain: (chain: CHAIN_SYMBOL) => {
      if (chain === 'BSC') {
        return 'BSC'
      } else if (chain === 'ARB_TESTNET' || chain === 'ARB') {
        return 'Arbitrum'
      } else if (chain === 'OPTIMISM_TESTNET' || chain === 'OPTIMISM') {
        return 'OPTIMISTIC'
      }
      return chain
    },
  },
})
export default class PerpetualContract extends Mixins(HomePerpetualMixin) {
  @Prop({ default: '' }) private propSearchKey!: string
  @Prop({ default: true }) isShowPagination!: Boolean
  @Prop({ default: 10 }) pageSize!: number
  private currentPage: number = 1
  private currentChainConfig = currentChainConfig
  private searchInputIsFocus: boolean = false
  private currentChainId = currentChainConfig.chainID

  get itemNumber() {
    return this.tableBody.length
  }

  get totalPage() {
    return Math.ceil(this.itemNumber / this.pageSize)
  }

  get offset() {
    return Math.max((this.currentPage - 1) * this.pageSize, 0)
  }

  get perpetualList() {
    return _.slice(this.tableBody, this.offset, this.offset + this.pageSize)
  }

  showStatePrompt(state: PerpetualState) {
    if (state === PerpetualState.EMERGENCY) {
      this.$toast(this.$t('home.emergencyPrompt').toString())
    } else if (state === PerpetualState.CLEARED) {
      this.$toast(this.$t('home.clearedPrompt').toString())
    }
  }

  toTrade(item: any) {
    if (item.chain === currentChainConfig.chainSymbol) {
      this.$router.push({ name: 'trade', params: { symbol: item.symbol } })
    }
  }

  @Watch('propSearchKey', { immediate: true })
  onPropSearchKeyChanged() {
    this.searchKey = this.propSearchKey
  }
}
</script>

<style scoped lang="scss">
@import '~@mcdex/style/common/var';
.perpetual-contract {
  .chain-selector {
    border-bottom: 1px solid var(--mc-border-color);

    .mc-tabs {
      height: 56px;
      line-height: 56px;

      ::v-deep .select-bar {
        margin-top: -4px !important;
        height: 4px !important;
      }

      ::v-deep .tab-item {
        font-size: 16px;
      }
    }
  }

  .search {
    margin: 16px 0;

    .search-input-box {
      &.search-input-box-focus {
        border-radius: 12px;
        background: var(--mc-color-primary-gradient);
        height: 52px;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      ::v-deep .van-field__left-icon {
        margin-right: 8px;
      }
    }

    .search-input {
      height: 52px;
      line-height: 52px;
      width: 100%;
      border: 1px solid;
      border-radius: 12px;
      border-color: var(--mc-border-color);
      background: var(--mc-background-color-dark);
      padding: 0 16px;

      &.search-input-focus {
        border: unset;
        height: 50px;
        width: calc(100% - 2px);

        .icon-search-bold {
          color: var(--mc-text-color-white);
        }
      }

      ::v-deep {
        input::-webkit-input-placeholder{
          color: var(--mc-text-color-dark);
        }
      }
    }

    .icon-search-bold {
      font-size: 16px;
      color: var(--mc-text-color-dark);
    }
  }

  .van-skeleton {
    flex: 1;
    overflow-y: scroll;
    .van-skeleton__row {
      height: 50px;
      width: 100%;
    }
  }

  .perpetual-item {
    position: relative;
    height: 241px;
    width: 100%;
    padding-bottom: 76px;
    margin-bottom: 16px;

    &:last-of-type {
      margin-bottom: 0;
    }

    .info-box {
      position: relative;
      width: 100%;
      height: 100%;
      border: 1px solid var(--mc-border-color);
      border-radius: 12px;
      z-index: 5;
      background: var(--mc-background-color-dark);
      padding: 24px 16px 16px;

      .perpetual-tag {
        position: absolute;
        top: 0;
        left: 0;
        height: 22px;
        background: rgba($--mc-color-warning, 0.1);
        font-size: 12px;
        line-height: 16px;
        color: var(--mc-color-warning);
        border-radius: 12px 0 8px 0;
        padding: 3px 8px;
      }

      .value {
        color: var(--mc-text-color-white);
        font-size: 14px;
        line-height: 20px;
      }

      .liquidity-value {
        line-height: 22px;
      }

      .text {
        color: var(--mc-text-color);
        font-size: 12px;
        height: 22px;
        line-height: 22px;
      }

      .top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 24px;
        border-bottom: 1px solid var(--mc-border-color);

        .left {
          display: flex;

          .mc-m-token-pair-view {
            margin-right: 8px;
          }

          .name-box {
            font-size: 14px;
            line-height: 22px;

            .chain {
              color: var(--mc-text-color);
            }
          }

          .symbol {
            font-size: 12px;
            height: 22px;
            display: flex;
            align-items: center;
            color: var(--mc-text-color);
          }
        }

        .right {
          text-align: right;
        }
      }

      .bottom {
        display: flex;
        justify-content: space-between;
        width: 100%;
        margin-top: 16px;

        .info-item:last-of-type {
          text-align: right;
        }
      }
    }

    .button-box {
      position: absolute;
      bottom: 0;
      border: 1px solid var(--mc-border-color);
      border-radius: 0 0 12px 12px;
      width: 100%;
      height: 86px;
      padding: 24px 16px 16px;
      z-index: 4;
      display: flex;
      justify-content: space-between;
      background: var(--mc-background-color-darkest);

      .van-button {
        width: 100%;
        height: 44px;
        border-radius: 12px;
        font-size: 16px;
        margin-left: 12px;

        &:first-of-type {
          margin-left: 0;
        }
      }

      .info {
        background: var(--mc-background-color);
      }
    }
  }

  .nodata {
    height: 200px;
  }

  .split-line {
    width: 100%;
    height: 1px;
    background-color: var(--mc-border-color);
  }
}
</style>

