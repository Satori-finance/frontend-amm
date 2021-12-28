<template>
  <van-popup class='perpetual-risk-notice safe-area-inset-bottom'
             v-model='currentVisible'
             position="bottom"
             round
             safe-area-inset-bottom>
    <McLoading :show-loading='loading'>
      <div class="head-title">
        <img class="warn-svg" src="@/assets/img/Warning.svg" alt=''>
        <div>{{ $t('perpetualRiskNotice.riskNotice') }}</div>
      </div>
      <div class='container'>
        <div class='warn-text'>{{ $t('perpetualRiskNotice.riskNoticeText') }}</div>

        <div class='info'>
          <div class="title">{{ symbol }} {{ $t('perpetualRiskNotice.perpetualContract',{ name: name }) }}</div>
          <div class="underlying">
            <span class="sub-title">{{ $t('base.underlyingAssets') }}</span>
            <div class="value">
              <McMTokenImageView :token="underlyingAsset" :size="24"/>
              <div class="name">{{ underlyingAsset }}</div>
            </div>
          </div>
          <div class="collateral">
            <span class='sub-title'>{{ $t('base.collateral') }}</span>
            <span class="value">
              <McMTokenImageView :token="collateralAddress" :size="24"/>
              <span class='name'>{{ collateral }}</span>
              <a class='address' :href="collateralAddress | etherBrowserAddressFormatter">
                {{ collateralAddress | ellipsisMiddle }}
              </a>
              <span class="tip-text-item icon-item copy-icon copy" @click="copyCollateralAddress">
                <a><i class="iconfont icon-copy1"></i></a>
              </span>
            </span>
          </div>
          <div class="oracle">
            <span class='sub-title'>{{ $t('base.oracle') }}</span>
            <div class="oracle-flex-box">
              <img v-if="oracleType === 'uniswapv3' && uniswapV3RouterPath" class="oracle-img"
                   src="@/assets/img/uniswap.png" alt="">
              <img v-else class="oracle-img"
                   src="@/assets/img/tokens/Unknow.svg" alt="">
              <span class='oracle-name' v-if="(oracleType === 'whitelist' || oracleType === 'oracleRouter') && oracleDetail && oracleDetail.oracles">
                <span class="route-item" v-for="(item, index) in oracleDetail.oracles" :key="index">
                  <span>{{ getOracleTypeName(item) }}</span>
                  <span>
                    {{ item.oracle.underlyingAsset }}-{{ item.oracle.collateral }}
                  </span>
                  <span v-if="isWithFineTuner(item)" class="fine-tuner">
                    {{ getOracleTypeName(item) === 'SATORI' ? $t('base.chainlinkWithFineTuner') : $t('base.withFineTuner') }}
                  </span>
                  <span class="oracle-item-split oracle-arrow" v-if="index < (oracleDetail.oracles.length - 1)">
                    <i class="iconfont icon-arrow-up"></i>
                  </span>
                </span>
              </span>
              <span class='oracle-name' v-if="oracleType === 'uniswapv3' && uniswapV3RouterPath">
                <span>Uniswap</span>&nbsp;
                <span v-for="(item, index) in uniswapV3RouterPath.symbols" :key="index">
                  <span>{{ item }}</span>
                  <span class="oracle-item-split" v-if="index < (uniswapV3RouterPath.symbols.length - 1)">
                    <i class="iconfont icon-arrow-up"></i>
                  </span>
                </span>
              </span>
              <span class='oracle-name' v-if="oracleType === 'custom' && oracleDetail && oracleDetail.oracles">
                <span v-for="(item, index) in oracleDetail.oracles" :key="index">
                  <span>
                    {{ item.oracle.underlyingAsset }}-{{ item.oracle.collateral }}
                  </span>
                  <span v-if="isWithFineTuner(item)" class="fine-tuner">
                    {{ getOracleTypeName(item) === 'SATORI' ? $t('base.chainlinkWithFineTuner') : $t('base.withFineTuner') }}
                  </span>
                  <span class="oracle-item-split oracle-arrow" v-if="index < (oracleDetail.oracles.length - 1)"> → </span>
                </span>
              </span>

              <div class="address-box">
                <a class='address' :href="oracleAddress | etherBrowserAddressFormatter">
                  {{ oracleAddress | ellipsisMiddle }}
                </a>
                <span class="tip-text-item icon-item copy-icon copy" @click="copyOracleAddress">
                  <a><i class="iconfont icon-copy1"></i></a>
                </span>
              </div>
              <div class="warn-box">
                <span class='warn' v-if='this.isOracleUnregistered'>
                  <i class="iconfont icon-warning-triangle"></i>
                  <span class='unknown-text'>
                    {{ $t('perpetualRiskNotice.unknownOracle') }}
                  </span>
                </span>
              </div>
            </div>
          </div>

        </div>

        <div class='dont-show'>
          <van-checkbox v-model="isCheckKnow" class="mc-mobile__checkbox">
            {{ $t('orderConfirmDialog.donShow') }}
            <template #icon="props">
              <div class="selected box" v-if="props.checked">
                <i class="iconfont icon-select"></i>
              </div>
              <div class="un-selected box" v-else></div>
            </template>
          </van-checkbox>
        </div>

        <div class='confirm-btn'>
          <van-button class="round" size="large" @click='confirmEvent'>
            {{ $t('base.confirm') }}
          </van-button>
        </div>
      </div>
    </McLoading>
  </van-popup>
