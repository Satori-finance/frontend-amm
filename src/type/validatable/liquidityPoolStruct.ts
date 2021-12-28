import { BaseInterface, BaseType } from '@/type/baseType'
import { BignumberString, Governor, IntString, MomentString, Perpetual, PoolStatus } from '@/type'
import { defineBignumberMetadata, defineIntMetadata, defineMomentUnixMetadata } from '@/utils/reflect'
import gql from 'graphql-tag'

export class LiquidityPoolStruct extends BaseType implements BaseInterface {
  id: string = ''
  collateralName?: string = ''
  collateralAddress?: string = ''
  voteAddress?: string = ''
  shareAddress?: string = ''
  operatorAddress?: string = ''
  perpetuals?: Perpetual[] = []
  isRun?: boolean = false
  governor?: Governor = new Governor()
  @defineBignumberMetadata() operatorExpiration?: BignumberString = '0'

  @defineIntMetadata() collateralDecimals?: IntString = 0
  @defineIntMetadata() liquidityProviderCount?: IntString = 0
  @defineMomentUnixMetadata() createdAtTimestamp?: MomentString = ''
  @defineBignumberMetadata() poolMargin?: BignumberString = ''
  @defineBignumberMetadata() poolMarginUSD?: BignumberString = ''

  /**
   * @ignore
   */
  get status(): PoolStatus {
    return this.isRun ? PoolStatus.Normal : PoolStatus.Initialize
  }

  /**
   * @ignore
   */
  get operatorIsExpiration(): boolean {
    if (!this.operatorExpiration) {
      return false
    }
    const currentTimestamp = Math.floor(Date.now() / 1000)
    return currentTimestamp >= Number(this.operatorExpiration as string)
  }
}

export class QueryLiquidityPoolsResult extends BaseType implements BaseInterface {
  static query = gql`
    query($limit: Int!) {
      pools: liquidityPools(
        where: { poolMargin_gt: 0 },
        orderBy: poolMarginUSD, orderDirection: desc, first: $limit
      ) {
        id
        collateralName
        collateralAddress
        collateralDecimals
        poolMargin
        poolMarginUSD
        createdAtTimestamp
        operatorExpiration
        isRun
        perpetuals {
          id
          symbol
          state
          underlying
        }
      }
    }
  `

  pools: LiquidityPoolStruct[] = []

  convert(): this {
    super.convert()
    this.pools = this.pools.map(item => {
      return LiquidityPoolStruct.fromData(item).convert()
    })
    return this
  }
}

export class QuerySpecifiedPoolsResult extends BaseType implements BaseInterface {
  static query = gql`
    query ($array: [ID!]!) {
      pools: liquidityPools(where: {id_in: $array}) {
        id
        collateralName
        collateralAddress
        collateralDecimals
        shareAddress
        poolMargin
        poolMarginUSD
        createdAtTimestamp
        operatorExpiration
        isRun
        perpetuals {
          id
          symbol
          state
          underlying
        }
        governor {
          id
          proposalCount
          totalVotes
          totalReward
          rewardRate
          periodFinish
        }
      }
    }
  `

  pools: LiquidityPoolStruct[] = []

  convert(): this {
    super.convert()
    this.pools = this.pools.map(item => {
      return LiquidityPoolStruct.fromData(item).convert()
    })
    return this
  }
}


export class QueryPoolsFromGovernorResult extends BaseType implements BaseInterface {
  static query = gql`
    query ($governor: ID!) {
      pools: liquidityPools(where: { governor: $governor }) {
        id
        collateralName
        collateralAddress
        collateralDecimals
        poolMargin
        poolMarginUSD
        createdAtTimestamp
        operatorExpiration
        isRun
        governor {
          id
          proposalCount
          totalVotes
          totalReward
          rewardRate
          periodFinish
        }
      }
    }
  `

  pools: LiquidityPoolStruct[] = []

  convert(): this {
    super.convert()
    this.pools = this.pools.map(item => {
      return LiquidityPoolStruct.fromData(item).convert()
    })
    return this
  }
}
