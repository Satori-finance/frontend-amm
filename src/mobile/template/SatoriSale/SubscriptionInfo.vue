<template>
  <section class="subscription-info">
    <van-skeleton title :row="3" :loading="!mcbCrowdsaleAccountStorage || !mcbCrowdsaleStorage" row-width="100%" class="skeleton">
      <div class="title">
        {{ $t('mcbSale.mySubscription') }}
      </div>
      <div class="content">
        <div class="info-item" v-if="isSubscribable">
          <div class="label">{{ $t('mcbSale.subscriptionAmount') }}</div>
          <div class="value">{{ subscriptionAmount | bigNumberFormatter }}</div>
        </div>
        <template v-else>
          <div class="info-item">
            <div class="label">{{ $t('mcbSale.allocation') }}</div>
            <div class="value">{{ allocation | bigNumberFormatter }} SATORI</div>
          </div>
          <div class="info-item">
            <div class="label">{{ $t('mcbSale.cost') }}</div>
            <div class="value">{{ cost | bigNumberFormatter }} USDC</div>
          </div>
        </template>
        <div class="info-item">
          <div class="label">{{ $t('base.staked') }}</div>
          <div class="value">{{ stakedSATORI | bigNumberFormatter }} SATORI + {{ stakedUSDC | bigNumberFormatter }} USDC</div>
        </div>
      </div>
    </van-skeleton>
  </section>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import SubscriptionInfoMixin from '@/template/SATORISale/subscriptionInfoMixin'

@Component
export default class SubscriptionInfo extends Mixins(SubscriptionInfoMixin) {

}
</script>

<style scoped lang="scss">
.subscription-info {
  display: flex;
  flex-direction: column;

  .title {
    font-size: 20px;
    line-height: 23px;
    margin-bottom: 16px;
  }

  .content {
    background-color: var(--mc-background-color);
    flex: 1;
    border-radius: var(--mc-border-radius-l);

    .info-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 14px;
      line-height: 16px;
      color: var(--mc-text-color);
      margin: 16px;

      .value {
        color: var(--mc-text-color-white);
      }
    }
  }
}
</style>
