import { BaseInterface, BaseType } from '@/type/baseType'
import gql from 'graphql-tag'
import { defineBignumberMetadata } from '@/utils/reflect'
import { BignumberString } from '@/type'

export class HistoryTrade extends BaseType implements BaseInterface {
  // contract_name = '' //todo, wait contract
  side = 0
  @defineBignumberMetadata() amount: BignumberString = '0'
  @defineBignumberMetadata() price: BignumberString = '0'
  @defineBignumberMetadata() timestamp: BignumberString = '0'
  // @defineBignumberMetadata() fee: BignumberString = '0'
}

export class QueryHistoryTrades extends BaseType implements BaseInterface {
  static query = gql`
    query($userAddr:ID!, $tradeAmount: Int!) {
       historyTrades: trades(
        where: { trader: $userAddr }
        first: $tradeAmount
        orderBy: timestamp
        orderDirection: desc
      ) {
        side
        amount
        price
        timestamp
      }
    }
  `
  historyTrades: HistoryTrade[] = [] // possibly empty

  convert(): this {
    super.convert()
    this.historyTrades = this.historyTrades.map(m =>
      HistoryTrade.fromData(m).convert()
    )
    return this
  }
}
