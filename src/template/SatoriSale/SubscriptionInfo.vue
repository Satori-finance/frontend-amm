<template>
  <section class="subscription-info">
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
  </section>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import SubscriptionInfoMixin from './subscriptionInfoMixin'

@Component
export default class SubscriptionInfo extends Mixins(SubscriptionInfoMixin) {

}
</script>

<style scoped lang="scss">
.subscription-info {
  display: flex;
  flex-direction: column;

  .title {
    font-size: 16px;
    line-height: 22px;
    margin-bottom: 20px;
    font-weight: bold;
  }

  .content {
    background-color: var(--mc-background-color-dark);
    padding: 0 20px;
    flex: 1;

    .info-item {
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 14px;
      line-height: 20px;
      color: var(--mc-text-color);

      .value {
        color: var(--mc-text-color-white);
      }
    }
  }
}
</style>
