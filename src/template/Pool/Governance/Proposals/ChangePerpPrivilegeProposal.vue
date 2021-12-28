<template>
  <div class="change-perp-privilege-proposal">
    <div class="step-item step01">
      <div class="step-title">
        <span>{{ $t('base.step') }} 1. </span>
        <span class="info">{{ $t('pool.poolProposal.changePerpPrivilegeProposal.step01') }}</span>
      </div>
      <div class="step-body">
        <el-radio v-model="selectedType" label="allow" :disabled="currentStatus === 'show'">
          {{ $t('pool.poolProposal.changePerpPrivilegeProposal.allow') }}
          <span v-if="beforeType === 'allow'">({{ $t('base.before') }})</span>
        </el-radio>
        <el-radio v-model="selectedType" label="notAllow" :disabled="currentStatus === 'show'">
          {{ $t('pool.poolProposal.changePerpPrivilegeProposal.notAllow') }}
          <span v-if="beforeType === 'notAllow'">({{ $t('base.before') }})</span>
        </el-radio>
      </div>
      <div class="step-button-box">
        <div v-if="currentStatus === 'edit'" class="edit-button">
          <div class="info-button">
            <el-button
              class="large"
              @click="currentStatus = 'show'"
              :disabled="beforeType === selectedType"
            >
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
import { Component, Mixins, Prop } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import { LiquidityPoolDirectoryItem } from '@/type'
import { namespace } from 'vuex-class'
import { ethers } from 'ethers'
import { ChangePerpPrivilegePoolProposal } from '@/template/components/Pool/poolProposalMixin'
import { waitTransaction } from '@/utils/transaction'
const wallet = namespace('wallet')
@Component
export default class ChangePerpPrivilegeProposal extends Mixins(ErrorHandlerMixin) {
  @Prop({ required: true }) liquidityPool !: LiquidityPoolDirectoryItem | null
  @Prop({ required: true }) canCreateProposal !: boolean
  @Prop({ required: true }) hasOperator !: boolean
  @Prop({ required: true }) hasActiveProposal !: boolean
  @wallet.Getter('signer') signer !: ethers.Signer | null
  private buttonIsLoading: boolean = false
  private selectedType: 'allow' | 'notAllow' = 'allow'
  private currentStatus: 'edit' | 'show' = 'edit'
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
  get beforeType(): 'allow' | 'notAllow' | null {
    if (!this.liquidityPool) {
      return null
    }
    if (this.liquidityPool.liquidityPoolStorage.isFastCreationEnabled) {
      this.selectedType = 'notAllow'
      return 'allow'
    }
    this.selectedType = 'allow'
    return 'notAllow'
  }
  getProposalDescriptionContent(): {} {
    return {}
  }
  async onCreateProposalEvent() {
    if (this.createButtonIsDisabled) {
      return
    }
    await this.callChainFunc(async () => {
      if (!this.liquidityPool || !this.signer) {
        return
      }
      const poolProposal = new ChangePerpPrivilegePoolProposal()
      poolProposal.buildProposalByParams(this.selectedType === 'allow', {
        insuranceFundCap: this.liquidityPool.liquidityPoolStorage.insuranceFundCap
      })
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
.change-perp-privilege-proposal {
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
}
</style>
