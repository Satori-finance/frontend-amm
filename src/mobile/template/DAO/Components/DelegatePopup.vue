<template>
  <div class="delegate-popup">
    <van-popup
      v-model="showPopup"
      round
      position="bottom"
      class="safe-area-inset-bottom"
      safe-area-inset-bottom
      closeable
      @close="onClose">
      <div class="popup-header">{{ $t('delegationDialog.title') }}</div>
      <div class="popup-container">
        <div class="text">{{ $t('delegationDialog.tip') }}</div>
        <template v-if="currentViewType === 'edit'">
          <div class="edit-container">
            <div class="form" :class="{'form-error': validateInputAddress(delegateAddress)}">
              <van-form :class="{'input-focus': inputIsFocus}">
                <van-field class="van-field__input large" v-model="delegateAddress" :rules="rules.delegateAddress"
                           :placeholder="$t('delegationDialog.delegateAddress')"
                           @focus="inputIsFocus=true" @blur="inputIsFocus=false">
                  <template slot="right-icon">
                    <svg v-show="delegateAddress" class="svg-icon" aria-hidden="true" @click="clearDelegateAddress">
                      <use :xlink:href="`#icon-clear`"></use>
                    </svg>
                  </template>
                </van-field>
              </van-form>
            </div>
            <div class="button" v-if="!isConnectedWallet">
              <div class="single-button">
                <van-button class="round" size="large" @click="onConnectWallet">
                  <i class="iconfont icon-wallet-bold"></i>
                  {{ $t('connectWalletButton.connectWallet') }}
                </van-button>
              </div>
            </div>
            <div class="button" v-else>
              <McMStateButton :button-class="['round', 'large']" :state.sync="delegateButtonState"
                              :disabled="buttonIsDisabled" @click="onConfirmEvent">
                {{ $t('base.delegate') }}
              </McMStateButton>
            </div>
          </div>
        </template>
        <template v-if="currentViewType === 'show'">
          <div class="view-container">
            <div class="delegate-line">
              <div class="value">
                <a :href="delegateToAddress | etherBrowserAddressFormatter">
                  <span v-if="existingDelegationAlias === delegateToAddress">
                    {{ delegateToAddress | ellipsisMiddle }}
                  </span>
                  <span v-else>
                      {{ delegateToAddress | operatorNameFormatter }}
                  </span>
                </a>
                <i class="iconfont icon-view"></i>
              </div>
              <div class="right">
                <i class="iconfont icon-edit edit-icon" @click="currentViewType='edit'"></i>
                <i class="iconfont icon-delete1 remove-icon" :class="{'is-disabled': buttonIsLoading}"
                   @click="onRemoveEvent"></i>
              </div>
            </div>
            <div class="button-line">
              <McMStateButton :button-class="['round', 'large']" :state.sync="delegateButtonState"
                              :disabled="true" @click="onConfirmEvent">
                {{ $t('base.delegate') }}
              </McMStateButton>
            </div>
          </div>
        </template>
      </div>
    </van-popup>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import DelegateMixin from '@/template/components/DAO/delegateMixin'
import { McMStateButton } from '@/mobile/components'
import { ButtonState } from '@/type'
import { ethers } from 'ethers';
import { VUE_EVENT_BUS } from '@/event'
import { COMMON_EVENT } from '@/mobile/event'

@Component({
  components: {
    McMStateButton,
  }
})
export default class DelegatePopup extends Mixins(DelegateMixin) {
  @Prop({ required: true }) visible !: boolean

  private delegateButtonState: ButtonState = ''
  private removeButtonState: ButtonState = ''
  private inputIsFocus:boolean = false

  get showPopup(): boolean {
    return this.visible
  }

  set showPopup(val: boolean) {
    this.$emit('update:visible', val)
  }

  private rulesFunc =  {
    delegateAddress: [
      { validator: (val: string, rule: any) => {
          const errorMsg = this.validateInputAddress(val)
          rule.msg = errorMsg
          return errorMsg === ''
        },
        message: (val: string, rule: any) => {
          return rule.msg
        },
      }
    ]
  }

  private rules = {
    delegateAddress: [
      {
        ...this.rulesFunc.delegateAddress[0],
        trigger: 'onChange'
      },
      {
        ...this.rulesFunc.delegateAddress[0],
        trigger: 'onBlur'
      },
    ]
  }

  get buttonIsDisabled(): boolean {
    if (!this.isConnectedWallet) {
      return true
    }
    if (this.invalidAddress || this.delegateAddress === '') {
      return true
    }
    return false
  }

