import BigNumber from 'bignumber.js'
import { PoolStatus } from '@/type'
import { OracleLink, OracleLinkWithTunable } from '@/config/oracle'
import { UniswapOracle } from '@/business-components/SelectPerpetualOracle/types'

export interface LiquidityPoolParams {
  liquidityPoolAddress: string
  liquidityPoolStatus: PoolStatus
  collateralAddress: string
  collateralSymbol: string
  collateralDecimals: number
  isFastCreationEnabled: boolean
  insuranceFundCap: string
}

export interface LiquidityOracleParams {
  type: 'registered' | 'custom' | 'uniswapV3'
  underlyingAsset: string
  oracleAddress?: string
  oracleRouterPath?: OracleLinkWithTunable[] | UniswapOracle
}

export interface LiquidityContractParams {
  initialMarginRate: BigNumber
  maxLeverage: BigNumber
  maintenanceMarginRate: BigNumber
  vaultFeeRate: BigNumber
  operatorFeeRate: BigNumber
  lpFeeRate: BigNumber
  liquidationPenaltyRate: BigNumber
  insuranceFundRate: BigNumber
  keeperGasReward: BigNumber
  referrerRebateRate: BigNumber
  maxOpenInterestRate: BigNumber
  defaultTargetLeverage: BigNumber
  isInverse: boolean
}

export interface RiskParams {
  minHalfSpread: BigNumber
  maxHalfSpread: BigNumber
  halfSpread: BigNumber
  openSlippage: BigNumber
  minOpenSlippage: BigNumber
  maxOpenSlippage: BigNumber
  closeSlippage: BigNumber
  minCloseSlippage: BigNumber
  maxCloseSlippage: BigNumber
  fundingRateLimit: BigNumber
  minFundingRateLimit: BigNumber
  maxFundingRateLimit: BigNumber
  fundingRateFactor: BigNumber
  minFundingRateFactor: BigNumber
  maxFundingRateFactor: BigNumber
  ammMaxLeverage: BigNumber
  minAMMMaxLeverage: BigNumber
  maxAMMMaxLeverage: BigNumber
  closePriceDiscount: BigNumber
  minClosePriceDiscount: BigNumber
  maxClosePriceDiscount: BigNumber
  defaultTargetLeverage: BigNumber
  minDefaultTargetLeverage: BigNumber
  maxDefaultTargetLeverage: BigNumber
  baseFundingRate: BigNumber
  minBaseFundingRate: BigNumber
  maxBaseFundingRate: BigNumber
}

export interface OracleInfo {
  markPrice: BigNumber
  indexPrice: BigNumber
  symbol: string
}

export interface CollateralInfo {
  decimals: number
  symbol: string
  address: string
}

export interface PoolListPerpetualItem {
  symbol: string
  underlying: string
}

export type PoolListType = '' | 'all' | 'certified' | 'uncertified'

export interface PoolListItem {
  isMining: boolean
  poolAddress: string
  voteAddress: string
  operatorAddress: string
  operatorIsExpiration: boolean
  poolCollateralSymbol: string
  collateralAddress: string
  perpetuals: PoolListPerpetualItem[]
  poolMarginUSD: string
  poolMargin: string
  myShareRate: string
  myPooled: string
  shareAddress: string
  governorPeriodFinish: string
  rewardRate: string
  isUnknownUSD: boolean
  createTimestamp: number
  poolIcon?: string
}

export interface PoolListSubItem {
  lpApy: BigNumber
  miningApy: BigNumber
  volume: string
}

export interface MyPoolShareInfo {
  poolAddress: string
  shareAmount: BigNumber
  totalSupply: BigNumber
  poolMarginUSD: BigNumber
  poolMargin: BigNumber
}
