import { Module } from 'vuex'
import {
  getLocalStorage,
  setLocalStorage,
  clearLocalStorage,
  setCookieStorage,
  clearCookieStorage,
} from '@/utils'
import { mcLogger } from '@/utils/mcLogger'
import { defaultRelayerServerAPIClient } from '@/api/client'

const logger = mcLogger('STORE', 'Auth')

interface LoginData {
  address: string
  jwt: string
  expiresAt: number
}

function isLoginData(data: any): data is LoginData {
  if (!data) {
    return false
  }
  const t = data
  return !(
    typeof t.address !== 'string' ||
    typeof t.jwt !== 'string' ||
    typeof t.expiresAt !== 'number'
  )
}


function getLoginDataKey(address: string) {
  return `loginV3-${address}`
}

function saveLoginData(address: string, jwt: string, expiresInMs = 86400000) {
  setLocalStorage(
    getLoginDataKey(address),
    JSON.stringify({
      address,
      jwt,
      expiresAt: Date.now() + expiresInMs - 60000 /* safe margin */,
    }),
  )
}

function clearLoginData(address: string) {
  clearLocalStorage(getLoginDataKey(address))
}

function loadLoginData(address: string) {
  const savedData = getLocalStorage(getLoginDataKey(address))
  if (!savedData) {
    return null
  }
  let loginData: LoginData | null = null
  try {
    const t = JSON.parse(savedData)
    if (isLoginData(t)) {
      loginData = t
    } else {
      return null
    }
  } catch (e) {
    logger.log('parse login data fail, clear login data:', e)
    clearLoginData(address)
    return null
  }
  if (loginData.expiresAt && loginData.expiresAt < Date.now()) {
    logger.log('login data expires, clear login data')
    clearLoginData(address)
    return null
  }
  if (
    !loginData.address ||
    loginData.address.toLowerCase() !== address.toLowerCase()
  ) {
    logger.log('login data address mismatch, clear login data')
    clearLoginData(address)
    return null
  }
  return loginData
}

export interface AuthState {
  jwt: string
  expiresAt: number
}

const module: Module<AuthState, any> = {
  namespaced: true,

  state: () => {
    return {
      jwt: '',
      expiresAt: 0,
    }
  },
  getters: {
    isValidateFunc: state => (): boolean => state.expiresAt > Date.now(),
  },
  actions: {},
  mutations: {
    loadAuthData(state, { address }: { address: string }) {
      const data = loadLoginData(address)
      if (data) {
        state.jwt = data.jwt
        state.expiresAt = data.expiresAt
        defaultRelayerServerAPIClient.setAuthHeader(data.jwt)
        setCookieStorage('mc3a', state.jwt) // for alpha
      } else {
        state.jwt = ''
        state.expiresAt = 0
        logger.log('not validate login data', data)
      }
    },
    setAndSaveAuthData(state, payload) {
      const { address, jwt, expires } = payload
      saveLoginData(address, jwt, expires)
      state.jwt = jwt
      state.expiresAt = Date.now() + expires - 60000 /* safe margin */
      defaultRelayerServerAPIClient.setAuthHeader(state.jwt)
      setCookieStorage('mc3a', state.jwt) // for alpha
    },
    clearAuthData(state, { address }: { address: string }) {
      clearLoginData(address)
      state.jwt = ''
      state.expiresAt = 0
      defaultRelayerServerAPIClient.clearAuthHeader()
      clearCookieStorage('mc3a') // for alpha
    },
  },
}

export default module
