<template>
  <div class="broker-gas-popup">
    <van-popup
      v-model="showPopup"
      closeable
      position="bottom"
      round
      safe-area-inset-bottom
      ref="fixedDom"
      class="safe-area-inset-bottom"
      :close-on-click-overlay="false">
      <div class="popup-header">{{ $t('base.brokerGas') }}</div>
      <div class="popup-container">
        <div class="operating-panel">
          <McMRadioGroupTabs v-model="selectedRadio" :options="radioOptions" />
          <!-- deposit dom -->
          <template v-if="selectedRadio === 'deposit'">
            <div class="input-container">
              <div class="label-line">
                <span>{{ $t('base.amount') }}</span>
                <span>
                  {{ $t('base.balance') }}
                  <span v-if="nativeTokenBalance">
                    {{ nativeTokenBalance | bigNumberFormatter(nativeTokenDecimals) }}
                  </span>
                  <span v-else>--</span>
                </span>
              </div>
              <div class="form-box">
                <van-form validate-first ref="depositForm">
                  <McMNumberField v-model="depositAmount" placeholder="0.0" :rules="depositRules.amount"
                                  :fixed-dom="fixedDom">
                    <span slot="right-icon" class="right-icon">
                      <McMTokenImageView :size="24" :token="nativeTokenSymbol" />
                      <span>{{ nativeTokenSymbol }}</span>
                    </span>
                  </McMNumberField>
                </van-form>
              </div>
              <div class="proportion-box">
                <McMButtonRadioGroup v-model="depositAmountProportion" :values="[25, 50, 75, 100]" suffix="%"
                                     :class="[radioGroupSelectedClass]" />
              </div>
            </div>
            <div class="info-box">
              <div class="label-line info-box-line">
                <span>{{ $t('orderGasDialog.orderGasBalance') }}</span>
                <span class="value" v-if="gasBalance">
                {{ gasBalance | bigNumberFormatter(nativeTokenDecimals)}} {{ nativeTokenSymbol }}
              </span>
                <span class="value" v-else>--</span>
              </div>
            </div>
            <div class="button-box">
              <div class="single-button">
                <McMStateButton :button-class="['blue', 'round', 'large']" :state.sync="depositState"
                                @click="onDepositEvent" :disabled="invalidDepositAmount">
                  {{ $t('base.deposit') }}
                </McMStateButton>
              </div>
            </div>
          </template>
          <!-- withdraw dom -->
          <template v-if="selectedRadio === 'withdraw'">
            <div class="input-container">
              <div class="label-line">
                <span>{{ $t('base.amount') }}</span>
                <span>
                  {{ $t('orderGasDialog.orderGasBalance') }}
                  <span v-if="gasBalance">{{ gasBalance | bigNumberFormatter(nativeTokenDecimals) }}</span>
                  <span v-else>--</span>
                </span>
              </div>
              <div class="form-box">
                <van-form validate-first ref="withdrawForm">
                  <McMNumberField v-model="withdrawAmount" placeholder="0.0" :rules="withdrawRules.amount"
                                  :fixed-dom="fixedDom">
                    <span slot="right-icon" class="right-icon">
                      <McMTokenImageView :size="24" :token="nativeTokenSymbol" />
                      <span>{{ nativeTokenSymbol }}</span>
                    </span>
                  </McMNumberField>
                </van-form>
              </div>
              <div class="proportion-box">
                <McMButtonRadioGroup v-model="withdrawAmountProportion" :values="[25, 50, 75, 100]" suffix="%"
                                     :class="[radioGroupSelectedClass]" />
              </div>
            </div>
            <div class="button-box">
              <div class="single-button">
                <McMStateButton :button-class="['orange', 'round', 'large']" :state.sync="withdrawState"
                                @click="onWithdrawEvent" :disabled="invalidWithdrawAmount">
                  {{ $t('base.withdraw') }}
                </McMStateButton>
              </div>
            </div>
          </template>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import {
  McMRadioGroupTabs,
  McMStateButton,
  McMButtonRadioGroup,
  McMNumberField,
  McMTokenImageView,
} from '@/mobile/components'
import BrokerGasMixin from '@/template/components/BrokerGas/BrokerGasMixin'
import { ACCOUNT_EVENT, VUE_EVENT_BUS } from '@/event'
import { toBigNumber } from '@/utils'

@Component({
  components: {
    McMRadioGroupTabs,
    McMStateButton,
    McMButtonRadioGroup,
    McMNumberField,
    McMTokenImageView,
  }
})
export default class BrokerGasPopup extends Mixins(BrokerGasMixin) {
  @Prop({ required: true }) visible !: boolean

  private fixedDom: any = null

  mounted() {
    this.fixedDom = this.$refs.fixedDom
  }

  get showPopup(): boolean {
    return this.visible
  }

  set showPopup(val: boolean) {
    this.$emit('update:visible', val)
  }

  get radioOptions() {
    return [
      {
        label: this.$t('base.deposit').toString(),
        value: 'deposit',
        itemSelectedClass: 'blue-radio',
      },
      {
        label: this.$t('base.withdraw').toString(),
        value: 'withdraw',
        itemSelectedClass: 'orange-radio',
      }
    ]
  }

