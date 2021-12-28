import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { API_TIMEOUT, BASE_URL } from '@/config/api'
import {
  RelayerServerNetworkError,
  RelayerApiError,
  OracleChartServerNetworkError,
  TradingMiningServerNetworkError,
} from '@/type'
import { AUTH_EVENT, VUE_EVENT_BUS } from '@/event'
import { currentChainConfig } from '@/config/chain';

export class APIClient {
  protected axios: AxiosInstance

  constructor(serverUrl: string, timeout = API_TIMEOUT) {
    this.axios = axios.create({
      baseURL: serverUrl,
      timeout: timeout,
    })
  }

  request(config: AxiosRequestConfig) {
    return this.axios.request(config)
  }

  setHeader(options: { [key: string]: string | number }) {
    this.axios.defaults.headers = { ...this.axios.defaults.headers, ...options }
  }

  setResponseInterceptors(onFulfilled?: (value: any) => any | Promise<any>, onRejected?: (error: any) => any) {
    this.axios.interceptors.response.use(onFulfilled, onRejected)
  }
}

export class RelayerServerAPIClient extends APIClient {

  constructor(serverUrl: string, timeout = API_TIMEOUT) {
    super(serverUrl, timeout)
    this.setDefaultResponseInterceptors()
  }

  setAuthHeader(jwt: string) {
    this.setHeader({ Authentication: `Bearer ${jwt}` })
  }

  clearAuthHeader() {
    const header = { ...this.axios.defaults.headers }
    delete header.Authentication
    this.axios.defaults.headers = header
  }

  setDefaultResponseInterceptors() {
    this.setResponseInterceptors(
      (response) => {
        if (response.status != 200) {
          throw new RelayerServerNetworkError()
        }
        if (response.data && response.data.status < 0) {
          if (response.data.status == -11) {
            VUE_EVENT_BUS.emit(AUTH_EVENT.AUTH_ERROR)
            return
          } else {
            throw new RelayerApiError(response.data)
          }
        }
        return response.data
      },
      function(error) {
        return Promise.reject(error)
      },
    )
  }
}

export class OracleChartServerAPIClient extends APIClient {

  constructor(serverUrl: string, timeout = API_TIMEOUT) {
    super(serverUrl, timeout)
    this.setDefaultResponseInterceptors()
  }

  setDefaultResponseInterceptors() {
    this.setResponseInterceptors(
      (response) => {
        if (response.status != 200) {
          throw new OracleChartServerNetworkError()
        }
        return response.data
      },
      function(error) {
        return Promise.reject(error)
      },
    )
  }
}

export class TradingMiningServerAPIClient extends APIClient {

  constructor(serverUrl: string, timeout = API_TIMEOUT) {
    super(serverUrl, timeout)
    this.setDefaultResponseInterceptors()
  }

  setDefaultResponseInterceptors() {
    this.setResponseInterceptors(
      (response) => {
        if (response.status != 200) {
          throw new TradingMiningServerNetworkError()
        }
        return response.data
      },
      function(error) {
        return Promise.reject(error)
      },
    )
  }
}

export const defaultRelayerServerAPIClient = new RelayerServerAPIClient(BASE_URL)
export const defaultOracleChartAPIClient = new OracleChartServerAPIClient(currentChainConfig.backendConfig.oracleService)
export const defaultTradingMiningAPIClient = new OracleChartServerAPIClient(currentChainConfig.backendConfig.tradingMiningService)
export const defaultGasFeeRebateAPIClient = new OracleChartServerAPIClient(currentChainConfig.backendConfig.gasFeeRebate)
