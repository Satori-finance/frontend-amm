import { AccountStorage, computeAccount, LiquidityPoolStorage } from '@mcdex/mai3.js'
import { MarginAccount } from '@/type'
import { getPerpetualFromID } from './perpetual'
import { toBigNumber } from './bignumberUtil'

export function computeAccountDetails(perpetualId: string, accountStorage: AccountStorage, liquidityPoolStorage: LiquidityPoolStorage, marginAccount?: MarginAccount | null) {
  const { perpetualIndex } = getPerpetualFromID(perpetualId)
  const entryValue = marginAccount && toBigNumber(marginAccount.position).isEqualTo(accountStorage.positionAmount) ? toBigNumber(marginAccount.entryValue) : null
  const entryFunding = marginAccount && toBigNumber(marginAccount.position).isEqualTo(accountStorage.positionAmount) ? toBigNumber(marginAccount.entryFunding) : null
  return computeAccount(liquidityPoolStorage, perpetualIndex, {
    ...accountStorage,
    entryValue,
    entryFunding,
  })
}
