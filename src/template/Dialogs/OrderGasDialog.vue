<template>
  <div>
    <el-dialog
      append-to-body
      :title="$t('orderGasDialog.title')"
      top="0"
      custom-class="is-small is-round order-gas-dialog"
      :close-on-click-modal="false"
      :visible.sync="currentVisible"
      @closed="onClosed"
    >
      <div class="tabs-container">
        <McRadioTabs
          v-model="selectedRadio"
          :class="[selectedRadio]"
          :options="[
            {label: $t('base.deposit'), value: 'deposit'},
            {label: $t('base.withdraw'), value: 'withdraw'},
          ]"
        />
      </div>
      <template v-if="selectedRadio === 'deposit'">
        <div class="input-container">
          <div class="info-line">
            <span>{{ $t('base.amount') }}</span>
            <span>
              {{ $t('base.walletBalance') }}:
              {{ nativeTokenBalance | bigNumberFormatter(nativeTokenDecimals) }}
            </span>
          </div>
          <div class="input-line">
            <el-form size="medium" :model="depositForm" :rules="formRule" ref="orderGasForm" @submit.native.prevent>
              <el-form-item prop="amount" :inline-message="true">
                <el-input v-model="depositAmount" size="large" placeholder="0.0">
                  <template slot="suffix">
                    <img :src="nativeIcon" />{{ nativeTokenSymbol }}
                  </template>
                </el-input>
              </el-form-item>
            </el-form>
          </div>
          <div class="radio-line">
            <McRadioGroup v-model="depositAmountProportion"
                          :values="[25, 50, 75, 100]"
                          suffix="%"/>
          </div>
        </div>
        <div class="info-panel">
          <div class="line-item">
            <span class="label">{{ $t('placeOrder.tradePanel.remainingOrderGas') }}</span>
            <span class="value">{{ gasBalance | bigNumberFormatter(nativeTokenDecimals) }} {{ nativeTokenSymbol }}</span>
          </div>
        </div>
        <div class="button-container">
          <el-button @click="confirmEvent" size="large" type="blue" :loading="depositState === 'loading'"
                     :disabled="invalidDepositAmount" >{{
            $t('base.deposit')
          }}</el-button>
        </div>
      </template>
      <template v-if="selectedRadio === 'withdraw'">
        <div class="input-container">
          <div class="info-line">
            <span>{{ $t('base.amount') }}</span>
            <span>
              {{ $t('orderGasDialog.orderGasBalance') }}:
              {{ gasBalance | bigNumberFormatter(nativeTokenDecimals) }}
            </span>
          </div>
          <div class="input-line">
            <el-form size="medium" :model="withdrawForm" :rules="formRule" ref="orderGasForm" @submit.native.prevent>
              <el-form-item prop="amount" :inline-message="true">
                <el-input v-model="withdrawAmount" size="large" placeholder="0.0">
                  <template slot="suffix">
                    <img :src="nativeIcon" />{{ nativeTokenSymbol }}
                  </template>
                </el-input>
              </el-form-item>
            </el-form>
          </div>
          <div class="radio-line">
            <McRadioGroup v-model="withdrawAmountProportion"
                          :values="[25, 50, 75, 100]"
                          suffix="%"/>
          </div>
        </div>
        <div class="button-container">
          <el-button @click="confirmEvent" :loading="withdrawState === 'loading'" :disabled="invalidWithdrawAmount"
                     size="large" type="orange">{{
              $t('base.withdraw')
            }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins, Watch } from 'vue-property-decorator'
import AsyncComputed from '@romancow/vue-async-computed-decorator'
import { toBigNumber } from '@/utils'
import { ElForm } from 'element-ui/types/form'
import { ACCOUNT_EVENT, VUE_EVENT_BUS } from '@/event'
import BrokerGasMixin from '@/template/components/BrokerGas/BrokerGasMixin'
import { McRadioTabs, McRadioGroup, TokenImageView } from '@/components'

@Component({
  components: {
    McRadioTabs,
    McRadioGroup,
    TokenImageView,
  }
})
export default class OrderGasDialog extends Mixins(BrokerGasMixin) {
  @Prop({ default: false }) visible!: boolean

  get currentVisible() {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
  }

  private formRule = {
    amount: [
      { validator: this.validateInputNumber, trigger: 'change' },
      { validator: this.validateInputAmount, trigger: 'change' },
    ],
  }

  @AsyncComputed({
    watch: ['formParamsIsValid']
  })
  get formParamsValidatorIsPass() {
    return this.formValidator()
  }

