import { _0, PerpetualStorage } from '@mcdex/mai3.js'
import { ALLOWANCE_AMOUNT } from '@/const'

export interface ParamsItem {
  beforeValue: string
  afterValue: string
}

// after
export function getEmptyChangePerpetualParamsProposalForm() {
  return {
    initialMarginRate: '',
    maintenanceMarginRate: '',
    operatorFeeRate: '',
    lpFeeRate: '',
    referrerRebateRate: '',
    liquidationPenaltyRate: '',
    keeperGasReward: '',
    insuranceFundRate: '',
    fundingInterval: '',
    maxOpenInterestRate: '',
    defaultTargetLeverage: '',
    halfSpread: '',
    minHalfSpread: '',
    maxHalfSpread: '',
    openSlippage: '',
    minOpenSlippage: '',
    maxOpenSlippage: '',
    closeSlippage: '',
    minCloseSlippage: '',
    maxCloseSlippage: '',
    fundingRateFactor: '',
    minFundingRateFactor: '',
    maxFundingRateFactor: '',
    fundingRateLimit: '',
    minFundingRateLimit: '',
    maxFundingRateLimit: '',
    ammMaxLeverage: '',
    minAMMMaxLeverage: '',
    maxAMMMaxLeverage: '',
    closePriceDiscount: '',
    minClosePriceDiscount: '',
    maxClosePriceDiscount: '',
    baseFundingRate: '',
    minBaseFundingRate: '',
    maxBaseFundingRate: '',
  }
}

