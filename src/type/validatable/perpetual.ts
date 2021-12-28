import { BaseInterface, BaseType } from '@/type/baseType'
import gql from 'graphql-tag'
import { defineBignumberMetadata, defineIntMetadata, defineMomentUnixMetadata } from '@/utils/reflect'
import { BignumberString, IntString, MomentString, LiquidityPoolStruct, Volume } from '@/type'
import * as _ from 'lodash'
import BigNumber from 'bignumber.js'
import { _0 } from '@mcdex/mai3.js'

export class Perpetual extends BaseType implements BaseInterface {
  id: string = ''
  @defineIntMetadata() index?: IntString = 0
  symbol?: string = ''
  underlying?: string = ''
  state?: number = 0
  oracleAddress?: string = ''
  operatorAddress?: string = ''
  collateralAddress?: string = ''
  liquidityPool?: LiquidityPoolStruct | null = null
  isRun?: boolean = false
  @defineIntMetadata() txCount?: IntString = 0
  @defineIntMetadata() liqCount?: IntString = 0
  @defineIntMetadata() settledAtBlockNumber?: IntString | null = null
  @defineIntMetadata() createdAtBlockNumber?: IntString = 0

  @defineMomentUnixMetadata() createdAtTimestamp?: MomentString = ''
  @defineMomentUnixMetadata() settledAtTimestamp?: MomentString | null = null
  @defineBignumberMetadata() totalFee?: BignumberString = '0'
  @defineBignumberMetadata() lpFee?: BignumberString = '0'
  @defineBignumberMetadata() lastPrice?: BignumberString = '0'
  @defineBignumberMetadata() totalVolume?: BignumberString = '0'
  @defineBignumberMetadata() totalVolumeUSD?: BignumberString = '0'
  @defineBignumberMetadata() position?: BignumberString = '0'
  @defineBignumberMetadata() entryValue?: BignumberString = '0'

  /**
   * @ignore
   */
  oldTotalVolumeUSD?: BigNumber = undefined

  /**
   * @ignore
   */
  oldTotalVolume?: BigNumber = undefined

  /**
   * @ignore
   */
  get deltaTotalVolumeUSD(): BigNumber {
    return this.totalVolumeUSD && this.oldTotalVolumeUSD ? new BigNumber(this.totalVolumeUSD).minus(this.oldTotalVolumeUSD) : _0
  }

  /**
   * @ignore
   */
  get deltaTotalVolume(): BigNumber {
    return this.totalVolume && this.oldTotalVolume ? new BigNumber(this.totalVolume).minus(this.oldTotalVolume) : _0
  }


  convert(): this {
    super.convert()
    if (this.liquidityPool) {
      this.liquidityPool = LiquidityPoolStruct.fromData(this.liquidityPool).convert()
    }
    return this
  }
}

export class QueryPerpetualsResult extends BaseType implements BaseInterface {
  static genQuery(blockNumber?: number) {
    return gql`
      query ($search: String!, $limit: Int!, $startSymbol: String!, $endSymbol: String!, $pools: [String!]) {
        asSymbol: perpetuals(
          where: {
            liquidityPool_in: $pools,
            symbol_contains: $search,
            isRun: true,
            symbol_gte: $startSymbol,
            symbol_lt: $endSymbol
          },
          first: $limit,
          ${blockNumber ? `block: {number: ${blockNumber}},` : ''}
        ) {
          ...perpetualFields
        }
        asCollateral: perpetuals(
          where: {
            liquidityPool_in: $pools,
            collateralName_contains: $search,
            isRun: true,
            symbol_gte: $startSymbol,
            symbol_lt: $endSymbol
          },
          first: $limit,
          ${blockNumber ? `block: {number: ${blockNumber}},` : ''}
        ) {
          ...perpetualFields
        }
        asUnderlying: perpetuals(
          where: {
            liquidityPool_in: $pools,
            underlying_contains: $search,
            isRun: true,
            symbol_gte: $startSymbol,
            symbol_lt: $endSymbol
          },
          first: $limit,
          ${blockNumber ? `block: {number: ${blockNumber}},` : ''}
        ) {
          ...perpetualFields
        }
      }

      fragment perpetualFields on Perpetual {
        id
        isRun
        index
        symbol
        underlying
        state
        oracleAddress
        operatorAddress
        txCount
        settledAtBlockNumber
        createdAtBlockNumber
        createdAtTimestamp
        settledAtTimestamp
        totalFee
        lastPrice
        totalVolume
        totalVolumeUSD
        liquidityPool {
          id
          collateralName
          collateralAddress
          poolMarginUSD
          poolMargin
        }
      }
    `
  }

