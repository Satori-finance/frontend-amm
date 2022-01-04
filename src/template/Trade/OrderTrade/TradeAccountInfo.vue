<template>
  <div class="trade-account-info">
    <div class="content">
      <div class="layout-item">
        <div class="change-info-item">
          <div class="info-left">
            <div class="label-group">
              <span class="label">{{ $t('base.mode') }}</span>
              <span class="value">{{ $t('base.isolated') }}</span>
            </div>
          </div>
          <el-divider direction="vertical"></el-divider>
          <div class="info-right">
            <el-button class="isolated-button" @click="showChangeLeverage" :disabled="!selectedPerpetualAmmIsSafe ||
                                                    selectedPerpetualOracleIsTerminated || selectedPerpetualIsSettle
                                                    || !isConnectedWallet">
              <span style="margin-right: 8px;">{{ $t('base.leverage') }}</span>
              {{ selectPerpetualTargetLeverage | bigNumberFormatter(0) }}x
            </el-button>
          </div>
        </div>
      </div>
      <div class="layout-item">
        <div class="label-group">
          <div class="label-line-item">
            <span class="label">{{ l2WalletBalanceAndMarginCaption }}</span>
          </div>
          <div class="value">
            <span v-if="l2WalletBalanceAndMargin">
              <span v-if="collateralMatch">
                {{ nativeTokenBalance | bigNumberFormatter(collateralFormatDecimals) }} {{ collateralTokenSymbol }}
              </span>
              <span v-else
              >{{ l2WalletBalanceAndMargin | bigNumberFormatter(collateralFormatDecimals) }}
                {{ collateralTokenSymbol }}</span
              >
            </span>
          </div>
        </div>
        <div class="label-group" v-if="collateralMatch">
          <div class="value">
          <span v-if="collateralMatch"
          >{{ l2WalletBalanceAndMargin | bigNumberFormatter(collateralFormatDecimals) }} WETH</span
          >
            <a @click="showWrapDialog"> <i class="iconfont icon-h-switch"></i></a>
          </div>
        </div>
      </div>
    </div>
    <WrapDialog :visible.sync="isShowWrapDialog" />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { AccountWithSelectedPerpetualMixin } from '@/mixins'
import WrapDialog from '@/template/Dialogs/WrapDialog.vue'
import WrapMixin from '@/template/components/Wrap/WrapMixin'
import { COMMON_EVENT, VUE_EVENT_BUS } from '@/event'
import { SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/const'

const wallet = namespace('wallet')

@Component({
  components: {
    WrapDialog,
  },
})
export default class TradeAccountInfo extends Mixins(AccountWithSelectedPerpetualMixin, WrapMixin) {
  @wallet.Getter('address') accountAddress!: string | null

  private isShowWrapDialog: boolean = false

  get isBSC() {
    return TARGET_NETWORK_ID === SUPPORTED_NETWORK_ID.BSC
  }

  get l2WalletBalanceAndMarginCaption(): string {
    if (
      this.selectedAccountDetails?.accountStorage.positionAmount.isZero() &&
      !this.selectedAccountDetails.accountComputed.marginBalance.isZero()
    ) {
      return this.isBSC ? this.$t('placeOrder.walletAndMargin').toString() : this.$t('placeOrder.l2WalletAndMargin').toString()
    }
    return this.isBSC ? this.$t('placeOrder.wallet').toString() : this.$t('placeOrder.l2Wallet').toString()
  }

  showWrapDialog() {
    this.isShowWrapDialog = true
  }

  private showChangeLeverage() {
    if (!this.selectedPerpetual) {
      return
    }
    VUE_EVENT_BUS.emit(COMMON_EVENT.CHANGE_TARGET_LEVERAGE, this.selectedPerpetualID)
  }
}
</script>

<style lang="scss" scoped>
.trade-account-info {
  border-radius: 1px;

  .content {
    .layout-item {
      padding-bottom: 16px;
    }

    .label-group {
      display: flex;
      justify-content: space-between;
      line-height: 16px;

      .label-line-item {
        display: flex;
      }

      .label {
        font-size: 12px;
        font-weight: 400;
        color: var(--mc-text-color);
      }

      .value {
        margin-left: auto;
        font-size: 12px;
        display: flex;

        i {
          font-size: 14px;
          margin-left: 6px;
          color: var(--mc-color-brand);
          cursor: pointer;
        }
      }
    }

    .change-info-item {
      display: flex;
      align-items: center;
      justify-content: space-around;

      .info-left {
        text-align: left;
        width: 100%;
      }

      .info-vertical-info {
        text-align: center;
      }

      .info-right {
        width: 100%;
      }
    }

    ::v-deep .el-divider--vertical {
      height: 12px;
      background-color: var(--mc-background-color-light);
    }
  }

  .isolated-button {
    background: var(--mc-background-color);
    border-radius: 8px;
    height: 32px;
    font-size: 12px;
    width: 100%;
  }
}
</style>

<style lang="scss" scoped>
.dex-theme-dark {
  .margin-info {
    background: var(--mc-background-color);

    .content {
      .label-group {
        color: var(--mc-text-color);
      }
    }
  }
}
</style>
