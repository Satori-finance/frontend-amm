import { BignumberString } from '@/type/common'
import { BigNumber } from 'bignumber.js'
import { _1 } from '@mcdex/mai3.js'

export function toBigNumber(val: any): BigNumber {
  return val instanceof BigNumber ? val : new BigNumber(val)
}
export function toBigNumbers(val: any[]): BigNumber[] {
  return val.map((t) => toBigNumber(t))
}

export function formatBigNumber(val: any, decimals = 2, round: BigNumber.RoundingMode = BigNumber.ROUND_HALF_UP): string {
  const num = toBigNumber(val)
  if (!num.isNaN() && !num.isFinite()) {
    return '∞'
  }
  return !num.isNaN() ? num.toFormat(decimals, round) : ''
}

export function bigNumberFormatterTruncateByPrecision(
  val: any,
  decimal?: number,
  precision?: number,
  normalDecimals: number = 2,
  round: BigNumber.RoundingMode = BigNumber.ROUND_HALF_UP
): string {
  const newVal = new BigNumber(val)
  if (newVal.isZero()) {
    return newVal.toFixed(normalDecimals)
  }
  const fixedVal = newVal.toFixed(decimal || 2, round)
  const newFixedVal = new BigNumber(fixedVal)
  const minVal = new BigNumber(10**-normalDecimals)
  if (newFixedVal.gte(minVal)) {
    return formatBigNumber(val, normalDecimals, round)
  }
  return formatBigNumberByPrecision(fixedVal, precision)

}

export function formatLiquidity(val: any) {
  const num = toBigNumber(val)
  if (!num.isNaN() && !num.isFinite()) {
    return '∞'
  }
  return !num.isNaN() ? num.toFormat(0, BigNumber.ROUND_DOWN) : ''
}

export function formatBigNumberByPrecision(val: any, precision: number = 5, round = BigNumber.ROUND_HALF_UP) {
  const num = toBigNumber(val)
  if (!num.isNaN() && !num.isFinite()) {
    return '∞'
  }
  if (num.isNaN()) {
    return ''
  }
  const precisionNum = num.precision(precision, round).toFixed()
  const decimals = precisionNum.split('.')[1]?.length || 0
  return num.toFormat(decimals)
}

export function formatPrice(val: any, isInverse: boolean = false) {
  const num = toBigNumber(val)
  return isInverse ? _1.div(num) : num
}

export function formatTradeAmount(val: BignumberString): BigNumber {
  return val instanceof BigNumber ? val.abs() : new BigNumber(val).abs()
}

// 1225.5 3
// 206.30 2
// 26.030 1
// 6.0030 0
// 0.6030 -1
export function magnitude(v: BigNumber): number {
  const t = v.toExponential()
  const s = t.split('e')
  if (s.length == 2) {
    return Number(s[1]) || 0
  }
  return 0
}


export const _1B = new BigNumber(1000000000)
export const _1M = new BigNumber(1000000)
export const _1K = new BigNumber(1000)
export const _B_DECIMALS = 2
export const _M_DECIMALS = 2
export const _K_DECIMALS = 0

export function bigNumberShortenFormat(val: any, normalDecimals: number = 2): string {
  const value = toBigNumber(val)
  if (value.gte(_1B) || value.lte(_1B.negated())) {
    return `${value.div(_1B).toFixed(_B_DECIMALS)}B`
  }
  if (value.gte(_1M) || value.lte(_1M.negated())) {
    return `${value.div(_1M).toFixed(_M_DECIMALS)}M`
  }
  if (value.gte(_1K.times(100))|| value.lte(_1K.times(100).negated())) {
    return `${value.div(_1K).toFixed(_K_DECIMALS)}K`
  }
  return formatBigNumber(value, normalDecimals)
}
