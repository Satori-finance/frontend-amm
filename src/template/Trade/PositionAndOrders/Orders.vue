<template>
  <McLoading :show-loading="reloading" :margin="8" :hide-content="noData">
    <div class="orders position-order-common-container scroll">
      <div class="filter-box">
        <div class="left">
          <el-checkbox v-model="showAllMarket">{{ $t('filters.allMarkets') }}</el-checkbox>
        </div>
        <div class="right">
          <el-button class="cancel-button" :disabled="!isConnectedWallet" size="mini" @click="cancelAllOrder">
            {{ $t('base.cancelAll') }}
          </el-button>
        </div>
      </div>

      <div class="table-box" ref="orderContainer" v-fixed-table>
        <table class="mc-data-table is-small fixed-table"
               :class="{ 'no-data-table': userAddress && isValidateFunc() && noData }">
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
              <span>{{ $t('base.type') }}</span>
            </th>
            <th class="is-left">
              <span>{{ $t('base.limitPrice') }}</span>
            </th>
            <th class="is-left">
              <el-tooltip :content="$t('hintInfos.positionsAndOrders.orderLevPrompt')" placement="top"
                          :open-delay="400">
                <span>{{ $t('base.lev') }}</span>
              </el-tooltip>
            </th>
            <th class="is-left">
              <span>{{ $t('base.amount') }}</span>
            </th>
            <th class="is-left">
              <span>{{ $t('base.executed') }}</span>
            </th>
            <th class="is-left">
              <span>{{ $t('base.canceled') }}</span>
            </th>
            <th class="is-left">
              <span>{{ $t('base.closeOnly') }}</span>
            </th>
            <th class="is-left">
              <span>{{ $t('base.triggerPrice') }}</span>
            </th>
            <th class="is-right">
              <span>{{ $t('base.operation') }}</span>
            </th>
          </tr>
          </thead>
          <tbody v-if="userAddress && isValidateFunc()">
            <tr v-if="noData && !reloading">
              <td colspan="100">
                <McNoData></McNoData>
              </td>
            </tr>
            <tr v-for="item in tableBody" :key="item.orderHash">
              <td class="is-left">
                <div class="cell">
                  {{ item.createdAt.unix() | i18nTimeFormatter($i18n.locale, 'day') }}
                  <span class="newline">
                    {{ item.createdAt.unix() | i18nTimeFormatter($i18n.locale, 'time') }}
                  </span>
              </div>
            </td>
            <td class="is-left symbol-row">
              <div class="cell">
                  <span class="symbol-box">
                    <span>
                      <McTokenPairView :underlyingSymbol="item.underlyingSymbol"
                                       :collateralAddress="item.collateralAddress" :size="36" />
                    </span>
                    <span class="value symbol-link" @click="switchContract(item.perpetualProperty)">
                      {{ item.perpetualProperty.name }}
                      <span class="newline light-color">
                        {{ item.perpetualProperty.symbolStr }}
                        <span class="inverse-card" v-if="item.perpetualProperty.isInverse">{{
                            $t('base.inverse')
                          }}</span>
                      </span>
                    </span>
                  </span>
              </div>
            </td>
            <td class="is-left">
              <div class="cell">
                  <span :class="getSideClass(item)">
                    <span class="short">{{ $t('base.short') }}</span>
                    <span class="long">{{ $t('base.long') }}</span>
                  </span>
                <span class="unit newline light-color" v-if="item.perpetualProperty">{{
                    item.perpetualProperty.contractSymbol
                  }}</span>
              </div>
            </td>
            <td class="is-left">
              <div class="cell">
                <span>{{ getOrderType(item.type) }}</span>
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
                <span v-if="!item.isCloseOnly">{{
                    item.targetLeverage | bigNumberFormatterTruncateByPrecision(2,2)
                  }}x</span>
              </div>
            </td>
            <td class="is-left">
              <div class="cell">
                  <span>{{
                      item.amount.abs() | bigNumberFormatter(item.perpetualProperty.underlyingAssetFormatDecimals)
                    }}</span>
                <span class="unit amountGap">{{ item.perpetualProperty.underlyingAssetSymbol }}</span>
              </div>
            </td>
            <td class="is-left">
              <div class="cell">
                  <span>{{
                      item.confirmedAmount.abs()
                        | bigNumberFormatter(item.perpetualProperty.underlyingAssetFormatDecimals)
                    }}</span>
                <span class="unit"> {{ item.perpetualProperty.underlyingAssetSymbol }}</span>
              </div>
            </td>
            <td class="is-left">
              <div class="cell">
                  <span>{{
                      item.canceledAmount.abs() | bigNumberFormatter(item.perpetualProperty.underlyingAssetFormatDecimals)
                    }}</span>
                <span class="unit"> {{ item.perpetualProperty.underlyingAssetSymbol }}</span>
                <a v-if="item.canceledAmount.abs().gt(0)"
                   @click="showCancelDetail(item.cancelReasons, item.perpetualProperty.underlyingAssetFormatDecimals)">
                  <i class="iconfont icon-more-frame-round"></i>
                </a>
              </div>
            </td>
            <td class="is-left">
              <div class="cell">
                <span>{{ item.isCloseOnly ? $t('base.true') : $t('base.false') }}</span>
              </div>
            </td>
            <td class="is-left">
              <div class="cell" v-if="item.type !== 1">
                  <span>{{
                      item.triggerPrice
                        | priceFormatter(item.perpetualProperty.isInverse)
                        | bigNumberFormatter(item.perpetualProperty.priceFormatDecimals)
                    }}</span>
              </div>
            </td>
            <td class="is-right">
              <div class="cell">
                <el-button :disabled="cancelingOrder && cancelingOrder.orderHash === item.orderHash"
                           class="cancel-btn" size="mini" plain type="primary" @click="cancelOrder(item)">
                  {{ $t('base.cancel') }}
                </el-button>
              </div>
            </td>
          </tr>
          </tbody>
        </table>
        <CancelDetailDialog :visible.sync="isShowReasonDialog" :activeCancelReason="activeCancelReason"
                            :amountFormatDecimals="amountFormatDecimals"/>
      </div>

      <AuthMask v-if="!isValidateFunc() && userAddress" :show-mask="false"></AuthMask>
      <ConnectWalletMask v-if="!userAddress" :show-mask="false"></ConnectWalletMask>
    </div>
  </McLoading>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import { McNoData, McLoading, McTokenPairView } from '@/components'
