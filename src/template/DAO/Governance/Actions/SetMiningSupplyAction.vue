<template>
  <div class="set-mining-supply-action">
    <div class="action-content">
      <div class="description-line">
        {{ $t('dao.actionCard.setMiningSupplyDescription') }}
      </div>
      <div class="action-form">
        <el-form v-model="actionDatasForm" :rules="formRule" size="medium" ref="form"
                 inline-message @submit.native.prevent>
          <div class="label-line">
            <span>{{ $t('dao.actionCard.supplyAmount') }}</span>
            <span>
              <span v-if="actionDatasForm.poolType === 'staking'">
                {{ $t('base.amount') }}
                <span v-if="!selectedVaultAssetBalance.isZero()">{{ selectedVaultAssetBalance | bigNumberFormatter(selectedVaultAssetDecimals) }}</span>
                <span v-else>0</span>
                {{ selectedVaultAssetName }}
              </span>
            </span>
          </div>
          <div class="input-item">
            <el-form-item prop="supplyAmount">
              <el-input v-model="actionDatasForm.supplyAmount" :disabled="disableAction">
                <div slot="suffix">
                  <span v-if="actionDatasForm.poolType === 'liquidity'">{{ daoTokenSymbol }}</span>
                  <el-select v-model="actionDatasForm.assetsTokenAddress" v-if="actionDatasForm.poolType === 'staking'"
                             size="medium" class="sub-selected" autocomplete="on" :disabled="disableAction" :loading="vaultAssetsLoading">
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
            <span>{{ $t('dao.actionCard.poolType') }}</span>
            <span></span>
          </div>
          <div class="input-item">
            <el-form-item>
              <el-select v-model="actionDatasForm.poolType" :placeholder="$t('dao.actionCard.selectPoolType')" :disabled="disableAction">
                <el-option
                    v-for="item in miningSupplyPoolTypeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value">
                </el-option>
              </el-select>
            </el-form-item>
          </div>
          <div class="label-line"
               v-if="actionDatasForm.poolType === miningSupplyPoolType.Uniswap ||
                actionDatasForm.poolType === miningSupplyPoolType.Liquidity">
            <span>{{ $t('dao.actionCard.pool') }}</span>
            <span></span>
          </div>
          <template v-if="actionDatasForm.poolType === miningSupplyPoolType.Liquidity">
            <el-form-item>
              <el-select v-model="actionDatasForm.poolAddress" filterable
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
          </template>
          <template v-if="actionDatasForm.poolType === miningSupplyPoolType.Uniswap">
            <el-form-item>
              <el-select v-model="actionDatasForm.poolAddress" :placeholder="$t('dao.actionCard.selectMiningPool')"
                         :disabled="disableAction">
                <el-option
                    v-for="item in uniswapMiningPoolOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value">
                  <span>{{ item.label }} ({{ item.value | ellipsisMiddle(6, 4) }})</span>
                </el-option>
              </el-select>
            </el-form-item>
          </template>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Watch, Ref, Mixins, Prop } from 'vue-property-decorator'
import BigNumber from 'bignumber.js'
import { ElForm } from 'element-ui/types/form'
import SetMiningSupplyActionMixin from '@/template/components/DAO/Actions/setMiningSupplyActionMixin'

@Component
export default class SetMiningSupplyAction extends Mixins(SetMiningSupplyActionMixin) {
  @Prop({ default: false }) disableAction !: boolean
  @Ref('form') formRef !: ElForm

  mounted() {
    this.formRef.validateField(Object.keys(this.formRule))
  }

  updated() {
    this.onFormValidatorStateChanged()
  }

  private formRule = {
    supplyAmount: [
      { validator: this.validateSupplyAmount, trigger: 'change' },
    ],
  }

  get formValidatorIsPass(): boolean {
    return !this.invalidSupplyAmount && !this.invalidAssetsTokenAddress && !this.invalidAssetsTokenDecimals
      && !this.invalidPoolAddress && !this.invalidGovernorAddress
  }

  validateSupplyAmount(rule: any, value: string, callback: Function) {
    const val = this.actionDatasForm.supplyAmount
    if (val === '' || this.actionDatasForm.poolType === 'liquidity') {
      callback()
      return
    }
    const amount = new BigNumber(val)
    if (amount.isNaN() || amount.lt(0) || amount.gt(this.selectedVaultAssetBalance)) {
      callback(new Error(this.$t('commonErrors.insufficientAmountError').toString()))
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

.set-mining-supply-action {}
</style>
