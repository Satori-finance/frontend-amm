import { getGraphClient } from '@/utils/graphQL'
import {
  parseQueryLiquidityPoolsResult, parseQueryPerpetualByPoolResult,
  parseQueryPerpetualBySymbolResult,
  parseQueryPerpetualsResult,
  parseQueryPerpVolumeHistoryResult,
  parseQuerySpecifyPerpetualResult,
  QueryLiquidityPoolsResult, QueryPerpetualByPoolResult,
} from '@/type/index.validator'
import {
  QueryPerpetualsResult,
  QueryPerpetualBySymbolResult,
  QueryPerpVolumeHistoryResult,
  QuerySpecifyPerpetualResult
} from '@/type'
import { getBeforeTimestamp } from '@/utils'
import BigNumber from 'bignumber.js'
import { currentChainConfig } from '@/config/chain'

export async function queryPerpetuals({
  search = '',
  subgraphUrl = '',
  searchType = 'all',
  oldBlockNumber = undefined,
}: {
  search: string
  limit?: number
  subgraphUrl?: string
  searchType?: 'all' | 'certified' | 'uncertified'
  oldBlockNumber?: number
}): Promise<QueryPerpetualsResult> {
  // select pool where poolMargin > 0 order by poolMarginUSD desc
  const client = getGraphClient(subgraphUrl || currentChainConfig.subgraphConfig.dataSubgraph)
  const poolsResult = await client.query({
    query: QueryLiquidityPoolsResult.query,
    variables: {
      limit: 1000,
    },
    fetchPolicy: 'network-only',
  })
  const pools = parseQueryLiquidityPoolsResult(poolsResult.data)
  const poolIds = pools.pools.map(p => p.id)

  // select perp where id in poolIds
  const queryData = async (pools: string[], block?: number) => {
    const result = await client.query({
      query: QueryPerpetualsResult.genQuery(block),
      variables: {
        search: search.toUpperCase(),
        limit: 1000,
        startSymbol: searchType === 'uncertified' ? '10000' : '0',
        endSymbol: searchType === 'certified' ? '10000' : '999999',
        pools,
      },
      fetchPolicy: 'network-only',
    })
    return parseQueryPerpetualsResult(result.data)
  }
  const [currentPerpetuals, oldPerpetuals]: [QueryPerpetualsResult, QueryPerpetualsResult | null] = await Promise.all([
    queryData(poolIds),
    oldBlockNumber ? queryData(poolIds, oldBlockNumber) : null,
  ])
  if (oldPerpetuals) {
    currentPerpetuals.perpetuals.forEach(p => {
      p.oldTotalVolumeUSD = (oldPerpetuals.perpetualsMap.get(p.id)?.totalVolumeUSD as BigNumber) || new BigNumber(0)
      p.oldTotalVolume = (oldPerpetuals.perpetualsMap.get(p.id)?.totalVolume as BigNumber) || new BigNumber(0)
    })
  }

  return currentPerpetuals
}

export async function queryPerpetualBySymbol(symbol: string = ''): Promise<QueryPerpetualBySymbolResult> {
  const graphqlClient = getGraphClient(currentChainConfig.subgraphConfig.dataSubgraph)
  const result = await graphqlClient.query({
    query: QueryPerpetualBySymbolResult.query,
    variables: {
      search: symbol,
    },
    fetchPolicy: 'network-only',
  })
  return parseQueryPerpetualBySymbolResult(result.data)
}

export async function queryPerpetualByPool(pool: string = '', blockNumber?: number): Promise<QueryPerpetualByPoolResult> {
  const graphqlClient = getGraphClient(currentChainConfig.subgraphConfig.dataSubgraph)
  const result = await graphqlClient.query({
    query: QueryPerpetualByPoolResult.genQuery(blockNumber),
    variables: {
      pool: pool,
    },
    fetchPolicy: 'network-only',
  })
  return parseQueryPerpetualByPoolResult(result.data)
}

export async function queryPerpVolumeHistory(
  perpetualID: string,
  type: 'h' | 'd',
  beforeTimestamp: number
): Promise<QueryPerpVolumeHistoryResult> {
  const before24HTimestamp: number = getBeforeTimestamp('d')
  const graphqlClient = getGraphClient(currentChainConfig.subgraphConfig.dataSubgraph)
  const result = await graphqlClient.query({
    query: QueryPerpVolumeHistoryResult.genQuery(type),
    variables: {
      perpetualID,
      beforeTimestamp,
      before24HTimestamp,
    },
    fetchPolicy: 'network-only',
  })
  return parseQueryPerpVolumeHistoryResult(result.data)
}

export async function querySpecifyPerpetual(
  perpID: string,
): Promise<QuerySpecifyPerpetualResult> {
  const graphqlClient = getGraphClient(currentChainConfig.subgraphConfig.dataSubgraph)
  const result = await graphqlClient.query({
    query: QuerySpecifyPerpetualResult.query,
    variables: {
      perpID,
    },
    fetchPolicy: 'network-only',
  })
  return parseQuerySpecifyPerpetualResult(result.data)
}
