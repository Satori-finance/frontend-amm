import { BaseInterface, BaseType } from '@/type/baseType'
import { defineBignumberMetadata, defineIntMetadata } from '@/utils/reflect'
import { IntString, BignumberString, Perpetual, QueryTradeHistoryApiParams } from '@/type'
import gql from 'graphql-tag'

export class Trader extends BaseType implements BaseInterface {
  id: string = ''
}

export class Trade extends BaseType implements BaseInterface {
  id: string = ''
  transactionHash: string = ''
  isClose: boolean = false
  perpetual: Perpetual = new Perpetual()
  type: number = 0
  trader: Trader = new Trader()
  @defineIntMetadata() timestamp: IntString = '0'
  @defineIntMetadata() logIndex: IntString = '0'
  @defineIntMetadata() blockNumber: IntString = '0'
  @defineBignumberMetadata() amount: BignumberString = '0'
  @defineBignumberMetadata() price: BignumberString = '0'
  @defineBignumberMetadata() pnl: BignumberString | null = null
  @defineBignumberMetadata() fee: BignumberString = '0'

  /**
   * @ignore
   */
  get perpetualID(): string | undefined {
    return this.perpetual.id.toLowerCase()
  }
}

export class QueryTradesResult extends BaseType implements BaseInterface {
  static genQuery(params: QueryTradeHistoryApiParams) {
    const gqlStr = `
      query(
        ${params.userAddress ? '$userAddr:String,' : ''}
        ${params.startTime ? '$startTime:String,' : ''}
        ${params.endTime ? '$endTime:String,' : ''}
        ${params.perpetualID ? '$perpetual:String' : ''}
        ${params.type !== undefined ? '$type:Int' : ''}
        ${params.pageSize ? '$pageSize:Int' : ''}
        ${params.offset ? '$offset:Int' : ''}
      ) {
        trades(
          where: {
            ${params.userAddress ? 'trader: $userAddr' : ''}
            ${params.startTime ? 'timestamp_gt: $startTime' : ''}
            ${params.endTime ? 'timestamp_lt: $endTime' : ''}
            ${params.perpetualID ? 'perpetual: $perpetual' : ''}
            ${params.type !== undefined ? 'type: $type' : ''}
          }
          ${params.offset ? 'skip: $offset' : ''}
          ${params.pageSize ? 'first: $pageSize' : ''}
          orderBy: blockNumber
          orderDirection: desc
        ) {
          id,
          amount,
          price,
          pnl,
          fee,
          transactionHash,
          timestamp,
          blockNumber,
          isClose,
          logIndex,
          type,
          perpetual {
            id
            txCount
            liqCount
          }
          trader {
            id
          }
        }
      }
    `
    return gql(gqlStr)
  }

  trades: Trade[] = [] // possibly empty

  convert(): this {
    super.convert()
    this.trades = this.trades.map(m =>
      Trade.fromData(m).convert(),
    )
    return this
  }
}
