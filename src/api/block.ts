import { getGraphClient } from '@/utils/graphQL'
import { QueryChainBlockResult, QueryLatestBlockNumber, QueryTimeStampByBlockNumber } from '@/type'
import {
  parseQueryChainBlockResult, parseQueryLatestBlockNumber,
  parseQueryTimeStampByBlockNumber,
} from '@/type/index.validator'
import { currentChainConfig } from '@/config/chain'

export async function queryBlockByTimestamp(timestamp: number, subgraphUrl = ''): Promise<QueryChainBlockResult> {
  const client = getGraphClient(subgraphUrl || currentChainConfig.subgraphConfig.blockSubgraph)
  const result = await client.query({
    query: QueryChainBlockResult.genQuery(timestamp),
    fetchPolicy: 'network-only',
  })
  return parseQueryChainBlockResult(result.data)
}

export async function queryTimeStampByBlockNumber(blockNumber: Array<number>, subgraphUrl = ''): Promise<QueryTimeStampByBlockNumber> {
  const client = getGraphClient(subgraphUrl || currentChainConfig.subgraphConfig.dataSubgraph)
  const result = await client.query({
    query: QueryTimeStampByBlockNumber.genQuery(blockNumber),
    fetchPolicy: 'network-only',
  })
  return parseQueryTimeStampByBlockNumber(result.data)
}

export async function queryLatestBlockNumber(subgraphName: string, subgraphUrl: string): Promise<QueryLatestBlockNumber> {
  const client = getGraphClient(subgraphUrl)
  const result = await client.query({
    query: QueryLatestBlockNumber.genQuery(subgraphName),
    fetchPolicy: 'network-only',
  })
  return parseQueryLatestBlockNumber(result.data)
}
