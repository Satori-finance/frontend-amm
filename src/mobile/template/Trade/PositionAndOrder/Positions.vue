<template>
  <div class="positions">
    <McMLoading :loading="loading">
      <van-list v-if="!noData" :value="loading">
        <div class="item-container">
          <div v-for="item in tableBody" :key="item.symbol" class="position-item">
            <div class="symbol-container flex-box">
              <div class="left" @click="switchContract(item.symbolStr)">
                <McMTokenPairView :collateral-address="item.collateralAddress" :underlying-icon-size="28"
                                  :underlying-symbol="item.underlyingSymbol" :size="34"/>
                <div class="symbol-info">
                  <div class="line1">{{ item.name }}</div>
                  <div class="line2">
                    {{ item.symbolStr }} <span class="inverse-card" v-if="item.isInverse">{{
                      $t('base.inverse')
                    }}</span>
                  </div>
                </div>
              </div>
              <div class="right">
                <div class="line1">
                  <span class="margin-ratio-box" :class="getMarginRatioClass(item)" v-if="!item.isCleared || !item.isEmergency">
                    <svg class="svg-icon" aria-hidden="true">
                      <use :xlink:href="getMarginRatioIcon(item)"></use>
                    </svg>
                    <McMTooltip :content="$t('hintInfos.positionsAndOrders.marginRatioPrompt')">
                      <span>{{ $t('base.marginRatio') }}: </span>
                    </McMTooltip>
                    <span v-if="item.isCleared || item.isEmergency || item.size.eq(0) ||
                      !item.selectedPerpetualAmmIsSafe || item.selectedPerpetualOracleIsTerminated"
                          class="line-text-right">--</span>
                    <span v-else class="line-text-right">{{ item.marginRatio.times(100) | bigNumberFormatter(1) }}%</span>
                  </span>
                </div>
                <div class="line2">
                  <div v-if="item.isCleared">--</div>
                  <div v-else>
                    <span class="side-box" :class="getSideClass(item)">
                      <span class="short">{{ $t('base.short') }} {{ item.contractSymbol }}</span>
                      <span class="long">{{ $t('base.long') }} {{ item.contractSymbol }}</span>
                    </span>
                    <span> /
                      <McMTooltip>
                        <div slot="content" v-html="$t('hintInfos.positionsAndOrders.levPrompt')"></div>
                        {{ $t('base.isolated') }} {{ item.targetLeverage | bigNumberFormatterTruncateByPrecision(2, 2) }}x
                      </McMTooltip>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="infos">
              <van-row>
                <van-col span="9">
                  <div class="info-item">
                    <div class="label">
                      <McMTooltip>
                        <div slot="content"><span v-html="$t('hintInfos.positionsAndOrders.size')"></span></div>
                        <span>{{ $t('base.positionSize') }} ({{ item.underlyingSymbol }})</span>
                      </McMTooltip>
                    </div>
                    <div class="value" v-if="item.isCleared">--</div>
                    <div v-else class="value" :class="{ [item.side]: !item.size.eq(0) }">
                      {{
                        (item.size ? item.size.abs() : null)
                          | bigNumberFormatter(item.size.eq(0) ? 0 : item.underlyingFormatDecimals)
                      }}
                    </div>
                  </div>
                </van-col>
                <van-col span="9">
                  <div class="info-item">
                    <div class="label">{{ $t('base.notionalSize') }} ({{ item.collateralSymbol }})</div>
                    <div class="value" v-if="item.isCleared">--</div>
                    <div v-else class="value">
                      {{ item.positionValue | bigNumberFormatter(item.size.eq(0) ? 0 : item.collateralFormatDecimals) }}
                    </div>
                  </div>
                </van-col>
                <van-col span="6">
                  <div class="info-item">
                    <div class="label">
                      <McMTooltip :content="$t('hintInfos.positionsAndOrders.margin')">
                        <span>{{ $t('base.margin') }}</span>
                      </McMTooltip>
                    </div>
                    <div class="value">
                      <template v-if="item.isEmergency && !item.isCleared">{{ $t('base.clearing') }}</template>
                      <template v-else-if="item.isCleared">--</template>
                      <template v-else>
                        <template v-if="item.margin">
                          <span>{{ item.margin | bigNumberFormatter(item.collateralFormatDecimals) }} </span>
                        </template>
                        <span v-else>N/A</span>
                      </template>
                    </div>
                  </div>
                </van-col>
              </van-row>

              <van-row>
                <van-col span="9">
                  <div class="info-item">
                    <div class="label">
                      <McMTooltip :content="$t('hintInfos.positionsAndOrders.entryPrice')">
                        <span>{{ $t('tableTitle.entryPrice') }}</span>
                      </McMTooltip>
                    </div>
                    <div class="value">
                      <template v-if="item.isCleared || item.isEmergency || item.size.eq(0) ||
                       !item.selectedPerpetualAmmIsSafe || item.selectedPerpetualOracleIsTerminated">--
                      </template>
                      <span v-else-if="item.entryPrice">{{
                          item.entryPrice | priceFormatter(item.isInverse) | bigNumberFormatter(item.priceFormatDecimals)
                        }}</span>
                      <i class="el-icon-loading" v-else></i>
                    </div>
                  </div>
                </van-col>
                <van-col span="9">
                  <div class="info-item">
                    <div class="label">
                      <McMTooltip :content="$t('hintInfos.positionsAndOrders.markPrice')">
                        <span>{{ $t('tableTitle.markPrice') }}</span>
                      </McMTooltip>
                    </div>
                    <div class="value">
                      <div v-if="item.isCleared || item.isEmergency || item.size.eq(0) ||
                       !item.selectedPerpetualAmmIsSafe || item.selectedPerpetualOracleIsTerminated">--
                      </div>
                      <span v-else-if="item.markPrice">{{
                          item.markPrice | priceFormatter(item.isInverse) | bigNumberFormatter(item.priceFormatDecimals)
                        }}</span>
                      <span v-else>N/A</span>
                    </div>
                  </div>
                </van-col>
                <van-col span="6">
                  <div class="info-item">
                    <div class="label">
                      <McMTooltip :content="$t('hintInfos.positionsAndOrders.liqPrice')">
                        <span>{{ $t('tableTitle.liqPrice') }}</span>
                      </McMTooltip>
                    </div>
                    <div class="value">
                      <div v-if="item.isCleared || item.isEmergency || item.size.eq(0) ||
                       !item.selectedPerpetualAmmIsSafe || item.selectedPerpetualOracleIsTerminated">--
                      </div>
                      <span
                        v-else-if="item.liquidationPrice"
                        :class="{ infinity: !formatPrice(item.liquidationPrice, item.isInverse).isFinite() }"
                      >{{
                          item.liquidationPrice
                            | priceFormatter(item.isInverse)
                            | bigNumberFormatter(item.priceFormatDecimals)
                        }}</span
                      >
                    </div>
                  </div>
                </van-col>
              </van-row>

              <van-row>
                <van-col span="9">
                  <div class="info-item">
                    <div class="label">
                      <McMTooltip :content="$t('hintInfos.positionsAndOrders.funding')">
                        <span>{{ $t('tableTitle.funding') }}</span>
                      </McMTooltip>
                    </div>
                    <div class="value">
                      <template v-if="item.isCleared || item.isEmergency || item.size.eq(0) ||
                       !item.selectedPerpetualAmmIsSafe || item.selectedPerpetualOracleIsTerminated">--
                      </template>
                      <template v-else>
                        <PNNumber
                          v-if="item.fundingRevenue"
                          :number="item.fundingRevenue"
                          :decimals="3"
                          show-plus-sign
                        />
                        <i class="el-icon-loading" v-else></i>
                      </template>
                    </div>
                  </div>
                </van-col>
                <van-col span="15">
                  <div class="info-item">
                    <div class="label">
                      <McMTooltip :content="$t('hintInfos.positionsAndOrders.positionPnl')">
                        <span>{{ $t('tableTitle.pnl') }} ({{ $t('tableTitle.roe') }}%)</span>
                      </McMTooltip>
                    </div>
                    <div class="value" v-if="item.isCleared || item.isEmergency || item.size.eq(0) ||
                       !item.selectedPerpetualAmmIsSafe || item.selectedPerpetualOracleIsTerminated">--
                    </div>
                    <div v-else class="value">
                      <template v-if="item.pnl && item.roe">
                        <PNNumber :number="item.pnl" :decimals="item.collateralFormatDecimals" show-plus-sign/>
                        <PNNumber
                          :number="item.roe.times(100)"
                          :decimals="1"
                          prefix="("
                          suffix="%)"
                          :showPlusSign="true"
                          :roundingMode="BigNumber.ROUND_UP"
                        />
                      </template>
                      <i class="el-icon-loading" v-else></i>
                    </div>
                  </div>
                </van-col>
              </van-row>
            </div>
            <template v-if="item.isEmergency">
              <van-row gutter="12">
                <van-col span="24">
                  <van-button size="small" class="operation-btn btn-clear" @click="switchContract(item.symbolStr)"
                  >{{ $t('base.clear') }}
                  </van-button>
                </van-col>
              </van-row>
            </template>
            <template v-else-if="item.isCleared">
              <van-row gutter="12">
                <van-col span="24">
                  <van-button size="small" class="operation-btn btn-withdraw" @click="switchContract(item.symbolStr)"
                  >{{ $t('base.withdraw') }}
                  </van-button>
                </van-col>
              </van-row>
            </template>
            <template v-else-if="!item.selectedPerpetualAmmIsSafe || item.selectedPerpetualOracleIsTerminated">
              <van-row gutter="12">
                <van-col span="24">
                  <van-button size="small" class="operation-btn btn-clear" @click="switchContract(item.symbolStr)"
                  >{{ $t('base.readyToEmergency') }}
                  </van-button>
                </van-col>
              </van-row>
            </template>
            <template v-else-if="item.size.eq(0)">
              <van-row gutter="12">
                <van-col span="24">
                  <van-button size="small" class="operation-btn" @click="showChangeMarginPopup(item, 'withdraw')"
                  >{{ $t('base.marginRemove') }}
                  </van-button>
                </van-col>
              </van-row>
            </template>
            <template v-else>
              <van-row gutter="12">
                <van-col span="12">
                  <van-button
                    size="small"
                    class="operation-btn"
                    @click="showChangeMarginPopup(item)"
                    :disabled="item.isEmergency || item.isCleared"
                  >{{ $t('base.addRemoveMargin') }}
                  </van-button>
                </van-col>
                <van-col span="12">
                  <van-button
                    size="small"
                    class="operation-btn"
                    @click="closePosition(item)"
                    :disabled="item.isMarketClose || item.isEmergency || item.isCleared || !item.isMarginSafe"
                  >{{ $t('base.marketClose') }}
                  </van-button>
                </van-col>
              </van-row>
            </template>
          </div>
        </div>
      </van-list>
      <div v-else class="empty-container">
        <McMNoData/>
      </div>
    </McMLoading>

    <OrderConfirmPopup
      :order-confirm-params="closeOrderConfirmParams"
      :visible.sync="showCloseDialog"
      :confirm-func="onClosePositionEvent"
      :trade-state.sync="tradeState"
      @closed="onClosedOrderConfirmDialog"
      :slippage.sync="setSlippageTolerance"
      :default-slippage="closeDefaultSlippageTolerance"
      :is-insufficient-liquidity="selectedIsInsufficientLiquidity"
      @setMaxAvailableAmount="setMaxAvailableTradeAmount"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import PositionsMixin from '@/template/components/Position/positionsMixin'
