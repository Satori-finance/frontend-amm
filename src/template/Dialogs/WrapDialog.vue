<template>
  <div>
    <el-dialog
      append-to-body
      :title="wrapDialogTitle"
      :visible.sync="currentVisible"
      custom-class="is-small is-round"
      class="wrap-dialog"
      top="0"
      :close-on-click-modal="false"
      @closed="onClosed"
    >
      <McLoading
        v-show="!showBody"
        :mask-color="'transparent'"
        :show-loading="loading"
        :min-show-time="500"
        @show="showBody = false"
        @hide="showBody = true"
      >
      </McLoading>
      <div class="loading-part" v-show="showBody">
        <el-form ref="wrapNumber" :model="wrapNumber">
          <div class="table-box">
            <div class="from-box">
              <div class="label">
                <div>{{ $t('wrap.fromWallet') }}</div>
                <div>
                  {{ $t('base.walletBalance') }}:{{ fromTokenBalance | bigNumberFormatter(collateralFormatDecimals) }}
                </div>
              </div>
              <el-form-item prop="amount">
                <el-input
                  class="input"
                  size="medium"
                  placeholder="0.0"
                  v-model="wrapNumber.amount"
                  oninput="value=value.replace(/[^0-9.]/g,'')"
                >
                  <div slot="suffix" class="suffix">
                    <el-button class="max-btn" type="primary" plain @click="setMax">{{ $t('base.max') }}</el-button>
                    <img :src=fromTokenIcon alt="">
                    <div class="token">{{ fromTokenSymbol }}</div>
                  </div>
                </el-input>
              </el-form-item>
            </div>
            <div class="change-icon" @click="changeWrapDirection">
              <a>
                <i class="iconfont icon-down"></i>
              </a>
            </div>
            <div class="to-box">
              <div class="label">
                <div>{{ $t('wrap.toWallet') }}</div>
                <div>{{ $t('base.walletBalance') }}:{{ toTokenBalance | bigNumberFormatter(collateralFormatDecimals) }}</div>
              </div>
              <el-form-item prop="amount">
                <el-input
                  class="input"
                  round
                  size="medium"
                  placeholder="0.0"
                  v-model="wrapNumber.amount"
                  oninput="value=value.replace(/[^0-9.]/g,'')"
                >
                  <div slot="suffix" class="suffix">
                    <img :src=toTokenIcon alt="">
                    <div class="token">{{ toTokenSymbol }}</div>
                  </div>
                </el-input>
              </el-form-item>
            </div>
          </div>
        </el-form>
        <el-button @click="confirmEvent" class="button" :disabled="buttonIsDisabled">
          <span class="clickButton"> {{ confirmBtnText }} <i v-if="buttonIsLoading" class="el-icon-loading"></i></span
        ></el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import AsyncComputed from '@romancow/vue-async-computed-decorator'
import { Component, Prop, Watch } from 'vue-property-decorator'
import WrapMixin from '@/template/components/Wrap/WrapMixin'
import { ACCOUNT_EVENT, VUE_EVENT_BUS } from '@/event'
import { McLoading } from '@/components'

@Component({
  components: {
    McLoading,
  },
})
export default class WrapDialog extends WrapMixin {
  @Prop({ default: false }) visible!: boolean

  private showBody = false

  @Watch('visible')
  private async resetData() {
    if (this.visible) {
      await this.getData()
    }
  }

  get wrapDialogTitle() {
    return this.$t('wrap.title')
  }

  get currentVisible() {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
  }

  dialogClosed() {
    this.$emit('update:visible', false)
  }

  onClosed() {
    this.wrapNumber.amount = ''
  }

  async confirmEvent() {
    if (!this.formParamsIsValid) {
      return
    }
    this.buttonIsLoading = true
    const successCallback = () => {
      VUE_EVENT_BUS.emit(ACCOUNT_EVENT.REFRESH_USER_DATA)
      this.currentVisible = false
    }
    await this.callChainFunc(async () => {
      if (this.wrapDirection == 'wrap') {
        await this.onDeposit(this.wrapNumber.amount, successCallback)
      } else {
        await this.onWithdraw(this.wrapNumber.amount, successCallback)
      }
    })
    this.buttonIsLoading = false
  }
}
</script>
<style lang="scss" scoped>

  ::v-deep .el-dialog {
    min-height: 349px;
    width: 480px;
    border-radius: 24px;

    .el-dialog__header {
      padding: 0 16px 28px;
    }
  }

  .mc-loading {
    height: 200px;
  }

  .change-icon {
    position: absolute;
    top: 150px;
    left: 185px;
    height: 28px;
    width: 28px;
    background-color: var(--mc-background-color);
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;

    .iconfont {
      font-size: 16px;
    }
  }

  .from-box,
  .to-box {
    padding: 16px;
    min-height: 90px;
    border-radius: 12px;
    background-color: var(--mc-background-color-darkest);

    .mc-loading {
      height: 90%;
      width: 100%;
    }

    .el-form-item {
      margin-bottom: 0px;
      height: 30px;

      .el-input {
        height: 30px;
        padding: 0px;
        background-color: transparent;

        .suffix {
          height: 30px;
          display: flex;
          align-items: center;

          img {
            width: 24px;
            height: 24px;
            margin-right: 8px;
            margin-left: 16px;
          }

          .token {
            font-size: 18px;
            line-height: 24px;
            color: var(--mc-text-color-white);
          }
        }

        .max-btn {
          width: 47px;
          height: 24px;
          font-size: 12px;
          line-height: 16px;
          padding: 0 12px;
          border-radius: 8px;
        }

        ::-webkit-input-placeholder {
          font-weight: bold;
          font-size: 24px;
          line-height: 30px;
        }
      }
    }

    .input {
      border: 0px;
      font-size: 18px;
    }

    .label {
      display: flex;
      justify-content: space-between;
      color: var(--mc-text-color);
      font-size: 14px;
      line-height: 20px;
      margin-bottom: 12px;
    }
  }
  .to-box {
    margin-top: 4px;
  }

  .button {
    margin-top: 24px;
    height: 56px;
    width: 100%;
    display: flex;
    justify-content: center;
    border-radius: 12px;

    .clickButton {
      line-height: 56px;
    }
  }

</style>
