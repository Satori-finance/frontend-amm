import { Component, Mixins, Watch } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import { CHAIN_ID_TO_DAO_VAULT_ADDRESS } from '@mcdex/mcdex-governance.js'
import _ from 'lodash'
import { queryVaultAssetResult } from '@/api/dao'
import { balanceOf, erc20Decimals, erc20Symbol, getERC20Contract } from '@mcdex/mai3.js'
import { nullIfNotDeployed, toBigNumber } from '@/utils'
import BigNumber from 'bignumber.js'
import { namespace } from 'vuex-class'
import { NETWORK_PROVIDER_RPC_CONFIG, SUPPORTED_NETWORK_ID } from '@/constants'
import { queryPoolLatestNAV, querySpecifiedPools } from '@/api/pool'
import { daoPool } from '@/config/daoPool'
import { ethers } from 'ethers'
import { chainConfigs } from '@/config/chain'
import { getPoolName } from '@/config/pool'

const price = namespace('price')

export interface VaultAssetItem {
  address: string
  tokenName: string
  amount: BigNumber
  decimals: number
  price: BigNumber | null
  value: BigNumber | null
  chainId: number
}

@Component
export class VaultAssetDetailsMixin extends Mixins(ErrorHandlerMixin) {
  @price.Getter('tokenPriceFunc') tokenPriceFunc!: (token: string, networkId: number) => BigNumber | null
  @price.Action('updateTokenPrice') updateTokenPrice!: (payload: { tokens: string[], networkId: number }) => Promise<void>

  protected vaultAssetsLoading: boolean = true
  protected tokenPriceLoading: boolean = true
  protected arbAssetsList: VaultAssetItem[] = []
  protected bscAssetsList: VaultAssetItem[] = []
  protected arbLPTokenList: VaultAssetItem[] = []
  protected bscLPTokenList: VaultAssetItem[] = []
  protected vaultAddress = CHAIN_ID_TO_DAO_VAULT_ADDRESS[SUPPORTED_NETWORK_ID.ARB]
  protected bscVaultAddress = '0xBE82221CDcfdff9fd7d5f0520aBA197B04C7172A'
  protected arbPools = daoPool[SUPPORTED_NETWORK_ID.ARB]
  protected bscPools = daoPool[SUPPORTED_NETWORK_ID.BSC]
  protected arbProvider = new ethers.providers.StaticJsonRpcProvider({
    url: NETWORK_PROVIDER_RPC_CONFIG[SUPPORTED_NETWORK_ID.ARB],
    timeout: 30000,
  })
  protected bscProvider = new ethers.providers.StaticJsonRpcProvider({
    url: NETWORK_PROVIDER_RPC_CONFIG[SUPPORTED_NETWORK_ID.BSC],
    timeout: 30000,
  })

  private timer = 0

  get noData(): boolean {
    return this.totalAssetsList.length === 0
  }

  get assetsList() {
    return new Array<VaultAssetItem>().concat(this.arbAssetsList).concat(this.bscAssetsList)
  }

  get totalAssetsList(): VaultAssetItem[] {
    if (this.arbLPTokenList.length === 1) {
      this.arbLPTokenList[0].tokenName = this.getPoolName(daoPool[SUPPORTED_NETWORK_ID.ARB][0], SUPPORTED_NETWORK_ID.ARB)
    }
    if (this.bscLPTokenList.length === 1) {
      this.bscLPTokenList[0].tokenName = this.getPoolName(daoPool[SUPPORTED_NETWORK_ID.BSC][0], SUPPORTED_NETWORK_ID.BSC)
    }
    return this.arbLPTokenList.concat(this.bscLPTokenList).concat(this.assetsList).filter(item => item.amount.gt(0))
  }

  get loadAssetsCompleted() {
    return !this.tokenPriceLoading && !this.vaultAssetsLoading && !this.totalAssetsList.find(asset => asset.value === null)
  }

  get vaultAssetsTotalUSD() {
    if (!this.totalAssetsList || this.totalAssetsList.length === 0) {
      return toBigNumber('0')
    }
    const totalVaultAssetValue = _.sumBy(this.totalAssetsList, (o) => {
      return Number(o.value)
    })
    return toBigNumber(totalVaultAssetValue)
  }

  mounted() {
    this.getDataFunc()

    this.timer = window.setInterval(() => {
      this.getDataFunc(false)
    }, 30000)
  }

  destroyed() {
    window.clearInterval(this.timer)
  }

