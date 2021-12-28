<template>
  <div class="pool-list">
    <div class="operate-line">
      <div class="left">
        <McTabs v-model="selectedPoolListType" :tabs="poolListTypeOptions"
                :equal-width="true"/>
      </div>
      <div class="right">
        <el-button class="create-button" size="medium" type="primary" @click="toCreatePerpetualPage">
          {{ $t('pool.poolList.createPerpetual') }}
        </el-button>
      </div>
    </div>
    <div class="search-line">
      <div class="left">
        <div class="switch-item">
          <el-switch :width="42" v-model="onlyMine"></el-switch>
          <span style="margin-left: 8px;">{{ $t('pool.poolList.showMine') }}</span>
        </div>
        <div class="switch-item">
          <el-switch :width="42" v-model="tradingMiningPools"></el-switch>
          <span style="margin-left: 8px;">{{ $t('pool.poolList.tradingMiningPools') }}</span>
        </div>
      </div>
      <div class="right">
        <div class="search-input-box" :class="{'search-input-box-focus': searchInputIsFocus}">
          <el-input class="search-input" :class="{'search-input-focus': searchInputIsFocus}"
                    :placeholder="$t('pool.poolList.searchTip')" v-model.trim="searchKey"
                    @input="onSearch" @focus="searchInputIsFocus=true" @blur="searchInputIsFocus=false">
            <template slot="prefix">
              <i class="iconfont icon-search-bold"></i>
            </template>
          </el-input>
        </div>
      </div>
    </div>
    <McLoading v-if="loading" :show-loading="loading" />
    <div v-else class="table-container">
      <table class="mc-data-table">
        <thead>
          <tr :class="[`perp-len-${tableLayoutLevel(currentPagePoolList)}`]">
            <th class="is-left">
              <span v-if="selectedPoolListType === 'certified'">
                {{ $t('pool.poolList.poolName') }}
              </span>
              <span v-else>
                {{ $t('pool.poolList.poolAddress') }}
              </span>
            </th>
            <th class="is-left">{{ $t('pool.poolList.perpetualContracts') }}</th>
            <th class="is-left">{{ $t('pool.poolList.liquidity') }}</th>
            <th class="is-left">
              <el-tooltip placement="top" :open-delay="400">
                <span>{{ $t('base.30DApy') }}</span>
                <div slot="content"><span v-html="$t('pool.poolList.apyPrompt')"></span></div>
              </el-tooltip>
            </th>
          </tr>
        </thead>
        <tbody v-if="noData">
          <tr>
            <td colspan="4" class="empty-table">
              <McNoData v-if="noData" />
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr v-for="(item, index) in currentPagePoolList" :key="index" @click="toPoolInfoPage(item.poolAddress)"
              :class="[`perp-len-${tableLayoutLevel(currentPagePoolList)}`]">
            <td class="tag-item is-left">
              <span class="info-tag" v-if="accountAddress===item.operatorAddress">
                {{ $t('base.operator') }}<span v-if="item.operatorIsExpiration">({{ $t('base.expired') }})</span>
              </span>
              <div v-if="selectedPoolListType === 'certified'" class="default-text pool-name-line">
                <TokenImageView :token="item.poolIcon || item.collateralAddress.toLocaleLowerCase()" />
                {{ item.poolAddress | poolNameFormatter }}
              </div>
              <div class="flex-line" v-else>
                <span class="link-text" @click.stop="openAddressLink(item.poolAddress)">
                  {{ splitAddress(item.poolAddress) }}
                </span>
                <McCopy :content="item.poolAddress" />
              </div>
            </td>
            <td class="is-left">
              <PerpetualsImgViewer :collateral="item.poolCollateralSymbol"
                                :search-key="searchKey"
                                :perpetuals="item.perpetuals || []" />
            </td>
            <td class="is-left">
              <div class="img-text-item">
                <TokenImageView :token="item.collateralAddress.toLocaleLowerCase()" />
                <div class="info">
                  <div class="default-text large-text-item">
                    {{ item.poolMargin | bigNumberShortenFormat }}
                    {{ item.poolCollateralSymbol }}
                  </div>
                  <div class="secondary-text text-item secondary-text-line">
                    <template v-if="selectedPoolListType === 'uncertified'&&item.isUnknownUSD">
                      Unknown
                    </template>
                    <template v-else>
                      ${{ item.poolMarginUSD | bigNumberFormatter(1) }}
                    </template>
                  </div>
                </div>
              </div>
            </td>
            <td class="is-left">
              <template v-if="!computeTotalApy(subPoolItem(subPoolList, item.poolAddress))">
                <McLoadingIcon></McLoadingIcon>
              </template>
              <template v-else>
                <div class="large-text-item default-font-size">
                  <PNNumber
                    :number="computeTotalApy(subPoolItem(subPoolList, item.poolAddress))"
                    :showPlusSign="true"
                    :decimals="2"
                    suffix="%"
                  />
                </div>
                <div class="text-item secondary-text secondary-text-line">
                  {{
                    subPoolItem(subPoolList, item.poolAddress)
                      ? subPoolItem(subPoolList, item.poolAddress).lpApy : 0
                      | bigNumberFormatter(2) }}%
                  <span
                    v-if="!subPoolItem(subPoolList, item.poolAddress) ? false : subPoolItem(subPoolList, item.poolAddress).miningApy.gte(0)"
                  >+</span>
                  <span v-else>-</span>
                  {{ subPoolItem(subPoolList, item.poolAddress)
                  ? subPoolItem(subPoolList, item.poolAddress).miningApy : 0
                  | bigNumberFormatter(2) }}%
                </div>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="table-pagination" v-if="sourceTableBodyCount > 0 && sourceTableBodyCount/pageSize > 1">
        <McPagination :current-page.sync="currentPage" :total="sourceTableBodyCount" :page-size="pageSize" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import {
  McLoading,
  PerpetualsImgViewer,
  McNoData,
  McTabs,
  McPagination,
  TokenImageView,
  PNNumber,
  McCopy, McLoadingIcon,
} from '@/components'
import { PoolListMixin } from '@/template/components/Pool/poolListMixin'
import { copyToClipboard, ellipsisMiddle, etherBrowserAddressUrl } from '@/utils'
import { PoolListItem } from '@/template/Pool/type';

