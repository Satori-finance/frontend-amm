import { BaseInterface, BaseType } from '@/type/baseType'
import { defineBignumberMetadata, defineIntMetadata } from '@/utils/reflect'
import { BignumberString, IntString } from '@/type'
import gql from 'graphql-tag'
import BigNumber from 'bignumber.js'
import { getAddress } from 'ethers/lib/utils'
import { _0 } from '@mcdex/mai3.js'
import { Token } from '@uniswap/sdk-core'
import { SUPPORTED_NETWORK_ID } from '@/constants'
import { ExtendedPool } from '@/type/uniswap'
import { Tick } from '@uniswap/v3-sdk'
import { UNISWAP_V3_USDC } from '@/config/uniswap'
import { toBigNumber } from '@/utils'

export class UniswapPair extends BaseType implements BaseInterface {
  @defineBignumberMetadata() reserve0: BignumberString = '0'
  @defineBignumberMetadata() reserve1: BignumberString = '0'
  @defineBignumberMetadata() reserveUSD: BignumberString = '0'
}

export class UniswapV3Token extends BaseType implements BaseInterface {
  id: string = ''
  symbol: string = ''
  name: string = ''
  @defineIntMetadata() decimals: IntString = '0'
  whitelistPools?: UniswapV3Pool[] = []

  convert(): this {
    super.convert()
    this.whitelistPools = this.whitelistPools ? this.whitelistPools.map(p => UniswapV3Pool.fromData(p).convert()) : []
    return this
  }
}

export class UniswapV3Tick extends BaseType implements BaseInterface {
  id: string = ''
  @defineIntMetadata() tickIdx: IntString = 0
  @defineBignumberMetadata() liquidityNet: BignumberString = '0'
  @defineBignumberMetadata() liquidityGross: BignumberString = '0'
}

export class UniswapV3Pool extends BaseType implements BaseInterface {
  id: string = ''
  token0: UniswapV3Token = new UniswapV3Token()
  token1: UniswapV3Token = new UniswapV3Token()
  @defineBignumberMetadata() token0Price: BignumberString = '0'
  @defineBignumberMetadata() token1Price: BignumberString = '0'
  @defineBignumberMetadata() sqrtPrice: BignumberString = '0'
  @defineBignumberMetadata() liquidity: BignumberString = '0'
  @defineBignumberMetadata() totalValueLockedUSD: BignumberString = '0'
  @defineIntMetadata() tick: IntString | null = null
  @defineIntMetadata() feeTier: IntString = 500
  ticks: UniswapV3Tick[] = []

  /**
   * @ignore
   */
  toPoolWithFeeAmount(networkId: SUPPORTED_NETWORK_ID): ExtendedPool | null {
    const token0 = new Token(networkId, this.token0.id, this.token0.decimals as number, this.token0.symbol)
    const token1 = new Token(networkId, this.token1.id, this.token0.decimals as number, this.token1.symbol)
    const sqrtPrice = (this.sqrtPrice as BigNumber).toFixed()
    const liquidity = (this.liquidity as BigNumber).toFixed()
    const tick = this.tick ? this.tick as number : 0
    const feeTier = this.feeTier as number
    const ticks = this.ticks.map(t => new Tick({
      index: t.tickIdx as number,
      liquidityNet: (t.liquidityNet as BigNumber).toFixed(),
      liquidityGross: (t.liquidityGross as BigNumber).toFixed(),
    }))
    try {
      return new ExtendedPool(this.id, token0, token1, feeTier, sqrtPrice, liquidity, tick, ticks)
    } catch (e) {
      console.warn(e)
      return null
    }
  }

  convert(): this {
    super.convert()
    this.token0 = UniswapV3Token.fromData(this.token0).convert()
    this.token1 = UniswapV3Token.fromData(this.token1).convert()
    this.ticks = this.ticks.map(t => UniswapV3Tick.fromData(t).convert())
    return this
  }
}

export class QueryUniV3PriceResult extends BaseType implements BaseInterface {
  static usdcAddress = UNISWAP_V3_USDC[SUPPORTED_NETWORK_ID.MAINNET].toLowerCase()

