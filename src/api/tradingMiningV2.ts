import {
  QueryAccountTradingMiningInfoResult,
  QueryAccountTradingMiningMultiChainInfoResult,
  QueryTotalTradingMiningInfoResult,
} from '@/type'
import { defaultTradingMiningAPIClient } from '@/api/client'
import {
  parseQueryAccountTradingMiningInfoResult,
  parseQueryAccountTradingMiningMultiChainInfoResult,
  parseQueryTotalTradingMiningInfoResult,
} from '@/type/index.validator'

export async function queryAccountTradingMiningInfo(
  account: string
): Promise<QueryAccountTradingMiningInfoResult> {
  const result = (await defaultTradingMiningAPIClient.request({
    url: '/score',
    params: {
      trader: account.toLowerCase()
    },
    method: 'get',
  })) as any
  return parseQueryAccountTradingMiningInfoResult({ data: result })
}

export async function queryAccountTradingMiningMultiChainInfo(
  account: string
): Promise<QueryAccountTradingMiningMultiChainInfoResult> {
  const result = (await defaultTradingMiningAPIClient.request({
    url: '/multiScore',
    params: {
      trader: account.toLowerCase()
    },
    method: 'get',
  })) as any
  return parseQueryAccountTradingMiningMultiChainInfoResult({ data: result })
}

export async function queryTotalTradingMiningInfo(): Promise<QueryTotalTradingMiningInfoResult> {
  const result = (await defaultTradingMiningAPIClient.request({
    url: '/totalStats',
    params: {},
    method: 'get',
  })) as any
  return parseQueryTotalTradingMiningInfoResult({ data: result })
}
