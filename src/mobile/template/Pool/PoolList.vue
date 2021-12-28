<template>
  <div class="pool-list scroll-container">
    <HeaderBar></HeaderBar>
    <div class="page-container">
      <div class="bg">
        <img src="@/assets/img/satori-bg.png" alt="">
      </div>
      <div class="select-box">
        <div class="left">
          <McTabs v-model="selectedPoolListType" :tabs="poolListTypeOptions"
                  :equal-width="true"/>
        </div>
        <div class="right"></div>
      </div>

      <div class="switch-box">
        <div class="switch-item">
          <van-switch v-model="onlyMine" :size="18"></van-switch>
          <div class="label">{{ $t('pool.poolList.showMine') }}</div>
        </div>
        <div class="switch-item">
          <van-switch v-model="tradingMiningPools" :size="18"></van-switch>
          <div class="label">{{ $t('pool.poolList.tradingMiningPools') }}</div>
        </div>
      </div>

      <div class="search">
        <div class="search-input-box" :class="{'search-input-box-focus': searchInputIsFocus}">
          <van-field class="search-input" :class="{'search-input-focus': searchInputIsFocus}"
                    :placeholder="$t('pool.poolList.searchTip')" v-model.trim="searchKey"
                    @input="onSearch" @focus="searchInputIsFocus=true" @blur="searchInputIsFocus=false">
            <template slot="left-icon">
              <i class="iconfont icon-search-bold"></i>
            </template>
          </van-field>
        </div>
      </div>

      <div class="list-container">
        <van-skeleton :loading="loading" :row="10">
          <van-list :finished="loadFinished" @load="onListLoad" ref="poolListRef">
            <div class="pool-info" v-for="(item, index) in viewListData" :key="index">
              <div class="top" @click="toPoolInfoPage(item.poolAddress)">
                <div class="left">
                  <div v-if="selectedPoolListType === 'certified'" class="token-img">
                    <McMTokenImageView :size="32" :token="item.poolIcon || item.collateralAddress" />
                  </div>
                  <div>
                    <div v-if="selectedPoolListType === 'certified'">
                      <div class="title">
                        {{ item.poolAddress | poolNameFormatter }}
                      </div>
                      <div class="value">
                        <span class="pool-address link" @click.stop="openAddressLink(item.poolAddress)">
                          {{ splitAddress(item.poolAddress) }}
                        </span>
                        <McMCopy :content="item.poolAddress"></McMCopy>
                      </div>
                    </div>
                    <div v-if="selectedPoolListType === 'uncertified'">
                      <div class="title">
                        <span class="link" @click.stop="openAddressLink(item.poolAddress)">
                          {{ splitAddress(item.poolAddress) }}
                        </span>
                        <McMCopy :content="item.poolAddress"></McMCopy>
                      </div>
                      <div class="collateral text">
                        {{ $t('base.collateral') }}:{{ item.poolCollateralSymbol }}
                      </div>
                    </div>
                  </div>
                </div>
                <div class="right">
                  <div>
                    <div class="value">
                      <template v-if="selectedPoolListType === 'uncertified'&&item.isUnknownUSD">
                        Unknown
                      </template>
                      <template v-else>
                        ${{ item.poolMarginUSD | bigNumberFormatter(2) }}
                      </template>
                    </div>
                    <div class="text">{{ $t('base.liquidity') }}</div>
                  </div>
                  <i class="iconfont icon-right2"></i>
                </div>
              </div>
              <div class="bottom">
                <div>
                  <div class="text">{{ $t('base.operator') }}</div>
                  <div v-if="selectedPoolListType === 'certified'" class="operator">
                    {{ getOperatorName(item) || splitAddress(item.operatorAddress) }}
                  </div>
                  <div v-if="selectedPoolListType === 'uncertified'" class="flex-box">
                    <span class="pool-address link" @click.stop="openAddressLink(item.operatorAddress)">
                      {{ splitAddress(item.operatorAddress) }}</span>
                    <McMCopy :content="item.poolAddress"></McMCopy>
                  </div>
                </div>
                <div>
                  <div class="text">
                    <McMTooltip>
                      <div slot="content" class="pool-list-apy-tooltip">
                        <div class="flex-line line-item">
                          <div class="label">{{ $t('dao.totalAPY') }}</div>
                          <div class="value">
                            <PNNumber
                              :number="computeTotalApy(subPoolItem(subPoolList, item.poolAddress))"
                              :showPlusSign="false"
                              :decimals="2"
                              suffix="%"
                            />
                          </div>
                        </div>
                        <div class="flex-line line-item">
                          <div class="label">{{ $t('dao.lpAPY') }}</div>
                          <div class="value">
                            <PNNumber
                              :number="subPoolItem(subPoolList, item.poolAddress)
                                        ? subPoolItem(subPoolList, item.poolAddress).lpApy : 0"
                              :showPlusSign="false"
                              :decimals="2"
                              suffix="%"
                            />
                          </div>
                        </div>
                        <div class="flex-line line-item">
                          <div class="label">{{ $t('dao.miningAPY') }}</div>
                          <div class="value">
                            <PNNumber
                              :number="subPoolItem(subPoolList, item.poolAddress)
                                        ? subPoolItem(subPoolList, item.poolAddress).miningApy : 0"
                              :showPlusSign="false"
                              :decimals="2"
                              suffix="%"
                            />
                          </div>
                        </div>
                        <div class="line-item">{{ $t('dao.APYPromp') }}</div>
                      </div>
                      {{ $t('base.30DApy') }}
                    </McMTooltip>
                  </div>
                  <McLoadingIcon v-if="!computeTotalApy(subPoolItem(subPoolList, item.poolAddress))" :size="20"></McLoadingIcon>
                  <PNNumber
                    v-else
                    :number="computeTotalApy(subPoolItem(subPoolList, item.poolAddress))"
                    :showPlusSign="false"
                    :decimals="2"
                    suffix="%"
                  />
                </div>
                <div>
                  <MPerpetualsImgViewer :collateral="item.poolCollateralSymbol"
                                        :per-row-count="4"
                                        :show-title="true"
                                        @click="showPerpetualPopup"
                                        :perpetuals="item.perpetuals || []" />
                </div>
              </div>
            </div>
          </van-list>
        </van-skeleton>
      </div>
    </div>
    <PerpetualListPopup :visible.sync="showPerpetualListPopup"
                        :perpetuals="currentPerpetuals || []"
                        :collateral="currentCollateral"/>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import HeaderBar from '@/mobile/template/Header/HeaderBar.vue'
