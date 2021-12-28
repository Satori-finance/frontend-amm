import { Signer, Contract, ethers } from 'ethers'
import { Provider } from '@ethersproject/providers'
import { WETHFactory } from './WETHFactory'
import BigNumber from 'bignumber.js'
import { Overrides, PayableOverrides } from '@ethersproject/contracts'
import { WETH } from './WETH'
import { normalizeBigNumberish, BigNumberish, DECIMALS } from '@mcdex/mai3.js'
import { currentChainConfig } from '@/config/chain'

export function getWrapContract(signer: Signer | Provider): WETH {
  return WETHFactory.connect(currentChainConfig.assetAddress, signer)
}

export async function WETHDeposit(contract: WETH, tokenAmount: BigNumberish, overrides: PayableOverrides = {},)
  : Promise<ethers.providers.TransactionResponse> {
  const largeAmount = normalizeBigNumberish(tokenAmount)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  overrides.value = largeAmount.toFixed()
  return await contract.deposit(overrides)
}

export async function WETHWithdraw(contract: WETH, tokenAmount: BigNumberish, overrides: Overrides = {},)
  : Promise<ethers.providers.TransactionResponse> {
  const largeAmount = normalizeBigNumberish(tokenAmount)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  return await contract.withdraw(largeAmount.toFixed(), overrides)
}
