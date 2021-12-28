import { BaseInterface, BaseType } from '@/type/baseType'
import { defineBignumberMetadata } from '@/utils/reflect'
import { BignumberString } from '@/type'
import gql from 'graphql-tag'

// arbitrum-exchange graph
export class SushiSwapPair extends BaseType implements BaseInterface {
  id: string = ''
  @defineBignumberMetadata() totalSupply: BignumberString = '0'
  @defineBignumberMetadata() reserveUSD: BignumberString = '0'
}

// arbitrum-minichef graph
export class SushiSwapMiniChef extends BaseType implements BaseInterface {
  id: string = ''
  @defineBignumberMetadata() sushiPerSecond: BignumberString = '0'
  @defineBignumberMetadata() totalAllocPoint: BignumberString = '0'
}

// arbitrum-minichef graph
export class SushiSwapPool extends BaseType implements BaseInterface {
  id: string = ''
  pair: string = ''
  @defineBignumberMetadata() slpBalance: BignumberString = '0'
  @defineBignumberMetadata() allocPoint: BignumberString = '0'
  rewarder: SushiSwapRewarder = new SushiSwapRewarder()
}

// arbitrum-minichef graph
export class SushiSwapRewarder extends BaseType implements BaseInterface {
  id: string = ''
  rewardToken: string = ''
  @defineBignumberMetadata() rewardPerSecond: BignumberString = '0'
}

export class QuerySushiPairResult extends BaseType implements BaseInterface {
  static query = gql`
    query($pairAddress: String!) {
      pairs: pairs(where: { id: $pairAddress }) {
        id
        totalSupply
        reserveUSD
      }
    }
  `

  pairs: SushiSwapPair[] = []

  convert(): this {
    super.convert()
    this.pairs = this.pairs.map((m) => SushiSwapPair.fromData(m).convert())
    return this
  }
}

export class QuerySushiMiningPoolInfoResult extends BaseType implements BaseInterface {
  static query = gql`
    query($pairAddress: String!) {
      miniChefs: miniChefs {
        id
        sushiPerSecond
        totalAllocPoint
      }
      pools: pools(where: { pair: $pairAddress }) {
        id
        pair
        slpBalance
        allocPoint
        rewarder {
          id
          rewardToken
          rewardPerSecond
        }
      }
    }
  `

  miniChefs: SushiSwapMiniChef[] = []
  pools: SushiSwapPool[] = []

  convert(): this {
    super.convert()
    this.miniChefs = this.miniChefs.map((m) => SushiSwapMiniChef.fromData(m).convert())
    this.pools = this.pools.map((m) => SushiSwapPool.fromData(m).convert())
    return this
  }
}
