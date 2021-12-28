<template>
  <div class="position position-order-common-container">
    <McLoading :show-loading="loading" :margin="8" :hide-content="noData">
      <div class="table-box" ref="positionsRef" v-fixed-table>
        <table class="mc-data-table is-small fixed-table" :class="{ 'no-data-table': userAddress && noData }">
          <thead>
          <tr>
            <th class="is-left symbol-row">
              <el-tooltip :content="$t('hintInfos.positionsAndOrders.symbol')" placement="top" :open-delay="400">
                <span class="tip-text">{{ $t('base.contract') }}</span>
              </el-tooltip>
            </th>
            <th class="is-left">
              <span>{{ $t('base.side') }}</span>
            </th>
            <th class="is-left">
              <el-tooltip placement="top" :open-delay="400">
                <div slot="content" v-html="$t('hintInfos.positionsAndOrders.size')"></div>
                <span>{{ $t('base.size') }}</span>
              </el-tooltip>
            </th>
            <th class="is-left">
              <el-tooltip :content="$t('hintInfos.positionsAndOrders.margin')" placement="top" :open-delay="400">
                <span>{{ $t('base.margin') }}</span>
              </el-tooltip>
            </th>
            <th class="is-left">
              <el-tooltip placement="top"
                          :open-delay="400">
                <div slot="content" v-html="$t('hintInfos.positionsAndOrders.levPrompt')"></div>
                <span>{{ $t('base.lev') }}</span>
              </el-tooltip>
            </th>
            <th class="is-left">
              <el-tooltip :content="$t('hintInfos.positionsAndOrders.marginRatioPrompt')" placement="top"
                          :open-delay="400">
                <span>{{ $t('base.marginRatio') }}</span>
              </el-tooltip>
            </th>
            <th class="is-left">
              <el-tooltip :content="$t('hintInfos.positionsAndOrders.entryPrice')" placement="top" :open-delay="400">
                <span class="decoration">{{ $t('tableTitle.entryPrice') }}</span>
              </el-tooltip>
            </th>
            <th class="is-left">
              <el-tooltip placement="top" :open-delay="400">
                <div slot="content" v-html="$t('hintInfos.positionsAndOrders.markPrice')"></div>
                <span class="decoration">{{ $t('tableTitle.markPrice') }}</span>
              </el-tooltip>
            </th>
            <th class="is-left">
              <el-tooltip :content="$t('hintInfos.positionsAndOrders.liqPrice')" placement="top" :open-delay="400">
                <span class="decoration">{{ $t('tableTitle.liqPrice') }}</span>
              </el-tooltip>
            </th>
            <th class="is-left">
              <el-tooltip :content="$t('hintInfos.positionsAndOrders.funding')" placement="top" :open-delay="400">
                <span class="decoration">{{ $t('tableTitle.funding') }}</span>
              </el-tooltip>
            </th>
            <th class="is-left">
              <el-tooltip placement="top" :open-delay="400">
                <div slot="content" v-html="$t('hintInfos.positionsAndOrders.positionPnl')"></div>
                <span class="decoration">{{ $t('tableTitle.pnl') }}</span>
              </el-tooltip>
            </th>
            <th class="is-right">{{ $t('tableTitle.operation') }}</th>
          </tr>
          </thead>
          <tbody v-if="userAddress">
          <tr v-if="noData && !loading">
            <td colspan="100">
              <McNoData></McNoData>
            </td>
          </tr>
          <tr v-for="(item, index) in tableBody" :key="index">
            <td class="is-left symbol-row">
                <span class="symbol-box" @click="switchContract(item)">
                  <span>
                    <McTokenPairView :underlyingSymbol="item.underlyingSymbol"
                                     :collateralAddress="item.collateralAddress" :size="36"/>
                  </span>
                  <span class="value symbol-link more-line">
                    <span>{{ item.name }}</span>
                    <span class="newline light-color">
                      {{ `${padLeft(item.symbol, 5)}` }}
                      <span class="inverse-card" v-if="item.isInverse">{{ $t('base.inverse') }}</span>
                    </span>
                  </span>
                </span>
            </td>
            <td class="is-left">
              <div class="light-color" v-if="item.size.eq(0)">--</div>
              <div v-else class="symbol more-line">
                  <span class="side-box" :class="getSideClass(item)">
                    <span class="short">{{ $t('base.short') }}</span>
                    <span class="long">{{ $t('base.long') }}</span>
                  </span>
                <span class="unit newline light-color">{{ item.contractSymbol }}</span>
              </div>
            </td>
            <td class="is-left more-line">
              <div class="light-color" v-if="item.size.eq(0)">--</div>
              <template v-else>
                  <span class="size" :class="{ [item.side]: !item.size.eq(0) }">
                    {{
                      (item.size ? item.size.abs() : null)
                        | bigNumberFormatter(item.size.eq(0) ? 0 : item.underlyingFormatDecimals)
                    }}
                  </span>
                <span class="unit">{{ item.underlyingSymbol }}</span>
                <span class="newline">
                    <span class="light-color">{{
                        item.positionValue
                          | bigNumberFormatter(item.positionValue.eq(0) ? 0 : item.collateralFormatDecimals)
                      }}
                    </span>
                    <span class="unit light-color position-size-unit">{{ item.collateralSymbol }}</span>
                  </span>
              </template>
            </td>
            <td class="is-left">
              <div class="horizontal">
                <template v-if="item.margin">
                  <span>{{ item.margin | bigNumberFormatter(item.collateralFormatDecimals) }} </span>
                </template>
                <NA v-else/>
                <el-tooltip :class="{ 'el-tooltip-disabled': !item.isEmergency }" :disabled="!item.isEmergency"
                            :open-delay="400" :content="item.isEmergency ? $t('tradeAMM.settleStatePrompt') : ''">
                  <template v-if="
                        item.isEmergency ||
                        item.isCleared ||
                        !item.selectedPerpetualAmmIsSafe ||
                        item.selectedPerpetualOracleIsTerminated
                      ">
                    <i></i>
                  </template>
                  <template v-else>
                    <i v-if="!item.size.eq(0)" class="iconfont icon-plus-frame-round mc-icon-btn"
                       :class="{ disabled: item.isEmergency }" @click="showChangeMargin(item)"></i>
                    <i v-else class="iconfont icon-minus-frame-round mc-icon-btn"
                       :class="{ disabled: item.isEmergency }" @click="showChangeMargin(item, 'withdraw')"></i>
                  </template>
                </el-tooltip>
              </div>
            </td>
            <td class="is-left">
              {{ item.targetLeverage | bigNumberFormatterTruncateByPrecision(2, 2) }}x
            </td>
            <td class="is-left">
              <div class="light-color" v-if="
                    item.isCleared ||
                    item.isEmergency ||
                    item.size.eq(0) ||
                    !item.selectedPerpetualAmmIsSafe ||
                    item.selectedPerpetualOracleIsTerminated
                  ">
                --
              </div>
              <template v-else>
                  <span
                    :class="getMarginRatioClass(item)">{{
                      item.marginRatio.times(100) | bigNumberFormatter(item.marginRatio.eq(0) ? 0 : 1)
                    }}%
                  </span>
              </template>
            </td>
            <td class="is-left">
              <div class="light-color" v-if="
                    item.isCleared ||
                    item.isEmergency ||
                    item.size.eq(0) ||
                    !item.selectedPerpetualAmmIsSafe ||
                    item.selectedPerpetualOracleIsTerminated
                  ">
                --
              </div>
              <span v-else-if="item.entryPrice">{{
                  item.entryPrice | priceFormatter(item.isInverse) | bigNumberFormatter(item.priceFormatDecimals)
                }}</span>
              <i class="el-icon-loading" v-else></i>
            </td>
            <td class="is-left">
              <div class="light-color" v-if="
                    item.isCleared ||
                    item.isEmergency ||
                    item.size.eq(0) ||
                    !item.selectedPerpetualAmmIsSafe ||
                    item.selectedPerpetualOracleIsTerminated
                  ">
                --
              </div>
              <span v-else-if="item.markPrice">{{
                  item.markPrice | priceFormatter(item.isInverse) | bigNumberFormatter(item.priceFormatDecimals)
                }}</span>
              <NA v-else/>
            </td>
            <td class="is-left">
              <div class="light-color" v-if="
                    item.isCleared ||
                    item.isEmergency ||
                    item.size.eq(0) ||
                    !item.selectedPerpetualAmmIsSafe ||
                    item.selectedPerpetualOracleIsTerminated
                  ">
                --
              </div>
              <el-tooltip v-else-if="item.liquidationPrice" :open-delay="400"
                          :class="{ 'el-tooltip-disabled': formatPrice(item.liquidationPrice, item.isInverse).isFinite() }"
                          :disabled="formatPrice(item.liquidationPrice, item.isInverse).isFinite()" :content="
                    !formatPrice(item.liquidationPrice, item.isInverse).isFinite()
                      ? $t('hintInfos.positionsAndOrders.infinityPrompt')
                      : ''
                  ">
                  <span :class="{ infinity: !formatPrice(item.liquidationPrice, item.isInverse).isFinite() }">{{
                      item.liquidationPrice
                        | priceFormatter(item.isInverse)
                        | bigNumberFormatter(item.priceFormatDecimals)
                    }}</span>
              </el-tooltip>
              <NA v-else/>
            </td>
            <td class="is-left">
              <div class="light-color" v-if="
                    item.isCleared ||
                    item.isEmergency ||
                    item.size.eq(0) ||
                    !item.selectedPerpetualAmmIsSafe ||
                    item.selectedPerpetualOracleIsTerminated
                  ">
                --
              </div>
              <template v-else>
                <el-tooltip placement="top" :open-delay="400">
                  <div slot="content">
                    {{ item.fundingRevenue | bigNumberFormatterTruncateByPrecision(10, 2, 3) }}
                    {{ item.collateralSymbol }}
                  </div>
                  <PNNumber v-if="item.fundingRevenue" :number="item.fundingRevenue"
                            :decimals="3" show-plus-sign/>
                  <i class="el-icon-loading" v-else></i>
                </el-tooltip>
              </template>
            </td>
            <td class="is-left">
              <div class="light-color" v-if="
                    item.isCleared ||
                    item.isEmergency ||
                    item.size.eq(0) ||
                    !item.selectedPerpetualAmmIsSafe ||
                    item.selectedPerpetualOracleIsTerminated
                  ">
                --
              </div>
              <div v-else class="pnl">
                <div class="more-line" v-if="item.pnl || item.roe">
                  <PNNumber v-if="item.pnl" :number="item.pnl" :decimals="item.collateralFormatDecimals"
                            show-plus-sign/>
                  <!--                  <PNNumber v-if="item.roe" :number="item.roe.times(100)" :decimals="1" suffix="%"-->
                  <!--                            :showPlusSign="true" :roundingMode="BigNumber.ROUND_UP" class="newline"/>-->
                </div>
                <i class="el-icon-loading" v-else></i>
                <i v-if="item.pnl || item.roe" class="iconfont icon-share" @click="showShare(item)"></i>
              </div>
            </td>
            <td class="is-right">
              <template v-if="item.isEmergency">
                <el-button size="small" plain type="warning" class="operation-btn secondary-warning-button"
                           @click="switchContract(item)">{{ $t('base.clear') }}
                </el-button>
              </template>
              <template v-else-if="item.isCleared">
                <el-button size="small" plain type="orange" class="operation-btn withdraw-general-button"
                           @click="switchContract(item)">{{ $t('base.withdraw') }}
                </el-button>
              </template>
              <template v-else-if="!item.selectedPerpetualAmmIsSafe || item.selectedPerpetualOracleIsTerminated">
                <el-button size="small" plain type="warning" class="operation-btn clear-general-button"
                           @click="switchContract(item)">{{ $t('base.readyToEmergency') }}
                </el-button>
              </template>
              <template v-else>
                <el-button v-if="!item.size.eq(0)" size="small" plain class="operation-btn"
                           @click="closePosition(item)"
                           :disabled="item.isMarketClose || item.isEmergency || item.isCleared || !item.isMarginSafe">
                  {{ $t('base.marketClose') }}
                </el-button>
                <el-button v-if="item.size.eq(0)" size="small" plain class="operation-btn"
                           @click="showChangeMargin(item, 'withdraw')" :disabled="item.isMarketClose">
                  {{ $t('base.marginRemove') }}
                </el-button>
              </template>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </McLoading>

    <ConnectWalletMask v-if="!userAddress" :show-mask="false"></ConnectWalletMask>
    <OrderConfirmDialog :order-confirm-params="closeOrderConfirmParams" :visible.sync="showCloseDialog"
                        :confirm-func="onClosePosition" :trade-state="tradeState"
                        @closed="onClosedOrderConfirmDialog" :slippage.sync="setSlippageTolerance"
                        :default-slippage="defaultSlippageTolerance"
                        :is-insufficient-liquidity="selectedIsInsufficientLiquidity"
                        @setMaxAvailableAmount="setMaxAvailableTradeAmount"/>
    <ShareDialog :visible.sync="showShareVisible" :position-info="showShareItem"></ShareDialog>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import PositionsMixin from '@/template/components/Position/positionsMixin'
