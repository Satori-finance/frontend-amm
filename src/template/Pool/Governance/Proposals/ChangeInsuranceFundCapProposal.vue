<template>
  <div class="change-insurance-fund-cap-proposal">
    <div class="step-item step01">
      <div class="step-title">
        <span>{{ $t('base.step') }} 1. </span>
        <span class="info">{{ $t('pool.poolProposal.changeInsuranceFundCapProposal.step01') }}</span>
      </div>
      <div class="step-body">
        <div class="line">
          <span class="label">{{ $t('base.before') }}</span>
          <span class="line-content value" v-if="beforeInsuranceFundCap">
            {{ beforeInsuranceFundCap | bigNumberFormatter }}{{ collateralSymbol }}
            <span v-if="!beforeInsuranceFundCapUSD.isZero()">
              (${{ beforeInsuranceFundCapUSD | bigNumberFormatter }})
            </span>
          </span>
        </div>
        <div class="line">
          <span class="label">{{ $t('base.after') }}</span>
          <span class="line-content">
            <el-form size="large" :model="form" :rules="formRules" ref="form" @submit.native.prevent>
              <el-form-item prop="insuranceFundCap">
                <el-input
                  v-model="form.insuranceFundCap"
                  size="large"
                  :disabled="currentStatus === 'show'"
                  :class="{ 'warning-input': insuranceFundCapValueError }"
                >
                  <span slot="suffix">
                    {{ collateralSymbol }}
                  </span>
                </el-input>
                <template slot="error" slot-scope="error" v-if="insuranceFundCapValueError">
                  <span class="warning-message el-form-item__error">{{ error.error }}</span>
                </template>
              </el-form-item>
            </el-form>
          </span>
        </div>
      </div>
      <div class="step-button-box">
        <div v-if="currentStatus === 'edit'" class="edit-button">
          <div class="info-button">
            <el-button class="large" @click="currentStatus = 'show'" :disabled="step01NextDisabled">
              {{ $t('base.next') }}
            </el-button>
          </div>
        </div>
        <div v-if="currentStatus === 'show'" class="show-button">
          <div class="info-button">
            <el-button class="large" type="secondary" @click="currentStatus = 'edit'" :disabled="buttonIsLoading">
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
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import { LiquidityPoolDirectoryItem } from '@/type'
import { namespace } from 'vuex-class'
import { ethers } from 'ethers'
import {
  ChangeInsuranceFundCapPoolProposal,
} from '@/template/components/Pool/poolProposalMixin'
import BigNumber from 'bignumber.js'
import { toBigNumber } from '@/utils'
import { _0 } from '@mcdex/mai3.js'
import { waitTransaction } from '@/utils/transaction'
const wallet = namespace('wallet')
const price = namespace('price')
@Component
export default class ChangeInsuranceFundCapProposal extends Mixins(ErrorHandlerMixin) {
  @Prop({ required: true }) liquidityPool !: LiquidityPoolDirectoryItem | null
  @Prop({ required: true, default: '' }) collateralSymbol !: string
  @Prop({ required: true }) canCreateProposal !: boolean
  @Prop({ required: true }) hasOperator !: boolean
  @Prop({ required: true }) hasActiveProposal !: boolean
  @wallet.Getter('signer') signer !: ethers.Signer | null
  @price.Action('updateTokenPrice') updateTokenPrice!: (tokens: string[]) => Promise<void>
  @price.Getter('tokenPriceFunc') tokenPriceFunc!: (token: string) => BigNumber | null
  private buttonIsLoading: boolean = false
  private currentStatus: 'edit' | 'show' = 'edit'
  private insuranceFundCapValueError: boolean = false
  private beforeInsuranceFundCapUSD: BigNumber = _0
  private form = {
    insuranceFundCap: ''
  }
  private formRules = {
    insuranceFundCap: [
      { validator: this.validateInsuranceFundCap, trigger: 'change' },
    ]
  }
  get createButtonIsDisabled(): boolean {
    if (!this.canCreateProposal) {
      return true
    }
    if (this.currentStatus === 'edit') {
      return true
    }
    if (this.buttonIsLoading) {
      return true
    }
    return false
  }
  get step01NextDisabled(): boolean {
    if (!this.liquidityPool || this.invalidInsuranceFundCap) {
      return true
    }
    return false
  }
  get beforeInsuranceFundCap(): BigNumber | null {
    if (!this.liquidityPool) {
      return null
    }
    return this.liquidityPool.liquidityPoolStorage.insuranceFundCap
  }
  get invalidInsuranceFundCap(): boolean {
    if (!this.beforeInsuranceFundCap) {
      return true
    }
    const v = toBigNumber(this.form.insuranceFundCap)
    if (v.isNaN() || v.lte(this.beforeInsuranceFundCap)) {
      return true
    }
    return false
  }
  get collateralAddress(): string {
    return this.liquidityPool?.liquidityPoolStorage.collateral || ''
  }
  get collateralPrice(): BigNumber {
    if (this.collateralAddress === '') {
      return _0
    }
    return this.tokenPriceFunc(this.collateralAddress) || _0
  }
  @Watch('collateralPrice', { immediate: true })
  onCollateralPriceChanged() {
    if (this.collateralPrice.isZero() || !this.beforeInsuranceFundCap || this.beforeInsuranceFundCap.isZero()) {
      this.beforeInsuranceFundCapUSD = _0
      return
    }
    const insuranceFundCap = toBigNumber(this.beforeInsuranceFundCap)
    this.beforeInsuranceFundCapUSD = insuranceFundCap.times(this.collateralPrice)
  }
  @Watch('collateralAddress', { immediate: true })
  onCollateralAddressChanged() {
    if (this.collateralAddress === '') {
      return
    }
    this.updateTokenPrice([this.collateralAddress])
  }
  validateInsuranceFundCap(rule: any, value: string, callback: Function) {
    this.insuranceFundCapValueError = false
    if (!this.beforeInsuranceFundCap) {
      callback()
      return
    }
    if (value === '') {
      callback(new Error(this.$t('commonErrors.cannotBeBlank').toString()))
      return
    }
    const v = toBigNumber(value)
    if (v.isNaN()) {
      callback(new Error(this.$t('commonErrors.inputError').toString()))
      return
    }
    if (v.lte(this.beforeInsuranceFundCap)) {
      this.insuranceFundCapValueError = true
      callback(new Error(this.$t('pool.poolProposal.changeInsuranceFundCapProposal.insuranceFundCapError', {
        value: this.beforeInsuranceFundCap.toFixed(2),
        symbol: this.collateralSymbol
      }).toString()))
      return
    }
    callback()
  }
  async onCreateProposalEvent() {
    if (this.createButtonIsDisabled) {
      return
    }
    await this.callChainFunc(async () => {
      if (!this.liquidityPool || !this.signer) {
        return
      }
      const poolProposal = new ChangeInsuranceFundCapPoolProposal()
      poolProposal.buildProposalByParams(
        toBigNumber(this.form.insuranceFundCap),
        {
          isAllow: this.liquidityPool.liquidityPoolStorage.isFastCreationEnabled
        },
        {
          beforeInsuranceFundCap: this.liquidityPool.liquidityPoolStorage.insuranceFundCap.toFixed()
        }
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
.change-insurance-fund-cap-proposal {
  .step01 {
    .step-body {
      margin-left: 80px;
      .line {
        line-height: 48px;
        margin-bottom: 20px;
        .label {
          display: inline-block;
          font-size: 14px;
          font-weight: 400;
          color: var(--mc-text-color);
        }
        .value {
          font-size: 16px;
          font-weight: 400;
          color: var(--mc-text-color);
        }
        .line-content {
          display: inline-block;
          margin-left: 30px;
          width: 400px;
        }
      }
    }
    .step-button-box {
      .edit-button {
        margin-left: 28px;
      }
      .show-button {
        display: flex;
        .create-button {
          margin-left: 104px;
        }
      }
    }
  }
  ::v-deep {
    .el-input.is-disabled {
      .el-input__inner {
        color: var(--mc-text-color);
      }
    }
  }
  .warning-message {
    color: var(--mc-color-warning);
    font-size: 14px;
    font-weight: 400;
  }
  .warning-input {
    border-color: var(--mc-color-warning);
  }
}
</style>
