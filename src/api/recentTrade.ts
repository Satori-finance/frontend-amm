import { getGraphClient } from '@/utils/graphQL'
import {
    parseQueryRecentTradesResult
} from '@/type/index.validator'
import { QueryRecentTradesResult } from '@/type'
import { currentChainConfig } from '@/config/chain'

export async function queryInitRecentTrades(
    perpID: string,
    tradeAmount: number,
    before24hTimestamp: number
): Promise<QueryRecentTradesResult> {
  const graphqlClient = getGraphClient(currentChainConfig.subgraphConfig.dataSubgraph)
    const result = (await graphqlClient.query({
        query: QueryRecentTradesResult.initQuery,
        variables: {
            perpID,
            tradeAmount,
            before24hTimestamp
        },
        fetchPolicy: 'network-only'
    })) as any
    return parseQueryRecentTradesResult(result.data)
}

export async function queryUpdateRecentTrades(
  perpID: string,
  blockNumber: number
): Promise<QueryRecentTradesResult> {
  const graphqlClient = getGraphClient(currentChainConfig.subgraphConfig.dataSubgraph)
  const result = (await graphqlClient.query({
    query: QueryRecentTradesResult.updateQuery,
    variables: {
      perpID,
      blockNumber
    },
    fetchPolicy: 'network-only'
  })) as any
  return parseQueryRecentTradesResult(result.data)
}
