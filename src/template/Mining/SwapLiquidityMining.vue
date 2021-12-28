<template>
  <div class="swap-liquidity-mining">
    <div class="panel-item-header">
      <div class="title-box">
        <div class="title">{{ $t('dao.swapLiquidityMining') }}</div>
        <div class="promp">{{ $t('dao.swapLiquidityMiningPromp') }}</div>
      </div>
    </div>
    <McLoading :show-loading="loading" :min-show-time="500" :hideContent="true">
      <div class="table-container">
        <div class="mining-pool" v-for="(item, index) in miningPoolList" v-if="item.show" :key="index">
          <div class="pool-info">
            <div class="bg">
              <div class="card-bg" :class="[`card-bg-${item.poolType.toString()}`]"></div>
            </div>
            <div class="pool-tag">
              <div class="chain-name">
                <el-image :src="chainConfigs[item.chainId].icon">
                  <div slot="error" class="image-slot">
                    <img src="@/assets/img/tokens/Unknow.svg" alt="">
                  </div>
                </el-image>
                {{ chainConfigs[item.chainId].chainName }}
              </div>
              <div class="pool-name pool-name-bg" :class="[`pool-name-bg-${item.poolType.toString()}`]">
                <el-image :src="require(`@/assets/img/tokens/${item.iconName}.svg`)">
                  <div slot="error" class="image-slot">
                    <img src="@/assets/img/tokens/Unknow.svg" alt="">
                  </div>
                </el-image>
                {{ item.swapName }}
              </div>
            </div>
            <div class="pair-img">
              <el-image :src="item.pair.token0.icon">
                <div slot="error" class="image-slot">
                  <img src="@/assets/img/tokens/Unknow.svg" alt="">
                </div>
              </el-image>
              <el-image :src="item.pair.token1.icon">
                <div slot="error" class="image-slot">
                  <img src="@/assets/img/tokens/Unknow.svg" alt="">
                </div>
              </el-image>
            </div>
            <div class="pair-info">
              <div class="left">
                <div class="primary-line">
                  {{ item.pair.token0.symbol }}/{{ item.pair.token1.symbol }} LP
                </div>
                <div class="secondary-line">
                  {{ $t('dao.swapLiquidityMiningStakeTip', { miningCoin: item.miningCoins.join(' + ') }).toString() }}
                </div>
              </div>
              <div class="right">
                <div class="primary-line" :class="{ positive: item.apy && item.apy.gte(0), negative: item.apy && item.apy.lt(0)}">
                  <template v-if="!item.apy">
                    <McLoadingIcon></McLoadingIcon>
                  </template>
                  <template v-else>
                    <span>{{ item.apy | bigNumberFormatter(2) }}</span>
                    <span class="unit">%</span>
                  </template>
                </div>
                <div class="secondary-line">{{ $t('base.APY') }}</div>
              </div>
            </div>
          </div>
          <div class="pool-button">
            <div class="description">
              {{ $t(`dao.swapLiquidityMiningTip.${item.tipKey}`, { swapName: item.swapName }).toString() }}
              <el-tooltip placement="top" :open-delay="400" v-if="item.learMoreKey">
                <span>{{ $t('base.learnMore') }}</span>
                <div slot="content"><span v-html="$t(`dao.swapLiquidityMiningTip.${item.learMoreKey}`)"></span></div>
              </el-tooltip>
            </div>
            <div class="button-group" v-if="!item.comingSoon && poolIsStartMining(item.miningStartTimestamp)">
              <div class="button-item">
                <a :href="item.tutorialLink" target="_blank">
                  <el-button class="tutorial-button" size="medium">
                    {{ $t('base.tutorial') }}
                    <i class="iconfont icon-view"></i>
                  </el-button>
                </a>
              </div>
              <div class="button-item">
                <a :href="item.participateLink" target="_blank">
                  <el-button class="participate-button" size="medium">
                    {{ $t('base.participate') }}
                    <i class="iconfont icon-view"></i>
                  </el-button>
                </a>
              </div>
            </div>
            <div class="coming-soon-button-box" v-else>
              <el-button class="coming-soon-bnt" size="medium">
                <span v-if="item.comingSoon">{{ $t('base.comingSoon') }}</span>
                <span v-else>{{ $t('dao.startTime') }}: {{
                    item.miningStartTimestamp | timestampFormatter('MMM Do h:mma') }}</span>
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </McLoading>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { McLoading, McLoadingIcon } from '@/components'
import SwapLiquidityMiningMixin from '@/template/components/Mining/swapLiquidityMiningMixin'

@Component({
  components: {
    McLoading,
    McLoadingIcon,
  },
})
export default class SwapLiquidityMining extends Mixins(SwapLiquidityMiningMixin) {

}
</script>

<style lang="scss" scoped>
@import 'mining';

