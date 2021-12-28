<template>
  <div>
    <div class="trading-mining">
      <div class="mining-head">
        <div class="title">
          <template v-if="currentEpochStart">
            {{ $t('tradingMining.title', {id: currentEpoch}).toString() }}
          </template>
          <template v-else>
            {{ $t('tradingMining.title2') }}
            ({{ $t('dao.startIn') }} <McCountDown :module="1" :end-timestamp="currentEpochInfo.startTimestamp"/>)
          </template>
        </div>
        <div class="sub-title">
          {{ $t('tradingMining.titleSubDesc') }}
          <a class="link-text" href="https://support.mcdex.io/hc/en-us/articles/4407032150041" target="_blank">{{ $t('base.tutorial') }}</a>
        </div>
      </div>
      <div class="container">
        <div class="box-item box1">
          <div class="claim-box">
            <div class="value-box">
              <div class="value">
                {{ totalClaimableRewards | bigNumberFormatterTruncateByPrecision(6, 1, 2) }}
                <span class="split-icon">/</span>
                {{ totalAllocatedRewards | bigNumberFormatterTruncateByPrecision(6, 1, 2) }}
                <img class="icon" :src="require('@/assets/img/tokens/SATORI.svg')" alt="">
              </div>
              <div class="label">
                {{ $t('tradingMining.claimableAllocatedRewards') }}
                <McMTooltip placement="top">
                  <div slot="content">
                    <span v-html="claimRewardPromp1"></span>
                  </div>
                  <span class="tooltip-box">
                    <svg class="svg-icon" aria-hidden="true">
                      <use :xlink:href="`#icon-help`"></use>
                    </svg>
                  </span>
                </McMTooltip>
              </div>
            </div>
            <div class="button-box">
              <van-button size="medium" class="round" :disabled="Object.keys(allChainClaimInfo).length ===0"
                          @click="showTradingMiningClaimPopup=true">
                {{ $t('base.claim') }}
              </van-button>
            </div>
          </div>
          <div class="split-line"></div>
          <div class="countdown-box">
            <div class="value">
              <template v-if="currentEpochStart">
                <McCountDown :end-timestamp="currentEpochInfo.endTimestamp" :module='2' />
              </template>
              <template v-else>N/A</template>
            </div>
            <div class="label">{{ $t('tradingMining.epochCountdown', {id: currentEpoch}).toString() }}</div>
          </div>
        </div>
        <div class="box-item box2">
          <div class="title">
            <div class="left">{{ $t('tradingMining.yourEstimatedRewards') }}</div>
          </div>
          <div class="line1">
            <div class="left">
              <div class="value">
                {{ estimatedValue | bigNumberFormatterTruncateByPrecision(10, 1, 2) }}
                <img class="icon" :src="require('@/assets/img/tokens/SATORI.svg')" alt="">
              </div>
              <div class="label">
                {{ $t('tradingMining.estimatedForEpoch', {id: currentEpoch}).toString() }}
                <McMTooltip placement="top">
                  <span slot="content"><span v-html="$t('tradingMining.estimatedForEpochPromp')"></span></span>
                  <span class="tooltip-box">
                    <svg class="svg-icon" aria-hidden="true">
                      <use :xlink:href="`#icon-help`"></use>
                    </svg>
                  </span>
                </McMTooltip>
              </div>
            </div>
            <div class="right">
              <img :src="require('@/assets/img/dao-mintable.png')" alt="">
            </div>
          </div>
          <div class="split-line"></div>
          <div class="line2">
            <div class="left">
              <div class="value">
                {{ currentEpochInfo.totalReward | bigNumberFormatter(0) }}
                <img class="icon" :src="require('@/assets/img/tokens/SATORI.svg')" alt="">
              </div>
              <div class="label">
                {{ $t('tradingMining.totalRewardsPool') }}
                <McMTooltip placement="top">
                  <span slot="content">
                    <span v-html="$t('tradingMining.totalRewardsPoolPromp', {value: totalRewardStr}).toString()"></span>
                  </span>
                  <span class="tooltip-box">
                    <svg class="svg-icon" aria-hidden="true">
                      <use :xlink:href="`#icon-help`"></use>
                    </svg>
                  </span>
                </McMTooltip>
              </div>
            </div>
            <div class="right">
              <div class="value icon-text" :class="[`${allTraderScoreChangeSide}-text`]">
                <span>{{ allTraderScore | bigNumberFormatterTruncateByPrecision(6, 1, 0) }}</span>
                <i class="iconfont icon-index-up"></i>
                <i class="iconfont icon-index-down"></i>
              </div>
              <div class="label">
                {{ $t('tradingMining.allTraderScore') }}
                <McMTooltip placement="top">
                  <span slot="content"><span v-html="$t('tradingMining.allTraderScorePromp')"></span></span>
                  <span class="tooltip-box">
                    <svg class="svg-icon" aria-hidden="true">
                      <use :xlink:href="`#icon-help`"></use>
                    </svg>
                  </span>
                </McMTooltip>
              </div>
            </div>
          </div>
          <div class="line3">
            <div class="left">
              <div class="value">
                {{ accountScore | bigNumberFormatterTruncateByPrecision(6, 1, 0) }}
              </div>
              <div class="label">
                {{ $t('tradingMining.yourTraderScore') }}
                <McMTooltip placement="top">
                  <span slot="content"><span v-html="$t('tradingMining.yourTraderScorePromp')"></span></span>
                  <span class="tooltip-box">
                    <svg class="svg-icon" aria-hidden="true">
                      <use :xlink:href="`#icon-help`"></use>
                    </svg>
                  </span>
                </McMTooltip>
              </div>
            </div>
            <div class="right">
              <div class="value">
                {{ accountScoreOfPool | bigNumberFormatterTruncateByPrecision(6, 1, 2) }}%
              </div>
              <div class="label">
                {{ $t('tradingMining.yourShareOfPool') }}
                <McMTooltip placement="top">
                  <span slot="content"><span v-html="$t('tradingMining.yourShareOfPoolPromp')"></span></span>
                  <span class="tooltip-box">
                    <svg class="svg-icon" aria-hidden="true">
                      <use :xlink:href="`#icon-help`"></use>
                    </svg>
                  </span>
                </McMTooltip>
              </div>
            </div>
          </div>
        </div>
        <div class="box3">
          <div class="top-box">
            <div class="card-tag" v-if="multiChainSupported.length > 1">
              <div class="chain-view">
                <span v-for="(item, index) in multiChainSupported" class="chain-item" :key="index">
                  <img :src="chainConfigs[item].icon" alt=""/><span class="join-icon">+</span>
                </span>
              </div>
            </div>
            <div class="title">
              <div class="left">{{ $t('tradingMining.yourTradingData') }}</div>
              <div class="right"></div>
            </div>
            <div class="line-item">
              <div class="value">
                <span>${{ daoFeePaid | bigNumberFormatterTruncateByPrecision(6, 1, 0) }}</span>
                <span class="sub-value">
                <span class="split-icon">/</span>${{ totalFeesPaid | bigNumberFormatterTruncateByPrecision(6, 1, 0) }}</span>
              </div>
              <div class="label">
                {{ $t('tradingMining.totalAndDaoFeesPaid') }}
                <McMTooltip placement="top">
                  <div slot="content" class="tooltip-content">
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
                          </span>
                          <span class="split-icon">,</span>
                        </span>
                        <span v-if="baseDaoFeePaidMultiChain[TradingMiningMultiChainID.BSC]" class="multi-chain-value-item">
                          BSC:
                          <span class="blue-text">
                            ${{ baseDaoFeePaidMultiChain[TradingMiningMultiChainID.BSC] | bigNumberFormatterTruncateByPrecision(6, 1, 0) }}
                          </span>
                          <span class="split-icon">,</span>
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
                  <span class="tooltip-box">
                    <svg class="svg-icon" aria-hidden="true">
                      <use :xlink:href="`#icon-help`"></use>
                    </svg>
                  </span>
                </McMTooltip>
              </div>
            </div>
            <div class="split-line"></div>
            <div class="line-item">
              <div class="value">
                ${{ averageOpenInterest | bigNumberFormatterTruncateByPrecision(8, 1, 0) }}
              </div>
              <div class="label">
                {{ $t('tradingMining.averageOpenInterest') }}
                <McMTooltip placement="top">
                  <div slot="content" class="tooltip-content">
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
                  <span class="tooltip-box">
                    <svg class="svg-icon" aria-hidden="true">
                      <use :xlink:href="`#icon-help`"></use>
                    </svg>
                  </span>
                </McMTooltip>
              </div>
            </div>
            <div class="split-line"></div>
            <div class="line-item flex-line-item">
              <div class="left">
                <div class="value">
                  <div v-if="isNeedStakeMcb" class="warning-text">
                    {{ averageStakingScore | bigNumberFormatterTruncateByPrecision(6, 1, 0) }} ({{ $t('tradingMining.low') }})
                  </div>
                  <div v-else>{{ averageStakingScore | bigNumberFormatterTruncateByPrecision(6, 1, 0) }}</div>
                </div>
                <div class="label">
                  {{ $t('tradingMining.stakingScore') }}
                  <McMTooltip placement="top">
                    <div slot="content" class="tooltip-content">
                      <div v-if="isNeedStakeMcb" v-html="stakingScorePromp2"></div>
                      <div v-else>
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
                      <span v-else v-html="$t('tradingMining.stakingScorePromp')"></span>
                    </div>
                    <span class="tooltip-box">
                    <svg class="svg-icon" aria-hidden="true">
                      <use :xlink:href="`#icon-help`"></use>
                    </svg>
                  </span>
                  </McMTooltip>
                </div>
              </div>
              <div class="right">
                <van-button size="medium" class="round option-button" @click="onShowStakePopup"
                            :disabled="!isConnectedWallet || !currentEpochStart">
                  <div class="button-content">
                    {{ stakeButtonText }}
                    <img class="icon" :src="require('@/assets/img/tokens/SATORI.svg')" alt="">
                  </div>
                </van-button>
              </div>
            </div>
          </div>
          <div class="bottom-box">
            <div @click="showTradingFormulaPopup = true">
              <i class="iconfont icon-details-bold"></i>
              {{ $t('tradingMining.formula') }}
            </div>
            <div @click="toTradingMiningPools">
              <i class="iconfont icon-pool"></i>
              {{ $t('tradingMining.pools') }}
            </div>
            <div @click="toTradingMiningHistory">
              <i class="iconfont icon-history"></i>
              {{ $t('base.history') }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <TradingFormulaPopup :visible.sync="showTradingFormulaPopup" />
    <TradingMiningStakePopup :visible.sync="showTradingMiningStakePopup" :default-stake-amount="defaultStakeAmount" />
    <TradingMiningClaimPopup :visible.sync="showTradingMiningClaimPopup" />
  </div>
</template>

<script lang='ts'>
import { Component, Mixins } from 'vue-property-decorator'
import TradingMiningMixin from '@/template/components/Mining/tradingMiningMixin'
import TradingMiningClaimMixin from '@/template/components/Mining/tradingMiningClaimMixin'
import { McMTooltip } from '@/mobile/components'
import { McCountDown } from '@/components'
import TradingFormulaPopup from './Components/TradingFormulaPopup.vue'
import TradingMiningStakePopup from './Components/TradingMiningStakePopup.vue'
import TradingMiningClaimPopup from './Components/TradingMiningClaimPopup.vue'
import { ROUTE } from '@/mobile/router'
import { namespace } from 'vuex-class'
import { formatBigNumber } from '@/utils'
import BigNumber from 'bignumber.js'
import { chainConfigs } from '@/config/chain'

const poolList = namespace('poolList')

@Component({
  components: {
    McMTooltip,
    McCountDown,
    TradingFormulaPopup,
    TradingMiningStakePopup,
    TradingMiningClaimPopup,
  }
})
export default class TradingMining extends Mixins(TradingMiningMixin, TradingMiningClaimMixin) {
  @poolList.Mutation('updateSelectListType') updateSelectListType!: Function
  private showTradingFormulaPopup: boolean = false
  private showTradingMiningStakePopup: boolean = false
  private showTradingMiningClaimPopup: boolean = false

  defaultStakeAmount: BigNumber = new BigNumber(0)

  get totalRewardStr(): string {
    return formatBigNumber(this.currentEpochInfo.totalReward, 0)
  }

  get chainConfigs() {
    return chainConfigs
  }

  toTradingMiningPools() {
    this.updateSelectListType('certified')
    this.$router.push({ name: ROUTE.POOL_LIST })
  }

  toTradingMiningHistory() {
    this.$router.push({ name: ROUTE.TRADING_MINING_HISTORY })
  }

  onShowStakePopup() {
    if (!this.currentEpochStart) {
      return
    }
    if (this.isNeedStakeMcb) {
      this.defaultStakeAmount = this.recommendStakeMcb
    } else {
      this.defaultStakeAmount = new BigNumber(0)
    }
    this.showTradingMiningStakePopup = true
  }

  async onClaimEvent() {
    // await this.onClaimEpochReward(0)
    await this.onClaimAllEpochReward()
  }
}
</script>

<style lang="scss" scoped>
@import "./pool-item";
.trading-mining {
  .container {
    .box-item {
      border: 1px solid var(--mc-border-color);
      border-radius: var(--mc-border-radius-l);
      padding: 24px;
      margin-top: 16px;
      background: var(--mc-background-color-dark);

      &:first-child {
        margin-top: 0;
      }
    }

    .split-line {
      height: 1px;
      width: 100%;
      background: var(--mc-border-color);
    }

    .box1 {
      .claim-box {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .value-box {
          img {
            width: 20px;
            height: 20px;
            margin-left: 4px;
          }

          .value {
            display: flex;
            align-items: center;
            font-size: 20px;
            line-height: 24px;
            color: var(--mc-text-color-white);

            .split-icon {
              color: var(--mc-text-color);
              margin: 0 4px;
            }
          }

          .label {
            font-size: 14px;
            line-height: 20px;
            color: var(--mc-text-color);
            margin-top: 4px;
            display: flex;
            align-items: center;
          }
        }

        .button-box {
          .van-button {
            min-width: 73px;
            height: 44px;
            font-size: 16px;
          }
        }
      }

      .split-line {
        margin: 24px 0 24px 0;
      }

      .countdown-box {
        .value {
          .mc-count-down {
            font-size: 20px;
            line-height: 24px;
            color: var(--mc-text-color-white);
            font-weight: 400;
          }
        }

        .label {
          font-size: 14px;
          line-height: 20px;
          color: var(--mc-text-color);
          margin-top: 4px;
          display: flex;
          align-items: center;
        }
      }
    }

    .box2 {
      .title {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .left {
          font-size: 18px;
          line-height: 24px;
          color: var(--mc-text-color-white);
        }
      }

      .line1 {
        margin-top: 8px;
        margin-bottom: 24px;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;

        .left {
          .value {
            display: flex;
            align-items: center;
            font-size: 26px;
            line-height: 24px;
            color: var(--mc-color-blue);
            font-weight: 700;

            img {
              margin-left: 4px;
              width: 22px;
              height: 22px;
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
          display: flex;
          align-items: center;

          i {
            font-size: 10px;
            margin-left: 4px;
          }
        }

        .up-text {
          color: var(--mc-color-blue);

          .icon-index-down {
            display: none;
          }
        }

        .down-text {
          color: var(--mc-color-orange);

          .icon-index-up {
            display: none;
          }
        }

        .left, .right {
          width: 50%;

          ::v-deep .el-tooltip {
            height: 13px !important;
            width: 13px !important;
          }

          .value {
            display: flex;
            align-items: center;
            font-size: 14px !important;
            height: 20px;
            line-height: 20px;

            img {
              width: 18px;
              height: 18px;
              margin-left: 4px;
            }
          }

          .label {
            font-size: 14px;
            line-height: 20px;
            color: var(--mc-text-color);
            margin-top: 4px;
            display: flex;
            align-items: center;
          }
        }
      }
    }

    .box3 {
      margin-top: 16px;
      position: relative;

      .top-box {
        position: relative;
        z-index: 2;
        border: 1px solid var(--mc-border-color);
        border-radius: var(--mc-border-radius-l);
        padding: 24px;
        background: var(--mc-background-color-dark);

        .card-tag {
          position: absolute;
          right: 0;
          top: 0;
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          background: var(--mc-background-color-light);
          border-radius: 0 12px 0 12px;
        }

        .chain-view {
          display: inline-flex;
          align-items: center;

          .chain-item {
            display: inline-flex;
            align-items: center;

            .join-icon{
              margin: 0 8px;
            }

            &:last-child {
              .join-icon {
                display: none;
              }
            }

            img {
              height: 23px;
              width: 23px;
            }
          }
        }

        .title {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .left {
            font-size: 18px;
            line-height: 24px;
            color: var(--mc-text-color-white);
          }

          .right {
            display: flex;
            align-items: center;

            .item {
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
        }

        .split-line {
          margin-top: 24px;
        }

        .line-item {
          margin-top: 24px;

          .split-icon {
            color: var(--mc-text-color);
            margin: 0 4px;
          }

          .value {
            color: var(--mc-text-color-white);
            font-size: 20px;
            line-height: 24px;
          }

          .sub-value {
            font-size: 14px;
            line-height: 20px;
          }

          .label {
            color: var(--mc-text-color);
            font-size: 14px;
            line-height: 20px;
            margin-top: 4px;
            display: flex;
            align-items: center;
          }
        }

        .flex-line-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .option-button {
          .button-content {
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            padding: 0 7px;

            img {
              height: 22px;
              width: 22px;
              margin-left: 4px;
            }
          }
        }
      }

      .bottom-box {
        z-index: 1;
        background: var(--mc-background-color-darkest);
        border: 1px solid var(--mc-border-color);
        border-radius: var(--mc-border-radius-l);
        height: 80px;
        width: 100%;
        margin-top: -24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 40px 24px 16px 24px;
        color: var(--mc-color-primary);
        font-size: 16px;
        line-height: 24px;

        div {
          display: flex;
          align-items: center;
        }

        i {
          font-size: 20px;
          margin-right: 4px;
        }
      }
    }

    .warning-text {
      display: flex;
      align-items: center;
      color: var(--mc-color-warning) !important;
    }
  }
}
</style>

<style lang="scss" scoped>
.mc-count-down {
  font-size: 20px;
  font-weight: bold;
}
</style>

<style lang="scss">
.tooltip-content {
  .line-item {
    margin-top: 16px;

    &:first-child {
      margin-top: 0;
    }

    .blue-text {
      color: var(--mc-color-blue);
    }

    .multi-chain-value-item {
      &:last-child {
        .split-icon {
          display: none;
        }
      }
    }
  }
}
</style>
