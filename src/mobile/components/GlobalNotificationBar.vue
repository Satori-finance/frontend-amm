<template>
  <div class="global-notification" v-if="hasNotification">
    <template v-if="errorPrompts.length">
      <div class="global-notification-bar" v-for="(prompt, index) in errorPrompts" :key="index">
        <NoticeBar type="error" :text="prompt"></NoticeBar>
      </div>
    </template>
    <template v-if="warnPrompts.length">
      <div class="global-notification-bar" v-for="prompt in warnPrompts" :key="prompt">
        <NoticeBar type="warning" :text="prompt"></NoticeBar>
      </div>
    </template>
    <template v-if="infoPrompts.length">
      <div class="global-notification-bar" v-for="prompt in infoPrompts" :key="prompt">
        <NoticeBar type="info" :text="prompt"></NoticeBar>
      </div>
    </template>
  </div>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator'
import { GLOBAL_NOTIFICATION_EVENT, GRAPH_EVENTS, PRICE_CHART_EVENTS, RELAYER_EVENTS, VUE_EVENT_BUS, WS_EVENTS } from '@/event'
import NoticeBar from './NoticeBar.vue'
import { NOTIFICATION_KEY } from '@/type'

interface Argument {
  type: 'error' | 'warn' | 'info',
  key: string | number,
  i18nKey: string,
  params?: Array<any> | { [key: string]: any }
}

interface NotificationMessage {
  i18nKey: string
  params?: any[] | { [key: string]: any }
}

@Component({
  components: {
    NoticeBar,
  },
})
export default class GlobalNotificationBar extends Vue {
  private errorContent: { [key: number]: NotificationMessage } = {}
  private warnContent: { [key: number]: NotificationMessage } = {}
  private infoContent: { [key: number]: NotificationMessage } = {}

  get errorPrompts() {
    const arr = Object.values(this.errorContent)
    return arr.map(message => this.$t(message.i18nKey, message.params))
  }

  get warnPrompts() {
    const arr = Object.values(this.warnContent)
    return arr.map(message => this.$t(message.i18nKey, message.params))
  }

  get infoPrompts() {
    const arr = Object.values(this.infoContent)
    return arr.map(message => this.$t(message.i18nKey, message.params))
  }

  get hasNotification() {
    return this.errorPrompts.length || this.warnPrompts.length || this.infoPrompts.length
  }

  mounted() {
    VUE_EVENT_BUS.on(GLOBAL_NOTIFICATION_EVENT.SHOW, this.onShowGlobalNotification)
    VUE_EVENT_BUS.on(GLOBAL_NOTIFICATION_EVENT.HIDE, this.onHideGlobalNotification)
    VUE_EVENT_BUS.on(RELAYER_EVENTS.SHOW, this.onShowRelayerNotification)
    VUE_EVENT_BUS.on(GRAPH_EVENTS.SHOW, this.onShowGraphNotification)
    VUE_EVENT_BUS.on(WS_EVENTS.SHOW, this.onShowWSNotification)
    VUE_EVENT_BUS.on(PRICE_CHART_EVENTS.SHOW, this.onShowPriceChartNotification)
    VUE_EVENT_BUS.on(RELAYER_EVENTS.HIDE, this.onHideRelayerNotification)
    VUE_EVENT_BUS.on(GRAPH_EVENTS.HIDE, this.onHideGraphNotification)
    VUE_EVENT_BUS.on(PRICE_CHART_EVENTS.HIDE, this.onHidePriceChartNotification)
    VUE_EVENT_BUS.on(WS_EVENTS.HIDE, this.onHideWSNotification)
  }

  beforeDestroy() {
    VUE_EVENT_BUS.off(GLOBAL_NOTIFICATION_EVENT.SHOW, this.onShowGlobalNotification)
    VUE_EVENT_BUS.off(GLOBAL_NOTIFICATION_EVENT.HIDE, this.onHideGlobalNotification)
    VUE_EVENT_BUS.off(RELAYER_EVENTS.SHOW, this.onShowRelayerNotification)
    VUE_EVENT_BUS.off(GRAPH_EVENTS.SHOW, this.onShowGraphNotification)
    VUE_EVENT_BUS.off(PRICE_CHART_EVENTS.SHOW, this.onShowPriceChartNotification)
    VUE_EVENT_BUS.off(WS_EVENTS.SHOW, this.onShowWSNotification)
    VUE_EVENT_BUS.off(RELAYER_EVENTS.HIDE, this.onHideRelayerNotification)
    VUE_EVENT_BUS.off(GRAPH_EVENTS.HIDE, this.onHideGraphNotification)
    VUE_EVENT_BUS.off(PRICE_CHART_EVENTS.HIDE, this.onHidePriceChartNotification)
    VUE_EVENT_BUS.off(WS_EVENTS.HIDE, this.onHideWSNotification)
  }

  private onShowGlobalNotification({ type = 'error', key, i18nKey, params }: Argument): void {
    if (type === 'error') {
      this.$set(this.errorContent, key, { i18nKey, params })
    } else if (type === 'warn') {
      this.$set(this.warnContent, key, { i18nKey, params })
    } else if (type === 'info') {
      this.$set(this.infoContent, key, { i18nKey, params })
    }
  }

  private onShowRelayerNotification() {
    this.onShowGlobalNotification({
      type: 'error',
      key: NOTIFICATION_KEY.RelayerServerError,
      i18nKey: 'globalNotification.relayerServerError',
    })
  }

  private onHideRelayerNotification() {
    this.onHideGlobalNotification('error', NOTIFICATION_KEY.RelayerServerError)
  }

  private onShowGraphNotification() {
    this.onShowGlobalNotification({
      type: 'error',
      key: NOTIFICATION_KEY.GraphServerError,
      i18nKey: 'globalNotification.graphServerError',
    })
  }

  private onHideGraphNotification() {
    this.onHideGlobalNotification('error', NOTIFICATION_KEY.GraphServerError)
  }

  private onShowPriceChartNotification() {
    this.onShowGlobalNotification({
      type: 'error',
      key: NOTIFICATION_KEY.OracleChartServerError,
      i18nKey: 'globalNotification.oracleChartServerError',
    })
  }

  private onHidePriceChartNotification() {
    this.onHideGlobalNotification('error', NOTIFICATION_KEY.OracleChartServerError)
  }

  private onShowWSNotification() {
    this.onShowGlobalNotification({
      type: 'error',
      key: NOTIFICATION_KEY.WSError,
      i18nKey: 'globalNotification.wsError',
    })
  }

  private onHideWSNotification() {
    this.onHideGlobalNotification('error', NOTIFICATION_KEY.WSError)
  }

  private onHideGlobalNotification(type: Argument['type'] = 'error', key: Argument['key']): void {
    if (type === 'error') {
      this.$delete(this.errorContent, key)
    } else if (type === 'warn') {
      this.$delete(this.warnContent, key)
    } else if (type === 'info') {
      this.$delete(this.infoContent, key)
    }
  }
}
</script>

<style lang="scss" scoped>
.global-notification {
  .global-notification-bar {
    &:last-of-type {
      margin-bottom: 0;
    }

    &:first-of-type {
      margin-top: 0;
    }
  }
}
</style>
