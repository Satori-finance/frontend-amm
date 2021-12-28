<template>
  <div class="pool-adapter">
    <router-view v-bind="{ poolBaseInfo, liquidityPool, liquidityAccount, _poolAddress: poolAddress }" />
  </div>
</template>
<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import { PoolMixins } from '@/template/components/Pool/poolMixins'

@Component
export default class PoolAdapter extends Mixins(PoolMixins) {
  @Watch('$route', { immediate: true, deep: true })
  async onRouterChange() {
    this.poolAddress = this.$route.params?.poolAddress || ''
    this.perpetualSymbol = this.$route.params?.symbol || ''
  }
}
</script>

<style lang="scss">
.pool-adapter {
  height: 100%;
}
</style>
