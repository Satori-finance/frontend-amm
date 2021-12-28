export const COMMON_EVENT = Object.freeze({
  BLOCK_CHANGE: 'COMMON_BLOCK_CHANGE',
  LANGUAGE_CHANGED: 'LANGUAGE_CHANGED',
  CHANGE_TARGET_LEVERAGE: 'CHANGE_TARGET_LEVERAGE',
  CHANGE_POOL_LIQUIDITY: 'CHANGE_POOL_LIQUIDITY'
})

export enum PERPETUAL_EVENT {
  PERPETUAL_CHANGE = 'PERPETUAL_CHANGE',
}

export enum ACCOUNT_EVENT {
  CHANGE_MARGIN = 'ACCOUNT_CHANGE_MARGIN',
  REFRESH_USER_DATA = 'ACCOUNT_REFRESH_USER_DATA',
  POSITION_CHANGED = 'ACCOUNT_POSITION_CHANGED',
  WRAP_ETH = 'ACCOUNT_WRAP_ETH'
}

export enum LOGIN_SESSION_EVENT {
  Close = 'login-session-closed',
  ClearLoginData = 'login-session-clear-login-data',
  NewWallet = 'login-session-new-wallet',
  NewAuth = 'login-session-new-auth',
  NetworkChanged = 'login-session-network-changed',
  AddressChanged = 'login-session-address-changed'
}

export enum WALLET_EVENT {
  AddressChanged = 'address-changed',
  Invalid = 'invalid',
  NetworkChanged = 'network-changed',
  Close = 'wallet-close',
  ShowConnectWallet = 'show-connect-wallet'
}

export enum PLACE_ORDER_EVENT {
  InitLoadOrders = 'init-load-orders',
  SetLimitPrice = 'set-limit-price',
  OrderCreated = 'order-created',
  OrderMatching = 'order-matching',
  OrderFilled = 'order-filled',
  OrderCanceled = 'order-canceled',
  OrderUpdate = 'order-update',
  OrderClosed = 'order-closed',
  WSOrderChanged = 'ws-order-changed',
  LoadAllOrders = 'load-all-orders',
  LoadAccountOrderDetails = 'load-account-order-details'
}

export enum AUTH_EVENT {
  CLEAR = 'AUTH_EVENT_CLEAR',
  AUTH = 'AUTH_EVENT_AUTH',
  AUTH_ERROR = 'AUTH_EVENT_AUTH_ERROR'
}

export enum GLOBAL_NOTIFICATION_EVENT {
  SHOW = 'showGlobalNotification',
  HIDE = 'hideGlobalNotification'
}

export enum ERROR_EVENTS {
  ShowMcError = 'showMCError',
  ShowTextError = 'showTextError',
  ShowNodeError = 'showNodeError',
}

export enum GRAPH_EVENTS {
  SHOW = 'GRAPH_ERROR_SHOW',
  HIDE = 'GRAPH_ERROR_HIDE',
}

export enum WS_EVENTS {
  SHOW = 'WS_ERROR_SHOW',
  HIDE = 'WS_ERROR_HIDE',
}

export enum RELAYER_EVENTS {
  SHOW = 'RELAYER_ERROR_SHOW',
  HIDE = 'RELAYER_ERROR_HIDE',
}

export enum PRICE_CHART_EVENTS {
  SHOW = 'PRICE_CHART_ERROR_SHOW',
  HIDE = 'PRICE_CHART_ERROR_HIDE',
}

export enum WALLET_TOKEN_EVENT {
  ADDED_TOKEN = 'WALLET_TOKEN_EVENT_ADDED_TOKEN',
}

export enum FAUCET_EVENT {
  START = 'FAUCET_SEND_START',
  END = 'FAUCET_SEND_END',
}

export enum DAO_GOVERNANCE_EVENT {
  UpdateMyVotes = 'UPDATE_MY_VOTES'
}

export enum POOL_GOVERNANCE_EVENT {
  UpdateMyVotes = 'UPDATE_MY_VOTES'
}

export enum MINING_EVENT {
  SATORIStakingRefreshAccount = 'SATORI_STAKING_REFRESH_ACCOUNT',
  UpdateTradingMiningAccountInfo = 'UPDATE_TRADING_MINING_ACCOUNT_INFO'
}

export enum BRIDGE_EVENT {
  UPDATE_RECORDS = 'BRIDGE_UPDATE_RECORDS'
}

export enum CHAIN_EVENT {
  CHANGE_TO_CHAIN = 'CHAIN_EVENT_CHANGE_TO_CHAIN',
  WRONG_CHAIN = 'CHAIN_EVENT_WRONG_CHAIN'
}

export enum PERMISSION_EVENT {
  PERMISSION_DENIED = 'PERMISSION_EVENT_DENIED'
}
