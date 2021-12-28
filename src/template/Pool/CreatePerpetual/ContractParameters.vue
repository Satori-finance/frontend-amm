<template>
  <div class="contract-parameters">
    <!-- edit status dom -->
    <div class="editable" v-show="showEdit">
      <McLoading :show-loading-text="false" :show-loading="loadingLpFee">
        <el-form
          label-width="326px"
          ref="form"
          :model="form"
          :rules="formRules"
          :inline-message="true"
          @submit.native.prevent
        >
          <el-form-item prop="IMRate">
            <template #label>
              <span>{{ $t('contractInfo.contractParams.maxLeverage') }}</span>
              <el-tooltip placement="top" :content="$t('contractInfo.contractParams.maxLeveragePrompt')">
                <div slot="content"><span v-html="$t('contractInfo.contractParams.maxLeveragePrompt')"></span></div>
                <i class="iconfont icon-help-icon"></i>
              </el-tooltip>
            </template>
            <div class="multiple-item control-item">
              <el-tooltip placement="top" :manual="true" :value="toolTip.maxLev">
                <div slot="content"><span v-html="$t('contractInfo.contractParams.maxLeveragePrompt')"></span></div>
                <el-input
                  @focus="toolTip.maxLev = true"
                  @blur="toolTip.maxLev = false"
                  v-model.trim="maxLeverage"
                  @input="validate('IMRate')"
                >
                  <template slot="suffix">x</template>
                </el-input>
              </el-tooltip>
              <div class="join">=</div>
              <el-form-item label-width="190px">
                <template #label>
                  <span>{{ $t('contractInfo.contractParams.initialMarginRate') }}</span>
                  <el-tooltip placement="top">
                    <div slot="content">
                      <span v-html="$t('contractInfo.contractParams.initialMarginRatePrompt')"></span>
                    </div>
                    <i class="iconfont icon-help-icon"></i>
                  </el-tooltip>
                </template>
                <el-tooltip placement="top" :manual="true" :value="toolTip.initialMR">
                  <div slot="content">
                    <span v-html="$t('contractInfo.contractParams.initialMarginRatePrompt')"></span>
                  </div>
                  <el-input
                    @focus="toolTip.initialMR = true"
                    @blur="toolTip.initialMR = false"
                    v-model.trim="initialMarginRate"
                    disabled
                  >
                    <template slot="suffix">%</template>
                  </el-input>
                </el-tooltip>
              </el-form-item>
            </div>
            <div class="warning-msg-line" v-if="isExceedMaxLeverageWarning">
              {{ $t('newContract.exceedMaxLeverageWarning') }}
            </div>
          </el-form-item>

          <el-form-item prop="defaultTargetLeverage">
            <template #label>
              <span>{{ $t('contractInfo.contractParams.defaultTargetLeverage') }}</span>
              <el-tooltip placement="top">
                <div slot="content">
                  <span v-html="$t('contractInfo.contractParams.defaultTargetLeveragePrompt')"></span>
                </div>
                <i class="iconfont icon-help-icon"></i>
              </el-tooltip>
            </template>
            <el-tooltip placement="top" :manual="true" :value="toolTip.defaultLeverage">
              <div slot="content">
                <span v-html="$t('contractInfo.contractParams.defaultTargetLeveragePrompt')"></span>
              </div>
              <el-input
                class="control-item"
                @focus="toolTip.defaultLeverage = true"
                @blur="toolTip.defaultLeverage = false"
                v-model.trim="form.defaultTargetLeverage"
              >
                <template slot="suffix">x</template>
              </el-input>
            </el-tooltip>
          </el-form-item>

          <el-form-item prop="mmRate">
            <template #label>
              <span>{{ $t('contractInfo.contractParams.maintenanceMarginRate') }}</span>
              <el-tooltip placement="top">
                <div slot="content">
                  <span v-html="$t('contractInfo.contractParams.maintenanceMarginRatePrompt')"></span>
                </div>
                <i class="iconfont icon-help-icon"></i>
              </el-tooltip>
            </template>
            <div class="control-item">
              <el-tooltip placement="top" :manual="true" :value="toolTip.mmRate">
                <div slot="content">
                  <span v-html="$t('contractInfo.contractParams.maintenanceMarginRatePrompt')"></span>
                </div>
                <el-input
                  @focus="toolTip.mmRate = true"
                  @blur="toolTip.mmRate = false"
                  v-model.trim="maintenanceMarginRate"
                >
                  <template slot="suffix">%</template>
                </el-input>
              </el-tooltip>
            </div>
          </el-form-item>

          <el-form-item>
            <template #label>
              <span>{{ $t('contractInfo.contractParams.vaultFeeRate') }}</span>
              <el-tooltip placement="top">
                <div slot="content"><span v-html="$t('contractInfo.contractParams.vaultFeeRatePrompt')"></span></div>
                <i class="iconfont icon-help-icon"></i>
              </el-tooltip>
            </template>
            <el-tooltip placement="top" :manual="true" :value="toolTip.vaultFR">
              <div slot="content"><span v-html="$t('contractInfo.contractParams.vaultFeeRatePrompt')"></span></div>
              <el-input
                class="control-item"
                @focus="toolTip.vaultFR = true"
                @blur="toolTip.vaultFR = false"
                :value="form.vaultFeeRate"
                disabled
              >
                <template slot="suffix">%</template>
              </el-input>
            </el-tooltip>
          </el-form-item>

          <el-form-item prop="operatorFeeRate">
            <template #label>
              <span>{{ $t('contractInfo.contractParams.operatorFeeRate') }}</span>
              <el-tooltip placement="top">
                <div slot="content"><span v-html="$t('contractInfo.contractParams.operatorFeeRatePrompt')"></span></div>
                <i class="iconfont icon-help-icon"></i>
              </el-tooltip>
            </template>
            <el-tooltip placement="top" :manual="true" :value="toolTip.operatorFR">
              <div slot="content"><span v-html="$t('contractInfo.contractParams.operatorFeeRatePrompt')"></span></div>
              <el-input
                class="control-item"
                @focus="toolTip.operatorFR = true"
                @blur="toolTip.operatorFR = false"
                v-model.trim="form.operatorFeeRate"
              >
                <template slot="suffix">%</template>
              </el-input>
            </el-tooltip>
          </el-form-item>

          <el-form-item prop="lpFeeRate">
            <template #label>
              <span>{{ $t('contractInfo.contractParams.lpFeeRate') }}</span>
              <el-tooltip placement="top">
                <div slot="content"><span v-html="$t('contractInfo.contractParams.lpFeeRatePrompt')"></span></div>
                <i class="iconfont icon-help-icon"></i>
              </el-tooltip>
            </template>
            <el-tooltip placement="top" :manual="true" :value="toolTip.lpFR">
              <div slot="content"><span v-html="$t('contractInfo.contractParams.lpFeeRatePrompt')"></span></div>
              <el-input
                class="control-item"
                @focus="toolTip.lpFR = true"
                @blur="toolTip.lpFR = false"
                v-model.trim="form.lpFeeRate"
              >
                <template slot="suffix">%</template>
              </el-input>
            </el-tooltip>
          </el-form-item>

          <el-form-item prop="liquidationPenaltyRate">
            <template #label>
              <span>{{ $t('contractInfo.contractParams.liquidationPenaltyRate') }}</span>
              <el-tooltip placement="top">
                <div slot="content">
                  <span v-html="$t('contractInfo.contractParams.liquidationPenaltyRatePrompt')"></span>
                </div>
                <i class="iconfont icon-help-icon"></i>
              </el-tooltip>
            </template>
            <el-tooltip placement="top" :manual="true" :value="toolTip.liqPR">
              <div slot="content">
                <span v-html="$t('contractInfo.contractParams.liquidationPenaltyRatePrompt')"></span>
              </div>
              <el-input
                class="control-item"
                @focus="toolTip.liqPR = true"
                @blur="toolTip.liqPR = false"
                v-model.trim="form.liquidationPenaltyRate"
              >
                <template slot="suffix">%</template>
              </el-input>
            </el-tooltip>
          </el-form-item>

          <el-form-item prop="insuranceFundRate">
            <template #label>
              <span>{{ $t('contractInfo.contractParams.insuranceFundRate') }}</span>
              <el-tooltip placement="top">
                <div slot="content"><span v-html="$t('contractInfo.contractParams.insuranceFundRatePrompt')"></span>
                </div>
                <i class="iconfont icon-help-icon"></i>
              </el-tooltip>
            </template>
            <el-tooltip placement="top" :manual="true" :value="toolTip.insuranceFR">
              <div slot="content"><span v-html="$t('contractInfo.contractParams.insuranceFundRatePrompt')"></span></div>
              <el-input
                class="control-item"
                @focus="toolTip.insuranceFR = true"
                @blur="toolTip.insuranceFR = false"
                v-model.trim="form.insuranceFundRate"
              >
                <template slot="suffix">%</template>
              </el-input>
            </el-tooltip>
          </el-form-item>

          <div class="input-line-item">
            <el-form-item prop="keeperGasReward">
              <template #label>
                <span>{{ $t('contractInfo.contractParams.keeperGasReward') }}</span>
                <el-tooltip placement="top">
                  <div slot="content"><span v-html="$t('contractInfo.contractParams.keeperGasRewardPrompt')"></span>
                  </div>
                  <i class="iconfont icon-help-icon"></i>
                </el-tooltip>
              </template>
              <div slot="content"><span v-html="$t('contractInfo.contractParams.keeperGasRewardPrompt')"></span></div>
              <el-input
                class="control-item"
                v-model.trim="form.keeperGasReward"
                @input='changeIsShowFormValidate'
                :class="{'warning-input': form.keeperGasReward.trim() === ''}"
              >
                <template slot="suffix">{{ collateralSymbol }}</template>
              </el-input>
            </el-form-item>
            <!--          <div class="error-msg-line input-msg-line dots" v-if="form.keeperGasReward.trim() === ''">-->
            <!--            {{ $t('commonErrors.inputNullError') }}-->
            <!--          </div>-->
            <div class="warning-msg-line input-msg-line dots">
              {{ $t('contractInfo.contractParams.keeperGasRewardTip') }}
            </div>
          </div>

          <el-form-item prop="referrerRebateRate">
            <template #label>
              <span>{{ $t('contractInfo.contractParams.referrerRebateRate') }}</span>
              <el-tooltip placement="top">
                <div slot="content"><span v-html="$t('contractInfo.contractParams.referrerRebatePrompt')"></span></div>
                <i class="iconfont icon-help-icon"></i>
              </el-tooltip>
            </template>
            <el-tooltip placement="top" :manual="true" :value="toolTip.referrerRebateRate">
              <div slot="content"><span v-html="$t('contractInfo.contractParams.referrerRebatePrompt')"></span></div>
              <el-input
                class="control-item"
                @focus="toolTip.referrerRebateRate = true"
                @blur="toolTip.referrerRebateRate = false"
                v-model.trim="form.referrerRebateRate"
              >
                <template slot="suffix">%</template>
              </el-input>
            </el-tooltip>
          </el-form-item>

          <el-form-item prop="maxOpenInterestRate" style="margin-bottom: 10px;">
            <template #label>
              <span>{{ $t('contractInfo.contractParams.maxOpenInterestRate') }}</span>
              <el-tooltip placement="top">
                <div slot="content">
                  <span v-html="$t('contractInfo.contractParams.maxOpenInterestRatePrompt')"></span>
                </div>
                <i class="iconfont icon-help-icon"></i>
              </el-tooltip>
            </template>
            <el-tooltip placement="top" :manual="true" :value="toolTip.maxOpenInterestRate">
              <div slot="content"><span v-html="$t('contractInfo.contractParams.maxOpenInterestRatePrompt')"></span>
              </div>
              <el-input
                class="control-item"
                @focus="toolTip.maxOpenInterestRate = true"
                @blur="toolTip.maxOpenInterestRate = false"
                v-model.trim="form.maxOpenInterestRate"
              >
                <span slot="suffix">x</span>
              </el-input>
            </el-tooltip>
          </el-form-item>

          <el-form-item style="margin-bottom: 0;">
            <template #label>
              <span>{{ $t('contractInfo.contractParams.tradeFeeRate') }}</span>
            </template>
            <span class="text-line">
            = {{ $t('contractInfo.contractParams.vaultFeeRate') }} +
          {{ $t('contractInfo.contractParams.operatorFeeRate') }} + {{ $t('contractInfo.contractParams.lpFeeRate') }} =
          <span class="value">{{ tradeFee.isNaN() ? '' : tradeFee.toFormat() }}%</span>
          </span>
          </el-form-item>

          <el-form-item v-if="!(poolStorage && !poolStorage.isFastCreationEnabled) || selectPoolAddress === ''">
            <template #label>
              <span>{{ $t('contractInfo.contractParams.display') }}</span>
              <el-tooltip placement="top">
                <div slot="content">
                  <span v-html="inverseDisplayPrompt"></span>
                </div>
                <i class="iconfont icon-help-icon"></i>
              </el-tooltip>
            </template>
            <el-radio-group v-model="form.isInverse">
              <el-radio :label="false">{{ $t('base.vanilla') }}</el-radio>
              <el-radio :label="true">{{ $t('base.inverse') }}</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label=" ">
            <el-button class="control-item" @click="onNextEvent" :disabled="nextButtonIsDisabled">
              {{ $t('base.next') }}
            </el-button>
          </el-form-item>
        </el-form>
      </McLoading>
    </div>
    <!-- readonly view status dom-->
    <div class="readonly" v-if="!showEdit">
      <table class="mc-data-table mc-data-table--border is-medium">
        <tbody>
        <tr>
          <td>{{ $t('contractInfo.contractParams.maxLeverage') }}</td>
          <td class="value">{{ form.maxLeverage }}x</td>
          <td><span class="value">=</span>{{ $t('contractInfo.contractParams.initialMarginRate') }}</td>
          <td class="value">{{ form.initialMarginRate }} %</td>
        </tr>
        <tr>
          <td>{{ $t('contractInfo.contractParams.defaultTargetLeverage') }}</td>
          <td class="value">{{ form.defaultTargetLeverage }} x</td>
          <td></td>
          <td></td>
        </tr>
        <tr>
          <td>{{ $t('contractInfo.contractParams.maintenanceMarginRate') }}</td>
          <td class="value">{{ form.maintenanceMarginRate }} %</td>
          <td></td>
          <td></td>
        </tr>
        <tr>
          <td>{{ $t('contractInfo.contractParams.liquidationPenaltyRate') }}</td>
          <td class="value">{{ form.liquidationPenaltyRate }} %</td>
          <td></td>
          <td></td>
        </tr>
        <tr>
          <td>{{ $t('contractInfo.contractParams.insuranceFundRate') }}</td>
          <td class="value">{{ form.insuranceFundRate }} %</td>
          <td></td>
          <td></td>
        </tr>
        <tr>
          <td>{{ $t('contractInfo.contractParams.keeperGasReward') }}</td>
          <td class="value">{{ form.keeperGasReward }} {{ collateralSymbol }}</td>
          <td></td>
          <td></td>
        </tr>
        <tr>
          <td>{{ $t('contractInfo.contractParams.referrerRebateRate') }}</td>
          <td class="value">{{ form.referrerRebateRate }} %</td>
          <td></td>
          <td></td>
        </tr>
        <tr>
          <td>{{ $t('contractInfo.contractParams.maxOpenInterestRate') }}</td>
          <td class="value">{{ form.maxOpenInterestRate }}x</td>
          <td></td>
          <td></td>
        </tr>
        <tr>
          <td>{{ $t('contractInfo.contractParams.vaultFeeRate') }}</td>
          <td class="value">{{ form.vaultFeeRate }} %</td>
          <td rowspan="3" colspan="2" class="trade-fee-value">
            <p class="value">{{ tradeFee.toFormat() }} %</p>
            <p>{{ $t('contractInfo.contractParams.tradeFeeRate') }}</p>
          </td>
        </tr>
        <tr>
          <td>{{ $t('contractInfo.contractParams.operatorFeeRate') }}</td>
          <td class="value">{{ form.operatorFeeRate }} %</td>
        </tr>
        <tr>
          <td>{{ $t('contractInfo.contractParams.lpFeeRate') }}</td>
          <td class="value">{{ form.lpFeeRate }} %</td>
        </tr>
        <tr>
          <td>{{ $t('contractInfo.contractParams.display') }}</td>
          <td class="value">{{ form.isInverse ? $t('base.inverse') : $t('base.vanilla') }}</td>
          <td></td>
          <td></td>
        </tr>
        </tbody>
      </table>
      <div class="action" v-if="!created && !readonly">
        <el-button type="secondary" :disabled="creating" @click="onEdit">{{ $t('base.edit') }}</el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Ref, Watch } from 'vue-property-decorator'
