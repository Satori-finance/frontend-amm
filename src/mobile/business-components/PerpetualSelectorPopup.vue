<template>
  <van-popup
    class="perpetual-selector-popup safe-area-inset-bottom"
    v-model="show"
    position="left"
    safe-area-inset-bottom
    get-container="body"
  >
    <div class="head">
      <span class="title">{{ $t('base.perpetualContract') }}</span>
      <van-icon name="cross" @click="closePopup" />
    </div>
    <div class="type-box">
      <div class="tabs">
        <div
          class="tab-item"
          @click="
            tempPerpetualType = 'certified'
            onCloseUncertifiedPopover()
          "
          :class="{ 'is-selected': perpetualType === 'certified' }"
        >
          <span class="label">{{ $t('base.certified') }}</span>
        </div>
        <div
          class="tab-item"
          @click="onShowUncertifiedPopover"
          :class="{ 'is-selected': perpetualType === 'uncertified' }"
        >
          <span class="label uncertified">{{ $t('base.uncertified') }}</span>
          <div class="tooltip-box" ref="iconInfo">
            <svg class="svg-icon" aria-hidden="true">
              <use :xlink:href="`#icon-help`"></use>
            </svg>
          </div>
        </div>
      </div>
      <div class="uncertified-market-popover" v-if="showUncertifiedPopover">
        <div class="uncertified-market-popover-box">
          <div class="arrow" :style="{ left: arrowLeft }"></div>
          <div class="content">{{ $t('perpetualSearch.uncertifiedMarketPrompt') }}</div>
          <div class="button-box">
            <div class="close-button" @click="onCloseUncertifiedPopover">{{ $t('base.close') }} ({{ showTime }})</div>
          </div>
        </div>

      </div>
    </div>

    <div class="search">
      <div class="search-input-box" :class="{'search-input-box-focus': searchInputIsFocus}">
        <van-field class="search-input" :class="{'search-input-focus': searchInputIsFocus}"
                   :placeholder="$t('pool.poolList.searchTip')" v-model.trim="tempSearchKey"
                   @focus="searchInputIsFocus=true" @blur="searchInputIsFocus=false">
          <template slot="left-icon">
            <i class="iconfont icon-search-bold"></i>
          </template>
        </van-field>
      </div>
    </div>

    <div class="perpetual-list">
      <McLoading :show-loading="loading" :min-show-time="500" :delay="0">
        <div class="table-head">
          <div>{{ $t('base.contract') }}</div>
          <div v-if="tempPerpetualType==='uncertified'" class="is-left">{{ $t('base.price') }} & {{ $t('base.liquidity') }}</div>
          <div v-else-if="tempPerpetualType==='certified'" class="is-left">{{ $t('base.price') }} & {{ $t('base.volume') }}</div>
        </div>
        <div class="table-body">
          <McMNoData v-if="noData" />
          <table v-else>
            <tbody>
            <tr v-for="(item, index) in tableBody" :key="index" @click="switchContract(item)">
              <td class="left">
                <div class="symbol-box">
                  <McMTokenPairView :collateral-address="item.collateralAddress"
                                    :underlying-symbol="item.underlyingSymbol" :size="36"/>
                  <div>
                    <div class="name">{{ item.name }}</div>
                    <div class="symbol">
                      <div>{{ item.symbolStr }}</div>
                      <div v-if="item.isInverse" class="inverse">{{ $t('base.inverse') }}</div>
                    </div>
                  </div>
                </div>
              </td>
              <td class="right">
                <template>
                  <div v-if="!item.price" class="value">---</div>
                  <div v-else class="value">
                    <span>{{ item.price | priceFormatter(item.isInverse) | bigNumberFormatterByPrecision }} </span>
                    <span>{{ item.isInverse?item.underlyingSymbol:item.collateralTokenSymbol }}</span>
                  </div>
                </template>
                <div v-if="tempPerpetualType==='uncertified'">
                  <template v-if="item.liquidityAmountUSD.gt(0)">
                    <div class="value">${{ item.liquidityAmountUSD | liquidityFormatter }}</div>
                  </template>
                  <template v-else-if="item.isInverse">
                    <span class="value">{{ item.liquidityAmount | inverseLiquidityFormatter(item.price) | liquidityFormatter }}
                      {{ item.underlyingSymbol }}</span>
                  </template>
                  <template v-else>
                    <div class="value">
                      {{ item.liquidityAmount | liquidityFormatter }} {{ item.collateralTokenSymbol }}
                    </div>
                  </template>
                </div>
                <div v-else-if="tempPerpetualType==='certified'">
                  <template>
                    <div v-if="!item.deltaTotalVolumeUSD" class="value">---</div>
                    <div v-else class="value">
                      <template v-if="item.deltaTotalVolumeUSD.isZero() && !item.deltaTotalVolume.isZero()">
                        {{ item.deltaTotalVolume | bigNumberFormatterByPrecision }} {{ item.collateralTokenSymbol }}
                      </template>
                      <template v-else>
                        ${{ item.deltaTotalVolumeUSD | bigNumberFormatterByPrecision }}
                      </template>
                    </div>
                  </template>
                </div>
              </td>
            </tr>
            </tbody>
          </table>
        </div>

      </McLoading>
    </div>
  </van-popup>
