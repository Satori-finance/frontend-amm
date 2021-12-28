import { PANCAKE_GRAPH_URL, SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID, UNISWAP_GRAPH_URL } from '@/constants'
import { ApolloClient } from 'apollo-client'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { Currency, Token, WETH9 } from '@uniswap/sdk-core'
import { computePoolAddress, FeeAmount, Pool, Route } from '@uniswap/v3-sdk'
import _ from 'lodash'

export default new ApolloClient({
  link: new HttpLink({ uri: UNISWAP_GRAPH_URL }),
  cache: new InMemoryCache(),
})

export const pancakeClient = new ApolloClient({
  link: new HttpLink({ uri: PANCAKE_GRAPH_URL }),
  cache: new InMemoryCache(),
})

export type ChainTokenList = {
  readonly [chainId: number]: Token[]
}

export const AMPL = new Token(
  SUPPORTED_NETWORK_ID.MAINNET,
  '0xD46bA6D942050d489DBd938a2C909A5d5039A161',
  9,
  'AMPL',
  'Ampleforth',
)

export const DAI: { [chainId: number]: Token } = {
  [SUPPORTED_NETWORK_ID.MAINNET]: new Token(
    SUPPORTED_NETWORK_ID.MAINNET,
    '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    18,
    'DAI',
    'Dai Stablecoin',
  ),
  [SUPPORTED_NETWORK_ID.ARB_TESTNET]: new Token(
    SUPPORTED_NETWORK_ID.ARB_TESTNET,
    '0x552444108a2af6375205f320f196b5d1fedfaa51',
    18,
    'DAI',
    'Dai Stablecoin',
  ),
  [SUPPORTED_NETWORK_ID.KOVAN]: new Token(
    SUPPORTED_NETWORK_ID.KOVAN,
    '0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa',
    18,
    'DAI',
    'Dai Stablecoin',
  ),
  [SUPPORTED_NETWORK_ID.OPTIMISM_TESTNET]: new Token(
    SUPPORTED_NETWORK_ID.OPTIMISM_TESTNET,
    '0x80b46e1d4dc3a4cd750b2352c24cd017552a8e08',
    18,
    'DAI',
    'Dai Stablecoin',
  ),
}

export const MYT = new Token(
  SUPPORTED_NETWORK_ID.ARB_TESTNET,
  '0x128fe859c6ee9912be1bd7c78815f1f3cf1a3fef',
  6,
  'MYT',
  'myToken',
)

export const USDC: { [chainId: number]: Token } = {
  [SUPPORTED_NETWORK_ID.MAINNET]: new Token(
    SUPPORTED_NETWORK_ID.MAINNET,
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    6,
    'USDC',
    'USD//C',
  ),
  [SUPPORTED_NETWORK_ID.KOVAN]: new Token(
    SUPPORTED_NETWORK_ID.KOVAN,
    '0x11438975f6e1e28d93639409e74ce1f8c2ebb91d',
    6,
    'USDC',
    'USD//C',
  ),

  [SUPPORTED_NETWORK_ID.ARB]: new Token(
    SUPPORTED_NETWORK_ID.ARB,
    '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
    6,
    'USDC',
    'USD//C',
  ),
}

export const USDT: { [chainId: number]: Token } = {
  [SUPPORTED_NETWORK_ID.MAINNET]: new Token(
    SUPPORTED_NETWORK_ID.MAINNET,
    '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    6,
    'USDT',
    'Tether USD',
  ),
  [SUPPORTED_NETWORK_ID.KOVAN]: new Token(
    SUPPORTED_NETWORK_ID.KOVAN,
    '0x13512979ade267ab5100878e2e0f485b568328a4',
    6,
    'USDT',
    'Tether USD',
  ),
  [SUPPORTED_NETWORK_ID.OPTIMISM]: new Token(
    SUPPORTED_NETWORK_ID.OPTIMISM,
    '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    6,
    'USDT',
    'Tether USD',
  ),
}

