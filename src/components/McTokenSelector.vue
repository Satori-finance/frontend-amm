<template>
  <div class="mc-token-selector">
    <McLoading :show-loading="loading" :delay="500">
      <div class="token-item selected" v-if="value" :key="value.address">
        <el-image :src="value.address | tokenIconUrlFormatter">
          <div slot="error" class="image-slot">?</div>
        </el-image>
        <div class="token-info">
          <div class="symbol">{{ value.symbol }}</div>
          <div class="address">{{ value.address }}
            <el-link :underline="false" :href="value.address | etherBrowserAddressFormatter(networkId)" target="_blank">
              <i class="iconfont icon-view"></i>
            </el-link>
          </div>
        </div>
      </div>
      <div class="token-item" v-for="(item, index) in tokenList" :key="index" @click="selectToken(item)">
        <el-image :src="item.logoURI">
          <div slot="error" class="image-slot">
            <img src="@/assets/img/tokens/Unknow.svg" alt="">
          </div>
        </el-image>
        <div class="token-info">
          <div class="symbol">{{ item.symbol }}</div>
          <div class="address">{{ item.address }}
          <el-link :underline="false" @click.stop="toExplorer(item.address)" target="_blank">
            <i class="iconfont icon-view"></i>
          </el-link>
          </div>
        </div>
      </div>
      <div class="load-more" v-if="filteredTokens.length > tokenList.length" @click="tokenPageIndex++">
        {{ $t('base.seeMore') }}...
      </div>
      <McNoData v-if="noData"/>
    </McLoading>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { TokenInfoItem } from '@/type'
import { Provider } from '@ethersproject/providers'
import { SUPPORTED_NETWORK_ID } from '@/constants'
import { ethers } from 'ethers'
import { getERC20Contract } from '@mcdex/mai3.js'
import _ from 'lodash'
import { checkAddressLike, etherBrowserAddressUrl } from '@/utils'
import McLoading from './McLoading.vue'
import McNoData from './NoData.vue'

@Component({
  components: {
    McLoading,
    McNoData,
  },
})
export default class McTokenSelector extends Vue {
  @Prop({ default: () => [], required: true }) tokens!: TokenInfoItem[]
  @Prop({ default: () => null }) value!: TokenInfoItem | null
  @Prop({ default: () => null }) provider!: Provider | null
  @Prop({ required: true }) networkId!: SUPPORTED_NETWORK_ID
  @Prop({ default: '' }) searchKey!: string
  @Prop({ default: 100 }) pageSize!: number

  private tokenPageIndex = 1
  private loading = false
  private tableData: TokenInfoItem[] = []

  get filteredTokens() {
    return this.tableData.filter(t => {
      if (this.value) {
        return t.address.toLowerCase() !== this.value.address.toLowerCase()
      } else if (!checkAddressLike(this.searchKey)) {
        return t.symbol.includes(this.searchKey.toUpperCase())
      } else {
        return true
      }
    })
  }

  get tokenList() {
    return this.filteredTokens.slice(0, this.tokenPageIndex * this.pageSize)
  }

  get noData() {
    return this.tableData.length === 0
  }

  @Watch('searchKey', { immediate: true })
  private async getToken() {
    if (!this.provider) {
      return
    }
    if (checkAddressLike(this.searchKey)) {
      if (!ethers.utils.isAddress(this.searchKey)) {
        this.tableData = []
        this.$emit('error')
        return
      }
      const result = _.filter(this.tokens, (val: TokenInfoItem) => {
        return val.address.toLowerCase() === this.searchKey.toLowerCase()
      })
      if (result.length) {
        this.tableData = result
        return
      }
      try {
        this.loading = true
        const erc20Contract = getERC20Contract(this.searchKey, this.provider)
        const [symbol, decimals] = await Promise.all([erc20Contract.symbol(), erc20Contract.decimals()])
        this.tableData = [
          {
            symbol: symbol,
            address: this.searchKey,
            decimals: decimals,
          },
        ]
      } catch (e) {
        this.tableData = []
        this.$emit('error', e)
      } finally {
        this.loading = false
      }
    } else {
      this.tableData = _.filter(this.tokens, (val: TokenInfoItem) => {
        return val.symbol.toLowerCase().indexOf(this.searchKey.toLowerCase()) > -1
      })
    }
  }

  private selectToken(item: TokenInfoItem) {
    this.$emit('input', item)
  }

  private toExplorer(address: string) {
    window.open(etherBrowserAddressUrl(address, this.networkId), '_blank')
  }
}
</script>

<style lang="scss" scoped>
.mc-token-selector {

  .mc-loading {
    height: 100%;
    overflow: auto;
    &.show {
      overflow: hidden;
    }
  }

  .token-item {
    padding: 8px 16px;
    height: 56px;
    display: flex;
    align-items: center;
    cursor: pointer;

    &.selected {
      opacity: 0.5;
      cursor: default;
      pointer-events: none;
    }

    &:not(.selected):hover {
      background-color: var(--mc-background-color-light);
    }

    .el-image {
      height: 24px;
      width: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;

      ::v-deep .image-slot {
        height: 24px;
        width: 24px;
        img {
          height: 100%;
          width: 100%;
        }
      }
    }

    .token-info {
      margin-left: 12px;

      .symbol {
        font-size: 16px;
        line-height: 24px;
        color: var(--mc-text-color-white);
      }

      .address {
        font-size: 12px;
        line-height: 16px;
        color: var(--mc-text-color);

        .el-link {
          color: var(--mc-text-color);
          font-size: 16px;

          &:hover {
            color: var(--mc-color-info);
          }
        }
      }
    }

    .el-link {
      text-decoration: none;
    }
  }

  .load-more {
    margin-top: 8px;
    color: var(--mc-text-color-white);
    padding: 0 16px;
    cursor: pointer;
    font-size: 14px;
    line-height: 20px;

    &:hover {
      color: var(--mc-color-primary);
      text-decoration: underline;
    }
  }
}
</style>
