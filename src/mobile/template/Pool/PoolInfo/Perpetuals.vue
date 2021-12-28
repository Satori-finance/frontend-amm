<template>
  <div class="perpetual">
    <div class="card-title">{{ $t('pool.poolInfo.perpetuals.perpetual') }}</div>
    <van-skeleton :row="7" :loading="!poolBaseInfo && !liquidityPool && !perpetualProperty" >
      <div v-if="!noData" class="perp-container">
        <div class="list-header">
          <span>{{ $t('tableTitle.symbol') }}</span>
          <span>{{ $t('pool.poolInfo.perpetuals.volume24H') }}</span>
        </div>
        <div class="list">
          <div class="list-item" v-for="(item, index) in perpetuals" :key="index" @click="toPerpetualInfo(item.symbol)" v-if="!noData">
            <span class="left">
              <div class="name">{{ item.underlying }}-{{ collateralSymbol }}</div>
              <div class="id">
                {{ item.symbol }}
                <span class="inverse-card"
                      v-if="perpetualsSubTable[getPerpID(item.index)].isInverse">{{ $t('base.inverse') }}</span>
              </div>
            </span>
            <span class="right">
              <span class="value">{{ item.volume24Hours | bigNumberFormatter(collateralDecimals) }} {{ collateralSymbol }}</span>
              <span class="arrow"><van-icon name="arrow" /></span>
            </span>
          </div>
        </div>
      </div>
      <McMNoData v-else :label="$t('base.empty')"></McMNoData>
    </van-skeleton>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { McLoading } from '@/components'
import { McMNoData } from '@/mobile/components'
import PoolPerpetualsMixin from '@/template/components/Pool/PoolInfo/poolPerpetualsMixin'

@Component({
  components: {
    McMNoData,
    McLoading,
  },
})
export default class Perpetuals extends Mixins(PoolPerpetualsMixin) {
  toPerpetualInfo (symbol: string) {
    this.$router.push({ name: 'trade', params: { symbol: symbol } })
  }
}
</script>

<style scoped lang="scss">
.perpetual {

  .perp-container {
    width: 100%;

    .list-header {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      color: var(--mc-text-color);
    }

    .list {
      margin-top: 8px;

      .list-item {
        display: flex;
        justify-content: space-between;
        height: 50px;
        padding: 8px 0;

        .left {
          .name {
            font-size: 14px;
            color: var(--mc-text-color-white);
          }

          .id {
            margin-top: 4px;
            font-size: 12px;
            color: var(--mc-text-color);
          }
        }

        .right {
          line-height: 34px;
          display: flex;

          .value {
            font-size: 14px;
            color: var(--mc-text-color-white);
          }

          .arrow {
            margin-left: 16px;
            color: var(--mc-text-color);
            display: flex;
            align-items: center;
          }
        }
      }
    }

    .symbol {
      color: #B8DBEB;
      text-decoration: underline;
    }
  }
}
</style>
