<template>
  <div class="order-book">
    <AMMDepth v-if="selectedType === 'ammDepth'" :h="h" :w="w" :max-w="maxW" :active-orders="openOrders" :perpetual-property="selectedPerpetualProperty" :perpetual-storage="selectedPerpetualStorage" :liquidity-pool="selectedLiquidityPoolStorage">
      <template #head>
        <McTabs v-model="selectedType" :tabs="typeOptions" :equal-width="true" />
      </template>
    </AMMDepth>
    <RecentTrades :h="h" :w="w" :max-w="maxW">
      <template #head>
        <McTabs v-model="selectedType" :tabs="typeOptions" :equal-width="true" />
      </template>
    </RecentTrades>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { SelectedPerpetualMixin } from '@/mixins'
import AMMDepth from '@/business-components/AMMDepth/AMMDepth.vue'
import RecentTrades from '../RecentTrades.vue'
import { OrderDirectoryItem } from '@/store/order'
import { McTabs } from '@/components'

const order = namespace('order')

@Component({
  components: {
    AMMDepth,
    RecentTrades,
    McTabs,
  },
})
export default class OrderBook extends Mixins(SelectedPerpetualMixin) {
  @Prop({ default: 0 }) w!: number
  @Prop({ default: 0 }) h!: number
  @Prop({ default: 0 }) maxW!: number
  @Prop({ default: () => null }) activeOrders!: any

  @order.Getter('openOrders') openOrders!: OrderDirectoryItem[]

  private selectedType: 'ammDepth' | 'recentTrades' = 'ammDepth'

  get typeOptions() {
    return [
      {
        label: this.$t('AMMDepth').toString(),
        value: 'ammDepth',
      },
      {
        label: this.$t('base.trades').toString(),
        value: 'recentTrades',
      },
    ]
  }
}
</script>

<style lang="scss" scoped>
.order-book {
  height: 100%;

  min-width: 360px;

  .mc-tabs {
    height: 48px;
    line-height: 48px;

    ::v-deep .tab-item:last-of-type {
      margin-left: 32px;
    }
  }
}
</style>

