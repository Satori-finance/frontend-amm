<template>
  <div class="wallet-info-wrapper">
    <div class="wallet-info-wrapper-worth">
      <div class="wallet-info-wrapper-worth-value">
        <template v-if="loading">
          <McLoadingIcon :height="40"></McLoadingIcon>
        </template>
        <template v-else>
          <div>{{ netOfDex.isNaN() ? '' : '$' }} {{ netOfDex | bigNumberFormatter(2) }}</div>
        </template>
        <div class="wallet-info-wrapper-worth-key">{{ $t('accountWallet.walletInfo.totalValue') }}</div>
      </div>
      <div class="wallet-info-wrapper-content">
        <div class="wallet-info-balance">
          <div class="wallet-info-value">
            <template v-if="loading">
              <McLoadingIcon></McLoadingIcon>
            </template>
            <template v-else>
              {{ worthOfMarginBalance.isNaN() ? '' : '$' }}
              {{ worthOfMarginBalance | bigNumberFormatter(2) }}
            </template>
          </div>
          <div class="wallet-info-key flex-box">
            {{ $t('accountWallet.walletInfo.totalMarginBalance') }}
            <el-tooltip placement="top">
              <div slot="content">
                <span v-html="$t('accountWallet.walletInfo.totalMarginBalancePrompt')"></span>
              </div>
              <div class="tooltip-box">
                <svg class="svg-icon" aria-hidden="true">
                  <use :xlink:href="`#icon-help`"></use>
                </svg>
              </div>
            </el-tooltip>
          </div>
        </div>
        <div class="wallet-info-pooled">
          <div class="wallet-info-value">
            <template v-if="loading">
              <McLoadingIcon></McLoadingIcon>
            </template>
            <template v-else>
              {{ worthOfLiquidity.isNaN() ? '' : '$' }}
              {{ worthOfLiquidity | bigNumberFormatter(2) }}
            </template>
          </div>
          <div class="wallet-info-key">{{ $t('accountWallet.walletInfo.totalPoolValue') }}</div>
        </div>
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
import { McLoading, McLoadingIcon } from '@/components'
import { computeAccountDetails } from '@/utils/account'

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
    McLoadingIcon,
  },
})
export default class WalletInfo extends Mixins(ErrorHandlerMixin) {
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
  private marginAccountTokens: string[] = []
  private liquidityTokens: string[] = []
  private liquidityAmount: TokenInfo[] = []
  private loadDataTimes = 0

  get loading() {
    return this.loadDataTimes === 0 || this.loadingPrice || this.loadingLiquidity
  }

  get worthOfLiquidity() {
    let value = _0
    this.liquidityAmount.forEach(item => {
      const price = this.tokenPriceFunc(item.collateral)
      value = value.plus(price ? price.times(item.amount) : _0)
    })
    return value
  }

  get worthOfMarginBalance() {
    let value = _0
    this.marginBalanceInfo.forEach(item => {
      const price = this.tokenPriceFunc(item.collateral)
      value = value.plus(price ? price.times(item.amount) : _0)
    })
    return value
  }

  get netOfDex(): BigNumber {
    return this.worthOfLiquidity.plus(this.worthOfMarginBalance)
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

  @Watch('address', { immediate: true })
  async loadData() {
    await Promise.all([
      this.loadLiquidityData(),
      this.loadMarginData(),
    ])
    await this.updatePrice()
    this.loadDataTimes++
  }

  async updatePrice() {
    const tokens = [currentChainConfig.assetAddress, ...this.marginAccountTokens, ...this.liquidityTokens]
    try {
      this.loadingPrice = true
      await this.updateTokenPrice(tokens)
    } finally {
      this.loadingPrice = false
    }
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
@import './wallet.scss';

.wallet-info-wrapper {
  width: 100%;
  padding: 23px;
  background: #0a1024;
  border: 1px solid #242d43;
  border-radius: 12px;
  margin-bottom: 24px;

  &-worth {
    width: 100%;
    margin-bottom: 16px;

    &-value {
      font-family: Helvetica;
      font-weight: bold;
      font-size: 32px;
      line-height: 40px;
      color: #ffffff;
      margin-bottom: 16px;
    }

    &-key {
      font-family: Helvetica;
      font-size: 14px;
      line-height: 20px;
      color: #999897;
      font-weight: normal;
      margin-top: 4px;
    }
  }

  &-content {
    background: #12182c;
    border-radius: 12px;
    padding: 24px;

    .wallet-info-value {
      font-family: Helvetica;
      font-size: 20px;
      line-height: 24px;
      color: #ffffff;
      margin-bottom: 4px;
    }

    .wallet-info-key {
      font-family: Helvetica;
      font-size: 14px;
      line-height: 20px;
      color: #999897;
    }

    .wallet-info-balance {
      width: 100%;
      padding-bottom: 16px;
      border-bottom: 1px solid #242d43;
    }

    .wallet-info-pooled {
      width: 100%;
      padding-top: 16px;
    }
  }
}
</style>