export const WBTC: { [chainId: number]: Token } = {
  [SUPPORTED_NETWORK_ID.MAINNET]: new Token(
    SUPPORTED_NETWORK_ID.MAINNET,
    '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    8,
    'WBTC',
    'Wrapped BTC',
  ),
  [SUPPORTED_NETWORK_ID.ARB]: new Token(
    SUPPORTED_NETWORK_ID.ARB,
    '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
    8,
    'WBTC',
    'Wrapped BTC',
  ),
  [SUPPORTED_NETWORK_ID.OPTIMISM]: new Token(
    SUPPORTED_NETWORK_ID.OPTIMISM,
    '0x68f180fcce6836688e9084f035309e29bf0a2095',
    8,
    'WBTC',
    'Wrapped BTC',
  ),
  [SUPPORTED_NETWORK_ID.OPTIMISM_TESTNET]: new Token(
    SUPPORTED_NETWORK_ID.OPTIMISM_TESTNET,
    '0x2382a8f65b9120e554d1836a504808ac864e169d',
    8,
    'WBTC',
    'Wrapped BTC',
  ),
}

export const FEI: { [chainId: number]: Token } = {
  [SUPPORTED_NETWORK_ID.MAINNET]: new Token(
    SUPPORTED_NETWORK_ID.MAINNET,
    '0x956F47F50A910163D8BF957Cf5846D573E7f87CA',
    18,
    'FEI',
    'Fei USD',
  ),
  [SUPPORTED_NETWORK_ID.KOVAN]: new Token(
    SUPPORTED_NETWORK_ID.KOVAN,
    '0x4e9d5268579ae76f390f232aea29f016bd009aab',
    18,
    'FEI',
    'Fei USD',
  ),
}

export const TRIBE = new Token(
  SUPPORTED_NETWORK_ID.MAINNET,
  '0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B',
  18,
  'TRIBE',
  'Tribe',
)
export const FRAX = new Token(
  SUPPORTED_NETWORK_ID.MAINNET,
  '0x853d955aCEf822Db058eb8505911ED77F175b99e',
  18,
  'FRAX',
  'Frax',
)
export const FXS = new Token(
  SUPPORTED_NETWORK_ID.MAINNET,
  '0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0',
  18,
  'FXS',
  'Frax Share',
)
export const renBTC = new Token(
  SUPPORTED_NETWORK_ID.MAINNET,
  '0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D',
  8,
  'renBTC',
  'renBTC',
)
export const UMA = new Token(
  SUPPORTED_NETWORK_ID.MAINNET,
  '0x04Fa0d235C4abf4BcF4787aF4CF447DE572eF828',
  18,
  'UMA',
  'UMA Voting Token v1',
)
export const ETH2X_FLI = new Token(
  SUPPORTED_NETWORK_ID.MAINNET,
  '0xAa6E8127831c9DE45ae56bB1b0d4D4Da6e5665BD',
  18,
  'ETH2x-FLI',
  'ETH 2x Flexible Leverage Index',
)
// Mirror Protocol compat.
export const UST = new Token(
  SUPPORTED_NETWORK_ID.MAINNET,
  '0xa47c8bf37f92abed4a126bda807a7b7498661acd',
  18,
  'UST',
  'Wrapped UST',
)
export const MIR = new Token(
  SUPPORTED_NETWORK_ID.MAINNET,
  '0x09a3ecafa817268f77be1283176b946c4ff2e608',
  18,
  'MIR',
  'Wrapped MIR',
)

export const UNI: { [chainId: number]: Token } = {
  [SUPPORTED_NETWORK_ID.MAINNET]: new Token(
    SUPPORTED_NETWORK_ID.MAINNET,
    '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    18,
    'UNI',
    'Uniswap',
  ),
  [SUPPORTED_NETWORK_ID.KOVAN]: new Token(
    SUPPORTED_NETWORK_ID.KOVAN,
    '0xd64b7d5293a53dee743303fb4f6f31b80777e536',
    18,
    'UNI',
    'Uniswap',
  ),
}

export const SATORI: { [chainId: number]: Token } = {
  [SUPPORTED_NETWORK_ID.ARB]: new Token(
    SUPPORTED_NETWORK_ID.ARB,
    '0x4e352cf164e64adcbad318c3a1e222e9eba4ce42',
    18,
    'SATORI',
    'SATORI Token',
  ),
  [SUPPORTED_NETWORK_ID.MAINNET]: new Token(
    SUPPORTED_NETWORK_ID.MAINNET,
    '0x4e352cf164e64adcbad318c3a1e222e9eba4ce42',
    18,
    'SATORI',
    'SATORI Token',
  ),
}

// arb rinkeby test tokens
export const TT = new Token(
  SUPPORTED_NETWORK_ID.ARB_TESTNET,
  '0x8e4674c1324ff6e19165165b4e1ca1131a4b284b',
  8,
  'TT',
  'TT Token',
)

