import { parseJWT } from '@/type/index.validator'
import { defaultRelayerServerAPIClient } from '@/api/client'

enum API_AUTH_TYPE {
  MaiAuth,
  JWTAuth
}

function assembleMaiAuthentication(
  address: string,
  message: string,
  sign: string
) {
  return address + '#' + message + '#' + sign
}

function getAuthHeader(auth: { type: API_AUTH_TYPE; token: string }) {
  switch (auth.type) {
    case API_AUTH_TYPE.MaiAuth:
      return {
        'Mai-Authentication': encodeURIComponent(auth.token || '')
      }
    case API_AUTH_TYPE.JWTAuth:
      return {
        Authentication: 'Bearer ' + auth.token
      }
    default:
      return {}
  }
}

export async function getJWT(address: string, message: string, sign: string) {
  const auth = {
    type: API_AUTH_TYPE.MaiAuth,
    token: assembleMaiAuthentication(address, message, sign)
  }

  const result = (await defaultRelayerServerAPIClient.request({
    url: 'jwt',
    method: 'get',
    headers: getAuthHeader(auth)
  })) as any
  return parseJWT(result.data)
}
