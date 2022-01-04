<template>
  <div class="mining-list-page scroll-container">
    <div class="title">
      <HeaderBar></HeaderBar>
      <div class="tab-container">
        <div class="bg">
          <img src="@/assets/img/satori-bg.png" alt="">
        </div>
        <div class="tabs-box" v-if="miningTypeOptions.length > 1">
          <McTabs v-model="selectMiningType" :tabs="miningTypeOptions" :auto-size="true" />
        </div>
      </div>
    </div>
    <div class="page-container">
      <template v-if="selectMiningType === 'tradingMining'">
        <div class="mining-item">
          <TradingMining></TradingMining>
        </div>
      </template>

      <template v-if="selectMiningType === 'ammMining'">
        <div class="mining-item">
          <MiningPools></MiningPools>
        </div>
      </template>

      <template v-if="selectMiningType === 'mcbPool2'">
        <div class="mining-item">
          <SwapLiquidityMining></SwapLiquidityMining>
        </div>
      </template>
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { McTabs } from '@/components'
import MiningPools from './MiningPools.vue'
import SATORIStaking from './SatoriStaking.vue' 
import TransactionMining from './TransactionMining.vue'
import HeaderBar from '@/mobile/template/Header/HeaderBar.vue'
import SwapLiquidityMining from './SwapLiquidityMining.vue'
import TradingMining from './TradingMining.vue' 
import { SUPPORTED_NETWORK_ID } from '@/const'
import { currentChainConfig } from '@/config/chain'

type miningType = 'tradingMining' | 'ammMining' | 'mcbPool2' | ''

const chainMiningType: { [chainId: number]: miningType[] } = {
  [SUPPORTED_NETWORK_ID.BSC]: ['tradingMining', 'ammMining', 'mcbPool2'],
  [SUPPORTED_NETWORK_ID.ARB]: ['tradingMining', 'ammMining', 'mcbPool2'],
  [SUPPORTED_NETWORK_ID.ARB_TESTNET]: ['tradingMining', 'ammMining', 'mcbPool2'],
}

@Component({
  components: {
    MiningPools,
    SATORIStaking,
    HeaderBar,
    TransactionMining,
    SwapLiquidityMining,
    TradingMining,
    McTabs,
  },
})
export default class MiningList extends Vue {
  private selectMiningType: miningType =
    chainMiningType[currentChainConfig.chainID] && chainMiningType[currentChainConfig.chainID].length > 0
      ? chainMiningType[currentChainConfig.chainID][0]
      : ''

  get miningTypeOptions() {
    let r: any[] = []
    if (!chainMiningType[currentChainConfig.chainID]) {
      return []
    }
    chainMiningType[currentChainConfig.chainID].forEach((item) => {
      r.push({
        value: item,
        label: this.$t(`miningPoolType.${item.toString()}`).toString(),
      })
    })
    return r
  }
}
</script>

<style lang="scss" scoped>
.mining-list-page {
  .page-container {
    height: calc(100% - 103px);
    overflow: scroll;
  }

  .bg {
    position: absolute;
    width: 800px;
    left: calc(50% - 368px);
    filter: blur(90px);
    z-index: 0;
    pointer-events: none;
  }

  .tabs-box {
    margin: 0 16px 0 16px;
    border-bottom: 1px solid var(--mc-border-color);

    .mc-tabs {
      height: 57px;
    }

    ::v-deep .tab-item {
      font-size: 16px !important;
      line-height: 56px;
    }
  }

  .mining-item {
    position: relative;
    z-index: 1;
    padding: 32px 16px 16px 16px;
  }
}
</style>


