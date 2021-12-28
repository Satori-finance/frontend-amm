import { QuerySushiMiningPoolInfoResult, QuerySushiPairResult } from '@/type'
import { getGraphClient } from '@/utils'
import {  parseQuerySushiMiningPoolInfoResult, parseQuerySushiPairResult } from '@/type/index.validator'
import { SushiSwapExchangeGraph, SushiSwapMiniChefGraph } from '@/config/farm'

export async function querySushiSwapPairInfo(
  pairAddress: string
): Promise<QuerySushiPairResult> {
  const client = getGraphClient(SushiSwapExchangeGraph)
  const result = (await client.query({
    query: QuerySushiPairResult.query,
    variables: {
      pairAddress: pairAddress.toLowerCase()
    },
    fetchPolicy: 'network-only',
  })) as any
  return parseQuerySushiPairResult(result.data)
}

export async function querySushiSwapMiningPoolInfo(
  pairAddress: string
): Promise<QuerySushiMiningPoolInfoResult> {
  const client = getGraphClient(SushiSwapMiniChefGraph)
  const result = (await client.query({
    query: QuerySushiMiningPoolInfoResult.query,
    variables: {
      pairAddress: pairAddress.toLowerCase()
    },
    fetchPolicy: 'network-only',
  })) as any
  return parseQuerySushiMiningPoolInfoResult(result.data)
}