  static genQuery(tokens: string[], blockNumber?: number) {
    let gqlStr = `
    {
      usdcToken: token(id: "${QueryUniV3PriceResult.usdcAddress}", ${blockNumber ? `block: {number: ${blockNumber}},` : ''}) {
        ...TokenInfo
      }
      tokens(where: {id_in: [${tokens.filter(t => t !== QueryUniV3PriceResult.usdcAddress).map(t => `"${t.toLowerCase()}"`).join(',')}]}, ${blockNumber ? `block: {number: ${blockNumber}},` : ''}) {
        ...TokenInfo
      }
    }

    fragment TokenInfo on Token {
      id
      symbol
      decimals
      name
      whitelistPools(orderBy: totalValueLockedUSD, orderDirection: desc) {
        id
        token0Price
        token1Price
        token0 {
          id
          symbol
          decimals
          name
        }
        token1 {
          id
          symbol
          decimals
          name
        }
        sqrtPrice
        liquidity
        tick
        feeTier
        totalValueLockedUSD
        ticks(orderBy: tickIdx, orderDirection: asc) {
          id
          tickIdx
          liquidityNet
          liquidityGross
        }
      }
    }
    `
    return gql(gqlStr)
  }

  usdcToken = new UniswapV3Token()
  tokens: UniswapV3Token[] = []

  /**
   * @ignore
   * eg: 1 ETH = 3000 USDC => price 3000
   */
  get priceByUSDC(): Map<string, BigNumber> {
    const priceMap = new Map<string, BigNumber>()
    const usdcAddress = QueryUniV3PriceResult.usdcAddress
    this.usdcToken.whitelistPools?.forEach(p => {
      if (p.token0.id === usdcAddress) {
        if (priceMap.get(p.token1.id)) {
          return
        }
        priceMap.set(p.token1.id, toBigNumber(p.token0Price))
      } else {
        if (priceMap.get(p.token0.id)) {
          return
        }
        priceMap.set(p.token0.id, toBigNumber(p.token1Price))
      }
    })
    return priceMap
  }

  /**
   * @ignore
   * 1 SATORI = 0.006 ETH => price = 0.006
   */
  get tokensPairMap(): Map<string, Map<string, BigNumber>> {
    const pairMap = new Map<string, Map<string, BigNumber>>()
    this.tokens.forEach(token => {
      if (token.id === QueryUniV3PriceResult.usdcAddress) {
        return
      }
      const priceMap = new Map<string, BigNumber>()
      const pool = token.whitelistPools ? token.whitelistPools[0] : null
      if (!pool) {
        return
      }
      if (token.id === pool.token0.id) {
        priceMap.set(pool.token1.id, toBigNumber(pool.token1Price))
      } else {
        priceMap.set(pool.token0.id, toBigNumber(pool.token0Price))
      }
      pairMap.set(token.id, priceMap)
    })
    return pairMap
  }

  /**
   * @ignore
   */
  get tokenPriceMap(): Map<string, BigNumber> {
    const result = new Map<string, BigNumber>()
    this.tokensPairMap.forEach((priceMap, tokenAddress) => {
      priceMap.forEach((priceByQuote, quoteAddress) => {
        const priceByUSDC = result.get(tokenAddress)
        let price
        if (quoteAddress === QueryUniV3PriceResult.usdcAddress) {
          price = priceByQuote
        } else {
          const quoteByUSDCPrice = this.priceByUSDC.get(quoteAddress) || 0
          price = priceByQuote.times(quoteByUSDCPrice)
        }
        if (!priceByUSDC || priceByUSDC.lt(price)) {
          result.set(tokenAddress, price)
        }
      })
    })

    result.set(QueryUniV3PriceResult.usdcAddress, toBigNumber(1))
    return result
  }

  convert(): this {
    super.convert()
    this.usdcToken = UniswapV3Token.fromData(this.usdcToken).convert()
    this.tokens = this.tokens.map(t => UniswapV3Token.fromData(t).convert())
    return this
  }
}

export class QueryTokenPriceResult extends BaseType implements BaseInterface {
  /*
  {
    t_0x1234_0: pairs(where: { token0: 0x1234 }, orderBy: volumeUSD, orderDirection: desc, first: 1) {
      ...pairField
    }
    t_0x1234_1: pairs(where: { token1: 0x1234 }, orderBy: volumeUSD, orderDirection: desc, first: 1) {
      ...pairField
    }
  }
  */
  static genQuery(tokens: string[], blockNumber?: number) {
    let gqlStr = '{'
    for (let token of tokens) {
      getAddress(token) // throw if not an address
      token = token.toLowerCase()
      gqlStr += `
        t_${token}_0: pairs(where: { token0: "${token}" }, ${blockNumber ? `block: {number: ${blockNumber}},` : ''}
        orderBy: volumeUSD, orderDirection: desc, first: 1) {
          reserve0
          reserve1
          reserveUSD
        }
        t_${token}_1: pairs(where: { token1: "${token}" }, ${blockNumber ? `block: {number: ${blockNumber}},` : ''}
        orderBy: volumeUSD, orderDirection: desc, first: 1) {
          reserve0
          reserve1
          reserveUSD
        }
      `
    }
    gqlStr += '}'
    return gql(gqlStr)
  }

