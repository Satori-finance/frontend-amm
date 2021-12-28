<template>
  <div class="risk-params">
    <div class="title mc-font-h5-bold">{{ $t('contractInfo.modifyRiskParams.title') }}</div>

    <McLoading :show-loading="loading">
      <div class="content-box">
        <div class="risk-field">
          <div class="config mc-font-h4-bold">{{ $t('contractInfo.riskParams.config') }}</div>
          <el-form
            label-width="240px"
            ref="form"
            v-model="form"
            :rules="rules"
            :inline-message="true"
            @submit.native.prevent
          >
            <!-- defaultTargetLeverage-->
            <el-form-item prop="defaultTargetLeverage">
              <template #label>
                <span>{{ $t('contractInfo.contractParams.defaultTargetLeverage') }}</span>
                <el-tooltip placement="top" :content="$t('contractInfo.contractParams.defaultTargetLeveragePrompt')">
                  <i class="iconfont icon-help-icon"></i>
                </el-tooltip>
              </template>
              <el-tooltip
                placement="top"
                :content="$t('contractInfo.contractParams.defaultTargetLeveragePrompt')"
                :manual="true"
                :value="toolTip.defaultLev"
              >
                <el-input
                  v-model="form.defaultTargetLeverage"
                  class="control-item"
                  @focus="toolTip.defaultLev = true"
                  @blur="toolTip.defaultLev = false"
                >
                  <template #suffix>x</template>
                </el-input>
              </el-tooltip>
            </el-form-item>
            <!--half spread-->
            <el-form-item>
              <template #label>
                <span>{{ $t('contractInfo.riskParams.rangeHalfSpread') }}</span>
                <el-tooltip placement="top" :content="$t('contractInfo.riskParams.minPrompt')">
                  <i class="iconfont icon-help-icon"></i>
                </el-tooltip>
              </template>
              <div class="multiple-item control-item">
                <el-tooltip
                  placement="top"
                  :content="$t('contractInfo.riskParams.minPrompt')"
                  :manual="true"
                  :value="toolTip.minHSP"
                >
                  <el-input
                    v-model="form.minHalfSpread"
                    @focus="toolTip.minHSP = true"
                    @blur="toolTip.minHSP = false"
                    disabled
                  >
                    <template #suffix>%</template>
                  </el-input>
                </el-tooltip>
                <el-form-item label="~" :label-width="labelWidth">
                  <el-tooltip
                    placement="top"
                    :content="$t('contractInfo.riskParams.maxPrompt')"
                    :manual="true"
                    :value="toolTip.maxHSP"
                  >
                    <el-input
                      v-model="form.maxHalfSpread"
                      @input="validate('minMaxHalfSpread')"
                      disabled
                      @focus="toolTip.maxHSP = true"
                      @blur="toolTip.maxHSP = false"
                    >
                      <template #suffix>%</template>
                    </el-input>
                  </el-tooltip>
                </el-form-item>
              </div>
            </el-form-item>
            <el-form-item prop="halfSpread">
              <template #label>
                <span>{{ $t('contractInfo.riskParams.halfSpread') }}</span>
                <el-tooltip placement="top" :content="$t('contractInfo.riskParams.halfSpreadPrompt')">
                  <i class="iconfont icon-help-icon"></i>
                </el-tooltip>
              </template>
              <el-tooltip
                placement="top"
                :content="$t('contractInfo.riskParams.halfSpreadPrompt')"
                :manual="true"
                :value="toolTip.HSP"
              >
                <el-input
                  v-model="form.halfSpread"
                  class="control-item"
                  @focus="toolTip.HSP = true"
                  @blur="toolTip.HSP = false"
                >
                  <template #suffix>%</template>
                </el-input>
              </el-tooltip>
            </el-form-item>

            <!--open slippage-->
            <el-form-item>
              <template #label>
                <span v-html="$t('contractInfo.riskParams.rangeOpenSlippage')"></span>
                <el-tooltip placement="top" :content="$t('contractInfo.riskParams.minPrompt')">
                  <i class="iconfont icon-help-icon"></i>
                </el-tooltip>
              </template>
              <div class="multiple-item control-item">
                <el-tooltip
                  placement="top"
                  :content="$t('contractInfo.riskParams.minPrompt')"
                  :manual="true"
                  :value="toolTip.minOSP"
                >
                  <el-input
                    v-model="form.minOpenSlippage"
                    @focus="toolTip.minOSP = true"
                    disabled
                    @blur="toolTip.minOSP = false"
                  ></el-input>
                </el-tooltip>
                <el-form-item label="~" :label-width="labelWidth">
                  <el-tooltip
                    placement="top"
                    :content="$t('contractInfo.riskParams.maxPrompt')"
                    :manual="true"
                    :value="toolTip.maxOSP"
                  >
                    <el-input
                      v-model="form.maxOpenSlippage"
                      disabled
                      @input="validate('minMaxOpenSlippage')"
                      @focus="toolTip.maxOSP = true"
                      @blur="toolTip.maxOSP = false"
                    ></el-input>
                  </el-tooltip>
                </el-form-item>
              </div>
            </el-form-item>
            <el-form-item prop="openSlippage">
              <template #label>
                <span v-html="$t('contractInfo.riskParams.openSlippage')"></span>
                <el-tooltip placement="top" :content="$t('contractInfo.riskParams.openSlippagePrompt')">
                  <i class="iconfont icon-help-icon"></i>
                </el-tooltip>
              </template>
              <el-tooltip
                placement="top"
                :content="$t('contractInfo.riskParams.openSlippagePrompt')"
                :manual="true"
                :value="toolTip.OSP"
              >
                <el-input
                  v-model="form.openSlippage"
                  class="control-item"
                  @focus="toolTip.OSP = true"
                  @blur="toolTip.OSP = false"
                ></el-input>
              </el-tooltip>
            </el-form-item>

            <!--close slippage-->
            <el-form-item>
              <template #label>
                <span v-html="$t('contractInfo.riskParams.rangeCloseSlippage')"></span>
                <el-tooltip placement="top" :content="$t('contractInfo.riskParams.minPrompt')">
                  <i class="iconfont icon-help-icon"></i>
                </el-tooltip>
              </template>
              <div class="multiple-item control-item">
                <el-tooltip
                  placement="top"
                  :content="$t('contractInfo.riskParams.minPrompt')"
                  :manual="true"
                  :value="toolTip.minCSP"
                >
                  <el-input
                    v-model="form.minCloseSlippage"
                    @focus="toolTip.minCSP = true"
                    disabled
                    @blur="toolTip.minCSP = false"
                  ></el-input>
                </el-tooltip>
                <el-form-item label="~" :label-width="labelWidth">
                  <el-tooltip
                    placement="top"
                    :content="$t('contractInfo.riskParams.maxPrompt')"
                    :manual="true"
                    :value="toolTip.maxCSP"
                  >
                    <el-input
                      v-model="form.maxCloseSlippage"
                      @input="validate('minMaxCloseSlippage')"
                      disabled
                      @focus="toolTip.maxCSP = true"
                      @blur="toolTip.maxCSP = false"
                    ></el-input>
                  </el-tooltip>
                </el-form-item>
              </div>
            </el-form-item>
            <el-form-item prop="closeSlippage">
              <template #label>
                <span v-html="$t('contractInfo.riskParams.closeSlippage')"></span>
                <el-tooltip placement="top" :content="$t('contractInfo.riskParams.closeSlippagePrompt')">
                  <i class="iconfont icon-help-icon"></i>
                </el-tooltip>
              </template>
              <el-tooltip
                placement="top"
                :content="$t('contractInfo.riskParams.closeSlippagePrompt')"
                :manual="true"
                :value="toolTip.CSP"
              >
                <el-input
                  v-model="form.closeSlippage"
                  class="control-item"
                  @focus="toolTip.CSP = true"
                  @blur="toolTip.CSP = false"
                ></el-input>
              </el-tooltip>
            </el-form-item>

            <!--funding rate factor-->
            <el-form-item>
              <template #label>
                <span>{{ $t('contractInfo.riskParams.rangeFundingRateFactor') }}</span>
                <el-tooltip placement="top" :content="$t('contractInfo.riskParams.minPrompt')">
                  <i class="iconfont icon-help-icon"></i>
                </el-tooltip>
              </template>
              <div class="multiple-item control-item">
                <el-tooltip
                  placement="top"
                  :content="$t('contractInfo.riskParams.minPrompt')"
                  :manual="true"
                  :value="toolTip.minFRFP"
                >
                  <el-input
                    v-model="form.minFundingRateFactor"
                    disabled
                    @focus="toolTip.minFRFP = true"
                    @blur="toolTip.minFRFP = false"
                  >
                    <template #suffix>%</template>
                  </el-input>
                </el-tooltip>
                <el-form-item label="~" :label-width="labelWidth">
                  <el-tooltip
                    placement="top"
                    :content="$t('contractInfo.riskParams.maxPrompt')"
                    :manual="true"
                    :value="toolTip.maxFRFP"
                  >
                    <el-input
                      v-model="form.maxFundingRateFactor"
                      disabled
                      @input="validate('minMaxFundingRateFactor')"
                      @focus="toolTip.maxFRFP = true"
                      @blur="toolTip.maxFRFP = false"
                    >
                      <template #suffix>%</template>
                    </el-input>
                  </el-tooltip>
                </el-form-item>
              </div>
            </el-form-item>
            <el-form-item prop="fundingRateFactor">
              <template #label>
                <span>{{ $t('contractInfo.riskParams.fundingRateFactor') }}</span>
                <el-tooltip placement="top" :content="$t('contractInfo.riskParams.fundingRateFactorPrompt')">
                  <i class="iconfont icon-help-icon"></i>
                </el-tooltip>
              </template>
              <el-tooltip
                placement="top"
                :content="$t('contractInfo.riskParams.fundingRateFactorPrompt')"
                :manual="true"
                :value="toolTip.FRFP"
              >
                <el-input
                  v-model="form.fundingRateFactor"
                  class="control-item"
                  @focus="toolTip.FRFP = true"
                  @blur="toolTip.FRFP = false"
                >
                  <template #suffix>%</template>
                </el-input>
              </el-tooltip>
            </el-form-item>

            <!--funding rate limit-->
            <el-form-item>
              <template #label>
                <span>{{ $t('contractInfo.riskParams.rangeFundingRateLimit') }}</span>
                <el-tooltip placement="top" :content="$t('contractInfo.riskParams.minPrompt')">
                  <i class="iconfont icon-help-icon"></i>
                </el-tooltip>
              </template>
              <div class="multiple-item control-item">
                <el-tooltip
                  placement="top"
                  :content="$t('contractInfo.riskParams.minPrompt')"
                  :manual="true"
                  :value="toolTip.minFRLP"
                >
                  <el-input
                    v-model="form.minFundingRateLimit"
                    disabled
                    @focus="toolTip.minFRLP = true"
                    @blur="toolTip.minFRLP = false"
                  >
                    <template #suffix>%</template>
                  </el-input>
                </el-tooltip>
                <el-form-item label="~" :label-width="labelWidth">
                  <el-tooltip
                    placement="top"
                    :content="$t('contractInfo.riskParams.maxPrompt')"
                    :manual="true"
                    :value="toolTip.maxFRLP"
                  >
                    <el-input
                      v-model="form.maxFundingRateLimit"
                      disabled
                      @input="validate('minMaxFundingRateLimit')"
                      @focus="toolTip.maxFRLP = true"
                      @blur="toolTip.maxFRLP = false"
                    >
                      <template #suffix>%</template>
                    </el-input>
                  </el-tooltip>
                </el-form-item>
              </div>
            </el-form-item>
            <el-form-item prop="fundingRateLimit">
              <template #label>
                <span>{{ $t('contractInfo.riskParams.fundingRateLimit') }}</span>
                <el-tooltip placement="top" :content="$t('contractInfo.riskParams.fundingRateLimitPrompt')">
                  <i class="iconfont icon-help-icon"></i>
                </el-tooltip>
              </template>
              <el-tooltip
                placement="top"
                :content="$t('contractInfo.riskParams.fundingRateLimitPrompt')"
                :manual="true"
                :value="toolTip.FRLP"
              >
                <el-input
                  v-model="form.fundingRateLimit"
                  class="control-item"
                  @focus="toolTip.FRLP = true"
                  @blur="toolTip.FRLP = false"
                >
                  <template #suffix>%</template>
                </el-input>
              </el-tooltip>
            </el-form-item>

            <!--AMM max leverage-->
            <el-form-item>
              <template #label>
                <span>{{ $t('contractInfo.riskParams.rangeAMMMaxLeverage') }}</span>
                <el-tooltip placement="top" :content="$t('contractInfo.riskParams.minPrompt')">
                  <i class="iconfont icon-help-icon"></i>
                </el-tooltip>
              </template>
              <div class="multiple-item control-item">
                <el-tooltip
                  placement="top"
                  :content="$t('contractInfo.riskParams.minPrompt')"
                  :manual="true"
                  :value="toolTip.minAMLP"
                >
                  <el-input
                    v-model="form.minAMMMaxLeverage"
                    disabled
                    @focus="toolTip.minAMLP = true"
                    @blur="toolTip.minAMLP = false"
                  ></el-input>
                </el-tooltip>
                <el-form-item label="~" :label-width="labelWidth">
                  <el-tooltip
                    placement="top"
                    :content="$t('contractInfo.riskParams.maxPrompt')"
                    :manual="true"
                    :value="toolTip.maxAMLP"
                  >
                    <el-input
                      v-model="form.maxAMMMaxLeverage"
                      disabled
                      @input="validate('minMaxAMMMaxLeverage')"
                      @focus="toolTip.maxAMLP = true"
                      @blur="toolTip.maxAMLP = false"
                    ></el-input>
                  </el-tooltip>
                </el-form-item>
              </div>
            </el-form-item>
            <el-form-item prop="ammMaxLeverage">
              <template #label>
                <span>{{ $t('contractInfo.riskParams.ammMaxLeverage') }}</span>
                <el-tooltip placement="top" :content="$t('contractInfo.riskParams.ammMaxLeveragePrompt')">
                  <i class="iconfont icon-help-icon"></i>
                </el-tooltip>
              </template>
              <el-tooltip
                placement="top"
                :content="$t('contractInfo.riskParams.ammMaxLeveragePrompt')"
                :manual="true"
                :value="toolTip.AMLP"
              >
                <el-input
                  v-model="form.ammMaxLeverage"
                  class="control-item"
                  @focus="toolTip.AMLP = true"
                  @blur="toolTip.AMLP = false"
                ></el-input>
              </el-tooltip>
            </el-form-item>

            <!--close price discount-->
            <el-form-item>
              <template #label>
                <span>{{ $t('contractInfo.riskParams.rangeClosePriceDiscount') }}</span>
                <el-tooltip placement="top" :content="$t('contractInfo.riskParams.minPrompt')">
                  <i class="iconfont icon-help-icon"></i>
                </el-tooltip>
              </template>
              <div class="multiple-item control-item">
                <el-tooltip
                  placement="top"
                  :content="$t('contractInfo.riskParams.minPrompt')"
                  :manual="true"
                  :value="toolTip.minCPDP"
                >
                  <el-input
                    v-model="form.minClosePriceDiscount"
                    disabled
                    @focus="toolTip.minCPDP = true"
                    @blur="toolTip.minCPDP = false"
                  >
                    <template #suffix>%</template>
                  </el-input>
                </el-tooltip>
                <el-form-item label="~" :label-width="labelWidth">
                  <el-tooltip
                    placement="top"
                    :content="$t('contractInfo.riskParams.maxPrompt')"
                    :manual="true"
                    :value="toolTip.maxCPDP"
                  >
                    <el-input
                      v-model="form.maxClosePriceDiscount"
                      disabled
                      @input="validate('minMaxClosePriceDiscount')"
                      @focus="toolTip.maxCPDP = true"
                      @blur="toolTip.maxCPDP = false"
                    >
                      <template #suffix>%</template>
                    </el-input>
                  </el-tooltip>
                </el-form-item>
              </div>
            </el-form-item>
            <el-form-item prop="closePriceDiscount">
              <template #label>
                <span>{{ $t('contractInfo.riskParams.closePriceDiscount') }}</span>
                <el-tooltip placement="top" :content="$t('contractInfo.riskParams.closePriceDiscountPrompt')">
                  <i class="iconfont icon-help-icon"></i>
                </el-tooltip>
              </template>
              <el-tooltip
                placement="top"
                :content="$t('contractInfo.riskParams.closePriceDiscountPrompt')"
                :manual="true"
                :value="toolTip.CPDP"
              >
                <el-input
                  v-model="form.closePriceDiscount"
                  class="control-item"
                  @focus="toolTip.CPDP = true"
                  @blur="toolTip.CPDP = false"
                >
                  <template #suffix>%</template>
                </el-input>
              </el-tooltip>
            </el-form-item>

            <!--base funding rate-->
            <el-form-item>
              <template #label>
                <span v-html="$t('contractInfo.riskParams.rangeBaseFundingRate')"></span>
                <el-tooltip placement="top" :content="$t('contractInfo.riskParams.minPrompt')">
                  <i class="iconfont icon-help-icon"></i>
                </el-tooltip>
              </template>
              <div class="multiple-item control-item">
                <el-tooltip
                  placement="top"
                  :content="$t('contractInfo.riskParams.minPrompt')"
                  :manual="true"
                  :value="toolTip.minBFRP"
                >
                  <el-input
                    v-model="form.minBaseFundingRate"
                    disabled
                    @focus="toolTip.minBFRP = true"
                    @blur="toolTip.minBFRP = false"
                  >
                    <template #suffix>%</template>
                  </el-input>
                </el-tooltip>
                <el-form-item label="~" :label-width="labelWidth">
                  <el-tooltip
                    placement="top"
                    :content="$t('contractInfo.riskParams.maxPrompt')"
                    :manual="true"
                    :value="toolTip.maxBFRP"
                  >
                    <el-input
                      v-model="form.maxBaseFundingRate"
                      disabled
                      @input="validate('minMaxBaseFundingRate')"
                      @focus="toolTip.maxBFRP = true"
                      @blur="toolTip.maxBFRP = false"
                    >
                      <template #suffix>%</template>
                    </el-input>
                  </el-tooltip>
                </el-form-item>
              </div>
            </el-form-item>
            <el-form-item prop="baseFundingRate">
              <template #label>
                <span v-html="$t('contractInfo.riskParams.baseFundingRate')"></span>
                <el-tooltip placement="top" :content="$t('contractInfo.riskParams.baseFundingRatePrompt')">
                  <i class="iconfont icon-help-icon"></i>
                </el-tooltip>
              </template>
              <el-tooltip
                placement="top"
                :content="$t('contractInfo.riskParams.baseFundingRatePrompt')"
                :manual="true"
                :value="toolTip.BFRP"
              >
                <el-input
                  v-model="form.baseFundingRate"
                  class="control-item"
                  @focus="toolTip.BFRP = true"
                  @blur="toolTip.BFRP = false"
                >
                  <template #suffix>%</template>
                </el-input>
              </el-tooltip>
            </el-form-item>
          </el-form>
        </div>
        <div class="preview">
          <PreviewAMMDepth
            :risk-params="normalizeForm"
            :contract-params="liquidityContractParams"
            :oracle-info="oracleInfo"
            :collateral-info="collateralInfo"
          />
        </div>
      </div>
      <div class="button-container">
