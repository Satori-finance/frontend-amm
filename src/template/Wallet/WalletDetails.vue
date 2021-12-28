<template>
  <div>
    <div class="wallet-details">
      <div class="panel-item-header">
        <div class="title">{{ $t('base.wallet') }}</div>
        <div class="header-button">
          <el-button type="primary" size="mini" @click="onAddTokenEvent" :disabled="addTokenDisabled">
            {{ $t('accountWallet.walletDetails.addToken') }}
          </el-button>
        </div>
      </div>
      <div class="table-container">
        <McLoading :show-loading="loading" :min-show-time="300" :hide-content="true">
          <div class="table-container">
            <table class="mc-data-table">
              <thead>
                <tr>
                  <th>{{ $t('accountWallet.walletDetails.assets') }}</th>
                  <th v-if="!supportL2">{{ $t('accountWallet.walletDetails.l2Wallet') }}</th>
                  <th v-if="supportL2">{{ $t('accountWallet.walletDetails.l1Wallet') }}</th>
                  <th v-if="supportL2">{{ $t('accountWallet.walletDetails.l2Wallet') }}</th>
                  <th v-if="supportL2">{{ $t('accountWallet.walletDetails.l1Lockbox') }}</th>
                  <th>{{ $t('accountWallet.walletDetails.totalAmount') }}</th>
                  <th v-if="supportL2">{{ $t('accountWallet.walletDetails.operation') }}</th>
                </tr>
              </thead>
              <tbody :class="{ 'no-data': noData }">
                <tr v-if="noData">
                  <td colspan="6">
                    <McNoData :label="$t('base.noData')"></McNoData>
                  </td>
                </tr>
                <tr v-for="(item, index) in tableBody" :key="index">
                  <template v-if="!item">
                    <td colspan="100"></td>
                  </template>
                  <template v-else>
                    <td>
                      {{ item.symbol }}
                      <el-link
                        class="icon"
                        :underline="false"
                        target="_blank"
                        v-if="!isNativeToken(item.tokenAddress) && item"
                        :href="item.tokenAddress | etherBrowserAddressFormatter"
                      >
                        <i class="iconfont icon-transmit"></i>
                      </el-link>
                    </td>
                    <td>
                      {{ item.l2Wallet | bigNumberFormatterByPrecision }}
                    </td>
                    <td v-if="supportL2">
                      {{ item.l2Wallet | bigNumberFormatterByPrecision }}
                    </td>
                    <td v-if="supportL2">
                      <span v-if="item.lockbox">
                        {{ item.lockbox | bigNumberFormatterByPrecision }}
                      </span>
                      <span v-if="item.lockbox" class="table-inter-button value-item">
                        <el-button
                          :loading="claimingItem && claimingItem.tokenAddress === item.tokenAddress"
                          :disabled="disableClaim(item)"
                          size="mini"
                          type="info"
                          round
                          class="withdraw-general-button"
                          @click="onLockboxClaimEvent(item)"
                        >
                          {{ $t('base.claim') }}
                        </el-button>
                      </span>
                    </td>
                    <td>
                      {{ item.totalAmount | bigNumberFormatterByPrecision }}
                      <span v-if="item.totalAmountUSD">(${{ item.totalAmountUSD | bigNumberFormatter }})</span>
                    </td>
                    <td v-if="supportL2">
                      <span class="operation-item table-inter-button">
                        <el-button size="mini" type="info" round @click="onL1ToL2Event(item)">
                          L1 <i class="el-icon-sort"></i> L2
                        </el-button>
                      </span>
                    </td>
                  </template>
                </tr>
              </tbody>
            </table>
            <div class="table-pagination">
              <el-pagination
                background
                layout="prev, pager, next"
                v-if="!noData"
                hide-on-single-page
                :page-size.sync="pagination.pageSize"
                :total="tableData.length"
                :current-page.sync="pagination.currentPage"
              >
              </el-pagination>
            </div>
          </div>
        </McLoading>
      </div>
    </div>
    <AddTokensDialog :visible.sync="showAddTokenDialog" @confirm="onConfirmToken" />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import { McLoading, McNoData } from '@/components'
import BigNumber from 'bignumber.js'
import AddTokensDialog from './Components/AddTokensDialog.vue'
import { currentChainConfig } from '@/config/chain'
import { namespace } from 'vuex-class'
import { getLocalStorage, setLocalStorage } from '@/utils'
import { _0 } from '@mcdex/mai3.js'
import { TOKEN_STORAGE_KEY } from '@/config/tokens/tokens'
import { NETWORK_ENV, SUPPORT_L2, SUPPORTED_NETWORK_ID } from '@/constants'
import { ErrorHandlerMixin } from '@/mixins'
import _ from 'lodash'
import { VUE_EVENT_BUS, WALLET_TOKEN_EVENT } from '@/event'
import { TokenBalanceDirectoryItem, TokenInfoItem } from '@/type'
import { isNativeToken } from '@/utils/chain'

