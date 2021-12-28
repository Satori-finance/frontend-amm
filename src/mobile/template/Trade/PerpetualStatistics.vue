<template>
  <div class="perpetual-statistics">
    <div class="switch-perpetual" @click="switchPerpetual">
      <i class="iconfont icon-left2-back" @click.stop="goBack"></i>
      <div class="split-line"></div>
      <i class="iconfont icon-h-switch" @click="switchPerpetual"></i>

      <div class="name-box">
        <McMTokenPairView :collateral-address="perpetualCollateralTokenSymbol"
                          :underlying-symbol="perpetualUnderlyingSymbol" />
        <div class="name">
          <div class="line-1">{{ selectedPerpetualName }}</div>
          <div class="line-2">
            {{ selectedPerpetualSymbol | perpetualSymbolFormatter }}
            <span class="inverse-card" v-if="selectedPerpetualIsInverse">{{ $t('base.inverse') }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="statistics-detail-container">
      <div class="detail-item">
        <div class="left">
          <div class="large-item">
            <NumberArrow
              v-if="selectedPerpetualIndexPrice"
              :number="selectedPerpetualIndexPrice"
              :inverse="selectedPerpetualIsInverse"
              :decimals="priceFormatDecimals"
            />
            <span v-else>--</span>
          </div>
        </div>
        <div class="right">
          <div class="line-info-item">
            <div class="label">
              <McMTooltip :content="$t('status.fundingRatePrompt')">
                <div>{{ $t('status.fundingRate') }}</div>
              </McMTooltip>
            </div>
            <div class="value">
              <PNNumber
                v-if="displayFundingRate"
                :number="displayFundingRate"
                :showPlusSign="true"
                :decimals="4"
                suffix="%"
              />
              <span v-else>--</span>
            </div>
          </div>
          <div class="line-info-item">
            <div class="label">
              <McMTooltip :content="$t('statisticsBar.accumulatedFundingRatePrompt')">
                <div>{{ $t('statisticsBar.accFundingRate') }}</div>
              </McMTooltip>
            </div>
            <div class="value">
              <PNNumber
                v-if="displayAverageFundingRate"
                :number="displayAverageFundingRate"
                :showPlusSign="true"
                :decimals="4"
                suffix="%"
              />
              <span v-else>--</span>
            </div>
          </div>
        </div>
      </div>
      <div class="detail-item">
        <div class="left">
          <div class="sub-large-item">
            <div class="line-info-item">
              <div class="label">
                <McMTooltip :content="$t('status.indexPricePrompt')">
                  <div>{{ $t('status.markPrice') }}</div>
                </McMTooltip>
              </div>
              <div class="value">
                <NumberArrow
                  v-if="selectedPerpetualMarkPrice"
                  :number="selectedPerpetualMarkPrice"
                  :inverse="selectedPerpetualIsInverse"
                  :decimals="priceFormatDecimals"
                />
                <span v-else>--</span>
              </div>
            </div>
            <div class="line-info-item">
              <div class="label">
                <McMTooltip :content="$t('status.indexChange24HPrompt')">
                  <div>{{ $t('status.indexChange24H') }}</div>
                </McMTooltip>
              </div>
              <div class="value">
              <span v-if="indexChange24HRate && selectedPerpetualIndexPrice">
                <span class="index-change-24h" :class="{negated: indexChange24H.lt(0), positive: indexChange24H.gt(0)}">
                  <PNNumber
                    :number="indexChange24H"
                    :showPlusSign="true"
                    :decimals="priceFormatDecimals"
                  />
                  </span>
              (<PNNumber
                :number="indexChange24HRate"
                :showPlusSign="true"
                :decimals="2"
                suffix="%"
              />)
              </span>
                <span v-else>--</span>
              </div>
            </div>
          </div>
        </div>
        <div class="right">
          <div class="line-info-item">
            <div class="label">
              <McMTooltip :content="$t('contractInfo.openInterestPrompt')">
                <div>{{ $t('contractInfo.openInterest') }}</div>
              </McMTooltip>
            </div>
            <div class="value">
              <PNNumber
                v-if="openInterest"
                :number="openInterest"
                :showPlusSign="false"
                :show-changed-color="false"
                :decimals="underlyingDecimals"
              />
              <span v-else>--</span>
            </div>
          </div>
          <div class="line-info-item">
            <div class="label">
              <McMTooltip :content="$t('hintInfos.statisticsBar.Volume24h')">
                <div>{{ $t('statisticsBar.amountIn24Hours') }}</div>
              </McMTooltip>
            </div>
            <div class="value">
              <PNNumber
                v-if="tradeVolumeIn24H"
                :number="tradeVolumeIn24H"
                :showPlusSign="false"
                :show-changed-color="false"
                :decimals="volumeDecimals"
              />
              <span v-else>--</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import PerpetualStatisticsMixin from '@/template/components/Trade/perpetualStatisticsMixin'
import { NumberArrow, PNNumber } from '@/components'
import { McMTooltip, McMTokenPairView } from '@/mobile/components'
import { VUE_EVENT_BUS } from '@/event'
import { COMMON_EVENT } from '@/mobile/event'

@Component({
  components: {
    PNNumber,
    NumberArrow,
    McMTooltip,
    McMTokenPairView,
  },
})
export default class PerpetualStatistics extends Mixins(PerpetualStatisticsMixin) {

  private switchPerpetual() {
    VUE_EVENT_BUS.emit(COMMON_EVENT.SHOW_SELECT_PERPETUAL_POPUP)
  }

  private goBack() {
    this.$router.back()
  }

}
</script>

<style scoped lang="scss">
@import "~@mcdex/style/common/var";

.perpetual-statistics {
  .switch-perpetual {
    display: flex;
    align-items: center;
    height: 60px;
    margin-bottom: 8px;

    .split-line {
      margin: 0 16px;
      height: 20px;
      width: 1px;
      background: var(--mc-border-color);
    }

    .icon-left,.icon-h-switch {
      font-size: 20px;
      margin-right: 16px;
    }

    .name-box {
      display: flex;
      align-items: center;

      .name {
        margin-left: 8px;
        font-size: 14px;
        line-height: 22px;
        .line-2 {
          color: var(--mc-text-color);
        }
      }
    }
  }

  .statistics-detail-container {
    width: 100%;

    .detail-item {
      display: flex;
      align-items: center;
      width: 100%;
      margin-top: 8px;

      :first-of-type {
        margin-top: 0;
      }
    }

    .left {
      width: 55%;

      .large-item {
        font-size: 26px;
        font-weight: 700;
        line-height: 24px;

        ::v-deep {
          .iconfont {
            font-size: 18px !important;
          }
        }
      }

      .sub-large-item {
        font-size: 16px;
        font-weight: 400;
        display: flex;

        .line-info-item {
          margin-right: 16px;

          &:last-child {
            margin-right: 0;
          }

          .label {
            font-size: 10px !important;
            color: var(--mc-text-color);
            white-space: nowrap;
          }

          .value {
            font-size: 10px;
            margin-top: 5px;

            ::v-deep i {
              font-size: 10px;
            }
          }

          .index-change-24h {
            color: var(--mc-text-color-white);

            &.negated {
              color: var(--mc-color-orange);
            }

            &.positive {
              color: var(--mc-color-blue);
            }
          }
        }
      }
    }

    .right {
      display: flex;
      align-items: center;
      width: 45%;

      .line-info-item {
        width: 50%;

        .label {
          font-size: 10px !important;
          color: var(--mc-text-color);
          white-space: nowrap;
        }

        .value {
          font-size: 10px;
          margin-top: 5px;
        }
      }
    }
  }
}
</style>