import { namespace } from 'vuex-class'
import ConnectWalletMask from '@/business-components/ConnectWalletMask.vue'
import OrderConfirmDialog from '@/template/Dialogs/OrderConfirmDialog.vue'
import { formatPrice, padLeft } from '@/utils'
import { McLoading, McNoData, NA, PNNumber, McTokenPairView } from '@/components'
import ShareDialog from '@/business-components/ShareDialog.vue'
import { normalizeError } from '@/type'

const activePerpetuals = namespace('activePerpetuals')
@Component({
  components: {
    ConnectWalletMask,
    OrderConfirmDialog,
    PNNumber,
    NA,
    McLoading,
    McNoData,
    McTokenPairView,
    ShareDialog,
  },
})
export default class Positions extends Mixins(PositionsMixin) {
  @activePerpetuals.State('selectedPerpetualID') selectedPerpetualID!: string | null
  formatPrice = formatPrice
  padLeft = padLeft
  showShareVisible = false
  showShareItem = null

  async onClosePosition() {
    try {
      await this.onClosePositionEvent()
    } catch (e) {
      const err = normalizeError(e)
      this.$notify({
        type: 'error',
        title: this.$t(err.helpCaptionKey).toString(),
        message: this.$t(err.helpKey, { message: e.message }).toString(),
        position: 'bottom-right',
        customClass: 'is-error',
      })
    }
  }

