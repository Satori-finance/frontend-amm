<template>
  <div class="token-selector">
    <div class="selected-token" @click="visible = true">
      <img class="icon" v-if="selectedToken" :src="selectedToken.address | tokenIconUrlFormatter(usedNetwork)" alt="">
      <svg class="icon" aria-hidden="true" v-else>
        <use xlink:href="#icon-token-eth-fill"></use>
      </svg>
      <span class="symbol">{{ selectedToken ? selectedToken.symbol : 'ETH' }}</span>
      <i class="iconfont icon-triangle-bottom"></i>
    </div>
    <el-dialog
      :title="$t('selectToken.title')"
      append-to-body
      top="0"
      custom-class="mini-round-dialog"
      class="token-selector-dialog"
      :close-on-click-modal="false"
      :visible.sync="visible"
    >
      <div class="content-box">
        <div class="search-box">
          <el-input size="medium" v-model.trim="searchKey" clearable :placeholder="$t('selectToken.searchPlaceholder')"
                    @input="search">
            <template slot="prefix"><i class="el-icon-search"></i></template>
          </el-input>
        </div>
        <McLoading class="token-list" :hide-content="true" :show-loading="searching" mask-color="none">
          <div class="token-item" v-for="item in tableBody" :key="item.address" @click="select(item)">
            <img class="icon" v-if="item.address" :src="item.address | tokenIconUrlFormatter(usedNetwork)" alt="">
            <svg class="icon" aria-hidden="true" v-else>
              <use xlink:href="#icon-token-eth-fill"></use>
            </svg>
            <div class="info">
              <div class="symbol">{{ item.symbol }}</div>
              <div class="name">{{ item.name }}</div>
            </div>
          </div>
        </McLoading>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Ref, Watch } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import { McNoData, McLoading } from '@/components'
import { Popover } from 'element-ui'
import { erc20Name, erc20Symbol, getERC20Contract } from '@mcdex/mai3.js'
import { namespace } from 'vuex-class'
import { Provider } from '@ethersproject/providers'
import { ethers } from 'ethers'
import { TokenInfoItem } from '@/type'
import { L1_NETWORK_ID, TARGET_NETWORK_ID } from '@/const'

interface TableData {
  symbol: string
  address: string
}

const wallet = namespace('wallet')
const token = namespace('token')

@Component({
  components: {
    McNoData,
    McLoading,
  },
})
export default class TokenSelector extends Mixins(ErrorHandlerMixin) {
  @wallet.Getter('provider') provider!: Provider
  @wallet.Getter('providerL1') providerL1!: Provider
  @token.Getter('l1ChainAllTokenList') l1ChainAllTokenList!: TokenInfoItem[]
  @token.Getter('chainAllTokenList') chainAllTokenList!: TokenInfoItem[]

  @Ref('selector') selector!: Popover
  @Prop({ default: '' }) value!: string
  @Prop({ default: false }) useL1Token!: boolean

  private searchKey = ''
  private visible = false
  private searchResult: TokenInfoItem[] = []
  private searching = false

  get tokenList() {
    if (this.visible) {
      // trigger update on selector hide or show
    }
    return this.useL1Token ? this.l1ChainAllTokenList : this.chainAllTokenList
  }

  get usedNetwork() {
    return this.useL1Token ? L1_NETWORK_ID : TARGET_NETWORK_ID
  }

  get selectedToken(): TokenInfoItem | null {
    const result = this.tableBody.find(item => item.address === this.value) || null
    if (result?.address !== this.value) {
      this.$emit('input', '')
    }
    this.$emit('selectTokenChange', result)
    return result
  }

  get tableBody(): TokenInfoItem[] {
    return this.searchKey ? this.searchResult : [{ name: 'ETH', symbol: 'ETH' } as TokenInfoItem].concat(this.tokenList)
  }

  private async search() {
    this.searchResult = []
    const isAddress = ethers.utils.isAddress(this.searchKey)
    if (isAddress) {
      this.searchResult = await this.searchTokenAddress()
    } else {
      this.searchResult = this.searchTokenName()
    }
  }

  private searchTokenName(): TokenInfoItem[] {
    return this.tokenList.filter(item => item.name?.toLowerCase().includes(this.searchKey.toLowerCase()) || item.symbol.toLowerCase().includes(this.searchKey.toLowerCase()))
  }

  private async searchTokenAddress(): Promise<TokenInfoItem[]> {
    const provider = this.useL1Token ? this.providerL1 : this.provider
    try {
      this.searching = true
      const tokenContract = getERC20Contract(this.searchKey, provider)
      const [symbol, name] = await Promise.all([
        erc20Symbol(tokenContract),
        erc20Name(tokenContract),
      ])
      return [{ name, symbol, address: this.searchKey }]
    } catch (e) {
      console.warn('[Token Selector]: Search Token error', e)
      return []
    } finally {
      this.searching = false
    }
  }

  private select(item: TokenInfoItem) {
    this.$emit('input', item.address || '')
    this.visible = false
  }
}
</script>

<style lang="scss" scoped>
.token-selector-dialog {
  ::v-deep .el-dialog__body {
    display: flex;
    flex-direction: column;
  }
}

.token-selector {
  display: inline-block;
}

.selected-token {
  display: flex;
  align-items: center;
  font-size: 18px;
  line-height: 20px;
  color: var(--mc-text-color-white);

  .icon {
    height: 24px;
    width: 24px;
    border-radius: 50%;
    margin-right: 8px;
  }

  .iconfont {
    margin-left: 4px;
    font-size: 10px;
  }
}

.content-box {
  height: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;

  .search-box {
    .el-input {
      height: 56px;
      border: 1px solid var(--mc-border-color);
      border-radius: var(--mc-border-radius-l);
      background: none;
      padding: 0 16px;

      ::v-deep .el-input__inner {
        height: 54px;
        font-size: 16px;
      }

      .el-icon-search {
        color: var(--mc-text-color);
        font-weight: bold;
      }
    }
  }

  .token-list {
    margin-top: 16px;
    height: 336px;
    overflow-y: scroll;

    .token-item {
      height: 56px;
      display: flex;
      align-items: center;
      cursor: pointer;

      &:hover {
        background-color: var(--mc-background-color-dark);
      }

      .icon {
        height: 24px;
        width: 24px;
        border-radius: 50%;
        margin-right: 12px;
      }

      .info {
        .symbol {
          font-size: 16px;
          line-height: 24px;
        }

        .name {
          font-size: 12px;
          line-height: 16px;
          color: var(--mc-text-color);
        }
      }
    }
  }
}
</style>
