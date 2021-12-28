import { getGraphClient } from '@/utils/graphQL'
import {
  parseQueryTransactionMiningInfoResult, parseQueryTransactionMiningUserResult,
} from '@/type/index.validator'
import {
  QueryTransactionMiningUserResult,
  QueryTransactionMiningInfoResult,
} from '@/type'
import { _0 } from '@mcdex/mai3.js'
import BigNumber from 'bignumber.js'
import { currentChainConfig } from '@/config/chain'

export async function queryTransactionMiningInfo(subgraphUrl: string): Promise<QueryTransactionMiningInfoResult> {
  const client = getGraphClient(subgraphUrl || currentChainConfig.subgraphConfig.dataSubgraph)
  const result = await client.query({
    query: QueryTransactionMiningInfoResult.query,
    fetchPolicy: 'network-only',
  })
  return parseQueryTransactionMiningInfoResult(result.data)
}

export async function queryTransactionMiningUserInfo(user: string, subgraphUrl: string, oldBlockNumber?: number): Promise<QueryTransactionMiningUserResult> {
  const client = getGraphClient(subgraphUrl || currentChainConfig.subgraphConfig.dataSubgraph)
  const result = await client.query({
    query: QueryTransactionMiningUserResult.genQuery(),
    variables: {
      user,
    },
    fetchPolicy: 'network-only',
  })
  const userInfo = parseQueryTransactionMiningUserResult(result.data)
  if (userInfo.user && oldBlockNumber) {
    const oldResult = await client.query({
      query: QueryTransactionMiningUserResult.genQuery(oldBlockNumber),
      variables: {
        user,
      },
      fetchPolicy: 'network-only',
    })
    const oldUserInfo = parseQueryTransactionMiningUserResult(oldResult.data)
    userInfo.user.oldTotalFee = (oldUserInfo.user?.totalFee || _0) as BigNumber
    userInfo.user.oldTotalEarnSATORI = (oldUserInfo.user?.totalEarnSATORI || _0) as BigNumber
  }
  return userInfo
}
