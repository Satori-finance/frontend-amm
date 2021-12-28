<template>
  <div class="perp-params-proposal">
    <div class="step-item step01">
      <div class="step-title">
        <span>{{ $t('base.step') }} 1. </span>
        <span class="info">{{ $t('pool.poolProposal.perpParamsProposal.step01') }}</span>
      </div>
      <div class="step-body">
        <div class="perp-select-list">
          <table class="mc-data-table mc-data-table--border" v-if="step01Status === 'edit'">
            <thead>
              <tr>
                <th>{{ $t('pool.poolProposal.perpetual') }}</th>
                <th>{{ $t('pool.poolProposal.select') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in perpetuals" :key="index">
                <td class="is-center">
                  {{ item.symbol }}
                  {{ `${item.underlyingSymbol}-${item.collateralSymbol}` }}
                </td>
                <td class="is-center">
                  <el-radio v-model="currentSelectedPerpIndex" :label="index"></el-radio>
                </td>
              </tr>
            </tbody>
          </table>
          <table class="mc-data-table mc-data-table--border" v-if="step01Status === 'show'">
            <thead>
              <tr>
                <th>{{ $t('pool.poolProposal.perpetual') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="is-center">
                  {{ selectedPerpetual.symbol }}
                  {{ `${selectedPerpetual.underlyingSymbol}-${selectedPerpetual.collateralSymbol}` }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="step-button-box">
        <div v-if="step01Status === 'edit'" class="edit-button">
          <div class="info-button">
            <el-button
              class="large"
              @click="
                step01Status = 'show'
                currentStepIndex = 1
                step02Status = 'edit'
              "
              :disabled="!selectedPerpetual"
            >
              {{ $t('base.next') }}
            </el-button>
          </div>
        </div>
        <div v-if="step01Status === 'show'" class="show-button">
          <div class="info-button">
            <el-button
              class="large"
              type="secondary"
              @click="
                step01Status = 'edit'
                currentStepIndex = 0
              "
              :disabled="buttonIsLoading"
            >
              {{ $t('base.edit') }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
    <div class="step-item step02" v-if="currentStepIndex === 1">
      <div class="step-item step01">
        <div class="step-title">
          <span>{{ $t('base.step') }} 2. </span>
          <span class="info">{{ $t('pool.poolProposal.perpParamsProposal.step02') }}</span>
        </div>
        <div class="step-body">
          <el-form
            size="mini"
            :model="paramsForm"
            :rules="paramsFormRule"
            ref="form"
            :inline-message="true"
            @submit.native.prevent
          >
            <div class="params-table">
              <div class="params-table-item">
                <div class="table-title">
                  {{ $t('pool.poolProposal.perpParamsProposal.contractParameters') }}
                </div>
                <table class="mc-data-table mc-data-table--border" v-if="selectedPerpetualStorage">
                  <thead>
                    <tr>
                      <td>{{ $t('pool.poolProposal.perpParamsProposal.parameters') }}</td>
                      <td>{{ $t('pool.poolProposal.perpParamsProposal.before') }}</td>
                      <td>{{ $t('pool.poolProposal.perpParamsProposal.after') }}</td>
                    </tr>
                  </thead>
                  <tbody>
                    <!-- contractParams initialMarginRate -->
                    <tr>
                      <td>
                        {{ $t('contractInfo.contractParams.initialMarginRate') }}
                      </td>
                      <td class="value">
                        {{ selectedPerpetualStorage.initialMarginRate.times(100) | bigNumberFormatter(2) }} %
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.initialMarginRate === ''">--</span>
                          <span v-else>{{ paramsForm.initialMarginRate }} %</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="initialMarginRate">
                            <el-input v-model="paramsForm.initialMarginRate" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                    <!-- contractParams maintenanceMarginRate -->
                    <tr>
                      <td>
                        {{ $t('contractInfo.contractParams.maintenanceMarginRate') }}
                      </td>
                      <td class="value">
                        {{ selectedPerpetualStorage.maintenanceMarginRate.times(100) | bigNumberFormatter(2) }} %
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.maintenanceMarginRate === ''">--</span>
                          <span v-else>{{ paramsForm.maintenanceMarginRate }} %</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="maintenanceMarginRate">
                            <el-input v-model="paramsForm.maintenanceMarginRate" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                    <!-- contractParams defaultTargetLeverage -->
                    <tr>
                      <td>
                        {{ $t('contractInfo.contractParams.defaultTargetLeverage') }}
                      </td>
                      <td class="value">{{ selectedPerpetualStorage.defaultTargetLeverage.value }} x</td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.defaultTargetLeverage === ''">--</span>
                          <span v-else>{{ paramsForm.defaultTargetLeverage }} x</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="defaultTargetLeverage">
                            <el-input v-model="paramsForm.defaultTargetLeverage" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                    <!-- contractParams operatorFeeRate -->
                    <tr>
                      <td>
                        {{ $t('contractInfo.contractParams.operatorFeeRate') }}
                      </td>
                      <td class="value">
                        {{ selectedPerpetualStorage.operatorFeeRate.times(100) | bigNumberFormatter(3) }} %
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.operatorFeeRate === ''">--</span>
                          <span v-else>{{ paramsForm.operatorFeeRate }} %</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="operatorFeeRate">
                            <el-input v-model="paramsForm.operatorFeeRate" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                    <!-- contractParams lpFeeRate -->
                    <tr>
                      <td>
                        {{ $t('contractInfo.contractParams.lpFeeRate') }}
                      </td>
                      <td class="value">
                        {{ selectedPerpetualStorage.lpFeeRate.times(100) | bigNumberFormatter(3) }} %
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.lpFeeRate === ''">--</span>
                          <span v-else>{{ paramsForm.lpFeeRate }} %</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="lpFeeRate">
                            <el-input v-model="paramsForm.lpFeeRate" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                    <!-- contractParams liquidationPenaltyRate -->
                    <tr>
                      <td>
                        {{ $t('contractInfo.contractParams.liquidationPenaltyRate') }}
                      </td>
                      <td class="value">
                        {{ selectedPerpetualStorage.liquidationPenaltyRate.times(100) | bigNumberFormatter(2) }} %
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.liquidationPenaltyRate === ''">--</span>
                          <span v-else>{{ paramsForm.liquidationPenaltyRate }} %</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="liquidationPenaltyRate">
                            <el-input v-model="paramsForm.liquidationPenaltyRate" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                    <!-- contractParams insuranceFundRate -->
                    <tr>
                      <td>
                        {{ $t('contractInfo.contractParams.insuranceFundRate') }}
                      </td>
                      <td class="value">
                        {{ selectedPerpetualStorage.insuranceFundRate.times(100) | bigNumberFormatter(2) }} %
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.insuranceFundRate === ''">--</span>
                          <span v-else>{{ paramsForm.insuranceFundRate }} %</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="insuranceFundRate">
                            <el-input v-model="paramsForm.insuranceFundRate" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                    <!-- contractParams keeperGasReward -->
                    <tr>
                      <td>
                        {{ $t('contractInfo.contractParams.keeperGasReward') }}
                      </td>
                      <td class="value">
                        {{ selectedPerpetualStorage.keeperGasReward | bigNumberFormatterByPrecision(3) }}
                        {{ collateralSymbol }}
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.keeperGasReward === ''">--</span>
                          <span v-else>
                            {{ paramsForm.keeperGasReward }}
                            {{ collateralSymbol }}
                          </span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="keeperGasReward">
                            <el-input v-model="paramsForm.keeperGasReward" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                    <!-- contractParams referrerRebateRate -->
                    <tr>
                      <td>
                        {{ $t('contractInfo.contractParams.referrerRebateRate') }}
                      </td>
                      <td class="value">
                        {{ selectedPerpetualStorage.referrerRebateRate.times(100) | bigNumberFormatter(2) }} %
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.referrerRebateRate === ''">--</span>
                          <span v-else>{{ paramsForm.referrerRebateRate }} %</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="referrerRebateRate">
                            <el-input v-model="paramsForm.referrerRebateRate" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                    <!-- contractParams referrerRebateRate -->
                    <tr>
                      <td>
                        {{ $t('contractInfo.contractParams.maxOpenInterestRate') }}
                      </td>
                      <td class="value">{{ selectedPerpetualStorage.maxOpenInterestRate }}x</td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.maxOpenInterestRate === ''">--</span>
                          <span v-else>{{ paramsForm.maxOpenInterestRate }}</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="maxOpenInterestRate">
                            <el-input v-model="paramsForm.maxOpenInterestRate" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="params-table-item">
                <div class="table-title">
                  {{ $t('pool.poolProposal.perpParamsProposal.ammRiskParameters') }}
                </div>
                <table class="mc-data-table mc-data-table--border">
                  <thead>
                    <tr>
                      <td>{{ $t('pool.poolProposal.perpParamsProposal.parameters') }}</td>
                      <td>{{ $t('pool.poolProposal.perpParamsProposal.before') }}</td>
                      <td>{{ $t('pool.poolProposal.perpParamsProposal.after') }}</td>
                    </tr>
                  </thead>
                  <tbody>
                    <!-- AMM risk halfSpread -->
                    <tr>
                      <td>
                        {{ $t('contractInfo.riskParams.halfSpread') }}
                      </td>
                      <td class="value">
                        {{ selectedPerpetualStorage.halfSpread.value.times(100) | bigNumberFormatter(2) }} %
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.halfSpread === ''">--</span>
                          <span v-else>{{ paramsForm.halfSpread }} %</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="halfSpread">
                            <el-input v-model="paramsForm.halfSpread" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                    <!-- AMM risk minHalfSpread -->
                    <tr>
                      <td>
                        {{ $t('contractInfo.riskParams.minHalfSpread') }}
                      </td>
                      <td class="value">
                        {{ selectedPerpetualStorage.halfSpread.minValue.times(100) | bigNumberFormatter(2) }} %
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.minHalfSpread === ''">--</span>
                          <span v-else>{{ paramsForm.minHalfSpread }} %</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="minMaxHalfSpread">
                            <el-input v-model="paramsForm.minHalfSpread" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                    <!-- AMM risk maxHalfSpread -->
                    <tr>
                      <td>
                        {{ $t('contractInfo.riskParams.maxHalfSpread') }}
                      </td>
                      <td class="value">
                        {{ selectedPerpetualStorage.halfSpread.maxValue.times(100) | bigNumberFormatter(2) }} %
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.maxHalfSpread === ''">--</span>
                          <span v-else>{{ paramsForm.maxHalfSpread }} %</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="minMaxHalfSpread">
                            <el-input v-model="paramsForm.maxHalfSpread" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                    <!-- AMM risk openSlippage -->
                    <tr>
                      <td>
                        <span v-html="$t('contractInfo.riskParams.openSlippage')"></span>
                      </td>
                      <td class="value">
                        {{ selectedPerpetualStorage.openSlippageFactor.value.toFixed() }}
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.openSlippage === ''">--</span>
                          <span v-else>{{ paramsForm.openSlippage }}</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="openSlippage">
                            <el-input v-model="paramsForm.openSlippage" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                    <!-- AMM risk minOpenSlippage -->
                    <tr>
                      <td>
                        <span v-html="$t('contractInfo.riskParams.minOpenSlippage')"></span>
                      </td>
                      <td class="value">
                        {{ selectedPerpetualStorage.openSlippageFactor.minValue.toFixed() }}
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.minOpenSlippage === ''">--</span>
                          <span v-else>{{ paramsForm.minOpenSlippage }}</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="minMaxOpenSlippage">
                            <el-input v-model="paramsForm.minOpenSlippage" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                    <!-- AMM risk maxOpenSlippage -->
                    <tr>
                      <td>
                        <span v-html="$t('contractInfo.riskParams.maxOpenSlippage')"></span>
                      </td>
                      <td class="value">
                        {{ selectedPerpetualStorage.openSlippageFactor.maxValue.toFixed() }}
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.maxOpenSlippage === ''">--</span>
                          <span v-else>{{ paramsForm.maxOpenSlippage }}</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="minMaxOpenSlippage">
                            <el-input v-model="paramsForm.maxOpenSlippage" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                    <!-- AMM risk closeSlippage -->
                    <tr>
                      <td><span v-html="$t('contractInfo.riskParams.closeSlippage')"></span></td>
                      <td class="value">
                        {{ selectedPerpetualStorage.closeSlippageFactor.value.toFixed() }}
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.closeSlippage === ''">--</span>
                          <span v-else>{{ paramsForm.closeSlippage }}</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="closeSlippage">
                            <el-input v-model="paramsForm.closeSlippage" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                    <!-- AMM risk minCloseSlippage -->
                    <tr>
                      <td>
                        <span v-html="$t('contractInfo.riskParams.minCloseSlippage')"></span>
                      </td>
                      <td class="value">
                        {{ selectedPerpetualStorage.closeSlippageFactor.minValue.toFixed() }}
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.minCloseSlippage === ''">--</span>
                          <span v-else>{{ paramsForm.minCloseSlippage }}</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="minMaxCloseSlippage">
                            <el-input v-model="paramsForm.minCloseSlippage" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                    <!-- AMM risk maxCloseSlippage -->
                    <tr>
                      <td>
                        <span v-html="$t('contractInfo.riskParams.maxCloseSlippage')"></span>
                      </td>
                      <td class="value">
                        {{ selectedPerpetualStorage.closeSlippageFactor.maxValue.toFixed() }}
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.maxCloseSlippage === ''">--</span>
                          <span v-else>{{ paramsForm.maxCloseSlippage }}</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="minMaxCloseSlippage">
                            <el-input v-model="paramsForm.maxCloseSlippage" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                    <!-- AMM risk fundingRateFactor -->
                    <tr>
                      <td>
                        {{ $t('contractInfo.riskParams.fundingRateFactor') }}
                      </td>
                      <td class="value">
                        {{ selectedPerpetualStorage.fundingRateFactor.value.times(100) | bigNumberFormatter(2) }} %
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.fundingRateFactor === ''">--</span>
                          <span v-else>{{ paramsForm.fundingRateFactor }} %</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="fundingRateFactor">
                            <el-input v-model="paramsForm.fundingRateFactor" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                    <!-- AMM risk minFundingRateLimit -->
                    <tr>
                      <td>
                        {{ $t('contractInfo.riskParams.minFundingRateFactor') }}
                      </td>
                      <td class="value">
                        {{ selectedPerpetualStorage.fundingRateFactor.minValue.times(100) | bigNumberFormatter(2) }} %
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.minFundingRateFactor === ''">--</span>
                          <span v-else>{{ paramsForm.minFundingRateFactor }} %</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="minMaxFundingRateFactor">
                            <el-input v-model="paramsForm.minFundingRateFactor" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                    <!-- AMM risk maxFundingRateFactor -->
                    <tr>
                      <td>
                        {{ $t('contractInfo.riskParams.maxFundingRateFactor') }}
                      </td>
                      <td class="value">
                        {{ selectedPerpetualStorage.fundingRateFactor.maxValue.times(100) | bigNumberFormatter(2) }} %
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.maxFundingRateFactor === ''">--</span>
                          <span v-else>{{ paramsForm.maxFundingRateFactor }} %</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="minMaxFundingRateFactor">
                            <el-input v-model="paramsForm.maxFundingRateFactor" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                    <!-- AMM risk fundingRateLimit -->
                    <tr>
                      <td>
                        {{ $t('contractInfo.riskParams.fundingRateLimit') }}
                      </td>
                      <td class="value">
                        {{ selectedPerpetualStorage.fundingRateLimit.value.times(100) | bigNumberFormatter(2) }} %
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.fundingRateLimit === ''">--</span>
                          <span v-else>{{ paramsForm.fundingRateLimit }} %</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="fundingRateLimit">
                            <el-input v-model="paramsForm.fundingRateLimit" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                    <!-- AMM risk minFundingRateLimit -->
                    <tr>
                      <td>
                        {{ $t('contractInfo.riskParams.minFundingRateLimit') }}
                      </td>
                      <td class="value">
                        {{ selectedPerpetualStorage.fundingRateLimit.minValue.times(100) | bigNumberFormatter(2) }} %
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.minFundingRateLimit === ''">--</span>
                          <span v-else>{{ paramsForm.minFundingRateLimit }} %</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="minMaxFundingRateLimit">
                            <el-input v-model="paramsForm.minFundingRateLimit" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                    <!-- AMM risk maxFundingRateLimit -->
                    <tr>
                      <td>
                        {{ $t('contractInfo.riskParams.maxFundingRateLimit') }}
                      </td>
                      <td class="value">
                        {{ selectedPerpetualStorage.fundingRateLimit.maxValue.times(100) | bigNumberFormatter(2) }} %
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.maxFundingRateLimit === ''">--</span>
                          <span v-else>{{ paramsForm.maxFundingRateLimit }} %</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="minMaxFundingRateLimit">
                            <el-input v-model="paramsForm.maxFundingRateLimit" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                    <!-- AMM risk AMMMaxLeverage -->
                    <tr>
                      <td>
                        {{ $t('contractInfo.riskParams.ammMaxLeverage') }}
                      </td>
                      <td class="value">
                        {{ selectedPerpetualStorage.ammMaxLeverage.value | bigNumberFormatter(2) }} x
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.ammMaxLeverage === ''">--</span>
                          <span v-else>{{ paramsForm.ammMaxLeverage }} x</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="ammMaxLeverage">
                            <el-input v-model="paramsForm.ammMaxLeverage" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                    <!-- AMM risk minAMMMaxLeverage -->
                    <tr>
                      <td>
                        {{ $t('contractInfo.riskParams.minAMMMaxLeverage') }}
                      </td>
                      <td class="value">
                        {{ selectedPerpetualStorage.ammMaxLeverage.minValue | bigNumberFormatter(2) }} x
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.minAMMMaxLeverage === ''">--</span>
                          <span v-else>{{ paramsForm.minAMMMaxLeverage }} x</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="minMaxAMMMaxLeverage">
                            <el-input v-model="paramsForm.minAMMMaxLeverage" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                    <!-- AMM risk maxAMMMaxLeverage -->
                    <tr>
                      <td>
                        {{ $t('contractInfo.riskParams.maxAMMMaxLeverage') }}
                      </td>
                      <td class="value">
                        {{ selectedPerpetualStorage.ammMaxLeverage.maxValue | bigNumberFormatter(2) }} x
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.maxAMMMaxLeverage === ''">--</span>
                          <span v-else>{{ paramsForm.maxAMMMaxLeverage }} x</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="minMaxAMMMaxLeverage">
                            <el-input v-model="paramsForm.maxAMMMaxLeverage" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                    <!-- AMM risk closePriceDiscount -->
                    <tr>
                      <td>
                        {{ $t('contractInfo.riskParams.closePriceDiscount') }}
                      </td>
                      <td class="value">
                        {{ selectedPerpetualStorage.maxClosePriceDiscount.value.times(100) | bigNumberFormatter(2) }} %
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.closePriceDiscount === ''">--</span>
                          <span v-else>{{ paramsForm.closePriceDiscount }} %</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="closePriceDiscount">
                            <el-input v-model="paramsForm.closePriceDiscount" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                    <!-- AMM risk minClosePriceDiscount -->
                    <tr>
                      <td>
                        {{ $t('contractInfo.riskParams.minClosePriceDiscount') }}
                      </td>
                      <td class="value">
                        {{ selectedPerpetualStorage.maxClosePriceDiscount.minValue.times(100) | bigNumberFormatter(2) }}
                        %
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.minClosePriceDiscount === ''">--</span>
                          <span v-else>{{ paramsForm.minClosePriceDiscount }} %</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="minMaxClosePriceDiscount">
                            <el-input v-model="paramsForm.minClosePriceDiscount" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                    <!-- AMM risk maxClosePriceDiscount -->
                    <tr>
                      <td>
                        {{ $t('contractInfo.riskParams.maxClosePriceDiscount') }}
                      </td>
                      <td class="value">
                        {{ selectedPerpetualStorage.maxClosePriceDiscount.maxValue.times(100) | bigNumberFormatter(2) }}
                        %
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.maxClosePriceDiscount === ''">--</span>
                          <span v-else>{{ paramsForm.maxClosePriceDiscount }} %</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="minMaxClosePriceDiscount">
                            <el-input v-model="paramsForm.maxClosePriceDiscount" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>

                    <!-- AMM risk baseFundingRate -->
                    <tr>
                      <td>
                        <span v-html="$t('contractInfo.riskParams.baseFundingRate')"></span>
                      </td>
                      <td class="value">
                        {{ selectedPerpetualStorage.baseFundingRate.value.times(100) | bigNumberFormatter(2) }} %
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.baseFundingRate === ''">--</span>
                          <span v-else>{{ paramsForm.baseFundingRate }} %</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="baseFundingRate">
                            <el-input v-model="paramsForm.baseFundingRate" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                    <!-- AMM risk minClosePriceDiscount -->
                    <tr>
                      <td>
                        <sapn v-html="$t('contractInfo.riskParams.minBaseFundingRate')"></sapn>
                      </td>
                      <td class="value">
                        {{ selectedPerpetualStorage.baseFundingRate.minValue.times(100) | bigNumberFormatter(2) }}
                        %
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.minBaseFundingRate === ''">--</span>
                          <span v-else>{{ paramsForm.minBaseFundingRate }} %</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="minMaxBaseFundingRate">
                            <el-input v-model="paramsForm.minBaseFundingRate" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                    <!-- AMM risk maxBaseFundingRate -->
                    <tr>
                      <td>
                        <span v-html="$t('contractInfo.riskParams.maxBaseFundingRate')"></span>
                      </td>
                      <td class="value">
                        {{ selectedPerpetualStorage.baseFundingRate.maxValue.times(100) | bigNumberFormatter(2) }}
                        %
                      </td>
                      <td class="value">
                        <span v-if="step02Status === 'show'">
                          <span v-if="paramsForm.maxBaseFundingRate === ''">--</span>
                          <span v-else>{{ paramsForm.maxBaseFundingRate }} %</span>
                        </span>
                        <span v-show="step02Status === 'edit'">
                          <el-form-item prop="minMaxBaseFundingRate">
                            <el-input v-model="paramsForm.maxBaseFundingRate" size="mini"></el-input>
                          </el-form-item>
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </el-form>
        </div>
        <div class="step-button-box">
          <div v-if="step02Status === 'edit'" class="edit-button">
            <div class="create-button">
              <el-button class="large" @click="step02Status = 'show'" :disabled="!selectedPerpetualStorage">
                {{ $t('base.next') }}
              </el-button>
            </div>
          </div>
          <el-alert type="error" :closable="false" v-if="!isModify && step02Status === 'show'">
            {{ $t('pool.poolProposal.perpParamsProposal.modifyErrorTip') }}
          </el-alert>
          <div v-if="step02Status === 'show'" class="show-button">
            <div class="info-button">
              <el-button class="large" type="secondary" @click="step02Status = 'edit'" :disabled="buttonIsLoading">
                {{ $t('base.edit') }}
              </el-button>
            </div>
            <div class="create-button">
              <el-tooltip
                class="item"
                effect="dark"
                placement="top"
                :disabled="!createButtonIsDisabled || canCreateProposal"
              >
                <template slot="content">
                  <span v-if="hasActiveProposal" v-html="$t('pool.poolProposal.hasActiveProposalTip')"></span>
                  <span
                    v-else-if="!hasOperator && !canCreateProposal"
                    v-html="$t('pool.poolProposal.operatorHasExpiredTip')"
                  ></span>
                  <span v-else v-html="$t('pool.poolProposal.onlyOperatorCreateProposalTip')"></span>
                </template>
                <el-button
                  class="large"
                  @click="onCreateProposalEvent"
                  :class="{ 'is-disabled': createButtonIsDisabled }"
                >
                  {{ $t('pool.poolInfo.governanceList.createProposal') }}
                  <i v-if="buttonIsLoading" class="el-icon-loading"></i>
                </el-button>
              </el-tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import { LiquidityPoolDirectoryItem, PerpetualCombinedState } from '@/type'
import { ethers } from 'ethers'
import { namespace } from 'vuex-class'
import { ModifyPerpParamsPoolProposal } from '@/template/components/Pool/poolProposalMixin'
import { getPerpetualID } from '@/utils'
import { getEmptyChangePerpetualParamsProposalForm, mergePerpetualParameters, } from './typs'
import { _1, PerpetualState, PerpetualStorage } from '@mcdex/mai3.js'
import AsyncComputed from '@romancow/vue-async-computed-decorator'
import { ElForm } from 'element-ui/types/form'
import BigNumber from 'bignumber.js'
import { waitTransaction } from '@/utils/transaction'
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
    return minValue.isNaN() || maxValue.isNaN() || currentValue.isNaN() ? false : currentValue.gte(minValue) && currentValue.lte(maxValue)
  }
}
function getValidParams(after: string, before: string): string {
  const afterNumber = Number(after)
  if (after === '' || isNaN(afterNumber)) {
    return before
  }
  return after
}
function emptyValidator(val: string): boolean {
  return val.trim() === '' || isNaN(Number(val))
}
function validatorMinMaxParams(minValue: string, maxValue: string): boolean {
  if (minValue === '' && maxValue === '') {
    return true
  }
  const minValueFloat = Number(minValue)
  const maxValueFloat = Number(maxValue)
  if (isNaN(minValueFloat) || isNaN(maxValueFloat)) {
    return false
  } else if (minValueFloat < 0 || maxValueFloat < 0) {
    return false
  } else {
    return true
  }
}

function validatorNumber(value: string): boolean {
  if (value === '') {
    return true
  }
  const valueFloat = Number(value)
  return !isNaN(valueFloat)
}

const wallet = namespace('wallet')
const perpetual = namespace('perpetual')
interface PerpetualItem {
  index: number
  symbol: string
  collateralSymbol: string
  underlyingSymbol: string
}
@Component
export default class PerpParamsProposal extends Mixins(ErrorHandlerMixin) {
  @Prop({ required: true }) liquidityPool !: LiquidityPoolDirectoryItem | null
  @Prop({ required: true }) canCreateProposal !: boolean
  @Prop({ required: true }) hasActiveProposal !: boolean
  @Prop({ required: true }) hasOperator !: boolean
  @wallet.Getter('signer') signer !: ethers.Signer | null
  @perpetual.Getter('getPerpetualFunc') getPerpetualFunc!: (perpetualID: string) => PerpetualCombinedState | null
  mounted() {
    this.loadPoolPerpetuals()
  }
  private paramsForm = getEmptyChangePerpetualParamsProposalForm()
  private isModify: boolean = false
  private currentStepIndex: number = 0
  private buttonIsLoading: boolean = false
  private perpetuals: PerpetualItem[] = []
  private currentSelectedPerpIndex: number = 0
  private stepsStatus: { [index: number]: 'edit' | 'show' } = {
    0: 'edit',
    1: 'edit',
  }
  get contractParamsRule() {
    return {
      initialMarginRate: [
        { validator: this.validateInputNumber, trigger: 'change' },
        { validator: this.validateValidMarginRate, trigger: 'change' },
        { validator: this.validateMarginRate, trigger: 'change' },
      ],
      maintenanceMarginRate: [
        { validator: this.validateInputNumber, trigger: 'change' },
        { validator: this.validateValidMarginRate, trigger: 'change' },
        { validator: this.validateMarginRate, trigger: 'change' },
      ],
      operatorFeeRate: [
        { validator: this.validateInputNumber, trigger: 'change' },
        { validator: this.validateValidRate, trigger: 'change' },
        {
          validator: (rule: any, value: string, callback: Function) => {
            if (value === '') {
              callback()
              return
            }
            const valueFloat = Number(value)
            if (isNaN(valueFloat) || valueFloat < 0 || valueFloat >= 1) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
            } else {
              callback()
            }
          },
          trigger: 'change'
        }
      ],
      lpFeeRate: [
        { validator: this.validateInputNumber, trigger: 'change' },
        { validator: this.validateValidRate, trigger: 'change' },
        {
          validator: (rule: any, value: string, callback: Function) => {
            if (value === '') {
              callback()
              return
            }
            const valueFloat = Number(value)
            if (isNaN(valueFloat) || valueFloat < 0 || valueFloat >= 1) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
            } else {
              callback()
            }
          },
          trigger: 'change'
        }
      ],
      liquidationPenaltyRate: [
        { validator: this.validateInputNumber, trigger: 'change' },
        { validator: this.validateValidRate, trigger: 'change' },
        { validator: this.validateMarginRate, trigger: 'change' },
      ],
      insuranceFundRate: [
        { validator: this.validateInputNumber, trigger: 'change' },
        { validator: this.validateValidRate, trigger: 'change' },
      ],
      keeperGasReward: [
        { validator: this.validateInputNumber, trigger: 'change' },
      ],
      referrerRebateRate: [
        { validator: this.validateInputNumber, trigger: 'change' },
        { validator: this.validateValidRate, trigger: 'change' },
      ],
      maxOpenInterestRate: [
        { validator: this.validateInputNumber, trigger: 'change' },
      ],
      defaultTargetLeverage: [
        { validator: this.validateInputNumber, trigger: 'change' },
        { validator: this.validateDefaultTargetLev, trigger: 'change' },
      ]
    }
  }
  get riskParamsRule() {
    return {
      halfSpread: [
        { validator: this.validateInputNumber, trigger: 'change' },
        {
          validator: (rule: any, val: any, callback: Function) => {
            if (val === '' || !this.selectedPerpetualStorage) {
              callback()
              return
            }
            const value = getValidParams(
              this.paramsForm.halfSpread,
              this.selectedPerpetualStorage.halfSpread.value.times(100).toFixed()
            )
            const minValue = getValidParams(
              this.paramsForm.minHalfSpread,
              this.selectedPerpetualStorage.halfSpread.minValue.times(100).toFixed()
            )
            const maxValue = getValidParams(
              this.paramsForm.maxHalfSpread,
              this.selectedPerpetualStorage.halfSpread.maxValue.times(100).toFixed()
            )
            if (!outOfRangeValidator(minValue, maxValue, value)) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
            } else {
              callback()
            }
          },
          trigger: 'change'
        }
      ],
      minMaxHalfSpread: [
        {
          validator: (rule: any, val: any, callback: Function) => {
            if (validatorMinMaxParams(this.paramsForm.minHalfSpread, this.paramsForm.maxHalfSpread)) {
              callback()
            } else {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
            }
          },
          trigger: 'change'
        },
        {
          validator: (rule: any, val: any, callback: Function) => {
            if (val === '' || !this.selectedPerpetualStorage) {
              callback()
              return
            }
            const minValue = getValidParams(
              this.paramsForm.minHalfSpread,
              this.selectedPerpetualStorage.halfSpread.minValue.times(100).toFixed()
            )
            const maxValue = getValidParams(
              this.paramsForm.maxHalfSpread,
              this.selectedPerpetualStorage.halfSpread.maxValue.times(100).toFixed()
            )
            if (!minMaxValidator(minValue, maxValue)) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
              return
            }
            const min = new BigNumber(minValue)
            if (min.lt(0)) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
              return
            }
            const max = new BigNumber(maxValue)
            if (max.gt(100)) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
              return
            }
            callback()
          },
          trigger: 'change'
        }
      ],
      openSlippage: [
        { validator: this.validateInputNumber, trigger: 'change' },
        {
          validator: (rule: any, val: any, callback: Function) => {
            if (val === '' || !this.selectedPerpetualStorage) {
              callback()
              return
            }
            const value = getValidParams(
              this.paramsForm.openSlippage,
              this.selectedPerpetualStorage.openSlippageFactor.value.toFixed()
            )
            const minValue = getValidParams(
              this.paramsForm.minOpenSlippage,
              this.selectedPerpetualStorage.openSlippageFactor.minValue.toFixed()
            )
            const maxValue = getValidParams(
              this.paramsForm.maxOpenSlippage,
              this.selectedPerpetualStorage.openSlippageFactor.maxValue.toFixed()
            )
            if (!outOfRangeValidator(minValue, maxValue, value)) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
            } else {
              callback()
            }
          },
          trigger: 'change'
        }
      ],
      minMaxOpenSlippage: [
        {
          validator: (rule: any, val: any, callback: Function) => {
            if (validatorMinMaxParams(this.paramsForm.minOpenSlippage, this.paramsForm.maxOpenSlippage)) {
              callback()
            } else {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
            }
          },
          trigger: 'change'
        },
        {
          validator: (rule: any, val: any, callback: Function) => {
            if (val === '' || !this.selectedPerpetualStorage) {
              callback()
              return
            }
            const minValue = getValidParams(
              this.paramsForm.minOpenSlippage,
              this.selectedPerpetualStorage.openSlippageFactor.minValue.toFixed()
            )
            const maxValue = getValidParams(
              this.paramsForm.maxOpenSlippage,
              this.selectedPerpetualStorage.openSlippageFactor.maxValue.toFixed()
            )
            if (!minMaxValidator(minValue, maxValue)) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
              return
            }
            const min = new BigNumber(minValue)
            if (min.lt(0)) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
              return
            }
            callback()
          },
          trigger: 'change'
        }
      ],
      closeSlippage: [
        { validator: this.validateInputNumber, trigger: 'change' },
        {
          validator: (rule: any, val: any, callback: Function) => {
            if (val === '' || !this.selectedPerpetualStorage) {
              callback()
              return
            }
            const value = getValidParams(
              this.paramsForm.closeSlippage,
              this.selectedPerpetualStorage.closeSlippageFactor.value.toFixed()
            )
            const minValue = getValidParams(
              this.paramsForm.minCloseSlippage,
              this.selectedPerpetualStorage.closeSlippageFactor.minValue.toFixed()
            )
            const maxValue = getValidParams(
              this.paramsForm.maxCloseSlippage,
              this.selectedPerpetualStorage.closeSlippageFactor.maxValue.toFixed()
            )
            if (!outOfRangeValidator(minValue, maxValue, value)) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
            } else {
              callback()
            }
          },
          trigger: 'change'
        }
      ],
      minMaxCloseSlippage: [
        {
          validator: (rule: any, val: any, callback: Function) => {
            if (validatorMinMaxParams(this.paramsForm.minCloseSlippage, this.paramsForm.maxCloseSlippage)) {
              callback()
            } else {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
            }
          },
          trigger: 'change'
        },
        {
          validator: (rule: any, val: any, callback: Function) => {
            if (val === '' || !this.selectedPerpetualStorage) {
              callback()
              return
            }
            const minValue = getValidParams(
              this.paramsForm.minCloseSlippage,
              this.selectedPerpetualStorage.closeSlippageFactor.minValue.toFixed()
            )
            const maxValue = getValidParams(
              this.paramsForm.maxCloseSlippage,
              this.selectedPerpetualStorage.closeSlippageFactor.maxValue.toFixed()
            )
            const minOpenSlippageValue = getValidParams(
              this.paramsForm.minOpenSlippage,
              this.selectedPerpetualStorage.openSlippageFactor.minValue.toFixed()
            )
            const maxOpenSlippageValue = getValidParams(
              this.paramsForm.maxOpenSlippage,
              this.selectedPerpetualStorage.openSlippageFactor.maxValue.toFixed()
            )
            if (!minMaxValidator(minValue, maxValue)) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
              return
            }
            const min = new BigNumber(minValue)
            if (min.lt(0) || min.gt(new BigNumber(minOpenSlippageValue))) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
              return
            }
            const max = new BigNumber(maxValue)
            if (max.gt(new BigNumber(maxOpenSlippageValue))) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
              return
            }
            callback()
          },
          trigger: 'change'
        }
      ],
      fundingRateFactor: [
        { validator: this.validateInputNumber, trigger: 'change' },
        {
          validator: (rule: any, val: any, callback: Function) => {
            if (val === '' || !this.selectedPerpetualStorage) {
              callback()
              return
            }
            const value = getValidParams(
              this.paramsForm.fundingRateFactor,
              this.selectedPerpetualStorage.fundingRateFactor.value.times(100).toFixed()
            )
            const minValue = getValidParams(
              this.paramsForm.minFundingRateFactor,
              this.selectedPerpetualStorage.fundingRateFactor.minValue.times(100).toFixed()
            )
            const maxValue = getValidParams(
              this.paramsForm.maxFundingRateFactor,
              this.selectedPerpetualStorage.fundingRateFactor.maxValue.times(100).toFixed()
            )
            if (!outOfRangeValidator(minValue, maxValue, value)) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
            } else {
              callback()
            }
          },
          trigger: 'change'
        }
      ],
      minMaxFundingRateFactor: [
        {
          validator: (rule: any, val: any, callback: Function) => {
            if (validatorMinMaxParams(this.paramsForm.minFundingRateFactor, this.paramsForm.maxFundingRateFactor)) {
              callback()
            } else {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
            }
          },
          trigger: 'change'
        },
        {
          validator: (rule: any, val: any, callback: Function) => {
            if (val === '' || !this.selectedPerpetualStorage) {
              callback()
              return
            }
            const minValue = getValidParams(
              this.paramsForm.minFundingRateFactor,
              this.selectedPerpetualStorage.fundingRateFactor.minValue.times(100).toFixed()
            )
            const maxValue = getValidParams(
              this.paramsForm.maxFundingRateLimit,
              this.selectedPerpetualStorage.fundingRateFactor.maxValue.times(100).toFixed()
            )
            if (!minMaxValidator(minValue, maxValue)) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
              return
            }
            const min = new BigNumber(minValue)
            if (min.lt(0)) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
              return
            }
            const max = new BigNumber(maxValue)
            if (max.gt(100)) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
              return
            }
            callback()
          },
          trigger: 'change'
        }
      ],
      fundingRateLimit: [
        { validator: this.validateInputNumber, trigger: 'change' },
        {
          validator: (rule: any, val: any, callback: Function) => {
            if (val === '' || !this.selectedPerpetualStorage) {
              callback()
              return
            }
            const value = getValidParams(
              this.paramsForm.fundingRateLimit,
              this.selectedPerpetualStorage.fundingRateLimit.value.times(100).toFixed()
            )
            const minValue = getValidParams(
              this.paramsForm.minFundingRateLimit,
              this.selectedPerpetualStorage.fundingRateLimit.minValue.times(100).toFixed()
            )
            const maxValue = getValidParams(
              this.paramsForm.maxFundingRateLimit,
              this.selectedPerpetualStorage.fundingRateLimit.maxValue.times(100).toFixed()
            )
            if (!outOfRangeValidator(minValue, maxValue, value)) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
            } else {
              callback()
            }
          },
          trigger: 'change'
        }
      ],
      minMaxFundingRateLimit: [
        {
          validator: (rule: any, val: any, callback: Function) => {
            if (validatorMinMaxParams(this.paramsForm.minFundingRateLimit, this.paramsForm.maxFundingRateLimit)) {
              callback()
            } else {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
            }
          },
          trigger: 'change'
        },
        {
          validator: (rule: any, val: any, callback: Function) => {
            if (val === '' || !this.selectedPerpetualStorage) {
              callback()
              return
            }
            const minValue = getValidParams(
              this.paramsForm.minFundingRateLimit,
              this.selectedPerpetualStorage.fundingRateLimit.minValue.times(100).toFixed()
            )
            const maxValue = getValidParams(
              this.paramsForm.maxFundingRateLimit,
              this.selectedPerpetualStorage.fundingRateLimit.maxValue.times(100).toFixed()
            )
            if (!minMaxValidator(minValue, maxValue)) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
              return
            }
            const min = new BigNumber(minValue)
            if (min.lt(0)) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
              return
            }
            const max = new BigNumber(maxValue)
            if (max.gt(100)) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
              return
            }
            callback()
          },
          trigger: 'change'
        }
      ],
      ammMaxLeverage: [
        { validator: this.validateInputNumber, trigger: 'change' },
        {
          validator: (rule: any, val: any, callback: Function) => {
            if (val === '' || !this.selectedPerpetualStorage) {
              callback()
              return
            }
            const value = getValidParams(
              this.paramsForm.ammMaxLeverage,
              this.selectedPerpetualStorage.ammMaxLeverage.value.toFixed()
            )
            const minValue = getValidParams(
              this.paramsForm.minAMMMaxLeverage,
              this.selectedPerpetualStorage.ammMaxLeverage.minValue.toFixed()
            )
            const maxValue = getValidParams(
              this.paramsForm.maxAMMMaxLeverage,
              this.selectedPerpetualStorage.ammMaxLeverage.maxValue.toFixed()
            )
            if (!outOfRangeValidator(minValue, maxValue, value)) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
              return
            }
            if (new BigNumber(value).isZero()) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
              return
            }
            const initialMarginRate = getValidParams(
              this.paramsForm.initialMarginRate,
              this.selectedPerpetualStorage.initialMarginRate.times(100).toFixed()
            )
            if (_1.div(value).lt(new BigNumber(initialMarginRate).div(100))) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
              return
            }
            callback()
          },
          trigger: 'change'
        }
      ],
      minMaxAMMMaxLeverage: [
        {
          validator: (rule: any, val: any, callback: Function) => {
            if (!validatorMinMaxParams(this.paramsForm.minAMMMaxLeverage, this.paramsForm.maxAMMMaxLeverage)) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
              return
            }
            callback()
          },
          trigger: 'change'
        },
        {
          validator: (rule: any, val: any, callback: Function) => {
            if (val === '' || !this.selectedPerpetualStorage) {
              callback()
              return
            }
            const minValue = getValidParams(
              this.paramsForm.minAMMMaxLeverage,
              this.selectedPerpetualStorage.ammMaxLeverage.minValue.toFixed()
            )
            const maxValue = getValidParams(
              this.paramsForm.maxAMMMaxLeverage,
              this.selectedPerpetualStorage.ammMaxLeverage.maxValue.toFixed()
            )
            if (!minMaxValidator(minValue, maxValue)) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
              return
            }
            const min = new BigNumber(minValue)
            if (min.lt(0)) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
              return
            }
            callback()
          },
          trigger: 'change'
        }
      ],
      closePriceDiscount: [
        { validator: this.validateInputNumber, trigger: 'change' },
        {
          validator: (rule: any, val: any, callback: Function) => {
            if (val === '' || !this.selectedPerpetualStorage) {
              callback()
              return
            }
            const value = getValidParams(
              this.paramsForm.closePriceDiscount,
              this.selectedPerpetualStorage.maxClosePriceDiscount.value.times(100).toFixed()
            )
            const minValue = getValidParams(
              this.paramsForm.minClosePriceDiscount,
              this.selectedPerpetualStorage.maxClosePriceDiscount.minValue.times(100).toFixed()
            )
            const maxValue = getValidParams(
              this.paramsForm.maxClosePriceDiscount,
              this.selectedPerpetualStorage.maxClosePriceDiscount.maxValue.times(100).toFixed()
            )
            if (!outOfRangeValidator(minValue, maxValue, value)) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
            } else {
              callback()
            }
          },
          trigger: 'change'
        }
      ],
      minMaxClosePriceDiscount: [
        {
          validator: (rule: any, val: any, callback: Function) => {
            if (validatorMinMaxParams(this.paramsForm.minClosePriceDiscount, this.paramsForm.maxClosePriceDiscount)) {
              callback()
            } else {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
            }
          },
          trigger: 'change'
        },
        {
          validator: (rule: any, val: any, callback: Function) => {
            if (val === '' || !this.selectedPerpetualStorage) {
              callback()
              return
            }
            const minValue = getValidParams(
              this.paramsForm.minClosePriceDiscount,
              this.selectedPerpetualStorage.maxClosePriceDiscount.minValue.times(100).toFixed()
            )
            const maxValue = getValidParams(
              this.paramsForm.maxClosePriceDiscount,
              this.selectedPerpetualStorage.maxClosePriceDiscount.maxValue.times(100).toFixed()
            )
            if (!minMaxValidator(minValue, maxValue)) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
              return
            }
            const min = new BigNumber(minValue)
            if (min.lt(0)) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
              return
            }
            const max = new BigNumber(maxValue)
            if (max.gt(100)) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
              return
            }
            callback()
          },
          trigger: 'change'
        }
      ],
      baseFundingRate: [
        { validator: this.validateNumber, trigger: 'change' },
        {
          validator: (rule: any, val: any, callback: Function) => {
            if (val === '' || !this.selectedPerpetualStorage) {
              callback()
              return
            }
            const value = getValidParams(
              this.paramsForm.baseFundingRate,
              this.selectedPerpetualStorage.baseFundingRate.value.times(100).toFixed()
            )
            const minValue = getValidParams(
              this.paramsForm.minBaseFundingRate,
              this.selectedPerpetualStorage.baseFundingRate.minValue.times(100).toFixed()
            )
            const maxValue = getValidParams(
              this.paramsForm.maxBaseFundingRate,
              this.selectedPerpetualStorage.baseFundingRate.maxValue.times(100).toFixed()
            )
            if (!outOfRangeValidator(minValue, maxValue, value)) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
            } else {
              callback()
            }
          },
          trigger: 'change'
        }
      ],
      minMaxBaseFundingRate: [
        {
          validator: (rule: any, val: any, callback: Function) => {
            if (validatorNumber(this.paramsForm.minBaseFundingRate) && validatorNumber(this.paramsForm.maxBaseFundingRate)) {
              callback()
            } else {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
            }
          },
          trigger: 'change'
        },
        {
          validator: (rule: any, val: any, callback: Function) => {
            if (val === '' || !this.selectedPerpetualStorage) {
              callback()
              return
            }
            const minValue = getValidParams(
              this.paramsForm.minBaseFundingRate,
              this.selectedPerpetualStorage.baseFundingRate.minValue.times(100).toFixed()
            )
            const maxValue = getValidParams(
              this.paramsForm.maxBaseFundingRate,
              this.selectedPerpetualStorage.baseFundingRate.maxValue.times(100).toFixed()
            )
            if (!minMaxValidator(minValue, maxValue)) {
              callback(new Error(this.$t('commonErrors.inputError').toString()))
              return
            }
            callback()
          },
          trigger: 'change'
        }
      ],
    }
  }
  get paramsFormRule() {
    return {
      ...this.contractParamsRule,
      ...this.riskParamsRule
    }
  }
  get step01Status(): 'edit' | 'show' {
    return this.stepsStatus[0]
  }
  set step01Status(status: 'edit' | 'show') {
    this.stepsStatus[0] = status
  }
  get step02Status(): 'edit' | 'show' {
    return this.stepsStatus[1]
  }
  set step02Status(status: 'edit' | 'show') {
    this.stepsStatus[1] = status
  }
  get createButtonIsDisabled(): boolean {
    if (!this.formParamsIsValid) {
      return true
    }
    if (!this.canCreateProposal) {
      return true
    }
    if (this.currentStepIndex !== 1 || this.step02Status !== 'show') {
      return true
    }
    return this.buttonIsLoading
  }
  @AsyncComputed({
    watch: ['step02Status'],
  })
  get formParamsValidatorIsPass() {
    return this.formValidator()
  }
  get formParamsIsValid(): boolean {
    const checkStatus = this.formParamsValidatorIsPass
    let isModify: boolean = false
    const formValues = Object.values(this.paramsForm)
    for (let i in formValues) {
      const val = formValues[i]
      const vn = Number(val)
      if (val !== '' && !isNaN(vn)) {
        isModify = true
        break
      }
    }
    this.isModify = isModify
    if (checkStatus && isModify) {
      return true
    }
    return false
  }
  get selectedPerpetual(): PerpetualItem | null {
    return this.perpetuals[this.currentSelectedPerpIndex] || null
  }
  get selectedPerpetualCombinedState(): PerpetualCombinedState | null {
    if (!this.getPerpetualFunc || !this.selectedPerpetual || !this.liquidityPool) {
      return null
    }
    const perpetualID = getPerpetualID(this.liquidityPool.liquidityPoolAddress, this.selectedPerpetual.index)
    return this.getPerpetualFunc(perpetualID)
  }
  get selectedPerpetualStorage(): PerpetualStorage | null {
    if (!this.selectedPerpetualCombinedState) {
      return null
    }
    return this.selectedPerpetualCombinedState.perpetualStorage
  }
  get collateralSymbol(): string {
    return this.selectedPerpetualCombinedState?.perpetualProperty.collateralTokenSymbol || ''
  }
  @Watch('liquidityPool')
  loadPoolPerpetuals() {
    if (!this.liquidityPool) {
      return
    }
    const perpetualsStorage = this.liquidityPool.liquidityPoolStorage.perpetuals
    this.perpetuals = []
    this.liquidityPool.perpetualPropertyMap.forEach(val => {
      const perpetualStorage = perpetualsStorage.get(val.perpetualIndex)
      if (perpetualStorage && perpetualStorage.state === PerpetualState.NORMAL) {
        this.perpetuals.push({
          index: val.perpetualIndex,
          symbol: val.symbolStr,
          collateralSymbol: val.collateralTokenSymbol,
          underlyingSymbol: val.underlyingAssetSymbol,
        })
      }
    })
  }
  validateNumber(rule: any, value: string, callback: Function) {
    if (value === '') {
      callback()
      return
    }
    const valueFloat = Number(value)
    if (isNaN(valueFloat)) {
      callback(new Error(this.$t('commonErrors.inputError').toString()))
    } else {
      callback()
    }
  }
  // validate start
  validateInputNumber(rule: any, value: string, callback: Function) {
    if (value === '') {
      callback()
      return
    }
    const valueFloat = Number(value)
    if (isNaN(valueFloat)) {
      callback(new Error(this.$t('commonErrors.inputError').toString()))
    } else if (valueFloat < 0) {
      callback(new Error(this.$t('commonErrors.inputError').toString()))
    } else {
      callback()
    }
  }
  validateMarginRate(rule: any, value: string, callback: Function) {
    if (!this.selectedPerpetualStorage) {
      callback()
      return
    }
    const initialMarginRate = getValidParams(
      this.paramsForm.initialMarginRate,
      this.selectedPerpetualStorage.initialMarginRate.times(100).toFixed()
    )
    const maintenanceMarginRate = getValidParams(
      this.paramsForm.maintenanceMarginRate,
      this.selectedPerpetualStorage.maintenanceMarginRate.times(100).toFixed()
    )
    const liquidationPenaltyRate = getValidParams(
      this.paramsForm.liquidationPenaltyRate,
      this.selectedPerpetualStorage.liquidationPenaltyRate.times(100).toFixed()
    )
    if (new BigNumber(initialMarginRate).lte(maintenanceMarginRate)
      || new BigNumber(maintenanceMarginRate).lte(liquidationPenaltyRate)) {
      callback(new Error(this.$t('commonErrors.inputError').toString()))
      return
    }
    if (new BigNumber(initialMarginRate).div(100).gt(this.selectedPerpetualStorage.initialMarginRate)
      || new BigNumber(maintenanceMarginRate).div(100).gt(this.selectedPerpetualStorage.maintenanceMarginRate)) {
      callback(new Error(this.$t('commonErrors.inputError').toString()))
      return
    }
    callback()
  }
  validateValidRate(rule: any, value: string, callback: Function) {
    const valueFloat = Number(value)
    if (valueFloat < 0 || valueFloat > 100) {
      callback(new Error(this.$t('commonErrors.inputError').toString()))
    } else {
      callback()
    }
  }
  validateValidMarginRate(rule: any, value: string, callback: Function) {
    const valueFloat = Number(value)
    if (valueFloat < 0) {
      callback(new Error(this.$t('commonErrors.inputError').toString()))
    } else {
      callback()
    }
  }
  validateDefaultTargetLev(rule: any, value: string, callback: Function) {
    if (value === '') {
      callback()
      return
    }
    const defaultTargetLev = new BigNumber(this.paramsForm.defaultTargetLeverage)
    const isInt = defaultTargetLev.eq(defaultTargetLev.dp(0))
    if (this.selectedPerpetualStorage) {
      if (defaultTargetLev.lt(1) || defaultTargetLev.gt(_1.div(this.selectedPerpetualStorage?.initialMarginRate))
        || !isInt) {
        callback(new Error(this.$t('commonErrors.inputError').toString()))
      } else {
        callback()
      }
    } else {
      callback()
    }
  }
  // validate end
  async formValidator(): Promise<boolean> {
    const form = this.$refs.form as ElForm
    let valid: boolean
    try {
      valid = await form.validate()
    } catch (e) {
      return false
    }
    return valid
  }
  async onCreateProposalEvent() {
    if (this.createButtonIsDisabled) {
      return
    }
    if (this.currentStepIndex !== 1 || this.step02Status !== 'show' || !this.formParamsIsValid) {
      return
    }
    await this.callChainFunc(async () => {
      if (!this.liquidityPool || !this.signer || !this.selectedPerpetual || !this.selectedPerpetualStorage) {
        return
      }
      const poolProposal = new ModifyPerpParamsPoolProposal()
      poolProposal.buildProposalByParams(
        this.selectedPerpetual.index,
        mergePerpetualParameters(this.paramsForm, this.selectedPerpetualStorage),
        { perpetualStorage: JSON.stringify(this.selectedPerpetualStorage) }
      )
      this.buttonIsLoading = true
      const transaction = await poolProposal.createProposal(this.liquidityPool.liquidityPoolStorage.governor, this.signer)
      const transactionResult = waitTransaction(transaction)
      this.$transaction({
        location: 'top',
        transaction: transactionResult,
        content: this.$t('transaction.createProposal').toString(),
        transactionHash: transaction.hash ? transaction.hash : '',
      })
      const txResult = await transactionResult
      this.$emit('success')
      return txResult
    })
    this.buttonIsLoading = false
  }
}
</script>

