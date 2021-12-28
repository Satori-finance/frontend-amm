import {
  parseQueryTokenPriceResult,
  parseQueryUniswapV3PoolsByAddressesResult,
  parseQueryUniswapV3PoolsByTokenResult,
  parseQueryUniswapV3PoolsResult,
  parseQueryUniV3PriceResult,
  QueryUniswapV3PoolsByTokenResult,
  QueryUniswapV3PoolsResult,
  QueryUniV3PriceResult,
} from '@/type/index.validator'
import { QueryTokenPriceResult, QueryUniswapV3PoolsByAddressesResult } from '@/type/validatable/token'
import { getGraphClient } from '@/utils'
import { SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/constants'
import { UNISWAP_V3_GRAPH_URL } from '@/config/uniswap'
import { pancakeClient } from '@/utils/uniswap'
import BigNumber from 'bignumber.js'

export async function queryTokenPrice(tokens: string[], blockNumber?: number, network: SUPPORTED_NETWORK_ID = SUPPORTED_NETWORK_ID.MAINNET): Promise<Map<string, BigNumber>> {
  if (!tokens.length) {
    return new QueryTokenPriceResult().tokenPriceMap
  }
  if (network === SUPPORTED_NETWORK_ID.BSC) {
    const result = await pancakeClient.query({
      query: QueryTokenPriceResult.genQuery(tokens, blockNumber),
      variables: {
        tokens,
      },
      fetchPolicy: 'network-only',
    })

    return parseQueryTokenPriceResult(result).tokenPriceMap
  } else {
    const v3Result = await getGraphClient(UNISWAP_V3_GRAPH_URL[SUPPORTED_NETWORK_ID.MAINNET]).query({
      query: QueryUniV3PriceResult.genQuery(tokens, blockNumber),
      variables: {
        tokens,
      },
      fetchPolicy: 'network-only',
    })
    return parseQueryUniV3PriceResult(v3Result.data).tokenPriceMap
  }
}

export async function queryUniswapV3Pools(): Promise<QueryUniswapV3PoolsResult> {
  const graphqlClient = getGraphClient(UNISWAP_V3_GRAPH_URL[TARGET_NETWORK_ID])
  const result = await graphqlClient.query({
    query: QueryUniswapV3PoolsResult.query,
    variables: {
    },
    fetchPolicy: 'network-only',
  })

  return parseQueryUniswapV3PoolsResult(result.data)
}

export async function queryUniswapV3PoolsByToken(tokenAddress: string): Promise<QueryUniswapV3PoolsByTokenResult> {
  const graphqlClient = getGraphClient(UNISWAP_V3_GRAPH_URL[TARGET_NETWORK_ID])
  const result = await graphqlClient.query({
    query: QueryUniswapV3PoolsByTokenResult.query,
    variables: {
      token: tokenAddress,
    },
    fetchPolicy: 'network-only',
  })

  return parseQueryUniswapV3PoolsByTokenResult(result.data)
}

export async function queryUniswapV3PoolsByAddresses(poolAddresses: string[]): Promise<QueryUniswapV3PoolsByAddressesResult> {
  const graphqlClient = getGraphClient(UNISWAP_V3_GRAPH_URL[TARGET_NETWORK_ID])
  const result = await graphqlClient.query({
    query: QueryUniswapV3PoolsByAddressesResult.query,
    variables: {
      pools: poolAddresses,
    },
    fetchPolicy: 'network-only',
  })

  return parseQueryUniswapV3PoolsByAddressesResult(result.data)
}
