<template>
  <div class="proposal-history">
    <div class="title-text-item">
      {{ $t('governance.proposalHistory') }}
    </div>
    <div class="history-steps">
      <el-steps direction="vertical" :active="currentActive" :space="65" :process-status="finishStatus">
        <!-- step 01 -->
        <el-step v-if="currentActive >= 0">
          <template slot="icon">
            <i class="el-icon-check"></i>
          </template>
          <template slot="title">
            {{ $t('governance.created') }}
          </template>
          <template slot="description">
            {{ stateTimestamp.created | timestampFormatter }}
          </template>
        </el-step>
        <!-- step 02 -->
        <el-step v-if="currentActive >= 1">
          <template slot="icon">
            <i class="el-icon-check"></i>
          </template>
          <template slot="title">
            {{ $t('governance.active') }}
          </template>
          <template slot="description">
            {{ stateTimestamp.active | timestampFormatter }}
          </template>
        </el-step>
        <!-- step 03 -->
        <el-step v-if="currentActive >= 2">
          <template slot="icon">
            <i class="el-icon-check" v-if="isSucceeded"></i>
            <i class="el-icon-close" v-if="isFailed"></i>
            <i class="iconfont icon-shalou" v-if="isActive"></i>
          </template>
          <template slot="title">
            <span v-if="isSucceeded">{{ $t('governance.succeeded') }}</span>
            <span v-if="isFailed">{{ $t('governance.failed') }}</span>
            <span v-if="isActive">{{ $t('governance.votingEnds') }}</span>
          </template>
          <template slot="description">
            {{ stateTimestamp.end | timestampFormatter }}
          </template>
        </el-step>
        <!-- step 04-->
        <el-step v-if="currentActive >= 3">
          <template slot="icon">
            <i class="el-icon-check" v-if="isFailed || isExecuted"></i>
            <i class="el-icon-close" v-else-if="isExpired"></i>
            <i class="iconfont icon-shalou" v-else></i>
          </template>
          <template slot="title">
            <span v-if="isFailed">{{ $t('governance.timeLock') }}</span>
            <span v-else-if="isExecuted">{{ $t('governance.executed') }}</span>
            <span v-else-if="isExpired">{{ $t('governance.expired') }}</span>
            <span v-else>{{ $t('governance.executionDelay') }}</span>
          </template>
          <template slot="description">
            <span v-if="isFailed">{{ stateTimestamp.end | timestampFormatter }}</span>
            <span v-else-if="isExecuted">{{ stateTimestamp.executed | timestampFormatter }}</span>
            <span v-else-if="isExpired">{{ stateTimestamp.end | timestampFormatter }}</span>
            <span v-else>{{ stateTimestamp.executeDelay | timestampFormatter }}</span>
          </template>
        </el-step>
        <!-- step 05 -->
        <el-step v-if="currentActive >= 4">
          <template slot="icon">
            <i class="iconfont icon-shalou" v-if="isSucceeded && !isUnlock"></i>
            <i class="el-icon-check" v-else></i>
          </template>
          <template slot="title">
            <span v-if="isExecuted || isExpired">{{ $t('governance.timeLock') }}</span>
            <span v-else>{{ $t('governance.expire') }}</span>
          </template>
          <template slot="description">
            {{ stateTimestamp.unLock | timestampFormatter }}
          </template>
        </el-step>
      </el-steps>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import { PoolProposalState } from '@/type'
