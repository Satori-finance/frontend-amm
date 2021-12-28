<template>
  <div class="transaction-mining">
    <div class="panel-item-header">
      <div class="title-box">
        <div class="title">
          {{ $t('dao.tradingMining') }}
          <span v-if="!isStartMining">
            ({{ $t('dao.startIn') }} <McCountDown :show-day="false" :end-timestamp="startMiningTimestamp"/>)
          </span>
        </div>
        <div class="promp">{{ $t('dao.tradingMiningPromp') }}<a class="mining-learn"
          href="https://mcdex.medium.com/trading-mining-program-round-1-6e1520eee510" target="_blank">{{ $t('base.learnMore') }}</a>
        </div>
      </div>
      <a class="mining-link" :href="$t('base.transactionMiningTutorial')" target="_blank">
        <i class="iconfont icon-details-bold mc-icon-btn"></i>
        <span>{{ $t('dao.miningTutorial') }}</span></a>
    </div>
    <McLoading :show-loading="loading" :min-show-time="500" :hideContent="true">
      <div class="transaction-mining-box">
        <div class="rewards-card">
          <div class="mining-rewards">
            <div class="value-box">
              <div class="left">
                <div class="value blue-color">{{ miningData.refundRate.times(100) | bigNumberFormatter(0) }}%</div>
                <div class="text">
                  {{ $t('dao.miningRebateRate') }}
                  <el-tooltip placement="top">
                    <div slot="content"><span v-html="$t('dao.miningRebateRatePrompt')"></span></div>
                    <div class="tooltip-box">
                      <svg class="svg-icon" aria-hidden="true">
                        <use :xlink:href="`#icon-help`"></use>
                      </svg>
                    </div>
                  </el-tooltip>
                </div>
              </div>
              <div class="right">
                <div class="value">
                  <div>{{ miningData.remainingBudget | bigNumberFormatter }}</div>
                  <el-image class="token-img token-mcb" :src="mcbImg">
                    <div slot="error" class="image-slot">
                      <img src="@/assets/img/tokens/Unknow.svg" alt="">
                    </div>
                  </el-image>
                </div>
                <div class="text">
                  {{ $t('dao.remainingBudget') }}
                  <el-tooltip placement="top">
                    <div slot="content"><span v-html="$t('dao.remainingBudgetPrompt')"></span></div>
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

          <div class="transaction-fee">
            <div class="value-box">
              <div class="left">
                <div class="value">${{ miningData.miningFee24h | bigNumberFormatter }}</div>
                <div class="text">
                  {{ $t('dao.yourTransactionFee24h') }}
                </div>
              </div>
            </div>
          </div>

          <div class="rewards-24H">
            <div class="value-box">
              <div class="left">
                <div class="value">
                  <div>{{ miningData.miningReward24h | bigNumberFormatter }}</div>
                  <el-image class="token-img token-mcb" :src="mcbImg">
                    <div slot="error" class="image-slot">
                      <img src="@/assets/img/tokens/Unknow.svg" alt="">
                    </div>
                  </el-image>
                </div>
                <div class="text">
                  {{ $t('dao.totalRewards') }}
                  <el-tooltip placement="top">
                    <div slot="content"><span v-html="totalRewardsPromptToolTipText"></span></div>
                    <div class="tooltip-box">
                      <svg class="svg-icon" aria-hidden="true">
                        <use :xlink:href="`#icon-help`"></use>
                      </svg>
                    </div>
                  </el-tooltip>
                </div>
              </div>
              <div class="right">
                <div class="value">
                  <div>{{ miningData.paid | bigNumberFormatterTruncateByPrecision(6, 2, 2) }} / {{
                      miningData.unpaid | bigNumberFormatterTruncateByPrecision(6, 2, 2)
                    }}
                  </div>
                  <el-image class="token-img token-mcb" :src="mcbImg">
                    <div slot="error" class="image-slot">
                      <img src="@/assets/img/tokens/Unknow.svg" alt="">
                    </div>
                  </el-image>
                </div>
                <div class="text">{{ $t('base.paid') }} / {{ $t('base.unpaid') }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
            <tr>
              <th>{{ $t('pool.poolList.poolName') }}</th>
              <th>{{ $t('pool.poolList.perpetualContracts') }}</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(item, index) in tableBody">
              <th>
                <div class="flex-box">
                  <el-image class="token-img" :src="item.collateral | tokenIconUrlFormatter">
                    <div slot="error" class="image-slot">
                      <img src="@/assets/img/tokens/Unknow.svg" alt="">
                    </div>
                  </el-image>
                  <div>{{ item.collateral }} {{ $t('base.pool') }}</div>
                </div>
              </th>
              <th>
                <PerpetualsImgViewer :collateral="item.collateral"
                                     :per-row-count="4"
                                     :perpetuals="item.perpetuals || []"/>
              </th>
            </tr>
            </tbody>
          </table>

          <div v-if="false" class="coming-soon">
            <img src="@/assets/img/poolComingSoon.svg" alt=""/>
            <div>{{ $t('dao.poolsComingSoon') }}</div>
          </div>
        </div>
      </div>
    </McLoading>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { McLoading, McNoData, PerpetualsImgViewer, McCountDown } from '@/components'
import { TransactionMiningMixin } from '@/template/components/Mining/transactionMiningMixin'

@Component({
  components: {
    McLoading,
    McNoData,
    PerpetualsImgViewer,
    McCountDown,
  },
})
export default class TransactionMining extends Mixins(TransactionMiningMixin) {
  private mcbImg = require('@/assets/img/tokens/SATORI.svg')

  // TODO: start after delete
  protected startMiningTimestamp = 1631797200

  get isStartMining(): boolean {
    const nowTimestamp = Date.now() / 1000
    return nowTimestamp >= this.startMiningTimestamp
  }

  get noData(): boolean {
    return false
  }
}
</script>

<style scoped lang="scss">
@import 'mining';

.transaction-mining {
  .transaction-mining-box {
    display: flex;
    font-size: 14px;
    line-height: 20px;
    align-items: flex-start;

    .rewards-card {
      width: 384px;
      height: 290px;
      padding: 23px;
      border: 1px solid;
      border-radius: 12px;
      margin-right: 24px;

      .value-box {
        height: 48px;
        display: flex;

        .left {
          margin-right: 16px;
        }

        .right {
          padding-left: 16px;
          border-left: 1px solid;
        }

        .value {
          font-size: 20px;
          line-height: 24px;
          display: flex;
          align-items: center;
          margin-bottom: 4px;

          .token-img {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            margin-left: 4px;
          }
        }

        .text {
          display: flex;
          align-items: center;

        }
      }

      .rewards-24H {
        width: 100%;
        padding-top: 24px;
        border-top: 1px solid;
      }

      .transaction-fee {
        padding: 24px 0;
      }

      .mining-rewards {
        padding-bottom: 24px;
        border-bottom: 1px solid;
      }
    }

    .table-container {
      width: 792px;
      min-height: 290px;
      border: 1px solid;
      border-radius: 12px;
      overflow: hidden;

      table {
        width: 100%;
        border-collapse: collapse;

        tr {
          height: 50px;
          border-bottom: 1px solid;

          th {
            text-align: left;
            font-weight: normal;
            padding-left: 16px;

            &:nth-child(1) {
              width: 216px;
            }

            .flex-box {
              display: flex;
              align-items: center;

              .token-img {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                margin-right: 8px;

                ::v-deep img {
                  width: 32px;
                  height: 32px;
                }
              }
            }
          }
        }

        tbody {
          th {
            height: 72px;
          }
        }
      }

      .coming-soon {
        width: 792px;
        height: 235px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        img {
          margin-bottom: 8px;
        }
      }
    }

    .blue-color {
      color: var(--mc-color-blue) !important;
      font-weight: 700;
    }
  }
}
</style>

<style scoped lang="scss">
.satori-fantasy {
  .transaction-mining {
    .transaction-mining-box {
      color: var(--mc-text-color);

      .rewards-card {
        background-color: var(--mc-background-color-dark);
        border-color: var(--mc-border-color);

        .value-box {
          .right {
            border-left-color: var(--mc-border-color);
          }

          .value {
            color: var(--mc-text-color-white);
          }
        }

        .rewards-24H {
          border-top-color: var(--mc-border-color);
        }

        .mining-rewards {
          border-bottom-color: var(--mc-border-color);
        }
      }

      .table-container {
        border-color: var(--mc-border-color);
        background-color: var(--mc-background-color-dark);

        table {
          thead {
            background-color: var(--mc-background-color-darkest);
            color: var(--mc-text-color);
          }

          tr {
            border-bottom-color: var(--mc-border-color);

            th {
              .flex-box {
                color: var(--mc-text-color-white);
              }
            }
          }
        }
      }
    }
  }
}
</style>

<style scoped lang="scss">
.satori-fantasy {
  .mc-count-down {
    font-size: 24px;
  }
}
</style>
