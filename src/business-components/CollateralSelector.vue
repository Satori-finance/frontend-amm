<template>
  <div class="collateral-selector">
    <el-popover
      ref="selector"
      placement="bottom-start"
      width="450"
      :visible-arrow="false"
      popper-class="collateral-selector-popover"
      v-model="visible"
      trigger="manual"
    >
      <div class="search-box">
        <div class="list">
          <McLoading :show-loading="loading" :delay="500">
            <McNoData v-if="noData" />
            <ul v-else>
              <li v-for="(item, index) in moreTableBody" :key="index" @click="select(item)">
                <div class="symbol mc-font-p14">{{ item.symbol }}</div>
                <div class="address mc-font-p14">
                  <span>{{ item.address }}</span>
                  <el-link :underline="false" :href="item.address | etherBrowserAddressFormatter" target="_blank">
                    <i class="iconfont icon-transmit"></i>
                  </el-link>
                </div>
              </li>
            </ul>
            <span class="see-more" @click="incrMore" v-if="hasMore">{{ $t('base.seeMore') }}...</span>
          </McLoading>
        </div>
      </div>
      <div class="selected-contract" slot="reference" v-click-outside="onClosedPopover">
        <el-input
          v-model.trim="searchKey"
          :placeholder="$t('collateralSearch.placeholder')"
          @input="search"
          @focus="showPopover"
          spellcheck="false"
        >
          <template slot="suffix">
            <i class="el-icon-circle-close" v-if="searchKey !== ''" @click="clearSearchKey"></i>
          </template>
        </el-input>
      </div>
    </el-popover>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Ref, Watch } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import { McNoData, McLoading } from '@/components'
import { Popover } from 'element-ui'
import { getERC20Contract } from '@mcdex/mai3.js'
import { namespace } from 'vuex-class'
import { Provider } from '@ethersproject/providers'
import { checkAddressLike, ellipsisMiddle } from '@/utils'
import { ethers } from 'ethers'
import _ from 'lodash'
import { TokenInfoItem } from '@/type'

interface TableData {
  symbol: string
  address: string
  decimals: number
}

const wallet = namespace('wallet')
const token = namespace('token')

@Component({
  components: {
    McNoData,
    McLoading,
  },
})
export default class CollateralSelector extends Mixins(ErrorHandlerMixin) {
  @wallet.Getter('provider') provider!: Provider
  @token.Getter('chainAllTokenList') chainAllTokenList!: TokenInfoItem[]
  @token.Getter('collateralTokenWhiteList') collateralTokenWhiteList!: TokenInfoItem[]

  @Ref('selector') selector!: Popover

  private searchKey = ''
  private loading = false
  private visible = false
  private tableData: any[] = []
  private moreCount: number = 1
  private moreSize: number = 4

  get popover(): Element | null {
    return (this.selector.$refs.popper as Element) || null
  }

  get tableBody(): TableData[] {
    return this.searchKey ? this.tableData.map(item => item) : this.collateralTokenWhiteList
  }

  get moreTableBody(): TableData[] {
    return this.tableBody.slice(0, (this.moreCount * this.moreSize))
  }

  get hasMore(): boolean {
    const tableLength: number = this.tableBody.length
    if (tableLength === 0) {
      return false
    }
    const showSize: number = this.moreCount * this.moreSize
    if (((tableLength - showSize) % this.moreSize) >= 1) {
      return true
    }
    return false
  }

  get noData() {
    return this.tableBody.length <= 0
  }

  inputCollateralStr(collateralSymbol: string, collateralAddress: string): string {
    if (collateralAddress !== '' && collateralSymbol !== '') {
      return `${collateralSymbol} (${ellipsisMiddle(collateralAddress, 10, 12)})`
    }
    if (collateralAddress !== '') {
      return collateralAddress
    }
    if (collateralSymbol !== '') {
      return collateralSymbol
    }
    return ''
  }

  toggle() {
    if (this.searchKey.indexOf('(') > -1 && this.searchKey.indexOf(')') > -1) {
      return
    }
    this.visible = !this.visible
  }

  showPopover() {
    this.visible = true
  }

  onClosedPopover() {
    this.visible = false
  }

  incrMore() {
    this.moreCount += 1
  }

  @Watch('tableBody', { immediate: true, deep: true })
  onTableBodyChange() {
    this.moreCount = 1
  }

  clearSearchKey() {
    this.searchKey = ''
    this.tableData = []
    this.emit({ address: '', symbol: '', decimals: 0 })
    this.visible = false
  }

  async search() {
    this.tableData = []
    this.emit({ address: '', symbol: '', decimals: 0 })
    if (this.searchKey.trim() === '') {
      return
    }
    await this.getCollateral()
  }

  async getCollateral() {
    if (!this.provider) {
      return
    }
    if (checkAddressLike(this.searchKey)) {
      if (!ethers.utils.isAddress(this.searchKey)) {
        this.tableData = []
        this.$emit('error')
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
      const searchResult: TokenInfoItem[] = _.filter(this.chainAllTokenList, (val: TokenInfoItem) => {
        return val.symbol.toLowerCase().indexOf(this.searchKey.toLowerCase()) > -1
      })
      this.tableData = []
      searchResult.forEach(val => {
        this.tableBody.push({
          symbol: val.symbol,
          address: val.address,
          decimals: val.decimals || 0,
        })
      })
    }
  }

  emit(item: TableData) {
    this.$emit('change', { address: item.address, symbol: item.symbol, decimals: item.decimals })
  }

  select(item: TableData) {
    this.emit(item)
    this.searchKey = this.inputCollateralStr(item.symbol, item.address)
    this.visible = false
  }
}
</script>

<style lang="scss">
.el-popper[x-placement^='bottom'].collateral-selector-popover {
  margin-top: 2px;
  padding: 8px 0;
}
</style>

<style lang="scss" scoped>
.collateral-selector {
  display: inline-block;
  width: 240px;

  .selected-contract {
    display: flex;

    .el-input ::v-deep .el-input__inner {
      font-size: 16px;
      cursor: pointer;
    }

    .icon-triangle-bottom {
      font-size: 10px;
    }
  }
}

.search-box {
  height: 100%;
  display: flex;
  flex-direction: column;
  max-height: 574px;
  min-height: 300px;

  .search {
    padding: 0 18px;

    .el-input {
      border-radius: 14px;
    }
  }

  .list {
    position: relative;
    flex: 1;
    overflow-y: scroll;

    .no-data {
      height: 100%;
    }

    ul {
      padding: 8px 0;

      li {
        padding: 8px 18px;
        cursor: pointer;

        .symbol {
          color: white;
        }

        .address {
          color: var(--mc-text-color);
          display: flex;
          align-items: center;

          .el-link {
            margin-left: 4px;
            font-size: 10px;
            color: var(--mc-icon-color-brighter);
          }
        }

        &:hover {
          background-color: var(--mc-background-color);
        }
      }
    }
  }

  .see-more {
    color: var(--mc-text-color-white);
    font-size: 14px;
    font-weight: 400;
    margin-left: 15px;
    cursor: pointer;
  }

  .see-more:hover {
    color: var(--mc-color-primary);
    text-decoration: underline;
  }
}

i {
  cursor: pointer;
}

.iconfont:hover,
.el-icon-circle-close:hover {
  color: var(--mc-color-primary);
}

.mc-loading {
  position: absolute;
  height: 100%;
  width: 100%;
}
</style>
