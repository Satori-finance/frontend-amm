<template>
  <div class="statistics">
    <div class="left-container">
      <div class="statistic-item">
        <MarketSelect :perpetualID="selectedPerpetualID"/>
      </div>

      <el-divider direction="vertical"></el-divider>

      <el-button class="btn" type="secondary" size="small" plain @click="toInfo" :disabled="!selectedPerpetual">
        <span class='text'>{{ $t('info') }}</span>
      </el-button>

      <el-divider direction="vertical"></el-divider>

      <div v-if="selectedPerpetualMarkPrice" class="mark-price">
        <template v-if="selectedPerpetualIsSettle">
          <span class="no-value">--</span>
        </template>
        <el-tooltip v-else :content="$t('status.markPrice')" placement="top" :open-delay="400">
          <NumberArrow
            :number="selectedPerpetualMarkPrice"
            :inverse="selectedPerpetualIsInverse"
            :decimals="priceFormatDecimals"
          />
        </el-tooltip>
      </div>

      <el-divider direction="vertical"></el-divider>

      <div class="restrict-container">
        <div class="statistic-item">
          <el-tooltip :content="$t('status.indexPricePrompt')" placement="top" :open-delay="400">
            <span class="label tip-text">{{ $t('status.indexPrice') }}</span>
          </el-tooltip>
          <div class="value">
            <template v-if="selectedPerpetualIsSettle">
              <span class="no-value">--</span>
            </template>
            <template v-else>
              <NumberArrow
                v-if="selectedPerpetualIndexPrice"
                :number="selectedPerpetualIndexPrice"
                :inverse="selectedPerpetualIsInverse"
                :decimals="priceFormatDecimals"
              />
            </template>
          </div>
        </div>

        <el-divider direction="vertical"></el-divider>

        <div class="statistic-item">
          <el-tooltip :content="$t('status.indexChange24HPrompt')" placement="top" :open-delay="400">
            <span class="label tip-text">{{ $t('status.indexChange24H') }}</span>
          </el-tooltip>
          <div class="value">
            <template v-if="selectedPerpetualIsSettle || !indexChange24H">
              <span class="no-value">--</span>
            </template>
            <template v-else>
            <span class="index-change-24h" :class="{negated: indexChange24H.lt(0), positive: indexChange24H.gt(0)}">{{
                indexChange24H | bigNumberFormatter(priceFormatDecimals)
              }}</span>
              <span class="change-rate">(
              <PNNumber
                v-if="indexChange24HRate && selectedPerpetualIndexPrice"
                :number="indexChange24HRate"
                :showPlusSign="true"
                :decimals="2"
                suffix="%"
              />)
            </span>
            </template>
          </div>
        </div>

        <el-divider direction="vertical"></el-divider>

        <div class="statistic-item funding">
          <el-tooltip :content="$t('status.fundingRatePrompt')" placement="top" :open-delay="400">
            <span class="label tip-text">{{ $t('status.fundingRate') }}</span>
          </el-tooltip>
          <div class="value">
            <template v-if="selectedPerpetualIsSettle">
              <span class="no-value">--</span>
            </template>
            <PNNumber
              v-else-if="displayFundingRate"
              :number="displayFundingRate"
              :showPlusSign="true"
              :decimals="4"
              suffix="%"
            />
          </div>
        </div>

        <el-divider direction="vertical"></el-divider>

        <div class="statistic-item funding average-funding">
          <el-tooltip :content="averageFundingRatePrompt" placement="top" :open-delay="400">
            <span class="label tip-text">{{ $t('statisticsBar.accFundingRate') }}</span>
          </el-tooltip>
          <div class="value">
            <template v-if="selectedPerpetualIsSettle">
              <span class="no-value">--</span>
            </template>
            <PNNumber
              v-else-if="displayAverageFundingRate"
              :number="displayAverageFundingRate"
              :showPlusSign="true"
              :decimals="4"
              suffix="%"
            />
          </div>
        </div>

        <el-divider direction="vertical"></el-divider>

        <div class="statistic-item">
          <el-tooltip :content="$t('contractInfo.openInterestPrompt')" placement="top" :open-delay="400">
            <span class="label tip-text"> {{ $t('contractInfo.openInterest') }}</span>
          </el-tooltip>
          <div class="value">
            <template v-if="selectedPerpetualIsSettle">
              <span class="no-value">--</span>
            </template>
            <template v-else>
              <PNNumber
                v-if="openInterest"
                :number="openInterest"
                :showPlusSign="false"
                :show-changed-color="false"
                :decimals="underlyingDecimals"
              />
              <span class="symbol">{{ underlyingSymbol }}</span>
            </template>
          </div>
        </div>

        <el-divider direction="vertical"></el-divider>

        <div class="statistic-item">
          <el-tooltip :content="$t('hintInfos.statisticsBar.Volume24h')" placement="top" :open-delay="400">
            <span class="label tip-text"> {{ $t('statisticsBar.amountIn24Hours') }}</span>
          </el-tooltip>
          <div class="value">
            <template v-if="selectedPerpetualIsSettle">
              <span class="no-value">--</span>
            </template>
            <template v-else>
              <PNNumber
                v-if="tradeVolumeIn24H"
                :number="tradeVolumeIn24H"
                :showPlusSign="false"
                :show-changed-color="false"
                :decimals="volumeDecimals"
              />
              <span class="symbol">{{ collateralSymbol }}</span>
            </template>
          </div>
        </div>
      </div>
    </div>
    <div class="right-container">
      <GasFeeRebateHeader v-if="isBscChain || isArbTestnet" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { PNNumber, NumberArrow } from '@/components'
