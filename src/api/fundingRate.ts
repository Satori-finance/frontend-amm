import { getGraphClient } from '@/utils/graphQL'
import { currentChainConfig } from '@/config/chain'
import { QueryPerpFundingRateResult } from '@/type/validatable/fundingRate'
import { parseQueryPerpFundingRateResult } from '@/type/index.validator'

export async function queryPerpFundingRates(
  perpId: string,
  timeGranularity: 'minute' | 'hour',
  from: number,
  to: number
): Promise<QueryPerpFundingRateResult> {
  const graphqlClient = getGraphClient(currentChainConfig.subgraphConfig.dataSubgraph)
  const result = await graphqlClient.query({
    query: QueryPerpFundingRateResult.genQuery(timeGranularity),
    variables: {
      from,
      to,
      perpId
    },
    fetchPolicy: 'network-only',
  })
  return parseQueryPerpFundingRateResult(result.data)
}