<!--        <el-button type="secondary" :disabled="saving" @click="onCancel">{{ $t('base.cancel') }} </el-button>-->
        <el-button :disabled="disableSubmit" :loading="saving" @click="onSave">{{ $t('base.submit') }} </el-button>
      </div>
    </McLoading>

    <el-alert type="error" :closable="false" v-if="errorMessage">{{ this.errorMessage }}</el-alert>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Ref, Vue, Watch } from 'vue-property-decorator'
import BigNumber from 'bignumber.js'
import { ElForm } from 'element-ui/types/form'
import { CollateralInfo, LiquidityContractParams, OracleInfo, RiskParams } from '@/template/Pool/type'
import { Directory, PerpetualCombinedState } from '@/type'
import { namespace } from 'vuex-class'
import { ErrorHandlerMixin, PageRouteMixinFactory } from '@/mixins'
import {
  _1, CHAIN_ID_SYMBOL_SERVICE_ADDRESS,
  DECIMALS,
  getLiquidityPoolContract,
  getOracleContract,
  getReaderContract,
  Reader,
  SymbolServiceFactory,
} from '@mcdex/mai3.js'
import { McLoading } from '@/components'
import { getPerpetualFromID, promiseTimeout } from '@/utils'
import { getGasStationTxParams } from '@/utils/gasPrice'
import { gasLimitConfig } from '@/config/gas'
import { ethers } from 'ethers'
import PreviewAMMDepth from '@/template/Pool/Components/PreviewAMMDepth.vue'
import { Provider } from '@ethersproject/providers'
import { waitTransaction } from '@/utils/transaction'
import { Route } from 'vue-router'
import store from '@/store'
import { TARGET_NETWORK_ID } from '@/constants'

