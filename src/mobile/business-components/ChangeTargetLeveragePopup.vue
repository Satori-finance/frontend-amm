<template>
  <van-popup
    class="change-target-leverage-popup safe-area-inset-bottom"
    v-model="show" position="bottom" round safe-area-inset-bottom
    closeable get-container="body" ref="fixedDom">
    <div class="title">{{ title }}</div>
    <div class="content-box">
      <div class="leverage-info">
        <span>{{ $t('base.leverage') }}</span>
        <span>
          <McMTooltip :content="$t('status.maximumLeverage')">
            <div class="tip-text">{{ $t('base.maximumLeverage') }}:</div>
          </McMTooltip>
          <span class="value"> {{ maxLeverage | bigNumberFormatter(0) }}x</span>
        </span>
      </div>
      <div class="leverage">
        <McMNumberField v-model="tempLeverage"
                        :fixed-dom="fixedDom">
          <span slot="left-icon" class="remove-icon" :disabled="leverage <= 1" @click.stop="removeLeverage"><i
            class="iconfont icon-remove-bold"></i></span>
          <span slot="right-icon" class="add-icon" @click.stop="addLeverage"
                :disabled="leverage >= maxNormalizeLeverage"><i
            class="iconfont icon-add-bold"></i></span>
        </McMNumberField>
      </div>
      <div class="slider">
        <McMSimpleSlider :hide-label="false" :min="minNormalizeLeverage" :max="maxNormalizeLeverage"
                         v-model="tempLeverage"
                         :marks="marks" tooltip-formatter="{value}x"/>
      </div>
      <div class="button">
        <McMStateButton :button-class="[isConnectedWallet? '': 'primary', 'round', 'large']" :state.sync="settingState"
                        @click="onConfirm" :disabled="disableChangeTargetLeverage">
          <span v-if="isConnectedWallet">{{ $t('base.confirm') }}</span>
          <span v-else>
            {{ $t('connectWalletButton.header') }}
            <i v-if="isConnectedWallet" class="iconfont icon-wallet-bold"></i>
          </span>
        </McMStateButton>
      </div>
    </div>
  </van-popup>
</template>

<script lang='ts'>
import { Component, Mixins, Watch } from 'vue-property-decorator'
import { ChangeTargetLeverageMixin } from '@/business-components/ChangeTargetLeverageDialog/ChangeTargetLeverageMixin'
import { MarksProp } from 'vue-slider-component/typings/typings'
import { ErrorHandlerMixin } from '@/mixins'
import { VUE_EVENT_BUS } from '@/event'
import { COMMON_EVENT } from '@/mobile/event'
import { McMNumberField, McMSimpleSlider, McMStateButton, McMTooltip } from '@/mobile/components'
import { namespace } from 'vuex-class'

const interactiveState = namespace('interactiveState')

@Component({
  components: {
    McMSimpleSlider,
    McMNumberField,
    McMStateButton,
    McMTooltip,
  },
})
export default class ChangeTargetLeveragePopup extends Mixins(ChangeTargetLeverageMixin, ErrorHandlerMixin) {
  @interactiveState.Mutation('updateShowLeveragePopupState') updateShowLeveragePopupState !: Function

  private show: boolean = false
  private fixedDom: any = null

  get marks(): MarksProp {
    return {
      [this.minNormalizeLeverage.toString()]: {
        label: this.minNormalizeLeverage.toFixed() + 'x',
      },
      [this.maxNormalizeLeverage.toString()]: {
        label: this.maxNormalizeLeverage.toFixed() + 'x',
      },
    }
  }

  get tempLeverage() {
    return this.leverage
  }

  set tempLeverage(val: string) {
    if (val === '') {
      this.leverage = val
    } else {
      const leverage = parseInt(val)
      if (leverage <= this.maxNormalizeLeverage && leverage >= this.minNormalizeLeverage) {
        this.leverage = Math.floor(leverage).toString()
      }
    }
  }

  mounted() {
    this.fixedDom = this.$refs.fixedDom
    VUE_EVENT_BUS.on(COMMON_EVENT.SHOW_CHANGE_TARGET_LEVERAGE_POPUP, this.showPopup)
  }

  destroyed() {
    VUE_EVENT_BUS.off(COMMON_EVENT.SHOW_CHANGE_TARGET_LEVERAGE_POPUP, this.showPopup)
  }

  showPopup(id: string) {
    this.setPerpetualID(id)
    this.show = true
  }

  closePopup() {
    this.show = false
  }

  addLeverage() {
    if (this.leverage === '') {
      this.leverage = '1'
    } else if (parseInt(this.leverage) < this.maxNormalizeLeverage) {
      this.leverage = (parseInt(this.leverage) + 1).toString()
    }
  }

  removeLeverage() {
    if (parseInt(this.leverage) > this.minNormalizeLeverage) {
      this.leverage = (parseInt(this.leverage) - 1).toString()
    }
  }

  async onConfirm() {
    if (!this.isConnectedWallet) {
      VUE_EVENT_BUS.emit(COMMON_EVENT.SHOW_SELECT_WALLET_POPUP)
      this.show = false
      return
    }
    this.setTargetLeverage()
    this.closePopup()
  }

  @Watch('show', { immediate: true })
  onVisibleChange() {
    this.updateShowLeveragePopupState(this.show)
    if (this.show) {
      this.loadData()
    }
  }
}
</script>

<style scoped lang="scss">
.change-target-leverage-popup {

  .content-box {
    padding: 12px 16px 16px;

    .leverage-info {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      line-height: 20px;
      color: var(--mc-text-color);
      margin-bottom: 8px;
    }

    .leverage {
      .add-icon, .remove-icon {
        color: var(--mc-text-color-white);
      }

      .number-field {
        ::v-deep {
          .van-cell {
            height: 62px;
            padding: 12px 16px;
            border-radius: 12px;

            i {
              font-size: 16px;
            }
          }

          .van-field__control {
            text-align: center;
            font-size: 24px;
            font-weight: 700;
          }
        }
      }
    }

    .slider {
      padding: 0 8px;
      margin-top: 24px;
    }

    .button {
      margin-top: 24px;
    }

    .remove-icon[disabled='disabled'], .add-icon[disabled='disabled'] {
      opacity: 0.5;
      pointer-events: none;
    }
  }
}
</style>
