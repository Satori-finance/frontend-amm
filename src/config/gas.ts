import { NETWORK_ENV, SUPPORTED_NETWORK_ID } from '@/const'

export const gasStationConfig = {
  apiUrl: 'https://data-api.defipulse.com/api/v1/egs/api/',
  apiKey: 'be102ef7f39d09634a627cdb19496c34cd9f8c1f92538d5ffc920eeb48e3',
}

export const SUPPORT_ESTIMATE_GAS_CHAIN = [SUPPORTED_NETWORK_ID.ARB, SUPPORTED_NETWORK_ID.ARB_TESTNET, SUPPORTED_NETWORK_ID.BSC]

const mainnetGasLimit = {
  DEPOSIT_GAS_LIMIT: 142000,
  WITHDRAW_GAS_LIMIT_K: 269000,
  WITHDRAW_GAS_LIMIT_B: 308000,
  TRADE_GAS_LIMIT_K: 266000,
  TRADE_GAS_LIMIT_B: 1209000,
  TRADE_CLOSE_GAS_LIMIT_K: 266000,
  TRADE_CLOSE_GAS_LIMIT_B: 1209000,
  ADD_LIQUIDITY_GAS_LIMIT_K: 260000,
  ADD_LIQUIDITY_GAS_LIMIT_B: 800000,
  REMOVE_LIQUIDITY_GAS_LIMIT_K: 32000,
  REMOVE_LIQUIDITY_GAS_LIMIT_B: 1400000,
  GAS_FEE_DEPOSIT_GAS_LIMIT: 300000,
  GAS_FEE_WITHDRAW_GAS_LIMIT: 700000,
  WRAP_ETH_GAS_LIMIT: 300000,
  UNWRAP_WETH_GAS_LIMIT: 300000,
  CREATE_POOL_GAS_LIMIT: 2610000,
  CREATE_ORACLE_GAS_LIMIT: 1400000,
  CREATE_PERPETUAL_GAS_LIMIT: 1450000,
  UPDATE_PERPETUAL_RISK_PARAMS_LIMIT: 150000,
  RUN_POOL_GAS_LIMIT_K: 15000,
  RUN_POOL_GAS_LIMIT_B: 59000,
  OPERATOR_CHECK_IN_GAS_LIMIT: 51038,
  DONATE_INSURANCE_FUND_GAS_LIMIT: 163978,
  CLAIM_OPERATOR_FEE_GAS_LIMIT: 700000,
  TAKER_OVER_OPERATOR_GAS_LIMIT: 300000,
  TRANSFER_OPERATOR_GAS_LIMIT: 1200000,
  STAKE_GAS_LIMIT: 1000000,
  UNSTAKE_GAS_LIMIT: 1000000,
  VOTE_POOL_PROPOSAL_GAS_LIMIT: 300000,
  CLAIM_SATORI_MINING_REWARD: 150000,
  DELEGATE_VOTER_GAS_LIMIT: 400000,
  SUBSCRIBE_SATORI_GAS_LIMIT: 1400000,
  SETTLE_SATORI_GAS_LIMIT: 1400000,
  CLAIM_SATORI_GAS_LIMIT: 1400000,
  PERP_SETTLE_CLEAR_GAS_LIMIT: 700000,
  PERP_SETTLE_WITHDRAW_GAS_LIMIT: 700000,
  PERP_SET_EMERGENCY_GAS_LIMIT: 700000,
  SET_TARGET_LEVERAGE_GAS_LIMIT: 71124,
  ARB_L1_DEPOSIT_ETH_GAS_LIMIT: 50 * 1000,
  ARB_L1_DEPOSIT_ERC20_GAS_LIMIT: 200 * 1000,
  ARB_L1_CLAIM_ETH_GAS_LIMIT: 50 * 1000,
  ARB_L1_CLAIM_ERC20_GAS_LIMIT: 200 * 1000,
  ARB_L1_MESSAGE_GAS_LIMIT: 50 * 1000,
  ARB_L2_WITHDRAW_ETH_GAS_LIMIT: 1000 * 1000,
  ARB_L2_WITHDRAW_ERC20_GAS_LIMIT: 1000 * 1000,
  ARB_L2_APPROVE_ERC20_GAS_LIMIT: 100 * 1000,
  ARB_PERP_DEPOSIT_GAS_LIMIT: 15 * 1000 * 1000,
  NEW_TUNABLE_ORACLE_GAS_LIMIT: 2400000,
}

