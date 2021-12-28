import { Provider } from '@ethersproject/providers'
import { DumOracleRouterPath, DumUniswapV3RouterPath, PerpetualOracleType, TunableOracleInfo } from '@/type'
import { ethers } from 'ethers'
import { getOracleInfo, tunableOracleMap } from '@/config/oracle'
import {
  CHAIN_ID_TO_TUNABLE_ORACLE_REGISTER_ADDRESS,
  DECIMALS,
  OracleRouterFactory,
  UniswapV3OracleAdaptorFactory,
} from '@mcdex/mai3.js'
import { NETWORK_PROVIDER_RPC_CONFIG, SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/constants'
import { TunableOracleRegisterFactory } from '@mcdex/mai3.js/dist/abi/TunableOracleRegisterFactory'
import { TunableOracleFactory } from '@mcdex/mai3.js/dist/abi/TunableOracleFactory'
import BigNumber from 'bignumber.js'

export function isWhitelistOracle(oracleAddress: string): boolean {
  return getOracleInfo(oracleAddress) !== null
}

export async function checkIsOracleRouterOracle(
  oracleAddress: string,
  provider: Provider | ethers.Signer,
): Promise<boolean> {
  try {
    const oracleRouterContract = OracleRouterFactory.connect(oracleAddress, provider)
    await oracleRouterContract.dumpPath()
    return true
  } catch (e) {
    return false
  }
}

export async function checkIsUniswapV3Oracle(
  oracleAddress: string,
  provider: Provider | ethers.Signer,
): Promise<boolean> {
  try {
    const uniswapRouterContract = UniswapV3OracleAdaptorFactory.connect(oracleAddress, provider)
    await uniswapRouterContract.dumpPath()
    return true
  } catch (e) {
    return false
  }
}

export async function getPerpetualOracleType(
  oracleAddress: string,
  provider: Provider | ethers.Signer,
): Promise<PerpetualOracleType> {
  const isWhitelist = getOracleInfo(oracleAddress)
  if (isWhitelist) {
    return 'whitelist'
  }
  const IsOracleRouterOracle = await checkIsOracleRouterOracle(oracleAddress, provider)
  if (IsOracleRouterOracle) {
    return 'oracleRouter'
  }
  const IsUniswapV3Oracle = await checkIsUniswapV3Oracle(oracleAddress, provider)
  if (IsUniswapV3Oracle) {
    return 'uniswapv3'
  }
  return 'custom'
}

export async function getOracleRouterDmpPath(
  oracleAddress: string,
  provider: Provider | ethers.Signer,
): Promise<DumOracleRouterPath[]> {
  let result: DumOracleRouterPath[] = []
  const contract = OracleRouterFactory.connect(oracleAddress, provider)
  const data = await contract.dumpPath()
  data.forEach(item => {
    result.push({
      oracle: item.oracle,
      isInverse: item.isInverse,
      underlyingAsset: item.underlyingAsset,
      collateral: item.collateral,
    })
  })
  return result
}

export async function getUniswapV3RouterPath(
  oracleAddress: string,
  provider: Provider | ethers.Signer,
): Promise<DumUniswapV3RouterPath> {
  const contract = UniswapV3OracleAdaptorFactory.connect(oracleAddress, provider)
  const data = await contract.dumpPath()
  return {
    path: data.path,
    symbols: data.symbols,
    fees: data.fees,
    shortPeriod: data.shortPeriod,
    longPeriod: data.longPeriod,
  }
}

export async function isTunableOracle(oracleAddress: string, network = TARGET_NETWORK_ID) {
  const oracle = tunableOracleMap[network].get(oracleAddress.toLowerCase()) || oracleAddress
  const tunableRegisterAddress = CHAIN_ID_TO_TUNABLE_ORACLE_REGISTER_ADDRESS[network]
  if (!tunableRegisterAddress) {
    return false
  }
  const tunableRegisterContract = TunableOracleRegisterFactory.connect(tunableRegisterAddress, new ethers.providers.StaticJsonRpcProvider({
    url: NETWORK_PROVIDER_RPC_CONFIG[network],
    timeout: 30000,
  }))
  return await tunableRegisterContract.tunableOracles(oracle)
}

export async function getExternalOracleInfo(oracleAddress: string, network = TARGET_NETWORK_ID) {
  const tunableRegisterAddress = CHAIN_ID_TO_TUNABLE_ORACLE_REGISTER_ADDRESS[network]
  if (!tunableRegisterAddress) {
    return null
  }
  const tunableRegisterContract = TunableOracleRegisterFactory.connect(tunableRegisterAddress, new ethers.providers.StaticJsonRpcProvider({
    url: NETWORK_PROVIDER_RPC_CONFIG[network],
    timeout: 30000,
  }))

  const info = await tunableRegisterContract.getExternalOracle(oracleAddress)
  return {
    isAdded: info.isAdded,
    isTerminated: info.isTerminated,
    deviation: new BigNumber(info.deviation.toString()).shiftedBy(-DECIMALS),
    timeout: new BigNumber(info.timeout.toString()).toNumber(),
  }
}

export async function getTunableOracleInfo(oracleAddress: string, network = TARGET_NETWORK_ID): Promise<TunableOracleInfo | null> {
  const oracle = tunableOracleMap[network].get(oracleAddress.toLowerCase()) || oracleAddress
  if (!await isTunableOracle(oracle, network)) {
    return null
  }
  const tunableOracle = TunableOracleFactory.connect(oracle, new ethers.providers.StaticJsonRpcProvider({
    url: NETWORK_PROVIDER_RPC_CONFIG[network],
    timeout: 30000,
  }))
  const [isTerminated, fineTuner, externalOracle, collateral] = await Promise.all([
    tunableOracle.callStatic.isTerminated(),
    tunableOracle.callStatic.fineTuner(),
    tunableOracle.callStatic.externalOracle(),
    tunableOracle.callStatic.collateral(),
  ])
  const externalOracleInfo = await getExternalOracleInfo(externalOracle, network)
  return {
    isTerminated,
    fineTuner,
    collateral,
    externalOracle,
    deviation: externalOracleInfo ? externalOracleInfo.deviation : null,
    timeout: externalOracleInfo ?externalOracleInfo.timeout : null,
  }
}
