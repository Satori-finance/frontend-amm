<template>
  <div class="modify-perp-params-details">
    <div class="details-title">{{ $t('governance.proposalDetail') }}</div>
    <div class="table-container" v-if="proposal">
      <table class="mc-data-table mc-data-table--border">
        <thead>
        <tr>
          <td>{{ $t('pool.poolProposal.perpParamsProposal.parameters') }}</td>
          <td>{{ $t('pool.poolProposal.perpParamsProposal.before') }}</td>
          <td>{{ $t('pool.poolProposal.perpParamsProposal.after') }}</td>
        </tr>
        </thead>
        <tbody>
        <tr v-if="proposal.contractParams.initialMarginRate&&proposal.contractParams.initialMarginRate.afterValue!==''">
          <td>
            {{ $t('contractInfo.contractParams.initialMarginRate') }}
          </td>
          <td class="value">
            {{ proposal.contractParams.initialMarginRate.beforeValue }} %
          </td>
          <td class="value">
            {{ proposal.contractParams.initialMarginRate.afterValue }} %
          </td>
        </tr>
        <!-- contractParams maintenanceMarginRate -->
        <tr
          v-if="proposal.contractParams.maintenanceMarginRate&&proposal.contractParams.maintenanceMarginRate.afterValue!==''">
          <td>
            {{ $t('contractInfo.contractParams.maintenanceMarginRate') }}
          </td>
          <td class="value">
            {{ proposal.contractParams.maintenanceMarginRate.beforeValue }} %
          </td>
          <td class="value">
            {{ proposal.contractParams.maintenanceMarginRate.afterValue }} %
          </td>
        </tr>
        <!-- contractParams operatorFeeRate -->
        <tr v-if="proposal.contractParams.operatorFeeRate&&proposal.contractParams.operatorFeeRate.afterValue!==''">
          <td>
            {{ $t('contractInfo.contractParams.operatorFeeRate') }}
          </td>
          <td class="value">
            {{ proposal.contractParams.operatorFeeRate.beforeValue }} %
          </td>
          <td class="value">
            {{ proposal.contractParams.operatorFeeRate.afterValue }} %
          </td>
        </tr>
        <!-- contractParams lpFeeRate -->
        <tr v-if="proposal.contractParams.lpFeeRate&&proposal.contractParams.lpFeeRate.afterValue!==''">
          <td>
            {{ $t('contractInfo.contractParams.lpFeeRate') }}
          </td>
          <td class="value">
            {{ proposal.contractParams.lpFeeRate.beforeValue }} %
          </td>
          <td class="value">
            {{ proposal.contractParams.lpFeeRate.afterValue }} %
          </td>
        </tr>
        <!-- contractParams liquidationPenaltyRate -->
        <tr
          v-if="proposal.contractParams.liquidationPenaltyRate&&proposal.contractParams.liquidationPenaltyRate.afterValue!==''">
          <td>
            {{ $t('contractInfo.contractParams.liquidationPenaltyRate') }}
          </td>
          <td class="value">
            {{ proposal.contractParams.liquidationPenaltyRate.beforeValue }} %
          </td>
          <td class="value">
            {{ proposal.contractParams.liquidationPenaltyRate.afterValue }} %
          </td>
        </tr>
        <!-- contractParams insuranceFundRate -->
        <tr v-if="proposal.contractParams.insuranceFundRate&&proposal.contractParams.insuranceFundRate.afterValue!==''">
          <td>
            {{ $t('contractInfo.contractParams.insuranceFundRate') }}
          </td>
          <td class="value">
            {{ proposal.contractParams.insuranceFundRate.beforeValue }} %
          </td>
          <td class="value">
            {{ proposal.contractParams.insuranceFundRate.afterValue }} %
          </td>
        </tr>
        <!-- contractParams keeperGasReward -->
        <tr v-if="proposal.contractParams.keeperGasReward&&proposal.contractParams.keeperGasReward.afterValue!==''">
          <td>
            {{ $t('contractInfo.contractParams.keeperGasReward') }}
          </td>
          <td class="value">
            {{ proposal.contractParams.keeperGasReward.beforeValue }}
            {{ proposal.collateralSymbol }}
          </td>
          <td class="value">
            {{ proposal.contractParams.keeperGasReward.afterValue }}
            {{ proposal.collateralSymbol }}
          </td>
        </tr>
        <!-- contractParams referrerRebateRate -->
        <tr
          v-if="proposal.contractParams.referrerRebateRate&&proposal.contractParams.referrerRebateRate.afterValue!==''">
          <td>
            {{ $t('contractInfo.contractParams.referrerRebateRate') }}
          </td>
          <td class="value">
            {{ proposal.contractParams.referrerRebateRate.beforeValue }} %
          </td>
          <td class="value">
            {{ proposal.contractParams.referrerRebateRate.afterValue }} %
          </td>
        </tr>
        <!-- contractParams maxOpenInterestRate -->
        <tr v-if="proposal.contractParams.maxOpenInterestRate&&proposal.contractParams.maxOpenInterestRate.afterValue!==''">
          <td>
            {{ $t('contractInfo.contractParams.maxOpenInterestRate') }}
          </td>
          <td class="value">
            {{ proposal.contractParams.maxOpenInterestRate.beforeValue }}x
          </td>
          <td class="value">
            {{ proposal.contractParams.maxOpenInterestRate.afterValue }}x
          </td>
        </tr>
        <!-- AMM risk halfSpread -->
        <tr v-if="proposal.riskParams.halfSpread&&proposal.riskParams.halfSpread.afterValue!==''">
          <td>
            {{ $t('contractInfo.riskParams.halfSpread') }}
          </td>
          <td class="value">
            {{ proposal.riskParams.halfSpread.beforeValue }} %
          </td>
          <td class="value">
            {{ proposal.riskParams.halfSpread.afterValue }} %
          </td>
        </tr>
        <!-- AMM risk minHalfSpread -->
        <tr v-if="proposal.riskParams.minHalfSpread&&proposal.riskParams.minHalfSpread.afterValue!==''">
          <td>
            {{ $t('contractInfo.riskParams.minHalfSpread') }}
          </td>
          <td class="value">
            {{ proposal.riskParams.minHalfSpread.beforeValue }} %
          </td>
          <td class="value">
            {{ proposal.riskParams.minHalfSpread.afterValue }} %
          </td>
        </tr>
        <!-- AMM risk maxHalfSpread -->
        <tr v-if="proposal.riskParams.maxHalfSpread&&proposal.riskParams.maxHalfSpread.afterValue!==''">
          <td>
            {{ $t('contractInfo.riskParams.maxHalfSpread') }}
          </td>
          <td class="value">
            {{ proposal.riskParams.maxHalfSpread.beforeValue }} %
          </td>
          <td class="value">
            {{ proposal.riskParams.maxHalfSpread.afterValue }} %
          </td>
        </tr>
        <!-- AMM risk openSlippage -->
        <tr v-if="proposal.riskParams.openSlippage&&proposal.riskParams.openSlippage.afterValue!==''">
          <td>
            <span v-html="$t('contractInfo.riskParams.openSlippage')"></span>
          </td>
          <td class="value">
            {{ proposal.riskParams.openSlippage.beforeValue }}
          </td>
          <td class="value">
            {{ proposal.riskParams.openSlippage.afterValue }}
          </td>
        </tr>
        <!-- AMM risk minOpenSlippage -->
        <tr v-if="proposal.riskParams.minOpenSlippage&&proposal.riskParams.minOpenSlippage.afterValue!==''">
          <td>
            <span v-html="$t('contractInfo.riskParams.minOpenSlippage')"></span>
          </td>
          <td class="value">
            {{ proposal.riskParams.minOpenSlippage.beforeValue }}
          </td>
          <td class="value">
            {{ proposal.riskParams.minOpenSlippage.afterValue }}
          </td>
        </tr>
        <!-- AMM risk maxOpenSlippage -->
        <tr v-if="proposal.riskParams.maxOpenSlippage&&proposal.riskParams.maxOpenSlippage.afterValue!==''">
          <td>
            <span v-html="$t('contractInfo.riskParams.maxOpenSlippage')"></span>
          </td>
          <td class="value">
            {{ proposal.riskParams.maxOpenSlippage.beforeValue }}
          </td>
          <td class="value">
            {{ proposal.riskParams.maxOpenSlippage.afterValue }}
          </td>
        </tr>
        <!-- AMM risk closeSlippage -->
        <tr v-if="proposal.riskParams.closeSlippage&&proposal.riskParams.closeSlippage.afterValue!==''">
          <td><span v-html="$t('contractInfo.riskParams.closeSlippage')"></span></td>
          <td class="value">
            {{ proposal.riskParams.closeSlippage.beforeValue }}
          </td>
          <td class="value">
            {{ proposal.riskParams.closeSlippage.afterValue }}
          </td>
        </tr>
        <!-- AMM risk minCloseSlippage -->
        <tr v-if="proposal.riskParams.minCloseSlippage&&proposal.riskParams.minCloseSlippage.afterValue!==''">
          <td>
            <sapn v-html="$t('contractInfo.riskParams.minCloseSlippage')"></sapn>
          </td>
          <td class="value">
            {{ proposal.riskParams.minCloseSlippage.beforeValue }}
          </td>
          <td class="value">
            {{ proposal.riskParams.minCloseSlippage.afterValue }}
          </td>
        </tr>
        <!-- AMM risk maxCloseSlippage -->
        <tr v-if="proposal.riskParams.maxCloseSlippage&&proposal.riskParams.maxCloseSlippage.afterValue!==''">
          <td>
            <span v-html="$t('contractInfo.riskParams.maxCloseSlippage')"></span>
          </td>
          <td class="value">
            {{ proposal.riskParams.maxCloseSlippage.beforeValue }}
          </td>
          <td class="value">
            {{ proposal.riskParams.maxCloseSlippage.afterValue }}
          </td>
        </tr>
        <!-- AMM risk AMMMaxLeverage -->
        <tr v-if="proposal.riskParams.ammMaxLeverage&&proposal.riskParams.ammMaxLeverage.afterValue!==''">
          <td>
            {{ $t('contractInfo.riskParams.ammMaxLeverage') }}
          </td>
          <td class="value">
            {{ proposal.riskParams.ammMaxLeverage.beforeValue }} x
          </td>
          <td class="value">
            {{ proposal.riskParams.ammMaxLeverage.afterValue }} x
          </td>
        </tr>
        <!-- AMM risk minAMMMaxLeverage -->
        <tr v-if="proposal.riskParams.minAMMMaxLeverage&&proposal.riskParams.minAMMMaxLeverage.afterValue!==''">
          <td>
            {{ $t('contractInfo.riskParams.minAMMMaxLeverage') }}
          </td>
          <td class="value">
            {{ proposal.riskParams.minAMMMaxLeverage.beforeValue }} x
          </td>
          <td class="value">
            {{ proposal.riskParams.minAMMMaxLeverage.afterValue }} x
          </td>
        </tr>
        <!-- AMM risk maxAMMMaxLeverage -->
        <tr v-if="proposal.riskParams.maxAMMMaxLeverage&&proposal.riskParams.maxAMMMaxLeverage.afterValue!==''">
          <td>
            {{ $t('contractInfo.riskParams.maxAMMMaxLeverage') }}
          </td>
          <td class="value">
            {{ proposal.riskParams.maxAMMMaxLeverage.beforeValue }} x
          </td>
          <td class="value">
            {{ proposal.riskParams.maxAMMMaxLeverage.afterValue }} x
          </td>
        </tr>
        <!-- AMM risk closePriceDiscount -->
        <tr v-if="proposal.riskParams.closePriceDiscount&&proposal.riskParams.closePriceDiscount.afterValue!==''">
          <td>
            {{ $t('contractInfo.riskParams.closePriceDiscount') }}
          </td>
          <td class="value">
            {{ proposal.riskParams.closePriceDiscount.beforeValue }} %
          </td>
          <td class="value">
            {{ proposal.riskParams.closePriceDiscount.afterValue }} %
          </td>
        </tr>
        <!-- AMM risk minClosePriceDiscount -->
        <tr v-if="proposal.riskParams.minClosePriceDiscount&&proposal.riskParams.minClosePriceDiscount.afterValue!==''">
          <td>
            {{ $t('contractInfo.riskParams.minClosePriceDiscount') }}
          </td>
          <td class="value">
            {{ proposal.riskParams.minClosePriceDiscount.beforeValue }} %
          </td>
          <td class="value">
            {{ proposal.riskParams.minClosePriceDiscount.afterValue }} %
          </td>
        </tr>
        <!-- AMM risk maxClosePriceDiscount -->
        <tr v-if="proposal.riskParams.maxClosePriceDiscount&&proposal.riskParams.maxClosePriceDiscount.afterValue!==''">
          <td>
            {{ $t('contractInfo.riskParams.maxClosePriceDiscount') }}
          </td>
          <td class="value">
            {{ proposal.riskParams.maxClosePriceDiscount.beforeValue }} %
          </td>
          <td class="value">
            {{ proposal.riskParams.maxClosePriceDiscount.afterValue }} %
          </td>
        </tr>
        <!-- AMM risk fundingRateFactor -->
        <tr v-if="proposal.riskParams.fundingRateFactor&&proposal.riskParams.fundingRateFactor.afterValue!==''">
          <td>
            {{ $t('contractInfo.riskParams.fundingRateFactor') }}
          </td>
          <td class="value">
            {{ proposal.riskParams.fundingRateFactor.beforeValue }} %
          </td>
          <td class="value">
            {{ proposal.riskParams.fundingRateFactor.afterValue }} %
          </td>
        </tr>
        <!-- AMM risk min fundingRateFactor -->
        <tr v-if="proposal.riskParams.minFundingRateFactor&&proposal.riskParams.minFundingRateFactor.afterValue!==''">
          <td>
            {{ $t('contractInfo.riskParams.minFundingRateFactor') }}
          </td>
          <td class="value">
            {{ proposal.riskParams.minFundingRateFactor.beforeValue }} %
          </td>
          <td class="value">
            {{ proposal.riskParams.minFundingRateFactor.afterValue }} %
          </td>
        </tr>
        <!-- AMM risk max fundingRateFactor -->
        <tr v-if="proposal.riskParams.maxFundingRateFactor&&proposal.riskParams.maxFundingRateFactor.afterValue!==''">
          <td>
            {{ $t('contractInfo.riskParams.maxFundingRateFactor') }}
          </td>
          <td class="value">
            {{ proposal.riskParams.maxFundingRateFactor.beforeValue }} %
          </td>
          <td class="value">
            {{ proposal.riskParams.maxFundingRateFactor.afterValue }} %
          </td>
        </tr>
        <!-- AMM risk fundingRateLimit -->
        <tr v-if="proposal.riskParams.fundingRateLimit&&proposal.riskParams.fundingRateLimit.afterValue!==''">
          <td>
            {{ $t('contractInfo.riskParams.fundingRateLimit') }}
          </td>
          <td class="value">
            {{ proposal.riskParams.fundingRateLimit.beforeValue }} %
          </td>
          <td class="value">
            {{ proposal.riskParams.fundingRateLimit.afterValue }} %
          </td>
        </tr>
        <!-- AMM risk min fundingRateLimit -->
        <tr v-if="proposal.riskParams.minFundingRateLimit&&proposal.riskParams.minFundingRateLimit.afterValue!==''">
          <td>
            {{ $t('contractInfo.riskParams.minFundingRateLimit') }}
          </td>
          <td class="value">
            {{ proposal.riskParams.minFundingRateLimit.beforeValue }} %
          </td>
          <td class="value">
            {{ proposal.riskParams.minFundingRateLimit.afterValue }} %
          </td>
        </tr>
        <!-- AMM risk max fundingRateLimit -->
        <tr v-if="proposal.riskParams.maxFundingRateLimit&&proposal.riskParams.maxFundingRateLimit.afterValue!==''">
          <td>
            {{ $t('contractInfo.riskParams.maxFundingRateLimit') }}
          </td>
          <td class="value">
            {{ proposal.riskParams.maxFundingRateLimit.beforeValue }} %
          </td>
          <td class="value">
            {{ proposal.riskParams.maxFundingRateLimit.afterValue }} %
          </td>
        </tr>
        <!--  defaultTargetLeverage -->
        <tr v-if="proposal.riskParams.defaultTargetLeverage&&proposal.riskParams.defaultTargetLeverage.afterValue!==''">
          <td>
            {{ $t('contractInfo.contractParams.defaultTargetLeverage') }}
          </td>
          <td class="value">
            {{ proposal.riskParams.defaultTargetLeverage.beforeValue }} x
          </td>
          <td class="value">
            {{ proposal.riskParams.defaultTargetLeverage.afterValue }} x
          </td>
        </tr>
        <!-- AMM risk baseFundingRate -->
        <tr v-if="proposal.riskParams.baseFundingRate&&proposal.riskParams.baseFundingRate.afterValue!==''">
          <td>
            <span v-html="$t('contractInfo.riskParams.baseFundingRate')"></span>
          </td>
          <td class="value">
            {{ proposal.riskParams.baseFundingRate.beforeValue }} %
          </td>
          <td class="value">
            {{ proposal.riskParams.baseFundingRate.afterValue }} %
          </td>
        </tr>
        <!-- AMM risk minBaseFundingRate -->
        <tr v-if="proposal.riskParams.minBaseFundingRate&&proposal.riskParams.minBaseFundingRate.afterValue!==''">
          <td>
            <sapn v-html="$t('contractInfo.riskParams.minBaseFundingRate')"></sapn>
          </td>
          <td class="value">
            {{ proposal.riskParams.minBaseFundingRate.beforeValue }} %
          </td>
          <td class="value">
            {{ proposal.riskParams.minBaseFundingRate.afterValue }} %
          </td>
        </tr>
        <!-- AMM risk minBaseFundingRate -->
        <tr v-if="proposal.riskParams.minBaseFundingRate&&proposal.riskParams.minBaseFundingRate.afterValue!==''">
          <td>
            <sapn v-html="$t('contractInfo.riskParams.minBaseFundingRate')"></sapn>
          </td>
          <td class="value">
            {{ proposal.riskParams.minBaseFundingRate.beforeValue }} %
          </td>
          <td class="value">
            {{ proposal.riskParams.minBaseFundingRate.afterValue }} %
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import { ModifyPerpParamsPoolProposal } from '@/template/components/Pool/poolProposalMixin'
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class ModifyPerpParamsDetails extends Vue {
  @Prop({ required: true }) proposal !: ModifyPerpParamsPoolProposal | null
}
</script>

<style scoped lang="scss">
.modify-perp-params-details {
  .details-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--mc-text-color-white);
  }

  .table-container {
    margin-top: 22px;
    width: 608px;

    table {
      width: 100%;

      tr {
        height: 40px;
        font-size: 14px;
        font-weight: 400;
        text-align: center;
      }

      td {
        color: var(--mc-text-color);
      }

      td:nth-of-type(1) {
        width: 35%;
      }

      td:nth-of-type(2) {
        width: 35%;
      }

      td:nth-of-type(3) {
        width: 30%;
      }
    }
  }

  .value {
    color: var(--mc-text-color-white) !important;
  }
}
</style>
