import { BaseInterface, BaseType } from '@/type/baseType'
import gql from 'graphql-tag'
import { defineBignumberMetadata, defineIntMetadata } from '@/utils/reflect'
import { BignumberString, IntString } from '@/type'
import moment from 'moment'
import BigNumber from 'bignumber.js'
import { _0, _1 } from '@mcdex/mai3.js'

export class TradePrice extends BaseType implements BaseInterface {
  @defineIntMetadata() timestamp: IntString = '0'
  @defineBignumberMetadata() open: BignumberString = '0'
  @defineBignumberMetadata() close: BignumberString = '0'
  @defineBignumberMetadata() low: BignumberString = '0'
  @defineBignumberMetadata() high: BignumberString = '0'
  @defineBignumberMetadata() volume: BignumberString = '0'
}

// graph data struct
export class OraclePrice extends BaseType implements BaseInterface {
  @defineIntMetadata() timestamp: IntString = '0'
  @defineBignumberMetadata() open: BignumberString = '0'
  @defineBignumberMetadata() close: BignumberString = '0'
  @defineBignumberMetadata() low: BignumberString = '0'
  @defineBignumberMetadata() high: BignumberString = '0'
}

// backend data struct
export  class BackendOraclePriceStruct extends BaseType implements BaseInterface {
  @defineIntMetadata() timestamp: IntString = '0'
  @defineBignumberMetadata() price: BignumberString = '0'
  @defineBignumberMetadata() open: BignumberString = '0'
  @defineBignumberMetadata() close: BignumberString = '0'
  @defineBignumberMetadata() low: BignumberString = '0'
  @defineBignumberMetadata() high: BignumberString = '0'


  /**
   * ignore
   */
  private inversed: boolean = false

  inverse() {
    this.price = _1.div(this.price)
    this.open = _1.div(this.open)
    this.close = _1.div(this.close)
    this.low = _1.div(this.low)
    this.high = _1.div(this.high)
    this.inversed = !this.inversed
  }
}

function getTradeQueryTable(timeGranularity: string): string {
  switch (timeGranularity) {
    case 'day':
      return 'tradeDayDatas'
    case 'sevenDay':
      return 'tradeSevenDayDatas'
    case 'minute15':
      return 'trade15MinDatas'
    default:
      return 'tradeHourDatas'
  }
}

function getOracleQueryTable(timeGranularity: string): string {
  switch (timeGranularity) {
    case 'day':
      return 'priceDayDatas'
    case 'sevenDay':
      return 'priceSevenDayDatas'
    case 'minute15':
      return 'price15MinDatas'
    case 'minute5':
      return 'price5MinDatas'
    case 'minute':
      return 'priceMinDatas'
    default:
      return 'priceHourDatas'
  }
}

export class QueryCandleResult extends BaseType implements BaseInterface {
  // static genQuery(timeGranularity: string) {
  //   const gqlStr = `
  //     query($from: Int!, $to: Int!, $perpID: String!, $oracleID: String!) {
  //       tradePriceCandles: ${getTradeQueryTable(timeGranularity)}(
  //         where: { timestamp_gte: $from, timestamp_lte: $to, perpetual: $perpID },
  //         orderBy: timestamp
  //         orderDirection: asc
  //         first: 999
  //       ) {
  //         timestamp
  //         open
  //         close
  //         low
  //         high
  //         volume
  //       },
  //       oraclePriceCandles: ${getOracleQueryTable(timeGranularity)}(
  //         where: { timestamp_gte: $from, timestamp_lte: $to, oracle: $oracleID },
  //         orderBy: timestamp
  //         orderDirection: asc
  //         first: 999
  //       ) {
  //         timestamp
  //         open
  //         close
  //         low
  //         high
  //       }
  //    }
  //    `
  //   return gql(gqlStr)
  // }

  static genQuery(timeGranularity: string) {
    const gqlStr = `
      query($from: Int!, $to: Int!, $perpID: String!, $oracleID: String!, $limit: Int!) {
        oraclePriceCandles: ${getOracleQueryTable(timeGranularity)}(
          where: { timestamp_gte: $from, timestamp_lte: $to, oracle: $oracleID },
          orderBy: timestamp
          orderDirection: asc
          first: $limit
        ) {
          timestamp
          open
          close
          low
          high
        }
     }
     `
    return gql(gqlStr)
  }

  // tradePriceCandles: TradePrice[] = [] // possibly empty
  oraclePriceCandles: OraclePrice[] = [] // possibly empty

  convert(): this {
    super.convert()
    // this.tradePriceCandles = this.tradePriceCandles.map(m =>
    //   TradePrice.fromData(m).convert()
    // )
    this.oraclePriceCandles = this.oraclePriceCandles.map((m) => OraclePrice.fromData(m).convert())
    return this
  }
}

