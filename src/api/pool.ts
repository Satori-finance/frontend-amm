import { getGraphClient } from '@/utils/graphQL'
import {
  parseQueryPoolBaseInfoResult,
  parseQueryAllPoolsResult,
  parseQuerySpecifiedPoolsResult,
  parseQueryPoolsLiquidityHistoryResult,
  parseQueryPoolVolumeHistoryResult,
  parseQueryPoolLatestNAVResult,
  parseQueryPoolPerpetualListDetailsResult,
  parseQueryPoolLiquidityHistoryListResult,
  parseQueryPoolProposalListResult,
  parseQueryPoolHistoryDataResult,
  parseQueryPoolsVolumesHistoryResult,
  parseQueryPoolProposalDetailsResult,
  PoolLiquidityData,
  parsePoolLiquidityData,
  parseQueryPoolsFromGovernorResult,
} from '@/type/index.validator'
import {
  QueryAllPoolsResult,
  QuerySpecifiedPoolsResult,
  QueryPoolBaseInfoResult,
  QueryPoolsLiquidityHistoryResult,
  QueryPoolVolumeHistoryResult,
  QueryPoolLatestNAVResult,
  QueryPoolPerpetualListDetailsResult,
  QueryPoolLiquidityHistoryListResult,
  QueryPoolProposalListResult,
  QueryPoolHistoryDataResult,
  QueryPoolsVolumesHistoryResult,
  QueryPoolProposalDetailsResult,
  QueryPoolsFromGovernorResult,
} from '@/type'
import gql from 'graphql-tag'
import { currentChainConfig } from '@/config/chain'

export async function queryAllPools(subgraph?: string): Promise<QueryAllPoolsResult> {
  const graphqlClient = getGraphClient(subgraph || currentChainConfig.subgraphConfig.dataSubgraph)
  const result = await graphqlClient.query({
    query: QueryAllPoolsResult.query,
    variables: {},
    fetchPolicy: 'network-only',
  })
  return parseQueryAllPoolsResult(result.data)
}

export async function querySpecifiedPools(poolIDs: string[] = [], subgraph?: string): Promise<QuerySpecifiedPoolsResult> {
  const graphqlClient = getGraphClient(subgraph || currentChainConfig.subgraphConfig.dataSubgraph)
  const result = await graphqlClient.query({
    query: QuerySpecifiedPoolsResult.query,
    variables: {
      array: poolIDs,
    },
    fetchPolicy: 'network-only',
  })
  return parseQuerySpecifiedPoolsResult(result.data)
}

export async function queryPoolBaseInfo(poolAddress: string): Promise<QueryPoolBaseInfoResult> {
  const graphqlClient = getGraphClient(currentChainConfig.subgraphConfig.dataSubgraph)
  const result = await graphqlClient.query({
    query: QueryPoolBaseInfoResult.query,
    variables: {
      poolID: poolAddress.toLowerCase(),
    },
    fetchPolicy: 'network-only',
  })
  return parseQueryPoolBaseInfoResult(result.data)
}

export async function queryPoolsLiquidityHistory(
  pools: string[],
  timestamp: number,
  row: number = 1000,
  subgraph?: string
): Promise<QueryPoolsLiquidityHistoryResult> {
  const graphqlClient = getGraphClient(subgraph || currentChainConfig.subgraphConfig.dataSubgraph)
  const result = await graphqlClient.query({
    query: QueryPoolsLiquidityHistoryResult.genQuery(pools),
    variables: {
      timestamp,
      row,
    },
    fetchPolicy: 'network-only',
  })
  return parseQueryPoolsLiquidityHistoryResult(result)
}

export async function queryPoolVolumeHistory(
  poolAddress: string,
  type: 'h' | 'd',
  beforeTimestamp: number,
): Promise<QueryPoolVolumeHistoryResult> {
  const graphqlClient = getGraphClient(currentChainConfig.subgraphConfig.dataSubgraph)
  const result = await graphqlClient.query({
    query: QueryPoolVolumeHistoryResult.genQuery(type),
    variables: {
      poolAddress,
      beforeTimestamp,
    },
    fetchPolicy: 'network-only',
  })
  return parseQueryPoolVolumeHistoryResult(result.data)
}

export async function queryPoolLatestNAV(poolAddress: string, subgraph?: string): Promise<QueryPoolLatestNAVResult> {
  const graphqlClient = getGraphClient(subgraph || currentChainConfig.subgraphConfig.dataSubgraph)
  const result = await graphqlClient.query({
    query: QueryPoolLatestNAVResult.query,
    variables: {
      poolAddress,
    },
    fetchPolicy: 'network-only',
  })
  return parseQueryPoolLatestNAVResult(result.data)
}