import AuthMask from '@/business-components/AuthMask.vue'
import ConnectWalletMask from '@/business-components/ConnectWalletMask.vue'
import { PerpetualProperty } from '@/type'
import { ROUTE } from '@/router'
import OrdersMixin from '@/template/components/Order/ordersMixin'
import CancelDetailDialog from '@/template/Dialogs/CancelDetailDialog.vue'
import { OrderCancelReason } from '@/type/validatable/orderStruct'

@Component({
  components: {
    AuthMask,
    McNoData,
    ConnectWalletMask,
    McLoading,
    CancelDetailDialog,
    McTokenPairView,
  },
})
export default class Orders extends Mixins(OrdersMixin) {
  private activeCancelReason: Array<OrderCancelReason> = []
  private amountFormatDecimals: number = 0
  private isShowReasonDialog: boolean = false
  protected showAllMarket = true

  switchContract(item: PerpetualProperty | null) {
    if (!item) {
      return
    }
    if (this.$route.name === ROUTE.TRADE_MAIN && this.$route.params.symbol === item.symbolStr) {
      return
    }
    this.$router.push({ name: ROUTE.TRADE_MAIN, params: { symbol: item.symbolStr } })
  }

  showCancelDetail(reasons: Array<OrderCancelReason>, amount: number) {
    this.activeCancelReason = reasons
    this.amountFormatDecimals = amount
    this.isShowReasonDialog = true
  }