import { namespace } from 'vuex-class'
import { Provider } from '@ethersproject/providers'
import { getBlockTimestampFromList } from '@/utils'
import _ from 'lodash'
import { queryTimeStampByBlockNumber } from '@/api/block'
import { arbChainConfig, chainConfigs } from '@/config/chain'
import { L1_NETWORK_ID, SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/const'
import { ErrorHandlerMixin } from '@/mixins'

const wallet = namespace('wallet')

@Component
export default class ProposalHistoryState extends Mixins(ErrorHandlerMixin) {
  @Prop({ required: true }) currentStatus !: PoolProposalState
  @Prop({ required: true }) statusBlocks !: {
    created: number, // L1 block number
    active: number, // L1 block number
    end: number, // L1 block number
    executeDelay: number, // L1 block number
    executed: number, // L2 block number
    unLock: number // L1 block number
  }
  @Prop({ required: true }) currentBlock !: number
  @wallet.Getter('providerL1') providerL1 !: Provider

  private stateTimestamp = {
    created: this.currentTimestamp(),
    active: this.currentTimestamp(),
    end: this.currentTimestamp(),
    executed: this.currentTimestamp(),
    executeDelay: this.currentTimestamp(),
    unLock: this.currentTimestamp()
  }

  get currentActive(): number {
    if (this.currentStatus === PoolProposalState.Created) return 0
    if (this.currentStatus === PoolProposalState.Active || this.isFailed) return 2
    if (this.currentStatus === PoolProposalState.Succeeded) return 3
    if (this.isSucceeded) {
      return 4
    }
    return 0
  }

  currentTimestamp() {
    return Math.floor(Date.now() / 1000)
  }

  get isQueued(): boolean {
    return this.currentStatus === PoolProposalState.Queued
  }

  get isExecuted(): boolean {
    return this.currentStatus === PoolProposalState.Executed
  }

  get isExpired(): boolean {
    return this.currentStatus === PoolProposalState.Expired
  }

  get isUnlock(): boolean {
    return this.currentBlock >= this.statusBlocks.unLock
  }

  get finishStatus(): string {
    if (this.isSucceeded) {
      if (this.isExpired || this.isUnlock) {
        return 'success'
      }
      return 'wait'
    }
    if (this.isFailed) {
      return 'error'
    }
    return ''
  }

  get isSucceeded(): boolean {
    if (this.currentStatus === PoolProposalState.Succeeded
      || this.currentStatus === PoolProposalState.Queued
      || this.currentStatus === PoolProposalState.Executed
      || this.currentStatus === PoolProposalState.Expired) {
      return true
    }
    return false
  }

  get isFailed(): boolean {
    return this.currentStatus === PoolProposalState.Failed
  }

  get isActive(): boolean {
    return this.currentStatus === PoolProposalState.Active
  }


  getBlockTimestampFunc = _.debounce(this.updateStateTimestamp)

  async updateStateTimestamp() {
    if (!this.providerL1) {
      return
    }
    const currentBlockNumber = await this.providerL1.getBlockNumber()
    const blockNumber = new Set<number>(Object.values(this.statusBlocks))
    const [timeStamp, executeTimeStamp] = await Promise.all([
      this.callGraphApiFunc(() => {
        return queryTimeStampByBlockNumber(Array.from(blockNumber.values()), chainConfigs[L1_NETWORK_ID].subgraphConfig.blockSubgraph)
      }),
      this.callGraphApiFunc(() => {
        return queryTimeStampByBlockNumber([this.statusBlocks.executed], chainConfigs[TARGET_NETWORK_ID].subgraphConfig.blockSubgraph)
      })
    ])
    this.stateTimestamp = {
      created: getBlockTimestampFromList(timeStamp?.blockList || null, this.statusBlocks.created, currentBlockNumber),
      active: getBlockTimestampFromList(timeStamp?.blockList || null, this.statusBlocks.active, currentBlockNumber),
      end: getBlockTimestampFromList(timeStamp?.blockList || null, this.statusBlocks.end, currentBlockNumber),
      executeDelay: getBlockTimestampFromList(executeTimeStamp?.blockList || null, this.statusBlocks.executeDelay, currentBlockNumber),
      executed: getBlockTimestampFromList(executeTimeStamp?.blockList || null, this.statusBlocks.executed, currentBlockNumber),
      unLock: getBlockTimestampFromList(timeStamp?.blockList || null, this.statusBlocks.unLock, currentBlockNumber),
    }
  }

  @Watch('statusBlocks', { immediate: true })
  @Watch('providerL1', { immediate: true })
  @Watch('currentStatus', { immediate: true })
  @Watch('currentActive', { immediate: true })
  async onStatusBlocksChanged() {
    if (!this.providerL1 || this.statusBlocks.created === 0) {
      return
    }
    this.getBlockTimestampFunc()
  }
}
</script>

<style scoped lang="scss">
.proposal-history {
  .title-text-item {
    font-size: 18px;
    font-weight: 700;
    color: var(--mc-text-color-white);
  }

  .history-steps {
    margin-top: 16px;
  }

  .wait-status {
  }

  ::v-deep {
    .el-step {
      i {
        color: var(--mc-text-color-white);
      }

      .el-step__icon-inner.is-status {
        -webkit-transform: translateY(0px);
        transform: translateY(0px);
      }

      .el-step__head.is-finish {
        border-color: var(--mc-color-success);

        .el-step__icon {
          background: var(--mc-color-success);
          border-color: var(--mc-color-success);
        }

        .el-step__line {
          background: var(--mc-color-success);
        }
      }

      .el-step__head.is-error {
        .el-step__icon {
          background: var(--mc-color-error);
          border-color: var(--mc-color-error);
          line-height: 26px;
          text-align: center;
        }
      }
      .el-step__head.is-success {
        .el-step__icon {
          border-color: var(--mc-color-success);
          background: var(--mc-color-success);
        }
      }

      .el-step__title {
        font-size: 14px;
        font-weight: 400;
        color: var(--mc-text-color);
        line-height: 20px;
        padding-bottom: 0;
      }

      .el-step__icon {
        font-size: 16px;
        background: var(--color-primary);
        border-color: var(--color-primary);
      }

      .el-step__description {
        font-size: 14px;
        font-weight: 400;
        color: var(--mc-text-color);
      }
    }
  }
}
</style>
