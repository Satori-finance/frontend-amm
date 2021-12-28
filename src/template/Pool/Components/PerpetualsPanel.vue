<template>
  <div class="perpetuals-panel">
    <div class="title">{{ $t('pool.poolPerps') }}</div>
    <div class="list-box">
      <div class="list-box-container">
        <div class="perp-item" v-for="(item, index) in perpetuals" :key="index" @click="toPerpetualInfo(item.symbol)">
          <span>{{ item.symbol }}</span>
          <span>{{ item.underlying }}-{{ collateralSymbol }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import { PoolPerpBaseInfo } from '@/template/components/Pool/poolMixins'

@Component
export default class PerpetualsPanel extends Mixins(ErrorHandlerMixin) {
  @Prop({ required: true }) perpetuals !: PoolPerpBaseInfo
  @Prop({ required: true }) collateralSymbol!: string

  toPerpetualInfo(symbol: string) {
    this.$router.push({ name: 'poolPerpetualInfo', params: { symbol: symbol } })
  }
}
</script>

<style scoped lang="scss">
@import '~@mcdex/style/common/var';

.perpetuals-panel {
  .title {
    color: var(--mc-text-color-white);
    font-size: 16px;
    font-weight: 700;
  }

  .list-box {
    margin-top: 20px;
    padding: 12px;
    height: 152px;
    background-color: rgba($--mc-background-color-dark, 0.5);
    border-radius: 4px;

    .list-box-container {
      overflow-y: scroll;
      height: 100%;

      .perp-item {
        padding: 8px;
        display: flex;
        justify-content: space-between;
        color: var(--mc-text-color-white);
        font-size: 13px;
        font-weight: 400;
        cursor: pointer;

        span:nth-of-type(1) {
          text-align: center;
          width: 80px;
        }
        span:nth-of-type(2) {
          text-align: center;
          width: 120px;
        }
      }

      .perp-item:hover {
        background: rgba($--mc-background-color-darkest, 0.5);
      }
    }
  }
}
</style>