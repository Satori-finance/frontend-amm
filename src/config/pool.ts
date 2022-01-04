import { ellipsisMiddle } from '@/utils'
import { SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/const'

// poolAddress: poolName
export let certifiedPools: { [targetNetwork: number]: Array<{poolAddress: string, name: string, poolIcon?: string}> } = {}

export let liquidityMiningPools: { [targetNetwork: number]: Array<{poolAddress: string, name: string, poolIcon?: string}> } = {}

window.SATORI_CONFIG?.onResolve('pool').then(config => {
  Object.assign(certifiedPools, config.certifiedPools)
  Object.assign(liquidityMiningPools, config.liquidityMiningPools)
})

export function getCertifiedPoolsByChain(chainId = TARGET_NETWORK_ID) {
  return certifiedPools[chainId] || []
}

export function certifiedPoolsAddress(chainId = TARGET_NETWORK_ID): string[] {
  const currentChainPools = certifiedPools[chainId]
  if (!currentChainPools) {
    return []
  }
  return currentChainPools.map(pool => pool.poolAddress.toLowerCase())
}

export function getPoolName(poolAddress: string, chainId = TARGET_NETWORK_ID): string {
  const currentChainPools = certifiedPools[chainId]
  if (!currentChainPools) {
    return ellipsisMiddle(poolAddress)
  }
  return currentChainPools.find(pool => pool.poolAddress.toLowerCase() === poolAddress.toLowerCase())?.name || ellipsisMiddle(poolAddress)
}
