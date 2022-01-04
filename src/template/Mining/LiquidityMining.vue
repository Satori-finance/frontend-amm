<template>
  <div class="liquidity-mining ">
    <div class="panel-item-header">
      <div class="title-box">
        <div class="title">{{ $t('dao.ammLiquidityMining') }}</div>
        <div class="promp">{{ $t('dao.ammLiquidityMiningPromp') }}</div>
      </div>
      <a class="mining-link" :href="$t('base.liquidityMiningTutorial')" target="_blank">
        <i class="iconfont icon-details-bold mc-icon-btn"></i>
        <span>{{ $t('dao.miningTutorial') }}</span></a>
    </div>
    <McLoading :show-loading="loading" :min-show-time="500" :hideContent="true">
      <div class="table-container">
        <template v-if="isOnlineChain">
          <div class="mining-pool" v-for="(item, index) in tableDatas" :key="index">
            <div class="pool-info">
              <div class="bg">
                <el-image :src="item.collateralAddress | tokenIconUrlFormatter(item.chainId)">
                  <div slot="error" class="image-slot">
                    <img src="@/assets/img/tokens/Unknow.svg" alt="">
                  </div>
                </el-image>
              </div>
              <div class="pool-tag">
                <div class="chain-name">
                  <img :src="getChainIcon(item.chainId)" alt=""/>
                  {{ getChainName(item.chainId) }}
                </div>
              </div>

              <div class="info-top">
                <div class="left">
                  <el-image class="token-img" :src="item.collateralAddress | tokenIconUrlFormatter(item.chainId)">
                    <div slot="error" class="image-slot">
                      <img src="@/assets/img/tokens/Unknow.svg" alt="">
                    </div>
                  </el-image>
                <div>
                  <div class="title">
                    {{ item.collateralSymbol }} {{ $t('base.pool') }}
                  </div>
                  <div class="promp">{{ $t('dao.stakeEarnSATORI', {name: `${item.collateralSymbol}`}) }}</div>
                  </div>
                </div>
                <div class="right"></div>
              </div>
              <div class="apy-line">
                <div class="left">
                  <div class="value-box">
                    <div class="value primary-value">
                      {{ item.miningAPY | bigNumberFormatter(2) }}
                      <div class="value-uint">%</div>
                    </div>
                    <div class="label">
                      {{ $t('dao.miningAPY') }}
                      <el-tooltip placement="top">
                        <div slot="content">{{ $t('dao.miningApyPromp', { value: formatBigNumber(item.totalReward, 0) }).toString() }}</div>
                        <div class="tooltip-box">
                          <svg class="svg-icon" aria-hidden="true">
                            <use :xlink:href="`#icon-help`"></use>
                          </svg>
                        </div>
                      </el-tooltip>
                    </div>
                  </div>
                  <div class="value-box">
                    <div class="value secondary-value">
                      {{ item.LpAPY | bigNumberFormatter(2) }}%
                    </div>
                    <div class="label">
                      {{ $t('dao.30dAmmMiningLPApy') }}
                      <el-tooltip placement="top">
                        <div slot="content"><span v-html="$t('dao.30dAmmMiningLPApyPromp')"></span></div>
                        <div class="tooltip-box">
                          <svg class="svg-icon" aria-hidden="true">
                            <use :xlink:href="`#icon-help`"></use>
                          </svg>
                        </div>
                      </el-tooltip>
                    </div>
                  </div>
                </div>
                <div class="right"></div>
              </div>
              <div class="split-line"></div>
              <div class="info-box">
                <div class="info-item">
                  <div class="value">${{ item.totalLiquidity | bigNumberShortenFormat(2) }}</div>
                  <div class="label">{{ $t('dao.totalLiquidity') }}</div>
                </div>
                <div class="info-item">
                  <div class="value">
                    {{ item.myPooled | bigNumberFormatter(2) }}
                      <el-image class="token-img" :src="item.collateralAddress | tokenIconUrlFormatter(item.chainId)">
                        <div slot="error" class="image-slot">
                          <img src="@/assets/img/tokens/Unknow.svg" alt="">
                        </div>
                      </el-image>
                  </div>
                  <div class="label">
                    {{ $t('dao.youPooled') }}
                    <el-tooltip placement="top">
                      <div slot="content"><span v-html="$t('dao.youPooledPromp')"></span></div>
                      <div class="tooltip-box">
                        <svg class="svg-icon" aria-hidden="true">
                          <use :xlink:href="`#icon-help`"></use>
                        </svg>
                      </div>
                    </el-tooltip>
                  </div>
                </div>
                <div class="info-item">
                  <div class="value">
                    <div class="value">{{ item.claimable | bigNumberFormatterTruncateByPrecision(10, 1, 2) }}</div>
                      <el-image class="token-img" :src="SATORI_ADDRESS | tokenIconUrlFormatter">
                        <div slot="error" class="image-slot">
                          <img src="@/assets/img/tokens/Unknow.svg" alt="">
                        </div>
                      </el-image>
                  </div>
                  <div class="label">{{ $t('dao.claimableRewards') }}</div>
                </div>
              </div>
            </div>
            <div class="pool-button">
              <el-button class="button info" size="medium" @click="toLiquidityPoolPage(item.poolAddress)"
                         :disabled="item.chainId!==currentChainConfig.chainID">
                {{ $t('pool.poolInfo.poolInfo') }}
              </el-button>
              <el-button v-if="!isConnectedWallet" class="button" size="medium" type="primary" @click="onConnectWallet">
                {{ $t('connectWalletButton.connectWallet') }}
              </el-button>
              <el-button v-else class="button" size="medium" @click="onAddLiquidity(item.poolAddress)"
                         :disabled="item.chainId!==currentChainConfig.chainID">
                {{ $t('dao.stake') }}
              </el-button>
            </div>
