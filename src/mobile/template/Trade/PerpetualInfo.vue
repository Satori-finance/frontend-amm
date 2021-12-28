<template>
  <div class="perpetual-info scroll-container">
    <BackNavBar :title="$t('base.info')"></BackNavBar>
    <div class="page-container">
      <span class="head-info">{{ $t('pool.poolInfo.perpetualInfo') }}</span>
      <div class="info info-detail-container">
        <van-skeleton :row="12" :loading="!selectedPerpetualStorage && !selectedPerpetualProperty && !selectedLiquidityPoolStorage">
          <contract-info :perpetual-storage="selectedPerpetualStorage" :perpetual-property="selectedPerpetualProperty"
                         :pool-storage="selectedLiquidityPoolStorage"/>
        </van-skeleton>
      </div>

      <div class="split-line"></div>

      <span class="params">{{ $t('pool.poolInfo.perpetualParams') }}</span>
      <div class="parameters info-detail-container">
        <van-skeleton :row="10" :loading="!selectedPerpetualStorage && !selectedPerpetualProperty && !selectedLiquidityPoolStorage">
          <contract-parameters :perpetual-storage="selectedPerpetualStorage" :perpetual-property="selectedPerpetualProperty"
                               :pool-storage="selectedLiquidityPoolStorage"/>
        </van-skeleton>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import ContractInfo from '@/mobile/template/Trade/PerpetualInfo/ContractInfo.vue'
import ContractParameters from '@/mobile/template/Trade/PerpetualInfo/ContractParameters.vue'
import BackNavBar from '@/mobile/template/Header/BackNavBar.vue'
import { SelectedPerpetualMixin } from '@/mixins'

const perpetual = namespace('perpetual')

@Component({
  components: {
    ContractParameters,
    ContractInfo,
    BackNavBar,
  },
})
export default class PerpetualInfo extends Mixins(SelectedPerpetualMixin) {

}
</script>

<style scoped lang="scss">
.perpetual-info {

  .page-container {
    border-radius: 24px 24px 0 0;
  }

  .head-info {
    display: block;
    font-size: 18px;
    margin-left: 16px;
    padding-top: 16px;
  }

  .info, .parameters {
    width: 100%;
  }

  .info-detail-container {

  }

  .split-line {
    width: 100%;
    height: 4px;
    background-color: var(--mc-background-color-darkest);
  }

  .params {
    display: block;
    font-size: 18px;
    margin-left: 16px;
    margin-top: 16px;
  }

  ::v-deep {
    .van-skeleton {
      padding: 16px 16px 0 16px;
      margin-bottom: 12px;
    }
  }
}
</style>