import { LiquidityContractParams, LiquidityOracleParams } from '@/template/Pool/type'
import { ElForm } from 'element-ui/types/form'
import { toBigNumber } from '@/utils'
import { _1, getLiquidityPool, getReaderContract, LiquidityPoolStorage } from '@mcdex/mai3.js'
import { LEVERAGE_DECIMALS } from '@/constants'
import AsyncComputed from '@romancow/vue-async-computed-decorator'
import BigNumber from 'bignumber.js'
import { namespace } from 'vuex-class'
import { Provider } from '@ethersproject/providers'
import { ErrorHandlerMixin } from '@/mixins'
import { OracleLinkWithTunable, OracleVendor } from '@/config/oracle'
import { getTunableOracleInfo, getExternalOracleInfo } from '@/utils/oracle'
import { McLoading } from '@/components'

const vaultFeeRate: string = '0.015' // TODO: only show, read source ???
// 0.075% = lp 0.055% + vault 0.015% + op 0.005%
const initialData = {
  initialMarginRate: '10', // %
  maxLeverage: '10', // x
  maintenanceMarginRate: '5', // %
  vaultFeeRate: vaultFeeRate, // %
  operatorFeeRate: '0.05', // %
  lpFeeRate: '0.185', // %
  liquidationPenaltyRate: '1', // %
  insuranceFundRate: '50', // %
  keeperGasReward: '', // $
  referrerRebateRate: '20', // %
  maxOpenInterestRate: '1', // x
  defaultTargetLeverage: '5', // x, don't forget SetRiskParams also has a same defaultTargetLeverage
  isInverse: false,   // inverseServerContract params
}

