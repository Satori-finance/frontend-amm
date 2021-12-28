<template>
  <div class="create-new-perpetual-details">
    <div class="details-title">{{ $t('governance.proposalDetail') }}</div>
    <div class="details-body" v-if="proposalDetails && liquidityPool">
      <el-row type="flex" justify="space-between" :gutter="30">
        <el-col :span="12" class="perpetual-info">
          <div class="table-title">
            {{ $t('pool.poolInfo.perpetualInfo') }}
          </div>
          <div class="table-container">
            <table class="mc-data-table mc-data-table--border is-medium">
              <tbody>
              <tr>
                <td>{{ $t('base.perpetual') }}</td>
                <td>
                  {{ `${proposalDetails.underlyingSymbol}-${proposalDetails.collateralSymbol}` }}
                </td>
              </tr>
              <tr>
                <td>{{ $t('base.underlyingAssets') }}</td>
                <td>
                  {{ proposalDetails.underlyingSymbol }}
                </td>
              </tr>
              <tr>
                <td>{{ $t('base.collateral') }}</td>
                <td>
                  <span v-if="liquidityPool">{{ proposalDetails.collateralSymbol }}</span>
                  <el-link v-if="liquidityPool" class="icon" :underline="false" target="_blank"
                           :href="liquidityPool.liquidityPoolStorage.collateral | etherBrowserAddressFormatter">
                    <i class="iconfont icon-transmit"></i>
                  </el-link>
                </td>
              </tr>
              <tr>
                <td>{{ $t('base.oracle') }}</td>
                <td>
                  <span v-if="proposalDetails">{{ proposalDetails.oracleAddress | oracleNameFormatter }}</span>
                  <el-link v-if="proposalDetails" class="icon" :underline="false" target="_blank"
                           :href="proposalDetails.oracleAddress | etherBrowserAddressFormatter">
                    <i class="iconfont icon-transmit"></i>
                  </el-link>
                </td>
              </tr>
              <tr>
                <td>{{ $t('base.operator') }}</td>
                <td>
                  <span v-if="liquidityPool">
                    {{ liquidityPool.liquidityPoolStorage.operator | operatorNameFormatter }}
                  </span>
                  <el-link v-if="liquidityPool" class="icon" :underline="false" target="_blank"
                           :href="liquidityPool.liquidityPoolStorage.operator | etherBrowserAddressFormatter">
                    <i class="iconfont icon-transmit"></i>
                  </el-link>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </el-col>
        <el-col :span="12" class="risk-params-info">
          <div class="table-title">
            {{ $t('pool.poolInfo.AMMRiskParams') }}
          </div>
          <div class="table-container">
            <table class="mc-data-table mc-data-table--border is-medium">
              <tbody>
              <tr>
                <td>{{ $t('contractInfo.riskParams.halfSpread') }}</td>
                <td><span class="value">{{ proposalDetails.riskParams.halfSpread.times(100) | bigNumberFormatter }} %</span></td>
                <td>
                  <div class="value-bar">
                    <span>{{ $t('base.min') }}</span>
                    <span class="value">{{ proposalDetails.riskParams.minHalfSpread.times(100) | bigNumberFormatter }} %</span>
                    <el-progress :percentage="getPercentage(
                         proposalDetails.riskParams.minHalfSpread.toFixed(),
                         proposalDetails.riskParams.maxHalfSpread.toFixed(),
                         proposalDetails.riskParams.halfSpread.toFixed()
                         )" :show-text="false"></el-progress>
                    <span>{{ $t('base.max') }}</span>
                    <span class="value">{{ proposalDetails.riskParams.maxHalfSpread.times(100) | bigNumberFormatter }} %</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td><span v-html="$t('contractInfo.riskParams.openSlippage')"></span></td>
                <td><span class="value">{{ proposalDetails.riskParams.openSlippage | bigNumberFormatter }}</span></td>
                <td>
                  <div class="value-bar">
                    <span>{{ $t('base.min') }}</span>
                    <span class="value">{{ proposalDetails.riskParams.minOpenSlippage | bigNumberFormatter }}</span>
                    <el-progress :percentage="getPercentage(
                          proposalDetails.riskParams.minOpenSlippage.toFixed(),
                          proposalDetails.riskParams.maxOpenSlippage.toFixed(),
                          proposalDetails.riskParams.openSlippage.toFixed()
                          )" :show-text="false"></el-progress>
                    <span>{{ $t('base.max') }}</span>
                    <span class="value">{{ proposalDetails.riskParams.maxOpenSlippage | bigNumberFormatter }}</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td><span v-html="$t('contractInfo.riskParams.closeSlippage')"></span></td>
                <td><span class="value">{{ proposalDetails.riskParams.closeSlippage | bigNumberFormatter }}</span></td>
                <td>
                  <div class="value-bar">
                    <span>{{ $t('base.min') }}</span>
                    <span class="value">{{ proposalDetails.riskParams.minCloseSlippage | bigNumberFormatter }}</span>
                    <el-progress :percentage="getPercentage(
                          proposalDetails.riskParams.minCloseSlippage.toFixed(),
                          proposalDetails.riskParams.maxCloseSlippage.toFixed(),
                          proposalDetails.riskParams.closeSlippage.toFixed()
                        )" :show-text="false"></el-progress>
                    <span>{{ $t('base.max') }}</span>
                    <span class="value">{{ proposalDetails.riskParams.maxCloseSlippage | bigNumberFormatter }}</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td>{{ $t('contractInfo.riskParams.fundingRateFactor') }}</td>
                <td><span class="value">{{ proposalDetails.riskParams.fundingRateFactor.times(100) | bigNumberFormatter }} %</span></td>
                <td>
                  <div class="value-bar">
                    <span>{{ $t('base.min') }}</span>
                    <span class="value">{{ proposalDetails.riskParams.minFundingRateFactor.times(100) | bigNumberFormatter }} %</span>
                    <el-progress
                      :percentage="getPercentage(
                            proposalDetails.riskParams.minFundingRateFactor.toFixed(),
                            proposalDetails.riskParams.maxFundingRateFactor.toFixed(),
                            proposalDetails.riskParams.fundingRateFactor.toFixed()
                            )" :show-text="false"></el-progress>
                    <span>{{ $t('base.max') }}</span>
                    <span class="value">{{ proposalDetails.riskParams.maxFundingRateFactor.times(100) | bigNumberFormatter }} %</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td>{{ $t('contractInfo.riskParams.fundingRateLimit') }}</td>
                <td><span class="value">{{ proposalDetails.riskParams.fundingRateLimit.times(100) | bigNumberFormatter }} %</span></td>
                <td>
                  <div class="value-bar">
                    <span>{{ $t('base.min') }}</span>
                    <span class="value">{{ proposalDetails.riskParams.minFundingRateLimit.times(100) | bigNumberFormatter }} %</span>
                    <el-progress
                        :percentage="getPercentage(
                            proposalDetails.riskParams.minFundingRateLimit.toFixed(),
                            proposalDetails.riskParams.maxFundingRateLimit.toFixed(),
                            proposalDetails.riskParams.fundingRateLimit.toFixed()
                            )" :show-text="false"></el-progress>
                    <span>{{ $t('base.max') }}</span>
                    <span class="value">{{ proposalDetails.riskParams.maxFundingRateLimit.times(100) | bigNumberFormatter }} %</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td>{{ $t('contractInfo.riskParams.ammMaxLeverage') }}</td>
                <td><span class="value">{{ proposalDetails.riskParams.ammMaxLeverage | bigNumberFormatter }}</span></td>
                <td>
                  <div class="value-bar">
                    <span>{{ $t('base.min') }}</span>
                    <span class="value">{{ proposalDetails.riskParams.minAMMMaxLeverage | bigNumberFormatter }}</span>
                    <el-progress
                        :percentage="getPercentage(
                            proposalDetails.riskParams.minAMMMaxLeverage.toFixed(),
                            proposalDetails.riskParams.maxAMMMaxLeverage.toFixed(),
                            proposalDetails.riskParams.ammMaxLeverage.toFixed()
                            )" :show-text="false"></el-progress>
                    <span>{{ $t('base.max') }}</span>
                    <span class="value">{{ proposalDetails.riskParams.maxAMMMaxLeverage | bigNumberFormatter }}</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td>{{ $t('contractInfo.riskParams.closePriceDiscount') }}</td>
                <td><span class="value">{{ proposalDetails.riskParams.closePriceDiscount.times(100) | bigNumberFormatter }} %</span></td>
                <td>
                  <div class="value-bar">
                    <span>{{ $t('base.min') }}</span>
                    <span class="value">{{ proposalDetails.riskParams.minClosePriceDiscount.times(100) | bigNumberFormatter }} %</span>
                    <el-progress
                        :percentage="getPercentage(
                            proposalDetails.riskParams.minClosePriceDiscount.toFixed(),
                            proposalDetails.riskParams.maxClosePriceDiscount.toFixed(),
                            proposalDetails.riskParams.closePriceDiscount.toFixed()
                            )" :show-text="false"></el-progress>
                    <span>{{ $t('base.max') }}</span>
                    <span class="value">{{ proposalDetails.riskParams.maxClosePriceDiscount.times(100) | bigNumberFormatter }} %</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td><span v-html="$t('contractInfo.riskParams.baseFundingRate')"></span></td>
                <td><span class="value">{{ proposalDetails.riskParams.baseFundingRate.times(100) | bigNumberFormatter }} %</span></td>
                <td>
                  <div class="value-bar">
                    <span>{{ $t('base.min') }}</span>
                    <span class="value">{{ proposalDetails.riskParams.minBaseFundingRate.times(100) | bigNumberFormatter }} %</span>
                    <el-progress
                      :percentage="getPercentage(
                            proposalDetails.riskParams.minBaseFundingRate.toFixed(),
                            proposalDetails.riskParams.maxBaseFundingRate.toFixed(),
                            proposalDetails.riskParams.baseFundingRate.toFixed()
                            )" :show-text="false"></el-progress>
                    <span>{{ $t('base.max') }}</span>
                    <span class="value">{{ proposalDetails.riskParams.maxBaseFundingRate.times(100) | bigNumberFormatter }} %</span>
                  </div>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12" class="perpetual-params-info">
          <div class="table-title">
            {{ $t('pool.poolInfo.perpetualParams') }}
          </div>
          <div class="table-container">
            <table class="mc-data-table mc-data-table--border is-medium">
              <tbody>
              <tr>
                <td>{{ $t('contractInfo.contractParams.initialMarginRate') }}</td>
                <td>
                  <span class="value">
                    {{ proposalDetails.contractParams.initialMarginRate.times(100) | bigNumberFormatter }}%
                  </span>
                </td>
                <td>
                  <span>= <span class="value">{{ initialLeverage }}</span> {{ $t('base.leverage') }}</span>
                </td>
              </tr>
              <tr>
                <td>{{ $t('contractInfo.contractParams.defaultTargetLeverage') }}</td>
                <td>
                  <span class="value">{{ proposalDetails.riskParams.defaultTarget }}x</span>
                </td>
                <td></td>
              </tr>
              <tr>
                <td>{{ $t('contractInfo.contractParams.maintenanceMarginRate') }}</td>
                <td>
                  <span class="value">
                    {{ proposalDetails.contractParams.maintenanceMarginRate.times(100) | bigNumberFormatter }}%
                  </span>
                </td>
                <td>
                  <span>= <span class="value">{{ maintenanceLeverage }}</span> {{ $t('base.leverage') }}</span>
                </td>
              </tr>
              <tr>
                <td>{{ $t('contractInfo.contractParams.liquidationPenaltyRate') }}</td>
                <td>
                  <span class="value">
                    {{ proposalDetails.contractParams.liquidationPenaltyRate.times(100) | bigNumberFormatter }}%
                  </span>
                </td>
                <td></td>
              </tr>
              <tr>
                <td>{{ $t('contractInfo.contractParams.insuranceFundRate') }}</td>
                <td>
                  <span class="value">
                    {{ proposalDetails.contractParams.insuranceFundRate.times(100) | bigNumberFormatter }}%
                  </span>
                </td>
                <td></td>
              </tr>
              <tr>
                <td>{{ $t('contractInfo.contractParams.keeperGasReward') }}</td>
                <td>
                  <span class="value">
                    {{ proposalDetails.contractParams.keeperGasReward | bigNumberFormatter }}
                    {{ proposalDetails.collateralSymbol }}
                  </span>
                </td>
                <td></td>
              </tr>
              <tr>
                <td>{{ $t('contractInfo.contractParams.referrerRebateRate') }}</td>
                <td>
                  <span class="value">
                    {{ proposalDetails.contractParams.referrerRebateRate.times(100) | bigNumberFormatter }}%
                  </span>
                </td>
                <td></td>
              </tr>
              <tr>
                <td>
                  {{ $t('contractInfo.contractParams.maxOpenInterestRate') }}
                </td>
                <td>
                  <span class="value">
                    {{ proposalDetails.contractParams.maxOpenInterestRate | bigNumberFormatter }}
                  </span>
                </td>
                <td></td>
              </tr>
              <tr>
                <td>
                  {{ $t('contractInfo.contractParams.vaultFeeRate') }}

                </td>
                <td>
                  <span class="value">
                    {{ liquidityPool.liquidityPoolStorage.vaultFeeRate.times(100) | bigNumberFormatter }}%
                  </span>
                </td>
                <td rowspan="3" class="trade-fee-value">
                  <p>
                    <span class="value">
                    {{
                        liquidityPool.liquidityPoolStorage.vaultFeeRate.
                        plus(proposalDetails.contractParams.operatorFeeRate).
                        plus(proposalDetails.contractParams.lpFeeRate).times(100) | bigNumberFormatter
                      }} %
                  </span>
                  </p>
                  <p>{{ $t('contractInfo.contractParams.tradeFeeRate') }}</p>
                </td>
              </tr>
              <tr>
                <td>
                  {{ $t('contractInfo.contractParams.operatorFeeRate') }}

                </td>
                <td>
                  <span class="value">
                    {{ proposalDetails.contractParams.operatorFeeRate.times(100) | bigNumberFormatter }}%
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  {{ $t('contractInfo.contractParams.lpFeeRate') }}
                </td>
                <td>
                  <span class="value">
                    {{ proposalDetails.contractParams.lpFeeRate.times(100) | bigNumberFormatter }}%
                  </span>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { LiquidityPoolDirectoryItem } from '@/type'
