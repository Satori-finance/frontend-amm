<template>
  <div class="perpetual-params">
    <span class="head-title">{{ $t('pool.poolInfo.perpetualParams') }}</span>
    <div class="table-container">
      <table class="mc-data-table mc-data-table--border is-medium">
        <tbody>
          <tr>
            <td>
              <el-tooltip placement="top" :open-delay="400">
                <div slot="content" v-html="$t('contractInfo.contractParams.maxLeveragePrompt')"></div>
                <span>{{ $t('contractInfo.contractParams.maxLeverage') }}</span>
              </el-tooltip>
            </td>
            <td>
              <span class="value" v-if="perpetualStorage">{{ maxLev }}x</span>
            </td>
            <td>
              <span class="title">
                <span class="value">=</span>
                <el-tooltip placement="top" :open-delay="400">
                  <div slot="content" v-html="$t('contractInfo.contractParams.initialMarginRatePrompt')"></div>
                  <span>{{ $t('contractInfo.contractParams.initialMarginRate') }}</span>
                </el-tooltip>
              </span>
              <span class="value">{{ initialMarginRate | bigNumberFormatter }}%</span>
            </td>
          </tr>
          <tr>
            <td>
              <el-tooltip placement="top" :open-delay="400">
                <div slot="content" v-html="$t('contractInfo.contractParams.defaultTargetLeveragePrompt')"></div>
                <span>{{ $t('contractInfo.contractParams.defaultTargetLeverage') }}</span>
              </el-tooltip>
            </td>
            <td>
              <span class="value" v-if="perpetualStorage">{{ defaultTargetLev }}x</span>
            </td>
            <td></td>
          </tr>
          <tr>
            <td>
              <el-tooltip placement="top" :open-delay="400">
                <div slot="content" v-html="$t('contractInfo.contractParams.maintenanceMarginRatePrompt')"></div>
                <span>{{ $t('contractInfo.contractParams.maintenanceMarginRate') }}</span>
              </el-tooltip>
            </td>
            <td>
              <span class="value">{{ maintenanceMarginRate | bigNumberFormatter }}%</span>
            </td>
            <td></td>
          </tr>
          <tr>
            <td>
              <el-tooltip placement="top" :open-delay="400">
                <div slot="content" v-html="$t('contractInfo.contractParams.liquidationPenaltyRatePrompt')"></div>
                <span>{{ $t('contractInfo.contractParams.liquidationPenaltyRate') }}</span>
              </el-tooltip>
            </td>
            <td>
              <span class="value" v-if="perpetualStorage"
                >{{ liquidationPenaltyRate.times(100) | bigNumberFormatter(3) }}%</span
              >
            </td>
            <td></td>
          </tr>
          <tr>
            <td>
              <el-tooltip placement="top" :open-delay="400">
                <div slot="content" v-html="$t('contractInfo.contractParams.insuranceFundRatePrompt')"></div>
                <span>{{ $t('contractInfo.contractParams.insuranceFundRate') }}</span>
              </el-tooltip>
            </td>
            <td>
              <span class="value" v-if="perpetualStorage"
                >{{ perpetualStorage.insuranceFundRate.times(100) | bigNumberFormatter }}%</span
              >
            </td>
            <td></td>
          </tr>
          <tr>
            <td>
              <el-tooltip placement="top" :open-delay="400">
                <div slot="content" v-html="$t('contractInfo.contractParams.keeperGasRewardPrompt')"></div>
                <span>{{ $t('contractInfo.contractParams.keeperGasReward') }}</span>
              </el-tooltip>
            </td>
            <td>
              <span class="value" v-if="perpetualStorage">{{
                perpetualStorage.keeperGasReward | bigNumberFormatterByPrecision(3)
              }}</span>
              <span class="value" v-if="perpetualProperty"> {{ perpetualProperty.collateralTokenSymbol }}</span>
            </td>
            <td></td>
          </tr>
          <tr>
            <td>
              <el-tooltip placement="top" :open-delay="400">
                <div slot="content" v-html="$t('contractInfo.contractParams.referrerRebatePrompt')"></div>
                <span>{{ $t('contractInfo.contractParams.referrerRebateRate') }}</span>
              </el-tooltip>
            </td>
            <td>
              <span class="value" v-if="perpetualStorage"
                >{{ perpetualStorage.referrerRebateRate.times(100) | bigNumberFormatter }}%</span
              >
            </td>
            <td></td>
          </tr>
          <tr>
            <td>
              <el-tooltip placement="top" :open-delay="400">
                <div slot="content" v-html="$t('contractInfo.contractParams.maxOpenInterestRatePrompt')"></div>
                <span>{{ $t('contractInfo.contractParams.maxOpenInterestRate') }}</span>
              </el-tooltip>
            </td>
            <td>
              <span class="value" v-if="perpetualStorage"
                >{{ perpetualStorage.maxOpenInterestRate | bigNumberFormatter(1) }}x</span
              >
            </td>
            <td></td>
          </tr>
          <tr>
            <td>
              <el-tooltip placement="top" :open-delay="400">
                <div slot="content" v-html="$t('contractInfo.contractParams.vaultFeeRatePrompt')"></div>
                <span>{{ $t('contractInfo.contractParams.vaultFeeRate') }}</span>
              </el-tooltip>
            </td>
            <td>
              <span class="value" v-if="poolStorage"
                >{{ poolStorage.vaultFeeRate.times(100) | bigNumberFormatter(3) }}%</span
              >
            </td>
            <td rowspan="3" class="border-cell">
              <div v-if="tradeFeeRate" class="trade-fee-value">
                <p class="value">{{ tradeFeeRate.times(100) | bigNumberFormatter(3) }} %</p>
                <p>{{ $t('contractInfo.contractParams.tradeFeeRate') }}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <el-tooltip placement="top" :open-delay="400">
                <div slot="content" v-html="$t('contractInfo.contractParams.operatorFeeRatePrompt')"></div>
                <span>{{ $t('contractInfo.contractParams.operatorFeeRate') }}</span>
              </el-tooltip>
            </td>
            <td>
              <span class="value" v-if="perpetualStorage && poolHasOperator"
                >{{ perpetualStorage.operatorFeeRate.times(100) | bigNumberFormatter(3) }}%</span
              >
              <span class="value" v-else>0.000%</span>
            </td>
          </tr>
          <tr>
            <td>
              <el-tooltip placement="top" :open-delay="400">
                <div slot="content" v-html="$t('contractInfo.contractParams.lpFeeRatePrompt')"></div>
                <span>{{ $t('contractInfo.contractParams.lpFeeRate') }}</span>
              </el-tooltip>
            </td>
            <td>
              <span class="value" v-if="perpetualStorage"
                >{{ perpetualStorage.lpFeeRate.times(100) | bigNumberFormatter(3) }}%</span
              >
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { McLoading } from '@/components'
import { _0, _1, LiquidityPoolStorage, PerpetualStorage } from '@mcdex/mai3.js'
import { PerpetualProperty } from '@/type'
import BigNumber from 'bignumber.js'
import { EMPTY_ADDRESS } from '@/constants';

