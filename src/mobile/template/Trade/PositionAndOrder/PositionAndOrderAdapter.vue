<template>
  <div class="position-order-adapter">
    <div class="tabs-container">
      <McMTabs v-model="activeTab" :tabs="tabsOption" :equal-width="true"></McMTabs>
      <span class="history" @click="goHistory">
        <i class="iconfont icon-details"></i>
        {{ $t('base.history') }}
      </span>
      <div class="divider"></div>
    </div>

    <div class="data-container">
      <Positions v-if="activeTab === 'position'" />
      <Orders v-if="activeTab === 'openOrders'" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { AccountStorageDirectoryItem, OrderStruct } from '@/type'
import { namespace } from 'vuex-class'
import Positions from './Positions.vue'
import Orders from './Orders.vue'
import { ROUTE } from '@/mobile/router'
import { McMTabs } from '@/mobile/components'

type PositionItem = { perpetualID: string } & AccountStorageDirectoryItem

const account = namespace('account')
const order = namespace('order')
const wallet = namespace('wallet')

@Component({
  components: {
    Positions,
    Orders,
    McMTabs,
  },
})
export default class PositionAndOrderAdapter extends Vue {
  @account.Getter('accountStorageWithPositions') positions!: PositionItem[]
  @order.Getter('openOrders') openOrders!: OrderStruct[]
  @wallet.Getter('isConnectedWallet') isConnectedWallet!: boolean

  activeTab: 'position' | 'openOrders' = 'position'

  get tabsOption(): Array<{ label: string, value: string }> {
    return [
      {
        label: this.$t('base.positions').toString() +
          `${this.totalCount.positions ? ` (${this.totalCount.positions})`: '' }`,
        value: 'position'
      },
      {
        label: this.$t('base.openOrders').toString() +
          `${this.totalCount.openOrders ? ` (${this.totalCount.openOrders})`: '' }`,
        value: 'openOrders'
      },
    ]
  }

  get totalCount() {
    return {
      positions: this.positions.length,
      openOrders: this.openOrders.length,
    }
  }

  private goHistory() {
    this.$router.push({ name: ROUTE.TRADE_HISTORY })
  }
}
</script>

<style scoped lang="scss">
.position-order-adapter {
  .tabs-container {
    position: sticky;
    top: -1px;
    z-index: 1;
    background: var(--mc-background-color-dark);

    ::v-deep .mc-m-tabs {
      height: 49px;
      line-height: 49px;
    }

    .history {
      position: absolute;
      top: 0;
      right: 0;
      height: 48px;
      display: flex;
      align-items: center;
      color: var(--mc-text-color);
      font-size: 14px;
      line-height: 16px;

      .icon-details {
        color: var(--mc-text-color);
        margin-right: 4px;
        font-size: 16px;
      }
    }

    .divider {
      position: absolute;
      left: -16px;
      right: -16px;
      bottom: 0;
      margin: 0;
      border-bottom: 1px solid var(--mc-border-color);
    }
  }

  .data-container {
    min-height: 172px;
  }
}
</style>
