import { getGraphClient } from '@/utils/graphQL'
import { parseQueryAccountLiquidityPoolResult, parseQueryLiquidityAccountResult } from '@/type/index.validator'
import { QueryAccountLiquidityPoolResult, QueryLiquidityAccountResult } from '@/type'
import { currentChainConfig } from '@/config/chain'

export async function queryAccountLiquidityPool(accountID: string): Promise<QueryAccountLiquidityPoolResult> {
  const graphqlClient = getGraphClient(currentChainConfig.subgraphConfig.dataSubgraph)
  const result = await graphqlClient.query({
    query: QueryAccountLiquidityPoolResult.query,
    variables: {
      accountID: accountID.toLowerCase(),
    },
    fetchPolicy: 'network-only',
  })
  return parseQueryAccountLiquidityPoolResult(result.data)
}

export async function queryLiquidityAccounts(userID: string): Promise<QueryLiquidityAccountResult> {
  const graphqlClient = getGraphClient(currentChainConfig.subgraphConfig.dataSubgraph)
  const result = await graphqlClient.query({
    query: QueryLiquidityAccountResult.query,
    variables: {
      userAddr: userID.toLowerCase(),
    },
    fetchPolicy: 'network-only',
  })
  return parseQueryLiquidityAccountResult(result.data)
}
