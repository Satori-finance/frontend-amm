/*
 Some oracle lists
*/

import BigNumber from 'bignumber.js'
import { SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/constants'

export enum OracleVendor {
  Chainlink,
  Band,
  SATORI,
}

export enum OracleType {
  Index,
  Token,
}

export interface OracleInfo {
  underlyingAssetSymbol: string
  priceSymbol: string
  address: string
  vendor: OracleVendor
  type: OracleType
  canTune?: boolean
}

export const SATORIOracleConfigs: { [networkID: number]: string } = {
  [SUPPORTED_NETWORK_ID.ARB]: '0xe9727d80F0A0b8c7372a3e5820b6802FADb1E83B',
  [SUPPORTED_NETWORK_ID.ARB_TESTNET]: '0x87AbDCb02EDF21B22DEB76d1B6872456A326a3d4',
}

/**
 * base mcdex oracle => tunable oracle
 */
export let tunableOracleMap: { [networkId: number]: Map<string, string> } = {}

export let oracleConfigs: { [networkID: number]: OracleInfo[] } = {}

export let registeredOracles: Array<OracleInfo> = []

const registeredOraclesMap: { [key: string]: OracleInfo } = {}
const quoteSet = new Set<string>()

export let registeredOracleQuoteAssetsList: string[] = []

window.SATORI_CONFIG?.onResolve('oracle').then(config => {
  Object.keys(config.tunableOracleMap).forEach(key => {
    tunableOracleMap[Number(key)] = new Map<string, string>(config.tunableOracleMap[key].map((pair: [string, string]) => pair.map(address => address.toLowerCase())))
  })
  oracleConfigs = config.oracles
  registeredOracles = oracleConfigs[TARGET_NETWORK_ID] || []
  registeredOracles.forEach((x) => {
    registeredOraclesMap[x.address.toLowerCase()] = x
    quoteSet.add(x.priceSymbol)
    quoteSet.add(x.underlyingAssetSymbol)
  })
  registeredOracleQuoteAssetsList = Array.from(quoteSet)
})

export function getOracleName(oracle: OracleInfo): string {
  return `${OracleVendor[oracle.vendor]} ${oracle.underlyingAssetSymbol}/${oracle.priceSymbol}`
}

export function getOracleInfo(oracleAddress: string): OracleInfo | null {
  const oracle = registeredOraclesMap[oracleAddress.toLowerCase()]
  return oracle ? oracle : null
}

export function getOracleNameByAddress(oracleAddress: string) {
  const oracle = registeredOraclesMap[oracleAddress.toLowerCase()]
  return oracle ? getOracleName(oracle) : oracleAddress
}

export interface OracleLink {
  oracle: OracleInfo
  inverse: boolean
}

export interface OracleLinkWithTunable extends OracleLink {
  isTunable?: boolean
}

function getLinkDst(l: OracleLink): string {
  return l.inverse ? l.oracle.priceSymbol.toUpperCase() : l.oracle.underlyingAssetSymbol.toUpperCase()
}

let registeredLinks: { [key: string]: OracleLink[] } = {}

function addLink(symbol: string, oracle: OracleInfo) {
  const t = symbol.toUpperCase()
  let s = registeredLinks[t]
  if (!s) {
    s = []
  }
  const inverse = t === oracle.underlyingAssetSymbol.toUpperCase()
  s.push({ oracle, inverse })
  registeredLinks[t] = s
}

function buildLinks() {
  registeredOracles.forEach((oracle) => {
    addLink(oracle.priceSymbol, oracle)
    addLink(oracle.underlyingAssetSymbol, oracle)
  })
}

let isInit = false

export function ensureInitOracle() {
  if (!isInit) {
    addAssets()
    buildLinks()
    isInit = true
  }
}

interface QueueNode {
  symbol: string
  depth: number
  parent?: number
  link?: OracleLink
}

export function findOracleRoutes(src: string, dst: string): OracleLink[][] {
  ensureInitOracle()

  let routeLength: { [key: string]: number } = {} // the shortest length from src to key
  let result: OracleLink[][] = []
  let queue: QueueNode[] = []

  // ETH
  src = src.toUpperCase() === 'WETH' ? 'ETH' : src.toUpperCase()
  dst = dst.toUpperCase() === 'WETH' ? 'ETH' : dst.toUpperCase()

  // BNB
  src = src.toUpperCase() === 'WBNB' ? 'BNB' : src.toUpperCase()
  dst = dst.toUpperCase() === 'WBNB' ? 'BNB' : dst.toUpperCase()

  const srcLinks = registeredLinks[src]
  if (!srcLinks || srcLinks.length === 0) {
    return result
  }
  queue.push({ symbol: src, depth: 0 })
  routeLength[src] = 0

  for (let i = 0; i < queue.length; i++) {
    // early stop: only find the shortest routes
    if (result.length > 0 && queue[i].depth > result[0].length) {
      break
    }

    if (queue[i].symbol === dst) {
      let route: OracleLink[] = []
      for (let j = i; j != 0; j = queue[j].parent || 0) {
        const o = queue[j].link
        if (o === undefined) {
          throw 'bad queue'
        }
        route.unshift(o)
      }
      result.push(route)
      continue
    }
    const links = registeredLinks[queue[i].symbol]
    if (links) {
      links.forEach((l) => {
        const dst = getLinkDst(l)
        if (routeLength[dst] === undefined || routeLength[dst] > queue[i].depth) {
          routeLength[dst] = queue[i].depth + 1
          queue.push({ symbol: getLinkDst(l), parent: i, link: l, depth: queue[i].depth + 1 })
        }
      })
    }
  }

  return result
}

let registeredOracleIndexAssets: string[] = []

function addAssets() {
  const assetsSet = new Set<string>()
  registeredOracles.forEach((x) => {
    const t = x.underlyingAssetSymbol.toUpperCase()
    if (x.type === OracleType.Index && !assetsSet.has(t)) {
      assetsSet.add(t)
    }
  })

  assetsSet.forEach((x) => {
    registeredOracleIndexAssets.push(x)
  })
  registeredOracleIndexAssets = registeredOracleIndexAssets.sort()
}

export function searchRegisteredAssets(query: string): string[] {
  ensureInitOracle()
  if (query === '') {
    return registeredOracleIndexAssets
  }
  let result: string[] = []
  query = query.toUpperCase()
  registeredOracleIndexAssets.forEach((x) => {
    if (x.includes(query)) {
      result.push(x)
    }
  })
  return result
}
