<template>
  <div class="mcb-sale scroll-container safe-area-inset-bottom">
    <BackNavBar :title="$t('mcbSale.roundTitle')"></BackNavBar>
    <div class="mcb-sale-container page-container">
      <RoundInfo class="mcb-sale-section" :crowdsale-storage="mcbCrowdsaleStorage"/>
      <Stake class="mcb-sale-section" :mcbCrowdsaleStorage="mcbCrowdsaleStorage"
             :mcbCrowdsaleAccountStorage="mcbCrowdsaleAccountStorage" @staked="updateData" @unstaked="updateData"/>
      <SubscriptionInfo class="mcb-sale-section" :mcbCrowdsaleStorage="mcbCrowdsaleStorage"
                        :mcbCrowdsaleAccountStorage="mcbCrowdsaleAccountStorage"/>
      <div class="mcb-sale-section rule-box">
        <div class="title">
          {{ $t('mcbSale.releaseRule') }}
        </div>
        <div class="rule">This is release rule...This is release rule......This is release rule......This is release
          rule......This is release rule......This is release rule......This is release rule......This is release
          rule......This is release rule......This is release rule......This is release rule......This is release
          rule......This is release rule......This is release rule......This is release rule......This is release
          rule......This is release rule......This is release rule......This is release rule......
        </div>
      </div>

      <div class="mcb-sale-section audit-report" v-html="$t('mcbSale.auditReport')"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import SATORISaleMixin from '@/template/SATORISale/SATORISaleMixin'
import BackNavBar from '@/mobile/template/Header/BackNavBar.vue'
import RoundInfo from './RoundInfo.vue'
import SubscriptionInfo from './SubscriptionInfo.vue'
import Stake from './Stake.vue'


@Component({
  components: {
    BackNavBar,
    RoundInfo,
    SubscriptionInfo,
    Stake,
  },
})
export default class SATORISale extends Mixins(SATORISaleMixin) {

}
</script>

<style scoped lang="scss">
.mcb-sale {
  .mcb-sale-container {
    padding: 16px;

    .mcb-sale-section {
      &:not(:last-child) {
        margin-bottom: 32px;
      }

      &.rule-box {
        .title {
          font-size: 20px;
          line-height: 23px;
          margin-bottom: 16px;
        }

        .rule {
          background-color: var(--mc-background-color);
          border-radius: var(--mc-border-radius-l);
          padding: 16px;
          color: var(--mc-text-color);
          font-size: 14px;
          line-height: 20px;
        }
      }

      &.audit-report {
        font-size: 16px;
        line-height: 18px;

        ::v-deep a {
          color: var(--mc-color-primary);
        }
      }
    }
  }
}
</style>
