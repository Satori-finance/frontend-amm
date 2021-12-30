<template>
  <div>
    <el-dialog
      append-to-body
      top="0"
      custom-class="mini-round-dialog"
      class="share-position-dialog"
      :close-on-click-modal="false"
      :visible.sync="currentVisible"
      :show-close="false"
    >
      <div class="svg-container">
        <div class="share-info" ref="shareInfo">
          <img class="logo" src="@/assets/img/share-logo.png" alt="">
          <div class="title">
            <template v-if="positionInfo && positionInfo.roe.gt(0)">
              {{ $t('shareDialog.title') }}
            </template>
            <template v-else>Oops...</template>
          </div>
          <img v-if="positionInfo && positionInfo.roe.gt(0)" class="status" src="@/assets/img/profit.svg" alt="">
          <img v-else class="status" src="@/assets/img/deficit.svg" alt="">
          <div class="position">
            <span class="side" :class="getSideClass(positionInfo)">
              <span class="short">{{ $t('base.short') }}</span>
              <span class="long">{{ $t('base.long') }}</span>
            </span>
            <span class="leverage">
              <template v-if="positionInfo">
                {{ positionInfo.targetLeverage | bigNumberFormatter(0) }}x
              </template>
              <template v-else>?</template>
            </span>
            <div class="line"></div>
            <span class="perpetual">
              <template v-if="positionInfo">
                {{ positionInfo.symbolStr }} {{ positionInfo.name }} {{ $t('base.perpetual') }}
                <span class="inverse-card" v-if="positionInfo.isInverse">{{ $t('base.inverse') }}</span>
              </template>
              <template v-else>?</template>
            </span>
          </div>
          <div class="pnl">
            <template v-if="positionInfo && positionInfo.roe">
              <PNNumber :number="positionInfo.roe.abs().times(100)" :decimals="1" suffix="%"
                        :show-changed-color="false"
                        :prefix="positionInfo.roe.gt(0) ? '+ ' : '- '" :roundingMode="BigNumber.ROUND_UP"
                        :class="{orange: !positionInfo.roe.gt(0)}"/>
            </template>
            <template v-else>?</template>
          </div>
          <div class="price">
            <div class="price-info">
              <div class="label">{{ $t('tableTitle.entryPrice') }}</div>
              <div class="value">
                <template v-if="positionInfo">
                  {{ positionInfo.entryPrice | bigNumberFormatter(positionInfo.priceFormatDecimals) }}
                </template>
                <template v-else>?</template>
              </div>
            </div>
            <div class="price-info">
              <div class="label">{{ $t('tableTitle.currentPrice') }}</div>
              <div class="value">
                <template v-if="positionInfo">
                  {{ positionInfo.markPrice | bigNumberFormatter(positionInfo.priceFormatDecimals) }}
                </template>
                <template v-else>?</template>
              </div>
            </div>
          </div>
          <div class="qrcode-box">
            <div class="qrcode">
              <img src="@/assets/img/home-qrcode.png" alt="">
            </div>
            <div class="info">
              <div class="mcdex">mcdex.io</div>
              <div class="time">{{ Date.now() | datetimeFormatter('MM-DD-YYYY hh:mmA') }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="bottom">
        <el-button @click="download" size="medium">{{ $t('shareDialog.saveImage') }}</el-button>
        <el-button @click="shareTwitter" size="medium" class="share-btn">{{ $t('base.share') }} <i
          class="iconfont icon-twitter"></i></el-button>
      </div>
      <div class="close-btn" @click="currentVisible = false">
        <i class="el-icon-close"></i>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator'
import BigNumber from 'bignumber.js'
import { isLongPosition } from '@/utils'
import { PNNumber } from '@/components'

interface PositionInfo {
  symbol: number
  symbolStr: string
  name: string
  isInverse: boolean
  perpetualID: string
  size: BigNumber
  positionValue: BigNumber
  margin: BigNumber
  liquidationPrice: BigNumber
  roe: BigNumber
  pnl: BigNumber
  fundingRevenue: BigNumber
  markPrice: BigNumber
  entryPrice: BigNumber
  underlyingSymbol: string
  underlyingFormatDecimals: number
  collateralSymbol: string
  contractSymbol: string
  priceSymbol: string
  priceFormatDecimals: number
  collateralFormatDecimals: number
  isEmergency: boolean
  isCleared: boolean
  isMarketClose: boolean
  marginRatio: BigNumber
  targetLeverage: BigNumber
  isMarginSafe: boolean
  selectedPerpetualAmmIsSafe: boolean
  selectedPerpetualOracleIsTerminated: boolean
}

@Component({
  components: {
    PNNumber,
  },
})
export default class ShareDialog extends Vue {
  @Prop({ default: false }) visible!: boolean
  @Prop({ default: null }) positionInfo!: PositionInfo | null

  @Ref('shareInfo') shareInfo!: HTMLElement

  BigNumber = BigNumber

  get currentVisible() {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
  }

  getSideClass(item: any) {
    if (!item) {
      return []
    }
    return isLongPosition(item.size, item.isInverse) ? ['is-long'] : ['is-short']
  }

  download() {
    const { saveAsPng } = require('save-html-as-image')
    saveAsPng(this.shareInfo, { filename: `share-${this.positionInfo?.symbolStr}`, printDate: true }, { quality: 1 })
  }

  shareTwitter() {
    if (!this.positionInfo) {
      return
    }
    const text = this.$t(this.positionInfo.roe.gt(0) ? 'shareDialog.profitText' : 'shareDialog.deficitText', {
      rate: this.positionInfo.roe.times(100).toFormat(1),
      perpetual: this.positionInfo.name,
    }).toString()
    const params = `original_referer=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(text)}&url=${encodeURIComponent('http://satori.finance/')}`
    window.open(`https://twitter.com/intent/tweet?${params}`, '_blank')
  }
}
</script>

<style lang="scss" scoped>
.share-position-dialog {
  ::v-deep {
    .el-dialog {
      padding: 0;
      width: 400px;
      overflow: hidden;
      border-radius: var(--mc-border-radius-l);
      background: var(--mc-background-color-darkest);

      .el-dialog__header {
        display: none;
      }

      .el-dialog__body {
        overflow: hidden;
      }
    }
  }

  .svg-container {
    overflow: hidden;
    margin: -1px -1px auto -1px;
  }

  .share-info {
    padding: 16px 16px 32px;
    font-size: 14px;
    line-height: 20px;
    background: var(--mc-background-color-dark);
    border-radius: var(--mc-border-radius-l);
    border: 1px solid var(--mc-border-color);

    .logo {
      height: 16px;
      width: 81px;
    }

    .title {
      margin-top: 16px;
      text-align: center;
    }

    .status {
      margin: 8px auto auto;
      height: 130px;
      width: 160px;
      display: block;
    }

    .position {
      display: flex;
      align-items: center;
      margin-top: 24px;
      padding: 0 16px;

      .side {
        margin-right: 4px;

        .long,
        .short {
          display: none;
        }

        &.is-long .long {
          display: inline;
        }

        &.is-short .short {
          display: inline;
        }

        &.is-short {
          color: var(--mc-color-orange);
        }

        &.is-long {
          color: var(--mc-color-blue);
        }
      }

      .line {
        width: 1px;
        height: 14px;
        background: var(--mc-border-color);
        margin: 0 15px;
      }

      .inverse-card {
        display: inline-flex;
        background: rgb(217, 128, 65, 0.1);
        border: 1px solid rgb(217, 128, 65, 0.1);
        margin-left: 4px;
      }
    }

    .pnl {
      padding: 0 16px;
      margin-top: 8px;
      font-size: 48px;
      line-height: 58px;
      font-weight: bold;
      color: var(--mc-color-blue);

      .orange {
        color: var(--mc-color-orange);
      }
    }

    .price {
      margin-top: 8px;
      padding: 0 16px;

      .price-info {
        display: inline-block;

        .label {
          color: var(--mc-text-color);
          margin-bottom: 4px;
        }

        .value {
          color: var(--mc-text-color-white);
        }

        &:first-of-type {
          margin-right: 32px;
        }
      }
    }

    .qrcode-box {
      padding: 0 16px;
      margin-top: 32px;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      text-align: right;

      .qrcode {
        height: 64px;
        width: 64px;
        background: white;
        padding: 4px;

        img {
          height: 56px;
          width: 56px;
        }
      }

      .info {
        .mcdex {
          color: var(--mc-text-color-white);
        }

        .time {
          margin-top: 4px;
          color: var(--mc-text-color);
          font-size: 12px;
          line-height: 16px;
        }
      }
    }
  }

  .bottom {
    width: calc(100% - 1px);
    margin-left: 1px;
    padding: 24px 32px;
    display: flex;
    justify-content: space-between;

    .el-button {
      border-radius: var(--mc-border-radius-m);
      height: 32px;

      &.share-btn {
        background: var(--mc-background-color);
      }
    }
  }

  .close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    font-size: 22px;
    opacity: 0.8;
    cursor: pointer;

    &:hover {
      opacity: 1;
    }
  }
}
</style>

