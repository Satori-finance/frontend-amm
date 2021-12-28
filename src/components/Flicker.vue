<template>
  <div class="flicker-container" @mouseenter="showFlicker = true" @mouseleave="showFlicker = false">
    <span class="flicker" v-if="showFlicker"></span>
    <slot></slot>
  </div>
</template>

<script lang="ts">
import {Vue, Component, Prop} from 'vue-property-decorator'

@Component
export default class Flicker extends Vue {
  private showFlicker = false
}
</script>

<style lang="scss" scoped>
@-webkit-keyframes flicker {
  from {
    left: -100%;
  }

  to {
    left: 150%;
  }
}
@-moz-keyframes flicker {
  from {
    left: -100%;
  }

  to {
    left: 150%;
  }
}
@-ms-keyframes flicker {
  from {
    left: -100%;
  }

  to {
    left: 150%;
  }
}
@-o-keyframes flicker {
  from {
    left: -100%;
  }

  to {
    left: 150%;
  }
}
@keyframes flicker {
  from {
    left: -100%;
  }

  to {
    left: 150%;
  }
}
.flicker-container {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  margin: 0 auto;
  width: fit-content;
  .flicker {
    position: absolute;
    top: 0;
    left: -100%;
    width: 30%;
    height: 100%;
    pointer-events: none;
    background: linear-gradient(to right, rgba(255, 255, 255, 0) 0, rgba(255, 255, 255, 0.4) 50%, rgba(255, 255, 255, 0) 100%);
    transform: skewX(-45deg);
    animation: flicker 0.7s linear 0s;
  }
}
</style>
