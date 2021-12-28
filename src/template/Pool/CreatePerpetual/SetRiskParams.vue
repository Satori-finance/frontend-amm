<template>
  <div class="risk-params">
    <div class="editable" v-show="showEdit">
      <div class="risk-form">
        <div class="config mc-font-h4-bold">{{ $t('contractInfo.riskParams.config') }}</div>
        <el-form
          label-width="240px"
          ref="form"
          v-model="form"
          :rules="rules"
          :inline-message="true"
          @submit.native.prevent
        >
          <!--half spread-->
          <el-form-item prop="minMaxHalfSpread">
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
                  v-model.trim="form.minHalfSpread"
                  @focus="toolTip.minHSP = true"
                  @blur="toolTip.minHSP = false"
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
                    v-model.trim="form.maxHalfSpread"
                    @input="validate('minMaxHalfSpread')"
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
                v-model.trim="form.halfSpread"
                class="control-item"
                @focus="toolTip.HSP = true"
                @blur="toolTip.HSP = false"
              >
                <template #suffix>%</template>
              </el-input>
            </el-tooltip>
          </el-form-item>

          <!--open slippage-->
          <el-form-item prop="minMaxOpenSlippage">
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
                  v-model.trim="form.minOpenSlippage"
                  @focus="toolTip.minOSP = true"
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
                    v-model.trim="form.maxOpenSlippage"
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
                v-model.trim="form.openSlippage"
                class="control-item"
                @focus="toolTip.OSP = true"
                @blur="toolTip.OSP = false"
              ></el-input>
            </el-tooltip>
          </el-form-item>

          <!--close slippage-->
          <el-form-item prop="minMaxCloseSlippage">
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
                  v-model.trim="form.minCloseSlippage"
                  @focus="toolTip.minCSP = true"
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
                    v-model.trim="form.maxCloseSlippage"
                    @input="validate('minMaxCloseSlippage')"
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
                v-model.trim="form.closeSlippage"
                class="control-item"
                @focus="toolTip.CSP = true"
                @blur="toolTip.CSP = false"
              ></el-input>
            </el-tooltip>
          </el-form-item>

          <!--funding rate factor-->
          <el-form-item prop="minMaxFundingRateFactor">
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
                  v-model.trim="form.minFundingRateFactor"
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
                    v-model.trim="form.maxFundingRateFactor"
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
                v-model.trim="form.fundingRateFactor"
                class="control-item"
                @focus="toolTip.FRFP = true"
                @blur="toolTip.FRFP = false"
              >
                <template #suffix>%</template>
              </el-input>
            </el-tooltip>
          </el-form-item>

          <!--funding rate limit-->
          <el-form-item prop="minMaxFundingRateLimit">
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
                  v-model.trim="form.minFundingRateLimit"
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
                    v-model.trim="form.maxFundingRateLimit"
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
                v-model.trim="form.fundingRateLimit"
                class="control-item"
                @focus="toolTip.FRLP = true"
                @blur="toolTip.FRLP = false"
              >
                <template #suffix>%</template>
              </el-input>
            </el-tooltip>
          </el-form-item>

          <!--AMM max leverage-->
          <el-form-item prop="minMaxAMMMaxLeverage">
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
                  v-model.trim="form.minAMMMaxLeverage"
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
                    v-model.trim="form.maxAMMMaxLeverage"
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
                v-model.trim="form.ammMaxLeverage"
                class="control-item"
                @focus="toolTip.AMLP = true"
                @blur="toolTip.AMLP = false"
              ></el-input>
            </el-tooltip>
          </el-form-item>

          <!--close price discount-->
          <el-form-item prop="minMaxClosePriceDiscount">
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
                  v-model.trim="form.minClosePriceDiscount"
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
                    v-model.trim="form.maxClosePriceDiscount"
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
                v-model.trim="form.closePriceDiscount"
                class="control-item"
                @focus="toolTip.CPDP = true"
                @blur="toolTip.CPDP = false"
              >
                <template #suffix>%</template>
              </el-input>
            </el-tooltip>
          </el-form-item>

          <!--base funding rate-->
          <el-form-item prop="minMaxBaseFundingRate">
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
                  v-model.trim="form.minBaseFundingRate"
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
                    v-model.trim="form.maxBaseFundingRate"
                    @input="validate('minMaxClosePriceDiscount')"
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
                v-model.trim="form.baseFundingRate"
                class="control-item"
                @focus="toolTip.BFRP = true"
                @blur="toolTip.BFRP = false"
              >
                <template #suffix>%</template>
              </el-input>
            </el-tooltip>
          </el-form-item>

          <el-form-item label=" " class="button-container">
            <el-button :disabled="!(passEmptyValidate && formValidatorStatus)" class="control-item" @click="onSave"
              >{{ $t('base.save') }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      <div class="preview">
        <PreviewAMMDepth
          v-if="enablePreview"
          :risk-params="normalizeForm"
          :collateral-info="collateralInfo"
          :oracle-info="oracleInfo"
          :contract-params="contractParams"
        />
        <div class="tip" v-else>
          <div class="tip-title">{{ $t('contractInfo.previewAMMDepth.title') }}</div>
          <div class="tip-content">
            <div class="preview-msg">{{ $t('contractInfo.riskParams.previewTip') }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="readonly" v-show="!showEdit">
      <table class="mc-data-table mc-data-table--border is-medium">
        <tbody>
          <tr>
            <td>{{ $t('contractInfo.riskParams.halfSpread') }}</td>
            <td>
              <span class="current">{{ form.halfSpread }} %</span>
            </td>
            <td>
              <div class="value-bar">
                <span>{{ $t('base.min') }}</span>
                <span class="value">{{ form.minHalfSpread }} %</span>
                <el-progress
                  :percentage="getPercentage(form.minHalfSpread, form.maxHalfSpread, form.halfSpread)"
                  :show-text="false"
                ></el-progress>
                <span>{{ $t('base.max') }}</span>
                <span class="value">{{ form.maxHalfSpread }} %</span>
              </div>
            </td>
          </tr>
          <tr>
            <td><span v-html="$t('contractInfo.riskParams.openSlippage')"></span></td>
            <td>
              <span class="current">{{ form.openSlippage }}</span>
            </td>
            <td>
              <div class="value-bar">
                <span>{{ $t('base.min') }}</span>
                <span class="value">{{ form.minOpenSlippage }}</span>
                <el-progress
                  :percentage="getPercentage(form.minOpenSlippage, form.maxOpenSlippage, form.openSlippage)"
                  :show-text="false"
                ></el-progress>
                <span>{{ $t('base.max') }}</span>
                <span class="value">{{ form.maxOpenSlippage }}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td><span v-html="$t('contractInfo.riskParams.closeSlippage')"></span></td>
            <td>
              <span class="current">{{ form.closeSlippage }}</span>
            </td>
            <td>
              <div class="value-bar">
                <span>{{ $t('base.min') }}</span>
                <span class="value">{{ form.minCloseSlippage }}</span>
                <el-progress
                  :percentage="getPercentage(form.minCloseSlippage, form.maxCloseSlippage, form.closeSlippage)"
                  :show-text="false"
                ></el-progress>
                <span>{{ $t('base.max') }}</span>
                <span class="value">{{ form.maxCloseSlippage }}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td>{{ $t('contractInfo.riskParams.fundingRateFactor') }}</td>
            <td>
              <span class="current">{{ form.fundingRateFactor }} %</span>
            </td>
            <td>
              <div class="value-bar">
                <span>{{ $t('base.min') }}</span>
                <span class="value">{{ form.minFundingRateFactor }} %</span>
                <el-progress
                  :percentage="
                    getPercentage(form.minFundingRateFactor, form.maxFundingRateFactor, form.fundingRateFactor)
                  "
                  :show-text="false"
                ></el-progress>
                <span>{{ $t('base.max') }}</span>
                <span class="value">{{ form.maxFundingRateFactor }} %</span>
              </div>
            </td>
          </tr>
          <tr>
            <td>{{ $t('contractInfo.riskParams.fundingRateLimit') }}</td>
            <td>
              <span class="current">{{ form.fundingRateLimit }} %</span>
            </td>
            <td>
              <div class="value-bar">
                <span>{{ $t('base.min') }}</span>
                <span class="value">{{ form.minFundingRateLimit }} %</span>
                <el-progress
                  :percentage="getPercentage(form.minFundingRateLimit, form.maxFundingRateLimit, form.fundingRateLimit)"
                  :show-text="false"
                ></el-progress>
                <span>{{ $t('base.max') }}</span>
                <span class="value">{{ form.maxFundingRateLimit }} %</span>
              </div>
            </td>
          </tr>
          <tr>
            <td>{{ $t('contractInfo.riskParams.ammMaxLeverage') }}</td>
            <td>
              <span class="current">{{ form.ammMaxLeverage }}</span>
            </td>
            <td>
              <div class="value-bar">
                <span>{{ $t('base.min') }}</span>
                <span class="value">{{ form.minAMMMaxLeverage }}</span>
                <el-progress
                  :percentage="getPercentage(form.minAMMMaxLeverage, form.maxAMMMaxLeverage, form.ammMaxLeverage)"
                  :show-text="false"
                ></el-progress>
                <span>{{ $t('base.max') }}</span>
                <span class="value">{{ form.maxAMMMaxLeverage | bigNumberFormatter(3) }}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td>{{ $t('contractInfo.riskParams.closePriceDiscount') }}</td>
            <td>
              <span class="current">{{ form.closePriceDiscount }} %</span>
            </td>
            <td>
              <div class="value-bar">
                <span>{{ $t('base.min') }}</span>
                <span class="value">{{ form.minClosePriceDiscount }} %</span>
                <el-progress
                  :percentage="
                    getPercentage(form.minClosePriceDiscount, form.maxClosePriceDiscount, form.closePriceDiscount)
                  "
                  :show-text="false"
                ></el-progress>
                <span>{{ $t('base.max') }}</span>
                <span class="value">{{ form.maxClosePriceDiscount }} %</span>
              </div>
            </td>
          </tr>
          <tr>
            <td><span v-html="$t('contractInfo.riskParams.baseFundingRate')"></span></td>
            <td>
              <span class="current">{{ form.baseFundingRate }} %</span>
            </td>
            <td>
              <div class="value-bar">
                <span>{{ $t('base.min') }}</span>
                <span class="value">{{ form.minBaseFundingRate }} %</span>
                <el-progress
                  :percentage="
                    getPercentage(form.minBaseFundingRate, form.maxBaseFundingRate, form.baseFundingRate)
                  "
                  :show-text="false"
                ></el-progress>
                <span>{{ $t('base.max') }}</span>
                <span class="value">{{ form.maxBaseFundingRate }} %</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="action" v-if="!created && !readonly">
        <el-button class="edit-btn" :disabled="creating" type="secondary" @click="onEdit"
          >{{ $t('base.edit') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator'
import BigNumber from 'bignumber.js'
import { ElForm } from 'element-ui/types/form'
import { CollateralInfo, LiquidityContractParams, OracleInfo, RiskParams } from '@/template/Pool/type'
import PreviewAMMDepth from '../Components/PreviewAMMDepth.vue'
import { _1 } from '@mcdex/mai3.js'
import { ALLOWANCE_AMOUNT } from '@/constants'

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

const defaultData = {
  minHalfSpread: '0', // %
  maxHalfSpread: '25', // %
  halfSpread: '0.01', // %
  openSlippage: '1',
  minOpenSlippage: '0.0005',
  maxOpenSlippage: '5',
  closeSlippage: '0.7',
  minCloseSlippage: '0',
  maxCloseSlippage: '5',
  ammMaxLeverage: '1', // x
  minAMMMaxLeverage: '0.5', // x
  maxAMMMaxLeverage: '3', // x
  fundingRateFactor: '0.5', // %
  minFundingRateFactor: '0.05', // %
  maxFundingRateFactor: '10', // %
  closePriceDiscount: '5', // %
  minClosePriceDiscount: '0', // %
  maxClosePriceDiscount: '100', // %
  fundingRateLimit: '1', // %
  minFundingRateLimit: '0', // %
  maxFundingRateLimit: '10', // %
  defaultTargetLeverage: '5', // x, don't forget ContractParameters also has a same defaultTargetLeverage
  minDefaultTargetLeverage: '0', // x
  maxDefaultTargetLeverage: ALLOWANCE_AMOUNT, // x
  baseFundingRate: '0', // %
  minBaseFundingRate: '-1', // %
  maxBaseFundingRate: '1', // %
}

@Component({
  components: {
    PreviewAMMDepth,
  },
})
export default class SetRiskParams extends Vue {
  @Prop({ default: false, required: true }) creating!: boolean
  @Prop({ default: false, required: true }) created!: boolean
  @Prop({ default: false, required: true }) readonly!: boolean
  @Prop({ default: () => null, required: true }) oracleInfo!: OracleInfo | null
  @Prop({ default: () => null, required: true }) collateralInfo!: CollateralInfo | null
  @Prop({ default: () => null, required: true }) contractParams!: LiquidityContractParams | null

  @Ref('form') formRef!: ElForm

  labelWidth = '60px'
  status: 'editable' | 'readonly' = 'editable'
  formValidatorStatus: boolean = true
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
    minFRFP: false,
    maxFRFP: false,
    FRFP: false,
    minBFRP: false,
    maxBFRP: false,
    BFRP: false,
  }

  form = { ...defaultData }

  rules = {
    minMaxHalfSpread: [
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (
            !numberValidator(this.form.minHalfSpread) ||
            !numberValidator(this.form.maxHalfSpread) ||
            !minMaxValidator(this.form.minHalfSpread, this.form.maxHalfSpread)
          ) {
            callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
            return
          }
          const min = new BigNumber(this.form.minHalfSpread)
          if (min.lt(0)) {
            callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
            return
          }
          const max = new BigNumber(this.form.maxHalfSpread)
          if (max.gt(100)) {
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
            callback(new Error(this.$t('createPerpetual.minMaxViolation').toString()))
            return
          }
          callback()
        },
        trigger: 'change',
      },
    ],
    minMaxOpenSlippage: [
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (
            !numberValidator(this.form.minOpenSlippage) ||
            !numberValidator(this.form.maxOpenSlippage) ||
            !minMaxValidator(this.form.minOpenSlippage, this.form.maxOpenSlippage)
          ) {
            callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
            return
          }
          const min = new BigNumber(this.form.minOpenSlippage)
          if (min.lt(0)) {
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
            callback(new Error(this.$t('createPerpetual.minMaxViolation').toString()))
            return
          }
          if (new BigNumber(this.form.openSlippage).lte(0)) {
            callback(new Error(this.$t('createPerpetual.largerZero').toString()))
            return
          }
          callback()
        },
        trigger: 'change',
      },
    ],
    minMaxCloseSlippage: [
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (
            !numberValidator(this.form.minCloseSlippage) ||
            !numberValidator(this.form.maxCloseSlippage) ||
            !minMaxValidator(this.form.minCloseSlippage, this.form.maxCloseSlippage)
          ) {
            callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
            return
          }
          const min = new BigNumber(this.form.minCloseSlippage)
          if (min.lt(0) || min.gt(new BigNumber(this.form.minOpenSlippage))) {
            callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
            return
          }
          const max = new BigNumber(this.form.maxCloseSlippage)
          if (max.gt(new BigNumber(this.form.maxOpenSlippage))) {
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
            callback(new Error(this.$t('createPerpetual.minMaxViolation').toString()))
            return
          }
          if (new BigNumber(this.form.closeSlippage).lte(0)) {
            callback(new Error(this.$t('createPerpetual.largerZero').toString()))
            return
          }
          callback()
        },
        trigger: 'change',
      },
    ],
    minMaxFundingRateFactor: [
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (
            !numberValidator(this.form.minFundingRateFactor) ||
            !numberValidator(this.form.maxFundingRateFactor) ||
            !minMaxValidator(this.form.minFundingRateFactor, this.form.maxFundingRateFactor)
          ) {
            callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
            return
          }
          const min = new BigNumber(this.form.minFundingRateFactor)
          if (min.lt(0)) {
            callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
            return
          }
          const max = new BigNumber(this.form.maxFundingRateFactor)
          if (max.gt(100)) {
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
            callback(new Error(this.$t('createPerpetual.minMaxViolation').toString()))
            return
          }
          callback()
        },
        trigger: 'change',
      },
    ],
    minMaxFundingRateLimit: [
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (
            !numberValidator(this.form.minFundingRateLimit) ||
            !numberValidator(this.form.maxFundingRateLimit) ||
            !minMaxValidator(this.form.minFundingRateLimit, this.form.maxFundingRateLimit)
          ) {
            callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
            return
          }
          const min = new BigNumber(this.form.minFundingRateLimit)
          if (min.lt(0)) {
            callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
            return
          }
          const max = new BigNumber(this.form.maxFundingRateLimit)
          if (max.gt(100)) {
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
            callback(new Error(this.$t('createPerpetual.minMaxViolation').toString()))
            return
          }
          callback()
        },
        trigger: 'change',
      },
    ],
    minMaxAMMMaxLeverage: [
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (
            !numberValidator(this.form.minAMMMaxLeverage) ||
            !numberValidator(this.form.maxAMMMaxLeverage) ||
            !minMaxValidator(this.form.minAMMMaxLeverage, this.form.maxAMMMaxLeverage)
          ) {
            callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
            return
          }
          const min = new BigNumber(this.form.minAMMMaxLeverage)
          if (min.lte(0)) {
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
            !outOfRangeValidator(this.form.minAMMMaxLeverage, this.form.maxAMMMaxLeverage, this.form.ammMaxLeverage) ||
            new BigNumber(this.form.ammMaxLeverage).isZero()
          ) {
            callback(new Error(this.$t('createPerpetual.minMaxViolation').toString()))
            return
          }
          if (this.contractParams) {
            if (_1.div(this.form.ammMaxLeverage).lt(this.contractParams.initialMarginRate)) {
              callback(new Error(this.$t('createPerpetual.ammMaxLeverageMustSmallerThanInitialMargin').toString()))
              return
            }
          }
          callback()
        },
        trigger: 'change',
      },
    ],
    minMaxClosePriceDiscount: [
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (
            !numberValidator(this.form.minClosePriceDiscount) ||
            !numberValidator(this.form.maxClosePriceDiscount) ||
            !minMaxValidator(this.form.minClosePriceDiscount, this.form.maxClosePriceDiscount)
          ) {
            callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
            return
          }
          const min = new BigNumber(this.form.minClosePriceDiscount)
          if (min.lt(0)) {
            callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
            return
          }
          const max = new BigNumber(this.form.maxClosePriceDiscount)
          if (max.gt(100)) {
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
            callback(new Error(this.$t('createPerpetual.minMaxViolation').toString()))
            return
          }
          callback()
        },
        trigger: 'change',
      },
    ],
    minMaxBaseFundingRate: [
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (
            !numberValidator(this.form.minBaseFundingRate) ||
            !numberValidator(this.form.maxBaseFundingRate) ||
            !minMaxValidator(this.form.minBaseFundingRate, this.form.maxBaseFundingRate)
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
            callback(new Error(this.$t('createPerpetual.minMaxViolation').toString()))
            return
          }
          callback()
        },
        trigger: 'change',
      },
    ],
  }

  get enablePreview() {
    return this.oracleInfo && this.collateralInfo && this.contractParams
  }

  get showEdit() {
    return !this.creating && !this.created && this.status === 'editable'
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
      fundingRateLimit: new BigNumber(this.form.fundingRateLimit).div(100),
      minFundingRateLimit: new BigNumber(this.form.minFundingRateLimit).div(100),
      maxFundingRateLimit: new BigNumber(this.form.maxFundingRateLimit).div(100),
      fundingRateFactor: new BigNumber(this.form.fundingRateFactor).div(100),
      minFundingRateFactor: new BigNumber(this.form.minFundingRateFactor).div(100),
      maxFundingRateFactor: new BigNumber(this.form.maxFundingRateFactor).div(100),
      closePriceDiscount: new BigNumber(this.form.closePriceDiscount).div(100),
      minClosePriceDiscount: new BigNumber(this.form.minClosePriceDiscount).div(100),
      maxClosePriceDiscount: new BigNumber(this.form.maxClosePriceDiscount).div(100),
      defaultTargetLeverage: new BigNumber(this.form.defaultTargetLeverage),
      minDefaultTargetLeverage: new BigNumber(this.form.minDefaultTargetLeverage),
      maxDefaultTargetLeverage: new BigNumber(this.form.maxDefaultTargetLeverage),
      baseFundingRate: new BigNumber(this.form.baseFundingRate).div(100),
      minBaseFundingRate: new BigNumber(this.form.minBaseFundingRate).div(100),
      maxBaseFundingRate: new BigNumber(this.form.maxBaseFundingRate).div(100),
    }
  }

  get passEmptyValidate(): boolean {
    let result = true
    Object.values(this.form).forEach((item) => {
      result = result && !emptyValidator(item)
    })
    return result
  }

  private validate(field: string) {
    this.formRef.validateField(field)
  }

  private getPercentage(min: string, max: string, value: string): number {
    const minValue = new BigNumber(min)
    const maxValue = new BigNumber(max)
    const currentValue = new BigNumber(value)
    const result = currentValue
      .minus(minValue)
      .times(100)
      .div(maxValue.minus(minValue))
    return result.isNaN() ? 0 : BigNumber.min(BigNumber.max(0, result), 100).toNumber()
  }

  private createPerpetual() {
    this.$emit('create')
  }

  private onSave() {
    this.validateIsPass()
    if (!this.formValidatorStatus) {
      return
    }
    this.status = 'readonly'
    this.$emit('change', this.normalizeForm)
  }

  onEdit() {
    this.status = 'editable'
    this.$emit('change', null)
  }

  @Watch('form', { deep: true })
  validateIsPass() {
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

  reset() {
    this.setInitialData()
    this.status = 'editable'
    this.formValidatorStatus = true
  }

  setInitialData() {
    Object.assign(this.form, defaultData)
    if (this.contractParams) {
      this.form.maxAMMMaxLeverage = _1.div(this.contractParams.initialMarginRate).toFixed()
      this.form.ammMaxLeverage = BigNumber.minimum(this.form.ammMaxLeverage, this.form.maxAMMMaxLeverage).toFixed()
    }
  }
}
</script>

