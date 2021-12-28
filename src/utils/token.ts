import { L1_NETWORK_ID, SATORI_ASSETS_BASE_URL, SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/constants'
import vuexStore from '@/store'
import { TokenInfoItem } from '@/type'
import { ethers } from 'ethers'

export function getTokenString(tokens: string[]) {
  return tokens.map(t => t.toLowerCase()).join(',')
}

export function fromTokenString(tokenStr: string) {
  return tokenStr.split(',').filter(t => !!t)
}

export function getSymbolIconUrl(symbol: string) {
  return `${SATORI_ASSETS_BASE_URL}src/assets/img/tokens/${symbol}.svg`
}

export function getTokenIconUrl(tokenAddressOrSymbol: string, networkId: SUPPORTED_NETWORK_ID = TARGET_NETWORK_ID) {
  if (!tokenAddressOrSymbol) {
    return undefined
  }

  if (!ethers.utils.isAddress(tokenAddressOrSymbol)) {
    const symbolResult = getSymbolIconUrl(tokenAddressOrSymbol)
    if (symbolResult) {
      return symbolResult
    }
  }

  const tokenConfigs: { [network: number]: TokenInfoItem[] } = vuexStore.getters['token/tokenConfigs']
  switch (tokenAddressOrSymbol.toUpperCase()) {
    case 'ETH':
      tokenAddressOrSymbol = 'WETH'
      break
    case 'BTC':
      tokenAddressOrSymbol = 'WBTC'
      break
  }
  const tokenList = tokenConfigs[networkId]
  const token = tokenList?.find(t => {
    return (t.symbol.toUpperCase() === tokenAddressOrSymbol.toUpperCase()) || (t.address.toLowerCase() === tokenAddressOrSymbol.toLowerCase())
  })
  if (token && token.logoURI) {
    return `${token.logoURI}`
  } else {
    return undefined
  }
}
