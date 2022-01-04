import { Signer } from 'ethers'
import { Provider } from '@ethersproject/providers'
import { SATORI_VESTING_ADDRESS } from '@/const'
import { McbVestingFactory } from './McbVestingFactory'
import { McbVesting } from './McbVesting'
import BigNumber from 'bignumber.js'
import { DECIMALS } from '@mcdex/mai3.js'
import { PayableOverrides } from '@ethersproject/contracts'

export function getMcbVestingContract(signer: Signer | Provider): McbVesting {
  return McbVestingFactory.connect(SATORI_VESTING_ADDRESS, signer)
}

export async function claimableToken(contract: McbVesting, address: string) {
  const result = await contract.claimableToken(address)
  return new BigNumber(result.toString()).shiftedBy(-DECIMALS)
}

export async function claimToken(contract: McbVesting, overrides?: PayableOverrides) {
  return await contract.claim(overrides)
}

export async function claimedBalances(contract: McbVesting, address: string) {
  const result = await contract.claimedBalances(address)
  return new BigNumber(result.toString()).shiftedBy(-DECIMALS)
}

export async function commitments(contract: McbVesting, address: string) {
  const result = await contract.commitments(address)
  return new BigNumber(result.toString()).shiftedBy(-DECIMALS)
}
