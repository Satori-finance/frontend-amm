<template>
  <div class="">
    <el-dialog
      @close="onCloseDialog"
      custom-class="is-small is-round trading-mining-history-dialog"
      append-to-body
      top="0"
      :visible.sync="currentVisible"
      :close-on-click-modal="false"
      :title="$t('tradingMining.historyDialog.title')">
      <div class="dialog-container">
        <div class="option-line">
          <div class="left">
            <el-select size="small" v-model="selectedEpoch" popper-class="trading-mining-history-selected">
              <el-option v-for="item in epochsOption" :value="item.value" :key="item.value" :label="item.label"></el-option>
            </el-select>
          </div>
          <div class="right">
            <span class="label">{{ $t('tradingMining.duration') }}: &nbsp;</span>
            <span class="value">{{ selectedEpochInfo.startTimestamp | timestampFormatter('MMM D')  }}
              - {{ selectedEpochInfo.endTimestamp | timestampFormatter('MMM D, YYYY') }}
            </span>
          </div>
        </div>
        <div class="text-line">
          <template v-if="selectedEpochClaimTime >= nowTimestamp">
            {{ $t('tradingMining.historyDialog.claimTimeTip1', { id: selectedEpoch }).toString() }}
          </template>
          <template v-else>
            {{ $t('tradingMining.historyDialog.claimTimeTip2', { id: selectedEpoch }).toString() }}
          </template>          <span class="light-text">{{ selectedEpochClaimTime | timestampFormatter('MMM D, YYYY') }}</span>
        </div>
        <div class="info-panel">
          <div class="left-card card-item">
            <div class="title">{{ $t('tradingMining.historyDialog.yourData') }}</div>
            <div class="line-item">
              <div class="label">{{ $t('tradingMining.historyDialog.yourRewards') }}</div>
              <div class="value primary-value">
                {{ accountReward | bigNumberFormatterTruncateByPrecision(6, 1, 2)}}
                <img :src="require('@/assets/img/tokens/SATORI.svg')" alt="">
              </div>
            </div>
            <div class="line-item">
              <div class="label">
                {{ $t('tradingMining.historyDialog.yourFees') }}
                <el-popover
                  placement="top"
                  width="455"
                  popper-class="tooltip-popover fantasy trading-mining-popover"
                  trigger="hover"
                >
                  <div class="tooltip-content">
                    <div class="line-item">
                      {{ $t('tradingMining.tooltip.fee1') }}
                      <span class="blue-text">${{ accountDaoFee | bigNumberFormatterTruncateByPrecision(6, 1, 0) }}</span>
                      <div v-if="accountDaoFeePaidMultiChain" class="multi-chain-value">(
                        <span v-if="accountDaoFeePaidMultiChain[TradingMiningMultiChainID.ARB]" class="multi-chain-value-item">
                          <template v-if="isArbTestnet">Arbitrum Testnet:</template>
                          <template v-else>Arbitrum:</template>
                          <span class="blue-text">
                            ${{ accountDaoFeePaidMultiChain[TradingMiningMultiChainID.ARB] | bigNumberFormatterTruncateByPrecision(6, 1, 0) }}
                          </span>
                          <span class="split-icon">,</span>
                          </span>
                          <span v-if="accountDaoFeePaidMultiChain[TradingMiningMultiChainID.BSC]" class="multi-chain-value-item">
                            BSC:
                            <span class="blue-text">
                              ${{ accountDaoFeePaidMultiChain[TradingMiningMultiChainID.BSC] | bigNumberFormatterTruncateByPrecision(6, 1, 0) }}
                            </span>
                            <span class="split-icon">,</span>
                          </span>
                        )</div>
                    </div>
                    <div class="line-item">
                      {{ $t('tradingMining.tooltip.fee2') }}
                      <span class="blue-text">${{ accountBaseDaoFee | bigNumberFormatterTruncateByPrecision(6, 1, 0) }}</span>
                      <div v-if="accountBaseDaoFeePaidMultiChain" class="multi-chain-value">(
                        <span v-if="accountBaseDaoFeePaidMultiChain[TradingMiningMultiChainID.ARB]" class="multi-chain-value-item">
                          <template v-if="isArbTestnet">Arbitrum Testnet:</template>
                          <template v-else>Arbitrum:</template>
                          <span class="blue-text">
                            ${{ accountBaseDaoFeePaidMultiChain[TradingMiningMultiChainID.ARB] | bigNumberFormatterTruncateByPrecision(6, 1, 0) }}
                          </span><span class="split-icon">,</span>
                          </span>
                          <span v-if="accountBaseDaoFeePaidMultiChain[TradingMiningMultiChainID.BSC]" class="multi-chain-value-item">
                            BSC:
                            <span class="blue-text">
                              ${{ accountBaseDaoFeePaidMultiChain[TradingMiningMultiChainID.BSC] | bigNumberFormatterTruncateByPrecision(6, 1, 0) }}
                            </span><span class="split-icon">,</span>
                          </span>
                        )</div>
                    </div>
                    <div class="line-item">
                      {{ $t('tradingMining.tooltip.fee3') }}
                      <span class="blue-text">${{ accountTotalFee | bigNumberFormatterTruncateByPrecision(6, 1, 0) }}</span>
                      <div v-if="accountTotalFeePaidMultiChain" class="multi-chain-value">(
                        <span v-if="accountTotalFeePaidMultiChain[TradingMiningMultiChainID.ARB]" class="multi-chain-value-item">
                          <template v-if="isArbTestnet">Arbitrum Testnet:</template>
                          <template v-else>Arbitrum:</template>
                          <span class="blue-text">
                            ${{ accountTotalFeePaidMultiChain[TradingMiningMultiChainID.ARB] | bigNumberFormatterTruncateByPrecision(6, 1, 0) }}
                          </span><span class="split-icon">,</span>
                          </span>
                          <span v-if="accountTotalFeePaidMultiChain[TradingMiningMultiChainID.BSC]" class="multi-chain-value-item">
                            BSC:
                            <span class="blue-text">
                              ${{ accountTotalFeePaidMultiChain[TradingMiningMultiChainID.BSC] | bigNumberFormatterTruncateByPrecision(6, 1, 0) }}
                            </span><span class="split-icon">,</span>
                          </span>
                        )</div>
                    </div>
                    <div class="line-item">
                      {{ $t('tradingMining.tooltip.fee4') }}
                    </div>
                  </div>
                  <div class="tooltip-box" slot="reference">
                    <svg class="svg-icon" aria-hidden="true">
                      <use :xlink:href="`#icon-help`"></use>
                    </svg>
                  </div>
                </el-popover>
              </div>
              <div class="value">
                ${{ accountDaoFee | bigNumberFormatterTruncateByPrecision(6, 1, 2) }}
              </div>
            </div>
            <div class="line-item">
              <div class="label">
                {{ $t('tradingMining.historyDialog.yourOpenInterest') }}
                <el-popover
                  placement="top"
                  width="579"
                  popper-class="tooltip-popover fantasy trading-mining-popover"
                  trigger="hover"
                >
                  <div class="tooltip-content">
                    <div class="line-item">
                      <div v-if="accountAverageOpenInterestMultiChain" class="multi-chain-value">(
                        <span class="multi-chain-value-item">
                          {{ $t('base.total') }}:
                          <span class="blue-text">
                            ${{ accountAverageOpenInterestMultiChain[TradingMiningMultiChainID.TOTAL] | bigNumberFormatterTruncateByPrecision(8, 1, 0)
                            }}
                          </span><span class="split-icon">,</span>
                        </span>
                        <span v-if="accountAverageOpenInterestMultiChain[TradingMiningMultiChainID.ARB]" class="multi-chain-value-item">
                          <template v-if="isArbTestnet">Arbitrum Testnet:</template>
                          <template v-else>Arbitrum:</template>
                          <span class="blue-text">
                            ${{ accountAverageOpenInterestMultiChain[TradingMiningMultiChainID.ARB] | bigNumberFormatterTruncateByPrecision(8, 1, 0) }}
                          </span><span class="split-icon">,</span>
                        </span>
                        <span v-if="accountAverageOpenInterestMultiChain[TradingMiningMultiChainID.BSC]" class="multi-chain-value-item">
                          BSC:
                          <span class="blue-text">
                            ${{ accountAverageOpenInterestMultiChain[TradingMiningMultiChainID.BSC] | bigNumberFormatterTruncateByPrecision(8, 1, 0) }}
                          </span><span class="split-icon">,</span>
                        </span>
                        )</div>
                    </div>
                    <div class="line-item">
                      <span v-html="$t('tradingMining.tooltip.openInterest1')"></span>
                    </div>
                  </div>
                  <div class="tooltip-box" slot="reference">
                    <svg class="svg-icon" aria-hidden="true">
                      <use :xlink:href="`#icon-help`"></use>
                    </svg>
                  </div>
                </el-popover>
              </div>
              <div class="value">
                ${{ accountOpenInterest | bigNumberFormatterTruncateByPrecision(6, 1, 2)}}
              </div>
            </div>
            <div class="line-item">
              <div class="label">
                {{ $t('tradingMining.historyDialog.yourStakingScore') }}
                <el-popover
                  placement="top"
                  width="579"
                  popper-class="tooltip-popover fantasy trading-mining-popover"
                  trigger="hover"
                >
                  <div class="tooltip-content">
                    <div class="line-item">
                      <div v-if="accountAverageStakingScoreMultiChain" class="multi-chain-value">(
                        <span class="multi-chain-value-item">
                          {{ $t('base.total') }}:
                          <span class="blue-text">
                            {{ accountAverageStakingScoreMultiChain[TradingMiningMultiChainID.TOTAL] | bigNumberFormatterTruncateByPrecision(8, 1, 0)
                            }}
                          </span><span class="split-icon">,</span>
                        </span>
                        <span v-if="accountAverageStakingScoreMultiChain[TradingMiningMultiChainID.ARB]" class="multi-chain-value-item">
                              <template v-if="isArbTestnet">Arbitrum Testnet:</template>
                              <template v-else>Arbitrum:</template>
                              <span class="blue-text">
                                {{ accountAverageStakingScoreMultiChain[TradingMiningMultiChainID.ARB] | bigNumberFormatterTruncateByPrecision(8, 1, 0) }}
                              </span><span class="split-icon">,</span>
                            </span>
                        <span v-if="accountAverageStakingScoreMultiChain[TradingMiningMultiChainID.BSC]" class="multi-chain-value-item">
                          BSC:
                          <span class="blue-text">
                            {{ accountAverageStakingScoreMultiChain[TradingMiningMultiChainID.BSC] | bigNumberFormatterTruncateByPrecision(8, 1, 0) }}
                          </span><span class="split-icon">,</span>
                        </span>
                        )</div>
                    </div>
                    <div class="line-item">
                      <span v-html="$t('tradingMining.tooltip.stakingScore1')"></span>
                    </div>
                  </div>
                  <div class="tooltip-box" slot="reference">
                    <svg class="svg-icon" aria-hidden="true">
                      <use :xlink:href="`#icon-help`"></use>
                    </svg>
                  </div>
                </el-popover>
              </div>
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
          <div class="right-card card-item">
            <div class="title">{{ $t('tradingMining.historyDialog.totalData') }}</div>
            <div class="line-item">
              <div class="label">{{ $t('tradingMining.historyDialog.totalRewardsPool') }}</div>
              <div class="value primary-value">
                {{ totalRewardsPool | bigNumberFormatterTruncateByPrecision(6, 1, 0)}}
                <img :src="require('@/assets/img/tokens/SATORI.svg')" alt="">
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
    </el-dialog>
  </div>
