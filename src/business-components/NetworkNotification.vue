<template>
  <div class="network-notification" v-if="isWrongNetwork">
    <i class="iconfont icon-warning-triangle"></i>
    <i18n path="globalNotification.wrongNetwork" tag="div" class="message">
      <template slot="network">
          <span class="network-item" v-for="item in networkOptions" :key="item.chainId">
            <span class="name">{{ item.name }}</span>
            <span class="or"> {{ $t('base.or') }} </span>
          </span>
      </template>
    </i18n>
    <el-button type="primary" class="connect-btn" size="medium" @click="connectChain">
      {{ $t('base.selectNetwork') }}
    </el-button>
  </div>
</template>

<script lang='ts'>
import { Component, Mixins } from 'vue-property-decorator'
import { NETWORK_ID_NAME } from '@/const'
import { SupportNetworkMixin } from '@/mixins'

@Component
export default class NetworkNotification extends Mixins(SupportNetworkMixin) {
}
</script>

<style lang="scss" scoped>
.network-notification {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
  color: var(--mc-text-color-white);
  font-size: 14px;
  line-height: 20px;
  text-align: center;
  padding: 0 1.6rem;
  min-height: 72px;

  .iconfont {
    color: var(--mc-color-warning);
    margin-right: 8px;
    font-size: 16px;
  }

  .message {
    .name {
      color: var(--mc-color-warning);
    }

    .network-item:last-of-type {
      .or {
        display: none;
      }
    }
  }

  .connect-btn {
    margin-left: 16px;
    height: 36px;
    border-radius: var(--mc-border-radius-l);
    font-size: 14px;
    padding: 0 12px;
  }
}
</style>

<style scoped lang="scss">
.dex-theme-dark {
  .network-notification {
    background: #1A213A;
  }
}
</style>

<style lang="scss" scoped>
.satori-fantasy {
  .network-notification {
    background-color: var(--mc-background-color-dark);
  }
}
</style>