@Component({
  components: {
    McLoading,
    PerpetualsImgViewer,
    McNoData,
    McTabs,
    McPagination,
    TokenImageView,
    PNNumber,
    McCopy,
    McLoadingIcon,
  }
})
export default class PoolList extends Mixins(PoolListMixin) {

  private searchInputIsFocus: boolean = false

  mounted() {
    if (this.storeSelectedListType === '') {
      this.selectedPoolListType = 'certified'
    } else {
      this.selectedPoolListType = this.storeSelectedListType
    }
  }

  get poolListTypeOptions() {
    return [
      { label: this.$t('base.certified').toString(), value: 'certified' },
      { label: this.$t('base.uncertified').toString(), value: 'uncertified' },
    ]
  }

  tableLayoutLevel(poolList: PoolListItem[]): number {
    let maxLength = Math.max(...poolList.map(item => item.perpetuals.length))
    if (maxLength > 5) {
      maxLength = 5
    }
    return maxLength
  }

  splitAddress (address: string) {
    return ellipsisMiddle(address, 6, 4)
  }

  openAddressLink (address: string) {
    window.open(etherBrowserAddressUrl(address))
  }

  toCreatePerpetualPage() {
    this.$router.push({ name: 'poolCreate' })
  }

  toPoolInfoPage(poolAddress: string) {
    this.$router.push({
      name: 'poolInfo',
      params: {
        poolAddress
      }
    })
  }

  @Watch('searchKey')
  @Watch('onlyMine')
  @Watch('selectedPoolListType')
  onFilterConditionChanged() {
    this.currentPage = 1
  }
}
</script>

<style scoped lang="scss">
@import "~@mcdex/style/common/fantasy-var";