function minMaxValidator(min: string, max: string): boolean {
  if (emptyValidator(min) || emptyValidator(max)) {
    return true
  } else {
    const minValue = new BigNumber(min)
    const maxValue = new BigNumber(max)
    return minValue.isNaN() || maxValue.isNaN() ? false : maxValue.gte(minValue)
  }
}

function outOfRangeValidator(min: string, max: string, current: string): boolean {
  if (emptyValidator(min) || emptyValidator(max) || emptyValidator(current)) {
    return true
  } else {
    const minValue = new BigNumber(min)
    const maxValue = new BigNumber(max)
    const currentValue = new BigNumber(current)
    return minValue.isNaN() || maxValue.isNaN() || currentValue.isNaN()
      ? false
      : currentValue.gte(minValue) && currentValue.lte(maxValue)
  }
}

function numberValidator(val: string): boolean {
  if (emptyValidator(val)) {
    return true
  } else {
    return !new BigNumber(val).isNaN()
  }
}

function emptyValidator(val: string): boolean {
  return val.trim() === ''
}

function isInteger(val: string): boolean {
  if (emptyValidator(val)) {
    return true
  } else {
    const res = new BigNumber(val)
    return res.eq(res.dp(0))
  }
}

const initialData = {
  minHalfSpread: '',
  maxHalfSpread: '',
  halfSpread: '',
  openSlippage: '',
  minOpenSlippage: '',
  maxOpenSlippage: '',
  closeSlippage: '',
  minCloseSlippage: '',
  maxCloseSlippage: '',
  ammMaxLeverage: '',
  minAMMMaxLeverage: '',
  maxAMMMaxLeverage: '',
  fundingRateFactor: '',
  minFundingRateFactor: '',
  maxFundingRateFactor: '',
  fundingRateLimit: '',
  minFundingRateLimit: '',
  maxFundingRateLimit: '',
  closePriceDiscount: '',
  minClosePriceDiscount: '',
  maxClosePriceDiscount: '',
  baseFundingRate: '',
  minBaseFundingRate: '',
  maxBaseFundingRate: '',
  defaultTargetLeverage: '',
  minDefaultTargetLeverage: '',
  maxDefaultTargetLeverage: '',
  maxLev: '',
}

