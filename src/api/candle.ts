import { getGraphClient } from '@/utils/graphQL'
import {
  parseQuery24HoursPriceChangeResult,
  parseQueryCandleResult,
  Query24HoursPriceChangeResult,
  parseQueryCandleFromBackendResult,
  BackendOraclePriceStruct,
  parseQuery24HoursPriceChangeFromBackendResult
} from '@/type/index.validator'
import { QueryCandleFromBackendResult, QueryCandleResult, Query24HoursPriceChangeFromBackendResult } from '@/type'
import { currentChainConfig } from '@/config/chain'
import { defaultOracleChartAPIClient, OracleChartServerAPIClient } from '@/api/client'
import { getBeforeTimestamp } from '@/utils'

function convertResolution(resolution: number, dataFrom: 'graph' | 'backend' = 'graph'): string {
  if (resolution === 60) {
    return 'minute'
  }
  if (resolution === 60 * 5) {
    return dataFrom === 'backend' ? 'minute5' : 'minute5'
  } else if (resolution === 60 * 15) {
    return dataFrom === 'backend' ? '15minute' : 'minute15'
  } else if (resolution === 3600) {
    return 'hour'
  } else if (resolution === 3600 * 24) {
    return 'day'
  } else if (resolution === 3600 * 24 * 7) {
    return dataFrom === 'backend' ? '7day' : 'sevenDay'
  } else {
    throw new Error(`unsupported resolution ${resolution}`)
  }
}

export async function queryCandle(
  resolution: number,
  from: number,
  to: number,
  perpID: string,
  oracleID: string,
  limit: number
): Promise<QueryCandleResult> {
  let query = QueryCandleResult.genQuery(convertResolution(resolution))
  const graphqlClient = getGraphClient(currentChainConfig.subgraphConfig.priceChartSubgraph)
  const result = (await graphqlClient.query({
    query: query,
    variables: {
      from,
      to,
      perpID: perpID.toLowerCase(),
      oracleID: oracleID.toLowerCase(),
      limit,
    },
    fetchPolicy: 'network-only',
  })) as any
  return parseQueryCandleResult(result.data)
}

/**
 * unuseful
 * @param perpetuals
 * @param subgraphUrl
 */
export async function query24HPrice(
  perpetuals: Array<{ perpetualId: string; oracleAddress: string }>,
  subgraphUrl: string = ''
): Promise<Query24HoursPriceChangeResult> {
  if (!perpetuals.length) {
    return new Query24HoursPriceChangeResult()
  }
  const client = getGraphClient(subgraphUrl || currentChainConfig.subgraphConfig.priceChartSubgraph)
  let query = Query24HoursPriceChangeResult.genQuery(perpetuals)
  const result = (await client.query({
    query: query,
    fetchPolicy: 'network-only',
  })) as any
  return parseQuery24HoursPriceChangeResult(result)
}

export async function query24HPriceFromBackend(
  perpetuals: Array<{ perpetualId: string; oracleAddress: string }>,
  oracleApi?: string,
  isInverse: boolean = false,
): Promise<Query24HoursPriceChangeFromBackendResult> {
  const client = oracleApi ? new OracleChartServerAPIClient(oracleApi) : defaultOracleChartAPIClient
  const from = getBeforeTimestamp('d', 1)
  const to = Math.ceil(Date.now() / 1000)
  const requests = perpetuals.map((item) => {
    return client.request({
        url: '/indexPrices',
        params: {
          oracle: item.oracleAddress.toLowerCase(),
          timeMode: 'hour',
          beginTime: from,
          endTime: to
        },
        method: 'get',
      })
  })
  const responses = await Promise.all(requests)
  let result: { [key: string]: BackendOraclePriceStruct[] } = {}
  perpetuals.forEach((item, index) => {
    const key = `p_${item.perpetualId}_PRICE`
    const candels = parseQueryCandleFromBackendResult(responses[index]).candles
    if (isInverse) {
      candels.forEach(item => item.inverse())
    }
    result[key] = candels
  })
  return parseQuery24HoursPriceChangeFromBackendResult({ data: result })
}

export async function queryCandleFromBackend(
  resolution: number,
  from: number,
  to: number,
  oracleID: string
): Promise<QueryCandleFromBackendResult> {
  const result = (await defaultOracleChartAPIClient.request({
    url: '/indexPrices',
    params: {
      oracle: oracleID.toLowerCase(),
      timeMode: convertResolution(resolution),
      beginTime: from,
      endTime: to
    },
    method: 'get',
  })) as any
  return parseQueryCandleFromBackendResult(result)
}

export async function backendOracleServiceStatus(): Promise<boolean> {
  try {
    await defaultOracleChartAPIClient.request({
      url: '/status',
      method: 'get',
    })
    return true
  } catch (e) {
    return false
  }
}
