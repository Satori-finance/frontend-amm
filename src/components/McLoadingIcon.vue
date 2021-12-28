<template>
  <span class="mc-loading-icon" :style="{height: height ? height + 'px' : size + 'px'}">
    <img :style="{width: size + 'px', height: size + 'px'}"
         class="fantasy-loading" src="@/assets/img/satori-fantasy/loading.svg" alt="">
  </span>
</template>

<script lang="ts">
import { Vue, Prop, Component } from 'vue-property-decorator'

@Component
export default class McLoadingIcon extends Vue {
  @Prop({ default: 24 }) size!: number
  @Prop({ default: 0 }) height!: number


}
</script>

<style lang="scss" scoped>
.mc-loading-icon {
  display: flex;
  align-items: center;

  .fantasy-loading {
    display: inline-block;
    animation: 2s linear infinite svg-animation;
  }

  @keyframes svg-animation {
    0% {
      transform: rotateZ(0deg);
    }
    100% {
      transform: rotateZ(360deg);
    }
  }
}
</style>