const perpetual = namespace('perpetual')
const wallet = namespace('wallet')
const price = namespace('price')

const routeValidator = async (to: Route) => {
  if (store.getters['routePassed'](to.params.symbol)) {
    return
  }
  const provider = store.getters['wallet/provider']
  const symbolServiceContract = SymbolServiceFactory.connect(CHAIN_ID_SYMBOL_SERVICE_ADDRESS[TARGET_NETWORK_ID], provider)
  try {
    await promiseTimeout(symbolServiceContract.getPerpetualUID(ethers.BigNumber.from(to.params.symbol)), 5000)
    store.commit('setRouteValidatorPassport', to.params.symbol)
  } catch (e) {
    if (e.message.includes('symbol not found')) {
      throw e
    }
  }
}

@Component({
  components: {
    McLoading,
    PreviewAMMDepth,
  },
})
export default class ModifyRiskParams extends Mixins(ErrorHandlerMixin, PageRouteMixinFactory(routeValidator)) {
  @perpetual.State('symbolToPerpetualID') symbolToPerpetualID!: Directory<string>
  @perpetual.Action('updateLiquidityPool') updateLiquidityPool!: (poolAddress: string) => Promise<void>
  @perpetual.Getter('getPerpetualFunc') getPerpetualFunc!: (perpetualID: string) => PerpetualCombinedState | null
  @wallet.Getter('address') address!: string | null
  @wallet.Getter('signer') signer!: ethers.Signer | null
  @wallet.Getter('provider') provider!: Provider | null
  @price.Action('updateTokenPrice') updateTokenPrice!: (tokens: string[]) => Promise<void>

