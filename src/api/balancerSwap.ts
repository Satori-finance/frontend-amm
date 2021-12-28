import { QueryBalancerMiningPoolInfoResult } from '@/type'
import { getGraphClient } from '@/utils'
import {  parseQueryBalancerMiningPoolInfoResult } from '@/type/index.validator'
import { BalancerGraph } from '@/config/farm'

export async function queryBalancerMiningPoolInfo(
  poolAddress: string
): Promise<QueryBalancerMiningPoolInfoResult> {
  const client = getGraphClient(BalancerGraph)
  const result = (await client.query({
    query: QueryBalancerMiningPoolInfoResult.query,
    variables: {
      poolAddress: poolAddress.toLowerCase()
    },
    fetchPolicy: 'network-only',
  })) as any
  return parseQueryBalancerMiningPoolInfoResult(result.data)
}
