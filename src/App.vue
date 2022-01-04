<template>
  <div id="app" class="scroll" ref="app">
    <div class="content-wrap">
      <DEXHeader :walletAddress="wallet.address" :walletType="wallet.walletType" />
      <NetworkNotification />
      <GlobalNotificationBar />
      <main id="main">
        <transition name="switch-stack" mode="out-in">
          <router-view v-bind="{ layout }"></router-view>
        </transition>
      </main>

      <NodeStatusViewer />

      <ChangeMarginDialog :perpetualID="changeMarginData.perpetualID" :action-type.sync="changeMarginData.type" :visible.sync="showChangeMarginDialog" />
    </div>
    <ConnectWalletDialog ref="connectWallet" />
    <WalletSignatureDialog />
    <AuthPopper />
    <ChangeTargetLeverageDialog />
    <DialogProgress />
    <WrongChainDialog />
    <PoolLiquidityDialog />
  </div>
</template>
<script lang="ts">
import { Component, Mixins, Ref, Watch } from 'vue-property-decorator'
import { namespace, State } from 'vuex-class'
import { MCError } from '@/type/error'
import { formatPrice, getMetaProperty, setLocalStorage } from '@/utils'

import Header from './template/Header/Header.vue'
import { SUPPORTED_WALLET, Wallet } from '@/business-components/wallet/wallet-connector'

import {
  AuthSingletonMixin,
  FaucetMixin,
  OrderSingletonMixin,
  OrderWSSingletonMixin,
  StoreTrackerSingletonMixin,
  WalletSingletonMixin,
} from '@/mixins'
import { GlobalNotificationBar, McMcdexLoading } from '@/components'
import ConnectWalletDialog from '@/business-components/wallet/ConnectWalletDialog.vue'
import WalletSignatureDialog from '@/business-components/wallet/WalletSignatureDialog.vue'
import NetworkNotification from '@/business-components/NetworkNotification.vue'
import ChangeMarginDialog from '@/template/Dialogs/ChangeMarginDialog.vue'
import { AuthPopper, ChangeTargetLeverageDialog, PoolLiquidityDialog, WrongChainDialog } from '@/business-components'

import BigNumber from 'bignumber.js'
import { ACCOUNT_EVENT, COMMON_EVENT, ERROR_EVENTS, PLACE_ORDER_EVENT, VUE_EVENT_BUS, WALLET_EVENT } from '@/event'
import { OrderStruct, PerpetualCombinedState } from '@/type'

import { ethers } from 'ethers'
import { changeLang } from '@/locales/index-pc'
import DialogProgress from '@/business-components/DialogProcess.vue'
import NodeServerNotification from '@/business-components/NodeServerNotification.vue'
import NodeStatusViewer from '@/business-components/NodeStatusViewer.vue'
import { ROUTE } from '@/router'
import { NETWORK_ENV, SUPPORTED_NETWORK_ID, APP } from '@/const'

const isMainnet = NETWORK_ENV.CHAIN_ID === SUPPORTED_NETWORK_ID.MAINNET

const userAgentInfo = window.navigator.userAgent
const Agents = ['Android', 'iPhone', 'SymbianOS', 'Windows Phone', 'iPad', 'iPod']
const isPhone = Agents.some((item) => userAgentInfo.indexOf(item) > -1)

const preference = namespace('preference')
const wallet = namespace('wallet')
const perpetual = namespace('perpetual')
const token = namespace('token')

