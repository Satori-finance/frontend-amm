import { getOracleInfo, OracleLink, OracleVendor } from '@/config/oracle'
import { Route } from '@uniswap/v3-sdk'
import { Currency } from '@uniswap/sdk-core'
import BigNumber from 'bignumber.js'

export interface UniswapOracle {
  route: Route<Currency, Currency>
  price: BigNumber
  indexPriceTWAP: number
  markPriceTWAP: number
}

export interface SelectedOracleParams {
  selectedType: 'registered' | 'custom' | 'uniswapV3',
  underlyingSymbol: string,
  oracleRouterPath: OracleLink[] | UniswapOracle
  oracleAddress: string
  quoteSymbol: string
}


export function getOracleTypeName(oracleAddress: string): 'chainlink' | 'band' | 'mcdex' | 'custom' {
  const info = getOracleInfo(oracleAddress)
  if (!info) {
    return 'custom'
  }
  if (info.vendor === OracleVendor.Band) {
    return 'band'
  }
  if (info.vendor === OracleVendor.Chainlink) {
    return 'chainlink'
  }
  if (info.vendor === OracleVendor.SATORI) {
    return 'mcdex'
  }
  return 'custom'
}