const wallet = namespace('wallet')

@Component({
  components: {
    McLoading,
  },
})
export default class ContractParameters extends Mixins(ErrorHandlerMixin) {
  @wallet.Getter('provider') provider!: Provider

  @Prop({ default: '', required: true }) collateralSymbol!: string
  @Prop({ default: '', required: true }) underlyingSymbol!: string
  @Prop({ default: false, required: true }) creating!: boolean
  @Prop({ default: false, required: true }) created!: boolean
  @Prop({ default: false, required: true }) readonly!: boolean
  @Prop({ default: () => null }) selectPoolAddress!: string | null
  @Prop({ default: () => null }) selectedOracle!: LiquidityOracleParams | null

  @Ref('form') formRef!: ElForm

  private rateDecimals: number = 2
  private isShowFormValidate: boolean = false
  private loadingLpFee = false
  poolStorage: LiquidityPoolStorage | null = null
  status: 'editable' | 'readonly' = 'editable'
  toolTip = {
    initialMR: false,
    maxLev: false,
    mmRate: false,
    latLiq: false,
    vaultFR: false,
    operatorFR: false,
    lpFR: false,
    liqPR: false,
    insuranceFR: false,
    insuranceFM: false,
    keeperGR: false,
    referrerRebateRate: false,
    maxOpenInterestRate: false,
    defaultLeverage: false,
  }

