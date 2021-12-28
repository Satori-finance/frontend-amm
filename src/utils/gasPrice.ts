import { BigNumber as ethersBigNumber, Signer, utils } from 'ethers'
import { BigNumber } from 'bignumber.js'
import vuexStore from '@/store'
import { SUPPORT_ESTIMATE_GAS_CHAIN } from '@/config/gas'
import { TARGET_NETWORK_ID } from '@/constants'

class GasStation {
  // return gwei
  async getPrice(): Promise<number | null> {
    const signer = vuexStore.getters['wallet/signer'] as Signer | null
    if (signer) {
      const price = await signer.getGasPrice()
      return new BigNumber(price.toString()).shiftedBy(-9).toNumber()
    } else {
      return null
    }
  }
}

const _gasStation = new GasStation()

export async function getGasStationPrice(): Promise<ethersBigNumber | null> {
  const price = await _gasStation.getPrice()
  if (price !== null) {
    return utils.parseUnits(price.toString(), 'gwei')
  }
  return null
}

export async function getGasStationTxParams(
  gasLimit?: number,
  forceUseCustomGasLimit = false
): Promise<{ gasLimit?: number; gasPrice?: ethersBigNumber }> {
  const useCustomGasLimit = forceUseCustomGasLimit || vuexStore.getters['wallet/useCustomGasLimit'] as boolean
  const ret: { gasLimit?: number; gasPrice?: ethersBigNumber } = {}
  if (!SUPPORT_ESTIMATE_GAS_CHAIN.includes(TARGET_NETWORK_ID)) {
    return ret
  }
  const gasPrice = await getGasStationPrice()
  if (gasPrice !== null) {
    ret.gasPrice = gasPrice
  }
  if (useCustomGasLimit && gasLimit) {
    ret.gasLimit = gasLimit
  } else {
    ret.gasLimit = undefined
  }
  return ret
}
