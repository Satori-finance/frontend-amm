<template>
  <div class="search-result">
    <van-skeleton :loading="!!loading" :row="10" class="search-container">
<!--      <McMRadioGroupTabs v-model="activeChain" :options="oracleChains"/>-->
      <div class="list-item">
        <span class="left title">{{ $t('base.contract') }}</span>
        <span class="middle title">{{ $t('pool.poolList.volume') }}</span>
        <span class="right title">{{ $t('base.price') }}</span>
      </div>
      <div class="split-line"></div>
      <div v-if="!noData" class="list">
        <div class="list-item" v-for="(item, index) in perpetualList" :key="index">
          <span class="left">
            <span class="up">
              <span :class="{routable: item.chain === currentChainConfig.chainSymbol}"
                    @click="toTrade(item)">{{ item.underlying }}-{{ item.collateralSymbol }}
              </span>
              <span v-if="item.state === emergency || item.state === cleared">
                <i class="iconfont icon-circle-info" @click="showStatePrompt(item.state)"></i>
              </span>
            </span>
            <span class="down">
              <span>{{ item.symbol !== '' ? item.symbol : '---' }}</span>
              <span v-if="item.isInverse" class="inverse-box">{{ $t('base.inverse') }}</span>
            </span>
          </span>
          <span class="middle">
            <span class="volume">${{ item.deltaTotalVolumeUSD | bigNumberShortenFormat }} </span>
          </span>
          <span class="right">
            <span class="up">{{ item.indexPrice | bigNumberFormatterByPrecision }}</span>
            <span class="down">
              <PNNumber v-if="item.change24h" :show-plus-sign="true" :number="item.change24h" suffix="%" :decimals="2"/>
            </span>
          </span>
        </div>
      </div>
      <div v-if="noData" class="nodata">
        <McNoData v-if="noData" :label="$t('base.noResults')"></McNoData>
      </div>
    </van-skeleton>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import PNNumber from '@/components/PNNumber.vue'
import { McNoData } from '@/components'
import HomePerpetualMixin from '@/template/components/Home/HomePerpetualMixin'
import { McMPagination, McMRadioGroupTabs } from '@/mobile/components'
import { currentChainConfig } from '@/config/chain'
import { PerpetualState } from '@mcdex/mai3.js'

@Component({
  components: {
    McMPagination,
    PNNumber,
    McNoData,
    McMRadioGroupTabs,
  },
})
export default class SearchResult extends Mixins(HomePerpetualMixin) {
  @Prop({ default: '' }) private propSearchKey!: string

  private currentChainConfig = currentChainConfig

  get perpetualList() {
    return this.tableBody
  }

  showStatePrompt(state: PerpetualState) {
    if (state === PerpetualState.EMERGENCY) {
      this.$toast(this.$t('home.emergencyPrompt').toString())
    } else if (state === PerpetualState.CLEARED) {
      this.$toast(this.$t('home.clearedPrompt').toString())
    }
  }

  toTrade(item: any) {
    if (item.chain === currentChainConfig.chainSymbol) {
      this.$router.push({ name: 'trade', params: { symbol: item.symbol } })
    }
  }

  // mounted() {
  //   this.activeChain = currentChainConfig.chainSymbol
  // }

  @Watch('propSearchKey', { immediate: true })
  onPropSearchKeyChanged() {
    this.searchKey = this.propSearchKey
  }
}
</script>

<style scoped lang="scss">
@import '~@mcdex/style/common/var';
.search-result {
  height: 50vh;
  display: flex;
  flex-direction: column;

  .van-skeleton {
    flex: 1;
    overflow-y: scroll;
    .van-skeleton__row {
      height: 50px;
      width: 100%;
    }
  }

  .list {
    flex: 1;
    overflow-y: scroll;
  }

  .list-item {
    padding: 0 16px;
    height: 50px;
    font-size: 14px;

    .title {
      line-height: 50px;
      color: var(--mc-text-color);
    }

    .left {
      display: inline-block;
      width: 33%;

      .up {
        display: flex;
        align-items: center;
        margin-top: 8px;

        .routable {
          color: var(--mc-color-primary);
          text-decoration-line: underline;
        }

        .icon-circle-info{
          color: var(--mc-color-warning);
          font-size: 17px;
          margin-left: 4px;
        }
      }

      .down {
        display: flex;
        align-items: center;
        height: 22px;
        font-size: 12px;
        color: var(--mc-text-color);

        .inverse-box {
          height: 22px;
          background: rgba($--mc-color-orange, 0.2);
          padding: 4px 8px;
          color: var(--mc-color-orange);
          border-radius: 8px;
          margin-left: 4px;
        }
      }
    }

    .middle {
      display: inline-block;
      width: 33%;
      text-align: right;
      vertical-align: top;

      .volume {
        display: block;
        margin-top: 8px;
      }
    }

    .right {
      display: inline-block;
      width: 33%;
      text-align: right;

      .up {
        display: block;
        margin-top: 8px;
      }

      .down {
        margin-top: 4px;
        font-size: 12px;
      }
    }
  }

  .nodata {
    height: 200px;
  }

  .split-line {
    width: 100%;
    height: 1px;
    background-color: var(--mc-border-color);
  }
}
</style>

