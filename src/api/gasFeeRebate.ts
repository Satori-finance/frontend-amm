import { QueryAccountGasFeeInfoResult } from '@/type'
import { defaultGasFeeRebateAPIClient } from '@/api/client'
import { parseQueryAccountGasFeeInfoResult } from '@/type/index.validator'

export async function queryAccountGasFeeRebateInfo(
  account: string
): Promise<QueryAccountGasFeeInfoResult> {
  const result = (await defaultGasFeeRebateAPIClient.request({
    url: '/gasFee',
    params: {
      trader: account.toLowerCase()
    },
    method: 'get',
  })) as any
  return parseQueryAccountGasFeeInfoResult({ data: result })
}
