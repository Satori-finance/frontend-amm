import { DaoProposalState, PoolProposalState } from '@/type'

export const number2LpState: { [n: number]: PoolProposalState } = {
  0: PoolProposalState.Created, // Pending
  1: PoolProposalState.Active,
  2: PoolProposalState.Failed,  // Defeated
  3: PoolProposalState.Succeeded, // success, can not execute
  4: PoolProposalState.Queued, // success and to execute
  5: PoolProposalState.Executed,
  6: PoolProposalState.Expired,
}

export function parseLpProposalState(stateCode: number): PoolProposalState {
  if (typeof number2LpState[stateCode] !== 'undefined') {
    return number2LpState[stateCode]
  }
  return PoolProposalState.Created
}

export const number2DaoState: { [n: number]: DaoProposalState } = {
  0: DaoProposalState.Created, // Pending
  1: DaoProposalState.Active,
  2: DaoProposalState.Failed,  // Defeated
  3: DaoProposalState.Defeated,
  4: DaoProposalState.Succeeded, // success, to queue
  5: DaoProposalState.Queued, // success and to execute
  6: DaoProposalState.Expired,
  7: DaoProposalState.Executed,
}

export function parseDaoProposalState(stateCode: number): DaoProposalState {
  if (typeof number2DaoState[stateCode] !== 'undefined') {
    return number2DaoState[stateCode]
  }
  return DaoProposalState.Created
}

export function formatProposalIndex(index: number, length: number): string {
  return (Array(length).join('0') + index).slice(-length)
}
