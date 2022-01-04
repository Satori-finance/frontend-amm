<template>
  <div class="token-image-view" :style="{height: size + 'px', width: size + 'px'}">
    <el-image class="token-image" :src="token | tokenIconUrlFormatter(networkId)">
      <div slot="error" class="image-slot">
        <img src="@/assets/img/tokens/Unknow.svg" alt="">
      </div>
    </el-image>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { TARGET_NETWORK_ID } from '@/const'

@Component
export default class TokenImageView extends Vue {
  // token address / token name
  @Prop({ default: '' }) token !: string
  @Prop({ default: 32 }) size!: number
  @Prop({ default: TARGET_NETWORK_ID }) networkId!: number
}
</script>

<style lang="scss" scoped>
.token-image-view {
  overflow: hidden;
  display: inline-block;

  .el-image {
    border-radius: 50%;
    height: 100%;
    width: 100%;

    .image-slot {
      img {
        width: 100%;
        height: 100%;
      }
    }
  }
}
</style>
