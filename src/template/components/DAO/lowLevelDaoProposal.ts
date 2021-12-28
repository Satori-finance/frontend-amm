import { InvalidArgumentError, DaoProposalState } from '@/type'
import { ethers } from 'ethers'
import { Provider } from '@ethersproject/providers'
import { normalizeBigNumberish } from '@mcdex/mai3.js'
import { getDaoGovernorContract } from '@mcdex/mcdex-governance.js'
import BigNumber from 'bignumber.js'
import { parseDaoProposalState } from '@/utils'

export enum CombinedDaoActionTypes {
  TransferVaultAssets = 'TransferVaultAssets',
  MintSATORI = 'MintSATORI',
  SetLiquidityMiningRate = 'SetLiquidityMiningRate',
  SetUniswapMiningRate = 'SetUniswapMiningRate',
  SetSATORIStakingMiningRate = 'SetSATORIStakingMiningRate',
  SetMiningSupply = "SetMiningSupply",
  Custom = 'Custom',
}

export const FunctionSignature2DaoActionTypes: { [signature: string]: CombinedDaoActionTypes } = {
  "transferERC20(address,address,uint256)": CombinedDaoActionTypes.TransferVaultAssets,
  "transferERC721(address,uint256,address)": CombinedDaoActionTypes.TransferVaultAssets,
  "transferETH(address,uint256)": CombinedDaoActionTypes.TransferVaultAssets,
  "setRewardRate(uint256)": CombinedDaoActionTypes.SetLiquidityMiningRate,
  "setRewardRate(address,uint256)": CombinedDaoActionTypes.SetSATORIStakingMiningRate,
  "createRewardPlan(address,uint256)": CombinedDaoActionTypes.SetSATORIStakingMiningRate,
  "notifyRewardAmount(uint256)": CombinedDaoActionTypes.SetMiningSupply,   // liquidity pool
  "notifyRewardAmount(address,uint256)": CombinedDaoActionTypes.SetMiningSupply,  // dao vault
  "mintFromBase(address,uint256)": CombinedDaoActionTypes.MintSATORI,  // minter
}

export const ActionType2Signatures: { [tp: string]: { [name: string]: string } } = {
  "TransferVaultAssets": {
    transferERC20: 'transferERC20(address,address,uint256)',
    transferERC721: 'transferERC721(address,uint256,address)',
    transferETH: 'transferETH(address,uint256)',
  },
  "MintSATORI": {
    mintFromBase: 'mintFromBase(address,uint256)'
  },
  "SetLiquidityMiningRate": {
    setRewardRate: 'setRewardRate(uint256)',
  },
  "SetUniswapMiningRate": {},
  "SetSATORIStakingMiningRate": {
    createRewardPlan: 'createRewardPlan(address,uint256)',  // token not set mining rate to initial
    setRewardRate: 'setRewardRate(address,uint256)',  // token is mining token to update
  },
  "SetMiningSupply": {
    liquidityMining: 'notifyRewardAmount(uint256)', // liquidity pool
    stakingMining: 'notifyRewardAmount(address,uint256)', // dao vault
  },
}

export const noParseSignaturesAction: string[] = []

export function getFunctionArgs(signature: string): string[] {
  const re = signature.match(/.*\((.*)\)/)
  if (!re) {
    throw new InvalidArgumentError(`unknown dao action function: ${signature}`)
  }
  return re[1].split(',')
}

export function encodeProposal(signature: string, values: any[]): string {
  const args = getFunctionArgs(signature)
  const coder: ethers.utils.AbiCoder = ethers.utils.defaultAbiCoder
  return coder.encode(args, values)
}

export function decodeProposal(signature: string, data: string): any {
  const re = signature.match(/.*\((.*)\)/)
  if (!re) {
    throw new InvalidArgumentError(`unknown dao action function: ${signature}`)
  }
  const args = getFunctionArgs(signature)
  const coder: ethers.utils.AbiCoder = ethers.utils.defaultAbiCoder
  try {
    return coder.decode(args, data)
  } catch (e) {
    console.warn('decode dao action failed:', e)
    return data
  }
}

export async function checkAccountHasActiveProposal(
  governor: string,
  account: string,
  provider: Provider | ethers.Signer,
): Promise<boolean> {
  const governanceContract = getDaoGovernorContract(governor, provider)
  let proposalCount = new BigNumber((await governanceContract.proposalCount()).toString())
  if (proposalCount.isZero()) {
    return false
  }
  const startProposalId = normalizeBigNumberish(await governanceContract.initialProposalId())
  proposalCount = proposalCount.plus(startProposalId).minus(1)
  for (let i = proposalCount.toNumber(); i >= startProposalId.toNumber(); i--) {
    const [ stateCode, proposal ] = await Promise.all([
      governanceContract.state(i),
      governanceContract.proposals(i)
    ])
    const state = parseDaoProposalState(stateCode)
    if ((state === DaoProposalState.Created || state === DaoProposalState.Active) &&
      account.toLowerCase() === proposal.proposer.toLowerCase()) {
      return true
    }
  }
  return false
}

export function encodeActionHash(targets: string[], signatures: string[], callDatas: string[], value: string = '0'): string {
  let s: string= ''
  for (let i=0; i < targets.length; i++) {
    const t = targets[i] + signatures[i] + callDatas[i] + value.toString()
    s += t
  }
  return s
}
