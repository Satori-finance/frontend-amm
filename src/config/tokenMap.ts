import { L1_NETWORK_ID, SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/constants'

export const tokenMapPair: { [networkID: number]: [string, string][] } = {}

window.SATORI_CONFIG?.onResolve('token').then(config => {
  const tokenMapToMainnet = config?.tokenMapToMainnet || {}
  for (let tokenMapToMainnetKey in tokenMapToMainnet) {
    tokenMapPair[Number(tokenMapToMainnetKey)] = tokenMapToMainnet[tokenMapToMainnetKey].map((pair: string[]) => pair.map(address => address.toLowerCase()))
  }
})

export const tokenMap: Map<string, string> = new Map<string, string>(tokenMapPair[TARGET_NETWORK_ID] || [])
export const l1TokenMap: Map<string, string> = new Map<string, string>(tokenMapPair[L1_NETWORK_ID] || [])
