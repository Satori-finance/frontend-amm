export const APP = {
  title: 'Satori',
}

export enum SUPPORTED_NETWORK_ID {
  MAINNET = 1,
  RINKEBY = 4,
  KOVAN = 42,
  S10POA = 1337,
  S10ARB = 246955447367734,
  ARB_TESTNET = 421611,
  ARB = 42161,
  OPTIMISM = 10,
  OPTIMISM_TESTNET = 69,
  BSC = 56,
  CLOVER_TEST = 1023,
}

export const SATORI_TOKEN_INFO = {
  address: '0x4e352cF164E64ADCBad318C3a1e222E9EBa4Ce42',
  symbol: 'SATORI',
  decimals: 18,
  image:
    'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x4e352cF164E64ADCBad318C3a1e222E9EBa4Ce42/logo.png',
}

export const NETWORK_ID_NAME: { [networkID: number]: string } = {
  [SUPPORTED_NETWORK_ID.MAINNET]: 'ETH Mainnet',
  [SUPPORTED_NETWORK_ID.RINKEBY]: 'Rinkeby',
  [SUPPORTED_NETWORK_ID.KOVAN]: 'Kovan',
  [SUPPORTED_NETWORK_ID.S10POA]: 'S10poa',
  [SUPPORTED_NETWORK_ID.ARB_TESTNET]: 'Arbitrum Testnet',
  [SUPPORTED_NETWORK_ID.ARB]: 'Arbitrum',
  [SUPPORTED_NETWORK_ID.BSC]: 'BSC',
  [SUPPORTED_NETWORK_ID.OPTIMISM]: 'Optimistic',
  [SUPPORTED_NETWORK_ID.OPTIMISM_TESTNET]: 'Optimistic Kovan',
}

export const BRIDGE_WITHDRAW_CONFIRM_BLOCKS: { [networkID: number]: number } = {
  [SUPPORTED_NETWORK_ID.MAINNET]: 45818,
  [SUPPORTED_NETWORK_ID.RINKEBY]: 6545,
}

interface NetworkEnvConfig {
  CHAIN_ID: SUPPORTED_NETWORK_ID
  NETWORK: string
  SERVER_API_URL: string
  SERVER_WS_URL: string
  FAUCET_API_URL: string
}

export const NETWORK_ENV_CONFIG: { [networkID: number]: NetworkEnvConfig } = {
  [SUPPORTED_NETWORK_ID.ARB_TESTNET]: {
    CHAIN_ID: SUPPORTED_NETWORK_ID.ARB_TESTNET,
    NETWORK: 'arb-testnet',
    SERVER_API_URL: 'https://test.mcdex.io/api',
    SERVER_WS_URL: 'wss://test.mcdex.io/ws',
    FAUCET_API_URL: 'https://test.mcdex.io/api',
  },
  [SUPPORTED_NETWORK_ID.CLOVER_TEST]: {
    CHAIN_ID: SUPPORTED_NETWORK_ID.CLOVER_TEST,
    NETWORK: 'clover-testnet',
    SERVER_API_URL: 'https://clover-test.mcdex.io/api',
    SERVER_WS_URL: 'wss://clover-test.mcdex.io/ws',
    FAUCET_API_URL: 'https://clover-test.mcdex.io/api',
  },
  [SUPPORTED_NETWORK_ID.ARB]: {
    CHAIN_ID: SUPPORTED_NETWORK_ID.ARB,
    NETWORK: 'arb',
    SERVER_API_URL: 'https://app.mcdex.io/api',
    SERVER_WS_URL: 'wss://app.mcdex.io/ws',
    FAUCET_API_URL: '',
  },
  [SUPPORTED_NETWORK_ID.BSC]: {
    CHAIN_ID: SUPPORTED_NETWORK_ID.BSC,
    NETWORK: 'bsc',
    SERVER_API_URL: 'https://bsc.mcdex.io/api',
    SERVER_WS_URL: 'wss://bsc.mcdex.io/ws',
    FAUCET_API_URL: '',
  },
}

export const DEFAULT_NETWORK = (() => {
  const chainIdSearch = /[?&]chainId=([0-9]*)/.exec(window.location.href)
  let chainId = chainIdSearch ? Number(chainIdSearch[1]) : null
  if (!chainId) {
    chainId = window.ethereum?.chainId && window.ethereum.selectedAddress ? Number(window.ethereum.chainId) : null
  }
  return chainId && NETWORK_ENV_CONFIG[chainId] ? chainId : SUPPORTED_NETWORK_ID.BSC
})()

export const NETWORK_OPTIONS = [SUPPORTED_NETWORK_ID.ARB, SUPPORTED_NETWORK_ID.BSC]