.swap-liquidity-mining {
  .panel-item-header {
    margin-bottom: 4px;
  }

  ::v-deep .mc-loading {
    min-height: 298px;
  }

  .table-container {
    display: flex;
    flex-wrap: wrap;

    .mining-pool {
      position: relative;
      width: 384px;
      height: 278px;
      padding-bottom: 76px;
      margin-right: 24px;
      margin-top: 20px;

      &:nth-child(3n) {
        margin-right: 0;
      }

      .pool-info {
        position: relative;
        background-color: var(--mc-background-color-dark);
        border-color: var(--mc-border-color) !important;
        height: 146px;
        padding: 24px;
        border-radius: 12px;
        margin: -1px;
        z-index: 5;
        overflow: hidden;
        border: 1px solid;

        .bg {
          position: absolute;
          width: 120px;
          height: 120px;
          left: 0;
          top: -60px;
          filter: blur(100px);
          z-index: -1;
          user-select: none;

          .card-bg {
            width: 120px;
            height: 120px;
          }
        }

        .pool-tag {
          position: absolute;
          display: flex;
          height: 32px;
          background: var(--mc-background-color-light);
          top: 0;
          right: 0;
          border-radius: 0 12px 0 12px;
          font-size: 12px;
          .down-time {
            padding: 8px 12px;
          }

          .chain-name {
            display: flex;
            align-items: center;
            padding: 0 12px;
          }

          .pool-name {
            display: flex;
            align-items: center;
            padding: 4px 12px;
            border-bottom-left-radius: 12px;
          }

          .chain-name, .pool-name {
            .el-image {
              margin-right: 4px;
              height: 23px;
              width: 23px;

              img {
                height: 23px;
                width: 23px;
              }
            }
          }
        }
      }

      .pool-button {
        background-color: var(--mc-background-color-darkest);
        border-color: var(--mc-border-color) !important;
        position: absolute;
        bottom: 0;
        height: 147px;
        width: 384px;
        padding: 31px 24px 16px;
        border-radius: 0 0 12px 12px;
        border: 1px solid;
        border-top: none;
        z-index: 4;
      }
    }
  }

  .pool-tag {
    .pool-name-bg {
      &.pool-name-bg-sushi {
        background: linear-gradient(90deg, #FA52A0 0%, #03B8FF 100.37%);
      }
      &.pool-name-bg-balancer {
        background: linear-gradient(90deg, #152ED3 0%, #6B80FB 100.37%);
      }
      &.pool-name-bg-dodo {
        background: linear-gradient(90deg, #FEB42B 0%, #FEE635 100.57%);
        color: #000000;
      }
      &.pool-name-bg-pancake {
        background: linear-gradient(90deg, #00BFCE 0%, #2FC7D3 100%);
      }
    }
  }

  .pool-info {
    .card-bg {
      &.card-bg-sushi {
        background: linear-gradient(90deg, #FA52A0 0%, #03B8FF 100.37%);
      }

      &.card-bg-balancer {
        background: linear-gradient(90deg, #152ED3 0%, #6B80FB 100.37%);
      }

      &.card-bg-dodo {
        background: linear-gradient(90deg, #FEB42B 0%, #FEE635 100.57%);
      }
      &.card-bg-pancake {
        background: linear-gradient(90deg, #00BFCE 0%, #2FC7D3 100.57%);
      }
    }
  }

  .pool-info {
    .pair-img {
      display: flex;
      align-items: center;
      padding-top: 2px;

      .el-image {
        height: 40px;
        width: 40px;
        border-radius: 50%;

        ::v-deep img {
          width: 40px;
          height: 40px;
        }

        &:last-child {
          z-index: -1;
          margin-left: -18px;
        }
      }

    }
    .pair-info {
      margin-top: 12px;
      display: flex;
      justify-content: space-between;

      .primary-line {
        line-height: 24px;
        height: 24px;
      }

      .secondary-line {
        margin-top: 4px;
        line-height: 16px;
        font-size: 12px;
        color: var(--mc-text-color);
      }

      .left {
        .primary-line {
          font-size: 18px;
          color: var(--mc-text-color-white);
        }
      }

      .right {
        .primary-line {
          line-height: 24px;
          font-weight: 700;
          font-size: 26px;
          text-align: right;
          color: var(--mc-text-color);

          &.positive {
            color: var(--mc-color-blue);
          }

          &.negative {
            color: var(--mc-color-orange);
          }

          .unit {
            font-weight: 700;
            font-size: 18px;
            color: inherit;
          }
        }

        .secondary-line {
          text-align: right;
        }
      }
    }
  }

  .pool-button {
    .description {
      font-size: 14px;
      color: var(--mc-text-color);
      height: 40px;
      line-height: 20px;
    }

    .button-group {
      margin-top: 16px;
      display: flex;
      justify-content: space-between;

      .el-button {
        height: 44px;
        width: 162px;
        font-size: 16px;
        border-radius: var(--mc-border-radius-l);
      }

      .tutorial-button {
        background: var(--mc-background-color);
      }
    }

    .coming-soon-button-box {
      display: flex;
      justify-content: center;
      margin-top: 16px;

      .coming-soon-bnt {
        width: 336px;
        height: 44px;
        background: var(--mc-background-color);
        border-radius: var(--mc-border-radius-l);
        color: var(--mc-text-color);
        cursor: not-allowed;
      }
    }
  }
}
</style>
