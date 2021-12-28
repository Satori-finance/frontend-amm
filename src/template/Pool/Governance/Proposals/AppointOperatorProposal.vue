<template>
  <div class="appoint-operator-proposal">
    <div class="step-item step01">
      <div class="step-title">
        <span>{{ $t('base.step') }} 1. </span>
        <span class="info">{{ $t('pool.poolProposal.appointOperatorProposal.step01') }}</span>
      </div>
      <div class="step-body">
        <el-form
          size="large"
          :model="form"
          :rules="formRule"
          ref="form"
          label-width="140px"
          :inline-message="true"
          @submit.native.prevent
        >
          <el-form-item
            prop="newOperatorAddress"
            :label="$t('pool.poolProposal.appointOperatorProposal.operatorAddress')"
          >
            <el-input v-model="newOperatorAddress" size="large" :disabled="currentStatus === 'show'"></el-input>
          </el-form-item>
        </el-form>
      </div>
      <div class="step-button-box">
        <div v-if="currentStatus === 'edit'" class="edit-button">
          <div class="info-button">
            <el-button class="large" @click="currentStatus = 'show'" :disabled="!formParamsValidatorIsPass">
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
              :disabled="canCreateProposal || !createButtonIsDisabled"
            >
              <template slot="content">
                <span v-if="hasActiveProposal" v-html="$t('pool.poolProposal.hasActiveProposalTip')"></span>
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
import { Component, Mixins, Prop } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import AsyncComputed from '@romancow/vue-async-computed-decorator'
import { ethers } from 'ethers'
import { ElForm } from 'element-ui/types/form'
import { AppointNewOperatorPoolProposal } from '@/template/components/Pool/poolProposalMixin'
import { LiquidityPoolDirectoryItem } from '@/type'
import { namespace } from 'vuex-class'
import { waitTransaction } from '@/utils/transaction'
const wallet = namespace('wallet')
@Component
export default class AppointOperatorProposal extends Mixins(ErrorHandlerMixin) {
  @Prop({ required: true }) canCreateProposal !: boolean
  @Prop({ required: true }) hasOperator !: boolean
  @Prop({ required: true }) hasActiveProposal !: boolean
  @Prop({ required: true }) liquidityPool !: LiquidityPoolDirectoryItem | null
  @wallet.Getter('signer') signer !: ethers.Signer | null
  private currentStatus: 'edit' | 'show' = 'edit'
  private buttonIsLoading: boolean = false
  private form = {
    newOperatorAddress: '',
  }
  get newOperatorAddress(): string {
    return this.form.newOperatorAddress
  }
  set newOperatorAddress(v: string) {
    this.form.newOperatorAddress = v
  }
  private formRule = {
    newOperatorAddress: [
      { validator: this.validateInputAddress, trigger: 'change' },
    ],
  }
  get createButtonIsDisabled(): boolean {
    if (!this.canCreateProposal) {
      return true
    }
    if (this.hasActiveProposal || this.hasOperator) {
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
  @AsyncComputed({
    watch: ['newOperatorAddress']
  })
  get formParamsValidatorIsPass() {
    return this.formValidator()
  }
  validateInputAddress(rule: any, value: string, callback: Function) {
    if (this.newOperatorAddress === '') {
      callback()
      return
    }
    const isAddress = ethers.utils.isAddress(value)
    if (!isAddress) {
      callback(new Error(this.$t('commonErrors.errorAddress').toString()))
    } else {
      callback()
    }
  }
  async formValidator(): Promise<boolean> {
    if (this.newOperatorAddress === '') {
      return false
    }
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
    if (!await this.formValidator()) {
      return
    }
    await this.callChainFunc(async () => {
      if (!this.liquidityPool || !this.signer) {
        return
      }
      const poolProposal = new AppointNewOperatorPoolProposal()
      poolProposal.buildProposalByParams(this.form.newOperatorAddress)
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
.appoint-operator-proposal {
  .step-item {
    width: 560px;
    .step-button-box {
      margin-left: 126px;
    }
  }
  .step01 {
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
    .el-form {
      label {
        font-size: 14px;
        font-weight: 400;
        color: var(--mc-text-color);
      }
      .is-disabled {
        .el-input__inner {
          color: var(--mc-text-color);
        }
      }
      input {
        font-size: 16px;
      }
    }
  }
}
</style>
