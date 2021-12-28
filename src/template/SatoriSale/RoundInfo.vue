<template>
  <section class="round-info">
    <div class="title">
      {{ $t('mcbSale.roundInfo') }}
    </div>
    <div class="content">
      <div class="info-item">
        <div class="label">{{ $t('base.price') }}</div>
        <div class="value">$10</div>
      </div>
      <div class="info-item">
        <div class="label">{{ $t('mcbSale.availableSupply') }} (SATORI)</div>
        <div class="value">{{ availableSupply | bigNumberFormatter(0) }}</div>
      </div>
      <div class="info-item">
        <div class="label">{{ $t('mcbSale.subscriptionRate') }}</div>
        <div class="value">{{ subscriptionRate | bigNumberFormatter(0) }}%</div>
      </div>
      <div class="info-item" v-if="isSubscribable">
        <div class="label">{{ $t('mcbSale.subscriptionEndsIn') }}</div>
        <div class="value">{{ endTimeLeft }}</div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import RoundInfoMixin from './roundInfoMixin'

@Component
export default class RoundInfo extends Mixins(RoundInfoMixin) {

}
</script>

<style scoped lang="scss">
.round-info {
  .title {
    font-size: 16px;
    line-height: 22px;
    margin-bottom: 20px;
    font-weight: bold;
  }

  .content {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .info-item {
      flex: 1;
      height: 100px;
      background-color: var(--mc-background-color-dark-light);
      border-radius: var(--mc-border-radius-m);
      padding-top: 20px;
      text-align: center;
      color: var(--mc-text-color-white);

      .label {
        font-size: 14px;
        line-height: 24px;
        margin-bottom: 9px;
      }

      .value {
        font-size: 20px;
        line-height: 30px;
        font-weight: bold;
      }

      &:not(:last-of-type) {
        margin-right: 25px;
      }
    }
  }
}
</style>