  private form = { ...initialData }

  private formRules = {
    IMRate: [
      { validator: this.validateIMRate, trigger: 'change' },
      { validator: this.validateMarginRate, trigger: 'change' },
    ],
    mmRate: [
      { validator: this.validateMMRate, trigger: 'change' },
      { validator: this.validateMarginRate, trigger: 'change' },
    ],
    operatorFeeRate: [
      { validator: this.validateInputIsNumber, trigger: 'change' },
      { validator: this.validateValidRate, trigger: 'change' },
      { validator: this.validateOperatorFeeRate, trigger: 'change' },
    ],
    lpFeeRate: [
      { validator: this.validateInputIsNumber, trigger: 'change' },
      { validator: this.validateValidRate, trigger: 'change' },
      { validator: this.validateLpFeeRate, trigger: 'change' },
    ],
    liquidationPenaltyRate: [
      { validator: this.validateInputIsNumber, trigger: 'change' },
      { validator: this.validateMarginRate, trigger: 'change' },
    ],
    insuranceFundRate: [
      { validator: this.validateInputIsNumber, trigger: 'change' },
      { validator: this.validateValidRate, trigger: 'change' },
    ],
    keeperGasReward: [
      { validator: this.validateInputIsNumber, trigger: 'change' },
      { validator: this.validateKeeperGasReward, trigger: 'change' },
    ],
    referrerRebateRate: [
      { validator: this.validateInputIsNumber, trigger: 'change' },
      { validator: this.validateValidRate, trigger: 'change' },
    ],
    maxOpenInterestRate: [{ validator: this.validateInputIsNumber, trigger: 'change' }],
    defaultTargetLeverage: [
      { validator: this.validateInputIsNumber, trigger: 'change' },
      { validator: this.validateDefaultTargetLev, trigger: 'change' },
    ],
  }

