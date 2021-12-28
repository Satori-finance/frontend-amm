<template>
  <div class="transfer-value-assets-action">
    <div class="action-content">
      <div class="description-line">
        {{ $t('dao.actionCard.transferVaultAssetsDescription') }}
      </div>
      <div class="action-form">
        <el-form v-model="actionDatasForm" :rules="formRule" size="medium" ref="form"
                 inline-message @submit.native.prevent>
          <div class="label-line">
            <span>{{ $t('dao.actionCard.assetsAmount') }}</span>
            <span v-if="isConnectedWallet">
              {{ $t('dao.actionCard.vaultBalance') }}
              <span v-if="!selectedVaultAssetBalance.isZero()">
                {{ selectedVaultAssetBalance | bigNumberFormatterByPrecision(selectedVaultAssetDecimals) }}
              </span>
              <span v-else>0</span>
              {{ selectedVaultAssetName }}
            </span>
          </div>
          <div class="input-item">
            <el-form-item prop="assetsAmount">
              <el-input v-model="actionDatasForm.assetsAmount" :disabled="disableAction">
                <div slot="suffix">
                  <el-button v-if="isConnectedWallet" type="primary" plain size="mini" round class="max-button" @click="setMaxBalance" :disabled="disableAction">
                    {{ $t('base.max') }}
                  </el-button>
                  <el-select v-model="actionDatasForm.assetsTokenAddress" size="medium" class="sub-selected"
                             autocomplete="on" :disabled="disableAction" :loading="vaultAssetsLoading">
                    <el-option
                        v-for="item in vaultAssetsOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value">
                    </el-option>
                  </el-select>
                </div>
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
import TransferVaultAssetsActionMixin from '@/template/components/DAO/Actions/transferVaultAssetsActionMixin'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { ElForm } from 'element-ui/types/form'

@Component
export default class TransferVaultAssetsAction extends Mixins(TransferVaultAssetsActionMixin) {
  @Prop({ default: false }) disableAction !: boolean
  @Ref('form') formRef !: ElForm

  mounted() {
    this.formRef.validateField(Object.keys(this.formRule))
  }

  updated() {
    this.onFormValidatorStateChanged()
  }

  private formRule = {
    assetsAmount: [
      { validator: this.validateAssetsAmount, trigger: 'change' },
    ],
    receiveAddress: [
      { validator: this.validateReceiveAddress, trigger: 'change' },
    ]
  }

  get formValidatorIsPass(): boolean {
    return !this.invalidAssetAmount && !this.invalidAssetsTokenAddress && !this.invalidReceiveAddress && !this.invalidAssetsTokenDecimals
  }

  setMaxBalance() {
    this.actionDatasForm.assetsAmount = this.selectedVaultAssetBalance.toFixed()
  }

  validateAssetsAmount(rule: any, value: string, callback: Function) {
    const val = this.actionDatasForm.assetsAmount
    if (val === '' || !this.isConnectedWallet) {
      callback()
      return
    }
    const amount = new BigNumber(val)
    if (amount.isNaN() || amount.lte(0)) {
      callback(new Error(this.$t('commonErrors.inputError').toString()))
      return
    }
    if (amount.gt(this.selectedVaultAssetBalance)) {
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

.transfer-value-assets-action {

}
</style>