<!--            <div class="pool-button">-->
<!--              <el-button class="button info long-button disable" size="medium">-->
<!--                {{ $t('dao.startIn') }}-->
<!--              </el-button>-->
<!--            </div>-->
          </div>
        </template>

        <!-- coming soon -->
        <div class="mining-pool" v-for="(item, index) in currentChainComingSoonPool" :key="index">
          <div class="pool-info">
            <div class="bg">
              <el-image :src="item.poolName | tokenIconUrlFormatter">
                <div slot="error" class="image-slot">
                  <img src="@/assets/img/tokens/Unknow.svg" alt="">
                </div>
              </el-image>
            </div>
            <div class="pool-tag">
              <div class="chain-name">
                <img :src="currentChainConfig.icon" alt=""/>
                {{ currentChainConfig.chainName }}
              </div>
            </div>

            <div class="info-top">
              <div class="left">
                <el-image class="token-img" :src="item.poolName | tokenIconUrlFormatter">
                  <div slot="error" class="image-slot">
                    <img src="@/assets/img/tokens/Unknow.svg" alt="">
                  </div>
                </el-image>
                <div>
                  <div class="title">{{ item.poolName }} {{ $t('base.pool') }}</div>
                  <div class="promp">{{ $t('dao.stakeEarnSATORI', {name: `${item.poolName}`}) }}</div>
                </div>
              </div>
              <div class="right"></div>
            </div>
            <div class="apy-line">
              <div class="left">
                <div class="value-box">
                  <div class="value primary-value">
                    {{ $t('dao.stayTuned') }}
                  </div>
                  <div class="label">
                    {{ $t('dao.miningAPY') }}
                    <el-tooltip placement="top">
                      <div slot="content">{{ $t('dao.miningApyPromp', { value: '0' }).toString() }}</div>
                      <div class="tooltip-box">
                        <svg class="svg-icon" aria-hidden="true">
                          <use :xlink:href="`#icon-help`"></use>
                        </svg>
                      </div>
                    </el-tooltip>
                  </div>
                </div>
                <div class="value-box">
                  <div class="value secondary-value">
                    {{ $t('dao.stayTuned') }}
                  </div>
                  <div class="label">
                    {{ $t('dao.30dAmmMiningLPApy') }}
                    <el-tooltip placement="top">
                      <div slot="content"><span v-html="$t('dao.30dAmmMiningLPApyPromp')"></span></div>
                      <div class="tooltip-box">
                        <svg class="svg-icon" aria-hidden="true">
                          <use :xlink:href="`#icon-help`"></use>
                        </svg>
                      </div>
                    </el-tooltip>
                  </div>
                </div>
              </div>
              <div class="right"></div>
            </div>
            <div class="split-line"></div>
            <div class="info-box">
              <div class="info-item">
                <div class="value">$0</div>
                <div class="label">{{ $t('dao.totalLiquidity') }}</div>
              </div>
              <div class="info-item">
                <div class="value">
                  0
                  <el-image class="token-img" :src="item.poolName | tokenIconUrlFormatter">
                    <div slot="error" class="image-slot">
                      <img src="@/assets/img/tokens/Unknow.svg" alt="">
                    </div>
                  </el-image>
                </div>
                <div class="label">
                  {{ $t('dao.youPooled') }}
                  <el-tooltip placement="top">
                    <div slot="content"><span v-html="$t('dao.youPooledPromp')"></span></div>
                    <div class="tooltip-box">
                      <svg class="svg-icon" aria-hidden="true">
                        <use :xlink:href="`#icon-help`"></use>
                      </svg>
                    </div>
                  </el-tooltip>
                </div>
              </div>
              <div class="info-item">
                <div class="value">
                  <div class="value">0</div>
                  <el-image class="token-img" :src="SATORI_ADDRESS | tokenIconUrlFormatter">
                    <div slot="error" class="image-slot">
                      <img src="@/assets/img/tokens/Unknow.svg" alt="">
                    </div>
                  </el-image>
                </div>
                <div class="label">{{ $t('dao.claimableRewards') }}</div>
              </div>
            </div>
          </div>
          <div class="pool-button">
            <el-button class="button info long-button disable" size="medium">
              {{ $t('base.comingSoon') }}
            </el-button>
          </div>
        </div>

        <div class="more-pool-box" v-if="isArbTestnet">
          <div class="more-pool">
            <div>
              <img src="@/assets/img/poolComingSoon.svg" alt="" />
              <div>{{ $t('dao.poolsComingSoon') }}</div>
            </div>
            <div class="suggest-pool" @click="forumShow = !forumShow" :class="forumShow?'suggest-pool-transform':''">
              <div>{{ $t('dao.suggestPool') }}</div>
              <i class="iconfont icon-arrow-up"></i>
            </div>
          </div>

          <div class="forum" :class="forumShow?'forum-show':''">
            <a href="https://forum.mcdex.io/" target="_blank">
              <el-button class="button info" size="medium">
                {{ $t('footer.forum') }}
                <i class="iconfont icon-view" ></i>
              </el-button>
            </a>
          </div>
        </div>
      </div>
    </McLoading>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { McLoading, McNoData, PerpetualsViewer, McCountDown } from '@/components'
