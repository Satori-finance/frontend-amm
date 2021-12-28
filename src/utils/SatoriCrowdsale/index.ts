import { Signer } from 'ethers'
import { Provider } from '@ethersproject/providers'
import { McbCrowdsaleFactory } from './SatoriCrowdsaleFactory'
import { SATORI_CROWD_SALE_ADDRESS } from '@/constants'
import { McbCrowdsale } from './SatoriCrowdsale'
import { McbCrowdsaleAccountStorage, McbCrowdsaleStorage } from './type'
import BigNumber from 'bignumber.js'
import { DECIMALS } from '@mcdex/mai3.js'
import { BigNumberish } from '@mcdex/mai3.js/dist/types'
import { PayableOverrides } from '@ethersproject/contracts' 

export function getMcbCrowdsaleContract(signer: Signer | Provider) {
  return McbCrowdsaleFactory.connect(SATORI_CROWD_SALE_ADDRESS, signer)
}

export async function getCrowdsaleStorage(contract: McbCrowdsale): Promise<McbCrowdsaleStorage> {
  const [maxSupply, mcbDepositRate, mcbAddress, usdcAddress, mcdexFundationAddress, usdcDepoistRate, beginTime, endTime, unlockTime, subscriptionRate] = await Promise.all([
    contract.MAX_SUPPLY(),
    contract.SATORI_DEPOSIT_RATE(),
    contract.SATORI_TOKEN_ADDRESS(),
    contract.USDC_TOKEN_ADDRESS(),
    contract.MCDEX_FOUNDATION_ADDRESS(),
    contract.USDC_DEPOSIT_RATE(),
    contract.beginTime(),
    contract.endTime(),
    contract.unlockTime(),
    contract.subscriptionRate(),
  ])

  const [totalSubscribedSupply, isSubscribable, totalSubscription, isSettleable] = await Promise.all([
    contract.totalSubscribedSupply(),
    contract.isSubscribable(),
    contract.totalSubscription(),
    contract.isSettleable(),
  ])

  return {
    maxSupply: new BigNumber(maxSupply.toString()).shiftedBy(-DECIMALS),
    mcbDepositRate: new BigNumber(mcbDepositRate.toString()).shiftedBy(-DECIMALS),
    mcbAddress,
    usdcAddress,
    mcdexFundationAddress,
    usdcDepoistRate: new BigNumber(usdcDepoistRate.toString()).shiftedBy(-6),
    beginTime: beginTime.toNumber(),
    endTime: endTime.toNumber(),
    unlockTime: unlockTime.toNumber(),
    subscriptionRate: new BigNumber(subscriptionRate.toString()).shiftedBy(-DECIMALS),
    isSubscribable,
    totalSubscribedSupply: new BigNumber(totalSubscribedSupply.toString()).shiftedBy(-DECIMALS),
    totalSubscription: new BigNumber(totalSubscription.toString()).shiftedBy(-DECIMALS),
    isSettleable,
  }
}

export async function getCrowdsaleAccountStorage(contract: McbCrowdsale, address: string, crowdsaleStorage: McbCrowdsaleStorage): Promise<McbCrowdsaleAccountStorage> {
  const [result, isAccountSettled] = await Promise.all([
    contract.subscriptionOf(address),
    contract.isAccountSettled(address),
  ])
  const subscriptionAmount = new BigNumber(result.toString()).shiftedBy(-DECIMALS)
  const allocation = subscriptionAmount.times(crowdsaleStorage.subscriptionRate)
  return {
    subscriptionAmount,
    allocation,
    cost: allocation.times(crowdsaleStorage.usdcDepoistRate),
    stakedSATORI: subscriptionAmount.times(crowdsaleStorage.mcbDepositRate),
    stakedUSDC: subscriptionAmount.times(crowdsaleStorage.usdcDepoistRate),
    isAccountSettled,
  }
}

export async function subscribe(contract: McbCrowdsale, collateralAmount: BigNumber, overrides?: PayableOverrides) {
  return contract.subscribe(collateralAmount.shiftedBy(DECIMALS).toString(), overrides)
}

export async function settle(contract: McbCrowdsale, account: string, overrides?: PayableOverrides) {
  return contract.settle(account, overrides)
}

