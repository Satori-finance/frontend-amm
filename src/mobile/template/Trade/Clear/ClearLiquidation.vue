<template>
  <div class="clear-liquidation">
    <div class="liquidation-container">
      <div class="label">{{ $t('perpetualSettle.clearProgress') }}</div>
      <div class="process-line">
        <div class="left" ref="progressContainer">
          <McMProgressBar :value="clearPercentage" :max="Number(totalClearAccount)" ref="progress" />
        </div>
      </div>
      <div class="clear-process-panel">
        <div class="label">{{ $t('perpetualSettle.clearIncentives') }}</div>
        <div class="value">{{ clearIncentivesValue }}</div>
        <div class="uint">{{ collateralTokenSymbol }} / {{ $t('account') }}</div>
        <div class="info">
        </div>
      </div>
      <div class="clear-button">
        <van-button class="round" v-if="!isConnectedWallet" size="large" @click="onConnectWallet">
          <i class="iconfont icon-wallet-bold"></i>
          {{ $t('connectWalletButton.connectWallet') }}
        </van-button>
        <McMStateButton
          v-if="isConnectedWallet"
          :button-class="['round', 'large']"
          :state.sync="clearButtonState"
          :disabled="confirmButtonIsDisabled"
          @click="clearEvent"
        >
          {{ $t('base.clear') }}
        </McMStateButton>
      </div>
      <div class="info-panel">
        <div class="info-line">
          <span>{{ $t('base.marginBalance') }}</span>
          <span class="value">
            <span v-if="accountMarginBalance">
              {{ accountMarginBalance | bigNumberFormatter(collateralFormatDecimals) }} {{ collateralTokenSymbol }}
            </span>
            <span v-else>---</span>
          </span>
        </div>
        <div class="info-line">
          <span>{{ $t('base.side') }}</span>
          <span v-if="accountPosition && !accountPosition.isZero()">
            <span :class="[positionSideClass]">
              <span v-if="accountPosition.gt(0)">{{ $t('base.long') }}</span>
              <span v-if="accountPosition.lt(0)">{{ $t('base.short') }}</span>
            </span>
            <span class="value">{{ underlyingTokenSymbol }}</span>
          </span>
          <span v-else>---</span>
        </div>
        <div class="info-line">
          <span>{{ $t('base.size') }}</span>
          <span class="value">
            <span v-if="accountPosition">
              {{ accountPosition.abs() | bigNumberFormatter(underlyingTokenDecimals) }} {{ underlyingTokenSymbol }}
              <span class="sub-value">
                ({{ accountPositionValue | bigNumberFormatter(collateralFormatDecimals) }}
                {{ collateralTokenSymbol }})</span
              >
            </span>
            <span v-else>---</span>
          </span>
        </div>
        <div class="info-line">
          <span>{{ $t('perpetualSettle.settlePrice') }}</span>
          <span class="value">
            <span v-if="globalSettlePrice">
              {{ globalSettlePrice | bigNumberFormatter(priceFormatDecimals) }}
              {{ priceUnit }}
            </span>
            <span v-else>---</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Ref } from 'vue-property-decorator'
import ClearLiquidationMixin from '@/template/components/Clear/clearLiquidationMixin'
import { toBigNumber } from '@/utils'
import { McMStateButton, McMProgressBar } from '@/mobile/components'
import elementResizeDetectorMaker from 'element-resize-detector'
import { VUE_EVENT_BUS } from '@/event'
import { COMMON_EVENT } from '@/mobile/event'

@Component({
  components: {
    McMStateButton,
    McMProgressBar,
  }
})
export default class ClearLiquidation extends Mixins(ClearLiquidationMixin) {
  @Ref('progressContainer') progressContainer !: HTMLDivElement

  private erd: elementResizeDetectorMaker.Erd | null = null

  mounted() {
    this.erd = elementResizeDetectorMaker()
    this.$nextTick(() => {
      this.erd?.listenTo(this.progressContainer, () => {
        (this.$refs.progress as any).resize()
      })
    })
  }

  get clearPercentage(): number {
    if (this.totalClearAccount === '' || this.leftClearAccount === '' || this.completedClearAccount === 0) {
      return 0
    }
    const p = toBigNumber(this.completedClearAccount).div(this.totalClearAccount).times(100).toFixed(0)
    return Number(p)
  }

  get positionSideClass(): string {
    if (!this.accountPosition) {
      return ''
    }
    if (this.accountPosition.gt(0)) {
      return 'blue'
    }
    if (this.accountPosition.lt(0)) {
      return 'orange'
    }
    return ''
  }

  get positionSideText(): string {
    if (!this.accountPosition) {
      return ''
    }
    if (this.accountPosition.gt(0)) {
      return this.$t('base.long').toString()
    }
    if (this.accountPosition.lt(0)) {
      return this.$t('base.short').toString()
    }
    return ''
  }

  onConnectWallet() {
    VUE_EVENT_BUS.emit(COMMON_EVENT.SHOW_SELECT_WALLET_POPUP)
  }
}
</script>

<style lang="scss" scoped>
.clear-liquidation {

  .sub-value {
    color: var(--mc-text-color);
  }

  .liquidation-container {
    .label {
      font-size: 14px;
      line-height: 20px;
      color: var(--mc-text-color);
    }

    .process-line {
      margin-top: 8px;
      line-height: 7px;

      ::v-deep .van-progress {
        background: var(--mc-background-color-light);

        .van-progress__portion {
          background: var(--mc-color-primary);
        }
      }
    }

    .clear-process-panel {
      margin-top: 24px;
      text-align: center;

      .value {
        font-size: 40px;
        line-height: 48px;
        margin-top: 8px;
        color: var(--mc-color-primary);
      }

      .uint {
        margin-top: 4px;
        font-size: 14px;
        line-height: 20px;
      }
    }

    .clear-button {
      margin-top: 24px;
      .van-button.large {
        width: 100%;
      }
    }

    .info-panel {
      margin-top: 16px;
      font-size: 14px;
      color: var(--mc-text-color);
      border: 1px solid var(--mc-border-color);
      border-radius: 12px;
      padding: 16px;

      .info-line {
        margin-bottom: 12px;
        line-height: 20px;
        display: flex;
        justify-content: space-between;

        .value {
          color: var(--mc-text-color-white);
        }

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }

  .blue {
    color: var(--mc-color-blue);
  }

  .orange {
    color: var(--mc-color-orange);
  }
}
</style>
