<template>
  <div class='proposal-history'>
    <div class='history-steps'>
      <van-steps direction='vertical' :active='currentActive' active-color='#AFD6F2'>
        <!-- step 01 -->
        <van-step v-if='currentActive >= 0'>
          <template slot='active-icon'>
            <van-icon name='success' />
          </template>
          <template slot='finish-icon'>
            <van-icon name='success' />
          </template>
          <p>{{ $t('governance.created') }}</p>
          <p>
            {{ stateTimestamp.created | timestampFormatter }}
          </p>
        </van-step>
        <!-- step 02 -->
        <van-step v-if='currentActive >= 1'>
          <template slot='active-icon'>
            <van-icon name='success' />
          </template>
          <template slot='finish-icon'>
            <van-icon name='success' />
          </template>
          <p>{{ $t('governance.active') }}</p>
          <p>
            {{ stateTimestamp.active | timestampFormatter }}
          </p>
        </van-step>
        <!-- step 03 -->
        <van-step v-if='currentActive >= 2'>
          <template slot='active-icon'>
            <van-icon name='success' v-if='isSucceeded' />
            <van-icon class='failed-status' name='cross' v-if='isFailed' />
            <van-icon class='hourglass' v-if="isActive"><i class='iconfont icon-shalou'></i></van-icon>
          </template>
          <template slot='finish-icon'>
            <van-icon name='success' v-if="finishStatus === 'success'" />
            <van-icon name='success' v-if="finishStatus === 'error'" />
          </template>
          <p>
            <span v-if='isSucceeded'>{{ $t('governance.succeeded') }}</span>
            <span v-if='isFailed'>{{ $t('governance.failed') }}</span>
            <span v-if='isActive'>{{ $t('governance.votingEnds') }}</span>
          </p>
          <p>
            {{ stateTimestamp.end | timestampFormatter }}
          </p>
        </van-step>
        <!-- step 04-->
        <van-step v-if='currentActive >= 3'>
          <template slot='active-icon'>
            <van-icon class='success-status' name='success' v-if='isExecuted'/>
            <van-icon class='failed-status' name='cross' v-else-if='isExpired'/>
            <van-icon class='hourglass' v-else>
              <i class='iconfont icon-shalou'></i>
            </van-icon>
          </template>
          <template slot='finish-icon'>
            <van-icon name='success' v-if="finishStatus === 'success'" />
            <van-icon name='success' v-if="finishStatus === 'error'" />
          </template>
          <p>
            <span v-if="isExecuted">{{ $t('governance.executed') }}</span>
            <span v-else-if="isExpired">{{ $t('governance.expired') }}</span>
            <span v-else>{{ $t('governance.executionDelay') }}</span>
          </p>
          <p>
            <span v-if="isExecuted">{{ stateTimestamp.executed | timestampFormatter }}</span>
            <span v-else-if="isExpired">{{ expireTimestamp | timestampFormatter }}</span>
            <span v-else>{{ etaTimestamp | timestampFormatter }}</span>
          </p>
        </van-step>
      </van-steps>
    </div>
  </div>
</template>

<script lang='ts'>
import { Component, Mixins } from 'vue-property-decorator'
import ProposalHistoryStateMixin from '@/template/components/DAO/ProposalHistoryStateMixin'

@Component
export default class ProposalHistoryState extends Mixins(ProposalHistoryStateMixin) {

}
</script>

<style scoped lang='scss'>
.proposal-history {
  .history-steps {
    width: 100%;
    border-radius: 12px;
    background: var(--mc-background-color);

    ::v-deep {
      .van-steps {
        background: transparent;

        .van-step__title--active, .van-step__title {
          font-size: 14px;
          line-height: 20px;
          color: var(--mc-text-color);
        }

        .van-step__title {
          margin-left: 5px;
        }

        .van-step--vertical:not(:last-child)::after {
          border: none;
        }

        .van-step--vertical .van-step__circle-container {
          top: 27px
        }
      }

      .van-icon {
        width: 24px;
        height: 24px;
        color: #fff;
        font-size: 16px;
        line-height: 24px;
        text-align: center;
        border-radius: 50%;
        background: var(--color-primary);
      }

      .failed-status {
        background: var(--mc-color-error);
      }

      .success-status {
        background: var(--mc-color-success);
      }

      .hourglass {
        line-height: 20px;
      }
    }

    ::v-deep.van-step--vertical:first-child::before {
      height: 0;
    }
  }
}
</style>