</template>
<script lang="ts">
import { Component, Mixins, Ref, Watch } from 'vue-property-decorator'
import { VUE_EVENT_BUS } from '@/event'
import { COMMON_EVENT } from '@/mobile/event'
import { namespace } from 'vuex-class'
import { PerpetualSelectorMixin } from '@/business-components/PerpetualSelector/perpetualSelectorMixin'
import { McLoading, PNNumber } from '@/components'
import { McMNoData, McMRadioGroupTabs, McMTokenPairView } from '@/mobile/components'
import { padLeft } from '@/utils'
import { DEFAULT_SYMBOL_LENGTH } from '@/constants'
import { ROUTE } from '@/mobile/router'
import BigNumber from 'bignumber.js'
import { _1 } from '@mcdex/mai3.js'

const wallet = namespace('wallet')

@Component({
  components: {
    McLoading,
    McMNoData,
    PNNumber,
    McMRadioGroupTabs,
    McMTokenPairView,
  },
  filters: {
    inverseLiquidityFormatter(val: BigNumber, price: BigNumber) {
      if (!val) {
        return
      }
      return _1.div(price).times(val)
    },
  }
})
export default class PerpetualSelectorPopup extends Mixins(PerpetualSelectorMixin) {
  @Ref('iconInfo') iconInfo!: HTMLElement

  show = false
  showUncertifiedPopover = false
  arrowLeft = '0px'
  uncertifiedPopoverTimer = 0
  showTime = 0
  private searchInputIsFocus: boolean = false

  get tempPerpetualType() {
    return this.perpetualType
  }

  set tempPerpetualType(val: 'certified' | 'uncertified') {
    this.setPerpetualType(val)
  }

  get tempSearchKey() {
    return this.searchKey
  }

  set tempSearchKey(val: string) {
    this.setSearchKey(val)
  }

  mounted() {
    VUE_EVENT_BUS.on(COMMON_EVENT.SHOW_SELECT_PERPETUAL_POPUP, this.showPopup)
  }

  destroyed() {
    VUE_EVENT_BUS.off(COMMON_EVENT.SHOW_SELECT_PERPETUAL_POPUP, this.showPopup)
  }

  showPopup() {
    this.show = true
  }

  closePopup() {
    this.show = false
    this.onCloseUncertifiedPopover()
  }

  onCloseUncertifiedPopover() {
    this.showUncertifiedPopover = false
    this.showTime = 0
    window.clearInterval(this.uncertifiedPopoverTimer)
  }

  onShowUncertifiedPopover() {
    if (this.perpetualType === 'uncertified') {
      return
    }
    const { x: iconX } = this.iconInfo.getBoundingClientRect()
    this.arrowLeft = `${iconX - 16 + 2.5}px`
    this.showTime = 10
    this.tempPerpetualType = 'uncertified'
    this.showUncertifiedPopover = true
    this.uncertifiedPopoverTimer = window.setInterval(() => {
      this.showTime--
      if (this.showTime === 0) {
        this.onCloseUncertifiedPopover()
      }
    }, 1000)
  }

  @Watch('tableBody')
  private updateValue() {
    if (!this.tableBody || this.tableBody.length <= 0 || this.selectedPerpetualID) {
      return
    }
    this.switchContract({ symbol: this.tableBody[0].symbol })
  }

