<template>
  <div class="contract-selector">
    <el-popover ref="selector" placement="bottom-start" width="400" :visible-arrow="false"
                popper-class="contract-selector-popover fantasy" v-model="visible" trigger="manual">
      <div class="search-box popover-content">
        <div class="tab-box">
          <el-radio-group class="type-selector" v-model="tempPerpetualType">
            <el-radio-button label="certified">{{ $t('base.certified') }}</el-radio-button>
            <el-radio-button label="uncertified">
              {{ $t('base.uncertified') }}
              <el-tooltip :content="$t('perpetualSearch.uncertifiedMarketPrompt')" placement="top">
                <div class="icon-container">
                  <svg class="svg-icon" aria-hidden="true">
                    <use xlink:href="#icon-help"></use>
                  </svg>
                </div>
              </el-tooltip>
            </el-radio-button>
          </el-radio-group>
        </div>
        <div class="search">
          <el-input size="large" v-model.trim="tempSearchKey" clearable
                    :placeholder="$t('perpetualSearch.placeholder')">
            <template slot="prefix"><i class="el-icon-search"></i></template>
          </el-input>
        </div>
        <div class="list">
          <McLoading :show-loading="loading" :min-show-time="500" v-fixed-table>
            <table class="mc-data-table is-mini fixed-table" :class="{ 'no-data-table': noData }">
              <thead>
                <tr>
                  <th class="is-left">{{ $t('base.contract') }}</th>
                  <th v-if="tempPerpetualType==='uncertified'" class="is-left">{{ $t('base.liquidity') }}</th>
                  <th v-else-if="tempPerpetualType==='certified'" class="is-left">{{ $t('base.volume/24H') }}</th>
                  <th class="is-right">{{ $t('base.price') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="noData">
                  <td colspan="100">
                    <McNoData></McNoData>
                  </td>
                </tr>
                <tr v-for="(item, index) in tableBody" :key="index" @click="switchContract(item)"
                    class="perpetual-item">
                  <td>
                    <McPerpetualSummary :collateral-address="item.collateralAddress"
                                        :underlying-symbol="item.underlyingSymbol" :name="item.name"
                                        :symbol="item.symbolStr" :is-inverse="item.isInverse"></McPerpetualSummary>
                  </td>
                  <td v-if="tempPerpetualType==='uncertified'" class="is-left">
                    <template v-if="item.liquidityAmountUSD.gt(0)">
                      <span>$</span>
                      <span>{{ item.liquidityAmountUSD | liquidityFormatter }}</span>
                    </template>
                    <template v-else-if="item.isInverse">
                      <span class="value">{{ item.liquidityAmount | inverseLiquidityFormatter(item.price) | liquidityFormatter }}</span>
                      <span class="unit">{{ item.underlyingSymbol }}</span>
                    </template>
                    <template v-else>
                      <span class="value">{{ item.liquidityAmount | liquidityFormatter }}</span>
                      <span class="unit">{{ item.collateralTokenSymbol }}</span>
                    </template>
                  </td>
                  <td v-else-if="tempPerpetualType==='certified'" class="is-left">
                    <span v-if="!item.deltaTotalVolumeUSD">---</span>
                    <span v-else>
                      <template v-if="item.deltaTotalVolumeUSD.isZero() && !item.deltaTotalVolume.isZero()">
                        {{ item.deltaTotalVolume | bigNumberFormatterByPrecision }} {{ item.collateralTokenSymbol }}
                      </template>
                      <template v-else>
                        ${{ item.deltaTotalVolumeUSD | bigNumberFormatterByPrecision }}
                      </template>
                    </span>
                  </td>
                  <td class="is-right">
                    <template v-if="item.isInverse">
                      <span v-if="item.price" class="value">{{ item.price | priceFormatter(true) | bigNumberFormatterByPrecision }}</span>
                      <span v-if="item.price" class="unit">{{ item.underlyingSymbol }}</span>
                    </template>
                    <template v-else>
                      <span v-if="item.price" class="value">{{ item.price | bigNumberFormatterByPrecision }}</span>
                      <span v-if="item.price" class="unit">{{ item.collateralTokenSymbol }}</span>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </McLoading>
        </div>
      </div>
      <div class="selected-contract" :class="{selecting: visible}" slot="reference" @click="toggle"
           style="outline: none" v-click-outside="onClosePopover">
        <div class="container">
          <div class="left">
            <McTokenPairView :collateralAddress="selectedLiquidityPoolStorage ? selectedLiquidityPoolStorage.collateral : ''"
                             :underlyingSymbol="selectedPerpetual ? selectedPerpetual.perpetualStorage.underlyingSymbol : ''" />
          </div>
          <div class="center">
            <div class="perpetual-name">{{ selectedPerpetualProperty ? selectedPerpetualProperty.name : '' }}</div>
            <div class="perpetual-box">
              <span class="perpetual-symbol">{{
                  selectedPerpetualProperty ? selectedPerpetualProperty.symbolStr : ''
                }}</span>
              <span class="inverse-card" v-if="selectedPerpetualIsInverse">{{ $t('base.inverse') }}</span>
            </div>
          </div>
          <div class="right">
            <i class="iconfont icon-drop-down" />
          </div>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script lang="ts">
import { Component, Watch, Mixins, Ref } from 'vue-property-decorator'
import { ROUTE } from '@/router'
import { padLeft } from '@/utils'
import { McNoData, PNNumber, McLoading, McTokenPairView, McPerpetualSummary } from '@/components'
import { Popover } from 'element-ui'
import { DEFAULT_SYMBOL_LENGTH } from '@/constants'
import { PerpetualSelectorMixin } from './perpetualSelectorMixin'
import BigNumber from 'bignumber.js'
import { _1 } from '@mcdex/mai3.js'

@Component({
  components: {
    McNoData,
    PNNumber,
    McLoading,
    McTokenPairView,
    McPerpetualSummary,
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
export default class PerpetualSelector extends Mixins(PerpetualSelectorMixin) {
  @Ref('selector') selector!: Popover

  private visible = false

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

  private toggle() {
    this.visible = !this.visible
  }

  private onClosePopover() {
    this.visible = false
  }

  @Watch('tableBody')
  private updateValue() {
    if (!this.tableBody || this.tableBody.length <= 0 || this.selectedPerpetualID) {
      return
    }
    this.switchContract({ symbol: this.tableBody[0].symbol })
  }

  switchContract(item: { symbol: number }) {
    const symbolStr = padLeft(item.symbol, DEFAULT_SYMBOL_LENGTH)
    if (this.$route.name === ROUTE.TRADE_MAIN) {
      if (this.$route.params.symbol !== symbolStr) {
        this.$router.push({ name: ROUTE.TRADE_MAIN, params: { symbol: symbolStr } })
      }
      this.visible = false // auto hide after select
    }
  }
}
</script>

<style lang="scss">
.el-popper[x-placement^='bottom'].contract-selector-popover {
  margin-top: 2px;
  padding: 12px 6px;
}

.perp-warning-tooltip {
  max-width: 420px;
}
</style>

<style lang="scss" scoped>
@import '~@mcdex/style/element-fantasy/common/var';

.contract-selector {
  display: inline-block;

  .icon-drop-down {
    font-size: 14px;
  }

  .selected-contract {
    display: flex;
    cursor: pointer;

    .container {
      display: flex;
      height: 36px;
      align-items: center;

      .center {
        margin: 0 8px;
        font-size: 14px;
        line-height: 22px;

        .perpetual-box {
          display: flex;
          align-items: center;
        }
      }

      .left {
        font-size: 14px;
        display: flex;
        align-items: center;
      }

      .right {
        transition: all 0.3s;

        .icon-triangle-bottom {
          color: var(--mc-text-color);
          font-size: 10px;
        }
      }
    }

    &.selecting {
      .container .right {
        transform: rotate(180deg);
      }
    }
  }
}

.search-box {
  display: flex;
  flex-direction: column;
  padding: 16px 0;
  height: 553px;

  .tab-box {
    width: 100%;
    margin-bottom: 24px;
    padding: 0 16px;

    .type-selector {
      width: 100%;
      display: flex;

      .el-radio-button {
        flex: 1;

        .icon-container {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
          border-radius: 50%;
          margin-left: 4px;
          background-color: rgba($--mc-text-color, 0.5);

          .svg-icon {
            width: 10px;
            height: 10px;
            display: inline-block;
            color: var(--mc-text-color-white);
          }
        }

        ::v-deep .el-radio-button__inner {
          width: 100%;
        }
      }
    }
  }

  .search {
    padding: 0 16px;
    margin-bottom: 16px;

    .el-input {
      border: none;
      border-radius: var(--mc-border-radius-l);
      height: 52px;
      font-size: 14px;
      padding: 0 16px;

      ::v-deep .el-input__inner {
        height: 100%;
      }
    }
  }

  .list {
    position: relative;
    flex: 1;

    .mc-loading {
      position: absolute;
      padding: 0 16px;
      width: 100%;
      height: 100%;
    }

    .mc-loading.show {
      overflow-y: hidden;
    }
  }

  .mc-data-table {
    height: 100%;

    thead {
      font-size: 13px;
      line-height: 16px;
    }

    tbody {
      font-size: 12px;
      line-height: 16px;
      overflow-y: overlay;

      tr {
        &.perpetual-item {
          cursor: pointer;
        }
      }
    }

    td,
    th {
      &:nth-of-type(1) {
        width: 40%;
        padding-right: 8px;
      }

      &:nth-of-type(2) {
        width: 30%;
        padding: 0 8px;
      }

      &:nth-of-type(3) {
        width: 30%;
        padding: 0 8px;
      }
    }

    width: 100%;

    .symbol-box {
      display: flex;
      align-items: center;
    }

    .unit {
      display: inline-block;
    }

    .value {
      margin-right: 4px;
    }
  }
}
</style>

<style lang="scss" scoped>
.satori-fantasy {
  .selected-contract {
    .perpetual-name {
      color: var(--mc-text-color-white);
    }

    .perpetual-symbol {
      color: var(--mc-text-color);
    }

    .container {
      .left {
        color: var(--mc-text-color-white);
      }

      .right {
        .icon-triangle-bottom {
          color: var(--mc-text-color);
        }
      }
    }
  }

  .search-input {
    .el-input {
      background-color: var(--mc-background-color-dark);
    }
  }

  .search-box {
    .name,
    .unit {
      color: var(--mc-text-color-white);
    }
  }
}
</style>
