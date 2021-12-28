<template>
  <div class="mining-page">
    <div class="bg">
      <img src="@/assets/img/satori-bg.png" alt="">
    </div>
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class MiningMain extends Vue {
}
</script>

<style lang="scss" scoped>
.mining-page {
  position: relative;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0 8px;

  .bg {
    position: absolute;
    width: 800px;
    left: calc(50% - 400px);
    filter: blur(100px);
    z-index: 0;
    pointer-events: none;
  }
}

.satori-fantasy {
  .mining-page {
    background-color: var(--mc-background-color-darkest);
  }
}
</style>
