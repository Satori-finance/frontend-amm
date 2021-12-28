<template>
  <div class="trading-mining-claim-popup">
    <van-popup
      v-model="currentVisible"
      closeable
      position="bottom"
      @closed="onClosePopup"
      class="safe-area-inset-bottom"
      round
      safe-area-inset-bottom
    >
      <div class="popup-header">{{ $t('tradingMining.claimableRewards') }}</div>
      <div class="popup-container">
        <div class="claim-item-box" v-for="(rewardInfo, chainId) in allChainClaimInfo" :key="chainId">
          <div class="box-title">
            <img :src="chainConfigs[chainId].icon" alt="">
            {{ chainConfigs[chainId].chainName }}
          </div>
          <div class="claim-content-box">
            <div class="left">{{ $t('tradingMining.claimableRewards') }}</div>
            <div class="right">
              <div class="value">
                {{ rewardInfo.claimableRewards | bigNumberFormatterTruncateByPrecision(6, 1, 2) }}
                <img class="icon" :src="require('@/assets/img/tokens/SATORI.svg')" alt="">
              </div>
              <van-button size="medium" class="round claim-button" :loading="claiming === 'loading' && currentChainConfig.chainID===Number(chainId)"
                          @click="onClaimAllEpochReward"
                          :disabled="currentChainConfig.chainID !== Number(chainId) || claiming === 'loading'
                                     || currentChainClaimableRewards.isZero()">
                {{ $t('base.claim') }}
              </van-button>
            </div>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script lang='ts'>
import { Component, Mixins, Prop } from 'vue-property-decorator'
import { chainConfigs, currentChainConfig } from '@/config/chain'
import TradingMiningClaimMixin from '@/template/components/Mining/tradingMiningClaimMixin'

@Component
export default class TradingMiningClaimPopup extends Mixins(TradingMiningClaimMixin) {
  @Prop({ default: false, required: true }) visible !: boolean

  get currentVisible(): boolean {
    return this.visible
  }

  set currentVisible(v: boolean) {
    this.$emit('update:visible', v)
  }

  get chainConfigs() {
    return chainConfigs
  }

  get currentChainConfig() {
    return currentChainConfig
  }

  onClosePopup() {
  }
}
</script>

<style lang='scss' scoped>
.trading-mining-claim-popup {
  ::v-deep {
    .van-popup {
      height: 312px;
      padding: 16px;
    }
  }

  .popup-container {
    margin-top: 28px;

    .claim-item-box {
      height: 104px;
      padding: 16px;
      margin-top: 16px;
      background: var(--mc-background-color-darkest);
      border: 1px solid var(--mc-border-color);
      border-radius: var(--mc-border-radius-l);

      &:first-child {
        margin-top: 0;
      }

      .box-title {
        line-height: 24px;
        font-size: 16px;
        color: var(--mc-text-color-white);
        display: inline-flex;
        align-items: center;

        img {
          height: 23px;
          width: 23px;
          margin-right: 4px;
        }
      }

      .claim-content-box {
        margin-top: 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;

        .left {
          font-size: 14px;
          color: var(--mc-text-color);
          line-height: 20px;
        }

        .right {
          display: inline-flex;
          align-items: center;

          .value {
            display: inline-flex;
            align-items: center;
            font-size: 14px;
            line-height: 20px;
            color: var(--mc-text-color-white);

            img {
              margin-left: 4px;
              width: 18px;
              height: 18px;
            }
          }

          .claim-button {
            margin-left: 12px;
            height: 32px;
            min-width: 80px;
            font-size: 12px;
            border-radius: var(--mc-border-radius-m);
          }
        }
      }
    }
  }
}
</style>