  get formParamsIsValid(): boolean {
    let form = this.selectedRadio === 'deposit' ? this.depositForm : this.withdrawForm
    const amount = Number(form.amount)
    if (isNaN(amount) || amount <= 0 || form.amount === '') {
      return false
    }
    const checkStatus = this.formParamsValidatorIsPass
    if (checkStatus) {
      return true
    }
    return false
  }

  onClosed() {
    this.changeReset()
  }

  validateInputNumber(rule: any, value: string, callback: Function) {
    const valueFloat = Number(value)
    if (isNaN(valueFloat)) {
      callback(new Error(this.$t('commonErrors.inputError').toString()))
    } else if (valueFloat < 0) {
      callback(new Error(this.$t('commonErrors.inputError').toString()))
    } else {
      callback()
    }
  }

  validateInputAmount(rule: any, value: string, callback: Function) {
    const valueBigNumber = toBigNumber(value)
    if (this.selectedRadio === 'deposit') {
      if (this.nativeTokenBalance && !valueBigNumber.isNaN() && valueBigNumber.gt(this.nativeTokenBalance)) {
        callback(new Error(this.$t('commonErrors.insufficientWalletBalance').toString()))
      } else {
        callback()
      }
    } else if (this.selectedRadio === 'withdraw') {
      if (this.gasBalance && !valueBigNumber.isNaN() && valueBigNumber.gt(this.gasBalance)) {
        callback(new Error(this.$t('commonErrors.insufficientGasBalance').toString()))
      } else {
        callback()
      }
    } else {
      callback()
    }
  }

  async formValidator(): Promise<boolean> {
    const form = this.$refs.orderGasForm as ElForm
    let valid: boolean
    try {
      valid = await form.validate()
    } catch (e) {
      return false
    }
    return valid
  }

  async confirmEvent() {
    if (!this.formParamsIsValid) {
      return
    }
    const successCallback = () => {
      this.updateAccountGasStorage()
      VUE_EVENT_BUS.emit(ACCOUNT_EVENT.REFRESH_USER_DATA)
      this.currentVisible = false
    }
    await this.callChainFunc(async () => {
      if (this.selectedRadio === 'deposit') {
        await this.onDeposit(this.depositForm.amount, successCallback)
      } else if (this.selectedRadio === 'withdraw') {
        await this.onWithdraw(this.withdrawForm.amount, successCallback)
      }
    })
  }

  @Watch('currentVisible', { immediate: true })
  onCurrentVisibleChanged() {
    if (this.currentVisible) {
      this.updateNativeTokenBalance()
    }
  }
}
</script>

<style lang="scss" scoped>
.order-gas-dialog {
  .tabs-container {
    margin-top: 12px;
    margin-bottom: 24px;

    .mc-radio-tabs.deposit ::v-deep .active {
      color: var(--mc-color-blue);
    }

    .mc-radio-tabs.withdraw ::v-deep .active {
      color: var(--mc-color-orange);
    }
  }

  .input-container {
    min-height: 138px;
    width: 100%;
    background: var(--mc-background-color-darkest);
    border-radius: var(--mc-border-radius-l);
    padding: 16px;

    .info-line {
      font-size: 14px;
      color: var(--mc-text-color);
      display: flex;
      justify-content: space-between;
    }

    .input-line {
      margin: 12px 0;

      .el-form-item {
        margin-bottom: 0;
      }

      ::v-deep .el-input {
        background: transparent;
        border: unset;
        padding: 0;
        height: 30px;

        .el-input__inner {
          height: 30px;
          line-height: 30px;
          font-size: 24px;
          font-weight: 700;
        }

        .el-input__suffix-inner {
          font-size: 18px;
          color: var(--mc-text-color-white);
          display: flex;
          align-items: center;
          img {
            width: 24px;
            height: 24px;
            margin-right: 8px;
          }
        }
      }
    }

    .radio-line {}
  }

  .info-panel {
    margin-top: 16px;
    padding: 16px;
    border: 1px solid var(--mc-border-color);
    border-radius: var(--mc-border-radius-l);

    .line-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      font-size: 14px;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        color: var(--mc-text-color);
      }

      .value {
        color: var(--mc-text-color-white);
      }
    }
  }

  .button-container {
    margin-top: 24px;
    padding: 2px 0;

    .el-button {
      height: 56px;
      width: 100%;
      font-size: 16px;
      border-radius: var(--mc-border-radius-l);
    }
  }
}
</style>