  showShare(item: any) {
    this.showShareItem = item
    this.showShareVisible = true
  }
}
</script>

<style lang="scss" scoped>
@import './positionsAndOrders.scss';
@import '~@mcdex/style/common/var';

.mc-loading {
  width: 100%;
  height: 100%;
}

.mc-data-table {
  width: 100%;

  thead th,
  tbody td {
    margin: 0 8px;

    &:nth-child(1) {
      width: 12%;
    }

    &:nth-child(2) {
      width: 4%;
    }

    &:nth-child(3) {
      width: 11%;
    }

    &:nth-child(4) {
      width: 8%;
    }

    &:nth-child(5) {
      width: 5%;
    }

    &:nth-child(6) {
      width: 7%;
    }

    &:nth-child(7) {
      width: 7%;
    }

    &:nth-child(8) {
      width: 7%;
    }

    &:nth-child(9) {
      width: 7%;
    }

    &:nth-child(10) {
      width: 7%;
    }

    &:nth-child(11) {
      width: 8%;
    }

    &:nth-child(12) {
      padding-right: 8px;
    }
  }

  td {
    .newline {
      display: flex;
      align-items: center;
    }

    .pnl {
      display: flex;
      align-items: center;

      .icon-share {
        margin-left: 4px;
        cursor: pointer;
        color: var(--mc-color-primary);

        &:hover {
          color: #57b6f6;
        }
      }
    }
  }
}

