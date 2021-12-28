<template>
  <div class="wallet-panel">
    <div class="container">
      <div class="card-item">
        <McLoading :min-show-time="300" :show-loading="loading" :hide-content="true">
          <div class="title">{{ $t('accountWallet.panel.myNetWorth') }}</div>
          <div class="value">
            {{ netTotal.isNaN() ? '' : '$' }}
            {{ netTotal | bigNumberFormatter(2) }}
          </div>
        </McLoading>
      </div>
      <div class="card-join-item">
        <i class="iconfont icon-equal"></i>
      </div>
      <div class="card-item">
        <McLoading :min-show-time="300" :show-loading="loading" :hide-content="true">
          <div class="title">{{ $t('accountWallet.panel.netWorthOnWallet') }}</div>
          <div class="value">
            {{ netOfWallet.isNaN() ? '' : '$' }}
            {{ netOfWallet | bigNumberFormatter(2) }}
          </div>
        </McLoading>
      </div>
      <div class="card-join-item">
        <i class="iconfont icon-plus"></i>
      </div>
      <div class="card-item">
        <McLoading :min-show-time="300" :show-loading="loading" :hide-content="true">
          <div class="title">{{ $t('accountWallet.panel.netWorthOnMcdex') }}</div>
          <div class="value">
            {{ netOfDex.isNaN() ? '' : '$' }}
            {{ netOfDex | bigNumberFormatter(2) }}
          </div>
        </McLoading>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import { getLocalStorage, getPerpetualFromID } from '@/utils'
import BigNumber from 'bignumber.js'
import { queryPoolsLatestNAV } from '@/api/pool'
import { queryLiquidityAccounts } from '@/api/account'
import { namespace } from 'vuex-class'
import { ErrorHandlerMixin } from '@/mixins'
import _ from 'lodash'
import { _0, AccountStorage } from '@mcdex/mai3.js'
import {
  MarginAccount,
  PerpetualCombinedState,
  TokenBalanceDirectoryItem,
  TokenInfoItem,
} from '@/type'
import { queryMarginAccounts } from '@/api/marginAccount'
import { TOKEN_STORAGE_KEY } from '@/config/tokens/tokens'
import { currentChainConfig } from '@/config/chain'
import { VUE_EVENT_BUS, WALLET_TOKEN_EVENT } from '@/event'
import { McLoading } from '@/components'
import { computeAccountDetails } from '@/utils/account'
import { NETWORK_ENV, SUPPORTED_NETWORK_ID } from '@/constants'

interface TokenInfo {
  collateral: string
  amount: BigNumber
}

const wallet = namespace('wallet')
const price = namespace('price')
const perpetual = namespace('perpetual')
const account = namespace('account')
const token = namespace('token')

@Component({
  components: {
    McLoading,
  },
})
export default class WalletPanel extends Mixins(ErrorHandlerMixin) {
  @wallet.Getter('address') address!: string | null
  @price.Action('updateTokenPrice') updateTokenPrice!: (tokens: string[]) => Promise<void>
  @price.Getter('tokenPriceFunc') tokenPriceFunc!: (token: string) => BigNumber | null
  @perpetual.Action('updateLiquidityPool') updateLiquidityPool!: (pool: string) => Promise<void>
  @perpetual.Getter('getPerpetualFunc') getPerpetualFunc!: (perpetualID: string) => PerpetualCombinedState | null
  @account.Action('updateMarginAccounts') updateMarginAccounts!: () => Promise<void>
  @account.Action('updateAccountStorage') updateAccountStorage!: (perpetualID: string) => Promise<void>
  @account.Action('updateTokenBalance') updateTokenBalance!: (params: { tokenAddress: string }) => Promise<void>
  @account.Getter('accountStorageFunc') accountStorageFunc!: (perpetualID: string) => AccountStorage | null
  @account.Getter('marginAccountFunc') marginAccountFunc!: (perpetualID: string) => MarginAccount | null
  @wallet.State('nativeTokenBalance') nativeTokenBalance!: BigNumber | null
  @wallet.State('nativeTokenBalanceL1') nativeTokenBalanceL1!: BigNumber | null
  @account.Getter('tokenBalanceFunc') tokenBalanceFunc!: (tokenAddress: string) => TokenBalanceDirectoryItem | null
  @token.Getter('chainAllTokenList') chainAllTokenList!: TokenInfoItem[]

