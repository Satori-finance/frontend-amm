<template>
  <div class="pool-info scroll-container">
    <BackNavBar :title="$t('pool.liquidityPage.poolDetail')"></BackNavBar>
    <div class="container page-container">
      <div class="header">
        <div class='header-left'>
          <McMIconHeader :image1="collateralAddress | tokenIconUrlFormatter" :title="collateralSymbol" :sub-title="poolAddressSubTitle"/>
          <i class="iconfont icon-copy-bold" @click="copyAddress"></i>
        </div>
        <div>
          <van-button :class="['add-liquidity', 'round']" @click="toAddLiquidity">
            {{ $t('pool.liquidityPage.addLiquidity') }}
          </van-button>
        </div>
      </div>
      <div class="cards">
        <div class="card-item chart">
          <Charts :pool-base-info="poolBaseInfo" :perpetual-property="poolDefaultPerpetualProperty"/>
        </div>
        <div class="card-item">
          <Information :pool-base-info="poolBaseInfo" :liquidity-pool="liquidityPool" :perpetual-property="poolDefaultPerpetualProperty"/>
        </div>
        <div class="card-item">
          <Perpetuals :pool-base-info="poolBaseInfo" :liquidity-pool="liquidityPool" :perpetual-property="poolDefaultPerpetualProperty"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import BackNavBar from '@/mobile/template/Header/BackNavBar.vue'
import {
  McMIconHeader,
} from '@/mobile/components'
import { copyToClipboard, ellipsisMiddle } from '@/utils'
import { PoolBaseInfo } from '@/template/components/Pool/poolMixins'
import { LiquidityPoolDirectoryItem, PerpetualProperty } from '@/type'
import Information from './Information.vue'
import Perpetuals from './Perpetuals.vue'
import Charts from './Charts.vue'
import { ROUTE } from '@/mobile/router'

@Component({
  components: {
    Perpetuals,
    Information,
    BackNavBar,
    McMIconHeader,
    Charts,
  },
})
export default class PoolInfo extends Vue {
  @Prop( { required: true } ) poolBaseInfo !: PoolBaseInfo | null
  @Prop( { required: true }) liquidityPool !: LiquidityPoolDirectoryItem | null

  get poolDefaultPerpetualProperty(): PerpetualProperty | null {
    if (!this.liquidityPool || this.liquidityPool.perpetualPropertyMap.size === 0) return null
    return Array.from(this.liquidityPool.perpetualPropertyMap.values())[0]
  }

  get collateralAddress(): string {
    return this.poolBaseInfo?.collateralAddress || ''
  }

  get poolAddress(): string {
    return this.poolBaseInfo?.poolAddress || ''
  }

  get collateralSymbol(): string {
    return this.poolBaseInfo?.collateralSymbol || ''
  }

  get poolAddressSubTitle(): string {
    return `${this.$t('base.poolAddress').toString()} ${ellipsisMiddle(this.poolAddress, 6, 4)}`
  }

  toAddLiquidity() {
    if (!this.poolBaseInfo) {
      return
    }
    this.$router.push({
      name: ROUTE.LIQUIDITY,
      params: {
        poolAddress: this.poolBaseInfo.poolAddress
      }
    })
  }

  copyAddress() {
    if (!this.poolAddress) {
      return
    }
    copyToClipboard(this.poolAddress)
    this.$toast(this.$t('base.copySuccess').toString())
  }
}
</script>

<style scoped lang="scss">
.pool-info {

  .container {
    padding: 16px;

    .header {
      display: flex;
      justify-content: space-between;

      .header-left {
        display: flex;
        align-items: flex-end;
        .McMIconHeader,.iconfont{
          display: inline;
        }
        .iconfont {
          font-size: 12px;
          color: var(--mc-text-color);
        }
      }

      .add-liquidity {
        width: 100%;
        height: 40px;
        line-height: 40px;
        font-size: 16px;
      }

      ::v-deep.icon-title {
        justify-content: left;
        margin-left: 12px;
      }
    }

    .cards {
      margin-top: 16px;
      .card-item {
        margin-bottom: 16px;
        background: var(--mc-background-color-dark);
        padding: 16px;
        border: 1px solid var(--mc-border-color);
        border-radius: 12px;

        ::v-deep {
          .card-title {
            margin-bottom: 24px;
          }
        }
      }

      .chart {
        padding: 24px;
      }
    }
  }
}
</style>
