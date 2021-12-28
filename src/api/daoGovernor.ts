import {
  QueryDaoProposalListResult,
  QueryDaoProposalResultByIndexResult,
  QueryDaoVoteDelegateInfoResult
} from '@/type'
import {
  parseQueryDaoProposalListResult,
  parseQueryDaoProposalResultByIndexResult,
  parseQueryDaoVoteDelegateInfoResult,
} from '@/type/index.validator'
import { currentChainConfig } from '@/config/chain'
import { getGraphClient } from '@/utils'

export async function queryDaoProposalList(
  id: string,
  skip: number,
  row: number,
): Promise<QueryDaoProposalListResult> {
  const daoGraphqlClient = getGraphClient(currentChainConfig.subgraphConfig.daoSubgraph)
  const result = await daoGraphqlClient.query({
    query: QueryDaoProposalListResult.query,
    variables: {
      id: id,
      skip,
      row,
    },
    fetchPolicy: 'network-only',
  })
   return parseQueryDaoProposalListResult(result.data)
}

export async function queryDaoProposalByIndex(index: string): Promise<QueryDaoProposalResultByIndexResult> {
  const daoGraphqlClient = getGraphClient(currentChainConfig.subgraphConfig.daoSubgraph)
  const result = await daoGraphqlClient.query({
    query: QueryDaoProposalResultByIndexResult.query,
    variables: {
      index: index,
    },
    fetchPolicy: 'network-only',
  })
  return parseQueryDaoProposalResultByIndexResult(result.data)
}

export async function queryDaoVoteDelegateInfo(
  accountAddress: string
): Promise<QueryDaoVoteDelegateInfoResult> {
  const daoGraphqlClient = getGraphClient(currentChainConfig.subgraphConfig.daoSubgraph)
  const result = await daoGraphqlClient.query({
    query: QueryDaoVoteDelegateInfoResult.query,
    variables: {
      userAddress: accountAddress.toLowerCase()
    },
    fetchPolicy: 'network-only',
  })
  return parseQueryDaoVoteDelegateInfoResult(result.data)
}
