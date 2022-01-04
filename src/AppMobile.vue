<template>
  <div id="app" class="scroll safe-area-inset-bottom" ref="app">
    <div class="main-box">
      <router-view />
    </div>
    <NodeStatusViewer></NodeStatusViewer>

    <SiderPopup />
    <SelectWalletPopup />
    <ChangeTargetLeveragePopup />

    <div class="faucet-tip" v-if="showFaucetTip">
      <i class="el-icon-loading"></i>
      <div>
        <div class="msg">{{ $t('transaction.faucet') }}</div>
        <div class="time">{{ faucetNow | datetimeFormatter }}</div>
      </div>
    </div>
    <AuthMask v-show="false" :show-mask="false"></AuthMask>
    <ChangeMarginPopup />
    <WrapPopup />
    <DialogProcess/>
    <WrongChainPopup/>
    <PoolLiquidityPopup/>
  </div>
</template>
<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import { Mutation, namespace } from 'vuex-class'
import { formatPrice, getMetaProperty, setLocalStorage } from '@/utils'
import { SUPPORTED_WALLET } from '@/business-components/wallet/wallet-connector'
import {
  AuthSingletonMixin,
  FaucetMixin,
  OrderSingletonMixin,
  OrderWSSingletonMixin,
  StoreTrackerSingletonMixin,
  WalletSingletonMixin,
} from '@/mixins'
import { SiderPopup, SelectWalletPopup, AuthMask, WrongChainPopup, PoolLiquidityPopup } from '@/mobile/business-components'

import BigNumber from 'bignumber.js'
import {
  AUTH_EVENT,
  COMMON_EVENT,
  ERROR_EVENTS,
  FAUCET_EVENT,
  PLACE_ORDER_EVENT,
  VUE_EVENT_BUS,
  WALLET_EVENT
} from '@/event'
import { MCError, OrderStruct, PerpetualCombinedState } from '@/type'
import { changeLang } from '@/locales/index-mobile'
import moment from 'moment'
import ChangeMarginPopup from '@/mobile/template/Trade/ChangeMarginPopup.vue'
import WrapPopup from '@/mobile/template/Trade/WrapPopup.vue'
import ChangeTargetLeveragePopup from '@/mobile/business-components/ChangeTargetLeveragePopup.vue'
import DialogProcess from '@/mobile/business-components/DialogProcess.vue'
import NodeStatusViewer from '@/mobile/business-components/NodeStatusViewer.vue'
import { NETWORK_ENV, SUPPORTED_NETWORK_ID } from '@/const'

const isMainnet = NETWORK_ENV.CHAIN_ID === SUPPORTED_NETWORK_ID.MAINNET

const userAgentInfo = window.navigator.userAgent
const Agents = ['Android', 'iPhone', 'SymbianOS', 'Windows Phone', 'iPad', 'iPod']
const isPhone = Agents.some((item) => userAgentInfo.indexOf(item) > -1)

const wallet = namespace('wallet')
const perpetual = namespace('perpetual')
const preference = namespace('preference')
const auth = namespace('auth')
const token = namespace('token')