<style scoped lang="scss">
@import 'contract-form';

.risk-params .editable {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  .risk-form {
    .config {
      margin-bottom: 21px;
    }
  }

  .preview {
    width: 420px;
    height: 864px;
    position: relative;

    .tip {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 20px;
      background: var(--mc-background-color-dark-light);

      .tip-title {
        font-size: 18px;
        line-height: 24px;
        font-weight: bold;
        color: var(--mc-text-color);
        margin-bottom: 10px;
      }

      .tip-content {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        color: white;
        font-size: 14px;
      }
    }
  }
}

.el-form {
  .el-form-item {
    .el-input ::v-deep .el-input__inner {
      text-align: right;
    }

    .control-item {
      width: 240px;
    }
  }
}

.mc-data-table {
  width: 730px;
  margin: auto;

  tbody {
    font-size: 14px;
  }

  td {
    padding: 0 10px;

    &:not(:last-of-type) {
      border-right: none;
    }

    &:not(:first-of-type) {
      border-left: none;
    }

    .current {
      width: 80px;
      display: inline-block;
      color: white;
    }

    .value-bar {
      width: 430px;
      display: flex;
      align-items: center;

      .value {
        display: inline-block;
        width: 50px;
        margin-left: 10px;
        color: white;
      }

      .el-progress {
        display: inline-block;
        width: 200px;
        margin-right: 10px;
      }
    }
  }
}

.action {
  width: 730px;
  margin: 45px auto auto;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .edit-btn {
    width: 120px;
  }

  .create-btn {
    width: 275px;
  }
}

::v-deep {
  .el-form-item__error {
    width: 240px;
  }
}
</style>