interface TableItem {
  symbol: string
  tokenAddress: string
  l1Wallet: BigNumber | null
  l2Wallet: BigNumber | null
  lockbox: BigNumber | null
  totalAmount: BigNumber | null
  totalAmountUSD: BigNumber | null
  order: number
}

const emptyTableItem: TableItem = {
  symbol: '',
  tokenAddress: '',
  l1Wallet: null,
  l2Wallet: null,
  lockbox: _0,
  totalAmount: null,
  totalAmountUSD: null,
  order: 0,
}

const emptyTransferData = {
  selectedTransferOption: 'l1Tol2',
  tokenName: '',
  tokenAddress: '',
}

const wallet = namespace('wallet')
const account = namespace('account')
const price = namespace('price')
const token = namespace('token')

@Component({
  components: {
    McLoading,
    McNoData,
    AddTokensDialog,
  },
})
export default class WalletDetails extends Mixins(ErrorHandlerMixin) {
  @wallet.State('nativeTokenBalance') nativeTokenBalance!: BigNumber | null
  @wallet.State('nativeTokenBalanceL1') nativeTokenBalanceL1!: BigNumber | null
  @wallet.Getter('address') address!: string | null
  @price.Action('updateTokenPrice') updateTokenPrice!: (tokens: string[]) => Promise<void>
  @price.Getter('tokenPriceFunc') tokenPriceFunc!: (token: string) => BigNumber | null
  @account.Action('updateTokenBalance') updateTokenBalance!: (params: { tokenAddress: string, networkId?: SUPPORTED_NETWORK_ID }) => Promise<void>
  @account.Getter('tokenBalanceFunc') tokenBalanceFunc!: (tokenAddress: string, networkId?: SUPPORTED_NETWORK_ID) => TokenBalanceDirectoryItem | null
  @wallet.Getter('isL2') isL2!: boolean
  @wallet.Getter('isL1') isL1!: boolean
  @token.Getter('chainAllTokenList') chainAllTokenList!: TokenInfoItem[]

  private showAddTokenDialog: boolean = false
  private showWalletTransferDialog: boolean = false
  private currentTransferData = emptyTransferData
  private pagination = {
    pageSize: 10,
    currentPage: 1,
  }
  private loading: boolean = false
  private tokens: Array<{ address: string, order: number }> = []
  private claimingItem: TableItem | null = null
  private newTokenOrder = 1
  private supportL2 = SUPPORT_L2

  private isNativeToken = isNativeToken

  get nativeTokenTableItem(): TableItem {
    const totalAmount = !this.supportL2 // TODO delete support l2
      ? this.nativeTokenBalance || _0
      : (this.nativeTokenBalance || _0).plus(this.nativeTokenBalanceL1 || _0)
    const price = this.tokenPriceFunc(currentChainConfig.assetAddress)
    return {
      symbol: currentChainConfig.symbol,
      tokenAddress: currentChainConfig.assetAddress,
      l1Wallet: this.nativeTokenBalanceL1,
      l2Wallet: this.nativeTokenBalance,
      lockbox: null,
      totalAmount: totalAmount.isNaN() ? null : totalAmount,
      totalAmountUSD: totalAmount.isNaN() || !price ? null : totalAmount.times(price),
      order: 1,
    }
  }

  get addTokenDisabled(): boolean {
    return !this.address || this.address === ''
  }

  get tokenTableItems(): TableItem[] {
    return this.tokens.map(item => {
      const tokenBalance = this.tokenBalanceFunc(item.address)
      const price = this.tokenPriceFunc(item.address)
      if (tokenBalance) {
        const totalAmount = !this.supportL2 // TODO delete support l2
          ? tokenBalance.balance || _0
          : !tokenBalance.balanceL1 && !tokenBalance.balance
          ? null
          : (tokenBalance.balanceL1 || _0).plus(tokenBalance.balance || _0)
        return {
          symbol: tokenBalance.symbol,
          l2Wallet: tokenBalance.balance,
          l1Wallet: tokenBalance.balanceL1,
          totalAmount: totalAmount,
          totalAmountUSD: price && totalAmount ? totalAmount.times(price) : null,
          tokenAddress: item.address,
          lockbox: null,
          order: item.order,
        }
      } else {
        return Object.assign({}, emptyTableItem, { tokenAddress: item.address })
      }
    })
  }

  get tableData(): TableItem[] {
    const items = _.orderBy(this.tokenTableItems.filter(item => !!item.totalAmount && !item.totalAmount?.isZero()), [
      t => t.order,
      t => t.totalAmountUSD?.toNumber(),
      t => t.totalAmount?.toNumber(),
    ], ['desc', 'desc', 'desc'])
    return [this.nativeTokenTableItem].concat(items)
  }

  get tableBody(): TableItem[] {
    const start = this.pagination.currentPage * this.pagination.pageSize - this.pagination.pageSize
    const end = start + this.pagination.pageSize
    return this.tableData.slice(start, end)
  }

  get noData(): boolean {
    return this.tableBody.length === 0
  }

  disableClaim(item: TableItem) {
    return !item.lockbox || item.lockbox.isNaN() || item.lockbox.isZero()
  }

