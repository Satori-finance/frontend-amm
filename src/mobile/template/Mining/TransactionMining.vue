<template>
  <div class="transaction-mining">
    <div class="rewards-card">
      <div class="mining-rewards">
        <div class="value-box">
          <div class="left">
            <div class="value">{{ miningData.refundRate.times(100) | bigNumberFormatter(0) }}%</div>
            <div class="text">
              {{ $t('dao.miningRebateRate') }}
              <McMTooltip placement="top">
                <div slot="content"><span v-html="$t('dao.miningRebateRatePrompt')"></span></div>
                <div class="tooltip-box">
                  <svg class="svg-icon" aria-hidden="true">
                    <use :xlink:href="`#icon-help`"></use>
                  </svg>
                </div>
              </McMTooltip>
            </div>
          </div>
          <div class="right">
            <div class="value">
              <div>{{ miningData.remainingBudget | bigNumberFormatter }}</div>
              <van-image class="token-img token-mcb" :src="mcbImg">
                <div slot="error" class="image-slot">
                  <img src="@/assets/img/tokens/Unknow.svg" alt="">
                </div>
              </van-image>
            </div>
            <div class="text">
              {{ $t('dao.remainingBudget') }}
              <McMTooltip placement="top">
                <div slot="content"><span v-html="$t('dao.remainingBudgetPrompt')"></span></div>
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
              <div v-if="!nowOnline">0</div>
              <div v-else>{{ miningData.miningReward24h | bigNumberFormatter }}</div>
              <van-image class="token-img token-mcb" :src="mcbImg">
                <div slot="error" class="image-slot">
                  <img src="@/assets/img/tokens/Unknow.svg" alt="">
                </div>
              </van-image>
            </div>
            <div class="text">
              {{ $t('dao.totalRewards') }}
              <McMTooltip placement="top">
                <div slot="content"><span v-html="totalRewardsPromptToolTipText"></span></div>
                <div class="tooltip-box">
                  <svg class="svg-icon" aria-hidden="true">
                    <use :xlink:href="`#icon-help`"></use>
                  </svg>
                </div>
              </McMTooltip>
            </div>
          </div>
          <div class="right">
            <div class="value">
              <div v-if="!nowOnline">0</div>
              <div v-else>{{ miningData.paid | bigNumberFormatter }} / {{
                  miningData.unpaid | bigNumberFormatter
                }}
              </div>
              <van-image class="token-img token-mcb" :src="mcbImg">
                <div slot="error" class="image-slot">
                  <img src="@/assets/img/tokens/Unknow.svg" alt="">
                </div>
              </van-image>
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
        <tbody v-if="nowOnline && !noData">
        <tr v-for="(item, index) in tableBody">
          <th>
            <div class="flex-box">
              <van-image class="token-img" :src="item.collateral | tokenIconUrlFormatter">
                <div slot="error" class="image-slot">
                  <img src="@/assets/img/tokens/Unknow.svg" alt="">
                </div>
              </van-image>
              <div>{{ item.collateral }} {{ $t('base.pool') }}</div>
            </div>
          </th>
          <th>
            <div class="flex-box">
              <MPerpetualsImgViewer :collateral="item.collateral"
                                    :per-row-count="3"
                                    :perpetuals="item.perpetuals || []"/>
              <div><i class="iconfont icon-right2"></i></div>
            </div>
          </th>
        </tr>
        </tbody>
        <tbody v-else>
        <tr class="empty-container">
          <th colspan="2">
            <McMNoData/>
          </th>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { TransactionMiningMixin } from '@/template/components/Mining/transactionMiningMixin'
import { ROUTE } from '@/mobile/router'
import { McMNoData, McMTooltip } from '@/mobile/components'
import { MPerpetualsImgViewer } from '@/mobile/business-components'

@Component({
  components: {
    McMTooltip,
    MPerpetualsImgViewer,
    McMNoData,
  },
})
export default class TransactionMining extends Mixins(TransactionMiningMixin) {
  private nowOnline: boolean = true
  private mcbImg = require('@/assets/img/tokens/SATORI.svg')

  private goDetail() {
    if(!this.nowOnline) {
      return
    }
    this.$router.push({ name: ROUTE.TRANSACTION_MINING })
  }
}
</script>

<style scoped lang="scss">
.transaction-mining {
  color: var(--mc-text-color);
  font-size: 14px;
  line-height: 20px;

  .rewards-card {
    width: 100%;
    height: 290px;
    padding: 23px;
    border: 1px solid;
    border-radius: 12px;
    margin-right: 24px;
    background-color: var(--mc-background-color-dark);
    border-color: var(--mc-border-color);

    .value-box {
      height: 48px;
      display: flex;

      .left {
        margin-right: 16px;
      }

      .value {
        font-size: 20px;
        line-height: 24px;
        display: flex;
        align-items: center;
        margin-bottom: 4px;
        color: var(--mc-text-color-white);

        .token-img {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          margin-left: 4px;

          img {
            width: 22px;
            height: 22px;
          }
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
      border-top-color: var(--mc-border-color);
    }

    .transaction-fee {
      padding: 24px 0;
    }

    .mining-rewards {
      padding-bottom: 24px;
      border-bottom: 1px solid;
      border-bottom-color: var(--mc-border-color);
    }
  }

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

  .table-container {
    width: 100%;
    min-height: 195px;
    border: 1px solid;
    border-radius: 12px;
    overflow: hidden;
    border-color: var(--mc-border-color);
    background-color: var(--mc-background-color-dark);
    margin-top: 16px;

    table {
      width: 100%;
      border-collapse: collapse;

      tr {
        height: 50px;
        border-bottom: 1px solid;
        border-bottom-color: var(--mc-border-color);

        th {
          text-align: left;
          font-weight: normal;
          padding-left: 16px;

          &:nth-child(1) {
            width: 171px;
          }

          .flex-box {
            display: flex;
            align-items: center;
            color: var(--mc-text-color-white);

            .icon-right2 {
              color: var(--mc-text-color-dark);
              font-size: 16px;
              margin-left: 4.5px;
            }

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

      thead {
        background-color: var(--mc-background-color-darkest);
        color: var(--mc-text-color);
      }

      tbody {
        th {
          height: 72px;
        }
      }
    }

    .empty-container {
      border-bottom: unset;

      th {
        padding-left: 0;
        padding-top: 10px;
      }
    }
  }
}
</style>