import BigNumber from 'bignumber.js'
import { CreateNewPerpetualPoolProposal } from '@/template/components/Pool/poolProposalMixin'

@Component
export default class CreateNewPerpetualDetails extends Vue {
  @Prop({ required: true }) proposal !: CreateNewPerpetualPoolProposal | null
  @Prop({ required: true }) liquidityPool !: LiquidityPoolDirectoryItem | null

  getPercentage (min: string, max: string, value: string): number {
    const minValue = new BigNumber(min)
    const maxValue = new BigNumber(max)
    const currentValue = new BigNumber(value)
    const result = currentValue.minus(minValue).times(100).div(maxValue.minus(minValue))
    return result.isNaN() ? 0 : BigNumber.min(BigNumber.max(0, result), 100).toNumber()
  }

  get initialLeverage (): string {
    if (!this.proposalDetails) {
      return ''
    }
    return new BigNumber(100).div(
        this.proposalDetails.contractParams.initialMarginRate.times(100),
    ).toFixed(0) + 'x'
  }

  get maintenanceLeverage (): string {
    if (!this.proposalDetails) {
      return ''
    }
    return new BigNumber(100).div(
        this.proposalDetails.contractParams.maintenanceMarginRate.times(100),
    ).toFixed(0) + 'x'
  }

