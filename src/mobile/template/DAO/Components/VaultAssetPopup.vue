<template>
  <div class="vault-asset-popup">
    <van-popup
      v-model="showPopup"
      round
      position="bottom"
      class="safe-area-inset-bottom"
      safe-area-inset-bottom
      closeable
    >
      <div class="popup-header">{{ $t('dao.assetDetailsDialog.title') }}</div>
      <div class="popup-container">
        <div v-html="$t('dao.vaultAssetPromptMobile')"></div>
        <div class="asset-list" v-if="!noData">
          <div class="list-head">
            <div>{{ $t('dao.assetDetailsDialog.asset') }}</div>
            <div>{{ $t('dao.assetDetailsDialog.amount') }}</div>
          </div>
          <div class="list-body">
            <div class="asset-list-item" v-for="(item, index) in tableData" :key="index">
              <div class="left">
                <span class="chain-bg" :class="`chain-${item.chainId}`">
                  <McMTokenImageView :size="24" :token="item.address" :chain-id="item.chainId" />
                </span>
                <div class="name">{{ item.tokenName }}</div>
                <a :href="item.address | etherBrowserAddressFormatter">
                  <i class="iconfont icon-view"></i>
                </a>
              </div>
              <div class="right">
                <div class="amount">{{ item.amount | bigNumberFormatterByPrecision(5) }}</div>
                <div class="token-value">${{ item.value || 0 | bigNumberFormatterByPrecision(5) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import { VaultAssetDetailsMixin, VaultAssetItem } from '@/template/components/DAO/Info/vaultAssetDetailsMixin'
import { McMTokenImageView } from '@/mobile/components'
import _ from 'lodash'

@Component({
  components: {
    McMTokenImageView,
  },
})
export default class VaultAssetPopup extends Mixins(VaultAssetDetailsMixin) {
  @Prop({ required: true }) visible !: boolean

  get showPopup(): boolean {
    return this.visible
  }

  set showPopup(val: boolean) {
    this.$emit('update:visible', val)
  }

  get tableData(): VaultAssetItem[] {
    return _.orderBy(
      this.totalAssetsList,
      [
        (item) => item.value?.toNumber(),
      ],
      ['desc']
    )
  }

  get noData(): boolean {
    return this.tableData.length === 0
  }
}
</script>

<style lang="scss" scoped>
.vault-asset-popup {
  ::v-deep {
    .van-popup {
      padding: 16px;
      min-height: 420px;
      max-height: 480px;
    }

    .van-popup__close-icon {
      color: var(--mc-text-color-white);
    }
  }

  .popup-container {
    margin: 28px 0 0;
    font-size: 14px;
    line-height: 20px;

    ::v-deep a {
      text-decoration: underline;
    }

    .asset-list {
      .list-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;
        line-height: 20px;
        color: var(--mc-text-color);
        margin-top: 12px;
        height: 36px;
      }

      .list-body {
        max-height: 250px;
        overflow: scroll;

        .asset-list-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 72px;
          border-top: 1px solid #1A2136;

          .left {
            display: flex;
            align-items: center;

            .name {
              margin-left: 8px;
            }

            a {
              margin-left: 4px;
              text-decoration: none;
              font-size: 16px;
              color: var(--mc-text-color);
            }

            .chain-bg {
              background-color: #000000;
              border: 2px solid;
              padding: 2px;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              &.chain-56 {
                border-color: #FFC100;
              }
              &.chain-42161 {
                border-color: #28A0F0;
              }
            }
          }

          .right {
            text-align: right;

            .amount {
              font-size: 14px;
              line-height: 20px;
            }

            .token-value {
              font-size: 12px;
              line-height: 16px;
              margin-top: 4px;
              color: var(--mc-text-color);
            }
          }
        }
      }
    }
  }
}
</style>
