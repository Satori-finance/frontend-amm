<template>
  <div class="set-mcb-staking-mining-action">
    <div class="action-content">
      <div class="description-line">
        {{ $t('dao.actionCard.setSATORIStakingMiningRateDescription') }}
      </div>
      <div class="action-form">
        <el-form v-model="actionDatasForm" :rules="formRule" size="medium" ref="form"
                 inline-message @submit.native.prevent>
          <div class="label-line">
            <span>{{ $t('dao.actionCard.miningRate') }}</span>
          </div>
          <div class="input-item">
            <el-form-item prop="miningRate">
              <el-input v-model="actionDatasForm.miningRate" :disabled="disableAction">
                <div slot="suffix">
                  <el-select v-model="actionDatasForm.assetsTokenAddress" size="medium" class="sub-selected"
                             :disabled="disableAction" autocomplete="on">
                    <el-option
                        v-for="item in vaultAssetsOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value">
                    </el-option>
                  </el-select>
                  <span class="sub-suffix">{{ $t('dao.actionCard.miningBlock', { tokenName: ' ' }) }}</span>
                </div>
              </el-input>
            </el-form-item>
          </div>
          <div class="sub-line">
            <span></span>
            <span>
              ≈ {{ releaseDay | bigNumberFormatter(2) }} {{ $t('dao.actionCard.miningDay', { tokenName: selectedVaultAssetName }) }}
            </span>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Watch, Ref, Mixins, Prop } from 'vue-property-decorator'
import BigNumber from 'bignumber.js'
import { ElForm } from 'element-ui/types/form'
import SetStakingMiningRateActionMixin from '@/template/components/DAO/Actions/setStakingMiningRateActionMixin'

@Component
export default class SetStakingMiningRateAction extends Mixins(SetStakingMiningRateActionMixin) {
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
      { validator: this.validateMiningRate, trigger: 'change' },
    ],
  }

  get formValidatorIsPass(): boolean {
    return !this.invalidMiningRate && !this.invalidAssetsTokenAddress && !this.invalidAssetsTokenDecimals
  }

  validateMiningRate(rule: any, value: string, callback: Function) {
    const val = this.actionDatasForm.miningRate
    if (val === '' ) {
      callback()
      return
    }
    const rate = new BigNumber(val)
    if (rate.isNaN() || rate.lte(0)) {
      callback(new Error(this.$t('commonErrors.inputError').toString()))
      return
    }
    callback()
  }

  @Watch('formValidatorIsPass', { immediate: true })
  onFormValidatorStateChanged() {
    this.$emit('validate', this.actionIndex, this.formValidatorIsPass)
  }
}
</script>

<style scoped lang="scss">
@import "./actions.scss";

.set-mcb-staking-mining-action {

}
</style>
