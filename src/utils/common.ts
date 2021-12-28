import moment, { LongDateFormatKey, Moment } from 'moment'
import { InvalidArgumentError } from '@mcdex/mai3.js'
import { fleekIpfsReadApi } from '@/config/ipfs'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { estimateBlockTime } from '@/utils/chain'

export function copyToClipboard(text: string | number) {
  const content = text.toString()
  if (!content) return
  const createInput = document.createElement('input')
  createInput.value = content
  document.body.appendChild(createInput)
  createInput.select()
  document.execCommand('Copy')
  createInput.remove()
  return true
}

export function ellipsisMiddle(str: string | number, leftNum = 6, rightNum = 4) {
  const newStr = str.toString()
  if (leftNum + rightNum >= newStr.length) return newStr
  return newStr.substr(0, leftNum) + '...' + newStr.substr(-rightNum)
}

export function genMap<K, T>(keys: K[], values: T[]) {
  const map = new Map<K, T>()
  if (keys.length !== values.length) {
    return map
  }
  for (let i = 0; i < keys.length; i++) {
    map.set(keys[i], values[i])
  }
  return map
}

export function padLeft(num: number, size: number): string {
  let ret = num.toString()
  while (ret.length < size) {
    ret = '0' + ret
  }
  return ret
}

export function getBeforeTimestamp(t: 'h' | 'd' | 'w' | 'm', n: number = 1): number {
  const dayTimestamp = 86400
  const currentTimestamp = Math.ceil(Date.now() / 1000)
  if (t === 'h') return currentTimestamp - (dayTimestamp / 24) * n
  if (t === 'd') return currentTimestamp - dayTimestamp * n
  if (t === 'w') return currentTimestamp - dayTimestamp * 7 * n
  if (t === 'm') return currentTimestamp - dayTimestamp * 30 * n
  throw new InvalidArgumentError(`unknown timespan: ${t}`)
}

/*
formatStr:
  LT: 'HH:mm'
  LTS: 'HH:mm:ss'
  L: 'DD/MM/YYYY'
  LL: 'D MMMM YYYY'
  LLL: 'D MMMM YYYY HH:mm'
  LLLL: 'dddd D MMMM YYYY HH:mm'
  'lts' | 'lt' | 'l' | 'll' | 'lll' | 'llll' -> Ditto, abbreviated
*/
export function momentFormatter(dateTime: Moment, formatStr: LongDateFormatKey | string): string {
  return dateTime.format(formatStr)
}

export const nullIfNotDeployed = (err: Error & { code?: string }): null => {
  if (err.code === 'CALL_EXCEPTION') {
    return null
  }
  throw err
}

// interval: second
export function computeDayBlockTotalCount(interval: number): number {
  const dayTimestampTotal = 86400
  return dayTimestampTotal / interval
}

export function formatIPFSUrlLink(hash: string): string {
  return `${fleekIpfsReadApi}${hash}`
}

export function toDecimals(x: BigNumber | string, decimals: number): string {
  return new BigNumber(x).shiftedBy(decimals).toFixed()
}

export function fromDecimals(x: BigNumber | string, decimals: number): string {
  return new BigNumber(x).shiftedBy(-decimals).toFixed()
}

// chart patch missing time point
export function generateTimestampArray(interval: 'day' | 'hour', startTimestamp: number, endTimeStamp: number): number[] {
  const diff = endTimeStamp - startTimestamp
  let isMinixInterval = interval === 'day' ? diff <= 86400 : diff <= 3600
  let startTime = moment.unix(startTimestamp).utc()
  const startIsZero = startTime.minute() === 0 && startTime.second() === 0
  if (!startIsZero) {
    startTime = startTime.set('minute', 0).set('second', 0)
    if (interval === 'day') {
      startTime.endOf(interval).add(1, 'second')
    }
  }
  if (isMinixInterval) {
    return [startTime.add(-1, interval).unix()]
  }
  let result: number[] = []
  while (startTime.unix() <= endTimeStamp) {
    result.push(startTime.unix())
    startTime = startTime.add(1, interval)
  }
  return result
}

export function formatAddress(address: string): string {
  return ethers.utils.getAddress(address)
}

export function getBlockTimestampFromList(blockList: Map<string, string> | null, block: number, currentBlockNumber: number): number {
  return blockList && blockList.has(String(block)) ? blockList.get(block.toString()) as any : estimateBlockTime(currentBlockNumber, block)
}

export function checkAddressLike(address: string) {
  return address.match(/^0x[0-9a-fA-F]{40}$/)
}

export function promiseTimeout<T>(promise: Promise<T>, time: number): Promise<T> {
  const timeout = new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('promise time out'))
    }, time)
  })
  return Promise.race([promise, timeout]).then((value) => {
    return promise
  }, (reason) => {
    return Promise.reject(reason)
  })
}

export function validateImageUrl(url: string) {
  return new Promise<boolean>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve(true)
    }
    img.onerror = () => {
      resolve(false)
    }
    img.src = url
  })
}

export async function getValidImage(urls: string[]): Promise<string | null> {
  for (const url of urls) {
    if (await validateImageUrl(url)) {
      return url
    }
  }
  return null
}
