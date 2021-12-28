<template>
  <div class="perpetual-recent-transaction">
    <span class="head-title">{{ $t('pool.poolInfo.recentTransactions') }}</span>
    <el-tabs v-model="activeTab">
      <el-tab-pane :label="$t('base.trade')" name="trade">
        <PerpetualTradeHistory :perpetual-property="perpetualProperty" />
      </el-tab-pane>
      <el-tab-pane :label="$t('base.liquidate')" name="liquidate">
        <PerpetualLiquidateHistory :perpetual-property="perpetualProperty" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins, Watch } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import PerpetualTradeHistory from './PerpetualTradeHistory.vue'
import PerpetualLiquidateHistory from './PerpetualLiquidateHistory.vue'
import { PerpetualProperty } from '@/type'

@Component({
  components: {
    PerpetualTradeHistory,
    PerpetualLiquidateHistory,
  }
})
export default class PerpetualRecentTransaction extends Mixins(ErrorHandlerMixin) {
  @Prop({ default: () => null }) perpetualProperty!: PerpetualProperty | null

  activeTab = 'trade'
}
</script>

<style scoped lang="scss">
@import "../info.scss";
@import '~@mcdex/style/common/var';

.perpetual-recent-transaction {
  .el-tabs {
    ::v-deep .el-tabs__header {
      margin-bottom: 20px;
      height: 50px;
      line-height: 50px;
      background-color: rgba($--mc-background-color-dark,0.5);

      .el-tabs__item {
        min-width: 80px;
        text-align: center;
      }
    }
  }
}
</style>
