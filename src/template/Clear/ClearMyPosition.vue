<template>
  <div class="settle-my-position">
    <BaseCardFrame :title="$t('perpetualSettle.myMarginBalance')">
      <template slot="content">
        <div class="content-container">
          <!-- clearing -->
          <div v-if="!isClearEnd" class="text-item clearing-box">
            <div class="clearing-content">
              <div class="text-item justify-text-item">
                <span>{{ $t('base.marginBalance') }}</span>
                <span class="text-value">
                  <span v-if="accountMarginBalance">
                    {{ accountMarginBalance | bigNumberFormatter(collateralFormatDecimals) }} {{
                      collateralTokenSymbol
                    }}
                  </span>
                  <span v-else>---</span>
                </span>
              </div>
              <div class="text-item justify-text-item">
                <span>{{ $t('base.side') }}</span>
                <span class="text-value">
                  <span v-if="positionSide">
                    <span :class="{'long-color': positionSide==='long','short-color': positionSide==='short'}">
                      {{ positionSide === 'long' ? $t('base.long') : $t('base.short') }}
                    </span>
                    <span>{{ underlyingTokenSymbol }}</span>
                  </span>
                  <span v-else>---</span>
                </span>
              </div>
              <div class="text-item justify-text-item">
                <span>{{ $t('base.size') }}</span>
                <span class="text-value">
                  <span>{{ position | bigNumberFormatter(underlyingTokenDecimals) }} {{ underlyingTokenSymbol }}</span>
                  <span class="sub-value"> ({{
                      positionValue | bigNumberFormatter(collateralFormatDecimals)
                    }} {{ collateralTokenSymbol }})</span>
                </span>
              </div>
              <div class="text-item justify-text-item">
                <span>{{ $t('perpetualSettle.settlePrice') }}</span>
                <span class="text-value">
                  {{ settlePrice | bigNumberFormatter(priceFormatDecimals) }}
                  {{ priceUnit }}
                </span>
              </div>
            </div>
          </div>
          <!-- clear end -->
          <div v-else class="position-box">
            <div class="info-panel">
              <div class="info-content">
                <div class="amount">{{ marginBalance | bigNumberFormatter(collateralFormatDecimals) }}</div>
                <div class="unit">
                  {{ collateralTokenSymbol }}
                </div>
              </div>
            </div>
            <div class="footer-button">
              <el-button size="medium" type="orange" @click="withdrawToWalletEvent" :disabled="confirmButtonIsDisabled">
                {{ $t('base.withdraw') }}
                <i v-if="buttonIsLoading" class="el-icon-loading"></i>
              </el-button>
            </div>
          </div>
        </div>
      </template>
    </BaseCardFrame>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { BaseCardFrame } from '@/components'
import ClearMyPositionMixin from '@/template/components/Clear/clearMyPositionMixin'

@Component({
  components: {
    BaseCardFrame,
  },
})
export default class ClearMyPosition extends Mixins(ClearMyPositionMixin) {
  get clearTitle(): string {
    if (this.isClearEnd) {
      return this.$t('perpetualSettle.myMargin').toString()
    }
    return this.$t('perpetualSettle.myPosition').toString()
  }
}
</script>

<style lang="scss" scoped>
.settle-my-position {
  .sub-value {
    color: var(--mc-text-color);
  }

  .text-white-color {
    color: var(--mc-text-color-white);
  }

  .justify-text-item {
    display: flex;
    justify-content: space-between;
  }

  .text-item {
    color: var(--mc-text-color);
    font-size: 14px;
    line-height: 20px;
    &:not(:first-of-type) {
      margin-top: 12px;
    }
  }

  .content-container {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    .long-color {
      color: var(--mc-color-blue) !important;
    }

    .short-color {
      color: var(--mc-color-orange) !important;
    }

    .text-value {
      color: var(--mc-text-color-white);
    }

    .clearing-box {
      width: 368px;

      .clearing-content {
        line-height: 28px;
      }
    }

    .position-box {
      width: 368px;

      .info-panel {
        .info-content {
          text-align: center;

          .amount {
            font-size: 40px;
            line-height: 48px;
            color: var(--mc-text-color-white);
          }

          .unit {
            margin-top: 4px;
            font-size: 14px;
            line-height: 16px;
            color: var(--mc-text-color-white);
          }
        }
      }

      .footer-button {
        margin-top: 24px;
        text-align: center;
        width: 100%;

        ::v-deep .el-button--medium {
          width: 250px;
        }
      }
    }
  }
}
</style>
