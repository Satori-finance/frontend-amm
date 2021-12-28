import { getGraphClient } from '@/utils/graphQL'
import {
  parseQueryLiquidatesResult,
  QueryLiquidatesResult,
} from '@/type/index.validator'
import { QueryLiquidateHistoryApiParams } from '@/type'
import { currentChainConfig } from '@/config/chain'

export async function queryLiquidates(
  params: QueryLiquidateHistoryApiParams
): Promise<QueryLiquidatesResult> {
  const graphqlClient = getGraphClient(currentChainConfig.subgraphConfig.dataSubgraph)
  const result = (await graphqlClient.query({
    query: QueryLiquidatesResult.genQuery(params),
    variables: {
      trader: params.trader?.toLowerCase(),
      startTime: params.startTime,
      endTime: params.endTime,
      liquidator: params.liquidator?.toLowerCase(),
      perpetual: params.perpetualID?.toLowerCase(),
      offset: params.offset,
      pageSize: params.pageSize
    },
    fetchPolicy: 'network-only',
  })) as any
  return parseQueryLiquidatesResult(result.data)
}