<style scoped lang="scss">
@import '../governance.scss';
.perp-params-proposal {
  .step01 {
    .step-button-box {
      .edit-button {
        margin-left: 116px;
      }
      .show-button {
        margin-left: 116px;
      }
    }
  }
  .step02 {
    .step-button-box {
      .edit-button {
        margin-left: 488px;
      }
      .show-button {
        display: flex;
        margin-left: 430px;
        .create-button {
          margin-left: 104px;
        }
      }
    }
  }
  ::v-deep {
    .el-alert {
      margin-bottom: 16px;
    }
  }
  .params-table {
    display: flex;
    justify-content: space-between;
    .params-table-item {
      width: 611px;
      .table-title {
        font-size: 16px;
        font-weight: 400;
        color: var(--mc-text-color);
        margin-bottom: 22px;
      }
      table {
        width: 100%;
        text-align: center;
        tr {
          height: 40px;
          font-size: 14px;
          color: var(--mc-text-color);
        }
        .value {
          color: var(--mc-text-color-white);
        }
        th:nth-of-type(1),
        td:nth-of-type(1) {
          width: 50%;
        }
        th:nth-of-type(2),
        td:nth-of-type(2) {
          width: 28%;
        }
        th:nth-of-type(3),
        td:nth-of-type(3) {
          width: 22%;
          padding: 0 15px;
          ::v-deep {
            .el-form-item {
              margin-bottom: 0;
            }
          }
        }
      }
    }
  }
}
</style>