  get showEdit() {
    return !this.creating && !this.created && this.status === 'editable'
  }

  get normalizeForm(): LiquidityContractParams {
    return {
      initialMarginRate: new BigNumber(this.form.initialMarginRate).div(100),
      maxLeverage: new BigNumber(this.form.maxLeverage),
      maintenanceMarginRate: new BigNumber(this.form.maintenanceMarginRate).div(100),
      vaultFeeRate: new BigNumber(this.form.vaultFeeRate).div(100),
      operatorFeeRate: new BigNumber(this.form.operatorFeeRate).div(100),
      lpFeeRate: new BigNumber(this.form.lpFeeRate).div(100),
      liquidationPenaltyRate: new BigNumber(this.form.liquidationPenaltyRate).div(100),
      insuranceFundRate: new BigNumber(this.form.insuranceFundRate).div(100),
      keeperGasReward: new BigNumber(this.form.keeperGasReward),
      referrerRebateRate: new BigNumber(this.form.referrerRebateRate).div(100),
      maxOpenInterestRate: new BigNumber(this.form.maxOpenInterestRate),
      defaultTargetLeverage: new BigNumber(this.form.defaultTargetLeverage),
      isInverse: this.form.isInverse,
    }
  }

  get tradeFee(): BigNumber {
    return this.normalizeForm.vaultFeeRate
      .plus(this.normalizeForm.operatorFeeRate)
      .plus(this.normalizeForm.lpFeeRate)
      .times(100)
  }