</template>

<script lang='ts'>
import { Component, Mixins, Watch } from 'vue-property-decorator'
import PerpetualRiskNoticeMixin from '../../business-components/PerpetualRiskNotice/PerpetualRiskNoticeMixin'
import McLoading from '@/components/McLoading.vue'
import { copyToClipboard, setLocalStorage } from '@/utils'
import { RISK_NOTICE_POP_UP } from '@/constants'
import { McMTokenImageView } from '@/mobile/components'

@Component({
  components: {
    McLoading,
    McMTokenImageView,
  },
})
export default class PerpetualRiskNotice extends Mixins(PerpetualRiskNoticeMixin) {

  init() {
    this.active = true
  }

  confirmEvent() {
    if (this.isCheckKnow) {
      setLocalStorage(`${RISK_NOTICE_POP_UP}-${this.symbol}-${this.address}`, true)
    }
    this.isCheckKnow = false
    this.currentVisible = false
    this.$emit('close')
  }

  copyCollateralAddress() {
    if (!this.collateralAddress) {
      return
    }
    copyToClipboard(this.collateralAddress)
    this.$toast(this.$t('base.copySuccess').toString())
  }

  copyOracleAddress() {
    if (!this.oracleAddress) {
      return
    }
    copyToClipboard(this.oracleAddress)
    this.$toast(this.$t('base.copySuccess').toString())
  }

  @Watch('currentVisible', { immediate: true })
  @Watch('provider')
  async onOracle() {
    if (!this.currentVisible) {
      return
    }
    await this.loadOracleBaseInfo()
  }
}
</script>

<style scoped lang='scss'>
@import '~@mcdex/style/common/fantasy-var';

.perpetual-risk-notice {
  padding: 16px;

  .head-title {
    font-size: 18px;
    line-height: 24px;
    display: flex;
    align-items: center;

    .warn-svg {
      width: 24px;
      height: 24px;
      margin-right: 8px;
    }
  }

  .container {
    margin-top: 28px;

    .warn-text {
      font-size: 14px;
      line-height: 20px;
      word-break: break-word;
    }

    .info {
      border-radius: 12px;
      padding: 16px;
      margin-top: 8px;
      background: var(--mc-background-color-darkest);

      .title {
        font-size: 16px;
        line-height: 24px;
        padding: 0;
      }

      .sub-title {
        display: block;
        font-size: 14px;
        line-height: 20px;
        padding-bottom: 4px;
        color: var(--mc-text-color);
      }

      .underlying {
        margin-top: 12px;
      }

      .collateral {
        margin-top: 16px;
      }

      .oracle {
        white-space: normal;
        word-break: break-word;
        margin-top: 16px;

        .oracle-flex-box {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          line-height: 24px;

          .oracle-img {
            margin-right: 8px;
            line-height: 1;
            width: 24px;
            height: 24px;
          }

          .oracle-name{
            padding-right: 8px;

            span {
              line-height: 24px;
              font-size: 16px;
            }

            .route-item{
              display: inline-flex;
              align-items: center;

              > span {
                margin-right: 4px;
                &:last-of-type {
                  margin-right: 0;
                }
              }
            }

            .fine-tuner {
              display: inline-block;
              font-size: 12px;
              line-height: 16px;
              color: var(--mc-color-primary);
              background-color: rgba($--mc-color-primary, 0.1);
              padding: 2px 8px;
              border-radius: var(--mc-border-radius-m);
              border: 1px solid rgba($--mc-color-primary, 0.1);
            }

            .oracle-item-split {
              margin: 0 8px;
              font-size: 16px;

              i {
                transform: rotate(0.25turn);
                display: inline-block
              }
            }

            .oracle-arrow {
              font-size: 19px;
            }
          }

          .address-box {
            display: flex;
            align-items: center;
            margin-right: 4px;
          }
        }
      }

      .warn-box {
        padding: 4px 0;

        .warn {
          border-radius: 8px;
          padding: 3px 8px;
          display: flex;
          align-items: center;
          line-height: 1;
          background: rgba($--mc-color-warning, 0.1);
          border: 1px solid rgba($--mc-color-warning, 0.1);

          i {
            font-size: 16px;
            height: 16px;
            color: var(--mc-color-warning);
          }

          .unknown-text {
            margin-left: 4px;
            font-size: 12px;
            line-height: 16px;
            color: var(--mc-color-warning);
          }
        }
      }

      .value {
        display: flex;
        justify-content: flex-start;
        align-items: center;
      }

      .name {
        font-size: 16px;
        padding-right: 8px;
        margin-left: 8px;

        span {
          line-height: 24px;
        }
      }

      .address {
        font-size: 14px;
        line-height: 20px;
        color: var(--mc-color-primary);
      }

      .copy {
        margin-left: 4px;
        margin-right: 8px;
        color: var(--mc-icon-color-light);
      }
    }

    .dont-show {
      margin-top: 24px;

      ::v-deep.van-checkbox__label {
        font-size: 14px;
        line-height: 20px;
        margin-left: 8px;
        color: var(--mc-text-color-white);
      }
    }

    .confirm-btn {
      margin-top: 12px;

      .van-button {
        height: 56px;
        border-radius: 12px;
      }
    }
  }
}
</style>
