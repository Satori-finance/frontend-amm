import { CombinedDaoActionTypes } from '../lowLevelDaoProposal'

export interface DaoActionData {
  selectActionType: CombinedDaoActionTypes
  datas: TransferVaultAssetsActionDatas |
    MintSATORIActionDatas |
    SetLiquidityMiningRateActionDatas |
    SetUniswapMiningRateActionDatas |
    SetSATORIStakingMiningRateActionDatas |
    SetMiningSupplyActionDatas |
    CustomActionDatas
}

export interface TransferVaultAssetsActionDatas {
  assetsAmount: string
  assetsTokenAddress: string
  receiveAddress: string
  assetsTokenDecimals: number
}

export const EmptyTransferVaultAssetsActionDatas: TransferVaultAssetsActionDatas = {
  assetsAmount: '',
  assetsTokenAddress: '',
  receiveAddress: '',
  assetsTokenDecimals: 0
}

export interface MintSATORIActionDatas {
  amount: string
  receiveAddress: string
}

export const EmptyMintSATORIActionDatas: MintSATORIActionDatas = {
  amount: '',
  receiveAddress: '',
}

export interface SetLiquidityMiningRateActionDatas {
  miningPoolAddress: string
  miningRate: string
  governorAddress: string
}

export const EmptySetLiquidityMiningRateActionDatas: SetLiquidityMiningRateActionDatas = {
  miningPoolAddress: '',
  miningRate: '',
  governorAddress: ''
}

export interface SetUniswapMiningRateActionDatas {
  miningPoolAddress: string
  miningRate: string
}

export const EmptySetUniswapMiningRateActionDatas: SetUniswapMiningRateActionDatas = {
  miningPoolAddress: '',
  miningRate: ''
}

export interface SetSATORIStakingMiningRateActionDatas {
  assetsTokenAddress: string
  miningRate: string,
  isSetRewardPlan: boolean | null,
  assetsTokenDecimals: number
}

export const EmptySetSATORIStakingMiningRateActionDatas: SetSATORIStakingMiningRateActionDatas = {
  assetsTokenAddress: '',
  miningRate: '',
  isSetRewardPlan: null,
  assetsTokenDecimals: 0
}

export enum MiningSupplyPoolType {
  Liquidity = 'liquidity',
  Uniswap = 'uniswap',
  Staking = 'staking'
}

export interface SetMiningSupplyActionDatas {
  supplyAmount: string
  assetsTokenAddress: string
  poolType: MiningSupplyPoolType
  poolAddress: string,
  assetsTokenDecimals: number
  governorAddress: string
}

export const EmptySetMiningSupplyActionDatas: SetMiningSupplyActionDatas = {
  supplyAmount: '',
  assetsTokenAddress: '',
  poolType: MiningSupplyPoolType.Liquidity,
  poolAddress: '',
  assetsTokenDecimals: 0,
  governorAddress: ''
}

export interface CustomActionDatas {
  to: string
  value: string
  callData: string
  signature: string
}

export const EmptyCustomActionDatas: CustomActionDatas = {
  to: '',
  value: '',
  callData: '',
  signature: ''
}