  get nextButtonIsDisabled(): boolean {
    // return !this.isValidForm
    return false
  }

  @AsyncComputed({
    watch: ['isValidForm'],
  })
  get formValidatorStatus() {
    return this.validateIsPass()
  }

  get isValidForm(): boolean {
    let checkStatus: boolean = true
    for (let val of Object.values(this.form)) {
      if (!this.isValidNumber(val)) {
        checkStatus = false
        break
      }
    }
    if (!checkStatus) return false
    const newCheckStatus = this.formValidatorStatus
    if (!newCheckStatus) {
      return false
    }
    return true
  }

  get initialMarginRate(): string {
    return this.form.initialMarginRate
  }

  set initialMarginRate(val: string) {
    this.form.initialMarginRate = val
    this.onInitialMarginRateChanged()
  }

  get maxLeverage(): string {
    return this.form.maxLeverage
  }

  set maxLeverage(val: string) {
    this.form.maxLeverage = val
    this.onMaxLeverageChanged()
  }

  get maintenanceMarginRate(): string {
    return this.form.maintenanceMarginRate
  }

  set maintenanceMarginRate(val: string) {
    this.form.maintenanceMarginRate = val
  }

  get isExceedMaxLeverageWarning() {
    const leverage = Number(this.maxLeverage)
    return !isNaN(leverage) && leverage > 15
  }

  get inverseDisplayPrompt(): string {
    return this.$t('contractInfo.contractParams.displayPrompt', {
      collateral: this.collateralSymbol,
      underlying: this.underlyingSymbol,
    }).toString()
  }

  isValidNumber(val: any): boolean {
    const newVal = Number(val)
    return !(isNaN(newVal) || newVal < 0 || val === '')
  }

  onInitialMarginRateChanged() {
    const initialMarginRate = toBigNumber(this.form.initialMarginRate)
    if (initialMarginRate.isNaN() || this.form.initialMarginRate === '' || initialMarginRate.lte(0)) {
      this.form.maxLeverage = ''
      return
    }
    this.form.maxLeverage = _1.div(initialMarginRate.div(100)).toFixed(LEVERAGE_DECIMALS)
  }

