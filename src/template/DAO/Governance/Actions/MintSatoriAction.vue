<template>
  <div class="mint-mcb-action">
    <div class="action-content">
      <div class="description-line">
        {{ $t('dao.actionCard.mintSATORIDescription') }}
      </div>
      <div class="action-form">
        <el-form v-model="actionDatasForm" :rules="formRule" ref="form" size="medium"
                 inline-message @submit.native.prevent>
          <div class="label-line">
            <span>{{ $t('dao.actionCard.assetsAmount') }}</span>
            <span>
              {{ $t('dao.actionCard.mintableAmount') }}
              {{ mintableBalance | bigNumberFormatter(4) }} {{ daoTokenSymbol }}
            </span>
          </div>
          <div class="input-item">
            <el-form-item prop="amount">
              <el-input v-model="actionDatasForm.amount" :disabled="disableAction">
                <div slot="suffix">{{ daoTokenSymbol }}</div>
              </el-input>
            </el-form-item>
          </div>
          <div class="label-line">
            <span>{{ $t('dao.actionCard.receiveAddress') }}</span>
          </div>
          <div class="input-item">
            <el-form-item prop="receiveAddress">
              <el-input v-model="actionDatasForm.receiveAddress" :disabled="disableAction"></el-input>
            </el-form-item>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Ref, Watch } from 'vue-property-decorator'
import MintMcbActionMixin from '@/template/components/DAO/Actions/mintMcbActionMixin'
import { ethers } from 'ethers'
import BigNumber from 'bignumber.js'
import { ElForm } from 'element-ui/types/form'

@Component
export default class MintSATORIAction extends Mixins(MintMcbActionMixin) {
  @Prop({ default: false }) disableAction !: boolean
  @Ref('form') formRef !: ElForm

  mounted() {
    this.formRef.validateField(Object.keys(this.formRule))
  }

  updated() {
    this.onFormValidatorStateChanged()
  }

  private formRule = {
    amount: [
      { validator: this.validateAmount, trigger: 'change' },
    ],
    receiveAddress: [
      { validator: this.validateReceiveAddress, trigger: 'change' },
    ]
  }

  get formValidatorIsPass(): boolean {
    return !this.invalidAmount && !this.invalidReceiveAddress
  }

  validateAmount(rule: any, value: string, callback: Function) {
    const val = this.actionDatasForm.amount
    if (val === '' ) {
      callback()
      return
    }
    const amount = new BigNumber(val)
    if (amount.isNaN() || amount.lte(0) || amount.gt(this.mintableBalance)) {
      callback(new Error(this.$t('commonErrors.insufficientAmountError').toString()))
      return
    }
    callback()
  }

  validateReceiveAddress(rule: any, value: string, callback: Function) {
    const val = this.actionDatasForm.receiveAddress
    if (val === '' || ethers.utils.isAddress(val)) {
      callback()
    } else {
      callback(new Error(this.$t('commonErrors.addressError').toString()))
    }
  }

  @Watch('formValidatorIsPass', { immediate: true })
  onFormValidatorStateChanged() {
    this.$emit('validate', this.actionIndex, this.formValidatorIsPass)
  }
}
</script>

<style scoped lang="scss">
@import "./actions.scss";

.mint-mcb-action {

}
</style>
