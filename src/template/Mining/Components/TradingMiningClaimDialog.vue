<template>
  <el-dialog
    @close="onCloseDialog"
    custom-class="is-small is-round trading-mining-claim-dialog"
    append-to-body
    top="0"
    :visible.sync="currentVisible"
    :close-on-click-modal="false"
    :title="$t('tradingMining.claimableRewards')">
    <div class="dialog-container">
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
            <el-tooltip placement="bottom" popper-class="claim-tooltip" :disabled="currentChainConfig.chainID===Number(chainId)">
              <div slot="content">{{ $t('tradingMining.switchChainPromp', {name: chainConfigs[chainId].chainName}).toString() }}</div>
              <div>
                <el-button size="medium" class="claim-button" @click="onClaimAllEpochReward"
                           :disabled="currentChainConfig.chainID !== Number(chainId) || claiming === 'loading'
                                     || currentChainClaimableRewards.isZero()">
                  <i class="el-icon-loading" v-if="claiming === 'loading' && currentChainConfig.chainID===Number(chainId)"></i>
                  {{ $t('base.claim') }}
                </el-button>
              </div>
            </el-tooltip>

          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script lang='ts'>
import { Component, Mixins, Prop } from 'vue-property-decorator'
import { chainConfigs, currentChainConfig } from '@/config/chain'
import TradingMiningClaimMixin from '@/template/components/Mining/tradingMiningClaimMixin'

@Component
export default class TradingMiningClaimDialog extends Mixins(TradingMiningClaimMixin) {
  @Prop({ default: false, required: true }) visible !: boolean

  get currentVisible() {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
  }

  get chainConfigs() {
    return chainConfigs
  }

  get currentChainConfig() {
    return currentChainConfig
  }

  onCloseDialog() {

  }
}
</script>

<style lang="scss" scoped>
.trading-mining-claim-dialog {
  ::v-deep &.is-small {
    min-height: 188px;
    width: 400px;
  }

  .dialog-container {
    margin-top: 12px;

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