// set default NETWORK_ENV
export let NETWORK_ENV: NetworkEnvConfig = NETWORK_ENV_CONFIG[DEFAULT_NETWORK]

export const IS_MOBILE = process.env.VUE_APP_IS_MOBILE === 'true'
export const SITE_DEFAULT_TITLE = 'SATORI'

export let UNISWAP_GRAPH_URL = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2'
export const PANCAKE_GRAPH_URL = 'https://bsc.streamingfast.io/subgraphs/name/pancakeswap/exchange-v2'
export let UNISWAP_V3_FACTORY_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984'

// home multi chain config
export const ETHEREUM_DOMAIN = 'https://kovan.mcdex.io'
export const ARB_TESTNET_DOMAIN = 'https://test.mcdex.io'
export const ARB_ONE_DOMAIN = 'https://app.mcdex.io'

export let NETWORK_PROVIDER_RPC = 'http://10.30.206.10:8747'
export let L1_NETWORK_PROVIDER_RPC = 'http://10.30.206.10:8747'
export let TARGET_NETWORK_ID = SUPPORTED_NETWORK_ID.S10POA
export let L1_NETWORK_ID = SUPPORTED_NETWORK_ID.S10POA

export let SATORI_ADDRESS = '0x83487dF1fA9C62130893A889578DFA7e2EAB9eFf' // fake mcb address, s10net
export const SUPPORT_L2 = process.env.VUE_APP_SUPPORT_L2 === 'on'
export const OPERATOR_CHECK_IN_EXPIRE_TIMESTAMP = 86400 * 10 // 10d

// trading mining v2 config
export let TRADING_MINING_STAKE_CONTRACT_ADDRESS = ''
export let TRADING_MINING_CLAIM_CONTRACT_ADDRESS = ''

// gas fee rebate claim
export let GAS_FEE_REBATE_CLAIM_CONTRACT_ADDRESS = ''

// SATORI crowdsale address
export let SATORI_CROWD_SALE_ADDRESS = '' // SATORI crowdsale contract address , s10net
export let SATORI_CROWD_SALE_SATORI = '' // SATORI address for crowdsale, s10net
export let SATORI_CROWD_SALE_USDC = '' // USDC address for crowdsale, s10net
export let SATORI_VESTING_ADDRESS = ''
export let SATORI_VESTING_SATORI = ''

if (SUPPORT_L2) {
  NETWORK_PROVIDER_RPC = 'http://10.30.204.119:8547'
  TARGET_NETWORK_ID = SUPPORTED_NETWORK_ID.S10ARB
}

export const SERVER_WS_URL = NETWORK_ENV.SERVER_WS_URL
export const INFURA_API_KEY = process.env.VUE_APP_INFURA_KEY

TARGET_NETWORK_ID = NETWORK_ENV.CHAIN_ID

export const NETWORK_PROVIDER_RPC_CONFIG: { [networkID: number]: string } = {
  [SUPPORTED_NETWORK_ID.MAINNET]: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
  [SUPPORTED_NETWORK_ID.ARB_TESTNET]: `https://rinkeby.arbitrum.io/rpc`,
  [SUPPORTED_NETWORK_ID.BSC]: 'https://bsc-dataseed1.binance.org',
  [SUPPORTED_NETWORK_ID.CLOVER_TEST]: 'https://rpc.clover.finance',
  [SUPPORTED_NETWORK_ID.ARB]: `https://arb1.arbitrum.io/rpc`,
  [SUPPORTED_NETWORK_ID.OPTIMISM_TESTNET]: `https://optimism-kovan.infura.io/v3/${INFURA_API_KEY}`,
}

export const SATORI_ADDRESS_CONFIG: { [networkID: number]: string } = {
  [SUPPORTED_NETWORK_ID.ARB_TESTNET]: '0xEb4AFFB7b5D96eFC981159401aE677E22eCbcbd0',
  [SUPPORTED_NETWORK_ID.BSC]: '0x5fe80d2cd054645b9419657d3d10d26391780a7b',
  [SUPPORTED_NETWORK_ID.ARB]: '0x4e352cF164E64ADCBad318C3a1e222E9EBa4Ce42',
  [SUPPORTED_NETWORK_ID.MAINNET]: '0x4e352cF164E64ADCBad318C3a1e222E9EBa4Ce42',
  [SUPPORTED_NETWORK_ID.CLOVER_TEST]: '0xa955080460b6111Be2a0Fe5C69F250010b0674B0',
}