  private depositRules = {
    amount: [
      { validator: (val: string, rule: any) => {
          const errorMsg = this.validatorDepositAmount(val)
          this.$mcmToastErrorMsg(errorMsg)
          return errorMsg === ''
        },
        message: '',
        trigger: 'onChange'
      }
    ]
  }

  private withdrawRules = {
    amount: [
      { validator: (val: string, rule: any) => {
          const errorMsg = this.validatorWithdrawAmount(val)
          this.$mcmToastErrorMsg(errorMsg)
          return errorMsg === ''
        },
        message: '',
        trigger: 'onChange'
      }
    ]
  }

  get radioGroupSelectedClass() {
    if (this.selectedRadio === 'deposit') return 'blue-selected'
    if (this.selectedRadio === 'withdraw') return 'orange-selected'
    return ''
  }

  validatorDepositAmount(val: string): string {
    if (val === '') {
      return ''
    }
    const valueBigNumber = toBigNumber(val)
    if (valueBigNumber.isNaN() || valueBigNumber.lt(0)) {
      return this.$t('commonErrors.inputError').toString()
    }
    if (this.nativeTokenBalance && !valueBigNumber.isNaN() && valueBigNumber.gt(this.nativeTokenBalance)) {
      return this.$t('commonErrors.insufficientWalletBalance').toString()
    }
    return ''
  }

  validatorWithdrawAmount(val: string): string {
    if (val === '') {
      return ''
    }
    const valueBigNumber = toBigNumber(val)
    if (valueBigNumber.isNaN() || valueBigNumber.lt(0)) {
      return this.$t('commonErrors.inputError').toString()
    }
    if (this.gasBalance && !valueBigNumber.isNaN() && valueBigNumber.gt(this.gasBalance)) {
      return this.$t('commonErrors.insufficientGasBalance').toString()
    }
    return ''
  }

  validateDepositForm() {
    const from = this.$refs.depositForm as any
    from.validate()
  }

  validateWithdrawForm() {
    const from = this.$refs.withdrawForm as any
    from.validate()
  }

  onTxSuccessCallBack() {
    this.updateAccountGasStorage()
    VUE_EVENT_BUS.emit(ACCOUNT_EVENT.REFRESH_USER_DATA)
    this.showPopup = false
  }

  async onDepositEvent() {
    await this.callChainFunc(async () => {
      await this.onDeposit(this.depositForm.amount, this.onTxSuccessCallBack)
      this.validateDepositForm()
    })
  }

  async onWithdrawEvent() {
    await this.callChainFunc(async () => {
      await this.onWithdraw(this.withdrawForm.amount, this.onTxSuccessCallBack)
      this.validateWithdrawForm()
    })
  }

  @Watch('showPopup', { immediate: true })
  onShowPopupChanged() {
    if(this.showPopup) {
      this.updateNativeTokenBalance()
    }
  }
}
</script>

<style scoped lang="scss">
.broker-gas-popup {
  ::v-deep {
    .van-popup {
      padding: 16px
    }
  }

  ::v-deep .blue-radio {
    color: var(--mc-color-blue);
  }

  ::v-deep .orange-radio {
    color: var(--mc-color-orange);
  }

  .popup-container {
    padding: 28px 0 16px 0;
  }

  .operating-panel {
    width: 100%;
    border-radius: 24px;

    .input-container {
      margin-top: 24px;
      width: 100%;
      border-radius: 12px;
      padding: 16px;
      background: var(--mc-background-color-darkest);
    }

    .form-box {
      margin-top: 12px;

      ::v-deep {
        .van-form {
          .van-cell {
            height: 30px;
            padding: 0;
            background-color: transparent;
          }

          .van-field__control {
            color: var(--mc-text-color-white);
            font-size: 24px;
            font-weight: 400;
            caret-color: var(--mc-text-color-white);
          }

          input::-webkit-input-placeholder{
            color: var(--mc-text-color);
            font-weight: 700;
            line-height: 32px;
          }

          .van-field__right-icon {
            display: flex;
            align-items: center;
            color: var(--mc-text-color-white);
            font-size: 16px;
            font-weight: 400;
            height: 28px;
            line-height: 28px;
            padding-top: 2px;

            .right-icon {
              display: flex;
              align-items: center;

              .token-image-view {
                margin-right: 8px;
              }
            }
          }
        }
      }
    }

    .proportion-box {
      margin-top: 12px;

      .blue-selected,.orange-selected {
        ::v-deep {
          .radio-item {
            background: var(--mc-background-color);
            color: var(--mc-text-color-white);
            height: 32px;
            line-height: 32px;
          }

          .is-selected {
            border: unset;
            color: var(--mc-color-primary);
            height: 32px;
            line-height: 32px;
          }
        }
      }
    }

    .button-box {
      margin-top: 16px;
    }

    .info-box{
      margin-top: 16px;
      padding: 16px;
      border: 1px solid var(--mc-border-color);
      border-radius: 12px;
    }
  }

  .label-line {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    line-height: 20px;
    color: var(--mc-text-color);

    .value {
      color: var(--mc-text-color-white);
    }
  }
}
</style>