const arbGasLimit = {
  DEPOSIT_GAS_LIMIT: 922000,
  WITHDRAW_GAS_LIMIT_K: 14997,
  WITHDRAW_GAS_LIMIT_B: 941343,
  TRADE_GAS_LIMIT_K: 7352,
  TRADE_GAS_LIMIT_B: 4799746,
  TRADE_CLOSE_GAS_LIMIT_K: 22330,
  TRADE_CLOSE_GAS_LIMIT_B: 1129722,
  ADD_LIQUIDITY_GAS_LIMIT_K: 1058088,
  ADD_LIQUIDITY_GAS_LIMIT_B: 2695585,
  REMOVE_LIQUIDITY_GAS_LIMIT_K: 23485,
  REMOVE_LIQUIDITY_GAS_LIMIT_B: 880306,
  GAS_FEE_DEPOSIT_GAS_LIMIT: 3000000,
  GAS_FEE_WITHDRAW_GAS_LIMIT: 7000000,
  WRAP_ETH_GAS_LIMIT: 3000000,
  UNWRAP_WETH_GAS_LIMIT: 3000000,
  CREATE_POOL_GAS_LIMIT: 9200000,
  CREATE_ORACLE_GAS_LIMIT: 14000000,
  CREATE_PERPETUAL_GAS_LIMIT: 10000000,
  UPDATE_PERPETUAL_RISK_PARAMS_LIMIT: 1500000,
  RUN_POOL_GAS_LIMIT_K: 971,
  RUN_POOL_GAS_LIMIT_B: 800149,
  OPERATOR_CHECK_IN_GAS_LIMIT: 800000,
  DONATE_INSURANCE_FUND_GAS_LIMIT: 1400000,
  CLAIM_OPERATOR_FEE_GAS_LIMIT: 7000000,
  TAKER_OVER_OPERATOR_GAS_LIMIT: 300000,
  TRANSFER_OPERATOR_GAS_LIMIT: 1100000,
  STAKE_GAS_LIMIT: 2400000,
  UNSTAKE_GAS_LIMIT: 1800000,
  VOTE_POOL_PROPOSAL_GAS_LIMIT: 3000000,
  CLAIM_SATORI_MINING_REWARD: 1500000,
  DELEGATE_VOTER_GAS_LIMIT: 4000000,
  SUBSCRIBE_SATORI_GAS_LIMIT: 14000000,
  SETTLE_SATORI_GAS_LIMIT: 14000000,
  CLAIM_SATORI_GAS_LIMIT: 1200000,
  PERP_SETTLE_CLEAR_GAS_LIMIT: 7000000,
  PERP_SETTLE_WITHDRAW_GAS_LIMIT: 7000000,
  PERP_SET_EMERGENCY_GAS_LIMIT: 7000000,
  SET_TARGET_LEVERAGE_GAS_LIMIT: 1160000,
  ARB_L1_DEPOSIT_ETH_GAS_LIMIT: 50 * 1000,
  ARB_L1_DEPOSIT_ERC20_GAS_LIMIT: 200 * 1000,
  ARB_L1_CLAIM_ETH_GAS_LIMIT: 50 * 1000,
  ARB_L1_CLAIM_ERC20_GAS_LIMIT: 200 * 1000,
  ARB_L1_MESSAGE_GAS_LIMIT: 50 * 1000,
  ARB_L2_WITHDRAW_ETH_GAS_LIMIT: 50 * 1000,
  ARB_L2_WITHDRAW_ERC20_GAS_LIMIT: 800 * 1000,
  ARB_L2_APPROVE_ERC20_GAS_LIMIT: 800 * 1000,
  ARB_PERP_DEPOSIT_GAS_LIMIT: 15 * 1000 * 1000,
  NEW_TUNABLE_ORACLE_GAS_LIMIT: 2400000,
}

