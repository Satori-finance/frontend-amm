import BigNumber from 'bignumber.js'

export interface McbCrowdsaleStorage {
  maxSupply: BigNumber
  mcbDepositRate: BigNumber
  mcbAddress: string
  usdcAddress: string
  mcdexFundationAddress: string
  usdcDepoistRate: BigNumber
  beginTime: number
  endTime: number
  unlockTime: number
  subscriptionRate: BigNumber
  isSubscribable: boolean
  totalSubscribedSupply: BigNumber
  totalSubscription: BigNumber
  isSettleable: boolean
}

export interface McbCrowdsaleAccountStorage {
  subscriptionAmount: BigNumber
  allocation: BigNumber
  cost: BigNumber
  stakedSATORI: BigNumber
  stakedUSDC: BigNumber
  isAccountSettled: boolean
}
