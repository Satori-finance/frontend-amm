<template>
  <div class="set-liquidity-mining-rate-action">
    <div class="action-content">
      <div class="description-line">
        {{ $t('dao.actionCard.setLiquidityMiningRateDescription') }}
      </div>
      <div class="action-form">
        <el-form v-model="actionDatasForm" :rules="formRule" size="medium" ref="form"
                 inline-message @submit.native.prevent>
          <div class="label-line">
            <span>{{ $t('dao.actionCard.miningPool') }}</span>
          </div>
          <div class="input-item">
            <el-form-item>
              <el-select v-model="actionDatasForm.miningPoolAddress" filterable
                         :placeholder="$t('dao.actionCard.selectMiningPool')" :disabled="disableAction"
                         :loading="liquidityPoolLoading">
                <el-option
                    v-for="item in liquidityMiningPoolOptions"
                    :key="item.value"
                    :label="item.value"
                    :value="item.value">
                  <span>{{ item.value }} ({{ item.label }})</span>
                </el-option>
              </el-select>
            </el-form-item>
          </div>
          <div class="label-line">
            <span>{{ $t('dao.actionCard.miningRate') }}</span>
          </div>
          <div class="input-item">
            <el-form-item>
              <el-input v-model="actionDatasForm.miningRate" :disabled="disableAction">
                <span slot="suffix">
                  {{ $t('dao.actionCard.miningBlock', { tokenName: 'SATORI'}) }}
                </span>
              </el-input>
            </el-form-item>
          </div>
          <div class="sub-line">
            <span></span>
            <span>
              ≈ {{ releaseDay | bigNumberFormatter(2) }} {{ $t('dao.actionCard.miningDay', { tokenName: 'SATORI'}) }}
            </span>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Watch, Mixins, Ref, Prop } from 'vue-property-decorator'
import SetLiquidityMiningRateActionMixin from '@/template/components/DAO/Actions/setLiquidityMiningRateActionMixin'
import { ElForm } from 'element-ui/types/form'
import BigNumber from 'bignumber.js'

@Component
export default class SetLiquidityMiningRateAction extends Mixins(SetLiquidityMiningRateActionMixin) {
  @Prop({ default: false }) disableAction !: boolean
  @Ref('form') formRef !: ElForm

  mounted() {
    this.formRef.validateField(Object.keys(this.formRule))
  }

  updated() {
    this.onFormValidatorStateChanged()
  }

  private formRule = {
    miningRate: [
      { validator: this.validateMiningRate, trigger: 'change' },
    ]
  }

  get formValidatorIsPass(): boolean {
    return !this.invalidMiningRate && !this.invalidPoolAddress && !this.invalidGovernorAddress
  }

  validateMiningRate(rule: any, value: string, callback: Function) {
    const val = this.actionDatasForm.miningRate
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

  @Watch('formValidatorIsPass', { immediate: true })
  onFormValidatorStateChanged() {
    this.$emit('validate', this.actionIndex, this.formValidatorIsPass)
  }
}
</script>

<style scoped lang="scss">
@import "./actions.scss";

.set-liquidity-mining-rate-action {

}
</style>