const optGasLimit = {
  DEPOSIT_GAS_LIMIT: 922000,
  WITHDRAW_GAS_LIMIT_K: 15000,
  WITHDRAW_GAS_LIMIT_B: 941000,
  TRADE_GAS_LIMIT_K: 7300,
  TRADE_GAS_LIMIT_B: 4800000,
  TRADE_CLOSE_GAS_LIMIT_K: 22330,
  TRADE_CLOSE_GAS_LIMIT_B: 1129722,
  ADD_LIQUIDITY_GAS_LIMIT_K: 1000000,
  ADD_LIQUIDITY_GAS_LIMIT_B: 2400000,
  REMOVE_LIQUIDITY_GAS_LIMIT_K: 18809,
  REMOVE_LIQUIDITY_GAS_LIMIT_B: 1309376,
  GAS_FEE_DEPOSIT_GAS_LIMIT: 3000000,
  GAS_FEE_WITHDRAW_GAS_LIMIT: 7000000,
  WRAP_ETH_GAS_LIMIT: 3000000,
  UNWRAP_WETH_GAS_LIMIT: 3000000,
  CREATE_POOL_GAS_LIMIT: 9200000,
  CREATE_ORACLE_GAS_LIMIT: 14000000,
  CREATE_PERPETUAL_GAS_LIMIT: 10000000,
  UPDATE_PERPETUAL_RISK_PARAMS_LIMIT: 1500000,
  RUN_POOL_GAS_LIMIT_K: 1000,
  RUN_POOL_GAS_LIMIT_B: 800000,
  OPERATOR_CHECK_IN_GAS_LIMIT: 800000,
  DONATE_INSURANCE_FUND_GAS_LIMIT: 1400000,
  CLAIM_OPERATOR_FEE_GAS_LIMIT: 7000000,
  TAKER_OVER_OPERATOR_GAS_LIMIT: 300000,
  TRANSFER_OPERATOR_GAS_LIMIT: 1100000,
  STAKE_GAS_LIMIT: 2400000,
  UNSTAKE_GAS_LIMIT: 1800000,
  VOTE_POOL_PROPOSAL_GAS_LIMIT: 3000000,
  CLAIM_SATORI_MINING_REWARD: 1500000,
  DELEGATE_VOTER_GAS_LIMIT: 4000000,
  SUBSCRIBE_SATORI_GAS_LIMIT: 14000000,
  SETTLE_SATORI_GAS_LIMIT: 14000000,
  CLAIM_SATORI_GAS_LIMIT: 14000000,
  PERP_SETTLE_CLEAR_GAS_LIMIT: 7000000,
  PERP_SETTLE_WITHDRAW_GAS_LIMIT: 7000000,
  PERP_SET_EMERGENCY_GAS_LIMIT: 7000000,
  SET_TARGET_LEVERAGE_GAS_LIMIT: 1160000,
  ARB_L1_DEPOSIT_ETH_GAS_LIMIT: 50 * 1000,
  ARB_L1_DEPOSIT_ERC20_GAS_LIMIT: 200 * 1000,
  ARB_L1_CLAIM_ETH_GAS_LIMIT: 50 * 1000,
  ARB_L1_CLAIM_ERC20_GAS_LIMIT: 200 * 1000,
  ARB_L1_MESSAGE_GAS_LIMIT: 50 * 1000,
  ARB_L2_WITHDRAW_ETH_GAS_LIMIT: 50 * 1000,
  ARB_L2_WITHDRAW_ERC20_GAS_LIMIT: 800 * 1000,
  ARB_L2_APPROVE_ERC20_GAS_LIMIT: 800 * 1000,
  ARB_PERP_DEPOSIT_GAS_LIMIT: 15 * 1000 * 1000,
  NEW_TUNABLE_ORACLE_GAS_LIMIT: 2400000,
}

const cloverGasLimit = {
  TRADE_GAS_LIMIT_K: 100000,
  TRADE_GAS_LIMIT_B: 800000,
  TRADE_CLOSE_GAS_LIMIT_K: 100000,
  TRADE_CLOSE_GAS_LIMIT_B: 300000,
  ADD_LIQUIDITY_GAS_LIMIT_K: 150000,
  ADD_LIQUIDITY_GAS_LIMIT_B: 600000,
  REMOVE_LIQUIDITY_GAS_LIMIT_K: 150000,
  REMOVE_LIQUIDITY_GAS_LIMIT_B: 400000,
}

export let gasLimitConfig: any = mainnetGasLimit

if (NETWORK_ENV.CHAIN_ID === SUPPORTED_NETWORK_ID.ARB_TESTNET || NETWORK_ENV.CHAIN_ID === SUPPORTED_NETWORK_ID.ARB) {
  gasLimitConfig = arbGasLimit
} else if (NETWORK_ENV.CHAIN_ID === SUPPORTED_NETWORK_ID.OPTIMISM || NETWORK_ENV.CHAIN_ID === SUPPORTED_NETWORK_ID.OPTIMISM_TESTNET) {
  gasLimitConfig = optGasLimit
} else if (NETWORK_ENV.CHAIN_ID === SUPPORTED_NETWORK_ID.CLOVER_TEST) {
  gasLimitConfig = cloverGasLimit
}
