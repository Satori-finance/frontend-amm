<template>
  <div class="trade-history">
    <div class="selector">
      <div class="check-box">
        <van-checkbox v-model="showAllMarket" class="mc-mobile__checkbox">
          {{ $t('filters.allMarkets') }}
          <template #icon="props">
            <div class="selected box" v-if="props.checked">
              <i class="iconfont icon-select"></i>
            </div>
            <div class="un-selected box" v-else></div>
          </template>
        </van-checkbox>
      </div>
      <div class="select-box">
        <div>{{ $t('base.time') }}:</div>
        <McMPopupSelector v-model="timeRange" :options="timeRangeOptions"></McMPopupSelector>
      </div>
    </div>

    <van-list v-model="loadingData" @load="loadData" :finished="finished">
      <div v-for="item in tableBody" :key="item.id" class="item">
        <div class="head">
          <div class="left">
            <McMTokenPairView :collateral-address="item.perpetualProperty.collateralTokenSymbol" :collateral-icon-size="20"
                              :underlying-symbol="item.perpetualProperty.underlyingAssetSymbol" :size="36"/>
            <div class="symbol-info">
              <div class="line1">{{ item.perpetualProperty.name }}</div>
              <div class="line2">
                {{ item.perpetualProperty.symbolStr }}
                <span class="inverse-card" v-if="item.perpetualProperty.isInverse">{{$t('base.inverse') }}</span>
              </div>
            </div>
          </div>
          <div class="right">
            <div class="time">{{ item.timestamp | timestampFormatter('lll') }}</div>
            <div class="type">
                <span :class="getSideClass(item).concat(item.isClose ? ['close-item'] : [])">
                  <span class="short">{{ $t('base.short') }} {{ item.perpetualProperty.contractSymbol }}</span>
                  <span class="long">{{ $t('base.long') }} {{ item.perpetualProperty.contractSymbol }}</span>
                </span>
            </div>
          </div>
        </div>
        <div class="infos">
          <van-row>
            <van-col span="9" class="block">
              <div class="data-item">
                <div class="label">{{ $t('base.price') }}</div>
                <div class="value">
                  {{ item.price | priceFormatter(item.perpetualProperty.isInverse) | bigNumberFormatter(item.perpetualProperty.priceFormatDecimals) }}
                </div>
              </div>
            </van-col>
            <van-col span="9" class="block">
              <div class="data-item">
                <div class="label">{{ $t('base.amount') }}({{ item.perpetualProperty.contractSymbol }})</div>
                <div class="value">
                  {{ item.amount.abs() | bigNumberFormatter(item.perpetualProperty.underlyingAssetFormatDecimals) }}
                </div>
              </div>
            </van-col>
            <van-col span="6" class="block">
              <div class="data-item">
                <div class="label">{{ $t('base.volume') }}({{ item.perpetualProperty.collateralTokenSymbol }})</div>
                <div class="value">
                  {{
                    item.amount.abs().times(formatPrice(item.price, item.perpetualProperty.isInverse))
                      | bigNumberFormatter(item.perpetualProperty.priceFormatDecimals)
                  }}
                </div>
              </div>
            </van-col>
          </van-row>
          <van-row>
            <van-col span="9" class="block">
              <div class="data-item">
                <div class="label">
                  {{ $t('base.fee') }} / {{ $t('base.penalty') }} ({{ item.collateralSymbol }})
                </div>
                <div class="value">
                  {{ item.fee | bigNumberFormatter(item.perpetualProperty.collateralFormatDecimals) }}
                </div>
              </div>
            </van-col>
            <van-col span="9" class="block">
              <div class="data-item">
                <div class="label">{{ $t('base.type') }}</div>
                <div class="value">
                  {{ getType(item) }}
                </div>
              </div>
            </van-col>
            <van-col span="6" class="block">
              <div class="data-item">
                <div class="label">{{ $t('base.pnl') }}({{ item.perpetualProperty.collateralTokenSymbol }})</div>
                <div class="value flex-box">
                  <PNNumber
                    v-if="item.isClose"
                    :number="item.pnl"
                    :decimals="item.perpetualProperty.collateralFormatDecimals"
                    show-plus-sign
                  />
                  <span class="text" v-else>--</span>
                  <a :href="item.transactionHash | etherBrowserTxFormatter">
                    <i class="iconfont icon-view"></i>
                  </a>
                </div>
              </div>
            </van-col>
          </van-row>
        </div>
      </div>

      <template slot="loading">
        <img class="fantasy-loading" src="@/assets/img/satori-fantasy/loading.svg" alt="">
      </template>

      <template slot="finished">
        <div v-if="noData" class="empty-container">
          <McMNoData />
        </div>
        <span v-else>{{ $t('base.noMore') }}</span>
      </template>
    </van-list>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import { McMNoData, McMPopupSelector, McMTokenPairView } from '@/mobile/components'
import { PNNumber } from '@/components'
import TradeHistoryMixin from '@/template/components/TradeHistory/tradeHistoryMixin'
import moment from 'moment'
import { namespace } from 'vuex-class'

