import { getGraphClient } from '@/utils/graphQL'
import {
  parseQueryTradesResult,
} from '@/type/index.validator'
import { QueryTradeHistoryApiParams, QueryTradesResult } from '@/type'
import { currentChainConfig } from '@/config/chain'

export async function queryTrades(
  params: QueryTradeHistoryApiParams
): Promise<QueryTradesResult> {
  const graphqlClient = getGraphClient(currentChainConfig.subgraphConfig.dataSubgraph)
  const result = (await graphqlClient.query({
    query: QueryTradesResult.genQuery(params),
    variables: {
      userAddr: params.userAddress?.toLowerCase(),
      startTime: params.startTime,
      endTime: params.endTime,
      type: params.type,
      perpetual: params.perpetualID?.toLowerCase(),
      offset: params.offset,
      pageSize: params.pageSize,
    },
    fetchPolicy: 'network-only',
  })) as any
  return parseQueryTradesResult(result.data)
}
