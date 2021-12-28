<template>
  <div class="admh-container">
    <div class="page-container">
      <div class="tabs-container">
        <McTabs v-model="activeTab" :tabs="typeOptions"
                :equal-width="true"/>
      </div>

      <div class="data-container">
        <keep-alive>
          <div class="amm-depth" v-if="activeTab === 'AMMDepth'">
            <ReadonlyAMMDepth
              :perpetual-storage="perpetualStorage"
              :perpetual-property="perpetualProperty"
              :liquidity-pool="liquidityPool"
            />
          </div>
        </keep-alive>
        <keep-alive>
          <div class="marketHistory-container" v-if="activeTab === 'recentTrades'">
            <MarketHistory />
          </div>
        </keep-alive>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { State } from 'vuex-class'
import MarketHistory from './MarketHistory.vue'
import { PerpetualProperty } from '@/type'
import { LiquidityPoolStorage } from '@mcdex/mai3.js'
import { PerpetualStorage } from '@mcdex/mai3.js/dist/types'
import ReadonlyAMMDepth from '@/mobile/business-components/AMMDepth/ReadonlyAMMDepth.vue'
import { McTabs } from '@/components'

@Component({
  components: {
    MarketHistory,
    ReadonlyAMMDepth,
    McTabs,
  },
})
export default class AMMDepthAndMarketHistory extends Vue {
  @State('latestBlockNumber') latestBlockNumber !: number | null

  @Prop({ required: true, default: () => null }) perpetualProperty!: PerpetualProperty | null
  @Prop({ required: true, default: () => null }) liquidityPool!: LiquidityPoolStorage | null
  @Prop({ required: true, default: () => null }) perpetualStorage!: PerpetualStorage | null

  activeTab = 'AMMDepth'

  get typeOptions() {
    return [
      { label: this.$t('base.AMMDepth').toString(), value: 'AMMDepth' },
      { label: this.$t('recentTrades').toString(), value: 'recentTrades' },
    ]
  }
}
</script>

<style scoped lang="scss">
.admh-container {
  background: var(--mc-background-color-dark);

  .tabs-container {
    position: sticky;
    top: 0;
    z-index: 2;
    width: 100%;
    padding: 0px 16px;
    border-bottom: 1px solid var(--mc-border-color);
    background: var(--mc-background-color-dark);

    .mc-tabs {
      width: 270px;
      margin: auto;
      height: 48px;

      ::v-deep .tab-item {
        height: 48px;
        line-height: 47px;
      }
    }

    .divider {
      position: absolute;
      left: -4px;
      right: -4px;
      bottom: 0;
      margin: 0;
      border-bottom: 1px solid #373f5c;
    }
  }

  .amm-depth {
    padding: 16px;
  }
  .marketHistory-container {
    padding: 16px;
  }
}
</style>
