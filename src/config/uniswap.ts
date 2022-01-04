import { SUPPORTED_NETWORK_ID } from '@/const'

export const UNISWAP_V3_QUOTER: { readonly [chainId: number]: string } = {
  [SUPPORTED_NETWORK_ID.MAINNET]: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
  [SUPPORTED_NETWORK_ID.ARB]: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
  [SUPPORTED_NETWORK_ID.ARB_TESTNET]: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
  [SUPPORTED_NETWORK_ID.KOVAN]: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
  [SUPPORTED_NETWORK_ID.OPTIMISM]: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
  [SUPPORTED_NETWORK_ID.OPTIMISM_TESTNET]: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
}

export const UNISWAP_V3_GRAPH_URL: { readonly [chainId: number]: string } = {
  [SUPPORTED_NETWORK_ID.MAINNET]: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-alt',
  [SUPPORTED_NETWORK_ID.ARB]: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-arbitrum-one',
  [SUPPORTED_NETWORK_ID.ARB_TESTNET]: 'https://graph-arb-testnet.mcdex.io/subgraphs/name/renpu-mcarlo/uniswap-arbitrum-rinkeby',
  [SUPPORTED_NETWORK_ID.KOVAN]: 'https://api.thegraph.com/subgraphs/name/renpu-mcarlo/uniswap-v3-kovan',
  [SUPPORTED_NETWORK_ID.OPTIMISM]: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-optimism',
  [SUPPORTED_NETWORK_ID.OPTIMISM_TESTNET]:
    'https://api.thegraph.com/subgraphs/name/renpu-mcarlo/uniswap-optimism-kovan',
}

export const UNISWAP_V3_USDC: { readonly [chainId: number]: string } = {
  [SUPPORTED_NETWORK_ID.MAINNET]: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
}
