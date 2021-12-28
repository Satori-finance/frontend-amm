<template>
  <div class="vault-asset-details scroll-container">
    <BackNavBar :title="$t('dao.vaultAssetDetails')"></BackNavBar>
    <div class="details-container page-container">
      <div class="title">
        {{ $t('base.token') }} ({{ assetsList.length }})
      </div>
      <div class="list-container">
        <van-skeleton title :row="16" :loading="vaultAssetsLoading || tokenPriceLoading">
          <div class="token-item" v-for="(item, index) in tableData" :key="index">
            <div class="line-first">
              <div class="left">
                <van-image :src="item.address | tokenIconUrlFormatter(item.chainId) | tokenIconFormatter">
                  <div slot="error" class="image-slot">
                    <img src="@/assets/img/tokens/Unknow.svg" alt="">
                  </div>
                </van-image>
                <span class="name">{{ item.tokenName }}</span>
              </div>
              <div>
                <span v-if="item.value">
                  ${{ item.value || 0 | bigNumberFormatterByPrecision(5) }}
                </span>
                <span v-else>---</span>
              </div>
            </div>
            <div class="line-last">
              <div>
                {{ item.amount | bigNumberFormatterByPrecision(5) }} {{ item.tokenName }}
              </div>
              <div>
              <span v-if="item.price">
                @{{ item.price | bigNumberFormatter(2) }}
              </span>
                <span v-else>---</span>
              </div>
            </div>
          </div>
        </van-skeleton>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BackNavBar from '@/mobile/template/Header/BackNavBar.vue'
import { VaultAssetDetailsMixin, VaultAssetItem } from '@/template/components/DAO/Info/vaultAssetDetailsMixin'
import _ from 'lodash'
import { McMLoading } from '@/mobile/components'

@Component({
  components: {
    BackNavBar,
    McMLoading,
  },

  filters: {
    tokenIconFormatter(val: string | undefined) {
      if (val) {
        return val
      } else {
        return ''
      }
    }
  }
})
export default class VaultAssetDetails extends Mixins(VaultAssetDetailsMixin) {

  get tableData(): VaultAssetItem[] {
    return _.orderBy(
      this.totalAssetsList,
      [
        (item) => item.value?.toNumber() || 0,
      ],
      ['desc']
    )
  }
}
</script>

<style lang="scss" scoped>
.vault-asset-details {
  display: flex;
  width: 100%;
  height: 100%;

  .details-container {
    width: 100%;
    height: 100%;
    background-color: var(--mc-background-color);
    border-radius: 24px 24px 0 0;
    padding: 16px;

    .title {
      font-size: 18px;
      font-weight: 400;
      margin-bottom: 16px;
    }

    .list-container {
      height: 97%;
      overflow: hidden;
      overflow-y: scroll;

      .token-item {
        font-size: 16px;
        height: 82px;
        padding: 16px 0;

        .line-first {
          display: flex;
          justify-content: space-between;
          color: var(--mc-text-color-white);
          height: 24px;
          line-height: 24px;

          .left {
            display: flex;
          }

          .van-image {
            height: 24px;
            width: 24px;
            border-radius: 50%;
            margin-right: 8px;

            ::v-deep .van-image__error {
              background-color: transparent;
            }

            .image-slot {
              height: 24px;
              width: 24px;
            }

            img {
              height: 24px;
              width: 24px;
            }
          }

          .name {
            display: inline-block;
            height: 24px;
            line-height: 28px;
          }
        }

        .line-last {
          display: flex;
          justify-content: space-between;
          color: var(--mc-text-color);
          margin-top: 8px;
          height: 18px;
          line-height: 18px;
        }
      }
    }
  }
}
</style>
