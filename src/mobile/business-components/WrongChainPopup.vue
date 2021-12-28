<template>
  <van-popup
    v-model="currentVisible"
    class="wrong-chain-popup safe-area-inset-bottom"
    get-container="body"
    :close-on-popstate="true"
    :close-on-click-overlay="false"
    safe-area-inset-bottom
    round
  >
    <div class="head">
      <span class="head-title">{{ $t('base.selectNetwork') }}</span>
    </div>
    <div class="content">
      <i18n path="globalNotification.wrongNetwork" tag="div" class="message">
        <template slot="network">
          <span class="network-item" v-for="item in networkOptions" :key="item.chainId">
            <span class="name">{{ item.name }}</span>
            <span class="or"> {{ $t('base.or') }} </span>
          </span>
        </template>
      </i18n>
      <van-button size="large" @click="close">
        {{ $t('base.confirm') }}
      </van-button>
    </div>
    <div class="close-btn" @click="close">
      <i class="iconfont icon-close"></i>
    </div>
  </van-popup>
</template>

<script lang='ts'>
import { Component, Mixins } from 'vue-property-decorator'
import WrongChainMixin from '@/business-components/WrongChainDialog/WrongChainMixin'

@Component
export default class WrongChainPopup extends Mixins(WrongChainMixin) {
  get currentVisible() {
    return !!this.visible
  }

  set currentVisible(val: boolean) {
    if (!val) {
      this.close()
    }
  }
}
</script>

<style scoped lang='scss'>
.wrong-chain-popup {
  background-color: var(--mc-background-color);
  width: calc(100% - 80px);
  padding: 16px;
  text-align: center;
  overflow: visible;

  .head {
    font-size: 18px;
    line-height: 21px;
    font-weight: bold;
    padding-bottom: 16px;
  }

  .message {
    margin-top: 8px;
    margin-bottom: 24px;
    font-size: 16px;
    line-height: 22px;

    .name {
      color: var(--mc-color-warning);
    }

    .network-item:last-of-type {
      .or {
        display: none;
      }
    }
  }

  .van-button {
    height: 48px;
    border-radius: var(--mc-border-radius-l);
  }

  .close-btn {
    height: 40px;
    width: 40px;
    border-radius: 50%;
    position: absolute;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    bottom: -72px;
    left: calc(50% - 20px);
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
}
</style>
