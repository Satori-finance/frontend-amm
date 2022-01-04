<template>
  <div class="mining-main">
    <div class="panel-item" v-if="isBscChain || isArbtestChain || isArbChain">
      <TradingMining />
    </div>
    <div class="panel-item" v-if="isBscChain || isArbtestChain || isArbChain">
      <LiquidityMining />
    </div>
    <div class="panel-item">
      <SwapLiquidityMining />
    </div>
    <div class="panel-item" v-if="false">
      <TransactionMining />
    </div>
<!--        <div class="panel-item">-->
<!--          <SATORIStaking />-->
<!--        </div>-->
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { BaseCardFrame } from '@/components'
import LiquidityMining from './LiquidityMining.vue'
import SwapLiquidityMining from './SwapLiquidityMining.vue'
import SATORIStaking from './SatoriStaking.vue'
import TransactionMining from './TransactionMining.vue'
import TradingMining from './TradingMining.vue'
import { NETWORK_ENV, SUPPORTED_NETWORK_ID } from '@/const'

@Component({
  components: {
    BaseCardFrame,
    LiquidityMining,
    SwapLiquidityMining,
    SATORIStaking,
    TransactionMining,
    TradingMining,
  },
})
export default class MiningSummary extends Vue {
  get isBscChain(): boolean {
    return NETWORK_ENV.CHAIN_ID === SUPPORTED_NETWORK_ID.BSC
  }

  get isArbChain(): boolean {
    return NETWORK_ENV.CHAIN_ID === SUPPORTED_NETWORK_ID.ARB
  }

  get isArbtestChain(): boolean {
    return NETWORK_ENV.CHAIN_ID === SUPPORTED_NETWORK_ID.ARB_TESTNET
  }
}
</script>

<style scoped lang="scss">
.mining-main {
  height: 100%;
  width: 1200px;
  margin: auto;
  display: flex;
  flex-direction: column;
  flex: 1;

  .panel-item {
    padding: 32px 0 16px;

    &:last-child {
      padding: 32px 0 64px;
    }
  }

  ::v-deep.mc-loading .mc-loading__mask .mc-loading__item {
    z-index: 9;
  }
}
</style>