@Component({
  components: {
    ChangeMarginPopup,
    WrapPopup,
    SiderPopup,
    SelectWalletPopup,
    FaucetMixin,
    AuthMask,
    ChangeTargetLeveragePopup,
    DialogProcess,
    WrongChainPopup,
    NodeStatusViewer,
    PoolLiquidityPopup,
  },
})
export default class App extends Mixins(
  WalletSingletonMixin,
  StoreTrackerSingletonMixin,
  OrderSingletonMixin,
  OrderWSSingletonMixin,
  AuthSingletonMixin,
  FaucetMixin
) {
  @wallet.Mutation('setWallet') setWallet!: Function
  @wallet.Action('recover') recoverWallet!: Function
  @wallet.Action('connectWallet') connectWallet!: (walletType?: SUPPORTED_WALLET) => Promise<void>
  @wallet.Getter('address') address!: string | null
  @perpetual.Getter('getPerpetualFunc') getPerpetualFunc!: (perpetualID: string) => PerpetualCombinedState | null
  @preference.Mutation('changeTheme') changeTheme!: (theme: string) => void
  @preference.State('theme') theme!: string
  @auth.Mutation('clearAuthData') clearAuthData!: (params: { address: string }) => void
  @token.Action('initTokenConfig') initTokenConfig!: () => Promise<void>

  @Mutation('setIsMobile') setIsMobile!: (isMobile: boolean) => void

  wallet = { address: '', cachedETHBalance: new BigNumber(0), walletType: SUPPORTED_WALLET.InvalidType }
  private showFaucetTip: boolean = false
  private faucetNow: moment.Moment | null = null

  async mounted() {
    this.setIsMobile(true)
    this.listenErrorEvents()
    this.listenWalletEvents()
    this.listenOrderEvents()
    this.connectWallet(SUPPORTED_WALLET.InvalidType)
    this.initTokenConfig()

    VUE_EVENT_BUS.on(AUTH_EVENT.AUTH_ERROR, this.clearAuth)

    VUE_EVENT_BUS.on(COMMON_EVENT.LANGUAGE_CHANGED, (lang: any) => {
      this.$i18n.locale = lang
      setLocalStorage('lang', lang)
    })

    VUE_EVENT_BUS.on(FAUCET_EVENT.START, () => {
      this.showFaucetTip = true
      this.faucetNow = moment()
      window.setTimeout(() => {
        this.showFaucetTip = false
      }, 3000)
    })
    VUE_EVENT_BUS.on(FAUCET_EVENT.END, () => {
      this.showFaucetTip = false
    })

    document.body.classList.add('dex-theme-dark')
  }

  destroyed() {
    VUE_EVENT_BUS.off(AUTH_EVENT.AUTH_ERROR, this.clearAuth)
  }

  clearAuth() {
    if (this.address) {
      this.clearAuthData({ address: this.address })
    }
  }

  listenErrorEvents() {
    const errorCooldown: any = {}
    VUE_EVENT_BUS.on(ERROR_EVENTS.ShowMcError, (error: MCError) => {
      if (errorCooldown[error.message]) {
        return
      }
      this.$mcmNotify({
        title: this.$t(error.helpCaptionKey).toString(),
        message: this.$t(error.helpKey, { message: error.message }).toString(),
        type: 'danger',
        position: 'bottom'
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
        args: any,
        title?: string
      }) => {
        if (typeof args === 'undefined') {
          args = {}
        }
        const value = this.$t(message, args).toString()
        this.$mcmNotify({
          title: title ? title : this.$t('messageTip.error').toString(),
          message: value,
          type: type === 'error' ? 'danger' : type,
          position: 'bottom'
        })
      },
    )
  }

  listenWalletEvents() {
    VUE_EVENT_BUS.on(WALLET_EVENT.Invalid, () => {
      this.setWallet({ wallet: null, type: null })
    })
  }

  listenOrderEvents() {
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

    VUE_EVENT_BUS.on(PLACE_ORDER_EVENT.WSOrderChanged, async (params: {
      order: OrderStruct
      blockNumber: number
      transactionHash: string
    }) => {
      await this.onWsOrderChangeEvent(params)
    })

    VUE_EVENT_BUS.on(PLACE_ORDER_EVENT.OrderCreated, (data: any) => {
      if (typeof data === 'undefined' || !data) return
      const value = this.$t('orderNotifications.created', setNotifyData(data)).toString()
      this.$mcmNotify({
        title: this.$t('messageTip.orderCreated').toString(),
        message: value,
        type: 'info',
      })
    })
    VUE_EVENT_BUS.on(PLACE_ORDER_EVENT.OrderMatching, (data: any) => {
      if (typeof data === 'undefined' || !data) return
      const value = this.$t('orderNotifications.matching', setNotifyData(data)).toString()
      this.$mcmNotify({
        title: this.$t('messageTip.orderMatched').toString(),
        message: value,
        type: 'info',
      })
    })
    VUE_EVENT_BUS.on(PLACE_ORDER_EVENT.OrderFilled, (data: any) => {
      if (typeof data === 'undefined' || !data) return
      let value = this.$t('orderNotifications.filled', setNotifyData(data)).toString()
      value += data.closed ? this.$t('orderNotifications.closed').toString() : ''
      this.$mcmNotify({
        title: this.$t('messageTip.orderFilled').toString(),
        message: value,
        type: 'success',
      })
    })
    VUE_EVENT_BUS.on(PLACE_ORDER_EVENT.OrderCanceled, (data: any) => {
      if (typeof data === 'undefined' || !data) return
      let value = this.$t('orderNotifications.canceled', setNotifyData(data)).toString()
      value += data.closed ? this.$t('orderNotifications.closed').toString() : ''
      this.$mcmNotify({
        title: this.$t('messageTip.orderCanceled').toString(),
        message: value,
        type: 'info',
      })
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
  }
}
</script>

<style lang="scss">
@import './mobile/style.scss';

#app {
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow-x: auto;
  background-color: var(--mc-background-color-dark);

  .main-box {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .main-box.show-menu {
    padding-bottom: 50px;
    min-height: 100vh;
  }

  .faucet-tip {
    position: fixed;
    top: 8px;
    margin: 0 16px;
    z-index: 1000;
    padding: 22px 16px;
    background-color: #f7f8f9;
    color: var(--mc-text-color);
    display: flex;
    align-items: center;
    border-radius: var(--mc-border-radius-m);

    .el-icon-loading {
      font-size: 20px;
      margin-right: 8px;
    }

    .msg {
      font-size: 16px;
      line-height: 20px;
    }

    .time {
      font-size: 14px;
      line-height: 20px;
    }
  }
}

#app {
  overflow-y: auto;
}

::-webkit-scrollbar {
  width: 0;
  height: 0;
}
</style>

<style scoped lang="scss">
.satori-fantasy {
  #app {
    background-color: var(--mc-background-color-darkest);
  }
}
</style>
