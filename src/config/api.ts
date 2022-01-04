import { NETWORK_ENV } from '@/const'

export const BASE_URL = NETWORK_ENV.SERVER_API_URL || ''
export const API_TIMEOUT = 20000

export const MAX_RECENT_TRADE_AMOUNT = 100
export const MAX_RECENT_TRADE_BEFORE_TIMESTAMP = 3600 * 24