  private loadingPrice = false
  private loadingLiquidity: boolean = false
  private perpetualIDs: string[] = []
  private tokenComputedFlag = 0
  private marginAccountTokens: string[] = []
  private liquidityTokens: string[] = []
  private liquidityAmount: TokenInfo[] = []
  private loadDataTimes = 0

  get loading() {
    return this.loadDataTimes === 0 || this.loadingPrice || this.loadingLiquidity
  }

  get netTotal(): BigNumber {
    return this.netOfDex.plus(this.netOfWallet)
  }

  get netOfDex(): BigNumber {
    let value = _0
    const infos = [...this.liquidityAmount, ...this.marginBalanceInfo]
    infos.forEach(item => {
      const price = this.tokenPriceFunc(item.collateral)
      value = value.plus(price ? price.times(item.amount) : _0)
    })
    return value
  }

  get netOfWallet(): BigNumber {
    let value = _0
    this.walletErc20Tokens.forEach(token => {
      const tokenBalance = this.tokenBalanceFunc(token)
      const price = this.tokenPriceFunc(token)
      if (tokenBalance && price) {
        value = value.plus(tokenBalance.balance?.times(price) || _0)
      }
    })
    const price = this.tokenPriceFunc(currentChainConfig.assetAddress)
    value = price ? value.plus(this.nativeTokenBalance?.times(price) || _0) : value
    return value
  }

  get marginBalanceInfo(): TokenInfo[] {
    try {
      const details: TokenInfo[] = []
      this.perpetualIDs.forEach(item => {
        const accountStorage = this.accountStorageFunc(item)
        const marginAccount = this.marginAccountFunc(item)
        const perpetual = this.getPerpetualFunc(item)
        const detail = accountStorage && perpetual?.liquidityPoolStorage && marginAccount ? computeAccountDetails(item, accountStorage, perpetual.liquidityPoolStorage, marginAccount) : null
        if (detail && perpetual) {
          details.push({
            collateral: perpetual.liquidityPoolStorage.collateral.toLowerCase(),
            amount: detail.accountComputed.marginBalance,
          })
        }
      })
      return details
    } catch (e) {
      return []
    }
  }

  get walletErc20Tokens() {
    console.warn('[Wallet Page]: get erc20Tokens time => ', this.tokenComputedFlag)
    const whiteListTokens = NETWORK_ENV.CHAIN_ID !== SUPPORTED_NETWORK_ID.MAINNET
      ? this.chainAllTokenList.map(t => t.address).filter(t => t.toLowerCase() !== currentChainConfig.assetAddress.toLowerCase())
      : []
    const tokenStorage = getLocalStorage(`${TOKEN_STORAGE_KEY}-${this.address?.toLowerCase()}`)
    return [...whiteListTokens, ...(tokenStorage as string[] || [])]
  }

  mounted() {
    VUE_EVENT_BUS.on(WALLET_TOKEN_EVENT.ADDED_TOKEN, this.reloadWalletData)
  }

  destroyed() {
    VUE_EVENT_BUS.off(WALLET_TOKEN_EVENT.ADDED_TOKEN, this.reloadWalletData)
  }

  private reloadWalletData() {
    this.tokenComputedFlag++
    this.loadWalletData()
  }

  @Watch('address', { immediate: true })
  async loadData() {
    await Promise.all([
      this.loadLiquidityData(),
      this.loadMarginData(),
      this.loadWalletData(),
    ])
    await this.updatePrice()
    this.loadDataTimes++
  }

