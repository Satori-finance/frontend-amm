<template>
  <div class="asset-details-dialog">
    <el-dialog
      :visible.sync="currentVisible"
      append-to-body
      top="0"
      custom-class="is-small is-round"
      @closed="onClosed"
      :title="$t('dao.assetDetailsDialog.title')"
      :close-on-click-modal="closeModal"
      :close-on-press-escape="closePressEsc"
    >
      <div class="info-title">
        <div>{{ $t('dao.assetDetailsDialog.asset') }}</div>
        <div>{{ $t('dao.assetDetailsDialog.amount') }}</div>
      </div>
      <McLoading :show-loading="tokenPriceLoading" :min-show-time="500" :hideContent="true">
        <div class="token-list">
          <div class="token-item" v-for="(item, index) in tableData" :key="index">
            <div class="left">
              <span class="chain-bg" :class="`chain-${item.chainId}`">
                <el-image class="token-img" :src="item.address | tokenIconUrlFormatter(item.chainId)">
                  <div slot="error" class="image-slot">
                    <img src="@/assets/img/tokens/Unknow.svg" alt="">
                  </div>
                </el-image>
              </span>
              <div class="name">{{ item.tokenName }}</div>
              <a :href="item.address | etherBrowserAddressFormatter(item.chainId)" target="_blank">
                <i class="iconfont icon-view"></i>
              </a>
            </div>
            <div class="right">
              <div class="amount">{{ item.amount | bigNumberFormatterByPrecision(5) }}</div>
              <div class="token-value">
                <template v-if="item.value">
                  ${{ item.value || 0 | bigNumberFormatterByPrecision(5) }}
                </template>
                <McLoadingIcon v-else></McLoadingIcon>
              </div>
            </div>
          </div>
        </div>
      </McLoading>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins, Ref } from 'vue-property-decorator'
import { McLoading, McLoadingIcon } from '@/components'
import { VaultAssetDetailsMixin, VaultAssetItem } from '@/template/components/DAO/Info/vaultAssetDetailsMixin'
import _ from 'lodash'
import { SUPPORTED_NETWORK_ID } from '@/const'

@Component({
  components: {
    McLoading,
    McLoadingIcon,
  },
})
export default class VaultAssetDetailsDialog extends Mixins(VaultAssetDetailsMixin) {
  @Prop({ default: false }) visible!: boolean

  private closeModal: boolean = false
  private closePressEsc: boolean = false
  private arbNetworkId = SUPPORTED_NETWORK_ID.ARB

  onClosed() {
    this.$emit('closed')
  }

  get currentVisible() {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
  }

  private pagination = {
    pageSize: 10,
    currentPage: 1
  }

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
::v-deep .el-dialog {
  height: 542px;
}

::v-deep .mc-loading {
  height: 400px;
}

.info-title {
  font-size: 14px;
  line-height: 20px;
  display: flex;
  justify-content: space-between;
  padding: 20px 0 8px;
  border-bottom: 1px solid;
}

.token-list {
  .token-item {
    padding: 16px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid;

    .left {
      display: flex;
      align-items: center;

      .chain-bg {
        background-color: #000000;
        border: 2px solid;
        padding: 2px;
        width: 32px;
        height: 32px;
        margin-right: 8px;
        border-radius: 50%;
        &.chain-56 {
          border-color: #FFC100;
        }
        &.chain-42161 {
          border-color: #28A0F0;
        }
      }

      .token-img {
        ::v-deep img {
          width: 24px;
          height: 24px;
        }
      }

      .name {
        font-size: 14px;
        line-height: 20px;
        margin-right: 6px;
      }

      .icon-view {
        font-size: 16px;
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
      }
    }
  }
}
</style>

<style scoped lang="scss">
.satori-fantasy {
  .info-title {
    color: var(--mc-text-color);
    border-bottom-color: #1A2136;
  }

  .token-list {
    .token-item {
      border-bottom-color: #1A2136;

      .left {
        .icon-view {
          color: var(--mc-text-color);
        }
      }

      .right {
        .token-value {
          color: var(--mc-text-color);
        }
      }
    }
  }
}
</style>