  get proposalDetails() {
    if (!this.proposal) {
      return null
    }
    return this.proposal.proposalDetails()
  }
}
</script>

<style scoped lang="scss">
.create-new-perpetual-details {
  .details-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--mc-text-color-white);
  }

  .details-body {
    margin-top: 33px;

    .table-title {
      margin-bottom: 20px;
      font-size: 16px;
      font-weight: 700;
      color: var(--mc-text-color-white);
    }

    .icon {
      width: 10px;
      height: 10px;
      font-size: 10px;
      color: var(--mc-text-color);
      margin-left: 11px;
      display: inline;
    }

    .icon:hover {
      color: var(--mc-text-color-white);
    }

    .perpetual-info {

      .mc-data-table {
        width: 100%;
      }

      .table-container {
        table {
          th, td {
            border: unset;
          }

          tr {
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
            border: 1px solid var(--mc-border-color);

            td {
              padding: 10px;
            }

            td:nth-of-type(1) {
              width: 28%;
              color: var(--mc-text-color);
            }

            td:nth-of-type(2) {
              width: 72%;
              color: var(--mc-text-color-white);
            }
          }
        }
      }
    }

    .risk-params-info, .perpetual-params-info {
      .table-container {
        .mc-data-table {
          width: 100%;
        }

        table {
          th, td {
            border: unset;
          }

          tr {
            font-size: 14px;
            font-weight: 400;
            border: 1px solid var(--mc-border-color);

            td {
              padding: 0 10px;
              color: var(--mc-text-color);
              height: 55px;
            }
          }
        }

        .value {
          color: white;
          display: inline-block;
          word-wrap: break-word;
          white-space: nowrap;
          width: 50px;
        }

        .value-bar {
          display: flex;
          align-items: center;
          justify-content: center;

          .el-progress {
            width: 205px;
            margin-right: 20px;
            margin-left: 6px;
          }
        }
      }
    }

    .perpetual-params-info {

      .mc-data-table {
        width: 100%;
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
              height: 48px;
            }
          }

          tr:nth-of-type(10) {
            td:nth-of-type(3) {
              border: 1px solid var(--mc-border-color);
            }
          }
        }

        .value {
          color: white;
        }

        .trade-fee-value {
          border: 1px solid var(--mc-border-color);
          text-align: center;
          line-height: 24px;
        }
      }
    }
  }
}
</style>
