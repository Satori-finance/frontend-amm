<template>
  <section class="position-orders">
    <div class="head">
      <ul class="nav">
        <li v-for="(item, index) in tableNav" :key="index" :class="{ selected: item.key === selectedNav }">
          <el-badge is-dot class="item" :hidden="!isUpdated[item.key]">
            <button @click="onTabClicked(item.key)">
              {{ item.name }} <span v-if="totalCount[item.key] !== undefined">({{ totalCount[item.key] }})</span>
            </button>
          </el-badge>
        </li>
      </ul>
      <el-button
        size="mini"
        plain
        round
        v-if="selectedNav === 'tradeHistory'"
        class="save-btn"
        @click="exportTradeHistory"
      >
        <i class="iconfont icon-save"></i>
        {{ $t('saveAsCsv') }}
      </el-button>
    </div>
    <div class="content" v-show="!initializing">
      <keep-alive>
        <Positions v-if="initializing || selectedNav === 'positions'" @change="onPositionsChange" />
      </keep-alive>
      <keep-alive>
        <Orders v-if="initializing || selectedNav === 'openOrders'" />
      </keep-alive>
      <keep-alive>
        <OrderHistory v-if="initializing || selectedNav === 'closedOrders'" />
      </keep-alive>
      <keep-alive>
        <TradeHistory
          ref="tradeHistory"
          v-if="initializing || selectedNav === 'tradeHistory'"
          @change="onTradeHistoryChange"
        />
      </keep-alive>
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator'
import Positions from './Positions.vue'
import TradeHistory from './TradeHistory.vue'
import Orders from './Orders.vue'
import OrderHistory from './OrderHistory.vue'
import { namespace } from 'vuex-class'
import { PLACE_ORDER_EVENT, VUE_EVENT_BUS } from '@/event'
import { AccountStorageDirectoryItem, OrderStruct } from '@/type'
type PositionItem = { perpetualID: string } & AccountStorageDirectoryItem
const wallet = namespace('wallet')
const account = namespace('account')
const order = namespace('order')
@Component({
  components: {
    TradeHistory,
    Positions,
    Orders,
    OrderHistory,
  },
})
export default class PositionsAndOrders extends Vue {
  @wallet.Getter('address') address!: string
  @account.Getter('accountStorageWithPositions') positions!: PositionItem[]
  @order.Getter('openOrders') openOrders!: OrderStruct[]
  @Ref('tradeHistory') tradeHistoryComp!: TradeHistory
  selectedNav: string = 'positions'
  initializing = true
  positionsUpdated = false
  tradeHistoryUpdated = false
  openOrdersUpdated = false
  closedOrdersUpdated = false
  tradeHistoryNum = 0
  get tableNav() {
    return [
      { name: this.$t('base.positions'), key: 'positions' },
      { name: this.$t('base.openOrders'), key: 'openOrders' },
      { name: this.$t('base.closedOrders'), key: 'closedOrders' },
      { name: this.$t('base.tradeHistory'), key: 'tradeHistory' },
    ]
  }
  get totalCount() {
    return {
      positions: this.positions.length,
      openOrders: this.openOrders.length,
    }
  }
  get isUpdated() {
    return {
      positions: this.positionsUpdated,
      tradeHistory: this.tradeHistoryUpdated,
      openOrders: this.openOrdersUpdated,
      closedOrders: this.closedOrdersUpdated,
    }
  }
  mounted() {
    setTimeout(() => {
      this.initializing = false
    }, 100)
    VUE_EVENT_BUS.on([PLACE_ORDER_EVENT.OrderFilled, PLACE_ORDER_EVENT.OrderCreated, PLACE_ORDER_EVENT.InitLoadOrders], this.onOpenOrderChange)
    VUE_EVENT_BUS.on(PLACE_ORDER_EVENT.OrderClosed, this.onCloseOrderChange)
  }
  destroyed() {
    VUE_EVENT_BUS.off([PLACE_ORDER_EVENT.OrderFilled, PLACE_ORDER_EVENT.OrderCreated, PLACE_ORDER_EVENT.InitLoadOrders], this.onOpenOrderChange)
    VUE_EVENT_BUS.off(PLACE_ORDER_EVENT.OrderClosed, this.onCloseOrderChange)
  }
  onTabClicked(key: string) {
    this.selectedNav = key
  }
  onOpenOrderChange() {
    if (this.selectedNav !== 'openOrders') {
      this.openOrdersUpdated = true
    }
  }
  onCloseOrderChange() {
    if (this.selectedNav !== 'closedOrders') {
      this.closedOrdersUpdated = true
    }
    this.onOpenOrderChange()
  }
  cancelAllOrders() {
  }
  closeCancelOrderHandler() {
  }
  confirmCancelOrderHandler() {
    VUE_EVENT_BUS.emit('cancelAllOrders')
  }
  onTradeHistoryChange(length: number) {
    this.tradeHistoryNum = length
    if (this.selectedNav !== 'tradeHistory') {
      this.tradeHistoryUpdated = true
    }
  }
  @Watch('selectedNav')
  onSelectedChange(val: string) {
    switch (val) {
      case 'positions':
        this.positionsUpdated = false
        break
      case 'tradeHistory':
        this.tradeHistoryUpdated = false
        break
      case 'openOrders':
        this.openOrdersUpdated = false
        break
      case 'closedOrders':
        this.closedOrdersUpdated = false
        break
      default:
        break
    }
  }
  onPositionsChange() {
    if (this.selectedNav === 'positions') {
      return
    }
    this.positionsUpdated = true
  }
  exportTradeHistory() {
    this.tradeHistoryComp.exportToCSV()
  }
}
</script>

