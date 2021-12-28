<template>
  <div class="mining-pools">
    <div class="mining-head">
      <div class="title">
        <div class="left">{{ $t('dao.ammLiquidityMining') }}</div>
        <div class="right">
          <a class="link-text" :href="$t('base.liquidityMiningTutorial')">
            <i class="iconfont icon-details-bold"></i>
            <span>{{ $t('dao.miningTutorial') }}</span>
          </a>
        </div>
      </div>
      <div class="sub-title">{{ $t('dao.ammLiquidityMiningPromp') }}</div>
    </div>
    <div class="table-container">
      <van-skeleton :loading="loading" :row="10">
        <div v-if="isOnlineChain" class="mining-pool" v-for="(item, index) in tableDatas" :key="index">
          <div class="pool-info">
            <div class="bg">
              <van-image :src="item.collateralAddress | tokenIconUrlFormatter(item.chainId)">
                <div slot="error" class="image-slot">
                  <img src="@/assets/img/tokens/Unknow.svg" alt="">
                </div>
              </van-image>
            </div>
            <div class="pool-tag">
              <div class="chain-name">
                <img :src="getChainIcon(item.chainId)" alt=""/>
                {{ getChainName(item.chainId) }}
              </div>
            </div>
            <div class="info-top">
              <div class="left">
                <McMTokenImageView :size="40" :token="item.collateralAddress" :chain-id="item.chainId"/>
                <div>
                  <div class="title">
                    {{ item.collateralSymbol }} {{ $t('base.pool') }}
                  </div>
                  <div class="promp">{{ $t('dao.stakeEarnSATORI', {name: `${item.collateralSymbol}`}) }}</div>
                </div>
              </div>
              <div class="apy-info">
                <div class="mining-apy">
                  <div class="value">
                    <div>{{ item.miningAPY | bigNumberFormatter(2) }}</div>%
                  </div>
                  <div class="label">
                    <div>{{ $t('dao.miningAPY') }}</div>
                    <McMTooltip placement="top">
                      <div slot="content">
                        {{ $t('dao.miningApyPromp', { value: formatBigNumber(item.totalReward, 0) }).toString() }}
                      </div>
                      <div class="tooltip-box">
                        <svg class="svg-icon" aria-hidden="true">
                          <use :xlink:href="`#icon-help`"></use>
                        </svg>
                      </div>
                    </McMTooltip>
                  </div>
                </div>
                <div class="lp-apy">
                  <div class="value">{{ item.LpAPY | bigNumberFormatter(2) }}%</div>
                  <div class="label">
                    <div>{{ $t('dao.30dAmmMiningLPApy') }}</div>
                    <McMTooltip placement="top">
                      <div slot="content"><span v-html="$t('dao.30dAmmMiningLPApyPromp')"></span></div>
                      <div class="tooltip-box">
                        <svg class="svg-icon" aria-hidden="true">
                          <use :xlink:href="`#icon-help`"></use>
                        </svg>
                      </div>
                    </McMTooltip>
                  </div>
                </div>
              </div>
            </div>
            <div class="info-box">
              <div class="info-item">
                <div class="value">
                  <div>${{ item.totalLiquidity | bigNumberFormatter(2) }}</div>
                </div>
                <div class=label>
                  <div>{{ $t('dao.totalLiquidity') }}</div>
                </div>
              </div>
              <div class="info-item">
                <div class="value">
                  <div>{{ item.myPooled | bigNumberFormatter(2) }}</div>
                  <McMTokenImageView :size="18" :token="item.collateralAddress" :chain-id="item.chainId"/>
                </div>
                <div class=label>
                  <div>{{ $t('dao.youPooled') }}</div>
                  <McMTooltip placement="top">
                    <div slot="content"><span v-html="$t('dao.youPooledPromp')"></span></div>
                    <div class="tooltip-box">
                      <svg class="svg-icon" aria-hidden="true">
                        <use :xlink:href="`#icon-help`"></use>
                      </svg>
                    </div>
                  </McMTooltip>
                </div>
              </div>
              <div class="info-item">
                <div class="value">
                  <div>{{ item.claimable | bigNumberFormatter(2) }}</div>
                  <img :src="mcbImg" alt="">
                </div>
                <div class=label>{{ $t('dao.claimableRewards') }}</div>
              </div>
            </div>
          </div>
          <div v-if="item.poolAddress" class="pool-button">
            <van-button class="info" @click="toLiquidityPoolPage(item.poolAddress)" :disabled="item.chainId!==currentChainConfig.chainID">
              {{ $t('pool.poolInfo.poolInfo') }}
            </van-button>
            <van-button v-if="!isConnectedWallet" @click="connectWallet">
              {{ $t('connectWalletButton.connectWallet') }}
            </van-button>
            <van-button v-else @click="onAddLiquidity(item.poolAddress)" :disabled="item.chainId!==currentChainConfig.chainID">
              {{ $t('dao.stake') }}
            </van-button>
          </div>
          <div v-else class="pool-button">
            <van-button class="coming-soon-button" disabled>
              {{ $t('base.comingSoon') }}
            </van-button>
          </div>
        </div>

        <!-- coming soon -->
        <div class="mining-pool" v-for="(item, index) in currentChainComingSoonPool" :key="index">
          <div class="pool-info">
            <div class="bg">
              <van-image :src="item.poolName | tokenIconUrlFormatter">
                <div slot="error" class="image-slot">
                  <img src="@/assets/img/tokens/Unknow.svg" alt="">
                </div>
              </van-image>
            </div>
            <div class="pool-tag">
              <div class="chain-name">
                <img :src="currentChainConfig.icon" alt=""/>
                {{ currentChainConfig.chainName }}
              </div>
            </div>
            <div class="info-top">
              <div class="left">
                <McMTokenImageView :size="40" :token="item.poolName" />
                <div>
                  <div class="title">{{ item.poolName }} {{ $t('base.pool') }}</div>
                  <div class="promp">{{ $t('dao.stakeEarnSATORI', {name: `${item.poolName}`}) }}</div>
                </div>
              </div>
              <div class="apy-info">
                <div class="mining-apy">
                  <div class="value coming-soon-value">
                    <span>{{ $t('dao.stayTuned') }}</span>
                  </div>
                  <div class="label">
                    <div>{{ $t('dao.miningAPY') }}</div>
                    <McMTooltip placement="top">
                      <div slot="content">{{ $t('dao.miningApyPromp', { value: '0' }).toString() }}</div>
                      <div class="tooltip-box">
                        <svg class="svg-icon" aria-hidden="true">
                          <use :xlink:href="`#icon-help`"></use>
                        </svg>
                      </div>
                    </McMTooltip>
                  </div>
                </div>
                <div class="lp-apy">
                  <div>0%</div>
                  <div class="label">
                    <div>{{ $t('dao.30dAmmMiningLPApy') }}</div>
                    <McMTooltip placement="top">
                      <div slot="content"><span v-html="$t('dao.30dAmmMiningLPApyPromp')"></span></div>
                      <div class="tooltip-box">
                        <svg class="svg-icon" aria-hidden="true">
                          <use :xlink:href="`#icon-help`"></use>
                        </svg>
                      </div>
                    </McMTooltip>
                  </div>
                </div>
              </div>
            </div>
            <div class="info-box">
              <div class="info-item">
                <div class="value">
                  <div>$0</div>
                </div>
                <div class=label>
                  <div>{{ $t('dao.totalLiquidity') }}</div>
                </div>
              </div>
              <div class="info-item">
                <div class="value">
                  <div>0</div>
                  <McMTokenImageView :size="18" :token="item.poolName" />
                </div>
                <div class=label>
                  <div>{{ $t('dao.youPooled') }}</div>
                  <McMTooltip placement="top">
                    <div slot="content"><span v-html="$t('dao.youPooledPromp')"></span></div>
                    <div class="tooltip-box">
                      <svg class="svg-icon" aria-hidden="true">
                        <use :xlink:href="`#icon-help`"></use>
                      </svg>
                    </div>
                  </McMTooltip>
                </div>
              </div>
              <div class="info-item">
                <div class="value">
                  <div>0</div>
                  <img :src="mcbImg" alt="">
                </div>
                <div class=label>{{ $t('dao.claimableRewards') }}</div>
              </div>
            </div>
          </div>
          <div class="pool-button">
            <van-button class="coming-soon-button" disabled>
              {{ $t('base.comingSoon') }}
            </van-button>
          </div>
        </div>
      </van-skeleton>
    </div>

    <div class="more-pool" v-if="showMorePool">
      <div class="text">{{ $t('dao.poolsComingSoon') }}</div>
      <a href="https://forum.mcdex.io/">
        <van-button class="button">
          {{ $t('footer.forum') }}
          <i class="iconfont icon-view"></i>
        </van-button>
      </a>
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { ROUTE } from '@/mobile/router'
import { MiningPoolData, MiningPoolMixin } from '@/template/components/Mining/miningPoolMixin'
import { PNNumber } from '@/components'
import { McNoData } from '@/components'
import { SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/constants'
import { McMStateButton, McMTokenImageView, McMTooltip } from '@/mobile/components'
import { VUE_EVENT_BUS, WALLET_EVENT } from '@/event'
import { formatBigNumber } from '@/utils'
import { currentChainConfig } from '@/config/chain'
import { COMMON_EVENT } from '@/mobile/event'
import * as _ from 'lodash'

@Component({
  components: {
    McNoData,
    PNNumber,
    McMStateButton,
    McMTokenImageView,
    McMTooltip,
  },
})
export default class MiningPools extends Mixins(MiningPoolMixin) {
  private nowOnline: boolean = true
  private mcbImg = require('@/assets/img/tokens/SATORI.svg')
  private formatBigNumber = formatBigNumber
  private showMorePool: boolean = false

  get currentChainConfig() {
    return currentChainConfig
  }

  get noData(): boolean {
    return this.tableDatas.length === 0
  }

  get tableDatas(): MiningPoolData[] {
    return _.orderBy(
      this.miningPoolsData,
      [
        (item) => item.chainId === currentChainConfig.chainID,
        (item) => item.collateralSymbol === 'USDO',
        (item) => item.collateralSymbol === 'ETH',
        (item) => item.collateralSymbol === 'BTCB',
        (item) => item.collateralSymbol === 'BUSD',
      ],
      ['desc', 'asc', 'asc', 'asc', 'asc'],
    )
  }

  private goLiquidity(item: MiningPoolData) {
    this.$router.push({ name: ROUTE.LIQUIDITY, params: { poolAddress: item.poolAddress } })
  }

  connectWallet() {
    VUE_EVENT_BUS.emit(COMMON_EVENT.SHOW_SELECT_WALLET_POPUP)
  }

  toLiquidityPoolPage(poolAddress: string) {
    this.$router.push({ name: 'poolInfo', params: { poolAddress: poolAddress } })
  }

  onAddLiquidity(poolAddress: string) {
    VUE_EVENT_BUS.emit(COMMON_EVENT.CHANGE_POOL_LIQUIDITY, poolAddress)
  }
}
</script>

<style lang="scss" scoped>
@import "pool-item";

.table-container {
  display: flex;
  flex-wrap: wrap;

  .van-skeleton {
    width: 100%;
    margin-bottom: 16px;
  }

  .mining-pool {
    position: relative;
    width: 100%;
    height: 377px;
    padding-bottom: 76px;
    margin-bottom: 16px;

    &:last-of-type {
      margin-bottom: 0;
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

      .chain-name {
        display: flex;
        align-items: center;
        padding: 4px 12px;
        border-bottom-left-radius: 12px;
        img {
          margin-right: 4px;
          height: 23px;
          width: 23px;
        }
      }
    }

    .pool-info {
      position: relative;
      height: 301px;
      width: 100%;
      padding: 23px 23px 16px;
      border-radius: 12px;
      z-index: 5;
      overflow: hidden;
      border: 1px solid;
      background-color: var(--mc-background-color-dark);
      border-color: var(--mc-border-color);

      .info-top {
        .left {
          display: flex;
          align-items: center;

          .token-image-view {
            margin-right: 8px;
          }

          .title {
            font-size: 18px;
            line-height: 24px;
          }

          .promp {
            font-size: 12px;
            line-height: 16px;
            margin-top: 4px;
            color: var(--mc-text-color);
          }
        }

        .apy-info {
          padding: 24px 0;
          display: flex;
          align-items: flex-end;
          font-size: 14px;
          line-height: 20px;
          width: 100%;
          border-bottom: 1px solid var(--mc-border-color);

          .mining-apy {
            width: 50%;

            .value {
              font-size: 18px;
              line-height: 24px;
              font-weight: 700;

              div {
                display: inline-block;
                font-size: 26px;
              }
            }
          }

          .lp-apy {
            width: 50%;
          }

          .value {
            color: var(--mc-color-blue);
          }

          .coming-soon-value {
            color: var(--mc-text-color);
          }

          .label {
            color: var(--mc-text-color);
            margin-top: 2px;
            display: flex;
            align-items: center;
          }
        }
      }

      .info-box {
        display: flex;
        flex-wrap: wrap;

        .info-item {
          width: 50%;
          margin-top: 16px;
          font-size: 14px;
          line-height: 20px;

          .value {
            display: flex;
            align-items: center;

            :first-child {
              margin-right: 4px;
            }

            img {
              width: 18px;
              height: 18px;
            }
          }

          .label {
            display: flex;
            align-items: center;
            color: var(--mc-text-color);
            margin-top: 4px;
          }
        }
      }
    }

    .pool-button {
      position: absolute;
      bottom: 0;
      height: 88px;
      width: 100%;
      padding: 28px 23px 16px;
      display: flex;
      justify-content: space-between;
      border-radius: 0 0 12px 12px;
      border: 1px solid;
      border-top: none;
      z-index: 4;
      background-color: var(--mc-background-color-darkest);
      border-color: var(--mc-border-color);

      .van-button {
        height: 44px;
        width: calc((100% - 12px) / 2);
        font-size: 16px;
        border-radius: var(--mc-border-radius-l);
      }

      .coming-soon-button {
        width: 100%;
        background: var(--mc-background-color);
      }
    }

    .v-popover {
      display: flex;

      .tooltip-box {
        width: 13px;
        height: 13px;
        line-height: 13px;
        text-align: center;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: 5.5px;
        background-color: #3c486a;

        .svg-icon {
          width: 9px;
          height: 7px;
          color: var(--mc-text-color-white);
        }
      }
    }
  }
}

.more-pool {
  border: 1px dashed var(--mc-border-color);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  line-height: 20px;
  color: var(--mc-text-color);

  .text {
    width: 127px;
  }
}

.van-button {
  height: 44px;
  width: 140px;
  font-size: 16px;
  border-radius: var(--mc-border-radius-l);
}

.info {
  background: var(--mc-background-color);
}
</style>