export const WETH9_EXTENDED: { [chainId: number]: Token } = {
  ...WETH9,
  [SUPPORTED_NETWORK_ID.ARB]: new Token(
    SUPPORTED_NETWORK_ID.ARB,
    '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    18,
    'WETH',
    'Wrapped Ether',
  ),
  [SUPPORTED_NETWORK_ID.ARB_TESTNET]: new Token(
    SUPPORTED_NETWORK_ID.ARB_TESTNET,
    '0xB47e6A5f8b33b3F17603C83a0535A9dcD7E32681',
    18,
    'WETH',
    'Wrapped Ether',
  ),
  [SUPPORTED_NETWORK_ID.OPTIMISM]: new Token(
    SUPPORTED_NETWORK_ID.OPTIMISM,
    '0x4200000000000000000000000000000000000006',
    18,
    'WETH',
    'Wrapped Ether',
  ),
  [SUPPORTED_NETWORK_ID.OPTIMISM_TESTNET]: new Token(
    SUPPORTED_NETWORK_ID.OPTIMISM_TESTNET,
    '0x4200000000000000000000000000000000000006',
    18,
    'WETH',
    'Wrapped Ether',
  ),
}

const WETH_ONLY: ChainTokenList = {
  [SUPPORTED_NETWORK_ID.MAINNET]: [WETH9_EXTENDED[SUPPORTED_NETWORK_ID.MAINNET]],
  [SUPPORTED_NETWORK_ID.ARB]: [WETH9_EXTENDED[SUPPORTED_NETWORK_ID.ARB]],
  [SUPPORTED_NETWORK_ID.ARB_TESTNET]: [WETH9_EXTENDED[SUPPORTED_NETWORK_ID.ARB_TESTNET]],
  [SUPPORTED_NETWORK_ID.KOVAN]: [WETH9_EXTENDED[SUPPORTED_NETWORK_ID.KOVAN]],
  [SUPPORTED_NETWORK_ID.OPTIMISM_TESTNET]: [WETH9_EXTENDED[SUPPORTED_NETWORK_ID.OPTIMISM_TESTNET]],
  [SUPPORTED_NETWORK_ID.OPTIMISM]: [WETH9_EXTENDED[SUPPORTED_NETWORK_ID.OPTIMISM]],
}

const mAssetsAdditionalBases: { [tokenAddress: string]: Token[] } = {
  [UST.address]: [MIR],
  [MIR.address]: [UST],
  '0xd36932143F6eBDEDD872D5Fb0651f4B72Fd15a84': [MIR, UST], // mAAPL
  '0x59A921Db27Dd6d4d974745B7FfC5c33932653442': [MIR, UST], // mGOOGL
  '0x21cA39943E91d704678F5D00b6616650F066fD63': [MIR, UST], // mTSLA
  '0xC8d674114bac90148d11D3C1d33C61835a0F9DCD': [MIR, UST], // mNFLX
  '0x13B02c8dE71680e71F0820c996E4bE43c2F57d15': [MIR, UST], // mQQQ
  '0xEdb0414627E6f1e3F082DE65cD4F9C693D78CCA9': [MIR, UST], // mTWTR
  '0x41BbEDd7286dAab5910a1f15d12CBda839852BD7': [MIR, UST], // mMSFT
  '0x0cae9e4d663793c2a2A0b211c1Cf4bBca2B9cAa7': [MIR, UST], // mAMZN
  '0x56aA298a19C93c6801FDde870fA63EF75Cc0aF72': [MIR, UST], // mBABA
  '0x1d350417d9787E000cc1b95d70E9536DcD91F373': [MIR, UST], // mIAU
  '0x9d1555d8cB3C846Bb4f7D5B1B1080872c3166676': [MIR, UST], // mSLV
  '0x31c63146a635EB7465e5853020b39713AC356991': [MIR, UST], // mUSO
  '0xf72FCd9DCF0190923Fadd44811E240Ef4533fc86': [MIR, UST], // mVIXY
}

