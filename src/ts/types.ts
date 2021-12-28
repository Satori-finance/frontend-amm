export enum ORDER_TYPE {
  LimitOrder = 'limit',
  MarketOrder = 'market',
  StopLimitOrder = 'stop-limit',
  StopMarketOrder = 'stop-market'
}

export enum WS_ORDER_TYPE {
  LimitOrder = 1,
  StopLimitOrder = 2
}

export enum ORDER_STATUS {
  OrderCanceled = 'canceled',
  OrderPending = 'pending',
  OrderPartialFilled = 'partial_filled',
  OrderFullFilled = 'full_filled',
  OrderEmpty = ''
}

export enum ORDER_SIDE {
  Buy = 'buy',
  Sell = 'sell'
}

export enum ORDER_CANCEL_REASON {
  CancelReasonExpired = 'EXPIRED',
  CancelReasonAdminCancel = 'CANCELED_BY_ADMIN',
  CancelReasonUserCancel = 'CANCELED_BY_USER',
  CancelReasonCloseOnly = 'CANCELED_BY_CLOSE_ONLY',
  CancelReasonTransactionFail = 'TRANSACTION_FAIL',
  CancelReasonRemainTooSmall = 'REMAIN_TOO_SMALL',
  CancelReasonMatchTooSmall = 'MATCH_TOO_SMALL',
  CancelReasonNoMoreMarket = 'NO_MORE_MARKET',
  CancelReasonTooManyMatches = 'TOO_MANY_MATCHES',
  CancelReasonInternalError = 'INTERNAL_ERROR',
  CancelReasonSelfTrade = 'SELF_TRADE',
  CancelReasonInsufficientFunds = 'INSUFFICIENT_FUNDS',
  CancelReasonCannotEnterPositionByMarketOrder = 'CAN_NOT_ENTER_POSITION_BY_MARKET_ORDER_AFTER_EXPIRED',
  CancelReasonLongPriceTooHighAfterExpired = 'LONG_PRICE_TOO_HIGH_AFTER_EXPIRED',
  CancelReasonShortPriceTooLowAfetrExpired = 'SHORT_PRICE_TOO_LOW_AFTER_EXPIRED',
  CancelReasonContractSettled = 'CONTRACT_SETTLED',
  CancelReasonPostOnlyOrderWouldTake = 'POST_ONLY_ORDER_WOULD_TAKE',
  CancelReasonGasNotEnough = 'GAS_NOT_ENOUGH',
}

export enum OrderWSStatus {
  UNKNOWN,
  INITIALIZED,
  CONNECTING,
  CONNECTED,
  DISCONNECTED,
}
