<template>
  <div class="vault-info">
    <div class="info-title">
      <div>{{ $t('dao.MCDEXVault') }}</div>
      <a class="link" href="https://docs.mcdex.io/dao/mcdex-dao">
        <i class="iconfont icon-details-bold"></i>
        <span>{{ $t('dao.aboutVault') }}</span></a>
    </div>
    <div class="info-content">
      <div class="price">
        <div>
          <McLoadingIcon v-if="!loadAssetsCompleted" :height="40"></McLoadingIcon>
          <div v-else class="value">{{ vaultAssetsTotalUSD | vaultAssetFormatter }}</div>
          <div class="text">{{ $t('dao.vaultAsset') }}</div>
        </div>
        <div class="asset-details" @click="showVaultAssetPopup">
          <div>{{ $t('dao.assetDetails') }}</div>
          <i class="iconfont icon-bold-right"></i>
        </div>
      </div>

      <div class="info-card">
        <div class="info-card-item">
          <div>
            <div class="top">
              <McLoadingIcon v-if="capturedValueLoading"></McLoadingIcon>
              <div v-else class="value">${{ capturedValue24h | bigNumberFormatter(0) }}</div>
              <div class="text">{{ $t('dao.24HCapturedValue') }}</div>
            </div>
            <div class="bottom">
              <McLoadingIcon v-if="capturedValueLoading"></McLoadingIcon>
              <div v-else class="value">${{ totalCapturedValue | bigNumberFormatter(0) }}</div>
              <div class="text">{{ $t('dao.totalCapturedValue') }}</div>
            </div>
          </div>
        </div>
        <div class="info-card-item">
          <div class="value">
            <McLoadingIcon v-if="mintableSATORILoading"></McLoadingIcon>
            <span v-else>{{ mintableSATORI | bigNumberFormatter(0) }}</span>
            <McMTokenImageView :size="22" :token="SATORI_ADDRESS" />
          </div>
          <div class="text">
            <div>{{ $t('dao.mintable') }}</div>
            <McMTooltip placement="top">
              <div slot="content"><span v-html="$t('dao.mintablePrompt')"></span></div>
              <div class="tooltip-box">
                <svg class="svg-icon" aria-hidden="true">
                  <use :xlink:href="`#icon-help`"></use>
                </svg>
              </div>
            </McMTooltip>
          </div>
          <div class="img">
            <img src="@/assets/img/dao-mintable.png"  alt=""/>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { McMInfoCard, McMTokenImageView, McMTooltip } from '@/mobile/components'
import VaultInfoMixin from '@/template/components/DAO/Info/VaultInfoMixin'
import { VaultAssetDetailsMixin } from '@/template/components/DAO/Info/vaultAssetDetailsMixin'
import BigNumber from 'bignumber.js'
import { SATORI_ADDRESS } from '@/const'
import { McLoadingIcon } from '@/components'
import { VUE_EVENT_BUS } from '@/event'
import { COMMON_EVENT } from '@/mobile/event'

@Component({
  components: {
    McMInfoCard,
    McMTokenImageView,
    McMTooltip,
    McLoadingIcon,
  },

  filters: {
    vaultAssetFormatter(val: BigNumber) {
      if (!val) {
        return
      }
      if (val.gte(new BigNumber(1).shiftedBy(9))) {
        return `${val.shiftedBy(-9).decimalPlaces(2)}B`
      } else if (val.gte(new BigNumber(1).shiftedBy(6))) {
        return `${val.shiftedBy(-6).decimalPlaces(2)}M`
      }
      return val.decimalPlaces(0).toFormat()
    }
  }
})
export default class VaultInfo extends Mixins(VaultInfoMixin, VaultAssetDetailsMixin) {
  private SATORI_ADDRESS: string = SATORI_ADDRESS

  toAssetDetails() {
    this.$router.push({ name: 'daoVaultAsset' })
  }

  showVaultAssetPopup() {
    VUE_EVENT_BUS.emit(COMMON_EVENT.SHOW_VAULT_ASSET_POPUP)
  }
}
</script>

<style lang="scss" scoped>
@import "./info.scss";

.vault-info {
  .price {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;

    .icon-loading-bold {
      font-size: 32px;
      line-height: 40px;
    }
  }

  .icon-loading-bold {
    display: inline-block;
    animation: rotating 2s linear infinite;
    font-size: 20px;
    line-height: 24px;
  }

  .asset-details {
    font-size: 14px;
    line-height: 20px;
    display: flex;
    align-items: center;
    color: var(--mc-color-primary);

    .icon-bold-right {
      font-size: 12px;
      margin-left: 4px;
    }
  }

  .img {
    text-align: right;
    margin-top: 1px;
    height: 80px;
  }
}
</style>