  @Watch('selectedPerpetualID')
  @Watch('showAllMarket')
  handlerFilterContract() {
    if (!this.showAllMarket) {
      this.filters.contract = this.selectedPerpetualID || ''
    } else {
      this.filters.contract = ''
    }
  }
}
</script>

<style lang="scss" scoped>
@import './positionsAndOrders.scss';
</style>

<style lang="scss" scoped>
@import 'filterBox';
@import '~@mcdex/style/common/fantasy-var';

.mc-loading {
  width: 100%;
  height: 100%;
}

.orders {
  position: relative;

  .auth-mask {
    top: 71px;
  }

  .filter-box {
    .cancel-button {
      width: 71px;
      height: 24px;
      padding: 0 8px;
      border-radius: 8px;

      &:hover {
        color: var(--mc-color-primary);
        background: rgba(39,162,248,.2);
        border: 0 solid rgba(39,162,248,.3);
      }
    }

    ::v-deep .el-checkbox__label {
      padding-left: 8px;
    }
  }

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

    .amountGap {
      margin-left: 5px;
    }
  }

  .table-box {
    flex: 1;
    overflow-y: auto;

    .mc-data-table {
      width: 100%;

      thead th,
      tbody td {
        margin: 0 8px;

        &:nth-child(1) {
          width: 7%;
        }

        &:nth-child(2) {
          width: 12%;
        }

        &:nth-child(3) {
          width: 4%;
        }

        &:nth-child(4) {
          width: 5%;
        }

        &:nth-child(5) {
          width: 9%;
        }

        &:nth-child(6) {
          width: 4%;
        }

        &:nth-child(7) {
          width: 9%;
        }

        &:nth-child(8) {
          width: 9%;
        }

        &:nth-child(9) {
          width: 9%;
        }

        &:nth-child(10) {
          width: 6%;
        }

        &:nth-child(11) {
          width: 9%;
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
      }
    }

    .symbol-link {
      cursor: pointer;
    }

    .iconfont {
      font-size: 14px;
    }
  }

  .connect-wallet-mask {
    top: 68px;
  }

  .is-long .long {
    display: inline-block;
  }

  .is-short .short {
    display: inline-block;
  }

  .short {
    display: none;
    color: var(--mc-color-orange);
  }

  .long {
    display: none;
    color: var(--mc-color-blue);
  }

  .cancel-btn {
    width: 101px;
    height: 32px;
    border-radius: 8px;
  }

  .loading-icon {
    margin-right: 2px;
  }
}
</style>

<style lang="scss" scoped>
@import '~@mcdex/style/common/fantasy-var';

.satori-fantasy {
  .mc-data-table {
    .cancel-btn {
      color: var(--mc-text-color-white);
      background: rgb(180, 196, 255, 0.2);
      filter: none;

      &:hover {
        background: rgb(180, 196, 255, 0.3);
      }
    }
  }

  .inverse-card {
    background: rgb(217, 128, 65, 0.1);
    border: 1px solid rgb(217, 128, 65, 0.1);
  }

  .filter-box {
    button {
      background: rgba(180, 196, 255, 0.2);
      color: var(--mc-text-color-white);

      &:hover {
        color: var(--mc-text-color-white);
        background: rgba(180, 196, 255, 0.3);
        filter: none;
      }
    }
  }

  .head {
    color: var(--mc-text-color-white);
    background-color: var(--mc-background-color-darkest);

    .middle-button {
      color: var(--menu-color);
      background: var(--background-color-base);

      &:hover {
        color: var(--strong-menu-color);
        background: var(--background-color-base);
      }
    }
  }

  .content {
    background-color: #0a1024;
  }

  .nav {
    li {
      &.selected {
        button {
          color: var(--mc-text-color-white);
        }

        &:after {
          background: linear-gradient(90deg, #00d8e2 0%, #27a2f8 100%);
        }
      }

      button {
        color: var(--mc-text-color);

        &:hover {
          color: var(--mc-text-color-white);
        }

        &:before {
          background: #e73c87;
        }
      }
    }
  }
}
</style>
