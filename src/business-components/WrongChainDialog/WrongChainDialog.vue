<template>
  <div>
    <el-dialog
      :visible="visible"
      @close="close"
      custom-class="mini-round-dialog"
      append-to-body
      top="0"
      class="wrong-chain-dialog"
    >
      <div slot="title" class="head">
        <span class="head-title">{{ $t('base.selectNetwork') }}</span>
      </div>
      <div class="content">
        <div class="network-options">
          <div class="connect-btn" :class="{selected: item.chainId === walletNetworkId}" v-for="item in networkOptions"
               :key="item.chainId" @click="changeNetwork(item.chainId)">
            <span><span class="flag"></span>{{ item.name }}</span>
            <img :src="item.icon" alt="">
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script lang='ts'>
import { Component, Mixins } from 'vue-property-decorator'
import WrongChainMixin from './WrongChainMixin'
import { TARGET_NETWORK_ID } from '@/constants'

@Component
export default class WrongChainDialog extends Mixins(WrongChainMixin) {
  TARGET_NETWORK_ID = TARGET_NETWORK_ID
}
</script>

<style scoped lang='scss'>
.wrong-chain-dialog {
  ::v-deep {
    .el-dialog {
      height: auto;
      min-height: 0;
      width: 400px;
    }
  }

  .head {
    display: flex;
    align-items: center;

    .head-title {
      font-size: 18px;
      line-height: 21px;
    }
  }

  .content {
    .connect-btn {
      margin-top: 12px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-radius: var(--mc-border-radius-l);
      background-color: var(--mc-background-color);
      cursor: pointer;

      img {
        width: 24px;
        height: 24px;
      }

      .flag {
        display: none;
      }

      &.selected, &:hover {
        background-color: var(--mc-background-color-dark-light);
      }

      &.selected {
        cursor: auto;
        pointer-events: none;

        .flag {
          display: inline-block;
          height: 8px;
          width: 8px;
          background: var(--mc-color-success);
          border-radius: 50%;
          margin-right: 8px;
        }
      }
    }
  }
}
</style>
