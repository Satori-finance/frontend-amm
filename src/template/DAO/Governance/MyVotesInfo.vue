<template>
  <div class="my-votes-info">
    <div class="info-panel">
      <div>
        <div>{{ $t('dao.myVotes') }}</div>
        <div class="value">{{ myVotes | bigNumberFormatter(votesDecimals) }} {{ $t('governance.votes') }}</div>
      </div>
      <div>
        <div>
          {{ $t('dao.proxyVotes') }}
          {{ delegateToMeCount }}
          <i class="el-icon-user"></i>
        </div>
        <div class="value">{{ proxyVotes | bigNumberFormatter(votesDecimals) }} {{ $t('governance.votes') }}</div>
      </div>
      <div>
        <div>{{ $t('dao.delegatingVotesTo') }}</div>
        <div class="value">
          <span v-if="hasDelegateUser">
            {{ delegateToAddress | ellipsisMiddle }}
            <el-link
              class="icon"
              :underline="false"
              target="_blank"
              :href="delegateToAddress | etherBrowserAddressFormatter"
            >
              <i class="iconfont icon icon-transmit"></i>
            </el-link>
          </span>
          <span v-else>{{ $t('governance.undelegated') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import MyVotesInfoMixin from '@/template/components/DAO/MyVotesMixin'

@Component
export default class MyVotesInfo extends Mixins(MyVotesInfoMixin) {

}
</script>

<style scoped lang="scss">
@import '~@mcdex/style/common/var';

.my-votes-info {
  .info-panel {
    height: 72px;
    width: 440px;
    background-color: rgba($--mc-background-color-dark, 0.6);
    border-radius: 8px;
    padding: 12px;
    display: flex;
    justify-content: space-around;
    font-size: 14px;
    font-weight: 400;
    color: var(--mc-text-color);
    text-align: center;

    .value {
      margin-top: 10px;
      color: var(--mc-text-color-white);
    }
  }

  .icon {
    margin-left: 4px;
    font-size: 10px;
    line-height: 14px;
    color: var(--mc-text-color);
  }

  .icon:hover {
    color: var(--mc-color-primary);
  }
}
</style>
