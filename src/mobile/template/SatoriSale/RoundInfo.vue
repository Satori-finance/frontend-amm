<template>
  <section class="round-info">
    <van-skeleton title :row="4" :loading="!crowdsaleStorage" row-width="calc(50% - 4px)" class="skeleton">
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
    </van-skeleton>
  </section>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import RoundInfoMixin from '@/template/SatoriSale/roundInfoMixin'

@Component
export default class RoundInfo extends Mixins(RoundInfoMixin) {

}
</script>

<style scoped lang="scss">
.round-info {
  .title {
    font-size: 20px;
    line-height: 23px;
    margin-bottom: 16px;
  }

  .content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-column-gap: 8px;
    grid-row-gap: 8px;

    .info-item {
      background-color: var(--mc-background-color);
      border-radius: var(--mc-border-radius-l);
      padding: 16px 0;
      color: var(--mc-text-color-white);

      .label {
        font-size: 12px;
        line-height: 14px;
        margin-bottom: 8px;
        text-align: left;
        padding-left: 16px;
      }

      .value {
        font-size: 20px;
        line-height: 23px;
        text-align: right;
        padding-right: 16px;
      }
    }
  }

  .skeleton {
    .van-skeleton__row {
      display: inline-block;
      height: 76px;

      &:nth-of-type(odd) {
        margin-right: 8px;
      }

      &:not(:first-child) {
        margin-top: 8px;
      }
    }

    .van-skeleton__title + .van-skeleton__row {
      margin-top: 20px;
    }
  }
}
</style>