.table-box {
  flex: 1;
  height: 100%;
  overflow-y: overlay;
}

.operation-btn {
  min-width: 101px;
  border-radius: 8px;
  font-size: 13px;
}

.unit {
  display: inline-block;

  &::before {
    content: '' !important;
  }
}

.position-size-unit {
  margin-left: 4px;
}

.horizontal {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
}

.icon-plus-frame-round,
.icon-minus-frame-round {
  cursor: pointer;
  font-size: 17px;
  margin-left: 4px;

  &:hover {
    color: #57b6f6 !important;
  }

  &.disabled {
    opacity: 0.5;
    cursor: no-drop;
  }
}

.symbol-box {
  justify-content: left;
}

.connect-wallet-mask {
  top: 36px;
}
</style>
<style scoped lang="scss">
@import '~@mcdex/style/common/fantasy-var';

.satori-fantasy {
  .mc-data-table {
    .light-color {
      color: var(--mc-text-color);
    }
  }

  .inverse-card {
    background: rgb(217, 128, 65, 0.1);
    border: 1px solid rgb(217, 128, 65, 0.1);
  }

  .icon-plus-frame-round,
  .icon-minus-frame-round {
    color: var(--mc-color-primary);
  }

  .white-color {
    color: var(--color-text-regular);
  }

  .green-color {
    color: var(--mc-color-success);
  }

  .yellow-color {
    color: var(--mc-color-warning);
  }

  .red-color {
    color: var(--mc-color-error);
  }
}
</style>