<style lang="scss" scoped>
.position-orders {
  position: relative;
  height: 100%;
  .head {
    display: flex;
    align-items: center;
    padding: 0 16px;
    box-sizing: content-box;
    height: 48px;
    .save-btn {
      margin-left: auto;
      height: 24px;
      border-radius: 12px;
      background: transparent;
      color: var(--mc-text-color);
      &:hover {
        background: var(--mc-background-color-dark);
        color: var(--mc-color-primary);
      }
    }
    .middle-button {
      padding: 0 0.08rem;
      height: 0.2rem;
      margin-left: auto;
      font-weight: normal;
      font-size: 0.12rem;
      .iconfont {
        font-weight: bold;
        margin-left: 0.08rem;
      }
    }
  }
  .nav {
    display: flex;
    align-items: center;
    height: 42px;
    li {
      height: 100%;
      display: flex;
      align-items: center;
      margin-right: 32px;
      position: relative;
      &.selected {
        button {
          color: var(--mc-text-color-white);
        }
        &:after {
          background: linear-gradient(90deg, #00d8e2 0%, #27a2f8 100%);
          content: '';
          height: 3px;
          left: 0;
          bottom: 0;
          position: absolute;
          width: 100%;
        }
      }
      &:first-of-type .el-badge {
        margin-left: 0;
      }
      .el-badge {
        button {
          &:hover {
            color: #ffffff;
          }
        }
      }
      button {
        height: 100%;
        white-space: nowrap;
        background: none;
        outline: none;
        border: 0;
        font-size: 14px;
        cursor: pointer;
        position: relative;
      }
    }
  }
  .content {
    height: calc(100% - 0.4rem);
    position: relative;
    padding: 0 16px 16px;
  }
}
</style>

<style lang="scss" scoped>
@import '~@mcdex/style/common/var';
.position-orders {
  .head {
    color: var(--mc-text-color-white);
    background-color: rgba($--mc-background-color-dark, 0.5);
    border-bottom: 1px solid var(--mc-border-color);
    .middle-button {
      color: var(--menu-color);
      background: var(--background-color-base);
      &:hover {
        color: var(--strong-menu-color);
        background: var(--background-color-base);
      }
    }
  }
  .nav {
    li button {
      color: var(--mc-text-color);
      &:hover {
        color: var(--mc-color-primary);
      }
      &:before {
        background: #e73c87;
      }
    }

    li.selected {
      &::after {
        bottom: -3px;
      }
    }
  }
}
</style>

<style lang="scss" scoped>
.satori-fantasy .position-orders {
  .head {
    background-color: var(--mc-background-color-darkest);
  }
  .content {
    background-color: var(--mc-background-color-darkest);
  }
  .save-btn {
    background-color: transparent;
    &:hover {
      color: #ffffff;
    }
  }
}
</style>