  private switchContract(item: { symbol: number }) {
    const symbolStr = padLeft(item.symbol, DEFAULT_SYMBOL_LENGTH)
    if (this.$route.name === ROUTE.TRADE_MAIN) {
      if (this.$route.params.symbol !== symbolStr) {
        this.$router.push({ name: ROUTE.TRADE_MAIN, params: { symbol: symbolStr } })
      }
      this.show = false // auto hide after select
    } else if (this.$route.name === ROUTE.TRADE_CHART_INFO) {
      if (this.$route.params.symbol !== symbolStr) {
        this.$router.push({ name: ROUTE.TRADE_CHART_INFO, params: { symbol: symbolStr } })
      }
      this.show = false // auto hide after select
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~@mcdex/style/common/var';

.perpetual-selector-popup {
  height: 100%;
  width: 320px;
  color: var(--mc-text-color);
  border: unset;

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 16px 0 16px;

    .title {
      font-size: 18px;
      font-weight: 400;
      line-height: 20px;
      color: var(--mc-text-color-white);
      padding: 0;
    }

    .van-icon {
      color: white;
      font-size: 24px;
      opacity: 0.75;
    }
  }

  .type-box {
    position: relative;
    margin-bottom: 16px;
    margin-top: 28px;
    padding: 0 16px;

    .tabs {
      display: flex;
      justify-content: space-around;
      height: 48px;
      width: 100%;
      background: var(--mc-background-color-darkest);
      border-radius: 12px;
    }

    .tab-item {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      width: 100%;
      line-height: 48px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 400;
      color: var(--mc-text-color);

      .tooltip-box {
        width: 13px;
        height: 13px;
        line-height: 13px;
        text-align: center;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: 5.5px;
        background-color: #3c486a;

        .svg-icon {
          width: 9px;
          height: 7px;
          color: var(--mc-text-color-white);
        }
      }
    }

    .label {
      border-radius: 8px;
    }

    .is-selected {
      background: var(--mc-background-color);
      color: var(--mc-text-color-white);
    }

    .uncertified-market-popover {
      position: absolute;
      width: calc(100% - 32px);
      top: calc(100% - 8px);
      background: var(--mc-color-primary-gradient);
      z-index: 99;
      padding: 1px;
      border-radius: var(--mc-border-radius-l);

      .uncertified-market-popover-box {
        background: var(--mc-background-color-darkest);
        border-radius: var(--mc-border-radius-l);
        padding: 16px;
        font-size: 14px;
        line-height: 20px;
        color: var(--mc-text-color-white);

        .arrow {
          position: absolute;
          background: var(--mc-color-primary-gradient);
          bottom: calc(100% - 4.5px);
          width: 9px;
          height: 9px;
          transform: rotate(45deg) skew(10deg, 10deg);
          border-top-left-radius: 3px;

          &::after {
            content: '';
            position: absolute;
            width: 9px;
            height: 9px;
            left: 1px;
            top: 1px;
            background: var(--mc-background-color-darkest);
            border-top-left-radius: 2px;
          }
        }

        .button-box {
          text-align: right;
          margin-top: 12px;

          .close-button {
            display: inline-block;
            min-width: 78px;
            height: 32px;
            padding: 7px 15px;
            font-size: 12px;
            line-height: 16px;
            border: 1px solid var(--mc-border-color);
            border-radius: var(--mc-border-radius-m);
          }
        }
      }
    }
  }

  .search {
    margin-bottom: 16px;
    padding: 0 16px;

    .search-input-box {
      &.search-input-box-focus {
        border-radius: 12px;
        background: linear-gradient(90deg, #00d8e2 0%, #27a2f8 100%);
        height: 52px;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
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

        .van-field__left-icon {
          margin-right: 8px;
        }
      }
    }

    .icon-search-bold {
      font-size: 16px;
      color: var(--mc-text-color-dark);
    }
  }

  .perpetual-list {
    height: calc(100% - 201px);

    .mc-loading {
      height: 100%;

      .table-head {
        display: flex;
        justify-content: space-between;
        padding: 8px 16px;
        font-size: 14px;
        line-height: 20px;
        border-bottom: 1px solid #1A2136;
      }

      .table-body {
        height: calc(100% - 37px);
        overflow-y: auto;
      }

      .no-data {
        padding-top: 120px;
      }

      table {
        width: 100%;
        border-collapse: collapse;

        td,
        th {
          text-align: right;

          &:first-of-type {
            text-align: left;
          }
        }

        tbody {
          tr {
            border-bottom: 1px solid #1A2136;

            .left {
              padding-left: 16px;
            }

            .right {
              padding-right: 16px;
            }
          }

          td {
            padding: 8px 0;
            font-size: 12px;
            line-height: 22px;
            color: var(--mc-text-color-white);

            .symbol-box {
              display: flex;
              align-items: center;

              .mc-m-token-pair-view {
                margin-right: 8px;
              }

              .symbol {
                display: flex;
                align-items: center;
                color: var(--mc-text-color);

                .inverse {
                  width: 56px;
                  height: 22px;
                  font-size: 12px;
                  line-height: 14px;
                  color: var(--mc-color-orange);
                  background: rgba($--mc-color-orange, 0.1);
                  border: 1px solid rgba($--mc-color-orange, 0.1);
                  padding: 3px 7px;
                  border-radius: 8px;
                  font-weight: 400;
                  margin-left: 4px;
                }
              }
            }
          }
        }
      }
    }
  }
}
</style>
