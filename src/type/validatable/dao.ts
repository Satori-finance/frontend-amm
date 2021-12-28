import { BaseInterface, BaseType } from '@/type/baseType'
import gql from 'graphql-tag'
import { BignumberString, IntString, Perpetual } from '@/type'
import { defineBignumberMetadata, defineIntMetadata } from '@/utils/reflect'

// export class CapturedValueInfo extends BaseType implements BaseInterface {
//   @defineBignumberMetadata() capturedValueUSD: BignumberString = '0'
//   @defineIntMetadata() timestamp: IntString = '0'
// }

export class CapturedFeeInfo extends BaseType implements BaseInterface {
  id: string = ''
  @defineBignumberMetadata() totalCapturedUSD: BignumberString = '0'
}

export class liquidityPoolsInfo extends BaseType implements BaseInterface {
  id: string = ''
  liquidityPools: string[] = []
}

export class QueryCapturedFeeUSDResult extends BaseType implements BaseInterface {
  static genQuery(blockNumber?: number) {
    const gqlStr = gql`
      query($factoryId: String!) {
        capturedValues: daos(where: { id: $factoryId }, ${blockNumber ? `block: {number: ${blockNumber}},` : ''},
          first: 1) {
          id
          totalCapturedUSD
        }
      }
    `
    return gqlStr
  }

  capturedValues: CapturedFeeInfo[] = []

  convert(): this {
    super.convert()
    this.capturedValues = this.capturedValues.map((m) => CapturedFeeInfo.fromData(m).convert())
    return this
  }
}

export class QueryDaoPoolAddressResult extends BaseType implements BaseInterface {
  static genQuery() {
    const gqlStr = gql`
      query($factoryId: String!) {
        liquidityPools: factories(where: { id: $factoryId },
          first: 1) {
          id
          liquidityPools
        }
      }
    `
    return gqlStr
  }

  liquidityPools: liquidityPoolsInfo[] = []

  convert(): this {
    super.convert()
    this.liquidityPools = this.liquidityPools.map((m) => liquidityPoolsInfo.fromData(m).convert())
    return this
  }
}

// export class QueryCapturedValueHistoryResult extends BaseType implements BaseInterface {
//   static genQuery() {
//     const gqlStr = `
//       query($beforeTimestamp: Int!) {
//         capturedValues: satoriDaoHourDatas(
//           where: { timestamp_gte: $beforeTimestamp},
//           orderBy: timestamp
//           orderDirection: asc
//         ) {
//           capturedValueUSD
//           timestamp
//         }
//       }
//     `
//     return gql(gqlStr)
//   }
//
//   capturedValues: CapturedValueInfo[] = []
//
//   convert(): this {
//     super.convert()
//     this.capturedValues = this.capturedValues.map((m) => CapturedValueInfo.fromData(m).convert())
//     return this
//   }
// }