export const TRADING_MINING_STAKE_CONTRACT_ADDRESS_CONFIG: { [networkID: number]: string } = {
  [SUPPORTED_NETWORK_ID.ARB_TESTNET]: '0x4040e6Ea70d612C5CA9F7ab9237E32167e7f2f4E',
  [SUPPORTED_NETWORK_ID.BSC]: '0x78963E7cB9454cCf8412Cd0B5bC4C69AD5cDbBd3',
  [SUPPORTED_NETWORK_ID.ARB]: '0xB3500fb8fa94423974A5A6e55c405139c5928E85',
  [SUPPORTED_NETWORK_ID.MAINNET]: '',
}

export const TRADING_MINING_CLAIM_CONTRACT_ADDRESS_CONFIG: { [networkID: number]: string } = {
  [SUPPORTED_NETWORK_ID.ARB_TESTNET]: '0x630277E10Eb6D4b0e8d8C75FF9a434B28F13E0A9',
  [SUPPORTED_NETWORK_ID.BSC]: '0x205285d6eef9055779650f6556c3704a5b514271',
  [SUPPORTED_NETWORK_ID.ARB]: '0xFB726565beD2aE33De0ccd9F4DA8b831B48c6cD4',
  [SUPPORTED_NETWORK_ID.MAINNET]: '',
}

export const GAS_FEE_REBATE_CLAIM_CONTRACT_ADDRESS_CONFIG: { [networkID: number]: string } = {
  [SUPPORTED_NETWORK_ID.ARB_TESTNET]: '0xc46A2158c36c024592E8E218AeF518E0962ebEB7',
  [SUPPORTED_NETWORK_ID.BSC]: '0x3C4a4410A655a1d14D4b4EFA4ae21E8a5c09DA20',
  [SUPPORTED_NETWORK_ID.ARB]: '',
  [SUPPORTED_NETWORK_ID.MAINNET]: '',
}

NETWORK_PROVIDER_RPC = NETWORK_PROVIDER_RPC_CONFIG[TARGET_NETWORK_ID]
SATORI_ADDRESS = SATORI_ADDRESS_CONFIG[TARGET_NETWORK_ID]
TRADING_MINING_STAKE_CONTRACT_ADDRESS = TRADING_MINING_STAKE_CONTRACT_ADDRESS_CONFIG[TARGET_NETWORK_ID]
TRADING_MINING_CLAIM_CONTRACT_ADDRESS = TRADING_MINING_CLAIM_CONTRACT_ADDRESS_CONFIG[TARGET_NETWORK_ID]
GAS_FEE_REBATE_CLAIM_CONTRACT_ADDRESS = GAS_FEE_REBATE_CLAIM_CONTRACT_ADDRESS_CONFIG[TARGET_NETWORK_ID]

if (NETWORK_ENV.CHAIN_ID === SUPPORTED_NETWORK_ID.ARB_TESTNET) {
  L1_NETWORK_PROVIDER_RPC = `https://rinkeby.infura.io/v3/${INFURA_API_KEY}`
  L1_NETWORK_ID = SUPPORTED_NETWORK_ID.RINKEBY
  SATORI_VESTING_ADDRESS = '0x49FCebBc49Fc617b901E4086dEfB8Cc016a4BD17' // SATORI vesting contract address, arb test
  SATORI_VESTING_SATORI = '0x4e352cF164E64ADCBad318C3a1e222E9EBa4Ce42' // SATORI address for vesting, arb test
} else if (NETWORK_ENV.CHAIN_ID === SUPPORTED_NETWORK_ID.ARB) {
  L1_NETWORK_PROVIDER_RPC = `https://mainnet.infura.io/v3/${INFURA_API_KEY}`
  L1_NETWORK_ID = SUPPORTED_NETWORK_ID.MAINNET
  SATORI_VESTING_ADDRESS = '0x80EefA1DEd44f08e2DaCFab07B612bE66363326e' // SATORI vesting contract address, arb
} else if (NETWORK_ENV.CHAIN_ID === SUPPORTED_NETWORK_ID.OPTIMISM_TESTNET) {
  L1_NETWORK_PROVIDER_RPC = `https://kovan.infura.io/v3/${INFURA_API_KEY}`
  L1_NETWORK_ID = SUPPORTED_NETWORK_ID.KOVAN
  SATORI_VESTING_ADDRESS = '0x04041DD007C8c3B89b48348d77BaaC1199F23670' // SATORI vesting contract address, ovm test
  SATORI_VESTING_SATORI = '0xbd7BFceB24108a9AdbBCd4C57bacDD5194F3bE68' // SATORI address for vesting, ovm test
} else if (NETWORK_ENV.CHAIN_ID === SUPPORTED_NETWORK_ID.BSC) {
  L1_NETWORK_PROVIDER_RPC = `https://bsc-dataseed1.binance.org`
  L1_NETWORK_ID = SUPPORTED_NETWORK_ID.BSC
  SATORI_VESTING_ADDRESS = '0x04041DD007C8c3B89b48348d77BaaC1199F23670' // SATORI vesting contract address, ovm test
  SATORI_VESTING_SATORI = '0xbd7BFceB24108a9AdbBCd4C57bacDD5194F3bE68' // SATORI address for vesting, ovm test
} else if (NETWORK_ENV.CHAIN_ID === SUPPORTED_NETWORK_ID.CLOVER_TEST) {
  L1_NETWORK_PROVIDER_RPC = 'https://rpc.clover.finance'
  L1_NETWORK_ID = SUPPORTED_NETWORK_ID.CLOVER_TEST
} else {
  console.error('unknown ETH_NETWORK fallback to s10')
  SATORI_CROWD_SALE_ADDRESS = '0x784ab90CBe7aB9e8817915d0eA6Aeeaf182B293E' // SATORI crowdsale contract address , s10net
  SATORI_CROWD_SALE_SATORI = '0x660FAaA292c4f93b4225576054B2A05f53104fE2' // SATORI address for crowdsale, s10net
  SATORI_CROWD_SALE_USDC = '0x5d7A00e4626CB362B0A047b9aF13BF19800c1E20' // USDC address for crowdsale, s10net
  SATORI_VESTING_ADDRESS = '0xB8bF704520B00b3BE31c43A2AdCC99D66756d1CB' // SATORI vesting contract address, s10net
  SATORI_VESTING_SATORI = '0x40E84224439598289Be3ad3D1eEE81dfCCE5745B' // SATORI address for vesting, s10net
}