import { etherBrowserAddressUrl, formatBigNumber } from '@/utils'
import { SATORI_ADDRESS } from '@/const'
import { MiningPoolData, MiningPoolMixin } from '@/template/components/Mining/miningPoolMixin'
import { COMMON_EVENT, VUE_EVENT_BUS, WALLET_EVENT } from '@/event'
import * as _ from 'lodash'
import { currentChainConfig, chainConfigs } from '@/config/chain'

@Component({
  components: {
    McLoading,
    McNoData,
    PerpetualsViewer,
    McCountDown,
  },
})
export default class LiquidityMining extends Mixins(MiningPoolMixin) {
  private SATORI_ADDRESS: string = SATORI_ADDRESS
  private forumShow: boolean = false

  private formatBigNumber = formatBigNumber

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

  mounted() {}

  onConnectWallet() {
    VUE_EVENT_BUS.emit(WALLET_EVENT.ShowConnectWallet)
  }

  openAddressLink(address: string) {
    window.open(etherBrowserAddressUrl(address))
  }

  toLiquidityPoolPage(poolAddress: string) {
    this.$router.push({ name: 'poolInfo', params: { poolAddress: poolAddress } })
  }

  onAddLiquidity(poolAddress: string) {
    VUE_EVENT_BUS.emit(COMMON_EVENT.CHANGE_POOL_LIQUIDITY, poolAddress)
  }
}
</script>

