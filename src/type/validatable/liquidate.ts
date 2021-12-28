import { BaseInterface, BaseType } from '@/type/baseType'
import { defineBignumberMetadata, defineIntMetadata } from '@/utils/reflect'
import {
  BignumberString,
  IntString,
  Perpetual,
  QueryLiquidateHistoryApiParams,
} from '@/type'
import gql from "graphql-tag"

export class Liquidate extends BaseType implements BaseInterface {
  id: string = ''
  transactionHash: string = ''
  timestamp: string = '0'
  perpetual: Perpetual = new Perpetual()
  trader: string = ''
  liquidator: string = ''
  // 0:liquidate 1：takeOver
  type: number = 0

  @defineBignumberMetadata() penalty: BignumberString = '0'
  @defineBignumberMetadata() amount: BignumberString = '0'
  @defineBignumberMetadata() price: BignumberString = '0'
  @defineBignumberMetadata() markPrice: BignumberString = '0'
  @defineIntMetadata() blockNumber: IntString = ''

  get perpetualID(): string | undefined {
    return this.perpetual.id.toLowerCase()
  }
}

export class QueryLiquidatesResult extends BaseType implements BaseInterface {
  static genQuery(params: QueryLiquidateHistoryApiParams) {
    const gqlStr = `
      query(
        ${params.trader ? '$trader:String,' : ''}
        ${params.startTime ? '$startTime:String,' : ''}
        ${params.endTime ? '$endTime:String,' : ''}
        ${params.perpetualID ? '$perpetual:String' : ''}
        ${params.liquidator ? '$liquidator:String' : ''}
        ${params.pageSize ? '$pageSize:Int' : ''}
        ${params.offset ? '$offset:Int' : ''}
      ) {
        liquidates(
          where: {
            ${params.trader ? 'trader: $trader' : ''}
            ${params.startTime ? 'timestamp_gt: $startTime' : ''}
            ${params.endTime ? 'timestamp_lt: $endTime' : ''}
            ${params.perpetualID ? 'perpetual: $perpetual' : ''}
            ${params.liquidator ? 'liquidator: $liquidator' : ''}
          }
          ${params.offset ? 'skip: $offset' : ''}
          ${params.pageSize ? 'first: $pageSize' : ''}
          orderBy: timestamp
          orderDirection: desc
        ) {
          id,
          amount,
          type,
          price,
          markPrice,
          trader,
          liquidator,
          transactionHash,
          timestamp,
          blockNumber,
          penalty,
          perpetual {
            id
            liqCount
          }
        }
      }
    `
    return gql(gqlStr)
  }
  liquidates: Liquidate[] = [] // possibly empty

  convert(): this {
    super.convert()
    this.liquidates = this.liquidates.map(m =>
      Liquidate.fromData(m).convert()
    )
    return this
  }
}