  @Watch('address', { immediate: true })
  async tokensChange() {
    if (!this.address) {
      return
    }
    const whiteListTokens = NETWORK_ENV.CHAIN_ID !== SUPPORTED_NETWORK_ID.MAINNET
      ? this.chainAllTokenList.map(t => t.address).filter(t => t.toLowerCase() !== currentChainConfig.assetAddress.toLowerCase())
      : []
    const tokens = (getLocalStorage(`${TOKEN_STORAGE_KEY}-${this.address.toLowerCase()}`) || []) as string[]
    this.tokens = _.uniq([...whiteListTokens, ...tokens]).map(t => ({ address: t, order: 0 }))
    await this.updatePrice([currentChainConfig.assetAddress, ...this.tokens.map(t => t.address)])
  }

  @Watch('tokens', { immediate: true })
  @Watch('address')
  async updateBalances() {
    if (!this.address) {
      return
    }
    const whiteListTokens = NETWORK_ENV.CHAIN_ID !== SUPPORTED_NETWORK_ID.MAINNET
      ? this.chainAllTokenList.map(t => t.address).filter(t => t.toLowerCase() !== currentChainConfig.assetAddress.toLowerCase())
      : []
    const allTokens: string[] = _.uniq([...whiteListTokens, ...this.tokens.map(t => t.address.toLowerCase())])
    await Promise.all(allTokens.map(t => this.updateTokenBalance({ tokenAddress: t.toLowerCase() })))
  }

  async updatePrice(tokens: string[]) {
    try {
      this.loading = true
      await this.updateTokenPrice(tokens)
    } finally {
      this.loading = false
    }
  }

  OnWalletTransferDialogClosed() {
    this.currentTransferData = emptyTransferData
  }

  onAddTokenEvent() {
    this.showAddTokenDialog = true
  }

  onConfirmToken(address: string) {
    if (this.tokens.findIndex(t => t.address.toLowerCase() === address.toLowerCase()) < 0) {
      this.tokens.unshift({ address: address.toLowerCase(), order: this.newTokenOrder++ })
      this.updateTokenBalance({ tokenAddress: address.toLowerCase() })
      this.updatePrice([address.toLowerCase()])
    }
    // add token to localstorage
    const tokenStorage = getLocalStorage(`${TOKEN_STORAGE_KEY}-${this.address?.toLowerCase()}`)
    const tokens = tokenStorage as string[] || []
    if (tokens.indexOf(address.toLowerCase()) < 0) {
      tokens.push(address.toLowerCase())
      setLocalStorage(`${TOKEN_STORAGE_KEY}-${this.address?.toLowerCase()}`, tokens)
      VUE_EVENT_BUS.emit(WALLET_TOKEN_EVENT.ADDED_TOKEN, address.toLowerCase())
    }
  }

  async onLockboxClaimEvent(data: TableItem) {
    if (!this.isL1) {
      this.$notify({
        title: '',
        message: this.$t('accountWallet.walletDetails.claimWarning').toString(),
        type: 'warning',
        position: 'bottom-right',
        customClass: 'is-warning',
      })
      return
    }
    await this.callChainFunc(async () => {
      if (!data.lockbox) {
        return
      }
      try {
        this.claimingItem = data
        // await this.claimFromL1LockBox(data.tokenAddress, data.lockbox)
      } catch (e) {
        this.$notify({
          title: 'Claim Error',
          message: e.message,
          type: 'error',
          position: 'bottom-right',
          customClass: 'is-error',
        })
      } finally {
        this.claimingItem = null
      }
    })
    // await this.reloadTokenInfo(data.tokenAddress, 3)
  }

  onL1ToL2Event(data: TableItem) {
    this.currentTransferData = {
      selectedTransferOption: 'l1Tol2',
      tokenName: data.symbol,
      tokenAddress: data.tokenAddress,
    }
    this.showWalletTransferDialog = true
  }

  onL2ToL1Event(data: TableItem) {
    this.currentTransferData = {
      selectedTransferOption: 'l2Tol1',
      tokenName: data.symbol,
      tokenAddress: data.tokenAddress,
    }
    this.showWalletTransferDialog = true
  }
}
</script>

<style scoped lang="scss">
@import './wallet.scss';

.wallet-details {
  .panel-item-header {
    .title {
      line-height: 28px;
    }
  }

  .header-button {
    ::v-deep .el-button {
      width: 85px;
    }
  }

  .mc-loading {
    min-height: 100px;
  }

  .table-container {
    table {
      th,
      td {
        text-align: left;

        &:first-of-type {
          padding-left: 20px;
        }

        &:last-of-type {
          text-align: right;
          padding-right: 20px;
        }

        &:nth-of-type(1) {
          width: 40%;
        }

        &:nth-of-type(2) {
          width: 30%;
        }

        &:nth-of-type(3) {
          width: 30%;
        }
      }
    }

    .value-item {
      margin-left: 13px;
    }

    .operation-item {
      margin: 0 5px;

      .el-icon-sort {
        transform: rotate(90deg);
      }
    }
  }
}
</style>
