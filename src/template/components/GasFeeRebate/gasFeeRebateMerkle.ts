import { currentChainConfig } from '@/config/chain'
import { SUPPORTED_NETWORK_ID } from '@/const'

export type GasFeeRebateEpochClaimUsers = { [epoch: number]: string[][] }

export let gasFeeRebateMerkle: { [chainId: number]: GasFeeRebateEpochClaimUsers } = {}

if (currentChainConfig.chainID === SUPPORTED_NETWORK_ID.BSC
  || currentChainConfig.chainID === SUPPORTED_NETWORK_ID.ARB_TESTNET) {
  window.SATORI_CONFIG?.onResolve('gasFeeRebateMerkle').then(config => {
    gasFeeRebateMerkle = config
  })
}
