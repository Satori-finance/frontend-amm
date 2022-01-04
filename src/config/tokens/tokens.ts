/*
 Some token lists
 */

import { TokenInfoItem } from '@/type'
import _ from 'lodash'
import { l1TokenMap, tokenMap } from '@/config/tokenMap'
import { L1_NETWORK_ID, NETWORK_ENV, SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/const'

export const TOKEN_STORAGE_KEY = 'mcdex-token-list'

export let USDTokenSet = new Set()
export let BTCTokenSet = new Set()
export let ETHTokenSet = new Set()
export let BNBTokenSet = new Set()

export function getGeneralizedUppercaseName(address: string): string {
  if (USDTokenSet.has(address.toLowerCase())) {
    return 'USD'
  }

  if (ETHTokenSet.has(address.toLowerCase())) {
    return 'ETH'
  }

  if (BNBTokenSet.has(address.toLowerCase())) {
    return 'BNB'
  }

  if (BTCTokenSet.has(address.toLowerCase())) {
    return 'BTC'
  }

  return ''
}

export interface TokenConfig {
  tokenConfigs: {[network: number]: TokenInfoItem[]}
  chainAllTokenList: TokenInfoItem[]
  l1ChainAllTokenList: TokenInfoItem[]
  l1CollateralTokenWhiteList: TokenInfoItem[]
  collateralTokenWhiteList: TokenInfoItem[]
}

function setupTokenSet(tokenSet: {[networkId: number]: {usd?: string[], eth?: string[], btc?: string[], bnb?: string[]}}) {
  const currentTokenSet = tokenSet[NETWORK_ENV.CHAIN_ID]
  if (currentTokenSet) {
    if (currentTokenSet.usd) {
      currentTokenSet.usd.forEach(address => USDTokenSet.add(address.toLowerCase()))
    }
    if (currentTokenSet.eth) {
      currentTokenSet.eth.forEach(address => ETHTokenSet.add(address.toLowerCase()))
    }
    if (currentTokenSet.btc) {
      currentTokenSet.btc.forEach(address => BTCTokenSet.add(address.toLowerCase()))
    }
    if (currentTokenSet.bnb) {
      currentTokenSet.bnb.forEach(address => BNBTokenSet.add(address.toLowerCase()))
    }
  }
}

export const ETHTokenList: { [networkID: string]: string } = {}

export async function initTokens(): Promise<TokenConfig> {
  const tokenConfig = await window.SATORI_CONFIG?.onResolve('token')
  const tokens = (tokenConfig?.tokens || []) as TokenInfoItem[]
  const tokenSet = tokenConfig?.tokenSet || {}
  const ethTokenList = tokenConfig?.ethTokenList || {}
  const primaryTokens = (tokenConfig?.primaryTokens || []) as TokenInfoItem[]
  setupTokenSet(tokenSet)
  Object.assign(ETHTokenList, ethTokenList)

  let chainAllTokenList: Array<TokenInfoItem> = []
  let l1ChainAllTokenList: Array<TokenInfoItem> = []
  let collateralTokenWhiteList: Array<TokenInfoItem> = []
  let l1CollateralTokenWhiteList: Array<TokenInfoItem> = []

  chainAllTokenList = primaryTokens.filter(t => t.chainId === TARGET_NETWORK_ID) || []
  l1ChainAllTokenList = (primaryTokens.filter(t => t.chainId === L1_NETWORK_ID) || []).concat(tokens.filter(t => t.chainId === SUPPORTED_NETWORK_ID.MAINNET))

  // add logo url
  chainAllTokenList.forEach((item) => {
    const mainnetToken = l1ChainAllTokenList.filter(
      (t) => t.address.toLowerCase() === tokenMap.get(item.address.toLowerCase()),
    )[0]
    if (mainnetToken) {
      item.logoURI = mainnetToken.logoURI
      item.decimals = mainnetToken.decimals
      item.name = mainnetToken.name
    }
  })
  chainAllTokenList = _.unionBy(chainAllTokenList, tokens.filter(t => t.chainId === TARGET_NETWORK_ID),t => t.address.toLowerCase())

  if (L1_NETWORK_ID !== SUPPORTED_NETWORK_ID.MAINNET) {
    l1ChainAllTokenList.forEach((item) => {
      const mainnetToken = l1ChainAllTokenList.filter(
        (t) => t.address.toLowerCase() === l1TokenMap.get(item.address.toLowerCase()),
      )[0]
      if (mainnetToken) {
        item.logoURI = mainnetToken.logoURI
        item.decimals = mainnetToken.decimals
        item.name = mainnetToken.name
      }
    })
  }

  // set collateral token list
  if (TARGET_NETWORK_ID === SUPPORTED_NETWORK_ID.MAINNET) {
    const tokenNameWitheList = ['ETH', 'USDC', 'USDT', 'DAI', 'UNI']
    collateralTokenWhiteList = _.filter(chainAllTokenList, (val: TokenInfoItem) => {
      return tokenNameWitheList.indexOf(val.symbol) > -1
    })
  } else {
    collateralTokenWhiteList = chainAllTokenList.filter((t) => t.symbol !== 'SATORI')
  }

  if (L1_NETWORK_ID === SUPPORTED_NETWORK_ID.MAINNET) {
    const tokenNameWitheList = ['ETH', 'USDC', 'USDT', 'DAI', 'UNI']
    l1CollateralTokenWhiteList = _.filter(l1ChainAllTokenList, (val: TokenInfoItem) => {
      return tokenNameWitheList.indexOf(val.symbol) > -1
    })
  } else {
    l1CollateralTokenWhiteList = l1ChainAllTokenList.filter((t) => t.symbol !== 'SATORI')
  }

  return {
    tokenConfigs: _.groupBy(tokens, 'chainId'),
    chainAllTokenList,
    l1ChainAllTokenList,
    l1CollateralTokenWhiteList,
    collateralTokenWhiteList,
  }
}