  data: { [key: string]: UniswapPair[] } = {}

  /**
   * @ignore
   */
  get tokenPriceMap(): Map<string, BigNumber> {
    const reserveMap = new Map<string, BigNumber>()
    const priceMap = new Map<string, BigNumber>()
    for (let key in this.data) {
      const token = this.data[key]
      if (token.length == 0) {
        continue
      }
      const [dummy, tokenAddress, token01] = key.split('_', 3)
      let price = _0
      let reserve = _0
      if (token01 === '0') {
        reserve = token[0].reserve0 as BigNumber
        price = (token[0].reserveUSD as BigNumber).div(token[0].reserve0).div(2)
      } else if (token01 === '0') {
        reserve = token[0].reserve1 as BigNumber
        price = (token[0].reserveUSD as BigNumber).div(token[0].reserve1).div(2)
      }
      if (reserveMap.get(tokenAddress)?.gt(reserve)) {
        price = priceMap.get(tokenAddress)!
        reserve = reserveMap.get(tokenAddress)!
      }
      priceMap.set(tokenAddress, price)
      reserveMap.set(tokenAddress, reserve)
    }
    return priceMap
  }

  convert(): this {
    super.convert()
    for (let key in this.data) {
      for (let i in this.data[key]) {
        this.data[key][i] = UniswapPair.fromData(this.data[key][i]).convert()
      }
    }
    return this
  }
}

export class QueryUniswapV3PoolsResult extends BaseType implements BaseInterface {
  static query = gql`
  {
    pools(orderBy: totalValueLockedUSD, orderDirection: desc, first: 100) {
      id
      token0 {
        id
        symbol
        name
        decimals
      }
      token1 {
        id
        symbol
        name
        decimals
      }
      token0Price
      token1Price
      sqrtPrice
      liquidity
      tick
      feeTier
      totalValueLockedUSD
      ticks(orderBy: tickIdx, orderDirection: asc) {
        id
        tickIdx
        liquidityNet
        liquidityGross
      }
    }
  }
  `
  pools: UniswapV3Pool[] = []

  convert(): this {
    super.convert()
    this.pools = this.pools.map(p => UniswapV3Pool.fromData(p).convert())
    return this
  }
}

export class QueryUniswapV3PoolsByAddressesResult extends BaseType implements BaseInterface {
  static query = gql`
  query($pools: [String!]) {
    pools(where: {id_in: $pools}) {
      ...Pool
    }
  }

  fragment Pool on Pool {
    id
    token0 {
      id
      symbol
      name
      decimals
    }
    token1 {
      id
      symbol
      name
      decimals
    }
    sqrtPrice
    liquidity
    tick
    feeTier
    totalValueLockedUSD
    ticks(orderBy: tickIdx, orderDirection: asc) {
      id
      tickIdx
      liquidityNet
      liquidityGross
    }
  }
  `
  pools: UniswapV3Pool[] = []

  convert(): this {
    super.convert()
    this.pools = this.pools.map(p => UniswapV3Pool.fromData(p).convert())
    return this
  }
}

export class QueryUniswapV3PoolsByTokenResult extends BaseType implements BaseInterface {
  static query = gql`
  query($token: String!) {
    token0Pools: pools(where: {token0: $token}, orderBy: totalValueLockedUSD, orderDirection: desc) {
      ...Pool
    }
    token1Pools: pools(where: {token1: $token}, orderBy: totalValueLockedUSD, orderDirection: desc) {
      ...Pool
    }
  }

  fragment Pool on Pool {
    id
    token0 {
      id
      symbol
      name
      decimals
    }
    token1 {
      id
      symbol
      name
      decimals
    }
    sqrtPrice
    liquidity
    tick
    feeTier
    totalValueLockedUSD
    ticks(orderBy: tickIdx, orderDirection: asc) {
      id
      tickIdx
      liquidityNet
      liquidityGross
    }
  }
  `
  token0Pools: UniswapV3Pool[] = []
  token1Pools: UniswapV3Pool[] = []

  /**
   * @ignore
   */
  get pools(): UniswapV3Pool[] {
    return new Array<UniswapV3Pool>().concat(this.token0Pools, this.token1Pools)
  }

  convert(): this {
    super.convert()
    this.token0Pools = this.token0Pools.map(p => UniswapV3Pool.fromData(p).convert())
    this.token1Pools = this.token1Pools.map(p => UniswapV3Pool.fromData(p).convert())
    return this
  }
}
