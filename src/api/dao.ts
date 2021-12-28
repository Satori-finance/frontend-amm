import { getGraphClient } from '@/utils/graphQL'
import {
  parseQueryCapturedFeeUSDResult,
  parseQueryVaultAssetResult,
  parseQueryDaoPoolAddressResult
} from '@/type/index.validator'

import {
  QueryCapturedFeeUSDResult,
  QueryVaultAssetResult,
  QueryDaoPoolAddressResult
} from '@/type'
import { currentChainConfig } from '@/config/chain'

// export async function queryCapturedValueHistory(
//   beforeTimestamp: number
// ): Promise<QueryCapturedValueHistoryResult> {
//   const graphqlClient = getGraphClient(currentChainConfig.subgraphConfig.dataSubgraph)
//   const result = await graphqlClient.query({
//     query: QueryCapturedValueHistoryResult.genQuery(),
//     variables: {
//       beforeTimestamp,
//     },
//     fetchPolicy: 'network-only',
//   })
//   return parseQueryCapturedValueHistoryResult(result.data)
// }

export async function queryCapturedFeeUSD(
  factoryId: string,
  blockNumber?: number,
  subgraph?: string,
): Promise<QueryCapturedFeeUSDResult> {
  const graphqlClient = getGraphClient(subgraph || currentChainConfig.subgraphConfig.daoSubgraph)
  const result = await graphqlClient.query({
    query: QueryCapturedFeeUSDResult.genQuery(blockNumber),
    variables: {
      factoryId,
    },
    fetchPolicy: 'network-only',
  })
  return parseQueryCapturedFeeUSDResult(result.data)
}

export async function queryDaoPoolAddress(
  factoryId: string,
): Promise<QueryDaoPoolAddressResult> {
  const graphqlClient = getGraphClient(currentChainConfig.subgraphConfig.dataSubgraph)
  const result = await graphqlClient.query({
    query: QueryDaoPoolAddressResult.genQuery(),
    variables: {
      factoryId,
    },
    fetchPolicy: 'network-only',
  })
  return parseQueryDaoPoolAddressResult(result.data)
}

export async function queryVaultAssetResult(subGraph?: string): Promise<QueryVaultAssetResult> {
  const graphqlClient = getGraphClient(subGraph || currentChainConfig.subgraphConfig.dataSubgraph)
  const result = await graphqlClient.query({
    query: QueryVaultAssetResult.query,
    variables: {
    },
    fetchPolicy: 'network-only',
  })
  return parseQueryVaultAssetResult(result.data)
}
