<template>
  <div class="perpetual-params">
    <div class="head-box">
      <span class="head-title">{{ $t('pool.poolInfo.AMMRiskParams') }}</span>
      <span class="right">
        <el-button v-if="isOperator" size="mini" type="secondary" @click="modify">{{ $t('base.modify') }}</el-button>
      </span>
    </div>
    <div class="table-container">
      <table class="mc-data-table mc-data-table--border is-medium">
        <tbody>
          <tr>
            <td>{{ $t('contractInfo.riskParams.halfSpread') }}</td>
            <td>
              <span class="current">{{ form.halfSpread }} %</span>
            </td>
            <td>
              <div class="value-bar">
                <span>{{ $t('base.min') }}</span>
                <span class="value">{{ form.minHalfSpread }} %</span>
                <el-progress
                  :percentage="getPercentage(form.minHalfSpread, form.maxHalfSpread, form.halfSpread)"
                  :show-text="false"
                ></el-progress>
                <span>{{ $t('base.max') }}</span>
                <span class="value">{{ form.maxHalfSpread }} %</span>
              </div>
            </td>
          </tr>
          <tr>
            <td><span v-html="$t('contractInfo.riskParams.openSlippage')"></span></td>
            <td>
              <span class="current">{{ form.openSlippage }}</span>
            </td>
            <td>
              <div class="value-bar">
                <span>{{ $t('base.min') }}</span>
                <span class="value">{{ form.minOpenSlippage }}</span>
                <el-progress
                  :percentage="getPercentage(form.minOpenSlippage, form.maxOpenSlippage, form.openSlippage)"
                  :show-text="false"
                ></el-progress>
                <span>{{ $t('base.max') }}</span>
                <span class="value">{{ form.maxOpenSlippage }}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td><span v-html="$t('contractInfo.riskParams.closeSlippage')"></span></td>
            <td>
              <span class="current">{{ form.closeSlippage }}</span>
            </td>
            <td>
              <div class="value-bar">
                <span>{{ $t('base.min') }}</span>
                <span class="value">{{ form.minCloseSlippage }}</span>
                <el-progress
                  :percentage="getPercentage(form.minCloseSlippage, form.maxCloseSlippage, form.closeSlippage)"
                  :show-text="false"
                ></el-progress>
                <span>{{ $t('base.max') }}</span>
                <span class="value">{{ form.maxCloseSlippage }}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td>{{ $t('contractInfo.riskParams.fundingRateFactor') }}</td>
            <td>
              <span class="current">{{ form.fundingRateFactor }} %</span>
            </td>
            <td>
              <div class="value-bar">
                <span>{{ $t('base.min') }}</span>
                <span class="value">{{ form.minFundingRateFactor }} %</span>
                <el-progress
                  :percentage="
                    getPercentage(form.minFundingRateFactor, form.maxFundingRateFactor, form.fundingRateFactor)
                  "
                  :show-text="false"
                ></el-progress>
                <span>{{ $t('base.max') }}</span>
                <span class="value">{{ form.maxFundingRateFactor }} %</span>
              </div>
            </td>
          </tr>
          <tr>
            <td>{{ $t('contractInfo.riskParams.fundingRateLimit') }}</td>
            <td>
              <span class="current">{{ form.fundingRateLimit }} %</span>
            </td>
            <td>
              <div class="value-bar">
                <span>{{ $t('base.min') }}</span>
                <span class="value">{{ form.minFundingRateLimit }} %</span>
                <el-progress
                  :percentage="getPercentage(form.minFundingRateLimit, form.maxFundingRateLimit, form.fundingRateLimit)"
                  :show-text="false"
                ></el-progress>
                <span>{{ $t('base.max') }}</span>
                <span class="value">{{ form.maxFundingRateLimit }} %</span>
              </div>
            </td>
          </tr>
          <tr>
            <td>{{ $t('contractInfo.riskParams.ammMaxLeverage') }}</td>
            <td>
              <span class="current">{{ form.ammMaxLeverage }}</span>
            </td>
            <td>
              <div class="value-bar">
                <span>{{ $t('base.min') }}</span>
                <span class="value">{{ form.minAMMMaxLeverage }}</span>
                <el-progress
                  :percentage="getPercentage(form.minAMMMaxLeverage, form.maxAMMMaxLeverage, form.ammMaxLeverage)"
                  :show-text="false"
                ></el-progress>
                <span>{{ $t('base.max') }}</span>
                <span class="value">{{ form.maxAMMMaxLeverage }}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td>{{ $t('contractInfo.riskParams.closePriceDiscount') }}</td>
            <td>
              <span class="current">{{ form.closePriceDiscount }} %</span>
            </td>
            <td>
              <div class="value-bar">
                <span>{{ $t('base.min') }}</span>
                <span class="value">{{ form.minClosePriceDiscount }} %</span>
                <el-progress
                  :percentage="
                    getPercentage(form.minClosePriceDiscount, form.maxClosePriceDiscount, form.closePriceDiscount)
                  "
                  :show-text="false"
                ></el-progress>
                <span>{{ $t('base.max') }}</span>
                <span class="value">{{ form.maxClosePriceDiscount }} %</span>
              </div>
            </td>
          </tr>
          <tr>
            <td><span v-html="$t('contractInfo.riskParams.baseFundingRate')"></span></td>
            <td>
              <span class="current">{{ form.baseFundingRate }} %</span>
            </td>
            <td>
              <div class="value-bar">
                <span>{{ $t('base.min') }}</span>
                <span class="value">{{ form.minBaseFundingRate }} %</span>
                <el-progress
                  :percentage="
                    getPercentage(form.minBaseFundingRate, form.maxBaseFundingRate, form.baseFundingRate)
                  "
                  :show-text="false"
                ></el-progress>
                <span>{{ $t('base.max') }}</span>
                <span class="value">{{ form.maxBaseFundingRate }} %</span>
              </div>
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
import { _0, LiquidityPoolStorage, PerpetualState, PerpetualStorage } from '@mcdex/mai3.js'
import BigNumber from 'bignumber.js'
import { namespace } from 'vuex-class'
import { Provider } from '@ethersproject/providers'

