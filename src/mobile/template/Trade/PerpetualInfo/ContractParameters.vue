<template>
  <div class="contract-parameters">
    <div class="max-leverage flex-box">
      <span class="title">
        <McMTooltip>
          {{ $t('contractInfo.contractParams.maxLeverage') }}
          <template slot="content">
            <span v-html="$t('contractInfo.contractParams.maxLeveragePrompt')"></span>
          </template>
        </McMTooltip>
      </span>
      <span class="data">{{ maxLev }}x</span>
    </div>
    <div class="initial-margin-rate flex-box">
      <span class="title"
        >=
        <McMTooltip>
          {{ $t('contractInfo.contractParams.initialMarginRate') }}
          <template slot="content">
            <span v-html="$t('contractInfo.contractParams.initialMarginRatePrompt')"></span>
          </template>
        </McMTooltip>
      </span>
      <span class="value right">{{ initialMarginRate | bigNumberFormatter }}%</span>
    </div>
    <div class="normal flex-box">
      <span class="title">
        <McMTooltip>
          {{ $t('contractInfo.contractParams.defaultTargetLeverage') }}
          <template slot="content">
            <span v-html="$t('contractInfo.contractParams.defaultTargetLeveragePrompt')"></span>
          </template>
        </McMTooltip>
      </span>
      <span class="value">{{ defaultTargetLeverage }}x</span>
    </div>
    <div class="normal flex-box">
      <span class="title">
        <McMTooltip>
          {{ $t('contractInfo.contractParams.maintenanceMarginRate') }}
          <template slot="content">
            <span v-html="$t('contractInfo.contractParams.maintenanceMarginRatePrompt')"></span>
          </template>
        </McMTooltip>
      </span>
      <span class="value">{{ maintenanceMarginRate | bigNumberFormatter }}%</span>
    </div>
    <div class="normal flex-box">
      <span class="title">
        <McMTooltip>
          {{ $t('contractInfo.contractParams.liquidationPenaltyRate') }}
          <template slot="content">
            <span v-html="$t('contractInfo.contractParams.liquidationPenaltyRatePrompt')"></span>
          </template>
        </McMTooltip>
      </span>
      <span class="value" v-if="perpetualStorage"
        >{{ liquidationPenaltyRate.times(100) | bigNumberFormatter(3) }}%</span
      >
    </div>
    <div class="normal flex-box">
      <span class="title">
        <McMTooltip>
          {{ $t('contractInfo.contractParams.insuranceFundRate') }}
          <template slot="content">
            <span v-html="$t('contractInfo.contractParams.insuranceFundRatePrompt')"></span>
          </template>
        </McMTooltip>
      </span>
      <span class="value" v-if="perpetualStorage">
        {{ perpetualStorage.insuranceFundRate.times(100) | bigNumberFormatter }}%
      </span>
    </div>
    <div class="normal flex-box">
      <span class="title">
        <McMTooltip>
          {{ $t('contractInfo.contractParams.keeperGasReward') }}
          <template slot="content">
            <span v-html="$t('contractInfo.contractParams.keeperGasRewardPrompt')"></span>
          </template>
        </McMTooltip>
      </span>
      <span>
        <span class="value" v-if="perpetualStorage">{{
          perpetualStorage.keeperGasReward | bigNumberFormatterByPrecision(3)
        }}</span>
        <span v-if="perpetualProperty"> {{ perpetualProperty.collateralTokenSymbol }}</span>
      </span>
    </div>
    <div class="normal flex-box">
      <span class="title">
        <McMTooltip>
          {{ $t('contractInfo.contractParams.referrerRebateRate') }}
          <template slot="content">
            <span v-html="$t('contractInfo.contractParams.referrerRebatePrompt')"></span>
          </template>
        </McMTooltip>
      </span>
      <span class="value">{{ referralRebateRate | bigNumberFormatter }}%</span>
    </div>
    <div class="normal flex-box">
      <span class="title">
        <McMTooltip>
          {{ $t('contractInfo.contractParams.maxOpenInterestRate') }}
          <template slot="content">
            <span v-html="$t('contractInfo.contractParams.maxOpenInterestRatePrompt')"></span>
          </template>
        </McMTooltip>
      </span>
      <span class="value">{{ maxOpenInterestRate | bigNumberFormatter }}x</span>
    </div>
    <div class="total-trade-fee flex-box">
      <span class="title">{{ $t('contractInfo.contractParams.tradeFeeRate') }}</span>
      <span v-if="tradeFeeRate" class="value">{{ tradeFeeRate.times(100) | bigNumberFormatter(3) }} %</span>
    </div>
    <div class="vault-fee-rate flex-box">
      <span class="title">
        <McMTooltip>
          {{ $t('contractInfo.contractParams.vaultFeeRate') }}
          <template slot="content">
            <span v-html="$t('contractInfo.contractParams.vaultFeeRatePrompt')"></span>
          </template>
        </McMTooltip>
      </span>
      <span class="value" v-if="poolStorage">{{ poolStorage.vaultFeeRate.times(100) | bigNumberFormatter(3) }}%</span>
    </div>
    <div class="operator-fee-rate flex-box">
      <span class="title">
        <McMTooltip>
          {{ $t('contractInfo.contractParams.operatorFeeRate') }}
          <template slot="content">
            <span v-html="$t('contractInfo.contractParams.operatorFeeRatePrompt')"></span>
          </template>
        </McMTooltip>
      </span>
      <span class="value" v-if="perpetualStorage"
        >{{ perpetualStorage.operatorFeeRate.times(100) | bigNumberFormatter(3) }}%</span
      >
    </div>
    <div class="lp-fee-rate flex-box">
      <span class="title">
        <McMTooltip>
          {{ $t('contractInfo.contractParams.lpFeeRate') }}
          <template slot="content">
            <span v-html="$t('contractInfo.contractParams.lpFeeRatePrompt')"></span>
          </template>
        </McMTooltip>
      </span>
      <span class="value" v-if="perpetualStorage"
        >{{ perpetualStorage.lpFeeRate.times(100) | bigNumberFormatter(3) }}%</span
      >
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { _0, _1, LiquidityPoolStorage, PerpetualStorage } from '@mcdex/mai3.js'
import { PerpetualProperty } from '@/type'
import BigNumber from 'bignumber.js'
import { McMTooltip } from '@/mobile/components'

