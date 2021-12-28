<template>
  <div>
    <el-dialog
      :title="$t('pool.transferOperator.title')"
      top="0"
      custom-class="is-medium transfer-operator"
      append-to-body
      :close-on-click-modal="false"
      :visible.sync="currentVisible"
      @closed="onClosed"
    >
      <div class="prompt">{{ $t('pool.transferOperator.prompt') }}</div>
      <div class="body">
        <div class="pair-item text-item">
          <label>{{ $t('pool.transferOperator.transferAddress') }}</label>
        </div>
        <div class="input-item">
          <el-form
            size="medium"
            :model="form"
            :rules="formRule"
            ref="form"
            @submit.native.prevent
          >
            <el-form-item prop="transferringOperatorAddress">
              <el-input v-model="transferringOperatorAddress" size="medium"></el-input>
            </el-form-item>
          </el-form>
        </div>
      </div>
      <span slot="footer">
        <div class="footer-button">
          <el-button @click="currentVisible=false" size="medium" type="secondary">{{ $t('base.cancel') }}</el-button>
          <el-button @click="onTransferEvent" size="medium" :disabled="buttonIsDisabled">
            {{ $t('pool.transferOperator.transfer') }}
            <i v-if="buttonIsLoading" class="el-icon-loading"></i>
          </el-button>
        </div>
      </span>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator'
import AsyncComputed from '@romancow/vue-async-computed-decorator'
import { namespace } from 'vuex-class'
import { ErrorHandlerMixin } from '@/mixins'
import { ElForm } from 'element-ui/types/form'
import { ethers } from 'ethers'
import { getLiquidityPoolContract, transferOperator } from '@mcdex/mai3.js'
import { getGasStationTxParams } from '@/utils/gasPrice'
import { gasLimitConfig } from '@/config/gas'
import { waitTransaction } from '@/utils/transaction'

const wallet = namespace('wallet')

@Component
export default class TransferOperator extends Mixins(ErrorHandlerMixin) {
  @Prop({ default: false }) visible!: boolean
  @Prop({ required: true }) poolAddress !: string
  @Prop({ default: false }) isPoolOperator!: boolean
  @wallet.Getter('signer') signer!: ethers.Signer
  @wallet.Getter('address') address!: string

  private buttonIsLoading: boolean = false

  private form = {
    transferringOperatorAddress: '',
  }

  get transferringOperatorAddress(): string {
    return this.form.transferringOperatorAddress
  }

  set transferringOperatorAddress(v: string) {
    this.form.transferringOperatorAddress = v
  }

  private formRule = {
    transferringOperatorAddress: [
      { validator: this.validateInputAddress, trigger: 'change' },
    ],
  }

  get currentVisible() {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
  }

  get buttonIsDisabled(): boolean {
    if (!this.formParamsValidatorIsPass || this.buttonIsLoading || !this.isPoolOperator) {
      return true
    }
    return false
  }

  @AsyncComputed({
    watch: ['transferringOperatorAddress']
  })
  get formParamsValidatorIsPass() {
    return this.formValidator()
  }

  onClosed() {
    this.transferringOperatorAddress = ''
  }

  validateInputAddress(rule: any, value: string, callback: Function) {
    if (this.transferringOperatorAddress === '') {
      callback()
      return
    }
    const isAddress = ethers.utils.isAddress(value)
    if (!isAddress) {
      callback(new Error(this.$t('commonErrors.errorAddress').toString()))
    } else if(this.address && this.address.toLowerCase() === this.transferringOperatorAddress.toLowerCase()) {
      callback(new Error(this.$t('delegationDialog.selfAddressError').toString()))
    } else {
      callback()
    }
  }

  async formValidator(): Promise<boolean> {
    if (this.transferringOperatorAddress === '') {
      return false
    }
    const form = this.$refs.form as ElForm
    let valid: boolean
    try {
      valid = await form.validate()
    } catch(e) {
      return false
    }
    return valid
  }

  async onTransferEvent() {
    if (!await this.formValidator() || !this.isPoolOperator) {
      return
    }
    this.buttonIsLoading = true
    await this.callChainFunc(async () => {
      const poolContract = getLiquidityPoolContract(this.poolAddress, this.signer)
      const gas = await getGasStationTxParams(gasLimitConfig.TRANSFER_OPERATOR_GAS_LIMIT)
      const promiseInstance = await transferOperator(poolContract, this.transferringOperatorAddress, gas)
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.transferOperator').toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      return await transaction
    })
    this.buttonIsLoading = false
    this.currentVisible = false
  }
}
</script>

<style lang="scss" scoped>
@import "~@mcdex/style/common/var";

.transfer-operator {
  min-height: 350px;

  .pair-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
    line-height: 18px;
    height: 26px;
    margin-top: 8px;
    margin-bottom: 8px;

    &:first-of-type {
      margin-top: 0;
    }

    &:last-of-type {
      margin-bottom: 0;
    }

    label {
      color: var(--mc-text-color);
    }

    span {
      color: var(--mc-text-color);
    }
  }

  .input-item {
    margin-top: 12px;
  }

  .text-item {
    color: var(--mc-text-color);
    height: 18px;
    line-height: 8px;
  }

  .value {
    margin-left: 4px;
    color: var(--mc-text-color-white) !important;
  }

  .body {
    font-size: 14px;
    color: var(--mc-text-color);
    width: 400px;
    margin: 23px auto;
  }

  .footer-button {
    text-align: center;
    margin-bottom: 8px;
  }

  .el-button {
    width: 106px;
    margin: 0 12px;
  }

  .prompt {
    color: var(--mc-color-warning);
    height: 40px;
    line-height: 40px;
    padding: 0 20px;
    background: rgba($--mc-color-warning, 0.1);
    border-radius: var(--mc-border-radius-s);
  }
}
</style>
