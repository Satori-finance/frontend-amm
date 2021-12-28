import { SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/constants'
import { chainConfigs } from '@/config/chain'

export function etherBrowserTxURL(tx: string, networkId: SUPPORTED_NETWORK_ID = TARGET_NETWORK_ID) {
  const chainConfig = chainConfigs[networkId]
  return chainConfig ? `${chainConfig.explorer}/tx/${tx}` : ''
}

export function etherBrowserAddressUrl(address: string, networkId: SUPPORTED_NETWORK_ID = TARGET_NETWORK_ID) {
  const chainConfig = chainConfigs[networkId]
  return chainConfig ? `${chainConfig.explorer}/address/${address}` : ''
}
