import { getGraphClient } from '@/utils/graphQL'
import {
  parseQueryMarginAccountResult,
} from '@/type/index.validator'
import { QueryMarginAccountResult } from '@/type'
import { currentChainConfig } from '@/config/chain'

export async function queryMarginAccounts(
  userAddr: string
): Promise<QueryMarginAccountResult> {
  const graphqlClient = getGraphClient(currentChainConfig.subgraphConfig.dataSubgraph)
  const result = (await graphqlClient.query({
    query: QueryMarginAccountResult.query,
    variables: {
      userAddr
    },
    fetchPolicy: 'network-only'
  })) as any
  return parseQueryMarginAccountResult(result.data)
}
