<template>
  <div class="create-pool-proposal">
    <div class="create-header">
      <div class="left">
        <div class="primary-title">{{ $t('pool.poolProposal.selectProposalType') }}</div>
        <div class="select-type-box">
          <el-radio v-model="selectedProposalType" :label="poolProposalTypes.ModifyPerpParams">
            {{ $t('pool.poolProposal.modifyPerpetualParams') }}
          </el-radio>
          <el-radio v-model="selectedProposalType" :label="poolProposalTypes.SettlePerp">
            {{ $t('pool.poolProposal.settlePerpetual') }}
          </el-radio>
          <el-radio v-model="selectedProposalType" :label="poolProposalTypes.ChangePerpPrivilege">
            {{ $t('pool.poolProposal.changePerpetualCreationPrivilege') }}
          </el-radio>
          <el-radio v-model="selectedProposalType" :label="poolProposalTypes.AppointNewOperator">
            {{ $t('pool.poolProposal.appointNewOperator') }}
          </el-radio>
          <el-radio v-model="selectedProposalType" :label="poolProposalTypes.ChangeInsuranceFundCap">
            {{ $t('pool.poolProposal.changeInsuranceFundCap') }}
          </el-radio>
          <el-radio v-model="selectedProposalType" :label="poolProposalTypes.ChangeOracle">
            {{ $t('pool.poolProposal.modifyOracle') }}
          </el-radio>
        </div>
        <template v-if="!canCreateProposal">
          <div class="warningText">
            <template v-if="hasActiveProposal">
              <span class="warning-text">{{ $t('pool.poolProposal.perpParamsProposal.outstandingProposal') }}</span>
            </template>
            <template v-if="hasPoolOperator">
              <span class="warning-text">{{ $t('pool.poolProposal.perpParamsProposal.alreadyHaveOperator') }}</span>
            </template>
            <template v-if="userVotes.lt(proposalThreshold)">
              <span class="warning-text">{{ $t('pool.poolProposal.perpParamsProposal.insufficientVotes') }}</span>
            </template>
          </div>
        </template>
      </div>
      <div class="right">
        <MyVotesInfo :vote-address="voteAddress" />
        <div class="info-line">
          {{ $t('pool.poolProposal.proposalThreshold', { value: uiProposalThreshold }) }}
          <div v-if="hasPoolOperator">({{ $t('pool.poolProposal.onlyOperator') }})</div>
        </div>
      </div>
    </div>
    <div class="create-steps-panel">
      <PerpParamsProposal
        v-if="selectedProposalType === poolProposalTypes.ModifyPerpParams"
        :liquidity-pool="liquidityPool"
        :can-create-proposal="canCreateProposal"
        :has-operator="hasPoolOperator"
        :has-active-proposal="hasActiveProposal"
        @success="onCreateSuccess"
      />
      <SettlePerpProposal
        v-if="selectedProposalType === poolProposalTypes.SettlePerp"
        :liquidity-pool="liquidityPool"
        :can-create-proposal="canCreateProposal"
        :has-operator="hasPoolOperator"
        :has-active-proposal="hasActiveProposal"
        @success="onCreateSuccess"
      />
      <ChangePerpPrivilegeProposal
        v-if="selectedProposalType === poolProposalTypes.ChangePerpPrivilege"
        :liquidity-pool="liquidityPool"
        :can-create-proposal="canCreateProposal"
        :has-operator="hasPoolOperator"
        :has-active-proposal="hasActiveProposal"
        @success="onCreateSuccess"
      />
      <ChangeInsuranceFundCapProposal
        v-if="selectedProposalType === poolProposalTypes.ChangeInsuranceFundCap"
        :liquidity-pool="liquidityPool"
        :can-create-proposal="canCreateProposal"
        :has-operator="hasPoolOperator"
        :has-active-proposal="hasActiveProposal"
        @success="onCreateSuccess"
        :collateral-symbol="poolBaseInfo.collateralSymbol || ''"
      />
      <AppointOperatorProposal
        v-if="selectedProposalType === poolProposalTypes.AppointNewOperator"
        :liquidity-pool="liquidityPool"
        :can-create-proposal="canCreateProposal"
        :has-operator="hasPoolOperator"
        :has-active-proposal="hasActiveProposal"
        @success="onCreateSuccess"
      />
      <ModifyPerpOracleProposal
        v-if="selectedProposalType === poolProposalTypes.ChangeOracle"
        :liquidity-pool="liquidityPool"
        :can-create-proposal="canCreateProposal"
        :has-operator="hasPoolOperator"
        :has-active-proposal="hasActiveProposal"
        @success="onCreateSuccess"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import { BaseCardFrame } from '@/components'
