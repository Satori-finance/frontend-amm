<template>
  <div class="header-bar" :style="{position: fixed ? 'fixed' : ''}" :class="{'border': !isWrongNetwork}">
    <van-nav-bar :border="false" class="main-header" z-index="10">
      <template #left>
        <img class="logo" src="@/assets/img/mcdex_logo.png" alt="">
        <div class="beta">Beta</div>
      </template>
      <template #right>
        <WalletViewer></WalletViewer>
        <i class="iconfont icon-side-bar" @click="showSliderPopup"></i>
      </template>
    </van-nav-bar>
    <NodeServerNotification />
    <NetworkNotificationBar />
    <McMGlobalNotificationBar />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { VUE_EVENT_BUS } from '@/event'
import { COMMON_EVENT } from '@/mobile/event'
import { NetworkNotificationBar, NodeServerNotification } from '@/mobile/business-components'
import { McMGlobalNotificationBar } from '@/mobile/components'
import { NETWORK_ID_NAME, TARGET_NETWORK_ID } from '@/constants'
import { namespace } from 'vuex-class'
import WalletViewer from './WalletViewer.vue'

const wallet = namespace('wallet')

@Component({
  components: {
    WalletViewer,
    McMGlobalNotificationBar,
    NetworkNotificationBar,
    NodeServerNotification,
  },
})
export default class HeaderBar extends Vue {
  @Prop({ default: false }) fixed!: boolean
  @wallet.Getter('isWrongNetwork') isWrongNetwork!: boolean

  get targetChain() {
    return NETWORK_ID_NAME[TARGET_NETWORK_ID]
  }

  private showSliderPopup() {
    VUE_EVENT_BUS.emit(COMMON_EVENT.SHOW_SIDER_POPUP)
  }
}
</script>

<style scoped lang="scss">
@import "~@mcdex/style/common/var";
.header-bar {

  &.border {
    border-bottom: 1px solid var(--mc-border-color);
  }

  ::v-deep .van-nav-bar {
    .van-nav-bar__left:active, .van-nav-bar__right:active {
      opacity: 1;
    }
  }

  .icon-side-bar {
    margin-left: 8px;
    font-size: 28px;
    height: 28px;
    width: 28px;
    line-height: 28px;
  }

  .beta {
    align-self: flex-start;
    border-radius: 8px 8px 8px 0;
    padding: 3px 7px;
    font-size: 12px;
    line-height: 14px;
    margin-top: 4px;
    margin-left: 4px;
  }
}
</style>

<style scoped lang="scss">
@import "~@mcdex/style/common/fantasy-var";

.satori-fantasy {
  .header-bar {
    .beta {
      background-color: rgba($--mc-color-primary, 0.1);
      border: 1px solid rgba($--mc-color-primary, 0.1);
      color: $--mc-color-primary;
    }
  }
}
</style>
