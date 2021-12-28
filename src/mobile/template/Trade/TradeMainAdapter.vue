<template>
  <div class="trade-main-adapter">
    <router-view v-bind="{ symbol }"></router-view>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import { SelectedPerpetualMixin } from '@/mixins'
import { PerpetualState } from '@mcdex/mai3.js'
import { GLOBAL_NOTIFICATION_EVENT, VUE_EVENT_BUS } from '@/event'
import { NOTIFICATION_KEY } from '@/type'

@Component
export default class TradeMainAdapter extends Mixins(SelectedPerpetualMixin) {
  get symbol() {
    return this.$route.params.symbol
  }

  updated() {
    this.globalDangerNotice()
  }

  destroyed() {
    this.clearGlobalNotification()
  }

  clearGlobalNotification() {
    VUE_EVENT_BUS.emit(GLOBAL_NOTIFICATION_EVENT.HIDE, 'warn', NOTIFICATION_KEY.PerpetualEmergency)
    VUE_EVENT_BUS.emit(GLOBAL_NOTIFICATION_EVENT.HIDE, 'error', NOTIFICATION_KEY.PerpetualCleared)
    VUE_EVENT_BUS.emit(GLOBAL_NOTIFICATION_EVENT.HIDE, 'warn', NOTIFICATION_KEY.AmmUnsafePrompt)
    VUE_EVENT_BUS.emit(GLOBAL_NOTIFICATION_EVENT.HIDE, 'warn', NOTIFICATION_KEY.PoolNotRunWarn)
  }

  @Watch('selectedPerpetualStorage', { immediate: true })
  @Watch('selectedPerpetualStorage.state', { immediate: true })
  @Watch('selectedPerpetualAmmIsSafe', { immediate: true })
  @Watch('selectedPerpetualOracleIsTerminated', { immediate: true })
  globalDangerNotice() {
    this.clearGlobalNotification()
    if (!this.selectedPerpetualStorage) {
      return
    }
    if (this.selectedPerpetualStorage.state === PerpetualState.EMERGENCY) {
      VUE_EVENT_BUS.emit(GLOBAL_NOTIFICATION_EVENT.SHOW, {
        type: 'warn',
        key: NOTIFICATION_KEY.PerpetualEmergency,
        i18nKey: 'perpetualSettle.isEmergencyPrompt',
        params: {}
      })
    } else if (this.selectedPerpetualStorage.state === PerpetualState.CLEARED) {
      VUE_EVENT_BUS.emit(GLOBAL_NOTIFICATION_EVENT.SHOW, {
        type: 'error',
        key: NOTIFICATION_KEY.PerpetualCleared,
        i18nKey: 'perpetualSettle.isGlobalSettledPrompt',
        params: {}
      })
    } else if (!this.selectedPerpetualAmmIsSafe || this.selectedPerpetualOracleIsTerminated) {
      VUE_EVENT_BUS.emit(GLOBAL_NOTIFICATION_EVENT.SHOW, {
        type: 'warn',
        key: NOTIFICATION_KEY.AmmUnsafePrompt,
        i18nKey: 'globalNotification.ammUnsafePrompt',
        params: {}
      })
    } else if (!this.selectedLiquidityPoolStorage?.isRunning) {
      VUE_EVENT_BUS.emit(GLOBAL_NOTIFICATION_EVENT.SHOW, {
        type: 'warn',
        key: NOTIFICATION_KEY.PoolNotRunWarn,
        i18nKey: 'globalNotification.poolNotRunPrompt',
      })
    } else {
      this.clearGlobalNotification()
    }
  }
}
</script>

<style scoped lang="scss">
.trade-main-adapter {
  height: 100%;
}
</style>

