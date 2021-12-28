<template>
  <div class="custom-action">
    <div class="action-content">
      <div class="description-line">
        {{ $t('dao.actionCard.customDescription') }}
      </div>
      <div class="action-form">
        <el-form v-model="actionDatasForm" :rules="formRule" ref="form" size="medium"
                 inline-message @submit.native.prevent>
          <div class="label-line">
            <span>{{ $t('dao.actionCard.to') }}</span>
          </div>
          <div class="input-item">
            <el-form-item prop="to">
              <el-input v-model="actionDatasForm.to" :disabled="disableAction"></el-input>
            </el-form-item>
          </div>
          <div class="label-line">
            <span>{{ $t('dao.actionCard.value') }}</span>
          </div>
          <div class="input-item">
            <el-form-item prop="value">
              <el-input v-model="actionDatasForm.value" :disabled="disableAction">
                <template slot="suffix">
                  {{ valueSymbol }}
                </template>
              </el-input>
            </el-form-item>
          </div>
          <div class="label-line">
            <span>{{ $t('dao.actionCard.signature') }}</span>
          </div>
          <div class="input-item">
            <el-form-item prop="signature">
              <el-input v-model="actionDatasForm.signature" :disabled="disableAction"></el-input>
            </el-form-item>
          </div>
          <div class="label-line">
            <span>{{ $t('dao.actionCard.callData') }}</span>
          </div>
          <div class="input-item">
            <el-form-item prop="callData">
              <el-input type="textarea" v-model="actionDatasForm.callData" :disabled="disableAction"></el-input>
            </el-form-item>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Watch, Mixins, Ref, Prop } from 'vue-property-decorator'
import CustomActionMixin from '@/template/components/DAO/Actions/customActionMixin'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { ElForm } from 'element-ui/types/form'

@Component
export default class CustomAction extends Mixins(CustomActionMixin) {
  @Prop({ default: false }) disableAction !: boolean
  @Ref('form') formRef !: ElForm

  mounted() {
    this.formRef.validateField(Object.keys(this.formRule))
  }

  updated() {
    this.onFormValidatorStateChanged()
  }

  private formRule = {
    to: [
      { validator: this.validateToAddress, trigger: 'change' },
    ],
    value: [
      { validator: this.validateValue, trigger: 'change' },
    ],
    callData: [],
    signature: [],
  }

  get formValidatorIsPass(): boolean {
    return !this.invalidAssetValue && !this.invalidTo && !this.invalidCallData && !this.invalidSignature
  }

  validateValue(rule: any, value: string, callback: Function) {
    const val = this.actionDatasForm.value
    if (val === '' ) {
      callback()
      return
    }
    const amount = new BigNumber(val)
    if (amount.isNaN() || amount.lt(0)) {
      callback(new Error(this.$t('commonErrors.inputError').toString()))
      return
    }
    callback()
  }

  validateToAddress(rule: any, value: string, callback: Function) {
    const val = this.actionDatasForm.to
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

.custom-action {
  .action-content {
    height: 412px;
  }

  ::v-deep {
    .el-textarea__inner {
      max-height: 142px;
    }
  }
}
</style>
