import BigNumber from 'bignumber.js'
import { SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/constants'

export type CHAIN_NAME =
  | 'Ethereum'
  | 'Rinkeby Testnet'
  | 'Ethereum Kovan'
  | 'Arbitrum'
  | 'Arbitrum Testnet'
  | 'Optimistic'
  | 'Optimistic Kovan'
  | 'BSC'
  | 'Clover Testnet'
export type CHAIN_SYMBOL =
  | 'ETH'
  | 'ETH_RINKEBY'
  | 'ARB'
  | 'ARB_TESTNET'
  | 'ETH_S10'
  | 'ETH_KOVAN'
  | 'OPTIMISM'
  | 'OPTIMISM_TESTNET'
  | 'BSC'
  | 'CLOVER_TEST'

export interface ChainSubGraphConfig {
  blockSubgraph: string
  dataSubgraph: string
  priceChartSubgraph: string
  daoSubgraph: string
  transactionMiningSubgraph: string
  checkBlockSubgraph: string
}

export interface ChainBackendConfig {
  oracleService: string
  tradingMiningService: string
  gasFeeRebate: string
}

export interface ChainPollingConfig {
  interval: number
  retryLimit: number
  ceiling: number
  floor: number
}

export interface ChainConfig {
  chainID: number
  chainSymbol: CHAIN_SYMBOL
  chainName: CHAIN_NAME
  explorer: string
  symbol: string
  icon: string
  assetAddress: string // WETH
  decimals: number
  formatDecimals: number
  minGasLimit: BigNumber
  marketOrderExpireTime: number
  blockGenerationInterval: number
  blockNumberPerDay: number
  subgraphConfig: ChainSubGraphConfig
  backendConfig: ChainBackendConfig
  pollingConfig: ChainPollingConfig
}

export const chainParamsMap: Map<SUPPORTED_NETWORK_ID, any> = new Map([
  [
    SUPPORTED_NETWORK_ID.ARB,
    [
      {
        chainId: '0xa4b1', // A 0x-prefixed hexadecimal string
        chainName: 'Arbitrum',
        nativeCurrency: {
          name: 'Arbitrum ETH',
          symbol: 'ETH',
          decimals: 18,
        },
        rpcUrls: ['https://arb1.arbitrum.io/rpc'],
        blockExplorerUrls: ['https://arbiscan.io/'],
        iconUrls: ['https://arbiscan.io/images/favicon.ico'], // Currently ignored.
      },
    ],
  ],

  [
    SUPPORTED_NETWORK_ID.BSC,
    [
      {
        chainId: '0x38', // A 0x-prefixed hexadecimal string
        chainName: 'Binance',
        nativeCurrency: {
          name: 'Binance BNB',
          symbol: 'BNB',
          decimals: 18,
        },
        rpcUrls: ['https://bsc-dataseed1.binance.org'],
        blockExplorerUrls: ['https://www.bscscan.com/'],
        iconUrls: ['https://dex-bin.bnbstatic.com/static/images/favicon.ico'], // Currently ignored.
      },
    ],
  ],
  [
    SUPPORTED_NETWORK_ID.ARB_TESTNET,
    [
      {
        chainId: '0x66eeb', // A 0x-prefixed hexadecimal string
        chainName: 'Arbitrum Testnet',
        nativeCurrency: {
          name: 'Arbitrum ETH',
          symbol: 'ETH',
          decimals: 18,
        },
        rpcUrls: ['https://rinkeby.arbitrum.io/rpc'],
        blockExplorerUrls: ['https://testnet.arbiscan.io/'],
        iconUrls: ['https://testnet.arbiscan.io/favicon.ico'], // Currently ignored.
      },
    ],
  ],
  [
    SUPPORTED_NETWORK_ID.OPTIMISM,
    [
      {
        chainId: '0xa', // A 0x-prefixed hexadecimal string
        chainName: 'Optimism',
        nativeCurrency: {
          name: 'Optimism ETH',
          symbol: 'ETH',
          decimals: 18,
        },
        rpcUrls: ['https://mainnet.optimism.io'],
        blockExplorerUrls: ['https://optimistic.etherscan.io/'],
        iconUrls: ['https://gateway.optimism.io/favicon.ico'], // Currently ignored.
      },
    ],
  ],
  [
    SUPPORTED_NETWORK_ID.OPTIMISM_TESTNET,
    [
      {
        chainId: '0x45', // A 0x-prefixed hexadecimal string
        chainName: 'Optimism Kovan',
        nativeCurrency: {
          name: 'Optimism ETH',
          symbol: 'ETH',
          decimals: 18,
        },
        rpcUrls: ['https://kovan.optimism.io'],
        blockExplorerUrls: ['https://kovan-optimistic.etherscan.io/'],
        iconUrls: ['https://gateway.optimism.io/favicon.ico'], // Currently ignored.
      },
    ],
  ],
  [
    SUPPORTED_NETWORK_ID.CLOVER_TEST,
    [
      {
        chainId: '0x3ff', // A 0x-prefixed hexadecimal string
        chainName: 'Clover Test',
        nativeCurrency: {
          name: 'CLV Token',
          symbol: 'CLV',
          decimals: 18,
        },
        rpcUrls: ['https://rpc.clover.finance', 'https://rpc-2.clover.finance', 'https://rpc-3.clover.finance'],
        blockExplorerUrls: [],
        iconUrls: ['https://clover.finance/favicon.ico'], // Currently ignored.
      },
    ],
  ],
])

export const chainConfigs: { [targetNetwork: number]: ChainConfig } = {
  [SUPPORTED_NETWORK_ID.S10POA]: {
    chainID: SUPPORTED_NETWORK_ID.S10POA,
    chainSymbol: 'ETH_S10',
    chainName: 'Ethereum',
    symbol: 'ETH',
    icon: require('@/assets/img/ethereum.svg'),
    assetAddress: '0xfA53FD78b5176B4d772194511cC16C02c7F183F9'.toLowerCase(),
    decimals: 18,
    formatDecimals: 3,
    minGasLimit: new BigNumber('0.01'),
    marketOrderExpireTime: 600,
    blockGenerationInterval: 13.3,
    blockNumberPerDay: 6545,
    explorer: '',
    subgraphConfig: {
      blockSubgraph: 'http://10.30.206.10:8000/subgraphs/name/blocklytics/ethereum-blocks',
      dataSubgraph: 'http://10.30.206.10:8000/subgraphs/name/mcarloai/mai-v3-graph',
      checkBlockSubgraph: '',
      priceChartSubgraph: 'http://10.30.206.10:8000/subgraphs/name/mcdexio/mcdex3-oracle-kovan1',
      daoSubgraph: 'http://10.30.206.10:8000/subgraphs/name/mcarloai/mai3-dao-graph',
      transactionMiningSubgraph: 'http://10.30.206.10:8000/subgraphs/name/mcarloai/mai3-trade-mining-graph',
    },
    backendConfig: {
      oracleService: '',
      tradingMiningService: '',
      gasFeeRebate: ''
    },
    pollingConfig: {
      interval: 100,
      ceiling: 1000,
      floor: 100,
      retryLimit: 10,
    },
  },
  [SUPPORTED_NETWORK_ID.MAINNET]: {
    chainID: SUPPORTED_NETWORK_ID.MAINNET,
    chainSymbol: 'ETH',
    chainName: 'Ethereum',
    symbol: 'ETH',
    icon: require('@/assets/img/ethereum.svg'),
    assetAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'.toLowerCase(),
    decimals: 18,
    formatDecimals: 3,
    minGasLimit: new BigNumber('0.01'),
    marketOrderExpireTime: 600,
    blockGenerationInterval: 13.3,
    blockNumberPerDay: 6545, // ether blocks num per day
    explorer: 'https://etherscan.io',
    subgraphConfig: {
      blockSubgraph: 'https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks',
      dataSubgraph: '',
      checkBlockSubgraph: '',
      priceChartSubgraph: '',
      daoSubgraph: '',
      transactionMiningSubgraph: '',
    },
    backendConfig: {
      oracleService: '',
      tradingMiningService: '',
      gasFeeRebate: ''
    },
    pollingConfig: {
      interval: 1000,
      ceiling: 10000,
      floor: 100,
      retryLimit: 10,
    },
  },
  [SUPPORTED_NETWORK_ID.KOVAN]: {
    chainID: SUPPORTED_NETWORK_ID.KOVAN,
    chainSymbol: 'ETH_KOVAN',
    chainName: 'Ethereum Kovan',
    symbol: 'ETH',
    icon: require('@/assets/img/ethereum.svg'),
    assetAddress: '0xd0A1E359811322d97991E03f863a0C30C2cF029C'.toLowerCase(),
    decimals: 18,
    formatDecimals: 3,
    minGasLimit: new BigNumber('0.01'),
    marketOrderExpireTime: 600,
    blockGenerationInterval: 13.3,
    blockNumberPerDay: 86400 / 13.3,
    explorer: 'https://kovan.etherscan.io',
    subgraphConfig: {
      blockSubgraph: 'https://api.thegraph.com/subgraphs/name/blocklytics/kovan-blocks',
      dataSubgraph: 'https://api.thegraph.com/subgraphs/name/mcdexio/mcdex3-kovan1',
      checkBlockSubgraph: '',
      priceChartSubgraph: 'https://api.thegraph.com/subgraphs/name/mcdexio/mcdex3-kovan1',
      daoSubgraph: '',
      transactionMiningSubgraph: 'https://api.thegraph.com/subgraphs/name/mcdexio/mcdex3trademiningkovan',
    },
    backendConfig: {
      oracleService: '',
      tradingMiningService: '',
      gasFeeRebate: ''
    },
    pollingConfig: {
      interval: 1000,
      ceiling: 3000,
      floor: 100,
      retryLimit: 10,
    },
  },
  [SUPPORTED_NETWORK_ID.ARB_TESTNET]: {
    chainID: SUPPORTED_NETWORK_ID.ARB_TESTNET,
    chainSymbol: 'ARB_TESTNET',
    chainName: 'Arbitrum Testnet',
    symbol: 'ETH',
    icon: require('@/assets/img/arbitrum.svg'),
    assetAddress: '0xB47e6A5f8b33b3F17603C83a0535A9dcD7E32681'.toLowerCase(),
    decimals: 18,
    formatDecimals: 3,
    minGasLimit: new BigNumber('0.001'),
    marketOrderExpireTime: 600,
    blockGenerationInterval: 13.3,
    blockNumberPerDay: 86400 / 13.3,
    explorer: 'https://testnet.arbiscan.io',
    subgraphConfig: {
      blockSubgraph: 'https://api.thegraph.com/subgraphs/name/renpu-mcarlo/arbitrum-rinkeby-blocks',
      dataSubgraph: 'https://api.thegraph.com/subgraphs/name/renpu-mcarlo/mai3-perpetual-arb-test',
      checkBlockSubgraph: '',
      priceChartSubgraph: 'https://api.thegraph.com/subgraphs/name/renpu-mcarlo/mai3-oracle-subgraph',
      daoSubgraph: 'https://api.thegraph.com/subgraphs/name/renpu-mcarlo/mai3-dao-arb-test',
      transactionMiningSubgraph: 'https://api.thegraph.com/subgraphs/name/renpu-mcarlo/mai3-trade-mining',
    },
    backendConfig: {
      oracleService: 'https://test.mcdex.io/api/oracle',
      tradingMiningService: 'https://test.mcdex.io/api/tradingMining',
      gasFeeRebate: 'https://test.mcdex.io/api/bscGasRebate'
    },
    pollingConfig: {
      interval: 250,
      ceiling: 1000,
      floor: 0,
      retryLimit: 30,
    },
  },
  [SUPPORTED_NETWORK_ID.ARB]: {
    chainID: SUPPORTED_NETWORK_ID.ARB,
    chainSymbol: 'ARB',
    chainName: 'Arbitrum',
    symbol: 'ETH',
    icon: require('@/assets/img/arbitrum.svg'),
    assetAddress: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'.toLowerCase(),
    decimals: 18,
    formatDecimals: 3,
    minGasLimit: new BigNumber('0.001'),
    marketOrderExpireTime: 600,
    blockGenerationInterval: 13.3,
    blockNumberPerDay: 86400 / 13.3,
    explorer: 'https://arbiscan.io',
    subgraphConfig: {
      // subgraph (checkBlockSubgraph and dataSubgraph need to be consistent)
      blockSubgraph: 'https://api.thegraph.com/subgraphs/name/ianlapham/arbitrum-one-blocks',
      dataSubgraph: 'https://api.thegraph.com/subgraphs/name/mcdexio/mcdex3-arb-perpetual',
      checkBlockSubgraph: 'https://api.thegraph.com/index-node/graphql',
      priceChartSubgraph: 'https://api.thegraph.com/subgraphs/name/mcdexio/mcdex3-arb-oracle',
      // daoSubgraph: 'https://api.thegraph.com/subgraphs/name/mcdexio/dao',
      transactionMiningSubgraph: 'https://api.thegraph.com/subgraphs/name/mcdexio/mai3-trade-mining',
      // self built graph
      // blockSubgraph: 'https://graph-arb1.mcdex.io/subgraphs/name/ianlapham/arbitrum-one-blocks',
      // dataSubgraph: 'https://graph-arb1.mcdex.io/subgraphs/name/mcdexio/mcdex3-arb-perpetual2',
      // checkBlockSubgraph: 'https://graph-arb.mcdex.io/index-node',
      // priceChartSubgraph: 'https://graph-arb1.mcdex.io/subgraphs/name/mcdexio/mcdex3-arb-oracle',
      daoSubgraph: 'https://graph-arb1.mcdex.io/subgraphs/name/mcdexio/dao',
      // transactionMiningSubgraph: 'https://graph-arb1.mcdex.io/subgraphs/name/mcdexio/mai3-trade-mining',
    },
    backendConfig: {
      oracleService: 'https://app.mcdex.io/api/oracle',
      tradingMiningService: 'https://app.mcdex.io/api/tradingMining',
      gasFeeRebate: '',
    },
    pollingConfig: {
      interval: 250,
      ceiling: 1000,
      floor: 0,
      retryLimit: 30,
    },
  },
  [SUPPORTED_NETWORK_ID.BSC]: {
    chainID: SUPPORTED_NETWORK_ID.BSC,
    chainSymbol: 'BSC',
    chainName: 'BSC',
    symbol: 'BNB',
    icon: require('@/assets/img/BSC.svg'),
    assetAddress: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'.toLowerCase(),
    decimals: 18,
    formatDecimals: 3,
    minGasLimit: new BigNumber('0.001'),
    marketOrderExpireTime: 600,
    blockGenerationInterval: 3,
    blockNumberPerDay: 86400 / 3,
    explorer: 'https://www.bscscan.com',
    subgraphConfig: {
      // subgraph (checkBlockSubgraph and dataSubgraph need to be consistent)
      // blockSubgraph: 'https://api.thegraph.com/subgraphs/name/generatefinance/bsc-blocks',
      blockSubgraph: 'https://api.thegraph.com/subgraphs/name/venomprotocol/bsc-blocks',
      // dataSubgraph: 'https://api.thegraph.com/subgraphs/name/mcdexio/mcdex3-bsc-perpetual',
      dataSubgraph: 'https://graph-bsc.mcdex.io/subgraphs/name/mcdexio/mcdex3-bsc-perpetual2',
      // checkBlockSubgraph: 'https://api.thegraph.com/index-node/graphql',
      priceChartSubgraph: 'https://api.thegraph.com/subgraphs/name/mcdexio/mcdex3-arb-oracle',
      daoSubgraph: 'https://api.thegraph.com/subgraphs/name/mcdexio/dao',
      transactionMiningSubgraph: 'https://api.thegraph.com/subgraphs/name/mcdexio/mcdex3-bsc-trade-mining',

      // self built graph
      checkBlockSubgraph: 'https://graph-bsc.mcdex.io/index-node',
    },
    backendConfig: {
      oracleService: 'https://bsc.mcdex.io/api/oracle',
      tradingMiningService: 'https://app.mcdex.io/api/tradingMining',
      gasFeeRebate: 'https://app.mcdex.io/api/bscGasRebate',
    },
    pollingConfig: {
      interval: 250,
      ceiling: 1000,
      floor: 0,
      retryLimit: 30,
    },
  },
  [SUPPORTED_NETWORK_ID.RINKEBY]: {
    chainID: SUPPORTED_NETWORK_ID.RINKEBY,
    chainSymbol: 'ETH_RINKEBY',
    chainName: 'Rinkeby Testnet',
    symbol: 'ETH',
    icon: require('@/assets/img/ethereum.svg'),
    assetAddress: '0xc778417E063141139Fce010982780140Aa0cD5Ab'.toLowerCase(),
    decimals: 18,
    formatDecimals: 3,
    minGasLimit: new BigNumber('0.01'),
    marketOrderExpireTime: 600,
    blockGenerationInterval: 15,
    blockNumberPerDay: 86400 / 15,
    explorer: 'https://rinkeby.etherscan.io',
    subgraphConfig: {
      blockSubgraph: 'https://api.thegraph.com/subgraphs/name/codexsky/rinkeby-blocks',
      dataSubgraph: '',
      checkBlockSubgraph: '',
      priceChartSubgraph: '',
      daoSubgraph: '',
      transactionMiningSubgraph: '',
    },
    backendConfig: {
      oracleService: '',
      tradingMiningService: '',
      gasFeeRebate: '',
    },
    pollingConfig: {
      interval: 1000,
      ceiling: 10000,
      floor: 100,
      retryLimit: 10,
    },
  },
  [SUPPORTED_NETWORK_ID.OPTIMISM_TESTNET]: {
    chainID: SUPPORTED_NETWORK_ID.OPTIMISM_TESTNET,
    chainSymbol: 'OPTIMISM_TESTNET',
    chainName: 'Optimistic Kovan',
    symbol: 'ETH',
    icon: require('@/assets/img/optimism.svg'),
    assetAddress: '0x4200000000000000000000000000000000000006'.toLowerCase(),
    decimals: 18,
    formatDecimals: 3,
    minGasLimit: new BigNumber('0.001'),
    marketOrderExpireTime: 600,
    blockGenerationInterval: 13.3,
    blockNumberPerDay: 86400 / 13.3,
    explorer: 'https://kovan-optimistic.etherscan.io',
    subgraphConfig: {
      blockSubgraph: 'https://api.thegraph.com/subgraphs/name/ianlapham/optimism-kovan-blocks',
      dataSubgraph: 'https://api.thegraph.com/subgraphs/name/renpu-mcarlo/mai3-perpetual-optimism',
      checkBlockSubgraph: '',
      priceChartSubgraph: 'https://api.thegraph.com/subgraphs/name/renpu-mcarlo/mai3-oracle-optimism',
      daoSubgraph: 'https://api.thegraph.com/subgraphs/name/renpu-mcarlo/mai3-dao-optimism',
      transactionMiningSubgraph: '',
    },
    backendConfig: {
      oracleService: '',
      tradingMiningService: '',
      gasFeeRebate: '',
    },
    pollingConfig: {
      interval: 250,
      ceiling: 1000,
      floor: 0,
      retryLimit: 30,
    },
  },
  [SUPPORTED_NETWORK_ID.OPTIMISM]: {
    chainID: SUPPORTED_NETWORK_ID.OPTIMISM,
    chainSymbol: 'OPTIMISM',
    chainName: 'Optimistic',
    symbol: 'ETH',
    icon: require('@/assets/img/optimism.svg'),
    assetAddress: '0x4200000000000000000000000000000000000006'.toLowerCase(),
    decimals: 18,
    formatDecimals: 3,
    minGasLimit: new BigNumber('0.001'),
    marketOrderExpireTime: 600,
    blockGenerationInterval: 13.3,
    blockNumberPerDay: 86400 / 13.3,
    explorer: 'https://optimistic.etherscan.io',
    subgraphConfig: {
      blockSubgraph: 'https://api.thegraph.com/subgraphs/name/ianlapham/optimism-blocks',
      dataSubgraph: '',
      checkBlockSubgraph: '',
      priceChartSubgraph: '',
      daoSubgraph: '',
      transactionMiningSubgraph: '',
    },
    backendConfig: {
      oracleService: '',
      tradingMiningService: '',
      gasFeeRebate: '',
    },
    pollingConfig: {
      interval: 250,
      ceiling: 1000,
      floor: 0,
      retryLimit: 30,
    },
  },
  [SUPPORTED_NETWORK_ID.CLOVER_TEST]: {
    chainID: SUPPORTED_NETWORK_ID.CLOVER_TEST,
    chainSymbol: 'CLOVER_TEST',
    chainName: 'Clover Testnet',
    symbol: 'CLV',
    icon: require('@/assets/img/clover.svg'),
    assetAddress: '0xB47e6A5f8b33b3F17603C83a0535A9dcD7E32681'.toLowerCase(),
    decimals: 18,
    formatDecimals: 3,
    minGasLimit: new BigNumber('0.001'),
    marketOrderExpireTime: 600,
    blockGenerationInterval: 6,
    blockNumberPerDay: 86400 / 6,
    explorer: '',
    subgraphConfig: {
      blockSubgraph: 'https://graph-clover-test.mcdex.io/subgraphs/name/mcdexio/clover-test-blocks',
      dataSubgraph: 'https://graph-clover-test.mcdex.io/subgraphs/name/mcdexio/mcdex3-clover-test-perpetual',
      priceChartSubgraph: '',
      checkBlockSubgraph: 'https://graph-clover-test.mcdex.io/index-node',
      daoSubgraph: 'https://api.thegraph.com/subgraphs/name/mcdexio/dao',
      transactionMiningSubgraph: '',
    },
    backendConfig: {
      oracleService: 'https://clover-test.mcdex.io/api/oracle',
      tradingMiningService: '',
      gasFeeRebate: ''
    },
    pollingConfig: {
      interval: 250,
      ceiling: 1000,
      floor: 0,
      retryLimit: 30,
    },
  },
}

if (!TARGET_NETWORK_ID || !chainConfigs[TARGET_NETWORK_ID]) {
  console.error('chain config: unknown target network', TARGET_NETWORK_ID)
}

export const bscChainConfig = chainConfigs[SUPPORTED_NETWORK_ID.BSC]
export const arbChainConfig = chainConfigs[SUPPORTED_NETWORK_ID.ARB]

export const currentChainConfig: ChainConfig = chainConfigs[TARGET_NETWORK_ID]
