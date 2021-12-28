import { BaseInterface, BaseType } from '@/type/baseType'
import gql from 'graphql-tag'
import { defineBignumberMetadata } from '@/utils/reflect'
import { BignumberString, PoolStruct, User } from '@/type'

export class LiquidityAccount extends BaseType implements BaseInterface {
  id: string = ''
  @defineBignumberMetadata() shareAmount: BignumberString = '0'
  @defineBignumberMetadata() entryPoolMargin: BignumberString = '0'
  @defineBignumberMetadata() entryCollateralAmount: BignumberString = '0'
  liquidityPool?: PoolStruct = new PoolStruct()
  user?: User = new User()
}

export class QueryAccountLiquidityPoolResult extends BaseType implements BaseInterface {
  static query = gql`
    query($accountID: String!) {
      liquidityPools: liquidityAccounts(where: { user: $accountID, shareAmount_gt: 0 }) {
        id
        liquidityPool {
          id
          poolMarginUSD
          poolMargin

          shareToken {
            id
            totalSupply
          }
        }
        shareAmount
        entryPoolMargin
        entryCollateralAmount
      }
    }
  `

  liquidityPools: LiquidityAccount[] = []

  convert(): this {
    super.convert()
    this.liquidityPools = this.liquidityPools.map((m) => LiquidityAccount.fromData(m).convert())
    return this
  }
}

export class QueryLiquidityAccountResult extends BaseType implements BaseInterface {
  static query = gql`
    query($userAddr: String!) {
      liquidityAccounts(first: 1000, where: { user: $userAddr, shareAmount_gt: 0 }) {
        id
        shareAmount
        entryPoolMargin
        entryCollateralAmount
        liquidityPool {
          id
          collateralName
          collateralAddress
          shareAddress
          poolMarginUSD
          governor {
            id
            proposalCount
            totalVotes
            totalReward
            rewardRate
            periodFinish
          }
        }
        user {
          id
        }
      }
    }
  `
  liquidityAccounts: LiquidityAccount[] = []

  convert(): this {
    super.convert()
    this.liquidityAccounts = this.liquidityAccounts.map((m) => LiquidityAccount.fromData(m).convert())
    return this
  }
}