export function genQueryPoolsNAV(pools: string[]) {
  if (pools.length <= 0) {
    pools = ['nodata'] // avoid graphql synax error
  }
  const fragment = `
      fragment poolDayDataFiled on PoolDayData {
        id
        liquidityPool
        poolMargin
        netAssetValue
        timestamp
      }
    `
  const poolQuery = (pool: string) => `
      POOL_${pool}: poolDayDatas(where: { liquidityPool: "${pool}" }, orderBy: timestamp, orderDirection: desc, first: 1) {
        ...poolDayDataFiled
      }
    `
  const poolsQuery = pools.map(pool => poolQuery(pool)).join('')
  const query = `
      query {
        ${poolsQuery}
      }

      ${fragment}
    `
  return gql(query)
}

export async function queryPoolsLatestNAV(pools: string[]) {
  const graphqlClient = getGraphClient(currentChainConfig.subgraphConfig.dataSubgraph)
  const result = await graphqlClient.query({
    query: genQueryPoolsNAV(pools),
    fetchPolicy: 'network-only',
  })
  const data: PoolLiquidityData[] = []
  for (const key in result.data) {
    if (result.data[key][0]) {
      data.push(parsePoolLiquidityData(result.data[key][0]))
    }
  }
  return data
}

export async function queryPoolPerpetualListDetails(
  poolAddress: string,
  perps: string[],
  before24HTimestamp: number,
  before7DTimestamp: number,
): Promise<QueryPoolPerpetualListDetailsResult> {
  const graphqlClient = getGraphClient(currentChainConfig.subgraphConfig.dataSubgraph)
  const result = await graphqlClient.query({
    query: QueryPoolPerpetualListDetailsResult.query,
    variables: {
      poolAddress,
      perps,
      before24HTimestamp,
      before7DTimestamp,
    },
    fetchPolicy: 'network-only',
  })
  return parseQueryPoolPerpetualListDetailsResult(result.data)
}

export async function queryPoolLiquidityHistoryList(
  poolAddress: string,
  skip: number,
  row: number,
): Promise<QueryPoolLiquidityHistoryListResult> {
  const graphqlClient = getGraphClient(currentChainConfig.subgraphConfig.dataSubgraph)
  const result = await graphqlClient.query({
    query: QueryPoolLiquidityHistoryListResult.query,
    variables: {
      poolAddress,
      skip,
      row,
    },
    fetchPolicy: 'network-only',
  })
  return parseQueryPoolLiquidityHistoryListResult(result.data)
}

export async function queryPoolProposalList(
  voteAddress: string,
  skip: number,
  row: number,
): Promise<QueryPoolProposalListResult> {
  const graphqlClient = getGraphClient(currentChainConfig.subgraphConfig.dataSubgraph)
  const result = await graphqlClient.query({
    query: QueryPoolProposalListResult.query,
    variables: {
      voteAddress: voteAddress.toLowerCase(),
      skip,
      row,
    },
    fetchPolicy: 'network-only',
  })
  return parseQueryPoolProposalListResult(result.data)
}

export async function queryPoolHistoryData(
  poolAddress: string,
  type: 'h' | 'd',
  beforeTimestamp: number,
): Promise<QueryPoolHistoryDataResult> {
  const graphqlClient = getGraphClient(currentChainConfig.subgraphConfig.dataSubgraph)
  const result = await graphqlClient.query({
    query: QueryPoolHistoryDataResult.genQuery(type),
    variables: {
      poolAddress,
      beforeTimestamp,
    },
    fetchPolicy: 'network-only',
  })
  return parseQueryPoolHistoryDataResult(result.data)
}

export async function queryPoolsVolumesHistory(
  pools: string[],
  beforeTimestamp: number,
): Promise<QueryPoolsVolumesHistoryResult> {
  const graphqlClient = getGraphClient(currentChainConfig.subgraphConfig.dataSubgraph)
  const result = await graphqlClient.query({
    query: QueryPoolsVolumesHistoryResult.genQuery(pools),
    variables: {
      beforeTimestamp
    },
    fetchPolicy: 'network-only',
  })
  return parseQueryPoolsVolumesHistoryResult(result)
}

export async function queryPoolProposalDetails(
  voteAddress: string,
  index: number,
): Promise<QueryPoolProposalDetailsResult> {
  const graphqlClient = getGraphClient(currentChainConfig.subgraphConfig.dataSubgraph)
  const result = await graphqlClient.query({
    query: QueryPoolProposalDetailsResult.query,
    variables: {
      voteAddress,
      index,
    },
    fetchPolicy: 'network-only',
  })
  return parseQueryPoolProposalDetailsResult(result.data)
}


export async function queryPoolsFromGovernor(governorAddress: string): Promise<QueryPoolsFromGovernorResult> {
  const graphqlClient = getGraphClient(currentChainConfig.subgraphConfig.dataSubgraph)
  const result = await graphqlClient.query({
    query: QueryPoolsFromGovernorResult.query,
    variables: {
      governor: governorAddress.toLowerCase(),
    },
    fetchPolicy: 'network-only',
  })
  return parseQueryPoolsFromGovernorResult(result.data)
}
