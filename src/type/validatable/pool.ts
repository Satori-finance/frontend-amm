import { BaseInterface, BaseType } from '@/type/baseType'
import gql from 'graphql-tag'
import { defineBignumberMetadata, defineIntMetadata, defineMomentUnixMetadata } from '@/utils/reflect'
import { BignumberString, IntString, MomentString, Perpetual, User, Volume } from '@/type'

export class ShareTokenStruct extends BaseType implements BaseInterface {
  id: string = ''
  @defineBignumberMetadata() totalSupply?: BignumberString = '0'
}

export class PoolStruct extends BaseType implements BaseInterface {
  id: string = ''
  collateralName?: string = ''
  shareAddress?: string = ''
  collateralAddress?: string = ''
  voteAddress?: string = ''
  operatorAddress?: string = ''
  isRun?: boolean = false
  @defineBignumberMetadata() poolMarginUSD?: BignumberString = '0'
  @defineBignumberMetadata() poolMargin?: BignumberString = '0'
  perpetuals?: Array<Perpetual> = []
  shareToken?: ShareTokenStruct = new ShareTokenStruct()
  @defineIntMetadata() liquidityHisCount?: IntString = '0'
  @defineIntMetadata() proposalCount?: IntString = '0'
  governor?: Governor = new Governor()
  @defineBignumberMetadata() operatorExpiration?: BignumberString = '0'
  @defineMomentUnixMetadata() createdAtTimestamp?: MomentString = ''

  /**
   * @ignore
   */
  get operatorIsExpiration(): boolean {
    if (!this.operatorExpiration) {
      return false
    }
    const currentTimestamp = Math.floor(Date.now() / 1000)
    return currentTimestamp >= Number(this.operatorExpiration as string)
  }
}

export class PoolLiquidityData extends BaseType implements BaseInterface {
  id: string = ''
  liquidityPool: string = ''
  @defineBignumberMetadata() poolMargin: BignumberString = '0'
  @defineBignumberMetadata() netAssetValue: BignumberString = '0'
  @defineIntMetadata() timestamp: IntString = '0'
}

export class PoolLiquidityHistory extends BaseType implements BaseInterface {
  id: string = ''
  liquidityPool: PoolStruct = new PoolStruct()
  trader: string = ''
  @defineBignumberMetadata() collateral: BignumberString = '0'
  @defineIntMetadata() type: IntString = '0'
  transactionHash: string = ''
  @defineMomentUnixMetadata() timestamp?: MomentString = ''
}

export class Governor extends BaseType implements BaseInterface {
  id: string = ''
  @defineIntMetadata() proposalCount: IntString = '0'
  @defineBignumberMetadata() totalVotes: BignumberString = '0'
  @defineBignumberMetadata() totalReward: BignumberString = '0'
  @defineBignumberMetadata() rewardRate: BignumberString = '0'
  @defineIntMetadata() periodFinish: IntString = '0'
  proposals?: PoolProposal[] = []
}

export class PoolProposal extends BaseType implements BaseInterface {
  id: string = ''
  governor: Governor = new Governor()
  description: string = ''
  proposer?: User = new User()
  signatures?: string[] = []
  calldatas: string[] = [] // ['0x000'],0x
  isExecuted: boolean = false
  @defineIntMetadata() index: IntString = '0'
  @defineIntMetadata() startBlock: IntString = '0'
  @defineIntMetadata() endBlock: IntString = '0'
  @defineIntMetadata() executedBlockNumber: IntString = '0'
  @defineBignumberMetadata() for: BignumberString = '0'
  @defineBignumberMetadata() against: BignumberString = '0'
  @defineMomentUnixMetadata() timestamp: MomentString = ''
  votes?: Vote[] = []
  state?: number = 0

  startTimestamp?: number = 0
  endTimestamp?: number = 0
}

export class Vote extends BaseType implements BaseInterface {
  id: string = ''
  voter: User = new User()
  support: boolean = false
  @defineBignumberMetadata() votes: BignumberString = '0'
}

export class QueryAllPoolsResult extends BaseType implements BaseInterface {
  static query = gql`
    query {
      poolList: liquidityPools( first: 1000 ) {
        id
        collateralName
        collateralAddress
        shareAddress
        voteAddress
        operatorAddress
        poolMarginUSD
        poolMargin
        operatorExpiration
        isRun
        createdAtTimestamp
        perpetuals(orderBy: symbol, orderDirection: asc) {
          id
          symbol
          underlying
        }
        shareToken {
          id
          totalSupply
        }
        governor {
          id
          proposalCount
          totalVotes
          totalReward
          rewardRate
          periodFinish
        }
      }
    }
  `

