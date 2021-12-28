import { getGraphClient } from '@/utils/graphQL'
import {
  parseQueryPriceStatusResult,
} from '@/type/index.validator'
import { QueryPriceStatusResult } from '@/type'
import { currentChainConfig } from '@/config/chain'

export async function queryPriceStatus(
  perpID: string,
  oracleID: string,
  before24hTimestamp: number,
  accBefore8hTimestamp: number
): Promise<QueryPriceStatusResult> {
  const graphqlClient = getGraphClient(currentChainConfig.subgraphConfig.dataSubgraph)
  const result = (await graphqlClient.query({
    query: QueryPriceStatusResult.query,
    variables: {
      perpID: perpID.toLowerCase(),
      oracleID: oracleID.toLowerCase(),
      before24hTimestamp,
      accBefore8hTimestamp
    },
    fetchPolicy: 'network-only'
  })) as any

  return parseQueryPriceStatusResult(result.data)
}