  onMaxLeverageChanged() {
    const maxLeverage = toBigNumber(this.form.maxLeverage)
    if (maxLeverage.isNaN() || this.form.maxLeverage === '' || maxLeverage.lte(0)) {
      this.form.initialMarginRate = ''
      return
    }
    this.form.initialMarginRate = _1
      .div(maxLeverage)
      .times(100)
      .toFixed(this.rateDecimals)
  }

  // validate start
  private validate(field: string) {
    this.formRef.validateField(field)
  }

  validateInputIsNumber(rule: any, value: string, callback: Function) {
    if (value === '') {
      callback()
      return
    }
    const valueFloat = Number(value)
    if (isNaN(valueFloat) || valueFloat < 0) {
      callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
    } else {
      callback()
    }
  }

  validateKeeperGasReward(rule: any, value: string, callback: Function) {
    if (value === '' && this.isShowFormValidate) {
      callback(new Error(this.$t('commonErrors.inputNullError').toString()))
      return
    }
    callback()
  }

  validateLpFeeRate(rule: any, value: string, callback: Function) {
    if (value === '') {
      callback()
      return
    }
    const valueFloat = Number(value)
    if (isNaN(valueFloat) || valueFloat < 0 || valueFloat > 1 ) {
      callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
    } else {
      callback()
    }
  }

  validateOperatorFeeRate(rule: any, value: string, callback: Function) {
    if (value === '') {
      callback()
      return
    }
    const valueFloat = Number(value)
    if (isNaN(valueFloat) || valueFloat < 0 || valueFloat >= 1) {
      callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
    } else {
      callback()
    }
  }

  validateIMRate(rule: any, value: string, callback: Function) {
    if (this.initialMarginRate === '' && this.maxLeverage === '') {
      callback()
      return
    }
    const initialMarginRate = Number(this.initialMarginRate)
    const maxLeverage = Number(this.maxLeverage)
    if (isNaN(initialMarginRate) || initialMarginRate < 0 || isNaN(maxLeverage) || maxLeverage <= 0) {
      callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
    } else {
      callback()
    }
  }

  validateMMRate(rule: any, value: string, callback: Function) {
    if (this.maintenanceMarginRate === '') {
      callback()
      return
    }
    const maintenanceMarginRate = Number(this.maintenanceMarginRate)
    if (isNaN(maintenanceMarginRate) || maintenanceMarginRate <= 0) {
      callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
    } else {
      callback()
    }
  }

  validateMarginRate(rule: any, value: string, callback: Function) {
    const initialMarginRate = Number(this.form.initialMarginRate)
    const maintenanceMarginRate = Number(this.form.maintenanceMarginRate)
    const liquidationPenaltyRate = Number(this.form.liquidationPenaltyRate)
    if (initialMarginRate <= maintenanceMarginRate || maintenanceMarginRate <= liquidationPenaltyRate) {
      callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
    } else {
      callback()
    }
  }

  validateValidRate(rule: any, value: string, callback: Function) {
    const valueFloat = Number(value)
    if (valueFloat < 0 || valueFloat > 100) {
      callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
    } else {
      callback()
    }
  }

  validateDefaultTargetLev(rule: any, value: string, callback: Function) {
    const defaultTargetLev = new BigNumber(this.form.defaultTargetLeverage)
    const isInt = defaultTargetLev.eq(defaultTargetLev.dp(0))
    if (defaultTargetLev.lt(1) || defaultTargetLev.gt(this.normalizeForm.maxLeverage) || !isInt) {
      callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
    } else {
      callback()
    }
  }

  async validateIsPass(): Promise<boolean> {
    const form = this.$refs.form as ElForm
    let valid: boolean
    try {
      valid = await form.validate()
    } catch {
      return false
    }
    return valid
  }

  // validate end

  @Watch('selectPoolAddress')
  async onPoolAddressChange() {
    await this.callChainReadFunc(async () => {
      if (!this.selectPoolAddress) {
        this.form.vaultFeeRate = initialData.vaultFeeRate
        return
      }
      const reader = await getReaderContract(this.provider)
      this.poolStorage = await getLiquidityPool(reader, this.selectPoolAddress)
      this.form.vaultFeeRate = this.poolStorage.vaultFeeRate.times(100).toFixed()
    })
  }

