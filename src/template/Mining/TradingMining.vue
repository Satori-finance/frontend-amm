<template>
  <div>
    <div class="trading-mining">
      <div class="panel-item-header">
        <div class="title-box">
          <div class="title">
            <template v-if="currentEpochStart">
              {{ $t('tradingMining.title', {id: currentEpoch}).toString() }}
            </template>
            <template v-else>
              {{ $t('tradingMining.title2') }}
              ({{ $t('dao.startIn') }} <McCountDown :end-timestamp="currentEpochInfo.startTimestamp"/>)
            </template>
          </div>
          <div class="promp">
            {{ $t('tradingMining.titleSubDesc') }}
            <a href="https://support.mcdex.io/hc/en-us/articles/4407032150041" target="_blank">{{ $t('base.tutorial') }}</a>
          </div>
        </div>
        <div class="right-box">
          <div class="countdown-box">
            <div class="value">
              <template v-if="currentEpochStart">
                <McCountDown :end-timestamp="currentEpochInfo.endTimestamp" :module='2' />
              </template>
              <template v-else>N/A</template>
            </div>
            <div class="label">{{ $t('tradingMining.epochCountdown', {id: currentEpoch}).toString() }}</div>
          </div>
          <div class="split-line"></div>
          <div class="claim-box">
            <div class="value-box">
              <div class="value">
                <McLoadingIcon v-if="!totalClaimableRewards" :height="24"></McLoadingIcon>
                <span v-else>{{ totalClaimableRewards | bigNumberFormatterTruncateByPrecision(6, 1, 2) }}</span>
                <span class="split-icon">/</span>
                <McLoadingIcon v-if="!totalAllocatedRewards" :height="24"></McLoadingIcon>
                <span>{{ totalAllocatedRewards | bigNumberFormatterTruncateByPrecision(6, 1, 2) }}</span>
                <img class="icon" :src="require('@/assets/img/tokens/SATORI.svg')" alt="">
              </div>
              <div class="label">
                {{ $t('tradingMining.claimableAllocatedRewards') }}
                <el-tooltip placement="top" popper-class="claim-tooltip">
                  <div slot="content">
                    <span v-html="claimRewardPromp1"></span>
                  </div>
                  <div class="tooltip-box">
                    <svg class="svg-icon" aria-hidden="true">
                      <use :xlink:href="`#icon-help`"></use>
                    </svg>
                  </div>
                </el-tooltip>
              </div>
            </div>
            <div class="button-box">
              <el-button size="medium" :disabled="Object.keys(allChainClaimInfo).length ===0"
                         @click="showClaimDialog=true">
                {{ $t('base.claim') }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
      <McLoading :show-loading="loading" :min-show-time="500" :hideContent="true">
        <div class="content-container">
          <div class="left-container container-item">
            <div class="title">
              <div class="left">{{ $t('tradingMining.yourEstimatedRewards') }}</div>
            </div>
            <div class="line1">
              <div class="left">
                <div>
                  {{ estimatedValue | bigNumberFormatterTruncateByPrecision(10, 1, 2) }}
                  <img class="icon" :src="require('@/assets/img/tokens/SATORI.svg')" alt="">
                </div>
                <div>
                  {{ $t('tradingMining.estimatedForEpoch', {id: currentEpoch}).toString() }}
                  <el-tooltip placement="top">
                    <div slot="content"><span v-html="$t('tradingMining.estimatedForEpochPromp')"></span></div>
                    <div class="tooltip-box">
                      <svg class="svg-icon" aria-hidden="true">
                        <use :xlink:href="`#icon-help`"></use>
                      </svg>
                    </div>
                  </el-tooltip>
                </div>
              </div>
              <div class="right">
                <img :src="require('@/assets/img/dao-mintable.png')" alt="">
              </div>
            </div>
            <div class="horizontal-split-line"></div>
            <div class="line2">
              <div class="left">
                <div>
                  {{ currentEpochInfo.totalReward | bigNumberFormatter(0) }}
                  <img class="icon" :src="require('@/assets/img/tokens/SATORI.svg')" alt="">
                </div>
                <div>
                  {{ $t('tradingMining.totalRewardsPool') }}
                  <el-tooltip placement="top">
                    <div slot="content"><span v-html="$t('tradingMining.totalRewardsPoolPromp', {value: totalRewardStr}).toString()"></span></div>
                    <div class="tooltip-box">
                      <svg class="svg-icon" aria-hidden="true">
                        <use :xlink:href="`#icon-help`"></use>
                      </svg>
                    </div>
                  </el-tooltip>
                </div>
              </div>
              <div class="right">
                <div class="value icon-text" :class="[`${allTraderScoreChangeSide}-text`]">
                  {{ allTraderScore | bigNumberFormatterTruncateByPrecision(6, 1, 0) }}
                  <i class="iconfont icon-up"></i>
                  <i class="iconfont icon-down"></i>
                </div>
                <div class="label">
                  {{ $t('tradingMining.allTraderScore') }}
                  <el-tooltip placement="top">
                    <div slot="content"><span v-html="$t('tradingMining.allTraderScorePromp')"></span></div>
                    <div class="tooltip-box">
                      <svg class="svg-icon" aria-hidden="true">
                        <use :xlink:href="`#icon-help`"></use>
                      </svg>
                    </div>
                  </el-tooltip>
                </div>
              </div>
            </div>
            <div class="line3">
              <div class="left">
                <div>
                  {{ accountScore | bigNumberFormatterTruncateByPrecision(6, 1, 0) }}
                </div>
                <div>
                  {{ $t('tradingMining.yourTraderScore') }}
                  <el-tooltip placement="top">
                    <div slot="content"><span v-html="$t('tradingMining.yourTraderScorePromp')"></span></div>
                    <div class="tooltip-box">
                      <svg class="svg-icon" aria-hidden="true">
                        <use :xlink:href="`#icon-help`"></use>
                      </svg>
                    </div>
                  </el-tooltip>
                </div>
              </div>
              <div class="right">
                <div>
                  {{ accountScoreOfPool | bigNumberFormatterTruncateByPrecision(6, 1, 2) }}%
                </div>
                <div>
                  {{ $t('tradingMining.yourShareOfPool') }}
                  <el-tooltip placement="top">
                    <div slot="content"><span v-html="$t('tradingMining.yourShareOfPoolPromp')"></span></div>
                    <div class="tooltip-box">
                      <svg class="svg-icon" aria-hidden="true">
                        <use :xlink:href="`#icon-help`"></use>
                      </svg>
                    </div>
                  </el-tooltip>
                </div>
              </div>
            </div>
          </div>
          <div class="right-container">
            <div class="top-box">
              <div class="title">
                <div class="left">
                  {{ $t('tradingMining.yourTradingData') }}
                  <span class="chain-view" v-if="multiChainSupported.length > 1">
                    (
                      <span v-for="(item, index) in multiChainSupported" class="chain-item" :key="index">
                        <img :src="chainConfigs[item].icon" alt=""/><span class="join-icon">+</span>
                      </span>
                    )
                  </span>
                </div>
                <div class="right">
                  <div class="item" @click="toTradingMiningPools">
                    <i class="iconfont icon-pool"></i>
                    {{ $t('tradingMining.tradingMiningPools') }}
                  </div>
                  <div class="item" @click="onShowHistoryDialog">
                    <i class="iconfont icon-history"></i>
                    {{ $t('tradingMining.epochHistory') }}
                  </div>
                </div>
              </div>
              <div class="content">
                <div class="value-item" v-if="currentEpoch === 0">
                  <div>
                    ${{ totalFeesPaid | bigNumberFormatterTruncateByPrecision(6, 1, 0) }}
                  </div>
                  <div>
                    {{ $t('tradingMining.totalFeesPaid') }}
                    <el-tooltip placement="top">
                      <div slot="content"><span v-html="$t('tradingMining.totalFeesPaidPromp', { value: daoFeePaidStr}).toString()"></span></div>
                      <div class="tooltip-box">
                        <svg class="svg-icon" aria-hidden="true">
                          <use :xlink:href="`#icon-help`"></use>
                        </svg>
                      </div>
                    </el-tooltip>
                  </div>
                </div>
                <div class="value-item value-item1" v-else>
                  <div>
                    <span>${{ daoFeePaid | bigNumberFormatterTruncateByPrecision(6, 1, 0) }}</span>
                    <span class="sub-value"><span class="split-icon"> /</span>
                      ${{ totalFeesPaid | bigNumberFormatterTruncateByPrecision(6, 1, 0) }}</span>
                  </div>
                  <div>
                    {{ $t('tradingMining.totalAndDaoFeesPaid') }}
                    <!-- tooltip -->
                    <el-popover
                      placement="top"
                      width="455"
                      popper-class="tooltip-popover fantasy trading-mining-popover"
                      trigger="hover"
                    >
                      <div class="tooltip-content">
                        <div class="line-item">
                          {{ $t('tradingMining.tooltip.fee1') }}
                          <span class="blue-text">${{ daoFeePaidStr }}</span>
                          <div v-if="daoFeePaidMultiChain" class="multi-chain-value">(
                            <span v-if="daoFeePaidMultiChain[TradingMiningMultiChainID.ARB]" class="multi-chain-value-item">
                              <template v-if="isArbTestnet">Arbitrum Testnet:</template>
                              <template v-else>Arbitrum:</template>
                              <span class="blue-text">
                                ${{ daoFeePaidMultiChain[TradingMiningMultiChainID.ARB] | bigNumberFormatterTruncateByPrecision(6, 1, 0) }}
                              </span>
                              <span class="split-icon">,</span>
                            </span>
                            <span v-if="daoFeePaidMultiChain[TradingMiningMultiChainID.BSC]" class="multi-chain-value-item">
                              BSC:
                              <span class="blue-text">
                                ${{ daoFeePaidMultiChain[TradingMiningMultiChainID.BSC] | bigNumberFormatterTruncateByPrecision(6, 1, 0) }}
                              </span>
                              <span class="split-icon">,</span>
                            </span>
                          )</div>
                        </div>
                        <div class="line-item">
                          {{ $t('tradingMining.tooltip.fee2') }}
                          <span class="blue-text">${{ baseDaoFeePaidStr }}</span>
                          <div v-if="baseDaoFeePaidMultiChain" class="multi-chain-value">(
                            <span v-if="baseDaoFeePaidMultiChain[TradingMiningMultiChainID.ARB]" class="multi-chain-value-item">
                              <template v-if="isArbTestnet">Arbitrum Testnet:</template>
                              <template v-else>Arbitrum:</template>
                              <span class="blue-text">
                                ${{ baseDaoFeePaidMultiChain[TradingMiningMultiChainID.ARB] | bigNumberFormatterTruncateByPrecision(6, 1, 0) }}
                              </span><span class="split-icon">,</span>
                            </span>
                            <span v-if="baseDaoFeePaidMultiChain[TradingMiningMultiChainID.BSC]" class="multi-chain-value-item">
                              BSC:
                              <span class="blue-text">
                                ${{ baseDaoFeePaidMultiChain[TradingMiningMultiChainID.BSC] | bigNumberFormatterTruncateByPrecision(6, 1, 0) }}
                              </span><span class="split-icon">,</span>
                            </span>
                            )</div>
                        </div>
                        <div class="line-item">
                          {{ $t('tradingMining.tooltip.fee3') }}
                          <span class="blue-text">${{ totalFeePaidStr }}</span>
                          <div v-if="totalFeePaidMultiChain" class="multi-chain-value">(
                            <span v-if="totalFeePaidMultiChain[TradingMiningMultiChainID.ARB]" class="multi-chain-value-item">
                              <template v-if="isArbTestnet">Arbitrum Testnet:</template>
                              <template v-else>Arbitrum:</template>
                              <span class="blue-text">
                                ${{ totalFeePaidMultiChain[TradingMiningMultiChainID.ARB] | bigNumberFormatterTruncateByPrecision(6, 1, 0) }}
                              </span><span class="split-icon">,</span>
                            </span>
                            <span v-if="totalFeePaidMultiChain[TradingMiningMultiChainID.BSC]" class="multi-chain-value-item">
                              BSC:
                              <span class="blue-text">
                                ${{ totalFeePaidMultiChain[TradingMiningMultiChainID.BSC] | bigNumberFormatterTruncateByPrecision(6, 1, 0) }}
                              </span><span class="split-icon">,</span>
                            </span>
                            )</div>
                        </div>
                        <div class="line-item">
                          {{ $t('tradingMining.tooltip.fee4') }}
                        </div>
                        <div class="line-item">
                          {{ $t('tradingMining.tooltip.fee5') }}
                        </div>
                      </div>
                      <div class="tooltip-box" slot="reference">
                        <svg class="svg-icon" aria-hidden="true">
                          <use :xlink:href="`#icon-help`"></use>
                        </svg>
                      </div>
                    </el-popover>
                  </div>
                </div>
                <div class="vertical-split-line"></div>
                <div class="value-item value-item2">
                  <div>${{ averageOpenInterest | bigNumberFormatterTruncateByPrecision(8, 1, 0) }}</div>
                  <div>
                    {{ $t('tradingMining.averageOpenInterest') }}
                    <!-- tooltip -->
                    <el-popover
                      placement="top"
                      width="579"
                      popper-class="tooltip-popover fantasy trading-mining-popover"
                      trigger="hover"
                    >
                      <div class="tooltip-content">
                        <div class="line-item">
                          <div v-if="averageOpenInterestMultiChain" class="multi-chain-value">(
                            <span class="multi-chain-value-item">
                              {{ $t('base.total') }}:
                              <span class="blue-text">
                                ${{ averageOpenInterestMultiChain[TradingMiningMultiChainID.TOTAL] | bigNumberFormatterTruncateByPrecision(8, 1, 0)
                                }}
                              </span><span class="split-icon">,</span>
                            </span>
                            <span v-if="averageOpenInterestMultiChain[TradingMiningMultiChainID.ARB]" class="multi-chain-value-item">
                              <template v-if="isArbTestnet">Arbitrum Testnet:</template>
                              <template v-else>Arbitrum:</template>
                              <span class="blue-text">
                                ${{ averageOpenInterestMultiChain[TradingMiningMultiChainID.ARB] | bigNumberFormatterTruncateByPrecision(8, 1, 0) }}
                              </span><span class="split-icon">,</span>
                            </span>
                            <span v-if="averageOpenInterestMultiChain[TradingMiningMultiChainID.BSC]" class="multi-chain-value-item">
                              BSC:
                              <span class="blue-text">
                                ${{ averageOpenInterestMultiChain[TradingMiningMultiChainID.BSC] | bigNumberFormatterTruncateByPrecision(8, 1, 0) }}
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
                </div>
                <div class="vertical-split-line"></div>
                <div class="value-item value-item3">
                  <div v-if="isNeedStakeMcb">
                    <el-tooltip placement="top">
                      <div slot="content"><span v-html="stakingScorePromp2"></span></div>
                      <div class="icon-tooltip warning-text">
                        {{ averageStakingScore | bigNumberFormatterTruncateByPrecision(6, 1, 0) }} ({{ $t('tradingMining.low') }})
                      </div>
                    </el-tooltip>
                  </div>
                  <div v-else>{{ averageStakingScore | bigNumberFormatterTruncateByPrecision(6, 1, 0) }}</div>
                  <div>
                    {{ $t('tradingMining.stakingScore') }}
                    <el-tooltip placement="top" v-if="isNeedStakeMcb">
                      <div slot="content"><span v-html="stakingScorePromp2"></span></div>
                      <div class="tooltip-box">
                        <svg class="svg-icon" aria-hidden="true">
                          <use :xlink:href="`#icon-help`"></use>
                        </svg>
                      </div>
                    </el-tooltip>
                    <!-- tooltip -->
                    <el-popover
                      v-else
                      placement="top"
                      width="579"
                      popper-class="tooltip-popover fantasy trading-mining-popover"
                      trigger="hover"
                    >
                      <div class="tooltip-content">
                        <div class="line-item">
                          <div v-if="averageStakingScoreMultiChain" class="multi-chain-value">(
                            <span class="multi-chain-value-item">
                              {{ $t('base.total') }}:
                              <span class="blue-text">
                                {{ averageStakingScoreMultiChain[TradingMiningMultiChainID.TOTAL] | bigNumberFormatterTruncateByPrecision(8, 1, 0)
                                }}
                              </span><span class="split-icon">,</span>
                            </span>
                            <span v-if="averageStakingScoreMultiChain[TradingMiningMultiChainID.ARB]" class="multi-chain-value-item">
                              <template v-if="isArbTestnet">Arbitrum Testnet:</template>
                              <template v-else>Arbitrum:</template>
                              <span class="blue-text">
                                {{ averageStakingScoreMultiChain[TradingMiningMultiChainID.ARB] | bigNumberFormatterTruncateByPrecision(8, 1, 0) }}
                              </span><span class="split-icon">,</span>
                            </span>
                            <span v-if="averageStakingScoreMultiChain[TradingMiningMultiChainID.BSC]" class="multi-chain-value-item">
                              BSC:
                              <span class="blue-text">
                                {{ averageStakingScoreMultiChain[TradingMiningMultiChainID.BSC] | bigNumberFormatterTruncateByPrecision(8, 1, 0) }}
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
                </div>
                <div class="option-button">
                  <el-button :disabled="!isConnectedWallet || !currentEpochStart" @click="onShowStakeDialog">
                    <div class="button-content">
                      {{ stakeButtonText }}
                      <img class="icon" :src="require('@/assets/img/tokens/SATORI.svg')" alt="">
                    </div>
                  </el-button>
                </div>
              </div>
            </div>
            <div class="bottom-box">
              <div class="left">
                {{ $t('tradingMining.desc') }}
                <a class="link-text" target="_blank"
                   href="https://mcdex.medium.com/announcing-trading-mining-v2-on-bsc-46e9610d7bad">{{ $t('base.learnMore') }}</a>
              </div>
              <div class="vertical-split-line"></div>
              <div class="right">
                <img :src="require('@/assets/img/trading-mining-formula.svg')" alt="">
              </div>
            </div>
          </div>
        </div>
      </McLoading>
    </div>
    <TradingMiningStakeDialog :visible.sync="showStakeDialog" :default-stake-amount="defaultStakeAmount" />
    <TradingMiningHistoryDialog :visible.sync="showHistoryDialog" />
    <TradingMiningClaimDialog :visible.sync="showClaimDialog" />
  </div>
</template>

<script lang='ts'>
import { Component, Mixins } from 'vue-property-decorator'
import { McLoading, McCountDown, McLoadingIcon } from '@/components'
import TradingMiningStakeDialog from './Components/TradingMiningStakeDialog.vue'
import TradingMiningHistoryDialog from './Components/TradingMiningHistoryDialog.vue'
import TradingMiningClaimDialog from './Components/TradingMiningClaimDialog.vue'
import TradingMiningMixin from '@/template/components/Mining/tradingMiningMixin'
import { namespace } from 'vuex-class'
import { ROUTE } from '@/router'
import BigNumber from 'bignumber.js'
import TradingMiningClaimMixin from '@/template/components/Mining/tradingMiningClaimMixin'
import { formatBigNumber } from '@/utils'
import { chainConfigs, currentChainConfig } from '@/config/chain'
import { SUPPORTED_NETWORK_ID } from '@/const'

const poolList = namespace('poolList')

@Component({
  components: {
    McLoading,
    McCountDown,
    TradingMiningStakeDialog,
    TradingMiningHistoryDialog,
    TradingMiningClaimDialog,
    McLoadingIcon,
  }
})
export default class TradingMining extends Mixins(TradingMiningMixin, TradingMiningClaimMixin) {
  @poolList.Mutation('updateSelectListType') updateSelectListType!: Function

  showStakeDialog: boolean = false
  showHistoryDialog: boolean = false
  showClaimDialog: boolean = false

  defaultStakeAmount: BigNumber = new BigNumber(0)

  get isBscChain() {
    return currentChainConfig.chainID === SUPPORTED_NETWORK_ID.BSC
  }

  get chainConfigs() {
    return chainConfigs
  }

  toTradingMiningPools() {
    this.updateSelectListType('certified')
    this.$router.push({ name: ROUTE.POOL })
  }

  get totalRewardStr(): string {
    return formatBigNumber(this.currentEpochInfo.totalReward, 0)
  }

  onShowHistoryDialog() {
    this.showHistoryDialog = true
  }

  onShowStakeDialog() {
    if (!this.currentEpochStart) {
      return
    }
    if (this.isNeedStakeMcb) {
      this.defaultStakeAmount = this.recommendStakeMcb
    } else {
      this.defaultStakeAmount = new BigNumber(0)
    }
    this.showStakeDialog = true
  }
}
</script>

<style lang='scss' scoped>
@import 'mining';

.trading-mining {

  .panel-item-header {
    .title-box {
      a {
        color: var(--mc-color-primary);
      }
      ::v-deep .count-down-container {
        font-size: 24px;
      }
    }

    .right-box {
      display: flex;
      align-items: center;

      .countdown-box, .claim-box {
        .value {
          display: flex;
          align-items: center;
          line-height: 24px;
          font-size: 20px;

          .mc-count-down {
            font-size: 20px;
          }
        }

        .label {
          margin-top: 4px;
          font-size: 14px;
          line-height: 20px;
          color: var(--mc-text-color);
          display: flex;
          align-items: center;
        }
      }

      .split-line {
        width: 1px;
        height: 44px;
        background: var(--mc-border-color);
        margin: 0 24px;
      }

      .claim-box {
        display: flex;
        align-items: center;

        .value-box {
          img {
            width: 20px;
            height: 20px;
          }

          .value {
            .split-icon {
              color: var(--mc-text-color);
              margin: 0 4px;
            }
          }
        }
      }

      .button-box {
        margin-left: 16px;
        margin-top: -5px;

        .el-button {
          height: 44px;
          min-width: 88px;
          font-size: 16px;
          border-radius: var(--mc-border-radius-l);
        }
      }
    }
  }

  .mc-loading {
    min-height: 278px;
  }

  .tooltip-box {
    margin-top: 0 !important;
    cursor: pointer;
  }

  .content-container {
    display: flex;
    height: 305px;

    .horizontal-split-line {
      width: 100%;
      height: 1px;
      background: var(--mc-background-color);
      margin: 24px 0 16px 0;
    }

    .vertical-split-line {
      width: 1px;
      height: 48px;
      background: var(--mc-background-color);
      margin: 0 16px;
    }

    .left-container {
      width: 384px;
      height: 100%;
      margin-right: 24px;
      background: var(--mc-background-color-dark);
      padding: 24px 24px 16px 24px;

      border-radius: var(--mc-border-radius-l);
      border: 1px solid var(--mc-border-color);

      .title {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .left {
          font-size: 18px;
          color: var(--mc-text-color-white);
        }
      }

      .line1 {
        margin-top: 24px;
        margin-bottom: 28px;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;

        .left {
          div:first-child {
            display: flex;
            align-items: center;
            font-size: 26px;
            color: var(--mc-color-blue);
            font-weight: 700;

            img {
              margin-left: 4px;
              width: 22px;
              height: 22px;
            }
          }

          div:last-child {
            margin-top: 4px;
            font-size: 14px;
            color: var(--mc-text-color);
            display: flex;
            align-items: center;
          }
        }

        .right {
          img {
            height: 64px;
          }
        }
      }

      .line2, .line3 {
        display: flex;
        justify-content: space-between;
        margin-top: 16px;

        .icon-text {
          i {
            margin-left: 4px;
          }
        }

        .up-text {
          color: var(--mc-color-blue);

          .icon-down {
            display: none;
          }
        }

        .down-text {
          color: var(--mc-color-orange);

          .icon-up {
            display: none;
          }
        }

        .left, .right {
          width: 50%;

          ::v-deep .el-tooltip {
            height: 13px !important;
            width: 13px !important;
          }

          div:first-child {
            display: flex;
            align-items: center;
            font-size: 14px !important;
            height: 24px;
            line-height: 24px;

            img {
              width: 18px;
              height: 18px;
              margin-left: 4px;
            }
          }

          div:last-child {
            font-size: 14px;
            color: var(--mc-text-color);
            margin-top: 4px;
            display: flex;
            align-items: center;
          }
        }
      }
    }

    .right-container {
      width: 792px;
      height: 100%;
      position: relative;

      .top-box {
        position: relative;
        width: 100%;
        height: 169px;
        padding: 24px;
        border: 1px solid var(--mc-border-color);
        background: var(--mc-background-color-dark);
        border-radius: var(--mc-border-radius-l);
        z-index: 1;

        .title {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .left {
            font-size: 18px;
            color: var(--mc-text-color-white);
          }

          .right {
            display: flex;
            align-items: center;

            .item {
              margin-left: 32px;
              font-size: 16px;
              color: var(--mc-color-primary);
              cursor: pointer;
              display: flex;
              align-items: center;

              i {
                margin-right: 4px;
                font-size: 20px;
              }
            }
          }

          .chain-view {
            display: inline-flex;
            align-items: center;

            .chain-item {
              display: inline-flex;
              align-items: center;

              .join-icon {
                margin: 0 8px;
              }

              &:first-child {
                margin-left: 8px;
              }

              &:last-child {
                margin-right: 8px;

                .join-icon {
                  display: none;
                }
              }
            }

            img {
              height: 24px;
              width: 24px;
            }
          }
        }

        .content {
          margin-top: 54px;
          display: flex;
          align-items: center;

          .vertical-split-line {
            margin: 0 16px;
          }

          .value-item1 {
            width: 32%
          }

          .value-item2 {
            width: 25.1%;
          }

          .value-item3 {
            width: 19%;
          }

          .value-item {
            line-height: 20px;
            div:first-child {
              font-size: 20px;
              color: var(--mc-text-color-white);
            }

            div:last-child {
              margin-top: 4px;
              font-size: 14px;
              color: var(--mc-text-color);
              display: flex;
              align-items: center;
            }

            .sub-value {
              font-size: 14px;
            }

            .split-icon {
              color: var(--mc-text-color);
            }
          }

          .option-button {
            .el-button {
              border-radius: var(--mc-border-radius-l);
              height: 44px;
              min-width: 162px;
            }

            .button-content {
              display: flex;
              align-items: center;
              justify-content: center;
            }

            img {
              height: 22px;
              width: 22px;
            }
          }
        }
      }

      .bottom-box {
        position: absolute;
        display: flex;
        align-items: center;
        bottom: 0;
        width: 100%;
        height: 155px;
        padding: 28px 24px 0 24px;
        border: 1px solid var(--mc-border-color);
        background: var(--mc-background-color-darkest);
        border-radius: var(--mc-border-radius-l);

        .vertical-split-line {
          height: 69px;
        }

        .left {
          width: 35%;
          font-size: 12px;
          color: var(--mc-text-color);
          line-height: 16px;

          .link-text {
            color: var(--mc-color-primary);
            cursor: pointer;
          }
        }

        .right {
          width: 65%;
        }
      }
    }
  }

  .error-text {
    color: var(--mc-color-error) !important;
    display: flex;
    align-items: center;
  }

  .warning-text {
    display: flex;
    align-items: center;
    color: var(--mc-color-warning) !important;
  }

  .icon-tooltip {
    display: inline-block !important;
    font-size: 20px !important;
    text-decoration-line: unset !important;
  }
}
</style>

<style lang="scss">
.trading-mining-popover {
  .tooltip-content {
    .line-item {
      margin-top: 24px;

      .multi-chain-value {
        .multi-chain-value-item:last-child {
          .split-icon {
            display: none;
          }
        }
      }

      &:first-child {
        margin-top: 0;
      }
    }
  }
}
</style>