const activePerpetuals = namespace('activePerpetuals')
@Component({
  components: {
    McMNoData,
    PNNumber,
    McMTokenPairView,
    McMPopupSelector
  },
})
export default class TradeHistory extends Mixins(TradeHistoryMixin) {

  @activePerpetuals.State('selectedPerpetualID') selectedPerpetualID!: string | null

  private loadingData = false
  private showAllMarket = true
  private timeRange = '1d'

  get timeRangeOptions() {
    return [
      { value: '1d', label: this.$t('timeRange.1d').toString() },
      { value: '1w', label: this.$t('timeRange.1w').toString() },
      { value: '1M', label: this.$t('timeRange.1m').toString() },
      { value: '3M', label: this.$t('timeRange.3m').toString() },
    ]
  }

  get finished() {
    return this.noMore || !this.address
  }

  async loadData() {
    await this.debounceLoad()
    this.loadingData = false
  }

  @Watch('selectedPerpetualID')
  @Watch('showAllMarket')
  handlerFilterContract() {
    if (!this.showAllMarket) {
      this.filters.contract = this.selectedPerpetualID || ''
    } else {
      this.filters.contract = ''
    }
  }

  @Watch('timeRange', { immediate: true })
  private onTimeRangeChange() {
    const now = moment.utc()
    let start = null
    switch (this.timeRange) {
      case '1d':
        start = now.subtract(1, 'd')
        break
      case '1w':
        start = now.subtract(1, 'w')
        break
      case '1M':
        start = now.subtract(1, 'M')
        break
      case '3M':
        start = now.subtract(3, 'M')
        break
    }
    this.filters.startDate = now.toDate()
  }
}
</script>

<style lang="scss" scoped>
.trade-history {

  .selector {
    display: flex;
    align-items: center;
    padding: 10px 16px;
    border-bottom: 1px solid #1A2136;

    .check-box {
      ::v-deep .van-checkbox__label {
        font-size: 14px;
        line-height: 20px;
      }
    }

    .select-box {
      display: flex;
      align-items: center;
      font-size: 14px;
      line-height: 20px;
      color: var(--mc-text-color);
      margin-left: 32px;
    }

    ::v-deep .mc-mobile-select {
      width: auto;

      .selector {
        background: transparent;
        width: auto;
        height: 20px;
        padding: 0;

        .left-value {
          color: var(--mc-text-color);
          font-size: 14px;
          line-height: 20px;
        }

        .icon-drop-down {
          font-size: 12px;
          margin-left: 6.5px;
        }
      }
    }
  }

  ::v-deep .van-list {
    height: calc(100vh - 166px);
    overflow: scroll;
    padding: 0 16px;

    .van-list__finished-text {
      line-height: 20px;
      margin-top: 16px;
      color: var(--mc-text-color);
    }
  }

  .item {
    padding: 16px 0;
    border-bottom: 1px solid #1A2136;

    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .left {
        display: flex;
        align-items: center;

        .symbol-info {
          margin-left: 8px;
          font-size: 12px;

          .line1 {
            color: var(--mc-text-color-white);
            line-height: 22px;
          }

          .line2 {
            color: var(--mc-text-color);
            line-height: 22px;
          }
        }
      }

      .right {
        text-align: right;

        .time {
          font-size: 12px;
          line-height: 22px;
          color: var(--mc-text-color);
        }

        .type {
          font-size: 12px;
          line-height: 22px;

          .is-long {
            color: var(--mc-color-blue);

            .long {
              display: inline-block;
            }
          }

          .is-short {
            color: var(--mc-color-orange);

            .short {
              display: inline-block;
            }
          }

          .short,
          .long {
            display: none;
          }

          .close-item {
            .long,
            .short {
              text-decoration-line: line-through;
            }
          }
        }
      }
    }

    .infos {
      margin-top: 12px;

      .van-row {
        margin-bottom: 12px;

        .block:nth-child(3) {
          text-align: right;
        }

        &:last-child {
          margin-bottom: 0;
        }
      }

      .data-item {
        font-size: 12px;
        line-height: 16px;
        display: inline-block;

        &:not(:last-of-type) {
          margin-bottom: 8px;
        }

        .label {
          color: var(--mc-text-color);
          margin-bottom: 4px;
        }

        .value {
          &.flex-box {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            height: 16px;
          }

          .text {
            margin-right: 4px;
            color: var(--mc-text-color);
          }

          .icon-view {
            font-size: 16px;
            color: var(--mc-text-color);
            margin-left: 4px;
          }
        }
      }
    }
  }

  .fantasy-loading {
    display: inline-block;
    animation: 2s linear infinite svg-animation;
    max-width: 100px;
  }

  @keyframes svg-animation {
    0% {
      transform: rotateZ(0deg);
    }
    100% {
      transform: rotateZ(360deg);
    }
  }

  .empty-container {
    padding: 30vh 0;
  }
}
</style>
