<template>
  <div class="market-history">
    <div class="title">
      <span class="time">{{ $t('base.time') }}</span>
      <span class="price">{{ $t('base.price') }}({{ priceUnit }})</span>
      <span class="quantity">{{ $t('base.quantity') }}({{ amountUnit }})</span>
    </div>
    <div ref="marketHistorySheet" class="content">
      <div class="sheet-box">
        <McLoading :show-loading="loading" :delay="500">
          <div class="market-history-sheet" v-if="trades.length">
            <div class="market-history-item" ref="sheet" v-for="(info, index) in trades" :key="index">
              <div class="time">
                <span class="time">{{ info.timestamp | timestampFormatter('HH:mm:ss') }}</span>
              </div>
              <div class="price">
                <span class="price-up" v-if="info.amount >= 0">{{
                  info.price | priceFormatter(isInverse) | bigNumberFormatter(priceFormatDecimals)
                }}</span>
                <span class="price-down" v-if="info.amount < 0">{{
                  info.price | priceFormatter(isInverse) | bigNumberFormatter(priceFormatDecimals)
                }}</span>
              </div>
              <div class="quantity">
                <span class="quantity">{{
                  info.amount | tradeAmountFormatter | bigNumberFormatter(contractFormatDecimals)
                }}</span>
              </div>
            </div>
          </div>
          <McMNoData v-else />
        </McLoading>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Mixins } from 'vue-property-decorator'
import { McMNoData } from '@/mobile/components'
import { McLoading } from '@/components'
import RecentTradeMixin from '@/template/components/Trade/recentTradeMixin'

@Component({
  components: {
    McMNoData,
    McLoading
  },
})

export default class MarketHistory extends Mixins(RecentTradeMixin) {
}
</script>

<style scoped lang="scss">
@keyframes rotate {
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }
}

.market-history {
  width: 100%;
  height: 100%;
  min-height: 300px;
  display: flex;
  flex-direction: column;

  .title {
    display: flex;
    align-items: center;
    font-size: 12px;
    line-height: 16px;
    margin-bottom: 8px;
    color: var(--mc-text-color);
    width: 100%;
  }

  .time {
    width: 40%;
  }

  .price {
    width: 30%;
  }

  .quantity {
    width: 30%;
    text-align: right;
  }

  .content {
    display: flex;
    .sheet-box {
      width: 100%;
      .market-history-sheet {
        .market-history-item {
          display: flex;
          align-items: center;
          position: relative;
          font-size: 12px;
          line-height: 14px;
          font-style: normal;
          font-weight: normal;
          padding: 6px 0;
          width: 100%;

          .time {
            color: var(--mc-text-color);
          }
          .price-up {
            color: var(--mc-color-blue);
          }
          .price-down {
            color: var(--mc-color-orange);
          }
          .quantity {
            color: var(--mc-text-color-white);
          }
        }
      }
      .no-data {
        margin: auto;
      }
    }
  }
}
</style>
