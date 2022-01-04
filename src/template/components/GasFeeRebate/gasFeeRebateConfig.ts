import { SUPPORTED_NETWORK_ID } from '@/const'
import { currentChainConfig } from '@/config/chain'
import BigNumber from 'bignumber.js'

export interface GasFeeRebateEpochInfo {
  startTimestamp: number
  endTimestamp: number
  rebatePrice: BigNumber | null
}
export type GasFeeRebateConfigs = {[weekId: number]: GasFeeRebateEpochInfo}

export const MultiChainGasFeeRebateRateConfigs: {[chainId: number]: {
  [id: number]: {
    startTimestamp: number
    endTimestamp: number
    rate: number  // e: 100%
  }
}} = {
  [SUPPORTED_NETWORK_ID.BSC]: {
    0: {
      startTimestamp: 1636977600,
      endTimestamp: 1639569600,
      rate: 100
    },
    1: {
      startTimestamp: 1639569600,
      endTimestamp: 1642248000,
      rate: 90
    },
    2: {
      startTimestamp: 1642248000,
      endTimestamp: 1644926400,
      rate: 80
    }
  },
  [SUPPORTED_NETWORK_ID.ARB_TESTNET]: {
    0: {
      startTimestamp: 1636698600,
      endTimestamp: 1636707600,
      rate: 100
    },
    1: {
      startTimestamp: 1636707600,
      endTimestamp: 1636716600,
      rate: 90
    },
    2: {
      startTimestamp: 1636716600,
      endTimestamp: 1636725600,
      rate: 80
    }
  }
}

const BscGasFeeRebateConfigs: GasFeeRebateConfigs = {
  0: {
    startTimestamp: 1636977600,
    endTimestamp: 1637582400,
    rebatePrice: new BigNumber('0.047482757')
  },
  1: {
    startTimestamp: 1637582400,
    endTimestamp: 1638187200,
    rebatePrice: new BigNumber('0.03563904212')
  },
  2: {
    startTimestamp: 1638187200,
    endTimestamp: 1638792000,
    rebatePrice: new BigNumber('0.03085826121')
  },
  3: {
    startTimestamp: 1638792000,
    endTimestamp: 1639396800,
    rebatePrice: null
  },
  4: {
    startTimestamp: 1639396800,
    endTimestamp: 1640001600,
    rebatePrice: null
  },
  5: {
    startTimestamp: 1640001600,
    endTimestamp: 1640606400,
    rebatePrice: null
  },
  6: {
    startTimestamp: 1640606400,
    endTimestamp: 1641211200,
    rebatePrice: null
  },
  7: {
    startTimestamp: 1641211200,
    endTimestamp: 1641816000,
    rebatePrice: null
  },
  8: {
    startTimestamp: 1641816000,
    endTimestamp: 1642420800,
    rebatePrice: null
  },
  9: {
    startTimestamp: 1642420800,
    endTimestamp: 1643025600,
    rebatePrice: null
  },
  10: {
    startTimestamp: 1643025600,
    endTimestamp: 1643630400,
    rebatePrice: null
  },
  11: {
    startTimestamp: 1643630400,
    endTimestamp: 1644235200,
    rebatePrice: null
  },
  12: {
    startTimestamp: 1644235200,
    endTimestamp: 1644840000,
    rebatePrice: null
  },
}

const ArbTestnetGasFeeRebateConfigs: GasFeeRebateConfigs = {
  0: {
    startTimestamp: 1636698600,
    endTimestamp: 1636704000,
    rebatePrice: new BigNumber(0.0356)
  },
  1: {
    startTimestamp: 1636704000,
    endTimestamp: 1636709400,
    rebatePrice: null
  },
  2: {
    startTimestamp: 1636709400,
    endTimestamp: 1636714800,
    rebatePrice: null
  },
  3: {
    startTimestamp: 1636714800,
    endTimestamp: 1636720200,
    rebatePrice: null
  },
  4: {
    startTimestamp: 1636720200,
    endTimestamp: 1636725600,
    rebatePrice: null
  },
}

export const MultiChainGasFeeRebateConfigs: {[chainId: number]: GasFeeRebateConfigs} = {
  [SUPPORTED_NETWORK_ID.BSC]: BscGasFeeRebateConfigs,
  [SUPPORTED_NETWORK_ID.ARB_TESTNET]: ArbTestnetGasFeeRebateConfigs,
}

export const currentChainEpochsConfig: GasFeeRebateConfigs = MultiChainGasFeeRebateConfigs[currentChainConfig.chainID]

function checkCurrentChainEpoch(): number {
  const nowTimestamp = Math.ceil(Date.now() / 1000)
  for (let weekId in currentChainEpochsConfig) {
    const epochConfig = currentChainEpochsConfig[weekId]
    if (nowTimestamp > epochConfig.startTimestamp && nowTimestamp <= epochConfig.endTimestamp) {
      return Number(weekId)
    }
  }
  return -1
}

function checkCurrentChainEpochRate(): number {
  const nowTimestamp = Math.ceil(Date.now() / 1000)
  for (let id in MultiChainGasFeeRebateRateConfigs[currentChainConfig.chainID]) {
    const item = MultiChainGasFeeRebateRateConfigs[currentChainConfig.chainID][id]
    if (nowTimestamp > item.startTimestamp && nowTimestamp <= item.endTimestamp) {
      return item.rate
    }
  }
  return -1
}

function checkAllEpochIsEnd(): boolean {
  const nowTimestamp = Math.ceil(Date.now() / 1000)
  if (!currentChainEpochsConfig) {
    return true
  }
  const maxEpochId = Math.max(...Object.keys(currentChainEpochsConfig).map(i => Number(i)))
  const maxEpochInfo = currentChainEpochsConfig[maxEpochId]
  return nowTimestamp > maxEpochInfo.endTimestamp
}

function checkChainEpochHistoryList(): number[] {
  let r: number[] = []
  const nowTimestamp = Math.ceil(Date.now() / 1000)
  if (!currentChainEpochsConfig) {
    return []
  }
  for (let weekId in currentChainEpochsConfig) {
    const epochConfig = currentChainEpochsConfig[weekId]
    if (nowTimestamp > epochConfig.endTimestamp) {
      r.push(Number(weekId))
    }
  }
  return r.sort().reverse()
}

export const gasFeeRebateIsEnd: boolean = checkAllEpochIsEnd()
export const currentChainEpochGasFeeRebateId: number = checkCurrentChainEpoch()
export const currentChainEpochGasFeeRebateRate: number = checkCurrentChainEpochRate()
export const currentChainEpochHistoryList: number[] = checkChainEpochHistoryList()