@Component({
  components: {
    DEXHeader: Header,
    GlobalNotificationBar,
    ConnectWalletDialog,
    WalletSignatureDialog,
    ChangeMarginDialog,
    AuthPopper,
    ChangeTargetLeverageDialog,
    NetworkNotification,
    DialogProgress,
    WrongChainDialog,
    NodeServerNotification,
    McMcdexLoading,
    NodeStatusViewer,
    PoolLiquidityDialog,
  },
})
export default class App extends Mixins(
  WalletSingletonMixin,
  StoreTrackerSingletonMixin,
  AuthSingletonMixin,
  OrderSingletonMixin,
  OrderWSSingletonMixin,
  FaucetMixin
) {
  @wallet.Mutation('setWallet') setWallet!: Function
  @wallet.Action('recover') recoverWallet!: Function
  @preference.State('theme') theme!: string
  @preference.Action('init') initPreference!: Function
  @preference.Mutation('changeTheme') changeTheme!: (theme: string) => void
  @perpetual.Getter('getPerpetualFunc') getPerpetualFunc!: (perpetualID: string) => PerpetualCombinedState | null
  @token.Action('initTokenConfig') initTokenConfig!: () => Promise<void>
  @wallet.Getter('signer') signer!: ethers.Signer | null
  @wallet.State('wallet') myWallet!: Wallet | null
  @State('routing') routing!: boolean

  @Ref('connectWallet') connectWalletDialog!: ConnectWalletDialog

  layout = {}
  wallet = { address: '', cachedETHBalance: new BigNumber(0), walletType: SUPPORTED_WALLET.InvalidType }
  showChangeMarginDialog = false
  changeMarginData = {
    type: 'deposit',
    perpetualID: '',
  }
  private routeLoading = false

  mounted() {
    this.recoverWallet()
    this.initTokenConfig()
    this.initPreference()

    this.listenErrorEvents()
    this.listenWalletEvents()
    this.listenUIEvents()

    this.$root.$data.appName = APP.title
  }

  beforeDestroy() {
    VUE_EVENT_BUS.off()
  }

  listenErrorEvents() {
    const errorCooldown: any = {}
    VUE_EVENT_BUS.on(ERROR_EVENTS.ShowMcError, (error: MCError) => {
      if (errorCooldown[error.message]) {
        return
      }
      this.$notify({
        title: this.$t(error.helpCaptionKey).toString(),
        message: this.$t(error.helpKey, { message: error.message }).toString(),
        type: 'error',
        position: 'bottom-right',
        customClass: 'is-error',
      })
      errorCooldown[error.message] = true
      // to prevent multiply popup of same type presented at the same time
      setTimeout(() => {
        errorCooldown[error.message] = false
      }, 5000)
    })
    VUE_EVENT_BUS.on(
      ERROR_EVENTS.ShowTextError,
      ({
        type,
        message,
        args,
        title,
      }: {
        type: 'error' | 'success' | 'warning' | 'info' | undefined
        message: string
        args: any
        title?: string
      }) => {
        if (typeof args === 'undefined') {
          args = {}
        }
        const value = this.$t(message, args).toString()
        this.$notify({
          title: title ? title : this.$t('messageTip.error').toString(),
          message: value,
          type,
          position: 'bottom-right',
          customClass: `is-${type}`,
        })
      }
    )
    // websocket
    VUE_EVENT_BUS.on(
      PLACE_ORDER_EVENT.WSOrderChanged,
      async (params: { order: OrderStruct; blockNumber: number; transactionHash: string }) => {
        await this.onWsOrderChangeEvent(params)
      }
    )
  }

  listenWalletEvents() {
    VUE_EVENT_BUS.on(WALLET_EVENT.ShowConnectWallet, () => {
      this.connectWalletDialog.show()
    })
    VUE_EVENT_BUS.on(WALLET_EVENT.Invalid, () => {
      this.setWallet({ wallet: null, type: null })
    })
  }

  listenUIEvents() {
    const setNotifyData = (
      data: Omit<OrderStruct, 'covert' | 'filledAmount'> & {
        side: string
        symbol: string
        pendingDelta: BigNumber
        confirmDelta: BigNumber
        canceledDelta: BigNumber
        closed: boolean
      }
    ): Omit<OrderStruct, 'covert' | 'filledAmount' | 'price' | 'stopPrice'> & {
      side: string
      symbol: string
      pendingDelta: string
      confirmDelta: string
      canceledDelta: string
      closed: boolean
      price: string
      triggerPrice: string
    } => {
      const perpetualID = `${data.liquidityPoolAddress}-${data.perpetualIndex}`.toLowerCase()
      const perpetual = this.getPerpetualFunc(perpetualID)
      const side = perpetual?.perpetualProperty.isInverse
        ? data.side === 'sell'
          ? this.$t('orderNotifications.buy').toString()
          : this.$t('orderNotifications.sell').toString()
        : data.side === 'buy'
        ? this.$t('orderNotifications.buy').toString()
        : this.$t('orderNotifications.sell').toString()
      const priceDecimals =
        perpetual?.perpetualProperty.priceFormatDecimals === undefined
          ? 5
          : perpetual.perpetualProperty.priceFormatDecimals
      const underlyingAssetFormatDecimals =
        perpetual?.perpetualProperty.underlyingAssetFormatDecimals === undefined
          ? 2
          : perpetual.perpetualProperty.underlyingAssetFormatDecimals
      return {
        ...data,
        side,
        price: formatPrice(data.price, perpetual?.perpetualProperty.isInverse).toFormat(priceDecimals),
        triggerPrice: formatPrice(data.triggerPrice, perpetual?.perpetualProperty.isInverse).toFormat(priceDecimals),
        amount: (data.amount as BigNumber).abs().toFormat(underlyingAssetFormatDecimals),
        pendingDelta: data.pendingDelta.abs().toFormat(underlyingAssetFormatDecimals),
        confirmDelta: data.confirmDelta.abs().toFormat(underlyingAssetFormatDecimals),
        canceledDelta: data.canceledDelta.abs().toFormat(underlyingAssetFormatDecimals),
      }
    }
    VUE_EVENT_BUS.on(PLACE_ORDER_EVENT.OrderCreated, (data: any) => {
      if (typeof data === 'undefined' || !data) return
      const value = this.$t('orderNotifications.created', setNotifyData(data)).toString()
      this.$notify({
        title: this.$t('messageTip.orderCreated').toString(),
        message: value,
        type: 'info',
        position: 'bottom-right',
        customClass: 'is-info',
      })
    })
    VUE_EVENT_BUS.on(PLACE_ORDER_EVENT.OrderMatching, (data: any) => {
      if (typeof data === 'undefined' || !data) return
      const value = this.$t('orderNotifications.matching', setNotifyData(data)).toString()
      this.$notify({
        title: this.$t('messageTip.orderMatched').toString(),
        message: value,
        type: 'info',
        position: 'bottom-right',
        customClass: 'is-info',
      })
    })
    VUE_EVENT_BUS.on(PLACE_ORDER_EVENT.OrderFilled, (data: any) => {
      if (typeof data === 'undefined' || !data) return
      let value = this.$t('orderNotifications.filled', setNotifyData(data)).toString()
      value += data.closed ? this.$t('orderNotifications.closed').toString() : ''
      this.$notify({
        title: this.$t('messageTip.orderFilled').toString(),
        message: value,
        type: 'success',
        position: 'bottom-right',
        customClass: 'is-success',
      })
    })
    VUE_EVENT_BUS.on(PLACE_ORDER_EVENT.OrderCanceled, (data: any) => {
      if (typeof data === 'undefined' || !data) return
      let value = this.$t('orderNotifications.canceled', setNotifyData(data)).toString()
      value += data.closed ? this.$t('orderNotifications.closed').toString() : ''
      this.$notify({
        title: this.$t('messageTip.orderCanceled').toString(),
        message: value,
        type: 'info',
        position: 'bottom-right',
        customClass: 'is-info',
      })
    })
    VUE_EVENT_BUS.on(COMMON_EVENT.LANGUAGE_CHANGED, (lang: any) => {
      this.$i18n.locale = lang
      setLocalStorage('lang', lang)
    })
    VUE_EVENT_BUS.on(ACCOUNT_EVENT.CHANGE_MARGIN, (data: { perpetualID: string; type: string }) => {
      this.changeMarginData = data
      this.showChangeMarginDialog = true
    })
  }

  @Watch('$i18n.locale', { immediate: true })
  setMomentLocale() {
    changeLang(this.$i18n.locale)
  }

  @Watch('theme', { immediate: true })
  private setBodyTheme(newTheme: string, oldTheme: string) {
    if (oldTheme) {
      document.body.classList.remove(oldTheme)
    }
    if (newTheme) {
      document.body.classList.add(newTheme)
    }
  }

  @Watch('$route', { immediate: true })
  private setTheme() {
    const theme = getMetaProperty<string>(this.$route, 'theme')
    this.changeTheme(theme || 'dex-theme-dark')
    if (this.$route.name === ROUTE.TRADE_MAIN) {
      document.body.classList.add('trade-main-page')
    } else {
      document.body.classList.remove('trade-main-page')
    }
  }
}
</script>

