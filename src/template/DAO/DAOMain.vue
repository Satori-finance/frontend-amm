<template>
  <div class="dao-main">
    <div class="bg">
      <img src="@/assets/img/satori-bg.png" alt="">
    </div>
    <router-view class="content"></router-view>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

@Component
export default class DAOMain extends Vue {
}
</script>

<style lang="scss" scoped>
.dao-main {
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
  }

  .content {
    flex: 1;
    z-index: 1;
  }
}

.satori-fantasy {
  .dao-main {
    background-color: var(--mc-background-color-darkest);
  }
}
</style>