import { McMRadioGroupTabs, McMTokenImageView, McMTooltip, McMCopy } from '@/mobile/components'
import { PoolListItem } from '@/template/Pool/type'
import { PoolListMixin } from '@/template/components/Pool/poolListMixin'
import { McLoadingIcon, McTabs, PNNumber } from '@/components'
import { copyToClipboard, ellipsisMiddle, etherBrowserAddressUrl } from '@/utils'
import { MPerpetualsImgViewer, PerpetualListPopup } from '@/mobile/business-components'
import { Perpetual } from '@/type'
import { getOperatorName } from '@/config/operator'

@Component({
  components: {
    HeaderBar,
    McMRadioGroupTabs,
    McTabs,
    PNNumber,
    MPerpetualsImgViewer,
    PerpetualListPopup,
    McMTokenImageView,
    McMTooltip,
    McMCopy,
    McLoadingIcon,
  },
})
export default class PoolList extends Mixins(PoolListMixin) {
  private searchInputIsFocus: boolean = false
  private showPerpetualListPopup: boolean = false
  private currentPerpetuals: Perpetual[] = []
  private currentCollateral: string = ''


  get poolListTypeOptions() {
    return [
      { label: this.$t('base.certified').toString(), value: 'certified' },
      { label: this.$t('base.uncertified').toString(), value: 'uncertified' },
    ]
  }

  get radioOptions() {
    return [
      {
        label: this.$t('pool.poolList.all').toString(),
        value: 'all',
        itemSelectedClass: 'info-radio',
      },
      {
        label: this.$t('pool.poolList.mine').toString(),
        value: 'mine',
        itemSelectedClass: 'info-radio',
      }
    ]
  }

  get loadFinished(): boolean {
    return this.viewListData.length >= this.sourcePoolList.length
  }

  get viewListData(): PoolListItem[] {
    return this.sourceTableBody.slice(0, this.pageSize * this.currentPage)
  }

  onListLoad() {
    if (this.loadFinished) {
      return
    }
    this.currentPage += 1
  }

  mounted() {
    if (this.storeSelectedListType === '') {
      this.selectedPoolListType = 'certified'
    } else {
      this.selectedPoolListType = this.storeSelectedListType
    }
  }

  getOperatorName(item: PoolListItem): string {
    const name = getOperatorName(item.operatorAddress.toLowerCase())
    if (name === item.operatorAddress.toLowerCase()) return ''
    return name
  }

  splitAddress (address: string) {
    return ellipsisMiddle(address, 6, 4)
  }

  openAddressLink (address: string) {
    window.location.href = etherBrowserAddressUrl(address)
  }

  toPoolInfoPage(poolAddress: string) {
    this.$router.push({
      name: 'poolInfo',
      params: { poolAddress }
    })
  }

  showPerpetualPopup(args:{ perpetuals: Perpetual[]; collateral:string }) {
    this.currentPerpetuals = args.perpetuals
    this.currentCollateral = args.collateral
    this.showPerpetualListPopup = true
  }
}
</script>

<style lang="scss">
  .info-radio {
    background: var(--mc-color-primary-gradient);
  }
</style>