<style lang="scss">
@import '~@mcdex/style/common/fantasy-var';

#app {
  height: 100%;
  width: 100%;
  overflow-x: auto;

  .content-wrap {
    min-width: 1440px;
    height: 100%;
    display: flex;
    flex-direction: column;

    main {
      flex: 1;
      padding: 1px 0;
      overflow-y: overlay;
      overflow-x: hidden;
      width: 100%;

      .mc-mcdex-loading {
        height: 100%;
      }
    }

    .network-notification + main {
      .trade-container {
        margin-top: 0;
      }
    }
  }
}

.el-tooltip__popper {
  word-break: keep-all;
}

.el-popover .tooltip-content {
  word-break: keep-all;
}

.el-tooltip:not(i):not(.el-tooltip-disabled):not(.el-input):not(.el-button) {
  text-decoration-line: underline;
  text-decoration-style: dashed;
  text-decoration-color: inherit;
  text-underline-position: under;
  cursor: pointer;
}

.inverse-card {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
  color: var(--mc-color-orange);
  background: rgba($--mc-color-orange, 0.1);
  border-radius: 8px;
  font-size: 12px;
  width: 56px;
  height: 22px;
  border: 1px solid rgba($--mc-color-orange, 0.1);
}

.satori-fantasy .mini-round-dialog {
  width: 480px;
  padding: 16px;
  border-radius: 24px;

  .el-dialog__header {
    padding: 0 0 16px 0;

    .el-dialog__title {
      font-size: 18px;
      font-weight: 700;
    }

    .el-dialog__headerbtn {
      right: 0;

      .el-dialog__close {
        font-size: 24px;
        color: var(--mc-text-color-white);
      }
    }
  }

  .el-dialog__body {
    padding: 0;
  }
}

