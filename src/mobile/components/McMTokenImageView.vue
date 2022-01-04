<template>
  <div class="token-image-view" :style="{height: size + 'px', width: size + 'px'}">
    <van-image class="token-image" :src="token | tokenIconUrlFormatter(chainId)">
      <template v-slot:error class="image-slot">
        <img src="@/assets/img/tokens/Unknow.svg" alt="">
      </template>
      <template v-slot:loading class="image-slot">
        <img src="@/assets/img/tokens/Unknow.svg" alt="">
      </template>
    </van-image>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/const'

@Component
export default class McMTokenImageView extends Vue {
  @Prop({ default: '' }) token !: string
  @Prop({ default: 32 }) size!: number
  @Prop({ default: TARGET_NETWORK_ID }) chainId!: SUPPORTED_NETWORK_ID
}
</script>

<style lang="scss" scoped>
.token-image-view {
  overflow: hidden;
  display: inline-block;

  .van-image {
    border-radius: 50%;
    height: 100%;
    width: 100%;

    .van-image__img {
      width: 100%;
      height: 100%;
    }

    img {
      width: 100%;
      height: 100%;
    }

    ::v-deep {
      .van-image__loading,.van-image__error {
        background-color: transparent;
        align-items: unset;
      }

      .van-image__img {
        width: auto;
      }
    }

  }
}
</style>