  @Watch('selectedOracle', { immediate: true })
  async onSelectedOracleChange() {
    if (!this.selectedOracle || this.selectedOracle.type !== 'registered') {
      return
    }
    this.loadingLpFee = true
    try {
      const oracles = this.selectedOracle.oracleRouterPath as OracleLinkWithTunable[]
      if (oracles.length === 1 && oracles[0].oracle.vendor === OracleVendor.SATORI) {
        this.form.lpFeeRate = '0.04'
        return
      }
      if (oracles.filter(o => o.isTunable || o.oracle.canTune).length === oracles.length) { // oracles are mcdex or chainlink, not others
        const deviations = await Promise.all(oracles.map(async o => {
          if (o.isTunable) {
            const info = await getTunableOracleInfo(o.oracle.address)
            return info?.deviation || null
          } else if (o.oracle.canTune) {
            const info = await getExternalOracleInfo(o.oracle.address)
            return info?.deviation || null
          } else {
            return null
          }
        }))
        const defaultLpFee = BigNumber.min(BigNumber.max(...deviations.filter(d => d !== null).map(d => d!.toString())), 0.01)
        this.form.lpFeeRate = defaultLpFee.isNaN() || defaultLpFee.lte(0) ? this.form.lpFeeRate : defaultLpFee.times(100).toString()
      }
    } finally {
      this.loadingLpFee = false
    }
  }

  async onNextEvent() {
    this.changeIsShowFormValidate()
    await this.validateIsPass()
    if (!this.isValidForm) {
      return
    }
    this.status = 'readonly'
    this.$emit('change', this.normalizeForm)
  }

  onEdit() {
    this.status = 'editable'
    this.form.isInverse = false
    this.$emit('change', null)
  }

  reset() {
    this.status = 'editable'
    this.form = { ...initialData }
    this.isShowFormValidate = false
  }

  changeIsShowFormValidate() {
    this.isShowFormValidate = true
  }
}
</script>

<style scoped lang="scss">
@import 'contract-form';

.contract-parameters {
  .multiple-item.control-item {
    .el-input {
      width: 113px;
    }

    .el-form-item {
      ::v-deep .el-form-item__label {
        text-align: right;
        padding-right: 20px;
      }
    }

    .join {
      color: var(--mc-text-color-white);
      width: 34px;
      text-align: right;
    }
  }

  ::v-deep {
    .el-input__inner {
      text-align: right;
    }

    .el-input.is-disabled {
      background: var(--mc-background-color-dark-light);
    }
  }

  .text-line {
    color: var(--mc-text-color);
    font-size: 14px;
    text-align: center;

    .value {
      color: var(--mc-text-color-white);
    }
  }

  .readonly {
    .mc-data-table,
    .action {
      width: 730px;
      margin: auto;
    }

    .mc-data-table--border {
      td {
        border: unset;

        &.border-cell {
          border-left: 1px solid var(--mc-border-color);
        }
      }

      tr {
        border: 1px solid var(--mc-border-color);
      }
    }

    table {
      thead,
      tbody {
        font-size: 14px;
        font-weight: 400;
      }

      tbody {
        color: var(--mc-text-color);

        tr {
          text-align: left;

          td:nth-of-type(1) {
            width: 25%;
            padding-left: 6px;
          }

          td:nth-of-type(2) {
            width: 15%;
          }

          td:nth-of-type(3) {
            width: 20%;
            padding-left: 6px;
          }

          td:nth-of-type(4) {
            width: 10%;
          }
        }
      }

      .value {
        color: var(--mc-text-color-white);
      }

      .trade-fee-value {
        text-align: center;
        line-height: 24px;
        border: 1px solid var(--mc-border-color);
      }
    }

    .action {
      margin-top: 45px;
      text-align: left;

      .el-button {
        width: 120px;
      }
    }
  }

  .input-line-item {
    margin-bottom: 20px;

    .input-msg-line {
      margin-left: 328px;
    }

    ::v-deep {
      .el-form-item {
        margin-bottom: 6px;
      }
    }
  }

  .dots {
    &::before {
      content: '●';
      margin-right: 4px;
    }
  }

  ::v-deep {
    .warning-msg-line {
      color: var(--mc-color-warning);
      font-size: 13px;
      line-height: 24px;
      width: 450px;
    }

    .error-msg-line {
      color: var(--mc-color-error);
      font-size: 13px;
      line-height: 24px;
      width: 450px;
    }

    .warning-input {
      border-color: var(--mc-color-warning);
    }
  }
}
</style>