  async getDataFunc(showLoading = true) {
    try {
      this.vaultAssetsLoading = showLoading
      this.tokenPriceLoading = showLoading
      const [arbLpTokens, bscLpTokens] = await Promise.all([
        this.getArbLPToken(),
        this.getBscLPToken(),
      ])
      const [arbAssetsList, bscAssetsList] = await Promise.all([this.getArbVaultAssets(), this.getBscVaultAssets()])
      this.arbAssetsList = arbAssetsList
      this.bscAssetsList = bscAssetsList
      this.arbLPTokenList = arbLpTokens
      this.bscLPTokenList = bscLpTokens
    } finally {
      this.vaultAssetsLoading = false
      this.tokenPriceLoading = false
    }
  }

  getPoolName(poolAddress: string, chainId: number) {
    return getPoolName(poolAddress, chainId) + ' LP token'
  }

  async getArbVaultAssets() {
    const data = await this.callGraphApiFunc(() => {
      return queryVaultAssetResult(chainConfigs[SUPPORTED_NETWORK_ID.ARB].subgraphConfig.dataSubgraph)
    })
    if (!data || data.factories.length === 0) {
      return []
    }
    let assetsList: VaultAssetItem[] = []
    const vaultAssetCollaterals = data.factories[0].collaterals || []
    if (!this.arbProvider) {
      return []
    }

    this.updateTokenPrice({ tokens: vaultAssetCollaterals, networkId: SUPPORTED_NETWORK_ID.ARB })

    // conver query data to page data
    for (let i = 0; i < vaultAssetCollaterals.length; i++) {
      const collateralAddress = vaultAssetCollaterals[i]
      const erc20Contract = getERC20Contract(collateralAddress, this.arbProvider)
      let [
        assetTokenDecimals,
        assetTokenName,
      ] = await Promise.all([
        erc20Decimals(erc20Contract).catch((e: Error) => nullIfNotDeployed(e)),
        erc20Symbol(erc20Contract).catch((e: Error) => nullIfNotDeployed(e)),
      ])
      if (!assetTokenDecimals || !assetTokenName) {
        continue
      }
      const assetTokenBalance = await balanceOf(erc20Contract, this.vaultAddress, assetTokenDecimals)
      const price = this.tokenPriceFunc(collateralAddress, SUPPORTED_NETWORK_ID.ARB)

      assetsList.push({
        address: collateralAddress,
        tokenName: assetTokenName,
        amount: assetTokenBalance,
        decimals: assetTokenDecimals,
        price: price || null,
        value: price?.times(assetTokenBalance) || null,
        chainId: SUPPORTED_NETWORK_ID.ARB,
      })
    }
    return assetsList
  }

  async getBscVaultAssets(showLoading = true) {
    const data = await this.callGraphApiFunc(() => {
      return queryVaultAssetResult(chainConfigs[SUPPORTED_NETWORK_ID.BSC].subgraphConfig.dataSubgraph)
    })
    if (!data || data.factories.length === 0) {
      return []
    }
    let assetsList: VaultAssetItem[] = []
    const vaultAssetCollaterals = data.factories[0].collaterals || []
    if (!this.arbProvider) {
      return []
    }

    this.updateTokenPrice({ tokens: vaultAssetCollaterals, networkId: SUPPORTED_NETWORK_ID.BSC })

    // conver query data to page data
    for (let i = 0; i < vaultAssetCollaterals.length; i++) {
      const collateralAddress = vaultAssetCollaterals[i]
      const erc20Contract = getERC20Contract(collateralAddress, this.bscProvider)
      let [
        assetTokenDecimals,
        assetTokenName,
      ] = await Promise.all([
        erc20Decimals(erc20Contract).catch((e: Error) => nullIfNotDeployed(e)),
        erc20Symbol(erc20Contract).catch((e: Error) => nullIfNotDeployed(e)),
      ])
      if (!assetTokenDecimals || !assetTokenName) {
        continue
      }
      const assetTokenBalance = await balanceOf(erc20Contract, this.bscVaultAddress, assetTokenDecimals)
      const price = this.tokenPriceFunc(collateralAddress, SUPPORTED_NETWORK_ID.BSC)

      assetsList.push({
        address: collateralAddress,
        tokenName: assetTokenName,
        amount: assetTokenBalance,
        decimals: assetTokenDecimals,
        price: price || null,
        value: price?.times(assetTokenBalance) || null,
        chainId: SUPPORTED_NETWORK_ID.BSC,
      })
    }
    return assetsList
  }

