<template>
  <div class="trade-main-page scroll-container">
    <HeaderBar></HeaderBar>
    <div class="trade-main-container page-container">
      <div class="perpetual-container" ref="perpetualContainer">
        <div class="header-container">
          <div class="switch-perpetual-item" @click="switchPerpetual">
            <i class="iconfont icon-h-switch" @click="switchPerpetual"></i>
            <div class="split-line"></div>
            <div class="name-box">
              <McMTokenPairView :collateral-address="perpetualCollateralAddress"
                               :underlying-symbol="perpetualUnderlyingSymbol" />
              <div class="name">
                <div class="line-1">{{ perpetualName }}</div>
                <div class="line-2">
                  {{ perpetualSymbol }}<span class="inverse-card" v-if="selectedPerpetualIsInverse">{{ $t('base.inverse') }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="header-icon-group">
            <i class="iconfont icon-chart" @click="toChartPage"></i>
            <i class="iconfont icon-circle-info" @click="toPerpetualInfoPage"></i>
          </div>
        </div>
      </div>
      <div class="gas-fee-container" ref="gasFeeContainer" v-if="isBSC || isArbTestnet">
        <GasFeeRebateHeader/>
      </div>
      <div class="content-box" ref="scrollElm" :style="{ height: 'calc(100% - ' + outsideContentHeight + 'px)' }">
        <div class="content-container">
          <div
            class="trade-first-panel-container"
            v-if="selectedPerpetualAmmIsSafe && !selectedPerpetualOracleIsTerminated && !selectedPerpetualIsSettle"
          >
            <div class="isolated-container">
              <div class="isolated">
                <div class="label">{{ $t('base.isolated') }}</div>
                <div class="value" @click="showTargetLeveragePopup">
                  <span>{{ selectPerpetualTargetLeverage | bigNumberFormatter(0) }}x</span>
                  <i class="iconfont icon-drop-down" :class="{ reverse: showLeveragePopup }"></i>
                </div>
              </div>
            </div>
            <div class="dividing-line"><span></span></div>
            <div class="wallet-container">
              <div class="label">
                <div>
                  {{ isBSC ? $t('placeOrder.wallet') : $t('placeOrder.l2Wallet') }}
                  <span v-if="isShowL2WalletBalanceAndMargin"><br />{{ $t('placeOrder.plusMargin') }}</span>
                </div>
              </div>
              <div class="value">
                <div class="balance-number">
                  <div class="collateral-number">
                    <span v-if="l2WalletBalanceAndMargin">
                      <span v-if="collateralMatch">
                        {{ nativeTokenBalance | bigNumberFormatter(collateralFormatDecimals) }}
                        {{ collateralTokenSymbol }}
                      </span>
                      <span v-else
                        >{{ l2WalletBalanceAndMargin | bigNumberFormatter(collateralFormatDecimals) }}
                        {{ collateralTokenSymbol }}</span
                      ></span
                    >
                    <span v-else>--</span>
                  </div>
                  <div class="collateral-number" v-if="collateralMatch">
                    <span>{{ l2WalletBalanceAndMargin | bigNumberFormatter(collateralFormatDecimals) }} WETH</span>
                  </div>
                </div>
                <div class="balance-icon" v-if="collateralMatch" @click="showWrapPopup">
                  <i class="iconfont icon-transfericon"></i>
                </div>
              </div>
            </div>
          </div>
          <keep-alive>
            <div class="trade-page-container">
              <div class="trade-panel-padding">
                <div
                  class="trade-panel"
                  v-if="selectedPerpetualIsNormal"
                  :style="{ height: tradePanelHeight }"
                >
                  <div class="trade-panel-left">
                    <AMMDepthWrap />
                  </div>
                  <div class="trade-panel-right">
                    <OrderTrade @heightChange="onTradePanelHeightChange" />
                  </div>
                </div>
                <div class="trade-panel" v-else>
                  <ClearMain />
                </div>
              </div>

              <div class="region-split-line">
                <div class="line1"></div>
                <div class="line2"></div>
              </div>
              <div class="position-order">
                <PositionAndOrderAdapter />
              </div>
            </div>
          </keep-alive>
        </div>
      </div>
    </div>
    <MarginChangeRiskNotice v-if="selectedPerpetualIsNormal" :selected-perpetual="selectedPerpetual"/>
  </div>
</template>
<script lang="ts">
import { Component, Mixins, Prop, Ref, Watch } from 'vue-property-decorator'
import PerpetualStatistics from './PerpetualStatistics.vue'
import AMMDepthWrap from './AMMDepth/AMMDepthWrap.vue'
import OrderTrade from './OrderTrade/OrderTrade.vue'
import PositionAndOrderAdapter from './PositionAndOrder/PositionAndOrderAdapter.vue'
import ClearMain from './Clear/ClearMain.vue'
import elementResizeDetectorMaker from 'element-resize-detector'
import * as _ from 'lodash'
import HeaderBar from '@/mobile/template/Header/HeaderBar.vue'
import { AccountWithSelectedPerpetualMixin, ErrorHandlerMixin } from '@/mixins'
import { McMTooltip, McMTokenPairView } from '@/mobile/components'
import { namespace } from 'vuex-class'
import BigNumber from 'bignumber.js'
import ChangeTargetLeveragePopup from '@/mobile/business-components/ChangeTargetLeveragePopup.vue'
import { ACCOUNT_EVENT, PERPETUAL_EVENT, VUE_EVENT_BUS } from '@/event'
import { COMMON_EVENT } from '@/mobile/event'
import { ROUTE } from '@/mobile/router'
import { MarginChangeRiskNotice } from '@/mobile/business-components'
import { SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/const'
import GasFeeRebateHeader from './GasFeeRebate/GasFeeRebateHeader.vue'

const wallet = namespace('wallet')
const interactiveState = namespace('interactiveState')

@Component({
  components: {
    PerpetualStatistics,
    AMMDepthWrap,
    OrderTrade,
    PositionAndOrderAdapter,
    HeaderBar,
    ClearMain,
    ChangeTargetLeveragePopup,
    McMTooltip,
    MarginChangeRiskNotice,
    McMTokenPairView,
    GasFeeRebateHeader,
  },
})
export default class TradeMain extends Mixins(AccountWithSelectedPerpetualMixin, ErrorHandlerMixin) {
  @Ref('perpetualContainer') perpetualContainer!: HTMLElement
  @Ref('gasFeeContainer') gasFeeContainer!: HTMLElement
  @Ref('scrollElm') scrollElm!: HTMLElement
  @Prop({ required: true }) symbol!: string
  @interactiveState.State('showLeveragePopup') showLeveragePopup!: boolean

  private erd: elementResizeDetectorMaker.Erd | null = null
  private outsideContentHeight = 0
  private tradePanelHeight = '0px'

  get isBSC() {
    return TARGET_NETWORK_ID === SUPPORTED_NETWORK_ID.BSC
  }

  get isArbTestnet() {
    return TARGET_NETWORK_ID === SUPPORTED_NETWORK_ID.ARB_TESTNET
  }

  get selectedPerpetualIsNormal(): boolean {
    return !this.selectedPerpetualIsSettle && this.selectedPerpetualAmmIsSafe
      && !this.selectedPerpetualOracleIsTerminated
  }

  get selectedSymbol(): number {
    return this.selectedPerpetualProperty?.symbol || 0
  }

  get perpetualSymbol() {
    return this.selectedPerpetualProperty?.symbolStr || ''
  }

  get perpetualName() {
    return this.selectedPerpetualProperty?.name || ''
  }

  get perpetualCollateralAddress(): string {
    return this.selectedPerpetual?.liquidityPoolStorage.collateral || ''
  }

  get perpetualUnderlyingSymbol(): string {
    return this.selectedPerpetual?.perpetualProperty.underlyingAssetSymbol || ''
  }

  mounted() {
    this.erd = elementResizeDetectorMaker({ strategy: 'scroll', callOnAdd: true })
    const debounceCalcHeight = _.debounce(this.setContentBoxHeight, 200)
    debounceCalcHeight()
    this.erd.listenTo(this.perpetualContainer, (el) => {
      debounceCalcHeight()
    })
    VUE_EVENT_BUS.on(PERPETUAL_EVENT.PERPETUAL_CHANGE, this.scrollToTop)
  }

  switchPerpetual() {
    VUE_EVENT_BUS.emit(COMMON_EVENT.SHOW_SELECT_PERPETUAL_POPUP)
  }

  toChartPage() {
    this.$router.push({ name: ROUTE.TRADE_CHART_INFO, params: { symbol: this.symbol } })
  }

  toPerpetualInfoPage() {
    this.$router.push({ name: ROUTE.PERPETUAL_INFO, params: { symbol: this.symbol } })
  }

  setContentBoxHeight() {
    this.outsideContentHeight = this.perpetualContainer.clientHeight + this.gasFeeContainer.clientHeight
  }

  destroyed() {
    VUE_EVENT_BUS.off(PERPETUAL_EVENT.PERPETUAL_CHANGE, this.scrollToTop)
  }

  private scrollToTop() {
    this.scrollElm.scrollTop = 0
  }

  get priceFormatDecimals() {
    return this.selectedPerpetualProperty?.priceFormatDecimals || 0
  }

  get collateralTokenSymbol(): string {
    if (!this.selectedPerpetualProperty) {
      return ''
    }
    return this.selectedPerpetualProperty.collateralTokenSymbol
  }

  get collateralFormatDecimals() {
    return this.selectedPerpetualProperty?.collateralFormatDecimals
  }

  get l2WalletBalanceAndMargin(): BigNumber | null {
    if (!this.selectedAccountDetails || !this.collateralBalance) {
      return null
    }
    let balance = this.collateralBalance
    if (this.selectedAccountDetails.accountStorage.positionAmount.isZero()) {
      // show walletBalance + marginBalance if pos = 0
      balance = balance.plus(this.selectedAccountDetails.accountComputed.marginBalance)
    }
    return balance
  }

  get isShowL2WalletBalanceAndMargin(): boolean {
    if (!this.selectedAccountDetails || !this.collateralBalance) {
      return false
    }
    return (
      this.selectedAccountDetails?.accountStorage.positionAmount.isZero() &&
      !this.selectedAccountDetails.accountComputed.marginBalance.isZero()
    )
  }

  onTradePanelHeightChange(height: number) {
    this.tradePanelHeight = height + 'px'
  }

  private showTargetLeveragePopup() {
    VUE_EVENT_BUS.emit(COMMON_EVENT.SHOW_CHANGE_TARGET_LEVERAGE_POPUP, this.selectedPerpetualID)
  }

  showWrapPopup() {
    VUE_EVENT_BUS.emit(ACCOUNT_EVENT.WRAP_ETH)
  }
}
</script>

<style lang="scss" scoped>
.trade-main-page {
  overflow: hidden;

  .header-bar {
    border-bottom: unset;
  }

  .trade-container {
    height: 100%;
  }

  .main-header {
    z-index: 100;
  }

  .trade-main-container {
    overflow: hidden;
  }

  .gas-fee-container {
    padding: 0 16px 8px 16px;
  }

  .content-box {
    overflow-y: auto;

    .trade-first-panel-container {
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #1A2136;
      border-radius: 24px 24px 0 0;

      .dividing-line {
        display: flex;
        align-items: center;
        margin: 0 16px;

        span {
          width: 1px;
          background-color: var(--mc-background-color-light);
          display: inline-block;
          height: 12px;
          background: var(--mc-border-color);
        }
      }
    }

    .isolated-container {
      display: flex;
      flex: 0.3;
      width: 100%;

      .isolated {
        width: 100%;
        display: flex;
        align-items: center;
        color: var(--mc-text-color-white);
        font-size: 14px;
        line-height: 16px;
        justify-content: space-between;

        .value {
          margin-left: 8px;
          width: 72px;
          height: 28px;
          border-radius: var(--mc-border-radius-m);
          padding: 0 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          background: var(--mc-background-color);

          .iconfont {
            color: var(--mc-text-color);
            font-size: 12px;
          }
        }

        .reverse {
          display: inline-block;
          -moz-transform: rotate(180deg);
          -webkit-transform: rotate(180deg);
          transform: rotateX(180deg);
        }
      }
    }

    .wallet-container {
      display: flex;
      justify-content: space-between;
      flex: 0.7;
      font-size: 12px;
      align-items: center;

      .label {
        color: var(--mc-text-color);
      }

      .value {
        display: flex;
        color: var(--mc-text-color-white);

        .collateral-number {
          text-align: right;
        }

        .balance-icon {
          width: 20px;
          display: flex;
          align-items: center;
          margin-left: 8px;
          .iconfont {
            font-size: 18px;
            color: var(--mc-color-brand);
          }
        }
      }
    }
  }

  .header-container {
    padding: 8px 18px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .split-line {
      margin: 0 8px;
      height: 20px;
      width: 0;
      background: var(--mc-border-color);
    }

    .switch-perpetual-item {
      display: flex;
      align-items: center;

      .icon-h-switch {
        font-size: 20px;
      }

      .name-box {
        display: flex;
        align-items: center;

        .name {
          margin-left: 8px;
          font-size: 14px;
          line-height: 22px;
          .line-2 {
            color: var(--mc-text-color);
          }
        }
      }
    }

    .header-icon-group {
      display: flex;
      align-items: center;
      .iconfont {
        font-size: 20px;
        margin-left: 18px;
        color: var(--mc-color-primary);
      }
    }
  }

  .tabs-container {
    ::v-deep {
      .van-tabs__nav {
        background: transparent;
      }

      .van-tabs__wrap {
        height: 40px;
      }

      .van-tab {
        font-size: 16px;
        font-weight: 400;
        color: var(--mc-text-color);
        padding: 0;
      }

      .van-tab--active {
        color: var(--mc-text-color-white);
      }

      .van-tabs__nav--line {
        padding-bottom: 18px;
      }

      .van-tabs__line {
        height: 2px;
        background-color: var(--mc-color-primary);
        bottom: 18px;
        width: 16px;
        border-radius: 4px;
      }
    }
  }

  .content-container {
    background: var(--mc-background-color-dark);
    border-radius: 24px 24px 0 0;
    min-height: 100%;
    width: 100%;
    box-shadow: 0 0 0 1px var(--mc-border-color);
    margin-top: 1px;

    .container-padding {
      padding: 16px;
    }
  }

  .trade-page-container {
    .trade-panel-padding {
      padding: 16px 16px 0 16px;
    }

    .trade-panel {
      display: flex;
      justify-content: space-between;

      .trade-panel-left {
        width: 34.11%;
      }

      .trade-panel-right {
        width: 61.22%;
      }
    }

    .region-split-line {
      .line1 {
        height: 16px;
        width: 100%;
      }

      .line2 {
        height: 12px;
        width: 100%;
        background: var(--mc-background-color-darkest);
      }
    }

    .position-order {
      padding: 0 16px;
    }
  }
}
</style>
