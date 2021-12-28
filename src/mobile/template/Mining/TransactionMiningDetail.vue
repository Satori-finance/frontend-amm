<template>
  <div class="transaction-mining-detail scroll-container">
    <BackNavBar :title="$t('dao.tradingMining')"></BackNavBar>
    <div class="content page-container">
      <div class="pool-item" v-if='!noData' v-for="item in tableBody">
        <div class="pool">
          <div><span class="name">{{ item.collateral }}</span> <span class="link">({{ item.poolAddress | ellipsisMiddle }})</span></div>
          <van-button size="small" @click="toPoolInfo(item.poolAddress)">{{$t('dao.poolDetail')}}</van-button>
        </div>
        <div class="perpetuals">
          <div class="perpetual" v-for="perpetual in item.perpetuals" @click="goTrade(perpetual)">
            <div>{{ perpetual.symbol }} {{ perpetual.underlying }}-{{ item.collateral }}</div>
            <van-icon name="arrow"/>
          </div>
        </div>
      </div>
      <div class='no-data' v-if='noData'>
        <McNoData/>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Vue } from 'vue-property-decorator'
import { TransactionMiningDetailMixin } from '@/template/components/Mining/transactionMiningDetailMixin'
import BackNavBar from '@/mobile/template/Header/BackNavBar.vue'
import { ROUTE } from '@/mobile/router'
import { McNoData } from '@/components'

@Component({
  components: {
    BackNavBar,
    McNoData,
  },
})
export default class TransactionMiningDetail extends Mixins(TransactionMiningDetailMixin) {
  goTrade(perpetual: {symbol: string}) {
    this.$router.push({name: ROUTE.TRADE_MAIN, params: { symbol: perpetual.symbol}})
  }

  toPoolInfo(poolAddress: string) {
    this.$router.push({ name: ROUTE.POOL_INFO, params: { poolAddress: poolAddress } })
  }

}
</script>

<style scoped lang="scss">
.transaction-mining-detail {
  .content {
    padding: 16px;

    .pool-item {
      display: flex;
      align-items: center;
      width: 100%;
      font-size: 14px;
      line-height: 16px;
      padding: 16px;
      background-color: var(--mc-background-color);
      border-radius: var(--mc-border-radius-l);

      &:not(:last-of-type) {
        margin-bottom: 16px;
      }

      .pool {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 18px;
        line-height: 21px;

        .link {
          color: var(--mc-text-color);
        }

        .van-button {
          border-radius: var(--mc-border-radius-m);
          background: var(--mc-color-primary-gradient);
          min-width: 100px;
          font-size: 14px;
        }
      }

      .perpetuals {
        border-radius: var(--mc-border-radius-l);
        border: 1px solid var(--mc-border-color);
        margin-top: 8px;
        padding: 16px;

        .perpetual {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 14px;
          line-height: 16px;

          &:not(:last-of-type) {
            margin-bottom: 24px;
          }

          .van-icon {
            color: var(--mc-text-color);
            font-size: 18px;
          }
        }
      }
    }

    .no-data {
      margin-top: 50%;
    }
  }
}
</style>