<style scoped lang="scss">
.pool-list {
  width: 100%;

  .page-container {
    padding: 0 16px;
  }

  .bg {
    position: absolute;
    width: 800px;
    left: calc(50% - 368px);
    filter: blur(90px);
    z-index: 0;
    pointer-events: none;
  }

  .mc-tabs {
    height: 56px;
  }

  .select-box {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 16px;

    .left {
      width: 100%;
      height: 57px;
      border-bottom: 1px solid var(--mc-border-color);

      .mc-tabs {
        width: 169px;
      }

      ::v-deep .tab-item {
        font-size: 16px;
        height: 56px;
        line-height: 56px;
      }
    }

    .right {

    }
  }

  .switch-box {
    display: flex;
    align-items: center;
    margin-bottom: 18px;

    .switch-item {
      display: inline-flex;
      align-items: center;
      margin-left: 16px;

      &:first-child {
        margin-left: 0;
      }

      .label {
        margin-left: 8px;
        font-size: 14px;
        line-height: 20px;
      }
    }

    .van-switch {
      width: 42px;
      height: 24px;
      background-color: var(--mc-background-color-dark-light);
      border: unset;

      &.van-switch--on {
        .van-switch__node {
          transform: translateX(19px);
        }
      }

      ::v-deep .van-switch__node {
        top: 3px;
        left: 3px;
      }
    }

    .van-switch--on {
      background: linear-gradient(90deg, #00d8e2 0%, #27a2f8 100%)!important;
    }
  }

  .search {
    .search-input-box {
      &.search-input-box-focus {
        border-radius: 12px;
        background: linear-gradient(90deg, #00d8e2 0%, #27a2f8 100%);
        height: 52px;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      ::v-deep .van-field__left-icon {
        margin-right: 8px;
      }
    }

    .search-input {
      height: 52px;
      line-height: 52px;
      width: 100%;
      border: 1px solid;
      border-radius: 12px;
      border-color: var(--mc-border-color);
      background: var(--mc-background-color-dark);
      padding: 0 16px;

      &.search-input-focus {
        border: unset;
        height: 50px;
        width: calc(100% - 2px);

        .icon-search-bold {
          color: var(--mc-text-color-white);
        }
      }

      ::v-deep {
        input::-webkit-input-placeholder{
          color: var(--mc-text-color-dark);
        }
      }
    }

    .icon-search-bold {
      font-size: 16px;
      color: var(--mc-text-color-dark);
    }
  }

  .title {
    display: inline-flex;
    align-items: center;
  }

  .link {
    display: inline-block;
    line-height: 20px;
    color: #27A2F8;
    cursor: pointer;
  }

  .text {
    font-size: 12px;
    line-height: 16px;
    color: var(--mc-text-color);
    margin-top: 4px;
  }

  .list-container {
    margin-top: 24px;
    height: calc(100% - 149px);
    overflow: hidden;
    overflow-y: scroll;

    .mc-copy-container {
      margin-left: 4px;
      height: 16px;
    }

    .pool-info {
      width: 100%;
      height: 144px;
      position: relative;
      margin-bottom: 16px;

      .top {
        width: 100%;
        height: 72px;
        position: relative;
        z-index: 5;
        border-radius: 12px;
        border: 1px solid var(--mc-border-color);
        background-color: var(--mc-background-color-dark);
        padding: 16px;
        display: flex;
        justify-content: space-between;

        .left {
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 14px;
          line-height: 20px;

          .token-img {
            margin-right: 8px;
            height: 32px;
          }

          .title {
            font-size: 14px;
            line-height: 20px;
          }

          .value {
            display: flex;
            align-items: center;
            line-height: 16px;
            margin-top: 4px;
          }

          .pool-address {
            font-size: 12px;
            line-height: 16px;
          }

          .collateral {
            margin-top: 4px;
          }
        }

        .right {
          display: flex;
          align-items: center;
          text-align: right;
          font-size: 14px;
          line-height: 20px;

          .icon-right2 {
            margin-left: 16px;
            color: var(--mc-text-color-dark);
          }
        }
      }

      .bottom {
        width: 100%;
        height: 85px;
        position: absolute;
        bottom: 0;
        z-index: 4;
        border-radius: 0 0 12px 12px;
        border: 1px solid var(--mc-border-color);
        border-top: none;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 21px 16px 8px;
        font-size: 14px;
        background: var(--mc-background-color-darkest);

        .flex-box {
          display: flex;
          align-items: center;
        }

        .text {
          margin-bottom: 4px;
          margin-top: 0;
        }

        .operator {
          font-size: 14px;
          line-height: 20px;
        }

        .pn-number {
          display: inline-block;
          line-height: 20px;
        }
      }
    }
  }

  ::v-deep.no-data {
    height: 100%;
  }
}
</style>

<style lang="scss">
.pool-list-apy-tooltip {

  .flex-line {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .line-item {
    line-height: 20px;
    margin-top: 8px;

    &:first-child {
      margin-top: 0;
    }
  }
}
</style>
