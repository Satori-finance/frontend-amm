<template>
  <div class="history scroll-container">
    <BackNavBar :title="$t('base.history')"></BackNavBar>
    <div class="page-container">
      <div class="tabs-container">
        <McTabs v-model="activeTab" :tabs="ordersTypeOptions"
                :equal-width="true"/>
      </div>

      <div class="data-container">
        <keep-alive>
          <ClosedOrders v-if="activeTab === 'closedOrders'" />
        </keep-alive>
        <keep-alive>
          <TradeHistory v-if="activeTab === 'tradeHistory'" />
        </keep-alive>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ClosedOrders from './ClosedOrders.vue'
import TradeHistory from './TradeHistory.vue'
import BackNavBar from '@/mobile/template/Header/BackNavBar.vue'
import { McTabs } from '@/components'

@Component({
  components: {
    ClosedOrders,
    TradeHistory,
    BackNavBar,
    McTabs,
  },
})
export default class PerpetualTradeHistory extends Vue {
  private activeTab: 'tradeHistory' | 'closedOrders' = 'tradeHistory'

  get ordersTypeOptions() {
    return [
      { label: this.$t('base.closedOrders').toString(), value: 'closedOrders' },
      { label: this.$t('base.tradeHistory').toString(), value: 'tradeHistory' },
    ]
  }
}
</script>

<style lang="scss" scoped>
.history {
  overflow: hidden;
  background: var(--mc-background-color-dark);

  ::v-deep {
    .van-nav-bar {
      background: var(--mc-background-color-dark);
    }
  }

  .tabs-container {
    height: 49px;
    width: 100%;
    border-bottom: 1px solid var(--mc-border-color);

    ::v-deep .mc-tabs {
      width: 275px;
      margin: 0 auto;

      .tab-item {
        font-size: 14px;
        line-height: 48px;
      }
    }
  }

  .data-container {
    border-radius: 24px 24px 0 0;
  }
}
</style>