  /**
   * @ignore
   */
  get miningPools(): PoolStruct[] {
    let pools: PoolStruct[] = []
    this.poolList.forEach((m) => {
      if (m.governor && Number(m.governor.periodFinish) > 0) {
        pools.push(m)
      }
    })
    return pools
  }


  poolList: PoolStruct[] = []

  convert(): this {
    super.convert()
    this.poolList = this.poolList.map((m) => PoolStruct.fromData(m).convert())
    return this
  }
}

export class QueryPoolBaseInfoResult extends BaseType implements BaseInterface {
  static query = gql`
    query($poolID: String!) {
      poolBaseInfo: liquidityPool(id: $poolID) {
        id
        isRun
        collateralName
        collateralAddress
        voteAddress
        shareAddress
        operatorAddress
        poolMarginUSD
        poolMargin
        perpetuals(orderBy: symbol, orderDirection: asc) {
          id
          symbol
          underlying
          oracleAddress
        }
        governor {
          id
          proposalCount
          totalVotes
          totalReward
          rewardRate
          periodFinish
        }
      }
    }
  `

  poolBaseInfo: PoolStruct = new PoolStruct()

  convert(): this {
    super.convert()
    return this
  }
}

export class QueryPoolsLiquidityHistoryResult extends BaseType implements BaseInterface {
  static genQuery(pools: string[]) {
    let queryPoolsSql = ``
    pools.forEach((val) => {
      queryPoolsSql += `
        ${'pool_' + val.toLowerCase()}: poolDayDatas(
          where: {liquidityPool: "${val.toLowerCase()}", timestamp_gte: $timestamp},
          orderBy: timestamp, orderDirection: desc, first: $row
        ) {
          id
          liquidityPool
          poolMargin
          netAssetValue
          timestamp
        }
      `
    })
    const gqlStr = `query($timestamp: Int!, $row: Int!) {${queryPoolsSql}}`
    return gql(gqlStr)
  }

  data: { [poolAddress: string]: PoolLiquidityData[] } = {}

  convert(): this {
    super.convert()
    Object.keys(this.data).forEach((val) => {
      const poolItem = this.data[val]
      poolItem.forEach((item, index) => {
        this.data[val][index] = PoolLiquidityData.fromData(item).convert()
      })
    })
    return this
  }
}

export class QueryPoolsVolumesHistoryResult extends BaseType implements BaseInterface {
  static genQuery(pools: string[]) {
    let queryPoolsSql = ``
    pools.forEach((val) => {
      queryPoolsSql += `
        ${'pool_' + val.toLowerCase()}: tradeHourDatas(
          where: {timestamp_gte: $beforeTimestamp, perpetual_starts_with: "${val.toLowerCase()}"},
          orderBy: timestamp, orderDirection: desc, first: 1000
        ) {
          volume
          timestamp
        }
      `
    })
    const gqlStr = `query($beforeTimestamp: Int!) {${queryPoolsSql}}`
    return gql(gqlStr)
  }

  data: { [poolAddress: string]: Volume[] } = {}

  convert(): this {
    super.convert()
    Object.keys(this.data).forEach((val) => {
      const poolItem = this.data[val]
      poolItem.forEach((item, index) => {
        this.data[val][index] = Volume.fromData(item).convert()
      })
    })
    return this
  }
}

export class QueryPoolVolumeHistoryResult extends BaseType implements BaseInterface {
  static genQuery(type: 'h' | 'd') {
    const gqlStr = `
      query($beforeTimestamp: Int!, $poolAddress: String!) {
        volumes: ${type === 'd' ? 'tradeDayDatas' : 'tradeHourDatas'}(
          where: { timestamp_gte: $beforeTimestamp, perpetual_starts_with: $poolAddress },
          orderBy: timestamp
          orderDirection: asc
          first: 1000
        ) {
          volume
          timestamp
        }
        pools: liquidityPools(
          where: { id: $poolAddress }
        ) {
            id
            createdAtTimestamp
        }
      }
    `
    return gql(gqlStr)
  }

  volumes: Volume[] = []
  pools: PoolStruct[] = []

  convert(): this {
    super.convert()
    this.volumes = this.volumes.map((m) => Volume.fromData(m).convert())
    this.pools = this.pools.map((m) => PoolStruct.fromData(m).convert())
    return this
  }
}

export class QueryPoolLatestNAVResult extends BaseType implements BaseInterface {
  static query = gql`
    query($poolAddress: String!) {
      poolDayDatas(where: { liquidityPool: $poolAddress }, orderBy: timestamp, orderDirection: desc, first: 1) {
        id
        liquidityPool
        poolMargin
        netAssetValue
        timestamp
      }
    }
  `

  poolDayDatas: PoolLiquidityData[] = []

  convert(): this {
    super.convert()
    this.poolDayDatas = this.poolDayDatas.map((m) => PoolLiquidityData.fromData(m).convert())
    return this
  }
}