import { namespace } from 'vuex-class'
import { formatPrice, padLeft } from '@/utils'
import { McMNoData, McMTooltip, McMLoading, McMTokenPairView } from '@/mobile/components'
import { PNNumber } from '@/components'
import OrderConfirmPopup from '@/mobile/template/Trade/OrderConfirmPopup.vue'
import { ACCOUNT_EVENT, VUE_EVENT_BUS } from '@/event'
import { ROUTE } from '@/router'

const activePerpetuals = namespace('activePerpetuals')

@Component({
  components: {
    McMNoData,
    PNNumber,
    OrderConfirmPopup,
    McMTooltip,
    McMLoading,
    McMTokenPairView,
  },
})
export default class Positions extends Mixins(PositionsMixin) {
  @activePerpetuals.State('selectedPerpetualID') selectedPerpetualID!: string | null
  formatPrice = formatPrice
  padLeft = padLeft

  showChangeMarginPopup(item: any, operateType = 'deposit') {
    VUE_EVENT_BUS.emit(ACCOUNT_EVENT.CHANGE_MARGIN, { perpetualID: item.perpetualID, type: operateType })
  }

  switchContract(symbolStr: string | null) {
    if (!symbolStr) {
      return
    }
    if (this.$route.name === ROUTE.TRADE_MAIN && this.$route.params.symbol === symbolStr) {
      return
    }
    this.$router.push({ name: ROUTE.TRADE_MAIN, params: { symbol: symbolStr } })
  }
}
</script>

