<template>
  <div v-if="!gasFeeRebateIsEnd || !accountAllEpochIsClaimed">
    <div class="gas-fee-rebate-header" @click="showRebatePopup=true">
      <div class="left">
        <img :src="currentChainConfig.symbol | tokenIconUrlFormatter" alt=''>
        <span class="text" v-if="!gasFeeRebateIsEnd">
          <template v-if="currentGasFeeRebateRate > -1">{{ currentGasFeeRebateRate }}%</template>
          {{ $t('gasFeeRebate.header', {name: currentChainConfig.chainName}).toString() }}
        </span>
        <span class="text" v-else>{{ $t('gasFeeRebate.endHeader') }}</span>
      </div>
      <div class="right">
        <i class="iconfont icon-bold-right"></i>
      </div>
    </div>
    <GasFeeRebateInfoPopup :visible.sync="showRebatePopup" />
  </div>
</template>

<script lang='ts'>
import { Component, Mixins } from 'vue-property-decorator'
import { currentChainConfig } from '@/config/chain'
import GasFeeRebateInfoPopup from './GasFeeRebateInfoPopup.vue'
import { GasFeeRebateHeaderMixin } from '@/template/components/GasFeeRebate/gasFeeRebateHeaderMixin'

@Component({
  components: {
    GasFeeRebateInfoPopup,
  }
})
export default class GasFeeRebateHeader extends Mixins(GasFeeRebateHeaderMixin) {

  private showRebatePopup: boolean = false

  get currentChainConfig() {
    return currentChainConfig
  }
}
</script>

<style lang='scss' scoped>
@import "~@mcdex/style/common/fantasy-var";

.gas-fee-rebate-header {
  height: 40px;
  padding: 12px 14.5px 12px 16px;
  background: rgba($--mc-color-blue, 0.1);
  display: flex;
  align-items: center;
  border-radius: var(--mc-border-radius-m);
  cursor: pointer;
  width: 100%;
  justify-content: space-between;

  .left, .right {
    display: inline-flex;
    align-items: center;
  }

  img {
    height: 18px;
    width: 18px;
    margin-right: 4px;
  }

  .text {
    font-size: 12px;
    color: var(--mc-color-blue);
    line-height: 16px;
  }

  .icon-bold-right {
    font-size: 12px;
    color: var(--mc-color-blue);
    margin-left: 26px;
  }
}
</style>
