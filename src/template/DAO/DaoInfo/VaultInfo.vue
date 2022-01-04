<template>
  <div class="vault-info">
    <div class="panel-item-header">
      <div class="title">{{ $t('dao.MCDEXVault') }}</div>
      <a class="link" href="https://docs.mcdex.io/dao/mcdex-dao" target="_blank">
        <i class="iconfont icon-details-bold"></i>
        <span>{{ $t('dao.aboutVault') }}</span></a>
    </div>
    <div class="card-container">
      <div class="left">
        <div>
          <div class="bold-text">
            <McLoadingIcon v-if="!loadAssetsCompleted" :height="40"></McLoadingIcon>
            <span v-else>${{ vaultAssetsTotalUSD | vaultAssetFormatter }}</span>
          </div>
          <div class="text">{{ $t('dao.vaultAsset') }}</div>
          <div class="text text-prompt" v-html="$t('dao.vaultAssetPrompt')"></div>
        </div>
        <div class="link">
          <span @click="showDetailsDialog = true">{{ $t('dao.assetDetails') }}</span>
        </div>
      </div>
      <div class="right">
        <div class="card-item">
          <div class="item-top">
            <McLoadingIcon v-if="capturedValueLoading"></McLoadingIcon>
            <div v-else class="value">${{ capturedValue24h | bigNumberFormatter(0) }}</div>
            <div class="text">{{ $t('dao.24HCapturedValue') }}</div>
          </div>
          <div class="item-bottom">
            <McLoadingIcon v-if="capturedValueLoading"></McLoadingIcon>
            <div v-else class="value">${{ totalCapturedValue | bigNumberFormatter(0) }}</div>
            <div class="text">{{ $t('dao.totalCapturedValue') }}</div>
          </div>
        </div>
        <div class="card-item">
          <div class="item-top no-padding">
            <div class="value">
              <McLoadingIcon v-if="mintableSATORILoading"></McLoadingIcon>
              <div v-else>{{ mintableSATORI | bigNumberFormatter(0) }}</div>
              <img class="token-img" src="@/assets/img/tokens/SATORI.svg" alt="">
            </div>
            <div class="text flex-box">
              {{ $t('dao.mintable') }}
              <el-tooltip placement="top">
                <div slot="content"><span v-html="$t('dao.mintablePrompt')"></span></div>
                <div class="tooltip-box">
                  <svg class="svg-icon" aria-hidden="true">
                    <use :xlink:href="`#icon-help`"></use>
                  </svg>
                </div>
              </el-tooltip></div>
          </div>
          <div class="mintable-img">
            <img src="@/assets/img/dao-mintable.png"  alt=""/>
          </div>
        </div>
      </div>
    </div>

    <VaultAssetDetailsDialog :visible.sync="showDetailsDialog" />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import VaultInfoMixin from '@/template/components/DAO/Info/VaultInfoMixin'
import { VaultAssetDetailsMixin } from '@/template/components/DAO/Info/vaultAssetDetailsMixin'
import { SATORI_ADDRESS } from '@/const'
import VaultAssetDetailsDialog from '../Components/VaultAssetDetailsDialog.vue'
import BigNumber from 'bignumber.js'
import { McLoadingIcon } from '@/components'

@Component({
  components: {
    VaultAssetDetailsDialog,
    McLoadingIcon
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
export default class VaultInfo  extends Mixins(VaultInfoMixin, VaultAssetDetailsMixin) {
  private SATORI_ADDRESS: string = SATORI_ADDRESS
  private showDetailsDialog:boolean = false

  onAssetDetailsEvents() {
    this.$router.push({ name: 'daoVaultAsset' })
  }
}
</script>

<style scoped lang="scss">
@import "./info.scss";
.vault-info {

  .card-container {
    width: 384px;

    .left {
      width: 136px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .text-prompt {
        margin-top: 24px;

        ::v-deep a {
          text-decoration: underline;
        }
      }
    }

    .right {
      width: 184px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .no-padding {
        padding-bottom: 0;
      }

      .mintable-img {
        height: 80px;
        margin-top: 1px;
      }
    }
  }

  .flex-box {
    display: flex;
    align-items: center;
  }
}
</style>