export class Query24HoursPriceChangeResult extends BaseType implements BaseInterface {
  static genQuery(perpetuals: Array<{ perpetualId: string, oracleAddress: string }>) {
    const yesterdayUnixTime = moment().subtract(1, 'day').unix()
    const genPerpetualQuery = (perpetual: { perpetualId: string, oracleAddress: string }) => {
      return `
      p_${perpetual.perpetualId}_PRICE: priceMinDatas(first: 1, where: {oracle: "${perpetual.oracleAddress}"}, orderBy: timestamp, orderDirection: desc) {
        ...priceDataFields
      }
      p_${perpetual.perpetualId}_ONEDAYPRICE: priceMinDatas(first: 1, where: {oracle: "${perpetual.oracleAddress}", timestamp_gte: ${yesterdayUnixTime}}, orderBy: timestamp, orderDirection: asc) {
        ...priceDataFields
      }
      `
    }
    const gqlStr = `
      query {
        ${perpetuals.map(p => genPerpetualQuery(p)).join('')}
      }
      fragment priceDataFields on PriceMinData {
        timestamp
        open
        close
        low
        high
      }
     `
    return gql(gqlStr)
  }

  /**
   * @ignore
   */
  get priceInfo(): Map<string, { price: BigNumber, change24hRate: BigNumber, price24H: BigNumber }> {
    const priceInfoMap = new Map<string, { price: BigNumber, change24hRate: BigNumber, price24H: BigNumber }>()

    const priceMap = new Map<string, BigNumber>()
    const oneDayPrice = new Map<string, BigNumber>()

    for (const key in this.data) {
      const [, poolAddress, index, type] = key.split('_')
      if (type === 'PRICE') {
        priceMap.set(`${poolAddress}-${index}`, this.data[key][0] ? this.data[key][0].close as BigNumber : _0)
      } else {
        oneDayPrice.set(`${poolAddress}-${index}`, this.data[key][0] ? this.data[key][0].close as BigNumber : _0)
      }
    }

    priceMap.forEach((p, key) => {
      const yesterdayPrice = oneDayPrice.get(key)
      if (yesterdayPrice && !yesterdayPrice.isZero()) {
        priceInfoMap.set(key, {
          price: p,
          change24hRate: p.minus(yesterdayPrice).div(yesterdayPrice),
          price24H: yesterdayPrice,
        })
      }
    })

    return priceInfoMap
  }

  data: { [key: string]: OraclePrice[] } = {}

  convert(): this {
    super.convert()
    for (let key in this.data) {
      for (let i in this.data[key]) {
        this.data[key][i] = OraclePrice.fromData(this.data[key][i]).convert()
      }
    }
    return this
  }
}

export class Query24HoursPriceChangeFromBackendResult extends BaseType implements BaseInterface {
  /**
   * @ignore
   */
  get priceInfo(): Map<string, { price: BigNumber, change24hRate: BigNumber, price24H: BigNumber }> {
    const priceInfoMap = new Map<string, { price: BigNumber, change24hRate: BigNumber, price24H: BigNumber }>()

    const priceMap = new Map<string, BigNumber>()
    const oneDayPrice = new Map<string, BigNumber>()

    for (const key in this.data) {
      const [, poolAddress, index, type] = key.split('_')
      const priceDataList = this.data[key]
      priceMap.set(`${poolAddress}-${index}`, priceDataList[priceDataList.length - 1] ? priceDataList[priceDataList.length - 1].close as BigNumber : _0)
      oneDayPrice.set(`${poolAddress}-${index}`, priceDataList[0] ? priceDataList[0].close as BigNumber : _0)
    }

    priceMap.forEach((p, key) => {
      const yesterdayPrice = oneDayPrice.get(key)
      if (yesterdayPrice && !yesterdayPrice.isZero()) {
        priceInfoMap.set(key, {
          price: p,
          change24hRate: p.minus(yesterdayPrice).div(yesterdayPrice),
          price24H: yesterdayPrice,
        })
      }
    })

    return priceInfoMap
  }

  data: { [key: string]: BackendOraclePriceStruct[] } = {}

  convert(): this {
    super.convert()
    for (let key in this.data) {
      for (let i in this.data[key]) {
        this.data[key][i] = BackendOraclePriceStruct.fromData(this.data[key][i]).convert()
      }
    }
    return this
  }
}

export class QueryCandleFromBackendResult extends BaseType implements BaseInterface {
  candles: BackendOraclePriceStruct[] = []

  convert(): this {
    super.convert()
    this.candles = this.candles.map(item => BackendOraclePriceStruct.fromData(item).convert())
    return this
  }
}
