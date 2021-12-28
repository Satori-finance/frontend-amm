import { ContractReceipt, ethers } from 'ethers'
import { InvalidArgumentError } from '@/type/error'
import { Provider } from '@ethersproject/providers'
import { getLpGovernorContract } from '@mcdex/mai3.js'
import BigNumber from 'bignumber.js'
import { parseLpProposalState } from '@/utils'
import { PoolProposalState } from '@/type'

export enum LowLevelPoolProposalTypes {
  Unrecognized = '()',
  ForceToSetEmergencyState = 'forceToSetEmergencyState(uint256,int256)',
  SetLiquidityPoolParameter = 'setLiquidityPoolParameter(int256[2])',
  SetOracle = 'setOracle(uint256,address)',
  SetPerpetualBaseParameter = 'setPerpetualBaseParameter(uint256,int256[9])',
  SetPerpetualRiskParameter = 'setPerpetualRiskParameter(uint256,int256[9],int256[9],int256[9])',
  TransferOperator = 'transferOperator(address)',
  CreatePerpetual = 'createPerpetual(address,int256[9],int256[9],int256[9],int256[9])',

  // "to" must be governor
  UpgradeContract = 'upgradeToAndCall(bytes32,bytes,bytes)',
}

export const FunctionSignature2PoolProposalTypes: { [signature: string]: LowLevelPoolProposalTypes } = {
  'forceToSetEmergencyState(uint256,int256)': LowLevelPoolProposalTypes.ForceToSetEmergencyState,
  'setLiquidityPoolParameter(int256[2])': LowLevelPoolProposalTypes.SetLiquidityPoolParameter,
  'setOracle(uint256,address)': LowLevelPoolProposalTypes.SetOracle,
  'setPerpetualBaseParameter(uint256,int256[9])': LowLevelPoolProposalTypes.SetPerpetualBaseParameter,
  'setPerpetualRiskParameter(uint256,int256[9],int256[9],int256[9])':
    LowLevelPoolProposalTypes.SetPerpetualRiskParameter,
  'transferOperator(address)': LowLevelPoolProposalTypes.TransferOperator,
  'createPerpetual(address,int256[9],int256[9],int256[9],int256[9])': LowLevelPoolProposalTypes.CreatePerpetual,

  // "to" must be governor
  'upgradeToAndCall(bytes32,bytes,bytes)': LowLevelPoolProposalTypes.UpgradeContract,
}

export function getFunctionArgs(type: LowLevelPoolProposalTypes): string[] {
  const re = type.toString().match(/.*\((.*)\)/)
  if (!re) {
    throw new InvalidArgumentError(`unknown proposal function: ${type}`)
  }
  return re[1].split(',')
}

export function encodeProposal(type: LowLevelPoolProposalTypes, values: any[]): string {
  const args = getFunctionArgs(type)
  const coder: ethers.utils.AbiCoder = ethers.utils.defaultAbiCoder
  return coder.encode(args, values)
}

export function decodeProposal(signature: string, data: string): { type: LowLevelPoolProposalTypes; data: any[] } {
  if (typeof FunctionSignature2PoolProposalTypes[signature] === 'undefined') {
    return { type: LowLevelPoolProposalTypes.Unrecognized, data: [data] }
  }
  const type = FunctionSignature2PoolProposalTypes[signature]
  const args = getFunctionArgs(type)
  const coder: ethers.utils.AbiCoder = ethers.utils.defaultAbiCoder
  try {
    const decodeData = coder.decode(args, data)
    return { type, data: [...decodeData] }
  } catch (e) {
    console.log('decode proposal failed:', e)
    return { type: LowLevelPoolProposalTypes.Unrecognized, data: [data] }
  }
}

export function onCreatedGetProposalId(receipt: ContractReceipt): string | null {
  // event ProposalCreated(uint256 id, address proposer, string[] signatures, bytes[] calldatas,
  // uint256 startBlock, uint256 endBlock, uint256 quorumVotes, string description);
  let proposalId: string | null = null
  if (receipt.status === 1 && receipt.events) {
    for (let event of receipt.events) {
      if (event.event === 'ProposalCreated' && event.args) {
        proposalId = event.args[0].toString()
      }
    }
  }
  return proposalId
}

export async function checkPoolHasActiveProposal(
  governor: string,
  provider: Provider | ethers.Signer
): Promise<boolean> {
  const lpGovernanceContract = getLpGovernorContract(governor, provider)
  const proposalCount = new BigNumber((await lpGovernanceContract.proposalCount()).toString())
  if (proposalCount.isZero()) {
    return false
  }

  for (let i = proposalCount.toNumber(); i >= 1; i--) {
    const stateCode = await lpGovernanceContract.state(i)
    const state = parseLpProposalState(stateCode)
    if (state === PoolProposalState.Created || state === PoolProposalState.Active) {
      return true
    }
  }
  return false
}
