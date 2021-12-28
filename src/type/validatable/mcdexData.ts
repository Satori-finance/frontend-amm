import { BaseInterface, BaseType } from '@/type/baseType'
import gql from 'graphql-tag'
import { defineBignumberMetadata, defineIntMetadata } from '@/utils/reflect'
import { BignumberString, IntString } from '@/type'

export class McdexData extends BaseType implements BaseInterface {
  id: string = ''
  @defineIntMetadata() timestamp: IntString = '0'
  @defineBignumberMetadata() totalValueLockedUSD: BignumberString = '0'
  @defineBignumberMetadata() totalVolumeUSD: BignumberString = '0'
}

export class QueryMcdexDataResult extends BaseType implements BaseInterface {
  static genQuery(type: 'h' | 'd') {
    const gqlStr = `
      query($beforeTimestamp: Int!) {
        mcdexDatas: ${type === 'd' ? 'mcdexDayDatas' : 'mcdexHourDatas'}(
          where: { timestamp_gte: $beforeTimestamp },
          orderBy: timestamp
          orderDirection: asc
          first: 1000
        ) {
          id
          timestamp
          totalValueLockedUSD
          totalVolumeUSD
        }
      }
    `
    return gql(gqlStr)
  }

  mcdexDatas: McdexData[] = []

  convert(): this {
    super.convert()
    this.mcdexDatas = this.mcdexDatas.map((m) => McdexData.fromData(m).convert())
    return this
  }
}