</template>

<script lang='ts'>
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import TradingMiningHistoryMixin from '@/template/components/Mining/tradingMiningHistoryMixin'

@Component
export default class TradingMiningHistoryDialog extends Mixins(TradingMiningHistoryMixin) {
  @Prop({ default: false, required: true }) visible !: boolean

  get currentVisible() {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
  }

  onCloseDialog() {

  }

  @Watch('currentVisible')
  onDialogStatusChange() {
    if (this.currentVisible) {
      this.updateData()
    }
  }
}
</script>

<style lang='scss' scoped>
@import "~@mcdex/style/element-fantasy/common/var";

.trading-mining-history-dialog {
  ::v-deep &.is-small {
    min-height: 388px;
    width: 784px;
  }

  .dialog-container {
    .option-line {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 12px;
      margin-bottom: 16px;

      .left {
        ::v-deep {
          .el-select {
            width: 100px;
            background: var(--mc-background-color);
            border-radius: var(--mc-border-radius-l);

            .el-input--small {
              height: 36px;
            }

            .el-input__inner {
              font-size: 14px;
              padding-right: 0;
            }

            .el-input__icon {
              font-weight: 700;
            }
          }
        }
      }

      .right {
        display: flex;
        align-items: center;
      }
    }

    .text-line {
      font-size: 14px;
      color: var(--mc-text-color);
      margin-bottom: 8px;

      .light-text {
        color: var(--mc-text-color-white) !important;
      }
    }

    .info-panel {
      display: flex;

      .left-card {

      }

      .right-card {

      }

      .card-item {
        width: 368px;
        height: 252px;
        margin-left: 16px;
        padding: 16px;
        border: 1px solid var(--mc-border-color);
        border-radius: var(--mc-border-radius-l);

        &:first-child {
          margin-left: 0;
        }

        .title {
          font-size: 16px;
          color: var(--mc-text-color-white);
          margin-bottom: 16px;
          line-height: 24px;
        }

        .line-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          line-height: 20px;
          margin-top: 12px;
          font-size: 14px;

          .label {
            color: var(--mc-text-color);
            display: flex;
            align-items: center;
          }

          .value {
            color: var(--mc-text-color-white);
            display: flex;
            align-items: center;

            img {
              margin-left: 4px;
              width: 18px;
              height: 18px;
            }
          }

          .primary-value {
            color: var(--mc-color-blue) !important;
            font-weight: 700;
          }
        }
      }
    }
  }

  .tooltip-box {
    background: rgba($--mc-text-color, 0.5);
    border-radius: 50%;
    height: 13px;
    width: 13px;
    margin-left: 4px;

    .svg-icon {
      width: 8px;
      height: 8px;
      color: var(--mc-text-color-white);
      vertical-align: 4px;
      margin-left: 2px;
    }
  }
}
</style>

<style lang="scss">
.trading-mining-history-selected {
  .el-select-dropdown__item {
    font-size: 14px;
    line-height: 20px;
  }
}
</style>
