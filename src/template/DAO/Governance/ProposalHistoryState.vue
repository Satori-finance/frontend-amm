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
            <i class="el-icon-check" v-if="isExecuted"></i>
            <i class="el-icon-close" v-else-if="isExpired"></i>
            <i class="iconfont icon-shalou" v-else></i>
          </template>
          <template slot="title">
            <span v-if="isExecuted">{{ $t('governance.executed') }}</span>
            <span v-else-if="isExpired">{{ $t('governance.expired') }}</span>
            <span v-else>{{ $t('governance.executionDelay') }}</span>
          </template>
          <template slot="description">
            <span v-if="isExecuted">{{ stateTimestamp.executed | timestampFormatter }}</span>
            <span v-else-if="isExpired">{{ expireTimestamp | timestampFormatter }}</span>
            <span v-else>{{ etaTimestamp | timestampFormatter }}</span>
          </template>
        </el-step>
      </el-steps>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import ProposalHistoryStateMixin from '@/template/components/DAO/ProposalHistoryStateMixin'

@Component
export default class ProposalHistoryState extends Mixins(ProposalHistoryStateMixin) {

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

      .el-step__icon-inner.is-status {
        -webkit-transform: translateY(0px);
        transform: translateY(0px);
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
