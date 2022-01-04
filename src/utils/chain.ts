import { chainConfigs, chainParamsMap, currentChainConfig } from '@/config/chain'
import BigNumber from 'bignumber.js'
import { Provider } from '@ethersproject/providers'
import {
  DEFAULT_NETWORK,
  NETWORK_ENV_CONFIG,
  NETWORK_ID_NAME,
  SUPPORTED_NETWORK_ID,
  TARGET_NETWORK_ID,
} from '@/const'
import { MetaMaskInjectedProvider, SUPPORTED_WALLET } from '@/business-components/wallet/wallet-connector'
import vuexStore from '@/store'

const _wad = new BigNumber('1000000000000000000')

export function isNativeToken(address: string): boolean {
  return address.toLowerCase() === currentChainConfig.assetAddress.toLowerCase()
}

export function estimateBlockTime(currentBlock: number, targetBlock: number, network = TARGET_NETWORK_ID): number {
  const currentTimestamp = Math.floor(Date.now() / 1000)
  if (targetBlock === 0 || currentBlock === targetBlock) return currentTimestamp
  const intervalBlock = Math.max(targetBlock - currentBlock, 0)
  const chain = chainConfigs[network]
  return currentTimestamp + (intervalBlock * chain.blockGenerationInterval)
}

export function toWad(x: BigNumber | string): string {
  return new BigNumber(x).times(_wad).dp(0, BigNumber.ROUND_DOWN).toFixed()
}

export function fromWad(x: BigNumber | string): string {
  return new BigNumber(x).div(_wad).toFixed()
}

export async function getBlockTimestamp(provider: Provider, latestBlockNumber: number, blockNumber: number): Promise<number> {
  if (latestBlockNumber >= blockNumber) {
    return (await provider.getBlock(blockNumber)).timestamp
  }
  return estimateBlockTime(latestBlockNumber, blockNumber)
}

export function supportChainAutoChange(network: SUPPORTED_NETWORK_ID) {
  return chainParamsMap.has(network)
}

function redirectToChain(networkId: number) {
  const config = NETWORK_ENV_CONFIG[networkId] || NETWORK_ENV_CONFIG[DEFAULT_NETWORK]
  if (TARGET_NETWORK_ID !== networkId && TARGET_NETWORK_ID !== config.CHAIN_ID) { // if no existed config, don't reload
    console.log(networkId)
    let url = ''
    if (/chainId=[0-9]*/.test(window.location.href)) {
      url = window.location.href.replace(/chainId=[0-9]*/, `chainId=${networkId}`)
    } else if (/\?/.test(window.location.href)) {
      url = `${window.location.href}&chainId=${networkId}`
    } else {
      url = `${window.location.href}?chainId=${networkId}`
    }
    window.open(url, '_self')
  }
}

export async function connectChain(network: SUPPORTED_NETWORK_ID, walletType: SUPPORTED_WALLET | null) {
  if (!supportChainAutoChange(network)) {
    return
  }
  if (walletType !== SUPPORTED_WALLET.MetaMask) {
    redirectToChain(network)
    return
  }
  const walletNetworkId = vuexStore.getters['wallet/walletNetworkId']
  if (walletNetworkId === null) {
    redirectToChain(network)
    return
  }
  try {
    await ((window.ethereum as unknown) as MetaMaskInjectedProvider).request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${network.toString(16)}` }],
    })
    redirectToChain(network)
  } catch (e) {
    if (e.code === 4902 || e.data?.originalError?.code === 4902) {
      try {
        await ((window.ethereum as unknown) as MetaMaskInjectedProvider).request({
          method: 'wallet_addEthereumChain',
          params: chainParamsMap.get(network),
        });
        redirectToChain(network)
      } catch (addError) {
        console.warn(`[Added ${NETWORK_ID_NAME[network]} failed] `, e)
        throw e
      }
    } else {
      console.warn(`[Switch to ${NETWORK_ID_NAME[network]} failed] `, e)
      throw e
    }
  }
}

export async function addERC20TokenToWallet(
  walletType: SUPPORTED_WALLET,
  tokenAddress: string,
  tokenSymbol: string,
  tokenDecimals: number,
  tokenImage: string = '',
) {
  if (walletType !== SUPPORTED_WALLET.MetaMask) {
    return
  }
  try {
    await ((window.ethereum as unknown) as MetaMaskInjectedProvider).request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: tokenAddress,
          symbol: tokenSymbol,
          decimals: tokenDecimals,
          image: tokenImage,
        }
      }
    })
  } catch (e) {
    console.warn(`[Add ${tokenSymbol}(${tokenAddress}) failed] `, e)
    throw e
  }
}