  async getArbLPToken() {
    let LPTokenList: VaultAssetItem[] = []
    const daoPools = await this.getDaoPools(this.arbPools, SUPPORTED_NETWORK_ID.ARB)
    if (!daoPools || daoPools.length === 0) {
      return []
    }

    this.updateTokenPrice({
      tokens: daoPools.map(p => p.collateralAddress!),
      networkId: SUPPORTED_NETWORK_ID.ARB,
    })

    await Promise.all(daoPools.map(async (pool) => {
      const shareAddress = pool.shareAddress
      const collateralAddress = pool.collateralAddress
      const shareTokenName = this.getPoolName(pool.id, SUPPORTED_NETWORK_ID.ARB) + `(${pool.id.slice(0, 4)}...${pool.id.slice(-4)})`

      const erc20Contract = getERC20Contract(shareAddress || '', this.arbProvider)
      let shareTokenDecimals = await erc20Decimals(erc20Contract).catch((e: Error) => nullIfNotDeployed(e))

      const netAssetValue = await this.getNetAssetValue(pool.id, SUPPORTED_NETWORK_ID.ARB)
      const shareTokenPrice = this.tokenPriceFunc(collateralAddress || '', SUPPORTED_NETWORK_ID.ARB)?.times(netAssetValue || '')

      if (!shareTokenDecimals || !shareAddress) {
        return
      }
      const shareTokenAmount = await balanceOf(erc20Contract, this.vaultAddress, shareTokenDecimals)
      LPTokenList.push({
        address: shareAddress,
        tokenName: shareTokenName,
        amount: shareTokenAmount,
        decimals: shareTokenDecimals,
        price: shareTokenPrice || null,
        value: shareTokenPrice?.times(shareTokenAmount) || null,
        chainId: SUPPORTED_NETWORK_ID.ARB,
      })
    }))
    return LPTokenList
  }

  async getBscLPToken(showLoading = true) {
    let LPTokenList: VaultAssetItem[] = []
    const daoPools = await this.getDaoPools(this.bscPools, SUPPORTED_NETWORK_ID.BSC)
    if (!daoPools || daoPools.length === 0) {
      return []
    }

    this.updateTokenPrice({
      tokens: daoPools.map(p => p.collateralAddress!),
      networkId: SUPPORTED_NETWORK_ID.BSC,
    })

    await Promise.all(daoPools.map(async (pool) => {
      const shareAddress = pool.shareAddress
      const collateralAddress = pool.collateralAddress
      const shareTokenName = this.getPoolName(pool.id, SUPPORTED_NETWORK_ID.BSC) + `(${pool.id.slice(0, 4)}...${pool.id.slice(-4)})`

      const erc20Contract = getERC20Contract(shareAddress || '', this.bscProvider)
      let shareTokenDecimals = await erc20Decimals(erc20Contract).catch((e: Error) => nullIfNotDeployed(e))

      const netAssetValue = await this.getNetAssetValue(pool.id, SUPPORTED_NETWORK_ID.BSC)
      const shareTokenPrice = this.tokenPriceFunc(collateralAddress || '', SUPPORTED_NETWORK_ID.BSC)?.times(netAssetValue || '')

      if (!shareTokenDecimals || !shareAddress) {
        return
      }
      const shareTokenAmount = await balanceOf(erc20Contract, this.bscVaultAddress, shareTokenDecimals)

      LPTokenList.push({
        address: shareAddress,
        tokenName: shareTokenName,
        amount: shareTokenAmount,
        decimals: shareTokenDecimals,
        price: shareTokenPrice || null,
        value: shareTokenPrice?.times(shareTokenAmount) || null,
        chainId: SUPPORTED_NETWORK_ID.BSC,
      })
    }))
    return LPTokenList
  }

  async getDaoPools(pools: string[], chainId: number) {
    let data = await this.callGraphApiFunc(async () => {
      return querySpecifiedPools(pools || [], chainConfigs[chainId].subgraphConfig.dataSubgraph)
    })
    if (!data || data.pools.length === 0) {
      return
    }
    return data.pools.map((pool) => {
      return {
        id: pool.id,
        shareAddress: pool.shareAddress,
        collateralAddress: pool.collateralAddress,
      }
    })
  }

  async getNetAssetValue(poolId: string, chainId: number) {
    if (poolId === '') {
      return
    }
    const nav = await this.callGraphApiFunc(() => {
      return queryPoolLatestNAV(poolId, chainConfigs[chainId].subgraphConfig.dataSubgraph)
    })
    if (!nav || nav.poolDayDatas.length === 0) {
      return
    }
    return toBigNumber(nav.poolDayDatas[0].netAssetValue)
  }
}
