<template>
  <van-tabbar v-model="activeTab" :border="false" v-if="showTabber" @change="onChange" z-index="10">
    <van-tabbar-item name="trade">
      <span>{{ $t('base.trade') }}</span>
      <template #icon="props">
        <i class="iconfont icon-trade-fill" v-if="props.active"></i>
        <i class="iconfont icon-trade" v-else></i>
      </template>
    </van-tabbar-item>
    <van-tabbar-item name="mining">
      <span>{{ $t('base.mining') }}</span>
      <template #icon="props">
        <i class="iconfont icon-mining-fill" v-if="props.active"></i>
        <i class="iconfont icon-mining" v-else></i>
      </template>
    </van-tabbar-item>
    <van-tabbar-item name="home">
      <span>{{ $t('base.stats') }}</span>
      <template #icon="props">
        <i class="iconfont icon-stats-fill" v-if="props.active"></i>
        <i class="iconfont icon-stats" v-else></i>
      </template>
    </van-tabbar-item>
  </van-tabbar>
</template>

<script lang="ts">
  import { Component, Vue, Watch } from 'vue-property-decorator'
  import { ROUTE } from '@/mobile/router'

  @Component
export default class MenuBar extends Vue {
  private showTabber: boolean = true
  private activeTab: ROUTE = ROUTE.TRADE

  @Watch('$route', { immediate: true })
  private onRouterChanged() {
    this.selectMenu()
    this.showTabber = this.$route.meta && this.$route.meta['showTabbar']
    if (this.showTabber) {
      this.$emit('show')
    } else {
      this.$emit('hide')
    }
  }

  private selectMenu() {
    if (this.$route.matched.filter(m => m.name === ROUTE.TRADE).length) {
      this.activeTab = ROUTE.TRADE
    } else if (this.$route.matched.filter(m => m.name === ROUTE.MINING).length) {
      this.activeTab = ROUTE.MINING
    } else if (this.$route.matched.filter(m => m.name === ROUTE.HOME).length) {
      this.activeTab = ROUTE.HOME
    }
  }

  private onChange(name: string) {
    this.$router.push({ name })
  }
}
</script>

<style scoped lang="scss">
.menu-bar {

}
</style>
