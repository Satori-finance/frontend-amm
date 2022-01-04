<template>
  <div class="mc-m-token-pair-view" :style="{height: size + 'px', width: size + 'px'}">
    <van-image class="token-underlying" round :style="{height: underlyingSize + 'px', width: underlyingSize + 'px'}"
               :src="underlyingSymbol | tokenIconUrlFormatter(l1NetworkId)">
      <template v-slot:error>
        <img src="@/assets/img/tokens/Unknow.svg" alt="">
      </template>
      <template v-slot:loading>
        <img src="@/assets/img/tokens/Unknow.svg" alt="">
      </template>
    </van-image>
    <van-image class="token-collateral" round :style="{height: collateralSize + 'px', width: collateralSize + 'px'}"
               :src="collateralAddress | tokenIconUrlFormatter(networkId)">
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
import { L1_NETWORK_ID, SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/const'
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class McMTokenPairView extends Vue {
  @Prop({ default: '' }) underlyingSymbol!: string
  @Prop({ default: '' }) collateralAddress!: string
  @Prop({ default: 40 }) size!: number
  @Prop({ default: 0 }) underlyingIconSize!: number
  @Prop({ default: 0 }) collateralIconSize!: number
  @Prop({ default: TARGET_NETWORK_ID }) networkId!: SUPPORTED_NETWORK_ID

  private l1NetworkId = L1_NETWORK_ID

  get underlyingSize() {
    if (this.underlyingIconSize) {
      return this.underlyingIconSize
    } else {
      return Math.floor(this.size * 0.8)
    }
  }

  get collateralSize() {
    if (this.collateralIconSize) {
      return this.collateralIconSize
    } else {
      return Math.floor(this.size * 0.6)
    }
  }
}
</script>

<style lang="scss" scoped>
.mc-m-token-pair-view {
  position: relative;
  overflow: hidden;

  .van-image {
    border-radius: 50%;

    &.token-underlying {
      top: 0;
      left: 0;
      position: absolute;
    }

    &.token-collateral {
      bottom: -2px;
      right: -2px;
      position: absolute;
      box-sizing: content-box;
      border: 2px solid #12182c;
    }

    ::v-deep img {
      height: 100%;
      width: 100%;
    }
  }
}
</style>
