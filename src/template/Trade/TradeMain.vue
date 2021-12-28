<template>
  <div class="trade-main">
    <div class="normal" v-if="selectedPerpetualIsNormal">
      <div class="main">
        <GridContainer
          class="grid-container"
        />
      </div>
    </div>
    <div class="clear-container" v-else>
      <PerpetualClearMain/>
    </div>
    <MarginChangeRiskNotice v-if="selectedPerpetualIsNormal" :selected-perpetual="selectedPerpetual" />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import TradePanel from './OrderTrade/TradePanel.vue'
import { NOTIFICATION_KEY } from '@/type'
import GridContainer from './GridContainer.vue'
import PerpetualClearMain from '@/template/Clear/PerpetualClearMain.vue'
import { SelectedPerpetualMixin } from '@/mixins'
import { GLOBAL_NOTIFICATION_EVENT, VUE_EVENT_BUS } from '@/event'
import { MarginChangeRiskNotice } from '@/business-components'

const perpetual = namespace('perpetual')

@Component({
  components: {
    TradePanel,
    GridContainer,
    PerpetualClearMain,
    MarginChangeRiskNotice,
  },
})
export default class TradeMain extends Mixins(SelectedPerpetualMixin) {

  get selectedPerpetualIsNormal(): boolean {
    return !this.selectedPerpetualIsSettle && this.selectedPerpetualAmmIsSafe
      && !this.selectedPerpetualOracleIsTerminated
  }

  @Watch('selectedLiquidityPoolStorage', { immediate: true })
  handleRunState() {
    if (!this.selectedLiquidityPoolStorage) {
      return
    }
    if (this.selectedLiquidityPoolStorage.isRunning) {
      VUE_EVENT_BUS.emit(GLOBAL_NOTIFICATION_EVENT.HIDE, 'warn', NOTIFICATION_KEY.PoolNotRunWarn)
    } else {
      VUE_EVENT_BUS.emit(GLOBAL_NOTIFICATION_EVENT.SHOW, {
        type: 'warn',
        key: NOTIFICATION_KEY.PoolNotRunWarn,
        i18nKey: 'globalNotification.poolNotRunPrompt',
      })
    }
  }

  get symbol(): number {
    return this.selectedPerpetualProperty?.symbol || 0
  }

  destroyed() {
    VUE_EVENT_BUS.emit(GLOBAL_NOTIFICATION_EVENT.HIDE, 'info', NOTIFICATION_KEY.Attention)
    VUE_EVENT_BUS.emit(GLOBAL_NOTIFICATION_EVENT.HIDE, 'warn', NOTIFICATION_KEY.PoolNotRunWarn)
  }
}
</script>

<style lang="scss" scoped>
.trade-main {
  width: 100%;
  margin-bottom: -1px;

  .normal {
    display: flex;
    flex: 1;
    width: 100%;
    align-items: stretch;
    height: 100%;
  }

  .trade-panel-container {
    padding: 0.08rem 0 0.08rem 0.08rem;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }

  .main {
    flex: auto;

    .grid-container {
      height: 100%;

      .vue-grid-layout {
        height: 100%;
      }
    }
  }

  .clear-container {
    height: 100%;
  }
}
</style>
