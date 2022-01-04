<template>
  <div class="back-nav-bar" :style="{position: fixed ? 'fixed' : ''}">
    <van-nav-bar :title="title" :border="false" z-index="10">
      <template #left>
        <i class="iconfont icon-left2-back"  @click="goBack"></i>
      </template>
      <template slot="title">
        <slot name="title"></slot>
      </template>
      <template slot="right">
        <slot name="right"></slot>
      </template>
    </van-nav-bar>
    <NodeServerNotification />
    <NetworkNotificationBar />
    <McMGlobalNotificationBar />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { NETWORK_ID_NAME, TARGET_NETWORK_ID } from '@/const'
import { namespace } from 'vuex-class'
import { McMGlobalNotificationBar } from '@/mobile/components'
import { NetworkNotificationBar, NodeServerNotification } from '@/mobile/business-components'

const wallet = namespace('wallet')

@Component({
  components: {
    McMGlobalNotificationBar,
    NetworkNotificationBar,
    NodeServerNotification,
  }
})
export default class BackNavBar extends Vue {
  @Prop({default: false}) fixed!: boolean
  @Prop({ default: '' }) title!: string

  @wallet.Getter('isWrongNetwork') isWrongNetwork!: boolean

  get targetChain() {
    return NETWORK_ID_NAME[TARGET_NETWORK_ID]
  }

  private goBack() {
    this.$router.back()
  }
}
</script>

<style scoped lang="scss">
.back-nav-bar {
  .van-nav-bar {
    ::v-deep {
      .van-nav-bar__left {
        color: var(--mc-text-color);

        .icon-left2-back {
          font-size: 16px;
          color: var(--mc-text-color-white);
        }
      }
      .van-nav-bar__title {
        font-size: 18px;
        line-height: 21px;
        display: flex;
        align-items: center;
      }
    }
  }
}
</style>