  @Ref('form') formRef!: ElForm

  labelWidth = '60px'
  reader: Reader | null = null
  formValidatorStatus: boolean = true
  poolAddress: string = ''
  symbol: string = ''
  perpetualIndex: number | null = null
  errorMessage: string = ''
  saving = false
  loading = false
  toolTip = {
    minHSP: false,
    maxHSP: false,
    HSP: false,
    minOSP: false,
    maxOSP: false,
    OSP: false,
    minCSP: false,
    maxCSP: false,
    CSP: false,
    minAMLP: false,
    maxAMLP: false,
    AMLP: false,
    minFRLP: false,
    maxFRLP: false,
    FRLP: false,
    minCPDP: false,
    maxCPDP: false,
    CPDP: false,
    minBFRP: false,
    maxBFRP: false,
    BFRP: false,
    minFRFP: false,
    maxFRFP: false,
    FRFP: false,
    defaultLev: false,
  }
  oracleInfo: OracleInfo | null = null

  form = { ...initialData }
  remoteForm = { ...initialData }

  rules = {
    defaultTargetLeverage: [
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (
            !numberValidator(this.form.defaultTargetLeverage) ||
            !isInteger(this.form.defaultTargetLeverage) ||
            !outOfRangeValidator('1', this.form.maxLev, this.form.defaultTargetLeverage)
          ) {
            callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
            return
          }
          callback()
        },
        trigger: 'change',
      },
    ],
    halfSpread: [
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (
            !numberValidator(this.form.halfSpread) ||
            !outOfRangeValidator(this.form.minHalfSpread, this.form.maxHalfSpread, this.form.halfSpread)
          ) {
            callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
            return
          }
          callback()
        },
        trigger: 'change',
      },
    ],
    openSlippage: [
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (
            !numberValidator(this.form.openSlippage) ||
            !outOfRangeValidator(this.form.minOpenSlippage, this.form.maxOpenSlippage, this.form.openSlippage)
          ) {
            callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
            return
          }
          callback()
        },
        trigger: 'change',
      },
    ],
    closeSlippage: [
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (
            !numberValidator(this.form.closeSlippage) ||
            !outOfRangeValidator(this.form.minCloseSlippage, this.form.maxCloseSlippage, this.form.closeSlippage) ||
            !outOfRangeValidator('0', this.form.openSlippage, this.form.closeSlippage)
          ) {
            callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
            return
          }
          callback()
        },
        trigger: 'change',
      },
    ],
    fundingRateFactor: [
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (
            !numberValidator(this.form.fundingRateFactor) ||
            !outOfRangeValidator(
              this.form.minFundingRateFactor,
              this.form.maxFundingRateFactor,
              this.form.fundingRateFactor
            )
          ) {
            callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
            return
          }
          callback()
        },
        trigger: 'change',
      },
    ],
    fundingRateLimit: [
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (
            !numberValidator(this.form.fundingRateLimit) ||
            !outOfRangeValidator(
              this.form.minFundingRateLimit,
              this.form.maxFundingRateLimit,
              this.form.fundingRateLimit
            )
          ) {
            callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
            return
          }
          callback()
        },
        trigger: 'change',
      },
    ],
    ammMaxLeverage: [
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (
            !numberValidator(this.form.ammMaxLeverage) ||
            !outOfRangeValidator(this.form.minAMMMaxLeverage, this.form.maxAMMMaxLeverage, this.form.ammMaxLeverage)
          ) {
            callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
            return
          }
          callback()
        },
        trigger: 'change',
      },
    ],
    closePriceDiscount: [
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (
            !numberValidator(this.form.closePriceDiscount) ||
            !outOfRangeValidator(
              this.form.minClosePriceDiscount,
              this.form.maxClosePriceDiscount,
              this.form.closePriceDiscount
            )
          ) {
            callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
            return
          }
          callback()
        },
        trigger: 'change',
      },
    ],
    baseFundingRate: [
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (
            !numberValidator(this.form.baseFundingRate) ||
            !outOfRangeValidator(
              this.form.minBaseFundingRate,
              this.form.maxBaseFundingRate,
              this.form.baseFundingRate
            )
          ) {
            callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
            return
          }
          callback()
        },
        trigger: 'change',
      },
    ],
  }

  get perpetualID(): string | null {
    return this.symbolToPerpetualID.get(this.symbol) || null
  }

  get perpetual(): PerpetualCombinedState | null {
    if (!this.perpetualID) {
      return null
    }
    return this.getPerpetualFunc(this.perpetualID)
  }

  get isOperator() {
    return this.address && this.address?.toLowerCase() === this.perpetual?.liquidityPoolStorage.operator.toLowerCase()
  }

  get disableSubmit() {
    return !this.isOperator || !(this.passEmptyValidate && this.formValidatorStatus)
  }

  get normalizeForm(): RiskParams {
    return {
      minHalfSpread: new BigNumber(this.form.minHalfSpread).div(100),
      maxHalfSpread: new BigNumber(this.form.maxHalfSpread).div(100),
      halfSpread: new BigNumber(this.form.halfSpread).div(100),
      openSlippage: new BigNumber(this.form.openSlippage),
      minOpenSlippage: new BigNumber(this.form.minOpenSlippage),
      maxOpenSlippage: new BigNumber(this.form.maxOpenSlippage),
      closeSlippage: new BigNumber(this.form.closeSlippage),
      minCloseSlippage: new BigNumber(this.form.minCloseSlippage),
      maxCloseSlippage: new BigNumber(this.form.maxCloseSlippage),
      ammMaxLeverage: new BigNumber(this.form.ammMaxLeverage),
      minAMMMaxLeverage: new BigNumber(this.form.minAMMMaxLeverage),
      maxAMMMaxLeverage: new BigNumber(this.form.maxAMMMaxLeverage),
      fundingRateFactor: new BigNumber(this.form.fundingRateFactor).div(100),
      minFundingRateFactor: new BigNumber(this.form.minFundingRateFactor).div(100),
      maxFundingRateFactor: new BigNumber(this.form.maxFundingRateFactor).div(100),
      fundingRateLimit: new BigNumber(this.form.fundingRateLimit).div(100),
      minFundingRateLimit: new BigNumber(this.form.minFundingRateLimit).div(100),
      maxFundingRateLimit: new BigNumber(this.form.maxFundingRateLimit).div(100),
      closePriceDiscount: new BigNumber(this.form.closePriceDiscount).div(100),
      minClosePriceDiscount: new BigNumber(this.form.minClosePriceDiscount).div(100),
      maxClosePriceDiscount: new BigNumber(this.form.maxClosePriceDiscount).div(100),
      baseFundingRate: new BigNumber(this.form.baseFundingRate).div(100),
      minBaseFundingRate: new BigNumber(this.form.minBaseFundingRate).div(100),
      maxBaseFundingRate: new BigNumber(this.form.maxBaseFundingRate).div(100),
      defaultTargetLeverage: new BigNumber(this.form.defaultTargetLeverage),
      minDefaultTargetLeverage: new BigNumber(this.form.minDefaultTargetLeverage),
      maxDefaultTargetLeverage: new BigNumber(this.form.maxDefaultTargetLeverage),
    }
  }

  get liquidityContractParams(): LiquidityContractParams | null {
    if (!this.perpetual?.perpetualStorage) {
      return null
    }
    const storage = this.perpetual.perpetualStorage
    return {
      liquidationPenaltyRate: storage.liquidationPenaltyRate,
      lpFeeRate: storage.lpFeeRate,
      maintenanceMarginRate: storage.maintenanceMarginRate,
      initialMarginRate: storage.initialMarginRate,
      maxLeverage: _1.div(storage.initialMarginRate),
      vaultFeeRate: storage.operatorFeeRate,
      operatorFeeRate: storage.operatorFeeRate,
      insuranceFundRate: storage.insuranceFundRate,
      keeperGasReward: storage.keeperGasReward,
      referrerRebateRate: storage.referrerRebateRate,
      maxOpenInterestRate: storage.maxOpenInterestRate,
      defaultTargetLeverage: storage.defaultTargetLeverage.value,
      isInverse: this.perpetual.perpetualProperty.isInverse
    }
  }

  get collateralInfo(): CollateralInfo | null {
    if (!this.perpetual) {
      return null
    }
    return {
      symbol: this.perpetual.perpetualProperty.collateralTokenSymbol,
      address: this.perpetual.liquidityPoolStorage.collateral,
      decimals: this.perpetual.perpetualProperty.collateralTokenDecimals,
    }
  }

  get passEmptyValidate(): boolean {
    let result = true
    Object.values(this.form).forEach((item) => {
      result = result && !emptyValidator(item)
    })
    return result
  }

  @Watch('perpetual.perpetualStorage.oracle', { immediate: true })
  private async getOracleInfo() {
    if (!this.perpetual || !this.provider) {
      this.oracleInfo = null
    } else {
      await this.callChainReadFunc(async () => {
        const oracleContract = getOracleContract(this.perpetual!.perpetualStorage.oracle, this.provider as Provider)
        const [markPriceInfo, indexPriceInfo] = await Promise.all([
          oracleContract.callStatic.priceTWAPLong(),
          oracleContract.callStatic.priceTWAPShort(),
        ])
        this.oracleInfo = {
          markPrice: new BigNumber(markPriceInfo.newPrice.toString()).shiftedBy(-DECIMALS),
          indexPrice: new BigNumber(indexPriceInfo.newPrice.toString()).shiftedBy(-DECIMALS),
          symbol: this.perpetual!.perpetualProperty.underlyingAssetSymbol,
        }
      })
    }
  }

  @Watch('perpetualID', { immediate: true })
  private async onPoolAddressChange() {
    if (!this.poolAddress || !this.perpetualID) {
      return
    }
    const { perpetualIndex } = getPerpetualFromID(this.perpetualID)
    this.perpetualIndex = perpetualIndex
    try {
      this.loading = true
      await this.updateLiquidityPool(this.poolAddress)
      this.$nextTick(() => {
        const perpetual = this.getPerpetualFunc(this.perpetualID as string)
        const storage = perpetual?.perpetualStorage
        if (storage) {
          this.form.halfSpread = storage.halfSpread.value.times(100).toFixed() || ''
          this.form.minHalfSpread = storage.halfSpread.minValue.times(100).toFixed() || ''
          this.form.maxHalfSpread = storage.halfSpread.maxValue.times(100).toFixed() || ''
          this.form.openSlippage = storage.openSlippageFactor.value.toFixed() || ''
          this.form.minOpenSlippage = storage.openSlippageFactor.minValue.toFixed() || ''
          this.form.maxOpenSlippage = storage.openSlippageFactor.maxValue.toFixed() || ''
          this.form.closeSlippage = storage.closeSlippageFactor.value.toFixed() || ''
          this.form.minCloseSlippage = storage.closeSlippageFactor.minValue.toFixed() || ''
          this.form.maxCloseSlippage = storage.closeSlippageFactor.maxValue.toFixed() || ''
          this.form.fundingRateFactor = storage.fundingRateFactor.value.times(100).toFixed() || ''
          this.form.minFundingRateFactor = storage.fundingRateFactor.minValue.times(100).toFixed() || ''
          this.form.maxFundingRateFactor = storage.fundingRateFactor.maxValue.times(100).toFixed() || ''
          this.form.fundingRateLimit = storage.fundingRateLimit.value.times(100).toFixed() || ''
          this.form.minFundingRateLimit = storage.fundingRateLimit.minValue.times(100).toFixed() || ''
          this.form.maxFundingRateLimit = storage.fundingRateLimit.maxValue.times(100).toFixed() || ''
          this.form.ammMaxLeverage = storage.ammMaxLeverage.value.toFixed() || ''
          this.form.minAMMMaxLeverage = storage.ammMaxLeverage.minValue.toFixed() || ''
          this.form.maxAMMMaxLeverage = storage.ammMaxLeverage.maxValue.toFixed() || ''
          this.form.closePriceDiscount = storage.maxClosePriceDiscount.value.times(100).toFixed() || ''
          this.form.minClosePriceDiscount = storage.maxClosePriceDiscount.minValue.times(100).toFixed() || ''
          this.form.maxClosePriceDiscount = storage.maxClosePriceDiscount.maxValue.times(100).toFixed() || ''
          this.form.baseFundingRate = storage.baseFundingRate.value.times(100).toFixed() || ''
          this.form.minBaseFundingRate = storage.baseFundingRate.minValue.times(100).toFixed() || ''
          this.form.maxBaseFundingRate = storage.baseFundingRate.maxValue.times(100).toFixed() || ''
          this.form.defaultTargetLeverage = storage.defaultTargetLeverage.value.toFixed() || ''
          this.form.minDefaultTargetLeverage = storage.defaultTargetLeverage.minValue.toFixed() || ''
          this.form.maxDefaultTargetLeverage = storage.defaultTargetLeverage.maxValue.toFixed() || ''
          this.form.maxLev = _1.div(storage.initialMarginRate).toFixed() || ''
          this.remoteForm = { ...this.form }
        }
      })
    } catch (e) {
      console.warn(e)
    } finally {
      this.loading = false
    }
  }

  @Watch('perpetual.liquidityPoolStorage.collateral', { immediate: true })
  private async onCollateralAddressChange() {
    if (!this.perpetual?.liquidityPoolStorage.collateral) {
      return
    }
    await this.updateTokenPrice([this.perpetual.liquidityPoolStorage.collateral])
  }

  @Watch('$route', { immediate: true })
  private onRouteChange() {
    this.poolAddress = this.$route.params.poolAddress
    this.symbol = this.$route.params.symbol
  }

  private validate(field: string) {
    this.formRef.validateField(field)
  }

  private onSave() {
    this.callChainFunc(async () => {
      if (!this.poolAddress || this.perpetualIndex === null || !this.signer) {
        return
      }
      this.saving = true
      try {
        const gas = await getGasStationTxParams(gasLimitConfig.UPDATE_PERPETUAL_RISK_PARAMS_LIMIT)
        const pool = getLiquidityPoolContract(this.poolAddress, this.signer)
        const promiseInstance = await pool.updatePerpetualRiskParameter(
          this.perpetualIndex,
          [
            this.normalizeForm.halfSpread.shiftedBy(DECIMALS).toFixed(0),
            this.normalizeForm.openSlippage.shiftedBy(DECIMALS).toFixed(0),
            this.normalizeForm.closeSlippage.shiftedBy(DECIMALS).toFixed(0),
            this.normalizeForm.fundingRateLimit.shiftedBy(DECIMALS).toFixed(0),
            this.normalizeForm.ammMaxLeverage.shiftedBy(DECIMALS).toFixed(0),
            this.normalizeForm.closePriceDiscount.shiftedBy(DECIMALS).toFixed(0),
            this.normalizeForm.fundingRateFactor.shiftedBy(DECIMALS).toFixed(0),
            this.normalizeForm.defaultTargetLeverage.shiftedBy(DECIMALS).toFixed(0), // TODO default target leverage
            this.normalizeForm.baseFundingRate.shiftedBy(DECIMALS).toFixed(0),
          ],
          gas
        )
        const transaction = waitTransaction(promiseInstance)
        this.$transaction({
          transaction: transaction,
          content: this.$t('transaction.updatePerpetualRiskParams', {
            symbol: `${this.symbol} ${this.perpetual?.perpetualProperty.name}`,
          }).toString(),
          transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
        })
        const receipt = await transaction
        if (receipt.status === 0) {
          throw new Error('failed to update')
        }
      } catch (e) {
        this.errorMessage = e.message
      } finally {
        this.saving = false
      }
    })
  }

  private onCancel() {
    this.form.halfSpread = this.remoteForm.halfSpread
    this.form.openSlippage = this.remoteForm.openSlippage
    this.form.closeSlippage = this.remoteForm.closeSlippage
    this.form.ammMaxLeverage = this.remoteForm.ammMaxLeverage
    this.form.closePriceDiscount = this.remoteForm.closePriceDiscount
    this.form.fundingRateLimit = this.remoteForm.fundingRateLimit
    this.form.defaultTargetLeverage = this.remoteForm.defaultTargetLeverage
  }

  @Watch('form', { deep: true })
  validateIsPass() {
    this.errorMessage = ''
    try {
      let result = true
      Object.keys(this.rules).map((key) => {
        this.formRef.validateField(key, (message) => {
          result = result && !message
        })
      })
      this.formValidatorStatus = result
    } catch {
      this.formValidatorStatus = false
    }
  }

  @Watch('signer', { immediate: true })
  async onSignerChange() {
    if (this.signer) {
      this.reader = await getReaderContract(this.signer)
    }
  }
}
</script>

<style scoped lang="scss">
@import '~@/template/Pool/CreatePerpetual/contract-form';

.el-form-item {
  .el-input ::v-deep .el-input__inner {
    text-align: right;
  }

  .control-item {
    width: 240px;
  }
}

.title {
  height: 30px;
  line-height: 30px;
  margin-bottom: 40px;
}

.content-box {
  margin: auto;
  display: flex;
  justify-content: center;

  .risk-field {
    margin-right: 60px;

    .config {
      color: var(--mc-text-color);
      margin-bottom: 23px;
    }
  }

  .preview {
    width: 420px;
    margin-right: 60px;
  }
}

::v-deep {
  .el-alert {
    margin-top: 12px;
  }
}

.button-container {
  margin-top: 30px;
  text-align: center;

  .el-button {
    width: 240px;
    margin: 0;

    &:first-of-type {
      margin-right: 30px;
    }
  }
}
</style>
