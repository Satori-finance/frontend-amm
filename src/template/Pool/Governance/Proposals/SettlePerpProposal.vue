<template>
  <div class="settle-perp-proposal">
    <div class="step-item step01">
      <div class="step-title">
        <span>{{ $t('base.step') }} 1. </span>
        <span class="info">{{ $t('pool.poolProposal.settlePerpProposal.step01') }}</span>
      </div>
      <div class="step-body">
        <div class="perp-select-list">
          <table class="mc-data-table mc-data-table--border" v-if="currentStatus === 'edit'">
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
          <table class="mc-data-table mc-data-table--border" v-if="currentStatus === 'show'">
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
        <div v-if="currentStatus === 'edit'" class="edit-button">
          <div class="info-button">
            <el-button class="large" @click="currentStatus = 'show'" :disabled="!selectedPerpetual">
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
              :open-delay="400"
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
import { Component, Prop, Mixins, Watch } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import { LiquidityPoolDirectoryItem, PerpetualCombinedState } from '@/type'
import { ethers } from 'ethers'
import { namespace } from 'vuex-class'
import { SettlePerpPoolProposal } from '@/template/components/Pool/poolProposalMixin'
import { getPerpetualID } from '@/utils'
import { PerpetualState } from '@mcdex/mai3.js'
import { waitTransaction } from '@/utils/transaction'
const wallet = namespace('wallet')
const perpetual = namespace('perpetual')
interface PerpetualItem {
  index: number
  symbol: string
  collateralSymbol: string
  underlyingSymbol: string
}
@Component
export default class SettlePerpProposal extends Mixins(ErrorHandlerMixin) {
  @Prop({ required: true }) liquidityPool !: LiquidityPoolDirectoryItem | null
  @Prop({ required: true }) canCreateProposal !: boolean
  @Prop({ required: true }) hasOperator !: boolean
  @Prop({ required: true }) hasActiveProposal !: boolean
  @wallet.Getter('signer') signer !: ethers.Signer | null
  @perpetual.Getter('getPerpetualFunc') getPerpetualFunc!: (perpetualID: string) => PerpetualCombinedState | null
  mounted() {
    this.loadPoolPerpetuals()
  }
  private currentStatus: 'edit' | 'show' = 'edit'
  private buttonIsLoading: boolean = false
  private perpetuals: PerpetualItem[] = []
  private currentSelectedPerpIndex: number = 0
  get createButtonIsDisabled(): boolean {
    if (!this.liquidityPool) {
      return true
    }
    if (this.liquidityPool.liquidityPoolStorage.operator === '') {
      return true
    }
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
  get selectedPerpetual(): PerpetualItem | null {
    return this.perpetuals[this.currentSelectedPerpIndex]
  }
  get selectedPerpetualStorage(): PerpetualCombinedState | null {
    if (!this.getPerpetualFunc || !this.selectedPerpetual || !this.liquidityPool) {
      return null
    }
    const perpetualID = getPerpetualID(this.liquidityPool.liquidityPoolAddress, this.selectedPerpetual.index)
    return this.getPerpetualFunc(perpetualID)
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
  async onCreateProposalEvent() {
    if (this.createButtonIsDisabled) {
      return
    }
    await this.callChainFunc(async () => {
      if (!this.liquidityPool || !this.signer || !this.selectedPerpetualStorage || !this.selectedPerpetual) {
        return
      }
      const poolProposal = new SettlePerpPoolProposal()
      poolProposal.buildProposalByParams(
        this.selectedPerpetual.index,
        this.selectedPerpetualStorage.perpetualStorage.markPrice,
      )
      this.buttonIsLoading = true
      const promiseInstance = await poolProposal.createProposal(this.liquidityPool.liquidityPoolStorage.governor, this.signer)
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        location: 'top',
        transaction: transaction,
        content: this.$t('transaction.createProposal').toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      const txResult = await transaction
      this.$emit('success')
      return txResult
    })
    this.buttonIsLoading = false
  }
}
</script>

<style scoped lang="scss">
@import '../governance.scss';
.settle-perp-proposal {
  .step01 {
    .step-button-box {
      .edit-button {
        margin-left: 116px;
      }
      .show-button {
        display: flex;
        .create-button {
          margin-left: 84px;
        }
      }
    }
  }
}
</style>
