<template>
  <div class="global-notification" v-if="hasNotification">
    <template v-if="errorPrompts.length">
      <div class="global-notification-bar error" v-for="(prompt, index) in errorPrompts" :key="index">
        <McNotification type="error" :content="prompt"></McNotification>
      </div>
    </template>
    <template v-if="warnPrompts.length">
      <div class="global-notification-bar warn" v-for="prompt in warnPrompts" :key="prompt">
        <McNotification type="warning" :content="prompt"></McNotification>
      </div>
    </template>
    <template v-if="infoPrompts.length">
      <div class="global-notification-bar info" v-for="prompt in infoPrompts" :key="prompt">
        <McNotification type="info" :content="prompt"></McNotification>
      </div>
    </template>
  </div>
</template>

<script lang='ts'>
import { Component, Prop, Vue } from 'vue-property-decorator'
import { GLOBAL_NOTIFICATION_EVENT, VUE_EVENT_BUS } from '@/event'
import McNotification from './McNotification.vue'

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
    McNotification,
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
  }

  beforeDestroy() {
    VUE_EVENT_BUS.off(GLOBAL_NOTIFICATION_EVENT.SHOW, this.onShowGlobalNotification)
    VUE_EVENT_BUS.off(GLOBAL_NOTIFICATION_EVENT.HIDE, this.onHideGlobalNotification)
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
  margin-top: 1px;

  .global-notification-bar {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 0.14rem;
    min-height: 40px;
    margin: 1px 0;

    &:last-of-type {
      margin-bottom: 0;
    }

    &:first-of-type {
      margin-top: 0;
    }

    .mc-notification {
      display: block;
      width: 100%;
    }
  }
}
</style>