@Component({
  components: {
    McMTooltip,
  },
})
export default class ContractParameters extends Vue {
  @Prop({ default: () => null }) perpetualStorage!: PerpetualStorage | null
  @Prop({ default: () => null }) perpetualProperty!: PerpetualProperty | null
  @Prop({ default: () => null }) poolStorage!: LiquidityPoolStorage | null

  get initialMarginRate(): BigNumber {
    return this.perpetualStorage?.initialMarginRate.times(100) || _0
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

  get maxOpenInterestRate(): BigNumber {
    return this.perpetualStorage?.maxOpenInterestRate || _0
  }

  get defaultTargetLeverage(): BigNumber {
    return this.perpetualStorage?.defaultTargetLeverage.value || _0
  }

  get referralRebateRate(): BigNumber {
    return this.perpetualStorage?.referrerRebateRate.times(100) || _0
  }

  get maxLev() {
    return _1.div(this.initialMarginRate.div(100)).toFixed(0)
  }

  get maintenanceLeverage(): string {
    return new BigNumber(100).div(this.maintenanceMarginRate).toFixed(0) + 'x'
  }

  get tradeFeeRate(): BigNumber | null {
    if (!this.poolStorage || !this.perpetualStorage) {
      return null
    }
    return this.poolStorage.vaultFeeRate
      .plus(this.perpetualStorage.operatorFeeRate)
      .plus(this.perpetualStorage.lpFeeRate)
  }

  get liquidationPenaltyRate() {
    if (this.poolStorage) {
      return this.perpetualStorage?.liquidationPenaltyRate.plus(this.poolStorage.vaultFeeRate)
    }
  }
}
</script>

<style scoped lang="scss">
.contract-parameters {
  padding: 16px;

  .flex-box {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid #1A2136;

    span {
      font-size: 16px;
    }

    .title {
      color: var(--mc-text-color);
    }
  }

  .margin-rate {
    width: 100%;
    height: 70px;
    padding-top: 16px;

    .wrap {
      display: block;
      margin-top: 0;
      color: var(--mc-text-color);
      font-size: 14px;
    }

    .right {
      display: inline-block;
      width: 100%;
      text-align: right;
      margin-bottom: 4px;
    }

    .value {
      color: var(--mc-text-color-white);
    }
  }

  .max-leverage {
    margin-top: 10px;
    border-bottom: none;
    span {
      font-size: 16px;
    }
  }

  .initial-margin-rate {
    height: 50px;
    line-height: 50px;
    .title,
    .value {
      font-size: 14px;
    }
  }

  .normal {
    width: 100%;
    height: 50px;
    line-height: 50px;

    .value {
      color: var(--mc-text-color-white);
    }

    &:last-child {
      border-bottom: unset;
    }
  }

  .total-trade-fee {
    margin-top: 16px;
    border-bottom: 0;
  }

  .vault-fee-rate {
    @extend .total-trade-fee;

    span {
      font-size: 14px;
    }
  }

  .operator-fee-rate {
    margin-top: 8px;
    border-bottom: 0;

    span {
      font-size: 14px;
    }
  }

  .lp-fee-rate {
    @extend .operator-fee-rate;
    height: 32px;
    border-bottom: 1px solid var(--mc-border-color);
  }

  ::v-deep {
    div.van-skeleton__row {
      width: 100% !important;
      height: 45px;
    }
  }
}
</style>
