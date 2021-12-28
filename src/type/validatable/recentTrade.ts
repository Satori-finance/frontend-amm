import { BaseInterface, BaseType } from '@/type/baseType'
import gql from 'graphql-tag'
import { defineBignumberMetadata } from '@/utils/reflect'
import { BignumberString } from '@/type'
import { Perpetual } from './perpetual'

export class User extends BaseType implements BaseInterface {
  id = ''
}

export class RecentTrade extends BaseType implements BaseInterface {
  trader: User = new User()
  perpetual: Perpetual = new Perpetual()
  @defineBignumberMetadata() amount: BignumberString = '0'
  @defineBignumberMetadata() price: BignumberString = '0'
  @defineBignumberMetadata() timestamp: BignumberString = '0'
  @defineBignumberMetadata() blockNumber: BignumberString = '0'
  transactionHash = ''
}

export class QueryRecentTradesResult extends BaseType implements BaseInterface {
  static initQuery = gql`
    query($perpID: String!, $tradeAmount: Int!, $before24hTimestamp: BigInt!) {
      recentTrades: trades(
        where: { perpetual: $perpID, timestamp_gte: $before24hTimestamp }
        first: $tradeAmount
        orderBy: blockNumber
        orderDirection: desc
      ) {
        perpetual {
            id
        }
        trader {
            id
        }
        amount
        price
        timestamp
        transactionHash
        blockNumber
      }
    }
  `
  static updateQuery = gql`
    query($perpID: String!, $blockNumber: Int!) {
      recentTrades: trades(
        where: { perpetual: $perpID, blockNumber_gt: $blockNumber }
        orderBy: blockNumber
        orderDirection: desc
      ) {
        perpetual {
          id
        }
        trader {
          id
        }
        amount
        price
        timestamp
        transactionHash
        blockNumber
      }
    }
  `

  recentTrades: RecentTrade[] = [] // possibly empty

  convert(): this {
    super.convert()
    this.recentTrades = this.recentTrades.map(m =>
      RecentTrade.fromData(m).convert()
    )
    return this
  }
}
