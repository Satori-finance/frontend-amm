import { BaseInterface, BaseType } from '@/type/baseType'
import gql from 'graphql-tag'
import { defineBignumberMetadata } from '@/utils/reflect'
import { BignumberString } from '@/type'

export class BalancerPool extends BaseType implements BaseInterface {
  id: string = ''
  address: string = ''
  @defineBignumberMetadata() totalLiquidity: BignumberString = '0'
  @defineBignumberMetadata() totalSwapFee: BignumberString = '0'
  tokens: BalancerPoolToken[] = []
}

export class BalancerPoolToken extends BaseType implements BaseInterface {
  id: string = ''
  symbol: string = ''
  address: string = ''
  @defineBignumberMetadata() balance: BignumberString = '0'
}

export class QueryBalancerMiningPoolInfoResult extends BaseType implements BaseInterface {
  static query = gql`
    query($poolAddress: String!) {
      pools: pools(where: { address: $poolAddress }) {
        id
        address
        totalLiquidity
        totalSwapFee
        tokens {
          id
          symbol
          address
          balance
        }
      }
    }
  `

  pools: BalancerPool[] = []

  convert(): this {
    super.convert()
    this.pools = this.pools.map((m) => BalancerPool.fromData(m).convert())
    return this
  }
}
