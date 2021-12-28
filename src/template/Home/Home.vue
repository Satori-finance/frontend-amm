<template>
  <div class="home-page">
    <div class="bg">
      <img src="@/assets/img/satori-bg.png" alt="">
    </div>
    <ChartBox/>
    <PerpetualBox/>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import PerpetualBox from './PerpetualBox.vue'
import ChartBox from './ChartBox.vue'

@Component({
  components: {
    PerpetualBox,
    ChartBox,
  },
})
export default class Home extends Mixins(ErrorHandlerMixin) {

}
</script>

<style scoped lang="scss">
.home-page {
  position: relative;
  margin: auto;
  min-height: 100%;
  background-color: var(--mc-background-color-darkest);
  padding: 30px 0;

  .bg {
    position: absolute;
    width: 800px;
    left: calc(50% - 400px);
    filter: blur(100px);
    z-index: 0;
    pointer-events: none;
  }
}
</style>
