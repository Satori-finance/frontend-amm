import { BaseInterface, BaseType } from '@/type/baseType'
import gql from 'graphql-tag'
import { defineBignumberMetadata, defineIntMetadata } from '@/utils/reflect'
import { BignumberString, IntString, Perpetual } from '@/type'

export class Price extends BaseType implements BaseInterface {
  timestamp = 0
  @defineBignumberMetadata() close: BignumberString = '0'
}

export class Acc extends BaseType implements BaseInterface {
  timestamp = 0
  @defineBignumberMetadata() acc: BignumberString = '0'
}

export class Volume extends BaseType implements BaseInterface {
  @defineBignumberMetadata() volume: BignumberString = '0'
  @defineIntMetadata() timestamp: IntString = '0'
  perpetual?: Perpetual = new Perpetual()
}

export class QueryPriceStatusResult extends BaseType implements BaseInterface {
  static query = gql`
  query($perpID: String!, $oracleID: String!, $before24hTimestamp: Int!, $accBefore8hTimestamp: Int!) {
    perpetuals (
      where: { id: $perpID}
    ) {
      id,
      collateralAddress,
      state,
      lastPrice
    }
    accs: accHourDatas(
      where: { timestamp_lte: $accBefore8hTimestamp, perpetual: $perpID },
      orderBy: timestamp
      orderDirection: desc
      first: 1
    ) {
      timestamp
      acc
    }
    volumes: tradeHourDatas(
      where: { timestamp_gte: $before24hTimestamp, perpetual: $perpID },
      orderBy: timestamp
      orderDirection: desc
    ) {
      volume
      timestamp
    }
  }
  `
  perpetuals: Perpetual[] = [] // possibly empty
  accs: Acc[] = [] // possibly empty
  volumes: Volume[] = [] // possibly empty

  convert(): this {
    super.convert()
    this.perpetuals = this.perpetuals.map(m =>
      Perpetual.fromData(m).convert(),
    )
    this.accs = this.accs.map(m =>
      Acc.fromData(m).convert(),
    )
    this.volumes = this.volumes.map(m =>
      Volume.fromData(m).convert(),
    )
    return this
  }
}
