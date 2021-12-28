<template>
  <div class="pool-main">
    <div class="bg">
      <img src="@/assets/img/satori-bg.png" alt="">
    </div>
    <router-view class="content"></router-view>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

@Component
export default class PoolMain extends Vue {
}
</script>

<style lang="scss" scoped>
.pool-main {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background-color: var(--mc-background-color-darkest);

  .bg {
    position: absolute;
    width: 800px;
    left: calc(50% - 400px);
    filter: blur(100px);
    z-index: 0;
  }

  .content {
    flex: 1;
    z-index: 1;
  }
}
</style>
