import { getGraphClient } from '@/utils/graphQL'
import {
  parseQueryHistoryTrades
} from '@/type/index.validator'
import { QueryHistoryTrades } from '@/type'
import { currentChainConfig } from '@/config/chain'

export async function queryHistoryTrades(
    userAddr: string,
    beforeHours: number = 24,
): Promise<QueryHistoryTrades> {
    const graphqlClient = getGraphClient(currentChainConfig.subgraphConfig.dataSubgraph)
    const result = (await graphqlClient.query({
        query: QueryHistoryTrades.query,
        variables: {
            userAddr,
            beforeHours
        },
        fetchPolicy: 'network-only'
    })) as any
    return parseQueryHistoryTrades(result.data)
}
