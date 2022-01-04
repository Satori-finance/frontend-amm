<template>
  <div class="mc-token-pair-view" :style="{height: size + 'px', width: size + 'px'}">
    <el-image class="token-underlying" :style="{height: underlyingSize + 'px', width: underlyingSize + 'px'}"
              :src="underlyingSymbol | tokenIconUrlFormatter(l1NetworkId)">
      <div slot="error" class="image-slot">
        <img src="@/assets/img/tokens/Unknow.svg" alt="">
      </div>
    </el-image>
    <el-image class="token-collateral" :style="{height: collateralSize + 'px', width: collateralSize + 'px'}"
              :src="collateralAddress | tokenIconUrlFormatter(networkId)">
      <div slot="error" class="image-slot">
        <img src="@/assets/img/tokens/Unknow.svg" alt="">
      </div>
    </el-image>
  </div>
</template>

<script lang="ts">
import { L1_NETWORK_ID, SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/const'
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class McTokenPairView extends Vue {
  @Prop({ default: '' }) underlyingSymbol!: string
  @Prop({ default: '' }) collateralAddress!: string
  @Prop({ default: 40 }) size!: number
  @Prop({ default: TARGET_NETWORK_ID }) networkId!: SUPPORTED_NETWORK_ID

  private l1NetworkId = L1_NETWORK_ID

  get underlyingSize() {
    return Math.floor(this.size * 0.8)
  }

  get collateralSize() {
    return Math.floor(this.size * 0.6)
  }
}
</script>

<style lang="scss" scoped>
.mc-token-pair-view {
  position: relative;
  overflow: hidden;

  .el-image {
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

    ::v-deep .image-slot {
      height: 100%;
      width: 100%;

      img {
        height: 100%;
        width: 100%;
      }
    }
  }
}
</style>