.pool-list {
  width: 1200px;
  margin: auto;

  .operate-line {
    margin-top: 33px;
    display: flex;
    justify-content: space-between;

    .left {
      width: 982px;
      border-bottom: 1px solid var(--mc-border-color);
      align-items: center;

      ::v-deep {
        .mc-tabs {
          width: 169px;
          height: 44px;
          line-height: 42px;

          .tab-item {
            font-size: 16px;
          }

          .select-bar {
            margin-top: 0;
          }
        }
      }
    }

    .right {
      .create-button {
        background: linear-gradient(90deg, $--mc-color-blue 0%, $--mc-color-primary 100%);
        height: 44px;
        border-radius: 12px;
        width: 154px;
        font-size: 16px;
        padding: 10px 16px;
        line-height: 27px;

        &:hover {
          background: linear-gradient(90deg, #40e0e7 0%, #57b6f6 100%);
        }
      }
    }
  }

  .search-line {
    display: flex;
    justify-content: space-between;
    margin: 32px 0 24px;

    .left {
      font-size: 14px;
      color: var(--mc-text-color-white);
      display: flex;
      align-items: center;

      .switch-item {

        &:first-child {
          margin-left: 0;
        }

        margin-left: 16px;
      }

      ::v-deep {
        .el-switch {
          height: 24px;
          line-height: 24px;

          .el-switch__core {
            height: 24px;
            border-radius: 12px;
            background: var(--mc-background-color-dark-light);

            &::after {
              width: 18px;
              height: 18px;
              top: 3px;
              margin-left: 3px;
              background: var(--mc-text-color-white);
            }
          }

          &.is-checked {
            .el-switch__core {
              background: var(--mc-color-primary-gradient);
              &::after {
                margin-left: -20px;
              }
            }
          }
        }
      }
    }

    .right {
      .search-input-box {
        &.search-input-box-focus {
          border-radius: 12px;
          background: var(--mc-color-primary-gradient);
          height: 52px;
          width: 680px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }

      .search-input {
        height: 52px;
        line-height: 52px;
        width: 680px;
        border-radius: 12px;
        border-color: var(--mc-border-color);
        background: var(--mc-background-color-dark);
        padding: 0 16px;

        &.search-input-focus {
          border: unset;
          height: 50px;
          width: 678px;

          .icon-search-bold {
            color: var(--mc-text-color-white);
          }
        }

        ::v-deep {
          .el-input__inner {
            height: 50px;
            line-height: 50px;
            font-size: 14px;

            &::placeholder {
              color: var(--mc-text-color-dark);
            }
          }
        }
      }

      .icon-search-bold {
        font-size: 14px;
        color: var(--mc-text-color-dark);
      }
    }
  }

  .mc-loading {
    height: 501px;

    ::v-deep {
      .mc-loading__mask {
        background: transparent !important;
      }
    }
  }

  .table-container {
    margin-bottom: 64px;

    .perp-len-1, perp-len-2 {
      th, td {
        &:nth-of-type(1), &:nth-of-type(3), &:nth-of-type(4) {
          width: 23.36%;
        }
        &:nth-of-type(2) {
          width: 29.92%;
        }
      }
    }

    .perp-len-3 {
      th, td {
        &:nth-of-type(1), &:nth-of-type(3), &:nth-of-type(4) {
          width: 20.22%;
        }
        &:nth-of-type(2) {
          width: 39.34%;
        }
      }
    }

    .perp-len-4 {
      th, td {
        &:nth-of-type(1), &:nth-of-type(3), &:nth-of-type(4) {
          width: 17.08%;
        }
        &:nth-of-type(2) {
          width: 48.76%;
        }
      }
    }

    .perp-len-5 {
      th, td {
        &:nth-of-type(1) {
          width: 13.33%;
        }
        &:nth-of-type(2) {
          width: 54.67%;
        }
        &:nth-of-type(3) {
          width: 18%;
        }
        &:nth-of-type(4) {
          width: 14%;
        }
      }
    }

    table {
      width: 100%;
      border: 1px solid var(--mc-border-color);
      border-radius: 12px;
      border-collapse: collapse;
      border-style:hidden;
      box-shadow: 0 0 0 1px var(--mc-border-color);
      overflow: hidden;
      font-size: 14px;

      th, td {
        padding-left: 16px;
      }

      thead {
        background: var(--mc-background-color-darkest);
        font-size: 14px;
        border-bottom: 1px solid var(--mc-border-color);

        tr {
          height: 52px;
        }
      }

      tbody {
        background: var(--mc-background-color-dark);
        tr {
          cursor: pointer;
          height: 72px;
          border-bottom: 1px solid var(--mc-border-color);
        }
      }

      .flex-line {
        display: flex;
        align-items: center;
      }

      .empty-table {
        height: 72*10px;
        background: var(--mc-background-color-dark);
      }
    }

    .img-text-item {
      display: flex;
      align-items: center;

      .info {
        margin-left: 8px;
      }
    }

    .pool-name-line {
      display: flex;
      align-items: center;

      .token-image-view {
        margin-right: 8px;
      }
    }

    .text-item {
      line-height: 16px;
    }

    .large-text-item {
      line-height: 20px;
    }

    .secondary-text-line {
      margin-top: 4px;
    }


    .link-text {
      color: var(--mc-color-primary);
      font-size: 14px;
      cursor: pointer;

      &:hover {
        text-decoration: underline;
      }
    }

    .default-text {
      color: var(--mc-text-color-white);
      font-size: 14px;
    }

    .default-font-size {
      font-size: 14px;
    }

    .secondary-text {
      color: var(--mc-text-color);
      font-size: 12px;
    }
    .mc-copy {
      margin-left: 4px;
    }

    .tag-item {
      position: relative;

      .info-tag {
        padding: 0 6px;
        height: 22px;
        min-width: 64px;
        text-align: center;
        line-height: 22px;
        position: absolute;
        display: inline-block;
        font-size: 9px;
        color: var(--mc-color-primary);
        top: 0;
        left: 0;
        background: rgb(39 162 248 / 10%);
        border-radius: 0 0 8px 0;
      }
    }

    .table-pagination {
      margin-top: 24px;
    }
  }
}
</style>
