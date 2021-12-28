<template>
  <div class="uniswap-oracle">
    <div class="uniswap-oracle-title">
      <img src="@/assets/img/uniswap.png" alt="">
      <span class="label">Uniswap V3</span>
      <slot name="title-suffix"></slot>
    </div>
    <div class="token-path" v-for="(path, index) in tokenPath" :key="index">
      <span class="icon"><i class="iconfont icon-to-right" v-if="index !== 0"></i></span>
      <span class="symbol">{{ path.symbol }}</span>
      <span class="address">{{ path.address | ellipsisMiddle }}</span>
      <McCopy class="copy" :content="path.address"></McCopy>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { TokenInfoItem } from '@/type'
import { copyToClipboard } from '@/utils'
import { McCopy } from '@/components'

@Component({
  components: {
    McCopy,
  },
})
export default class UniswapV3OracleView extends Vue {
  @Prop({ required: true }) tokenPath!: TokenInfoItem[]

  private copyAddressStatus: { [key: string]: boolean } = {}

  private copyAddress(address: string) {
    copyToClipboard(address)
    this.$set(this.copyAddressStatus, address, true)
    setTimeout(() => {
      this.$set(this.copyAddressStatus, address, false)
    }, 500)
  }
}

</script>

<style lang="scss" scoped>
.uniswap-oracle {
  display: inline-block;
  padding: 5px 0;

  .uniswap-oracle-title {
    display: flex;
    align-items: center;
    margin-bottom: 8px;

    img {
      height: 24px;
      width: 24px;
      border-radius: 50%;
    }

    .label {
      font-size: 14px;
      line-height: 20px;
      margin-left: 4px;
      margin-right: 12px;
    }
  }

  .token-path {
    display: flex;
    align-items: center;
    font-size: 14px;
    line-height: 20px;

    .icon {
      color: var(--mc-icon-color-light);
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .symbol {
      margin-left: 4px;
    }

    .address {
      margin-left: 8px;
      margin-right: 4px;
      color: var(--mc-color-primary);
    }

    .copy {
      color: var(--mc-text-color);
      cursor: pointer;
    }
  }
}
</style>
