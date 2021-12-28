<template>
  <div class="wrap-dialog">
    <van-popup
      v-model="currentVisible"
      closeable
      round
      position="bottom"
      class="safe-area-inset-bottom"
      safe-area-inset-bottom
      close-on-click-overlay
      ref="fixedDom"
      @closed="closePopUp"
    >
      <span class="title">{{ $t('wrap.title') }}</span>

        <div class="input-container">
          <div class="label-line">
            <span>{{ $t('wrap.fromWallet') }}</span>
            <span>{{ $t('base.balance') }}: {{ fromTokenBalance | bigNumberFormatter(collateralFormatDecimals) }}</span>
          </div>
          <div class="form-box">
            <van-form validate-first ref="wrapNumber">
              <McMNumberField v-model="wrapAmount" placeholder="0.0" autocomplete="off" :fixed-dom="fixedDom">
                <span slot="right-icon" class="slot-content">
                  <van-button @click="setMax" class="max-button">{{ $t('base.max') }}</van-button>
                  <span v-if="wrapDirection">
                    <img :src=fromTokenIcon alt="">
                    <span>{{ fromTokenSymbol }}</span>
                  </span>
                  <span v-else>
                    <img :src=toTokenIcon alt="">
                    <span>{{ toTokenSymbol }}</span>
                  </span>
                </span>
              </McMNumberField>
            </van-form>
          </div>
        </div>
        <div class="change-icon" @click="changeWrapDirection">
          <div class="change-icon-small">
            <i class="iconfont icon-down-bold"></i>
          </div>
        </div>
        <div class="input-container">
          <div class="label-line">
            <span>{{ $t('wrap.toWallet') }}</span>
            <span>{{ $t('base.balance') }}: {{ toTokenBalance | bigNumberFormatter(collateralFormatDecimals) }}</span>
          </div>
          <div class="form-box">
            <van-form validate-first>
              <McMNumberField v-model="wrapAmount" placeholder="0.0" autocomplete="off" :fixed-dom="fixedDom">
                <span slot="right-icon">
                  <span v-if="wrapDirection">
                    <img :src=toTokenIcon alt="">
                    <span>{{ toTokenSymbol }}</span>
                  </span>
                  <span v-else>
                    <img :src=fromTokenIcon alt="">
                    <span>{{ fromTokenSymbol }}</span>
                  </span>
                </span>
              </McMNumberField>
            </van-form>
          </div>
        </div>
        <div class="button">
          <McMStateButton
            :button-class="['blue', 'large', 'round']"
            @click="confirmEvent"
            :disabled="buttonIsDisabled"
            :state.sync="confirmState"
          >
            {{ confirmBtnText }}
          </McMStateButton>
        </div>

      <div class="actions"></div>
    </van-popup>
  </div>
</template>

<script lang="ts">
import { Component } from 'vue-property-decorator'
import { ACCOUNT_EVENT, VUE_EVENT_BUS } from '@/event'
import { McMNumberField, McMStateButton } from '@/mobile/components'
import WrapMixin from '@/template/components/Wrap/WrapMixin'

@Component({
  components: {
    McMNumberField,
    McMStateButton,
  },
})
export default class WrapPopup extends WrapMixin {
  private currentVisible: boolean = false
  private fixedDom: any = null

  mounted() {
    this.fixedDom = this.$refs.fixedDom
    VUE_EVENT_BUS.on(ACCOUNT_EVENT.WRAP_ETH, () => {
      this.currentVisible = true
    })
  }

  destroyed() {
    VUE_EVENT_BUS.off(ACCOUNT_EVENT.WRAP_ETH, () => {
      this.currentVisible = true
    })
    this.wrapNumber.amount = ''
  }

  get wrapAmount() {
    return this.wrapNumber.amount
  }

  set wrapAmount(val: string) {
    this.wrapNumber.amount = val
  }

  async confirmEvent() {
    await this.callChainFunc(async () => {
      if (this.wrapDirection == 'wrap') {
        await this.onDeposit(this.wrapNumber.amount)
      } else {
        await this.onWithdraw(this.wrapNumber.amount)
      }
      VUE_EVENT_BUS.emit(ACCOUNT_EVENT.REFRESH_USER_DATA)
      this.wrapNumber.amount = ''
      this.currentVisible = false
    })
  }

  closePopUp() {
    this.wrapNumber.amount = ''
  }
}
</script>

<style lang="scss" scoped>
@import '~@mcdex/style/common/fantasy-var';
.wrap-dialog {
  .title {
    display: inline-block;
    font-size: 18px;
    line-height: 24px;
    padding: 0;
    margin-bottom: 28px;
  }

  .input-container {
    margin-top: 4px;
    padding: 16px 16px 19px 16px;
    background: var(--mc-background-color-darkest);
    min-height: 98px;
    border-radius: 12px;

    .label-line {
      display: flex;
      justify-content: space-between;
      color: var(--mc-text-color);
    }

    .form-box {
      margin-top: 16px;

      img {
        width: 24px;
        height: 24px;
        margin-right: 8px;
      }

      ::v-deep {
        .van-form {
          .van-cell {
            padding: 0;
            background-color: transparent;
          }

          .van-field__control {
            color: var(--mc-text-color-white);
            font-size: 24px;
            font-weight: 400;
            caret-color: var(--mc-text-color-white);
          }

          input::-webkit-input-placeholder {
            color: var(--mc-text-color-dark);
            font-weight: 700;
          }

          .van-field__right-icon {
            color: var(--mc-text-color-white);
            font-size: 16px;
            font-weight: 400;
            display: flex;
            padding-top: 2px;
          }

          .van-field__right-icon {
            span {
              display: flex;
              justify-content: center;
              align-items: center;
              white-space: nowrap;
            }
            .max-button {
              margin-right: 16px;
              height: 26px;
              background: rgba($--mc-color-primary, 0.1);
              border-radius: var(--mc-border-radius-m);
              font-size: 14px;
              color: var(--mc-color-primary);
            }
          }
        }
      }
    }
  }

  .change-icon {
    position: absolute;
    top: 165px;
    left: 45%;
    height: 36px;
    width: 36px;
    background-color: var(--mc-background-color-dark);
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 12px;

    .change-icon-small {
      height: 28px;
      width: 28px;
      background-color: var(--mc-background-color);
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 8px;
    }

    .iconfont {
      font-size: 13px;
      color: var(--mc-color-brand);
    }
  }

  .button {
    margin-top: 24px;
    margin-bottom: 34px;
  }
  ::v-deep.van-popup--bottom {
    height: fit-content;
    padding: 16px;
  }
}
</style>