.fixed-table {
  tbody {
    display: block;
    overflow-y: overlay;
  }

  thead,
  tr {
    display: table;
    width: 100%;
    table-layout: fixed;
  }
}

.withdraw-general-button {
  background: rgba($--mc-color-orange, 0.05);
  border-radius: 24px;
  color: var(--mc-color-orange);
  font-size: 13px;

  &.is-loading:before {
    display: none;
  }

  &:hover {
    background: rgba($--mc-color-orange, 0.1);
  }
}

.clear-general-button {
  background: rgba($--mc-color-orange, 0.05);
  border-radius: 24px;
  color: var(--mc-color-warning);
  font-size: 13px;

  &.is-loading:before {
    display: none;
  }

  &:hover {
    background: rgba($--mc-color-orange, 0.1);
    color: var(--mc-color-warning);
  }
}
</style>

<style lang="scss">
@import 'style';
</style>

<style lang="scss">
.satori-fantasy #app {
  background-color: #242d43;
}
</style>

<style lang="scss">
.dex-theme-dark #app {
  background-color: var(--mc-background-color-darkest);
}
</style>

<style lang="scss">
.tooltip-popover {
  .tooltip-content {
    border-radius: 12px;
    padding: 16px;
    font-size: 14px;
    color: var(--mc-text-color-white);
    background-color: var(--mc-background-color-darkest);

    .blue-text {
      color: var(--mc-color-blue);
    }
  }
}
</style>
