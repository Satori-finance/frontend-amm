import Vue from 'vue'
import { BigNumber } from 'bignumber.js'
import {
  bigNumberFormatterTruncateByPrecision,
  bigNumberShortenFormat,
  formatBigNumber,
  formatBigNumberByPrecision,
  formatLiquidity,
  formatPrice,
  formatTradeAmount,
} from '@/utils/bignumberUtil'
import moment, { LongDateFormatKey } from 'moment'
import { etherBrowserAddressUrl, etherBrowserTxURL } from '@/utils/ethers'
import { isLongPosition } from '@/utils/perpetual'
import { momentFormatter, ellipsisMiddle, padLeft } from '@/utils'
import { LEVERAGE_DECIMALS, SUPPORTED_NETWORK_ID } from '@/constants'
import { getOperatorName } from '@/config/operator'
import { getOracleNameByAddress } from '@/config/oracle'
import { getTokenIconUrl } from '@/utils/token'
import { getPoolName } from '@/config/pool'

Vue.filter('bigNumberFormatter', (val: any, decimal?: number, round: BigNumber.RoundingMode = BigNumber.ROUND_HALF_UP) => {
  return formatBigNumber(val, decimal, round)
})

Vue.filter('bigNumberFormatterByPrecision', (val: any, precision?: number) => {
  return formatBigNumberByPrecision(val, precision)
})

Vue.filter('bigNumberFormatterTruncateByPrecision', (
  val: any,
  decimal?: number,
  precision?: number,
  normalDecimals: number = 2,
  round: BigNumber.RoundingMode = BigNumber.ROUND_HALF_UP
) => {
  return bigNumberFormatterTruncateByPrecision(val, decimal, precision, normalDecimals, round)
})

Vue.filter('timestampFormatter', (val: any, format?: LongDateFormatKey | string) => {
  if (val === null) {
    return '-'
  }
  return momentFormatter(moment.unix(val).local(), format || 'LLL')
})

Vue.filter('i18nTimeFormatter', (val: any, lang = 'zh-CN', format?: LongDateFormatKey | 'day' | 'time') => {
  if (val === null) {
    return '-'
  }
  let f = 'LLL'
  if (format === 'day') {
    f = lang === 'zh-CN' ? 'M-D' : 'MMM DD'
  } else if (format === 'time') {
    f = lang === 'zh-CN' ? 'A hh:mm:ss' : 'hh:mm:ss A'
  }
  return momentFormatter(moment.unix(val).local(), f)
})

Vue.filter('datetimeFormatter', (val: any, format?: LongDateFormatKey | string) => {
  if (val === null) {
    return '-'
  }
  return momentFormatter(moment(val).local(), format || 'LLL')
})

Vue.filter('priceFormatter', (val: any, isInverse: boolean) => {
  return formatPrice(val, isInverse)
})

Vue.filter('isLongPosition', (val: BigNumber, isInverse: boolean) => {
  return isLongPosition(val, isInverse)
})

Vue.filter('etherBrowserTxFormatter', (val: string, networkId?: SUPPORTED_NETWORK_ID) => {
  return etherBrowserTxURL(val, networkId)
})

Vue.filter('etherBrowserAddressFormatter', (val: string, networkId?: SUPPORTED_NETWORK_ID) => {
  return etherBrowserAddressUrl(val, networkId)
})

Vue.filter('tradeAmountFormatter', (val: string) => {
  return formatTradeAmount(val)
})

Vue.filter('leverageFormatter', (val: BigNumber) => {
  return formatBigNumber(val, LEVERAGE_DECIMALS, BigNumber.ROUND_UP)
})

Vue.filter('ellipsisMiddle', (val: string, left?: number, right?: number) => {
  return ellipsisMiddle(val, left, right)
})

Vue.filter('liquidityFormatter', (val: any) => {
  return formatLiquidity(val)
})

Vue.filter('perpetualSymbolFormatter', (val: number, size: number = 5) => {
  return val >= 0 ? padLeft(val, size) : ''
})

Vue.filter('operatorNameFormatter', (operator: string) => {
  return getOperatorName(operator)
})

Vue.filter('oracleNameFormatter', (oracle: string) => {
  return getOracleNameByAddress(oracle)
})

Vue.filter('tokenIconUrlFormatter', (symbolOrAddress: string, networkId?: SUPPORTED_NETWORK_ID) => {
  return getTokenIconUrl(symbolOrAddress, networkId)
})

Vue.filter('bigNumberShortenFormat', (val: any, decimal?: number) => {
  return bigNumberShortenFormat(val, decimal)
})

Vue.filter('padLeftFormat', (val: number, len: number = 5) => {
  return padLeft(val, len)
})

Vue.filter('poolNameFormatter', (poolAddress: string) => {
  return getPoolName(poolAddress)
})
