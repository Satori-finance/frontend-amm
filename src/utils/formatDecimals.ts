import BigNumber from 'bignumber.js'
import { BTCTokenSet, ETHTokenSet, USDTokenSet } from '@/config/tokens/tokens'
import { magnitude } from './bignumberUtil'

export interface PerpetualFormatDecimals {
  underlyingAssetFormatDecimals: number
  priceFormatDecimals: number
  inversePriceFormatDecimals: number
  collateralFormatDecimals: number
}

// BTC,   m =  4, price = 33284.1,   position =     1.1234 BTC
// ETH,   m =  3, price =  1347.6,   position =    12.345 ETH
// DOT,   m =  1, price =    16.535, position =    12.456 DOT
// 1/ETH, m = -4, price =  1347.6,   position = $4000.1
class DefaultPerpetualFormatDecimals implements PerpetualFormatDecimals {
  underlyingAssetFormatDecimals: number // position
  priceFormatDecimals: number // price
  inversePriceFormatDecimals: number
  collateralFormatDecimals: number

  constructor(referencePrice: BigNumber) {
    const m = magnitude(referencePrice)
    if (m < 0) {
      this.underlyingAssetFormatDecimals = 0
      this.priceFormatDecimals = Math.max(1, -m + 4)
      this.inversePriceFormatDecimals = Math.max(1, m + 5)
    } else {
      this.underlyingAssetFormatDecimals = m
      this.priceFormatDecimals = Math.max(1, -m + 4)
      this.inversePriceFormatDecimals = Math.max(1, m + 5)
    }
    this.collateralFormatDecimals = 3
  }
}

class USDCollateralFormatDecimals extends DefaultPerpetualFormatDecimals {
  constructor(referencePrice: BigNumber) {
    super(referencePrice)
    this.collateralFormatDecimals = 1
  }
}

class ETHCollateralFormatDecimals extends DefaultPerpetualFormatDecimals {
  constructor(referencePrice: BigNumber) {
    super(referencePrice)
    this.collateralFormatDecimals = 3
  }
}

class BNBCollateralFormatDecimals extends DefaultPerpetualFormatDecimals {
  constructor(referencePrice: BigNumber) {
    super(referencePrice)
    this.collateralFormatDecimals = 2
  }
}

class BTCCollateralFormatDecimals extends DefaultPerpetualFormatDecimals {
  constructor(referencePrice: BigNumber) {
    super(referencePrice)
    this.collateralFormatDecimals = 4
  }
}

export function getPerpetualFormatDecimals(
  collateralAddress: string,
  referencePrice: BigNumber,
): PerpetualFormatDecimals {
  const addr = collateralAddress.toLowerCase()
  if (USDTokenSet.has(addr)) {
    return new USDCollateralFormatDecimals(referencePrice)
  } else if (ETHTokenSet.has(addr)) {
    return new ETHCollateralFormatDecimals(referencePrice)
  } else if (BTCTokenSet.has(addr)) {
    return new BTCCollateralFormatDecimals(referencePrice)
  } else {
    return new DefaultPerpetualFormatDecimals(referencePrice)
  }
}