@Component({
  components: {
    McLoading,
  },
})
export default class PerpetualParams extends Vue {
  @Prop({ default: () => null }) perpetualStorage!: PerpetualStorage | null
  @Prop({ default: () => null }) perpetualProperty!: PerpetualProperty | null
  @Prop({ default: () => null }) poolStorage!: LiquidityPoolStorage | null

  get initialMarginRate(): BigNumber {
    return this.perpetualStorage?.initialMarginRate.times(100) || _0
  }

  get poolHasOperator(): boolean {
    if (!this.poolStorage) {
      return true
    }
    return this.poolStorage.operator.toLowerCase() !== EMPTY_ADDRESS
  }

  get initialLeverage(): string {
    if (this.initialMarginRate.isZero()) {
      return ''
    }
    return new BigNumber(100).div(this.initialMarginRate).toFixed(0) + 'x'
  }

  get maintenanceMarginRate(): BigNumber {
    return this.perpetualStorage?.maintenanceMarginRate.times(100) || _0
  }

  get maintenanceLeverage(): string {
    return new BigNumber(100).div(this.maintenanceMarginRate).toFixed(0) + 'x'
  }

  get tradeFeeRate(): BigNumber | null {
    if (!this.poolStorage || !this.perpetualStorage) {
      return null
    }
    let fee = this.poolStorage.vaultFeeRate.plus(this.perpetualStorage.lpFeeRate)
    if (this.poolHasOperator) {
      fee = fee.plus(this.perpetualStorage.operatorFeeRate)
    }
    return fee
  }

  get liquidationPenaltyRate() {
    if (this.poolStorage) {
      return this.perpetualStorage?.liquidationPenaltyRate.plus(this.poolStorage.vaultFeeRate)
    }
  }

  get maxLev() {
    return _1.div(this.initialMarginRate.div(100)).toFixed(0)
  }

  get defaultTargetLev() {
    return this.perpetualStorage?.defaultTargetLeverage.value
  }
}
</script>

<style scoped lang="scss">
@import '../info.scss';

.table-container {
  table {
    tr {
      font-size: 14px;
      font-weight: 400;
      line-height: 20px;

      td {
        padding: 0 10px;
        color: var(--mc-text-color);
        height: 48px;
      }
    }

    tr:nth-of-type(2),
    tr:nth-of-type(3) {
      td {
        padding: 6px 10px;
      }
    }

    .flex-cell {
      display: inline-flex;
      min-width: 140px;
      width: 100%;
      align-items: center;
      justify-content: space-between;
    }
  }

  .title {
    margin-right: 15px;
  }

  .value {
    color: white;
  }

  .trade-fee-value {
    text-align: center;
    line-height: 24px;
  }
}
</style>