  async updatePrice() {
    const tokens = [currentChainConfig.assetAddress, ...this.walletErc20Tokens, ...this.marginAccountTokens, ...this.liquidityTokens]
    try {
      this.loadingPrice = true
      await this.updateTokenPrice(tokens)
    } finally {
      this.loadingPrice = false
    }
  }

  async loadWalletData() {
    this.updateTokenPrice([currentChainConfig.assetAddress, ...this.walletErc20Tokens])
    await Promise.all(this.walletErc20Tokens.map(t => {
      if (!this.address) {
        return
      }
      this.updateTokenBalance({ tokenAddress: t.toLowerCase() })
    }))
  }

  async loadMarginData() {
    await this.callGraphApiFunc(async () => {
      if (!this.address) {
        return
      }
      const result = await this.callGraphApiFunc(() => {
        return queryMarginAccounts(this.address?.toLowerCase() || '')
      })
      if (!result) {
        return
      }
      const tokens: string[] = []
      result.marginAccounts.forEach(item => {
        this.perpetualIDs.push(item.perpetualID)
        if (item.perpetual && item.perpetual.collateralAddress) {
          tokens.push(item.perpetual.collateralAddress)
        }
      })
      this.marginAccountTokens = tokens
    })
    await this.callChainReadFunc(async () => {
      const promises: Promise<void>[] = []
      const perpetualPromises: Promise<void>[] = []
      this.perpetualIDs.forEach((perpetualID) => {
        const { liquidityPoolAddress } = getPerpetualFromID(perpetualID)
        promises.push(this.updateAccountStorage(perpetualID))
        perpetualPromises.push(this.updateLiquidityPool(liquidityPoolAddress))
      })
      await Promise.all(promises)
      await Promise.all(perpetualPromises)
    })
  }

  async loadLiquidityData() {
    await this.callGraphApiFunc(async () => {
      if (!this.address) {
        this.liquidityAmount = []
        return
      }
      this.loadingLiquidity = true
      try {
        const result = await queryLiquidityAccounts(this.address)
        const tokens = result.liquidityAccounts.map(item => item.liquidityPool?.collateralAddress || '').filter(item => !!item)
        const pools = result.liquidityAccounts.map(item => item.liquidityPool?.id || '').filter(item => !!item)
        const navs = await queryPoolsLatestNAV(pools)
        const liquidity: TokenInfo[] = []
        result.liquidityAccounts.forEach(item => {
          if (!item.liquidityPool || !item.liquidityPool?.collateralAddress) {
            return
          }
          const poolAddress = item.liquidityPool.id
          const nav = _.find(navs, nav => {
            return nav.liquidityPool === poolAddress
          })
          if (!nav) {
            return
          }
          liquidity.push({
            collateral: item.liquidityPool.collateralAddress.toLowerCase(),
            amount: (item.shareAmount as BigNumber).times(nav.netAssetValue),
          })
        })
        this.liquidityTokens = tokens
        this.liquidityAmount = liquidity
      } finally {
        this.loadingLiquidity = false
      }
    })
  }
}
</script>

<style scoped lang="scss">
@import '~@mcdex/style/common/var';

.wallet-panel {
  .container {
    height: 100px;
    display: flex;
    flex-wrap: nowrap;
    justify-content: flex-start;
  }

  .card-item {
    position: relative;
    width: 235px;
    height: 100px;
    background-color: var(--mc-background-color-dark-light);
    border-radius: 8px;
    flex: none;
    text-align: center;
    font-weight: 400;
    color: var(--mc-text-color-white);

    .mc-loading {
      height: 100%;
      border-radius: 8px;
    }

    .title {
      margin-top: 20.5px;
      font-size: 14px;
    }

    .value {
      margin-top: 15px;
      font-size: 24px;
      font-weight: 700;
    }
  }

  .card-join-item {
    margin: 0 27px;
    height: 100px;
    flex: none;
    line-height: 100px;
    font-size: 16px;
    font-weight: 700;
    color: var(--mc-icon-color-light);
  }
}
</style>
