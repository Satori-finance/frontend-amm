import { BaseInterface, BaseType } from '@/type/baseType'
import gql from 'graphql-tag'
import { defineBignumberMetadata, defineIntMetadata } from '@/utils/reflect'
import { BignumberString, IntString, Perpetual } from '@/type'

export class FundingRate extends BaseType implements BaseInterface {
  id: string = ''
  @defineIntMetadata() timestamp: IntString = '0'
  @defineBignumberMetadata() fundingRate: BignumberString = '0'
  perpetual: Perpetual = new Perpetual()
}

function getFundingRateQueryTable(timeGranularity: 'minute' | 'hour'): string {
  switch (timeGranularity) {
    case 'minute':
      return 'fundingRateMinDatas'
    case 'hour':
      return 'fundingRateHourDatas'
    default:
      return 'fundingRateHourDatas'
  }
}

export class QueryPerpFundingRateResult extends BaseType implements BaseInterface {
  static genQuery(timeGranularity: 'minute' | 'hour') {
    const gqlStr = `
      query($from: Int!, $to: Int!, $perpId: String!) {
        fundingRateList: ${getFundingRateQueryTable(timeGranularity)}(
          where: { timestamp_gte: $from, timestamp_lte: $to, perpetual: $perpId },
          orderBy: timestamp
          orderDirection: asc
          first: 1000
        ) {
          id
          timestamp
          fundingRate
          perpetual {
            id
          }
        }
     }
     `
    return gql(gqlStr)
  }

  fundingRateList: FundingRate[] = []

  convert(): this {
    super.convert()
    this.fundingRateList = this.fundingRateList.map((m) => FundingRate.fromData(m).convert())
    return this
  }
}