  get invalidAddress(): boolean {
    if (!this.userAddress) {
      return true
    }
    return !ethers.utils.isAddress(this.delegateAddress) || this.userAddress.toLowerCase() === this.delegateAddress.toLowerCase()
  }

  @Watch('showPopup', { immediate: true })
  @Watch('signer', { immediate: true })
  async onCurrentVisible() {
    if(!this.showPopup) {
      return
    }
    await this.initialDelegateData()
  }

  onConnectWallet() {
    VUE_EVENT_BUS.emit(COMMON_EVENT.SHOW_SELECT_WALLET_POPUP)
    this.showPopup = false
  }

  clearDelegateAddress() {
    this.delegateAddress = ''
    this.form.delegateAddress = ''
  }

  onClose() {
    this.form.delegateAddress = ''
    this.delegateButtonState = ''
    this.removeButtonState = ''
    this.currentViewType = 'edit'
  }

  validateInputAddress(val: string): string {
    if (val === '') {
      return ''
    }
    const isAddress = ethers.utils.isAddress(val)
    if (!isAddress) {
      return this.$t('commonErrors.addressError').toString()
    }
    if (this.userAddress && this.userAddress !== '') {
      if (val.toLowerCase() === this.userAddress.toLowerCase()) {
        return this.$t('delegationDialog.selfAddressError').toString()
      }
    }
    return ''
  }

  async onConfirmEvent() {
    if (this.invalidAddress) {
      return
    }
    this.delegateButtonState = 'loading'
    const state = await this.onConfirmDelegate()
    this.delegateButtonState = state ? 'success' : 'fail'
  }

  async onRemoveEvent() {
    this.removeButtonState = 'loading'
    const state = await this.onRemoveDelegate()
    this.removeButtonState = state ? 'success' : 'fail'
  }
}
</script>

<style lang="scss" scoped>
@import '~@mcdex/style/common/var';
.delegate-popup {
  ::v-deep {
    .van-popup {
      padding: 16px;
      min-height: 120px;
      max-height: 350px;
    }

    .van-popup__close-icon {
      color: var(--mc-text-color-white);
    }
  }

  .popup-container {
    margin-top: 28px;

    .text {
      font-size: 14px;
      line-height: 20px;
      margin-bottom: 12px;
      color: var(--mc-text-color);
    }
  }

  .edit-container {
    margin-bottom: 16px;

    .form-error {
      margin-bottom: 76px;
    }

    ::v-deep {
      input::-webkit-input-placeholder{
        color: var(--mc-text-color-dark);
      }
    }

    .form {
      .van-cell {
        padding: 0;
        border-radius: 12px;
        height: 58px;
        width: 100%;
      }

      ::v-deep{
        .van-field__value {
          display: flex;
          justify-content: center;

          .van-field__error-message {
            height: 44px;
            width: 100%;
            background: rgba($--mc-color-error, 0.1);
            line-height: 20px;
            padding: 12px 16px;
            border-radius: 12px;
          }
        }

        .van-field__body {
          padding: 16px;
          width: 100%;
        }

        .van-field--error {
          .van-field__body {
            padding: 16px!important;
            width: 100%!important;
          }
        }
      }

      .input-focus {
        .van-cell {
          background: var(--mc-color-primary-gradient);
        }

        ::v-deep .van-field__body {
          padding: 15px;
          width: calc(100% - 2px);
        }
      }
    }

    .button {
      margin-top: 24px;
    }
  }

  .view-container {
    margin-bottom: 16px;

    .delegate-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      margin-top: 32px;
      height: 56px;
      border-radius: 12px;
      border: 1px solid var(--mc-border-color);
      padding: 16px;

      .value {
        a {
          color: var(--mc-color-primary);
          text-decoration: underline;
        }
        i {
          margin-left: 8px;
          font-weight: 700;
          color: var(--mc-text-color);
        }
      }

      .right {
        .iconfont {
          font-size: 18px;
          cursor: pointer;

          &.is-disabled {
            cursor: not-allowed;
            opacity: 0.5;
          }
        }

        .edit-icon {
          color: var(--mc-color-primary);
        }

        .remove-icon {
          margin-left: 12px;
          color: var(--mc-color-error);
        }
      }
    }

    .button-line {
      margin-top: 32px;
      display: flex;
      justify-content: space-between;

      .button-item {
        width: 50%;

        &:first-child {
          margin-right: 8px;
        }
      }
    }
  }
}
</style>
