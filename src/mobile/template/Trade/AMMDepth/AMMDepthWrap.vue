<template>
  <div class="amm-depth-wrap">
    <van-skeleton :row="13" :loading="loading">
      <AMMDepth :perpetual-storage="selectedPerpetualStorage"
                :perpetual-property="selectedPerpetualProperty"
                :liquidity-pool="selectedLiquidityPoolStorage"
                :row-height="26"/>
    </van-skeleton>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import AMMDepth from '@/mobile/business-components/AMMDepth/AMMDepth.vue'
import { namespace } from 'vuex-class'
import { SelectedPerpetualMixin } from '@/mixins'

const perpetual = namespace('perpetual')

@Component({
  components: {
    AMMDepth,
  },
})
export default class AMMDepthWrap extends Mixins(SelectedPerpetualMixin) {
  get loading() {
    return !this.selectedPerpetualStorage || !this.selectedPerpetualProperty || !this.selectedLiquidityPoolStorage
  }
}
</script>

<style scoped lang="scss">
.amm-depth-wrap {
  width: 100%;
  height: 100%;
}
</style>