// used to construct intermediary pairs for trading
export const BASES_TO_CHECK_TRADES_AGAINST: ChainTokenList = {
  ...WETH_ONLY,
  [SUPPORTED_NETWORK_ID.MAINNET]: [...WETH_ONLY[SUPPORTED_NETWORK_ID.MAINNET], DAI[SUPPORTED_NETWORK_ID.MAINNET], USDC[SUPPORTED_NETWORK_ID.MAINNET], USDT[SUPPORTED_NETWORK_ID.MAINNET], WBTC[SUPPORTED_NETWORK_ID.MAINNET]],
  [SUPPORTED_NETWORK_ID.ARB_TESTNET]: [...WETH_ONLY[SUPPORTED_NETWORK_ID.ARB_TESTNET], DAI[SUPPORTED_NETWORK_ID.ARB_TESTNET], MYT, TT],
  [SUPPORTED_NETWORK_ID.ARB]: [...WETH_ONLY[SUPPORTED_NETWORK_ID.ARB], SATORI[SUPPORTED_NETWORK_ID.ARB], USDC[SUPPORTED_NETWORK_ID.ARB]],
  [SUPPORTED_NETWORK_ID.KOVAN]: [...WETH_ONLY[SUPPORTED_NETWORK_ID.KOVAN], USDC[SUPPORTED_NETWORK_ID.KOVAN], USDT[SUPPORTED_NETWORK_ID.KOVAN], DAI[SUPPORTED_NETWORK_ID.KOVAN], FEI[SUPPORTED_NETWORK_ID.KOVAN], UNI[SUPPORTED_NETWORK_ID.KOVAN]],
  [SUPPORTED_NETWORK_ID.OPTIMISM_TESTNET]: [...WETH_ONLY[SUPPORTED_NETWORK_ID.OPTIMISM_TESTNET], DAI[SUPPORTED_NETWORK_ID.OPTIMISM_TESTNET], WBTC[SUPPORTED_NETWORK_ID.OPTIMISM_TESTNET]],
  [SUPPORTED_NETWORK_ID.OPTIMISM]: [...WETH_ONLY[SUPPORTED_NETWORK_ID.OPTIMISM], USDT[SUPPORTED_NETWORK_ID.OPTIMISM], WBTC[SUPPORTED_NETWORK_ID.OPTIMISM]],
}

export const ADDITIONAL_BASES: { [chainId: number]: { [tokenAddress: string]: Token[] } } = {
  [SUPPORTED_NETWORK_ID.MAINNET]: {
    ...mAssetsAdditionalBases,
    '0xF16E4d813f4DcfDe4c5b44f305c908742De84eF0': [ETH2X_FLI],
    '0xA948E86885e12Fb09AfEF8C52142EBDbDf73cD18': [UNI[SUPPORTED_NETWORK_ID.MAINNET]],
    '0x561a4717537ff4AF5c687328c0f7E90a319705C0': [UNI[SUPPORTED_NETWORK_ID.MAINNET]],
    '0xE0360A9e2cdd7d03B9408c7D3001E017BAc2EcD5': [UNI[SUPPORTED_NETWORK_ID.MAINNET]],
    '0xa6e3454fec677772dd771788a079355e43910638': [UMA],
    '0xB46F57e7Ce3a284d74b70447Ef9352B5E5Df8963': [UMA],
    [FEI[SUPPORTED_NETWORK_ID.MAINNET].address]: [TRIBE],
    [TRIBE.address]: [FEI[SUPPORTED_NETWORK_ID.MAINNET]],
    [FRAX.address]: [FXS],
    [FXS.address]: [FRAX],
    [WBTC[SUPPORTED_NETWORK_ID.MAINNET].address]: [renBTC],
    [renBTC.address]: [WBTC[SUPPORTED_NETWORK_ID.MAINNET]],
  },
}
/**
 * Some tokens can only be swapped via certain pairs, so we override the list of bases that are considered for these
 * tokens.
 */
export const CUSTOM_BASES: { [chainId: number]: { [tokenAddress: string]: Token[] } } = {
  [SUPPORTED_NETWORK_ID.MAINNET]: {
    [AMPL.address]: [DAI[SUPPORTED_NETWORK_ID.MAINNET], WETH9_EXTENDED[SUPPORTED_NETWORK_ID.MAINNET]],
  },
}

export const V3_CORE_FACTORY_ADDRESSES: { [chainId: number]: string } = {
  [SUPPORTED_NETWORK_ID.MAINNET]: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  [SUPPORTED_NETWORK_ID.KOVAN]: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  [SUPPORTED_NETWORK_ID.ARB]: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  [SUPPORTED_NETWORK_ID.ARB_TESTNET]: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  [SUPPORTED_NETWORK_ID.OPTIMISM]: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  [SUPPORTED_NETWORK_ID.OPTIMISM_TESTNET]: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
}

