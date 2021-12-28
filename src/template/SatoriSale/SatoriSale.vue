<template>
  <div class="mcb-sale">
    <BaseCardFrame :title="$t('mcbSale.roundTitle')">
      <template #content>
        <div class="content-box">
          <div class="section-item">
            <RoundInfo :crowdsale-storage="mcbCrowdsaleStorage"/>
          </div>
          <div class="section-item subscription-box">
            <SubscriptionInfo :mcbCrowdsaleStorage="mcbCrowdsaleStorage"
                              :mcbCrowdsaleAccountStorage="mcbCrowdsaleAccountStorage"/>
            <Stake :mcbCrowdsaleStorage="mcbCrowdsaleStorage" :mcbCrowdsaleAccountStorage="mcbCrowdsaleAccountStorage"
                   @staked="updateData" @unstaked="updateData"/>
          </div>
          <div class="section-item">
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
          <div class="section-item audit-report" v-html="$t('mcbSale.auditReport')">
          </div>
        </div>
      </template>
    </BaseCardFrame>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { BaseCardFrame } from '@/components'
import RoundInfo from './RoundInfo.vue'
import SubscriptionInfo from './SubscriptionInfo.vue'
import Stake from './Stake.vue'
import SATORISaleMixin from './SATORISaleMixin'

@Component({
  components: {
    BaseCardFrame,
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
  height: 100%;
  width: 1440px;
  margin: auto;

  .content-box {
    width: 950px;
    margin: auto;
    padding: 15px 0;

    .section-item {
      margin-bottom: 30px;

      &:last-of-type {
        margin-bottom: 0;
      }

      &.subscription-box {
        display: flex;
        align-items: stretch;
        justify-content: space-between;

        .subscription-info, .stake {
          width: 400px;
        }
      }

      .title {
        font-size: 16px;
        line-height: 22px;
        font-weight: bold;
        margin-bottom: 20px;
      }

      .rule {
        font-size: 14px;
        line-height: 20px;
        color: var(--mc-text-color);
      }
    }

    .audit-report {
      padding: 30px 0;
      border-top: 1px solid var(--mc-border-color);
      font-size: 16px;
      line-height: 24px;

      ::v-deep a {
        color: var(--mc-color-primary);
      }
    }
  }
}
</style>