  asCollateral: Perpetual[] = []
  asSymbol: Perpetual[] = []
  asUnderlying: Perpetual[] = []

  /**
   * @ignore
   */
  get perpetuals() {
    return _.unionBy(this.asCollateral, this.asSymbol, this.asUnderlying, 'id')
  }

  /**
   * @ignore
   */
  get perpetualsMap() {
    const map = new Map<string, Perpetual>()
    this.perpetuals.forEach(p => {
      map.set(p.id, p)
    })
    return map
  }

  convert(): this {
    super.convert()
    this.asCollateral = this.asCollateral.map(m =>
      Perpetual.fromData(m).convert(),
    )
    this.asSymbol = this.asSymbol.map(m =>
      Perpetual.fromData(m).convert(),
    )
    this.asUnderlying = this.asUnderlying.map(m =>
      Perpetual.fromData(m).convert(),
    )
    return this
  }
}

export class QueryPerpetualBySymbolResult extends BaseType implements BaseInterface {
  static query = gql`
    query ($search: String!) {
      perpetuals(where: {symbol: $search}) {
        ...perpetualFiled
      }
    }

    fragment perpetualFiled on Perpetual {
      id
      isRun
      symbol
      state
      oracleAddress
      operatorAddress
      txCount
      settledAtBlockNumber
      createdAtBlockNumber
      createdAtTimestamp
      settledAtTimestamp
      totalFee
      lastPrice
      totalVolume
      totalVolumeUSD
    }
  `
  perpetuals: Perpetual[] = []

  /**
   * @ignore
   */
  get perpetualID(): string | null {
    return this.perpetuals[0]?.id || null
  }

  convert(): this {
    super.convert()
    this.perpetuals = this.perpetuals.map(m =>
      Perpetual.fromData(m).convert(),
    )
    return this
  }
}

export class QueryPerpetualByPoolResult extends BaseType implements BaseInterface {
  static genQuery(blockNumber?: number) {
    return gql`
      query ($pool: String!) {
        perpetuals(
          where: {liquidityPool: $pool},
          ${blockNumber ? `block: {number: ${blockNumber}},` : ''}
        ) {
          ...perpetualFiled
        }
      }

      fragment perpetualFiled on Perpetual {
        id
        isRun
        symbol
        state
        oracleAddress
        operatorAddress
        txCount
        settledAtBlockNumber
        createdAtBlockNumber
        createdAtTimestamp
        settledAtTimestamp
        totalFee
        lastPrice
        totalVolume
        totalVolumeUSD
        lpFee
      }
    `
  }

  perpetuals: Perpetual[] = []

  convert(): this {
    super.convert()
    this.perpetuals = this.perpetuals.map(m =>
      Perpetual.fromData(m).convert(),
    )
    return this
  }
}


export class QueryPerpVolumeHistoryResult extends BaseType implements BaseInterface {
  static genQuery (type: 'h' | 'd') {
    const gqlStr = `
      query($beforeTimestamp: Int!, $perpetualID: String!, $before24HTimestamp: Int!) {
        volumes: ${type==='d'?'tradeDayDatas':'tradeHourDatas'}(
          where: { timestamp_gte: $beforeTimestamp, perpetual: $perpetualID },
          orderBy: timestamp
          orderDirection: asc
          first: 1000
        ) {
          volume
          timestamp
        }

        volumes24h: tradeHourDatas(
          where: { timestamp_gte: $before24HTimestamp, perpetual: $perpetualID },
          orderBy: timestamp
          orderDirection: asc
        ) {
          volume
          timestamp
        }

        perpetuals: perpetuals(
          where: { id: $perpetualID }
        ) {
          id
          createdAtTimestamp
        }
      }
    `
    return gql(gqlStr)
  }

  volumes: Volume[] = []
  volumes24h: Volume[] = []
  perpetuals: Perpetual[] = []

  convert(): this {
    super.convert()
    this.volumes = this.volumes.map(m =>
      Volume.fromData(m).convert()
    )
    this.volumes24h = this.volumes24h.map(m =>
      Volume.fromData(m).convert()
    )
    this.perpetuals = this.perpetuals.map(m =>
      Perpetual.fromData(m).convert()
    )
    return this
  }
}

export class QuerySpecifyPerpetualResult extends BaseType implements BaseInterface {
  static query = gql`
    query($perpID: String!) {
      perpetuals: perpetuals( first: 1, where: { id: $perpID } ) {
        id
        index
        symbol
        underlying
        createdAtTimestamp
      }
    }
  `

  perpetuals: Perpetual[] = []

  convert(): this {
    super.convert()
    this.perpetuals = this.perpetuals.map(m =>
      Perpetual.fromData(m).convert()
    )
    return this
  }
}