function getAllCurrencyCombinations(tokenA: Token, tokenB: Token, chainId = TARGET_NETWORK_ID): [Token, Token][] {
  const common = BASES_TO_CHECK_TRADES_AGAINST[chainId] ?? []
  const additionalA = tokenA ? ADDITIONAL_BASES[chainId]?.[tokenA.address] ?? [] : []
  const additionalB = tokenB ? ADDITIONAL_BASES[chainId]?.[tokenB.address] ?? [] : []
  const bases = [...common, ...additionalA, ...additionalB]
  const basePairs = _.flatMap(bases, (base): [Token, Token][] => bases.map((otherBase) => [base, otherBase]))
  return tokenA && tokenB
    ? [
      // the direct pair
      [tokenA, tokenB],
      // token A against all bases
      ...bases.map((base): [Token, Token] => [tokenA, base]),
      // token B against all bases
      ...bases.map((base): [Token, Token] => [tokenB, base]),
      // each base against all bases
      ...basePairs,
    ]
      .filter((tokens): tokens is [Token, Token] => Boolean(tokens[0] && tokens[1]))
      .filter(([t0, t1]) => t0.address !== t1.address)
      .filter(([tokenA, tokenB]) => {
        if (!chainId) return true
        const customBases = CUSTOM_BASES[chainId]

        const customBasesA: Token[] | undefined = customBases?.[tokenA.address]
        const customBasesB: Token[] | undefined = customBases?.[tokenB.address]

        if (!customBasesA && !customBasesB) return true

        if (customBasesA && !customBasesA.find((base) => tokenB.equals(base))) return false
        if (customBasesB && !customBasesB.find((base) => tokenA.equals(base))) return false

        return true
      })
    : []
}

export function getPoolAddresses(poolKeys: [Currency | undefined, Currency | undefined, FeeAmount | undefined][], chainId = TARGET_NETWORK_ID) {
  const transformed: ([Token, Token, FeeAmount] | null)[] = poolKeys.map(([currencyA, currencyB, feeAmount]) => {
    try {
      if (!currencyA || !currencyB || !feeAmount) return null

      const tokenA = currencyA?.wrapped
      const tokenB = currencyB?.wrapped
      if (!tokenA || !tokenB || tokenA.equals(tokenB)) return null
      const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
      return [token0, token1, feeAmount]
    } catch (e) {
      return null
    }
  })
  const v3CoreFactoryAddress = V3_CORE_FACTORY_ADDRESSES[chainId]
  const poolAddresses = transformed.map((value) => {
    if (!v3CoreFactoryAddress || !value) return undefined
    return computePoolAddress({
      factoryAddress: v3CoreFactoryAddress,
      tokenA: value[0],
      tokenB: value[1],
      fee: value[2],
    })
  })
  return poolAddresses
}

export function calcPoolAddresses(currencyIn: Currency, currencyOut: Currency, chainId = TARGET_NETWORK_ID): (string | undefined)[] {
  const allCurrencyCombinations = getAllCurrencyCombinations(currencyIn.wrapped, currencyOut.wrapped, chainId)
  const allCurrencyCombinationsWithFee = allCurrencyCombinations.reduce<[Token, Token, FeeAmount][]>((list, [tokenA, tokenB]) => {
    return list.concat([
      [tokenA, tokenB, FeeAmount.LOW],
      [tokenA, tokenB, FeeAmount.MEDIUM],
      [tokenA, tokenB, FeeAmount.HIGH],
    ])
  }, [])
  return getPoolAddresses(allCurrencyCombinationsWithFee)
}

export function computeAllRoutes(
  currencyIn: Currency,
  currencyOut: Currency,
  pools: Pool[],
  chainId: number,
  currentPath: Pool[] = [],
  allPaths: Route<Currency, Currency>[] = [],
  startCurrencyIn: Currency = currencyIn,
  maxHops = 2,
): Route<Currency, Currency>[] {
  const tokenIn = currencyIn?.wrapped
  const tokenOut = currencyOut?.wrapped
  if (!tokenIn || !tokenOut) throw new Error('Missing tokenIn/tokenOut')

  for (const pool of pools) {
    if (currentPath.indexOf(pool) !== -1 || !pool.involvesToken(tokenIn)) continue

    const outputToken = pool.token0.equals(tokenIn) ? pool.token1 : pool.token0
    if (outputToken.equals(tokenOut)) {
      allPaths.push(new Route([...currentPath, pool], startCurrencyIn, currencyOut))
    } else if (maxHops > 1) {
      computeAllRoutes(
        outputToken,
        currencyOut,
        pools,
        chainId,
        [...currentPath, pool],
        allPaths,
        startCurrencyIn,
        maxHops - 1,
      )
    }
  }

  return allPaths
}