<style scoped lang="scss">
@import 'mining';
.liquidity-mining {
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
      height: 317px;
      padding-bottom: 76px;
      margin-right: 24px;
      margin-top: 20px;

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


      &:nth-child(3n) {
        margin-right: 0;
      }

      .pool-info {
        position: relative;
        height: 241px;
        padding: 24px 24px 16px 24px;
        border-radius: 12px;
        z-index: 5;
        overflow: hidden;
        border: 1px solid;

        .info-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 26px;

          .left {
            display: flex;
            justify-content: center;
            align-items: center;

            .token-img {
              width: 40px;
              height: 40px;
              border-radius: 50%;
              margin-right: 8px;

              img {
                width: 40px;
                height: 40px;
              }
            }

            .title {
              font-size: 18px;
              line-height: 24px;
            }

            .promp {
              font-size: 12px;
              line-height: 16px;
              margin-top: 4px;
            }
          }

          .right {
            .APY-value {
              text-align: right;
              font-size: 18px;
              line-height: 24px;
              font-weight: bold;
              margin-bottom: 2px;

              .value {
                font-size: 26px;
                line-height: 24px;
              }

              .unit {
                margin-bottom: 2px;
                color: var(--mc-color-blue);
              }
            }

            .no-value {
              font-size: 26px;
              line-height: 24px;
              color: var(--mc-text-color);
            }

            .APY {
              font-size: 12px;
              line-height: 16px;
              text-align: right;
              display: flex;
              justify-content: flex-end;
              align-items: center;
            }
          }
        }

        .apy-line {
          display: flex;
          align-items: center;
          justify-content: space-between;

          .left {
            display: flex;
            align-items: flex-end;

            .primary-value {
              font-size: 24px;
              font-weight: 700;

              .value-uint {
                font-size: 18px;
              }
            }

            .secondary-value {
              font-size: 14px;
            }

            .value {
              display: flex;
              color: var(--mc-color-blue);
              align-items: flex-end;
            }

            .value-box {
              margin-right: 15px;
            }

            .label {
              display: flex;
              align-items: center;
              color: var(--mc-text-color);
              font-size: 14px;
              margin-top: 1px;
            }
          }

          .right {}
        }

        .split-line {
          margin: 24px 0 16px 0;
          background: var(--mc-border-color);
          width: 100%;
          height: 1px;
        }

        .info-box {
          display: flex;
          align-items: center;
          justify-content: space-around;

          .info-item {
            .value {
              line-height: 20px;
              font-size: 14px;
              color: var(--mc-text-color-white);
              display: flex;
              align-items: center;

              ::v-deep .el-image {
                margin-left: 4px;
                img {
                  height: 18px;
                  width: 18px;
                }
              }
            }

            .label {
              line-height: 20px;
              margin-top: 4px;
              font-size: 14px;
              color: var(--mc-text-color);
              display: flex;
              align-items: center;
            }
          }
        }
      }

      .pool-button {
        position: absolute;
        bottom: 0;
        height: 88px;
        width: 384px;
        padding: 28px 23px 16px;
        display: flex;
        justify-content: space-between;
        border-radius: 0 0 12px 12px;
        border: 1px solid;
        border-top: none;
        z-index: 4;
      }
    }

    .more-pool-box {
      position: relative;
      width: 384px;
      height: 278px;
      border-radius: 12px;
      border: 1px dashed;
      margin-top: 24px;

      .more-pool {
        margin: 72px auto auto;
        width: 336px;
        height: 186px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-direction: column;
        text-align: center;
        font-size: 14px;
        line-height: 20px;

        img {
          width: 80px;
          height: 80px;
          margin: 0 auto 8px;
          display: block;
        }

        .suggest-pool {
          z-index: 5;
          cursor: pointer;
          display: flex;
          align-items: center;

          i {
            transform: none;
            display: inline-block;
            transition: transform 0.2s;
            margin-left: 8px;
            font-size: 16px;
          }
        }

        .suggest-pool-transform {
          i {
            transform: rotate(0.5turn);
            display: inline-block
          }
        }
      }

      .forum {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        border-radius: 12px;
        backdrop-filter: none;
        z-index: 4;
        padding-top: 137px;
        padding-left: 111px;
        padding-right: 111px;
        transition:background 0.15s,padding-top 0.15s;

        .button {
          display: none;
        }
      }

      .forum-show {
        backdrop-filter: blur(36px);
        padding-top: 117px;

        .button {
          display: block;
        }
      }
    }
  }

  .button {
    width: 162px;
    height: 44px;
    border-radius: 12px;
    font-size: 16px;
    line-height: 24px;
  }

  .long-button {
    width: 336px;
  }

  .info {
    background: var(--mc-background-color);
  }

  .bg {
    position: absolute;
    width: 120px;
    height: 120px;
    left: 0;
    top: -60px;
    filter: blur(100px);
    z-index: -1;
    user-select: none;

    ::v-deep img {
      width: 120px;
      height: 120px;
    }
  }
  .disable {
    cursor: not-allowed;
    color: var(--mc-text-color) !important;
  }
}
</style>

<style lang="scss">
.apy-popover {
  .apy-box {
    font-size: 14px;
    border-radius: 12px;
    padding: 16px;
    word-break: keep-all;

    .apy-item {
      line-height: 20px;
      margin-bottom: 12px;
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
}
</style>

<style lang="scss">
.satori-fantasy {
  .apy-popover {
    .apy-box {
      color: var(--mc-text-color-white);
      background-color: var(--mc-background-color-darkest);
    }
  }
}
</style>


<style scoped lang="scss">
.satori-fantasy {
  .liquidity-mining {
    .table-container {
      .mining-pool {
        .pool-info {
          background-color: var(--mc-background-color-dark);
          border-color: var(--mc-border-color);

          .info-top {
            .left {
              .promp {
                color: var(--mc-text-color);
              }
            }

            .right {
              .APY-value {
                color: var(--mc-color-blue);
              }



              .APY {
                color: var(--mc-text-color);
              }
            }
          }

          .info-box {
            .title {
              color: var(--mc-text-color);
            }
          }
        }

        .pool-button {
          background-color: var(--mc-background-color-darkest);
          border-color: var(--mc-border-color);
        }
      }

      .more-pool-box {
        border-color: var(--mc-border-color);

        .more-pool {
          color: var(--mc-text-color);

          .suggest-pool {
            &:hover {
              color: var(--mc-text-color-white);
            }
          }
        }

        .forum {
          background: rgba(10, 16, 36, 0);

          .button {
            i {
              color: var(--mc-text-color-white);
            }
          }
        }

        .forum-show {
          background: rgba(10, 16, 36, 0.75);
        }
      }
    }
  }
}
</style>