export class QueryPoolPerpetualListDetailsResult extends BaseType implements BaseInterface {
  static query = gql`
    query($before24HTimestamp: Int!, $before7DTimestamp: Int!, $poolAddress: String!, $perps: [String!]!) {
      perpetuals: perpetuals(where: { symbol_in: $perps }, orderBy: index, orderDirection: asc) {
        id
        index
        symbol
        underlying
        collateralName
        position
        state
        entryValue
      }
      volumes24H: tradeHourDatas(
        where: { timestamp_gte: $before24HTimestamp, perpetual_starts_with: $poolAddress }
        orderBy: timestamp
        orderDirection: desc
      ) {
        volume
        perpetual {
          id
          symbol
        }
        timestamp
      }
      volumes7D: tradeHourDatas(
        where: { timestamp_gte: $before7DTimestamp, perpetual_starts_with: $poolAddress }
        orderBy: timestamp
        orderDirection: desc
      ) {
        volume
        perpetual {
          id
          symbol
        }
        timestamp
      }
    }
  `

  perpetuals: Perpetual[] = []
  volumes24H: Volume[] = []
  volumes7D: Volume[] = []

  convert(): this {
    super.convert()
    this.perpetuals = this.perpetuals.map((m) => Perpetual.fromData(m).convert())
    this.volumes24H = this.volumes24H.map((m) => Volume.fromData(m).convert())
    this.volumes7D = this.volumes7D.map((m) => Volume.fromData(m).convert())
    return this
  }
}

export class QueryPoolLiquidityHistoryListResult extends BaseType implements BaseInterface {
  static query = gql`
    query($poolAddress: String!, $skip: Int!, $row: Int!) {
      history: liquidityHistories(
        where: { liquidityPool: $poolAddress }
        orderBy: timestamp
        orderDirection: desc
        skip: $skip
        first: $row
      ) {
        id
        liquidityPool {
          id
          liquidityHisCount
        }
        trader
        collateral
        type
        transactionHash
        timestamp
      }
    }
  `

  history: PoolLiquidityHistory[] = []

  convert(): this {
    super.convert()
    this.history = this.history.map((m) => PoolLiquidityHistory.fromData(m).convert())
    return this
  }
}

export class QueryPoolProposalListResult extends BaseType implements BaseInterface {
  static query = gql`
    query($voteAddress: String!, $skip: Int!, $row: Int!) {
      proposals: proposals(
        where: { governor: $voteAddress }
        orderBy: timestamp
        orderDirection: desc
        skip: $skip
        first: $row
      ) {
        id
        index
        description
        calldatas
        signatures
        isExecuted
        for
        against
        startBlock
        endBlock
        executedBlockNumber
        timestamp
        governor {
          id
          proposalCount
          totalVotes
          totalReward
          rewardRate
          periodFinish
        }
      }
    }
  `

  proposals: PoolProposal[] = []

  convert(): this {
    super.convert()
    this.proposals = this.proposals.map((m) => PoolProposal.fromData(m).convert())
    return this
  }
}

export class QueryPoolHistoryDataResult extends BaseType implements BaseInterface {
  static genQuery(type: 'h' | 'd') {
    const gqlStr = `
      query($beforeTimestamp: Int!, $poolAddress: String!) {
        poolDatas: ${type === 'd' ? 'poolDayDatas' : 'poolHourDatas'}(
          where: { timestamp_gte: $beforeTimestamp, liquidityPool: $poolAddress},
          orderBy: timestamp
          orderDirection: asc
          first: 1000
        ) {
          id
          liquidityPool
          poolMargin
          netAssetValue
          timestamp
        }
      }
    `
    return gql(gqlStr)
  }

  poolDatas: PoolLiquidityData[] = []

  convert(): this {
    super.convert()
    this.poolDatas = this.poolDatas.map((m) => PoolLiquidityData.fromData(m).convert())
    return this
  }
}

export class QueryPoolProposalDetailsResult extends BaseType implements BaseInterface {
  static query = gql`
    query($voteAddress: String!, $index: Int!) {
      proposals: proposals(where: { governor: $voteAddress, index: $index }) {
        id
        index
        description
        signatures
        calldatas
        isExecuted
        for
        against
        startBlock
        endBlock
        executedBlockNumber
        timestamp
        proposer {
          id
        }
        governor {
          id
          proposalCount
          totalVotes
          totalReward
          rewardRate
          periodFinish
        }
        votes {
          id
          voter {
            id
          }
          support
          votes
        }
      }
    }
  `

  proposals: PoolProposal[] = []

  convert(): this {
    super.convert()
    this.proposals = this.proposals.map((m) => PoolProposal.fromData(m).convert())
    return this
  }
}