<style lang="scss" scoped>
@import "~@mcdex/style/common/fantasy-var";
.positions {
  ::v-deep {
    .mc-m-loading {
      .loading-content {
        min-height: 180px;
      }
    }
  }

  .position-item {
    margin: 16px 0 0 0;
    padding-bottom: 16px;
    box-shadow: inset 0px -1px 0px #1A2136;

    &:last-of-type {
      box-shadow: none;
    }

    .line-text-right {
      margin-left: 2px;
    }

    .symbol-container {
      .left {
        display: flex;
        align-items: center;

        .symbol-info {
          margin-left: 8px;
          font-size: 12px;

          .line1 {
            color: var(--mc-text-color-white);
            line-height: 22px;
          }

          .line2 {
            color: var(--mc-text-color);
            line-height: 22px;
          }
        }
      }

      .right {
        font-size: 12px;

        .margin-ratio-box {
          display: flex;
          align-items: center;
          justify-content: flex-end;

          .svg-icon {
            width: 16px;
            height: 14px;
          }
        }

        .line1 {
          color: var(--mc-text-color);
        }

        .line1, .line2 {
          line-height: 22px;
        }

        .side-box {
          &.is-long {
            .long {
              color: var(--mc-color-blue);
            }
            .short {
              display: none;
            }
          }

          &.is-short {
            .long {
              display: none;
            }
            .short {
              color: var(--mc-color-orange);
            }
          }
        }
      }
    }

    .infos {
      margin: 12px 0 16px 0;
      font-size: 12px;
      line-height: 14px;

      .van-row {
        &:not(:last-of-type) {
          margin-bottom: 12px;
        }

        .van-col {
          &:nth-child(3) {
            text-align: right;
          }
        }
      }

      .info-item {
        line-height: 16px;

        .label {
          color: var(--mc-text-color);
          margin-bottom: 4px;
        }
      }
    }

    .operation-btn {
      width: 100%;
      background: rgba($--mc-color-primary, 0.2);
      color: var(--mc-color-primary);
      border-radius: var(--mc-border-radius-m);
      font-size: 12px;
    }

    .btn-withdraw {
      color: var(--mc-color-orange);
      background: rgba($--mc-color-orange, 0.2);
    }

    .btn-clear {
      color: var(--mc-color-warning);
      background: rgba($--mc-color-warning, 0.2);
    }
  }

  .empty-container {
    padding: 32px 0;
  }
}

.dim-color {
  color: var(--mc-text-color);

  .svg-icon {
    margin-right: 5px;
    fill-opacity: 0.5;
  }

  ::v-deep .mcm-tooltip__reference {
    text-decoration: underline dashed var(--mc-text-color);
  }
}

.green-color {
  .line-text-right {
    color: var(--mc-color-success);
  }

  .svg-icon {
    margin-right: 4px;
  }
}

.yellow-color {
  .line-text-right {
    color: var(--mc-color-warning);
  }

  .svg-icon {
    margin-right: 5px;
  }
}

.red-color {
  .line-text-right {
    color: var(--mc-color-error);
  }

  .svg-icon {
    margin-right: 5px;
  }
}

.flex-box {
  display: flex;
  justify-content: space-between;
}
</style>
