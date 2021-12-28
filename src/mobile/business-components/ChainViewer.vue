<template>
  <div class="chain-viewer">
    <img :src="currentChainConfig.icon" alt=""/>
    <span>{{ currentChainConfig.chainName }}</span>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { currentChainConfig } from '@/config/chain'

@Component
export default class ChainViewer extends Vue {
  get currentChainConfig() {
    return currentChainConfig
  }
}
</script>

<style lang="scss" scoped>
.chain-viewer {
  display: flex;
  align-self: center;
  align-items: center;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 16px;
  color: var(--mc-text-color-white);
  background: var(--mc-background-color);

  img {
    width: 20px;
    height: 20px;
    margin-right: 8px;
  }
}
</style>
