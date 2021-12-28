<template>
  <div class="set-uniswap-mining-rate-action">
    <div class="action-content">
      <div class="description-line">
        {{ $t('dao.actionCard.setSATORIUniswapMiningRateDescription') }}
      </div>
      <div class="action-form">
        <el-form v-model="actionDatasForm" :rules="formRule" size="medium" ref="form"
                 inline-message @submit.native.prevent>
          <div class="label-line">
            <span>{{ $t('dao.actionCard.miningPool') }}</span>
          </div>
          <div class="input-item">
            <el-form-item>
              <el-select v-model="actionDatasForm.miningPoolAddress"
                         :placeholder="$t('dao.actionCard.selectMiningPool')" :disabled="disableAction">
                <el-option
                    v-for="item in uniswapMiningPoolOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value">
                  <span>{{ item.label }} ({{ item.value | ellipsisMiddle(6, 4) }})</span>
                </el-option>
              </el-select>
            </el-form-item>
          </div>
          <div class="label-line">
            <span>{{ $t('dao.actionCard.miningRate') }}</span>
          </div>
          <div class="input-item">
            <el-form-item prop="miningRate">
              <el-input v-model="actionDatasForm.miningRate" :disabled="disableAction">
                <span slot="suffix">
                  {{ $t('dao.actionCard.miningBlock', { tokenName: 'SATORI' }) }}
                </span>
              </el-input>
            </el-form-item>
          </div>
          <div class="sub-line">
            <span></span>
            <span>
              ≈ {{ releaseDay | bigNumberFormatter(2) }} {{ $t('dao.actionCard.miningDay', { tokenName: 'SATORI' }) }}
            </span>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Ref, Watch } from 'vue-property-decorator'
import SetUniswapMiningRateActionMixin from '@/template/components/DAO/Actions/setUniswapMiningRateActionMixin'
import { ElForm } from 'element-ui/types/form'
import BigNumber from 'bignumber.js'

@Component
export default class SetUniswapMiningRateAction extends Mixins(SetUniswapMiningRateActionMixin) {
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
    return !this.invalidMiningRate && !this.invalidPoolAddress
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

.set-uniswap-mining-rate-action {

}
</style>