export const PERP_SYMBOL_KEY = 'SATORI_PERP_SYMBOL'
export const PERP_MIN_TRADE_AMOUNT_PREFIX_KEY = 'minTradeAmount-' // minTradeAmount-<perpetualID>
export const PERP_SLIPPAGE_TOLERANCE_PREFIX_KEY = 'slippageTolerance-' // slippageTolerance-<perpetualID>
export const REFERRAL_KEY = 'Referral'
export const TARGET_LEVERAGE_KEY = 'leverage-'

export const POOL_GOVERNOR_VOTES_DECIMALS = 2
export const DAO_GOVERNOR_VOTES_DECIMALS = 2

export const RESERVED_NATIVE_ASSET_BALANCE = 0.05

export const MiningTokenSymbol = 'SATORI'
export const DAOUnstakePenalty = 0.05

export const LEVERAGE_DECIMALS = 1
export const SHARE_TOKEN_FORMAT_DECIMALS = 3
export const WithdrawRelaxFactor = 0.999
export const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000'
export const DEFAULT_SYMBOL_LENGTH = 5
export const DEFAULT_SYMBOL = '00001'

export const CHART_LIBRARY_PATH = '/vendor/charting_library/charting_library/'

export const ALLOWANCE_AMOUNT = '70000000000000000000000000000' // less than uint96

// L1
export const NETWORK_ID_TO_ARB_BRIDGE_ADDRESS: { [networkID: number]: string } = {
  [SUPPORTED_NETWORK_ID.ARB_TESTNET]: '0x70C143928eCfFaf9F5b406f7f4fC28Dc43d68380',
  [SUPPORTED_NETWORK_ID.ARB]: '0x72Ce9c846789fdB6fC1f34aC4AD25Dd9ef7031ef',
}

// L2
export const NETWORK_ID_TO_ARB_TOKEN_BRIDGE_ADDRESS: { [networkID: number]: string } = {
  [SUPPORTED_NETWORK_ID.ARB_TESTNET]: '0x9413AD42910c1eA60c737dB5f58d1C504498a3cD',
  [SUPPORTED_NETWORK_ID.ARB]: '0x5288c571Fd7aD117beA99bF60FE0846C4E84F933',
}

export const MCDEX_DAO_GOVERNOR_ID = 'satoriDao'
export const RISK_NOTICE_POP_UP = 'riskNoticePopUp'
export const PROHIBIT_NOTICE_POP_UP = 'prohibitNoticePopUp'

export const MAX_UINT256_VALUE = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
export const MAX_INT256_VALUE = '0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
export const TRADE_DEFAULT_SLIPPAGE = '0.5' // 0.5%
export const ORDER_MIN_DEPOSIT_GAS_BALANCE = 0.02 * 2 // in eth
export const ORDER_MIN_GAS_BALANCE = 0.01 * 2 // in eth

export const COOKIE_STATUS_KEY: string = 'COOKIE_STATUS'

export const SATORI_ASSETS_BASE_URL = ''