import { CombinedPoolProposalTypes } from '@/template/components/Pool/poolProposalMixin'
import PerpParamsProposal from './Proposals/PerpParamsProposal.vue'
import SettlePerpProposal from './Proposals/SettlePerpProposal.vue'
import ChangePerpPrivilegeProposal from './Proposals/ChangePerpPrivilegeProposal.vue'
import ChangeInsuranceFundCapProposal from './Proposals/ChangeInsuranceFundCapProposal.vue'
import AppointOperatorProposal from './Proposals/AppointOperatorProposal.vue'
import ModifyPerpOracleProposal from './Proposals/ModifyPerpOracleProposal.vue'
import MyVotesInfo from './MyVotesInfo.vue'
import { PoolBaseInfo } from '@/template/components/Pool/poolMixins'
import { LiquidityPoolDirectoryItem } from '@/type'
import { namespace } from 'vuex-class'
import { Provider } from '@ethersproject/providers'
import { ErrorHandlerMixin } from '@/mixins'
import { getLpGovernorContract, normalizeBigNumberish } from '@mcdex/mai3.js'
import BigNumber from 'bignumber.js'
import { isZeroAddress } from 'ethereumjs-util'
import { checkPoolHasActiveProposal } from '@/template/components/Pool/lowLevelPoolProposal'
import { ROUTE } from '@/router'
import { POOL_GOVERNOR_VOTES_DECIMALS } from '@/constants'
const wallet = namespace('wallet')
@Component({
  components: {
    BaseCardFrame,
    PerpParamsProposal,
    SettlePerpProposal,
    ChangePerpPrivilegeProposal,
    ChangeInsuranceFundCapProposal,
    AppointOperatorProposal,
    MyVotesInfo,
    ModifyPerpOracleProposal,
  },
})
export default class CreatePoolProposal extends Mixins(ErrorHandlerMixin) {
  @Prop({ required: true }) poolBaseInfo!: PoolBaseInfo | null
  @Prop({ required: true }) liquidityPool !: LiquidityPoolDirectoryItem | null
  @wallet.Getter('provider') provider !: Provider
  @wallet.Getter('address') userAddress !: string
  protected poolProposalTypes = CombinedPoolProposalTypes
  private selectedProposalType: CombinedPoolProposalTypes = CombinedPoolProposalTypes.ModifyPerpParams
  private proposalThreshold: BigNumber = new BigNumber(0)
  private userVotes: BigNumber = new BigNumber(0)
  private hasActiveProposal: boolean = false
  private refreshTimer: number | null = null
  mounted() {
    this.refreshTimer = window.setInterval(async () => {
      await this.refreshProposalThresholdData()
    }, 3000)
  }
  destroyed() {
    if (this.refreshTimer !== null) {
      window.clearInterval(this.refreshTimer)
    }
  }
  get canCreateProposal(): boolean {
    if (!this.liquidityPool) {
      return false
    }
    if (!this.userAddress || this.userAddress === '') {
      return false
    }
    if (this.hasActiveProposal) {
      return false
    }
    if (this.hasPoolOperator && this.liquidityPool.liquidityPoolStorage.operator.toLowerCase() === this.userAddress.toLowerCase()) {
      return true
    }
    if (!this.hasPoolOperator) {
      if (this.userVotes.gte(this.proposalThreshold)) {
        return true
      }
    }
    return false
  }
  get hasPoolOperator(): boolean {
    if (!this.liquidityPool) {
      return false
    }
    if (this.liquidityPool.liquidityPoolStorage.operator !== ''
      && !isZeroAddress(this.liquidityPool.liquidityPoolStorage.operator)) {
      return true
    }
    return false
  }
  get uiProposalThreshold() {
    return this.proposalThreshold.toFormat(POOL_GOVERNOR_VOTES_DECIMALS, BigNumber.ROUND_UP)
  }
  get voteAddress(): string {
    if (!this.poolBaseInfo) {
      return ''
    }
    return this.poolBaseInfo.voteAddress
  }
  get shareTokenAddress(): string {
    if (!this.liquidityPool) {
      return ''
    }
    return this.liquidityPool.liquidityPoolStorage.shareToken
  }
  @Watch('provider', { immediate: true })
  @Watch('userAddress', { immediate: true })
  @Watch('voteAddress', { immediate: true })
  @Watch('shareTokenAddress', { immediate: true })
  @Watch('selectedProposalType')
  async refreshProposalThresholdData() {
    if (!this.provider || this.voteAddress === '') {
      return
    }
    await Promise.all([
      this.callChainReadFunc(async () => {
        if (!this.provider || this.shareTokenAddress === '') {
          return
        }
        let quorumRate: BigNumber = new BigNumber(0)
        const lpGovernanceContract = getLpGovernorContract(this.voteAddress, this.provider)
        if (this.selectedProposalType === CombinedPoolProposalTypes.AppointNewOperator ||
          this.selectedProposalType === CombinedPoolProposalTypes.SettlePerp ||
          this.selectedProposalType === CombinedPoolProposalTypes.UpgradeContract
        ) {
          // 20%
          quorumRate = normalizeBigNumberish(await lpGovernanceContract.criticalQuorumRate())
        } else {
          // 10%
          quorumRate = normalizeBigNumberish(await lpGovernanceContract.quorumRate())
        }
        const shareTokenTotalSupply = normalizeBigNumberish(await lpGovernanceContract.totalSupply())
        this.proposalThreshold = shareTokenTotalSupply.shiftedBy(-18).times(quorumRate.shiftedBy(-18))
        if (this.userAddress && this.userAddress !== '') {
          this.userVotes = normalizeBigNumberish(await lpGovernanceContract.balanceOf(this.userAddress)).shiftedBy(-18)
        }
      }),
      this.callChainReadFunc(async () => {
        if (!this.provider) {
          return
        }
        this.hasActiveProposal = await checkPoolHasActiveProposal(this.voteAddress, this.provider)
      })
    ])
  }
  onCreateSuccess() {
    const toList = () => {
      this.$router.push({ name: ROUTE.POOL_INFO })
    }
    setTimeout(toList, 1000)
  }
}
</script>

<style scoped lang="scss">
@import './governance.scss';
.create-pool-proposal {
  .create-header {
    height: 120px;
    display: flex;
    justify-content: space-between;
    .select-type-box {
      margin-top: 30px;
      line-height: 32px;
    }
  }
  .left {
    flex: 0.72;
    .warning-text {
      color: var(--mc-color-warning);
      text-decoration: none;
      line-height: 20px;
      display: block;
      margin-top: 8px;
      text-align: left;
    }
  }
  .right {
    flex: 0.28;
  }
  .create-steps-panel {
    margin-top: 72px;
  }
  .info-line {
    margin-top: 10px;
    font-size: 16px;
    font-weight: 400;
    text-align: right;
  }
}
</style>