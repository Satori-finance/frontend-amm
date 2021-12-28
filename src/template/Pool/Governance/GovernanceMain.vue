<template>
  <div class="governance-main">
    <router-view v-bind="{ poolBaseInfo, liquidityPool }"></router-view>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { PoolBaseInfo } from '@/template/components/Pool/poolMixins'
import { LiquidityPoolDirectoryItem } from '@/type'

@Component
export default class GovernanceMain extends Vue {
  @Prop({ required: true }) poolBaseInfo!: PoolBaseInfo | null
  @Prop( { required: true }) liquidityPool !: LiquidityPoolDirectoryItem | null
}
</script>

<style lang="scss" scoped>
.governance-main {
  display: flex;
  flex-direction: column;
  margin: auto;
  height: 100%;
  min-height: 600px;
}
</style>
