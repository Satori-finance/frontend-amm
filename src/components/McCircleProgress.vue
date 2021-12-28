<template>
  <div class="mc-circle-progress" :style="{height: size + 'px', width: size + 'px'}">
    <svg :width="size" :height="size" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle class="trail" cx="50" cy="50" :r="radius"
              :stroke-width="barSize"/>
      <template v-if="percentage >= 100">
        <circle class="full" cx="50" cy="50" :r="radius"
                :stroke-width="barSize" stroke="url(#paint0_linear)"/>
      </template>
      <template v-else-if="percentage <=0"></template>
      <template v-else>
        <path fill-rule="evenodd" clip-rule="evenodd"
              :d="path" :style="circlePathStyle"
              stroke="url(#paint0_linear)" :stroke-width="barSize" stroke-linecap="round"/>
      </template>

      <defs>
        <linearGradient id="paint0_linear"
                        gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#27A2F8"/>
          <stop offset="100%" stop-color="#00D8E2"/>
        </linearGradient>
      </defs>
    </svg>

    <div class="percentage">{{ percentage }}%</div>
  </div>
</template>

<script lang='ts'>
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class McProgressBar extends Vue {
  @Prop({ default: 45 }) percentage!: number
  @Prop({ default: 100 }) size!: number
  @Prop({ default: 10 }) barSize!: number

  get radius() {
    return Math.floor(50 - this.barSize / 2)
  }

  get rad() {
    return ((this.percentage / 100) * 360 / 180) * Math.PI
  }

  get perimeter() {
    return 2 * Math.PI * this.radius
  }

  get x() {
    return Math.sin(this.rad) * this.radius + 50
  }

  get y() {
    return 50 - Math.cos(this.rad) * this.radius
  }

  get path() {
    return `
      M50 50
      m 0 -${this.radius}
      A ${this.radius} ${this.radius} 0 ${this.percentage < 50 ? '0' : '1'} 1 ${this.x} ${this.y}
    `
  }

  get circlePathStyle() {
    return {
      strokeDasharray: `${this.perimeter * (this.percentage / 100)}px, ${this.perimeter}px`,
      transition: 'stroke-dasharray 0.6s ease 0s, stroke 0.6s ease',
    }
  }
}
</script>

<style scoped lang="scss">
.mc-circle-progress {
  position: relative;
  display: inline-block;

  .trail {
    stroke: #232B48;
  }

  .percentage {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    line-height: 24px;
  }
}
</style>