const wallet = namespace('wallet')

@Component({
  components: {
    McLoading,
  },
})
export default class PerpetualRiskParams extends Vue {
  @wallet.Getter('signer') provider!: Provider
  @wallet.Getter('address') address!: string | null
  @Prop({ default: () => null }) perpetualStorage!: PerpetualStorage | null
  @Prop({ default: () => null }) poolStorage!: LiquidityPoolStorage | null

  get form() {
    return {
      halfSpread: this.perpetualStorage?.halfSpread.value.times(100).toFixed() || '',
      minHalfSpread: this.perpetualStorage?.halfSpread.minValue.times(100).toFixed() || '',
      maxHalfSpread: this.perpetualStorage?.halfSpread.maxValue.times(100).toFixed() || '',
      openSlippage: this.perpetualStorage?.openSlippageFactor.value.toFixed() || '',
      minOpenSlippage: this.perpetualStorage?.openSlippageFactor.minValue.toFixed() || '',
      maxOpenSlippage: this.perpetualStorage?.openSlippageFactor.maxValue.toFixed() || '',
      closeSlippage: this.perpetualStorage?.closeSlippageFactor.value.toFixed() || '',
      minCloseSlippage: this.perpetualStorage?.closeSlippageFactor.minValue.toFixed() || '',
      maxCloseSlippage: this.perpetualStorage?.closeSlippageFactor.maxValue.toFixed() || '',
      fundingRateFactor: this.perpetualStorage?.fundingRateFactor.value.times(100).toFixed() || '',
      minFundingRateFactor: this.perpetualStorage?.fundingRateFactor.minValue.times(100).toFixed() || '',
      maxFundingRateFactor: this.perpetualStorage?.fundingRateFactor.maxValue.times(100).toFixed() || '',
      fundingRateLimit: this.perpetualStorage?.fundingRateLimit.value.times(100).toFixed() || '',
      minFundingRateLimit: this.perpetualStorage?.fundingRateLimit.minValue.times(100).toFixed() || '',
      maxFundingRateLimit: this.perpetualStorage?.fundingRateLimit.maxValue.times(100).toFixed() || '',
      ammMaxLeverage: this.perpetualStorage?.ammMaxLeverage.value.toFixed() || '',
      minAMMMaxLeverage: this.perpetualStorage?.ammMaxLeverage.minValue.toFixed(1) || '',
      maxAMMMaxLeverage: this.perpetualStorage?.ammMaxLeverage.maxValue.toFixed(1) || '',
      closePriceDiscount: this.perpetualStorage?.maxClosePriceDiscount.value.times(100).toFixed() || '',
      minClosePriceDiscount: this.perpetualStorage?.maxClosePriceDiscount.minValue.times(100).toFixed() || '',
      maxClosePriceDiscount: this.perpetualStorage?.maxClosePriceDiscount.maxValue.times(100).toFixed() || '',
      baseFundingRate: this.perpetualStorage?.baseFundingRate.value.times(100).toFixed() || '',
      minBaseFundingRate: this.perpetualStorage?.baseFundingRate.minValue.times(100).toFixed() || '',
      maxBaseFundingRate: this.perpetualStorage?.baseFundingRate.maxValue.times(100).toFixed() || '',
    }
  }

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

  get maintenanceLeverage(): string {
    return new BigNumber(100).div(this.maintenanceMarginRate).toFixed(0) + 'x'
  }

  get isOperator() {
    return this.address && this.address?.toLowerCase() === this.poolStorage?.operator.toLowerCase()
  }

  get isClearOrEmergency(): boolean {
    return this.perpetualStorage?.state === PerpetualState.CLEARED || this.perpetualStorage?.state === PerpetualState.EMERGENCY
  }

  private getPercentage(min: string, max: string, value: string): number {
    const minValue = new BigNumber(min)
    const maxValue = new BigNumber(max)
    const currentValue = new BigNumber(value)
    const result = currentValue.minus(minValue).times(100).div(maxValue.minus(minValue))
    return result.isNaN() ? 0 : BigNumber.min(BigNumber.max(0, result), 100).toNumber()
  }

  private modify() {
    if (this.isClearOrEmergency) {
      this.$message({ message: this.$t('pool.poolInfo.poolInfoTable.modifyPrompt').toString(), iconClass: 'el-message__icon iconfont icon-warning' })
    } else {
      const { poolAddress, symbol } = this.$route.params
      this.$router.push({ name: 'poolPerpetualInfoModify', params: { poolAddress, symbol } })
    }
  }
}
</script>

<style scoped lang="scss">
@import '../info.scss';

.head-box {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  .right {
    ::v-deep .el-button {
      width: 121px;
    }
  }
}

.table-container {
  table {
    tr {
      font-size: 14px;
      font-weight: 400;
      line-height: 20px;

      td {
        padding: 0 10px;
        color: var(--mc-text-color);
        height: 66px;
      }
    }
  }

  .current {
    color: white;
  }

  .value {
    color: white;
    margin-left: 15px;
    width: 50px;
  }

  .value-bar {
    display: flex;
    align-items: center;
    justify-content: center;

    .el-progress {
      width: 290px;
      margin-right: 20px;
    }
  }
}
</style>
