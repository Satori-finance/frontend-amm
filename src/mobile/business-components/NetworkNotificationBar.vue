<template>
  <div class="network-notification" v-if="isWrongNetwork">
    <i class="iconfont icon-warning-triangle"></i>
    <i18n path="globalNotification.wrongNetwork" tag="span" class="message">
      <template slot="network">
        <span class="network-item" v-for="item in networkOptions" :key="item.chainId">
          <span class="name">{{ item.name }}</span>
          <span class="or"> {{ $t('base.or') }} </span>
        </span>
      </template>
    </i18n>
  </div>
</template>

<script lang='ts'>
import { Component, Mixins } from 'vue-property-decorator'
import { NETWORK_ID_NAME } from '@/constants'
import { SupportNetworkMixin } from '@/mixins'

@Component
export default class NetworkNotificationBar extends Mixins(SupportNetworkMixin) {

}
</script>

<style lang="scss" scoped>
.network-notification {
  padding: 16px 50px;
  background-color: var(--mc-background-color-dark);
  text-align: center;
  font-size: 14px;
  line-height: 22px;

  .iconfont {
    font-size: 16px;
    color: var(--mc-color-warning);
  }

  .message {
    margin-left: 4px;

    .name {
      color: var(--mc-color-warning);
    }

    .network-item:last-of-type {
      .or {
        display: none;
      }
    }
  }
}
</style>
