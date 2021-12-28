<template>
  <svg class="mc-circle-load" :style="`width: ${size}; height: ${size}`">
    <circle :cx="cx" :cy="cx" :r="r"
            :stroke="backgroundColor"
            :stroke-width="barSize"
            stroke-linecap="round"
            fill="none"></circle>
    <circle :cx="cx" :cy="cx" :r="r"
            class="ring"
            :stroke-width="barSize"
            stroke="url(#paint0_linear)"
            :stroke-dasharray="`${circum}`"
            stroke-linecap="round"
            fill="none">
      <animate attributeName="stroke-dashoffset"
               @endEvent="onEnd"
               :from="circum"
               :to="endCircum"
               :dur="duration"/>
    </circle>

    <defs>
      <linearGradient id="paint0_linear"
                      gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#00D8E2"/>
        <stop offset="100%" stop-color="#27A2F8"/>
      </linearGradient>
    </defs>
  </svg>
</template>

<script lang="ts">
import { Prop, Vue, Component } from 'vue-property-decorator'

@Component
export default class McCircleLoad extends Vue {
  @Prop({ default: 15 }) duration!: number
  @Prop({ default: 100 }) size!: number
  @Prop({ default: 5 }) barSize!: number
  @Prop({ default: 'black'}) backgroundColor!: string

  private endCircum = 0

  get cx() {
    return this.size / 2
  }

  get r() {
    return this.size / 2 - this.barSize
  }

  get circum() {
    return Math.floor(this.r * Math.PI * 2)
  }

  private onEnd() {
    this.$emit('end')
  }
}
</script>

<style lang="scss" scoped>
.mc-circle-load {
  .ring {
    transform: rotate(-90deg);
    transform-origin: 50% 50%;
  }
}
</style>