import { MarketSelect } from '@/business-components'
import { namespace } from 'vuex-class'
import PerpetualStatisticsMixin from '@/template/components/Trade/perpetualStatisticsMixin'
import GasFeeRebateHeader from './GasFeeRebate/GasFeeRebateHeader.vue'
import BigNumber from 'bignumber.js'
import { _1 } from '@mcdex/mai3.js'
import { currentChainConfig } from '@/config/chain'
import { SUPPORTED_NETWORK_ID } from '@/const'

const perpetual = namespace('perpetual')

@Component({
  components: {
    MarketSelect,
    PNNumber,
    NumberArrow,
    GasFeeRebateHeader,
  },
  filters: {
    inversePrice: (val: BigNumber | null, isInverse: boolean) => {
      return isInverse && val ? _1.div(val) : val
    },
  },
})
export default class PerpetualStatistics extends Mixins(PerpetualStatisticsMixin) {
  private toInfo() {
    if (!this.selectedPerpetual) {
      return
    }
    this.$router.push({
      name: 'poolPerpetualInfo', params: { poolAddress: this.selectedPerpetual.perpetualProperty.liquidityPoolAddress },
    })
  }

  get isBscChain() {
    return currentChainConfig.chainID === SUPPORTED_NETWORK_ID.BSC
  }

  get isArbTestnet() {
    return currentChainConfig.chainID === SUPPORTED_NETWORK_ID.ARB_TESTNET
  }
}
</script>

<style lang="scss" scoped>
@import './statistics.scss';

.left-container {
  display: inline-flex;
  align-items: center;
}

.right-container {
  display: inline-flex;
  align-items: center;
  width: 20%;
}

.restrict-container {
  flex: auto;
  display: flex;
  align-items: center;
}

.funding {
  .value {
    min-width: 7px;
  }

  .countdown {
    margin-left: 16px;
  }
}

.change-rate {
  margin-left: 7px;
}

.index-change-24h {
  display: inline-flex;
  align-items: center;
}

.value {
  height: 16px;
}

.mark-price {
  font-size: 18px;
  line-height: 24px;

  .number-arrow.el-tooltip {
    text-decoration: none !important;
    cursor: help !important;
  }
}

.el-divider {
  margin: 0 16px;
  background-color: #242D43;
  height: 20px;
}

.btn {
  border-radius: var(--mc-border-radius-m);
  width: 80px;
  background-color: rgba(175, 214, 242, 0.1);
  font-size: 12px;

  &:hover {
    background: rgba(175, 214, 242, 0.2);
  }

  .icon-container {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    border-radius: 50%;
    margin-left: 4px;
  }

  .svg-icon {
    width: 10px;
    height: 10px;
    display: inline-block;
  }

  ::v-deep {
    > span {
      display: inline-flex;
      align-items: center;
    }
  }
}
</style>

<style lang="scss" scoped>
@import "~@mcdex/style/element-fantasy/common/var";

.satori-fantasy {
  .btn {
    color: var(--mc-text-color-white);
    background-color: var(--mc-background-color);

    &:hover {
      background-color: var(--mc-background-color-light);
    }

    .text, .svg-icon {
      color: var(--mc-text-color-white);
    }

    .icon-container {
      background-color: rgba($--mc-text-color-white, 0.15);
    }
  }

  .no-value {
    color: var(--mc-text-color);
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
</style>
