import BigNumber from 'bignumber.js'
import moment from 'moment/moment'
import { _1B, _B_DECIMALS, bigNumberShortenFormat } from '@/utils'
import { LineData, WhitespaceData } from 'lightweight-charts'

export type LightChartDataCallFunc = () => Promise<LineData[]>

export interface LightDataCallRadioGroup {
  label: string
  value: string
  dataCall: LightChartDataCallFunc
  dataType: 'hour' | 'day'
}

export const _NORMAL_DECIMALS = 2

export function defaultChartSize () {
  return { width: 600, height: 300 }
}

export function priceNormalFormatter(price: BigNumber, normalDecimals: number): string {
  return price.toFormat(normalDecimals)
}

export function priceFormatter(price: BigNumber, normalDecimals: number): string {
  return bigNumberShortenFormat(price, normalDecimals)
}

export function priceTitleFormatter(price: BigNumber, normalDecimals: number): string {
  if (price.gte(_1B) || price.lte(_1B.negated())) {
    return `${price.div(_1B).toFixed(_B_DECIMALS)}B`
  }
  return priceNormalFormatter(price, normalDecimals)
}

export function timestampFormat(timestamp: number): string {
  return moment.unix(timestamp).local().format('lll')
}