export function mergePerpetualParameters(
  afterForm: { [name: string]: string },
  perpetualStorage: PerpetualStorage,
): { contractParams: { [name: string]: ParamsItem }; riskParams: { [name: string]: ParamsItem } } {
  return {
    contractParams: {
      initialMarginRate: {
        afterValue: afterForm.initialMarginRate,
        beforeValue: perpetualStorage.initialMarginRate.toFixed(),
      },
      maintenanceMarginRate: {
        afterValue: afterForm.maintenanceMarginRate,
        beforeValue: perpetualStorage.maintenanceMarginRate.toFixed(),
      },
      operatorFeeRate: {
        afterValue: afterForm.operatorFeeRate,
        beforeValue: perpetualStorage.operatorFeeRate.toFixed(),
      },
      lpFeeRate: {
        afterValue: afterForm.lpFeeRate,
        beforeValue: perpetualStorage.lpFeeRate.toFixed(),
      },
      referrerRebateRate: {
        afterValue: afterForm.referrerRebateRate,
        beforeValue: perpetualStorage.referrerRebateRate.toFixed(),
      },
      liquidationPenaltyRate: {
        afterValue: afterForm.liquidationPenaltyRate,
        beforeValue: perpetualStorage.liquidationPenaltyRate.toFixed(),
      },
      keeperGasReward: {
        afterValue: afterForm.keeperGasReward,
        beforeValue: perpetualStorage.keeperGasReward.toFixed(),
      },
      insuranceFundRate: {
        afterValue: afterForm.insuranceFundRate,
        beforeValue: perpetualStorage.insuranceFundRate.toFixed(),
      },
      maxOpenInterestRate: {
        afterValue: afterForm.maxOpenInterestRate,
        beforeValue: perpetualStorage.maxOpenInterestRate.toFixed(),
      },
    },
    riskParams: {
      halfSpread: {
        afterValue: afterForm.halfSpread,
        beforeValue: perpetualStorage.halfSpread.value.toFixed(),
      },
      openSlippage: {
        afterValue: afterForm.openSlippage,
        beforeValue: perpetualStorage.openSlippageFactor.value.toFixed(),
      },
      closeSlippage: {
        afterValue: afterForm.closeSlippage,
        beforeValue: perpetualStorage.closeSlippageFactor.value.toFixed(),
      },
      fundingRateFactor: {
        afterValue: afterForm.fundingRateFactor,
        beforeValue: perpetualStorage.fundingRateFactor.value.toFixed(),
      },
      fundingRateLimit: {
        afterValue: afterForm.fundingRateLimit,
        beforeValue: perpetualStorage.fundingRateLimit.value.toFixed(),
      },
      ammMaxLeverage: {
        afterValue: afterForm.ammMaxLeverage,
        beforeValue: perpetualStorage.ammMaxLeverage.value.toFixed(),
      },
      closePriceDiscount: {
        afterValue: afterForm.closePriceDiscount,
        beforeValue: perpetualStorage.maxClosePriceDiscount.value.toFixed(),
      },
      defaultTargetLeverage: {
        afterValue: afterForm.defaultTargetLeverage,
        beforeValue: perpetualStorage.defaultTargetLeverage.value.toFixed(),
      },
      baseFundingRate: {
        afterValue: afterForm.baseFundingRate,
        beforeValue: perpetualStorage.baseFundingRate.value.toFixed(),
      },

      minHalfSpread: {
        afterValue: afterForm.minHalfSpread,
        beforeValue: perpetualStorage.halfSpread.minValue.toFixed(),
      },
      minOpenSlippage: {
        afterValue: afterForm.minOpenSlippage,
        beforeValue: perpetualStorage.openSlippageFactor.minValue.toFixed(),
      },
      minCloseSlippage: {
        afterValue: afterForm.minCloseSlippage,
        beforeValue: perpetualStorage.closeSlippageFactor.minValue.toFixed(),
      },
      minFundingRateFactor: {
        afterValue: afterForm.minFundingRateFactor,
        beforeValue: perpetualStorage.fundingRateFactor.minValue.toFixed(),
      },
      minFundingRateLimit: {
        afterValue: afterForm.minFundingRateLimit,
        beforeValue: perpetualStorage.fundingRateLimit.minValue.toFixed(),
      },
      minAMMMaxLeverage: {
        afterValue: afterForm.minAMMMaxLeverage,
        beforeValue: perpetualStorage.ammMaxLeverage.minValue.toFixed(),
      },
      minClosePriceDiscount: {
        afterValue: afterForm.minClosePriceDiscount,
        beforeValue: perpetualStorage.maxClosePriceDiscount.minValue.toFixed(),
      },
      minDefaultTargetLeverage: {
        afterValue: perpetualStorage.defaultTargetLeverage.minValue.toFixed(),
        beforeValue: perpetualStorage.defaultTargetLeverage.minValue.toFixed(),
      },
      minBaseFundingRate: {
        afterValue: afterForm.minBaseFundingRate,
        beforeValue: perpetualStorage.baseFundingRate.minValue.toFixed(),
      },

      maxHalfSpread: {
        afterValue: afterForm.maxHalfSpread,
        beforeValue: perpetualStorage.halfSpread.maxValue.toFixed(),
      },
      maxOpenSlippage: {
        afterValue: afterForm.maxOpenSlippage,
        beforeValue: perpetualStorage.openSlippageFactor.maxValue.toFixed(),
      },
      maxCloseSlippage: {
        afterValue: afterForm.maxCloseSlippage,
        beforeValue: perpetualStorage.closeSlippageFactor.maxValue.toFixed(),
      },
      maxFundingRateFactor: {
        afterValue: afterForm.maxFundingRateFactor,
        beforeValue: perpetualStorage.fundingRateFactor.maxValue.toFixed(),
      },
      maxFundingRateLimit: {
        afterValue: afterForm.maxFundingRateLimit,
        beforeValue: perpetualStorage.fundingRateLimit.maxValue.toFixed(),
      },
      maxAMMMaxLeverage: {
        afterValue: afterForm.maxAMMMaxLeverage,
        beforeValue: perpetualStorage.ammMaxLeverage.maxValue.toFixed(),
      },
      maxClosePriceDiscount: {
        afterValue: afterForm.maxClosePriceDiscount,
        beforeValue: perpetualStorage.maxClosePriceDiscount.maxValue.toFixed(),
      },
      maxDefaultTargetLeverage: {
        afterValue: perpetualStorage.defaultTargetLeverage.maxValue.toFixed(),
        beforeValue: perpetualStorage.defaultTargetLeverage.maxValue.toFixed(),
      },
      maxBaseFundingRate: {
        afterValue: afterForm.maxBaseFundingRate,
        beforeValue: perpetualStorage.baseFundingRate.maxValue.toFixed(),
      },
    },
  }
}
