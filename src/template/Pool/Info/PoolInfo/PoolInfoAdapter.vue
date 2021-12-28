<template>
  <div class="pool-info">
    <div class="row1">
      <el-row :gutter="18">
        <el-col :span="12">
          <PoolInfo :pool-base-info="poolBaseInfo" :liquidity-pool="liquidityPool" :perpetual-property="poolDefaultPerpetualProperty" />
        </el-col>
        <el-col :span="12">
          <PoolChart :pool-base-info="poolBaseInfo" :perpetual-property="poolDefaultPerpetualProperty" />
        </el-col>
      </el-row>
    </div>
    <div class="row2">
      <PoolPerpetuals :pool-base-info="poolBaseInfo" :liquidity-pool="liquidityPool" :perpetual-property="poolDefaultPerpetualProperty" />
    </div>
    <div class="row3">
      <PoolGovernance :pool-base-info="poolBaseInfo" :liquidity-pool="liquidityPool" />
    </div>
    <div class="row4">
      <PoolLiquidityHistory :pool-base-info="poolBaseInfo" :liquidity-pool="liquidityPool" :perpetual-property="poolDefaultPerpetualProperty"  />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import PoolInfo from './PoolInfo.vue'
import PoolChart from './PoolChart.vue'
import PoolPerpetuals from './PoolPerpetuals.vue'
import PoolGovernance from './PoolGovernance.vue'
import PoolLiquidityHistory from './PoolLiquidityHistory.vue'
import { PoolBaseInfo } from '@/template/components/Pool/poolMixins'
import { LiquidityPoolDirectoryItem, PerpetualProperty } from '@/type'

@Component({
  components: {
    PoolInfo,
    PoolChart,
    PoolPerpetuals,
    PoolGovernance,
    PoolLiquidityHistory,
  },
})
export default class PoolInfoAdapter extends Vue {
  @Prop( { required: true } ) poolBaseInfo !: PoolBaseInfo | null
  @Prop( { required: true }) liquidityPool !: LiquidityPoolDirectoryItem | null

  get poolDefaultPerpetualProperty(): PerpetualProperty | null {
    if (!this.liquidityPool || this.liquidityPool.perpetualPropertyMap.size === 0) return null
    return Array.from(this.liquidityPool.perpetualPropertyMap.values())[0]
  }
}
</script>

<style lang="scss" scoped>
.pool-info {
  div[class^="row"] {
    width: 100%;
    margin-bottom: 30px;
  }

  ::v-deep.mc-loading .mc-loading__mask .mc-loading__item {
    z-index: 9;
  }
}
</style>
