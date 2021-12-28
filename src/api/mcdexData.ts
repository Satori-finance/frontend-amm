import { getGraphClient } from '@/utils/graphQL'
import { parseQueryMcdexDataResult } from '@/type/index.validator'
import {
  QueryMcdexDataResult,
} from '@/type'
import { currentChainConfig } from '@/config/chain'

export async function queryMcdexDatasHistory(
  type: 'h' | 'd',
  beforeTimestamp: number,
  subgraphUrl: string = ''
): Promise<QueryMcdexDataResult> {
  const client = getGraphClient(subgraphUrl || currentChainConfig.subgraphConfig.dataSubgraph)
  const result = await client.query({
    query: QueryMcdexDataResult.genQuery(type),
    variables: {
      beforeTimestamp,
    },
    fetchPolicy: 'network-only',
  })
  return parseQueryMcdexDataResult(result.data)
}
