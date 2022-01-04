<template>
  <div class="trading-mining-history scroll-container">
    <BackNavBar :title="$t('tradingMining.historyDialog.title')"></BackNavBar>
    <div class="content-container page-container">
      <div class="header">
        <div class="left">
          <McMPopupSelector v-model="selectedEpoch" :options="epochsOption"/>
        </div>
        <div class="right">
          {{ selectedEpochInfo.startTimestamp | timestampFormatter('MMM D')  }}
          - {{ selectedEpochInfo.endTimestamp | timestampFormatter('MMM D, YYYY') }}
        </div>
      </div>
      <div class="text-line">
        <template v-if="selectedEpochClaimTime >= nowTimestamp">
          {{ $t('tradingMining.historyDialog.claimTimeTip1', { id: selectedEpoch }).toString() }}
        </template>
        <template v-else>
          {{ $t('tradingMining.historyDialog.claimTimeTip2', { id: selectedEpoch }).toString() }}
        </template>
        <span class="light-text">{{ selectedEpochClaimTime | timestampFormatter('MMM D, YYYY') }}</span>
      </div>
      <div class="card-item">
        <div class="title">{{ $t('tradingMining.historyDialog.yourData') }}</div>
        <div class="line-item">
          <div class="label">{{ $t('tradingMining.historyDialog.yourRewards') }}</div>
          <div class="value primary-value">
            <span>{{ accountReward | bigNumberFormatterTruncateByPrecision(6, 1, 2)}}</span>
            <McMTokenImageView :size="18" :token="SATORI_ADDRESS" />
          </div>
        </div>
        <div class="line-item">
          <div class="label">{{ $t('tradingMining.historyDialog.yourFees') }}</div>
          <div class="value">
            ${{ accountTotalFee | bigNumberFormatterTruncateByPrecision(6, 1, 2) }}
          </div>
        </div>
        <div class="line-item">
          <div class="label">{{ $t('tradingMining.historyDialog.yourOpenInterest') }}</div>
          <div class="value">
            ${{ accountOpenInterest | bigNumberFormatterTruncateByPrecision(6, 1, 2)}}
          </div>
        </div>
        <div class="line-item">
          <div class="label">{{ $t('tradingMining.historyDialog.yourStakingScore') }}</div>
          <div class="value">
            {{ accountStakingScore | bigNumberFormatterTruncateByPrecision(6, 1, 0)}}
          </div>
        </div>
        <div class="line-item">
          <div class="label">{{ $t('tradingMining.historyDialog.yourTraderScore') }}</div>
          <div class="value">
            {{ accountTraderScore | bigNumberFormatterTruncateByPrecision(6, 1, 0)}}
          </div>
        </div>
        <div class="line-item">
          <div class="label">{{ $t('tradingMining.historyDialog.yourShareOfPool') }}</div>
          <div class="value">
            {{ accountShareOfPool | bigNumberFormatterTruncateByPrecision(6, 1, 2)}}%
          </div>
        </div>
      </div>
      <div class="card-item">
        <div class="title">{{ $t('tradingMining.historyDialog.totalData') }}</div>
        <div class="line-item">
          <div class="label">{{ $t('tradingMining.historyDialog.totalRewardsPool') }}</div>
          <div class="value primary-value">
            <span>{{ totalRewardsPool | bigNumberFormatterTruncateByPrecision(6, 1, 0)}}</span>
            <McMTokenImageView :size="18" :token="SATORI_ADDRESS" />
          </div>
        </div>
        <div class="line-item">
          <div class="label">{{ $t('tradingMining.historyDialog.totalFees') }}</div>
          <div class="value">
            ${{ totalFee | bigNumberFormatterTruncateByPrecision(6, 1, 2)}}
          </div>
        </div>
        <div class="line-item">
          <div class="label">{{ $t('tradingMining.historyDialog.totalOpenInterest') }}</div>
          <div class="value">
            ${{ totalOpenInterest | bigNumberFormatterTruncateByPrecision(6, 1, 2)}}
          </div>
        </div>
        <div class="line-item">
          <div class="label">{{ $t('tradingMining.historyDialog.totalStakingScore') }}</div>
          <div class="value">
            {{ totalStakingScore | bigNumberFormatterTruncateByPrecision(6, 1, 0)}}
          </div>
        </div>
        <div class="line-item">
          <div class="label">{{ $t('tradingMining.historyDialog.TotalTraderScore') }}</div>
          <div class="value">
            {{ totalTraderScore | bigNumberFormatterTruncateByPrecision(6, 1, 0)}}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang='ts'>
import { Component, Mixins } from 'vue-property-decorator'
import TradingMiningHistoryMixin from '@/template/components/Mining/tradingMiningHistoryMixin'
import BackNavBar from '@/mobile/template/Header/BackNavBar.vue'
import { McMPopupSelector, McMTokenImageView } from '@/mobile/components'
import { SATORI_ADDRESS } from '@/const'

@Component({
  components: {
    BackNavBar,
    McMPopupSelector,
    McMTokenImageView
  }
})
export default class TradingMiningHistory extends Mixins(TradingMiningHistoryMixin) {
  private SATORI_ADDRESS: string = SATORI_ADDRESS

  mounted() {
    this.updateData()
  }
}
</script>

<style lang='scss' scoped>
.trading-mining-history {
  ::v-deep {
    .van-nav-bar {
      background-color: var(--mc-background-color-dark);
    }
  }

  .content-container {
    padding: 0 16px;
    background: var(--mc-background-color-dark);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    margin-top: 12px;

    .mc-mobile-select {
      width: 96px;

      ::v-deep {
        .selector {
          height: 36px;
          border-radius: 12px;

          .left-value {
            line-height: 20px;
          }

          .icon-bold-down {
            color: var(--mc-text-color-white);
          }
        }
      }
    }
  }

  .text-line {
    font-size: 14px;
    line-height: 20px;
    color: var(--mc-text-color);
    margin-bottom: 8px;

    .light-text {
      color: var(--mc-text-color-white) !important;
    }
  }

  .card-item {
    background: var(--mc-background-color-dark);
    border-radius: var(--mc-border-radius-l);
    padding: 16px;
    margin-top: 16px;
    border: 1px solid #242D43;

    &:first-child {
      margin-top: 0;
    }

    .title {
      font-size: 16px;
      line-height: 24px;
      color: var(--mc-text-color-white);
      margin-bottom: 16px;
    }

    .line-item {
      font-size: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      line-height: 20px;
      margin-top: 12px;

      .label {
        color: var(--mc-text-color);
      }

      .value {
        display: flex;
        align-items: center;
        color: var(--mc-text-color-white);
      }

      .primary-value {
        font-size: 16px;
        color: var(--mc-color-blue) !important;
        font-weight: 700;

        .token-image-view {
          margin-left: 4px;
        }
      }
    }
  }
}
</style>
