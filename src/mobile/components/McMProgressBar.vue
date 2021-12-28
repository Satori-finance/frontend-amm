<template>
  <div class="mcm-progress-bar">
    <div class="progress-bar">
      <div class="value" :style="{ left: left }">{{ value }}</div>
      <div class="progress-box">
        <div class="progress" :style="{ width: left }"></div>
      </div>
    </div>
    <div class="range">
      <span>{{ min }}</span>
      <span>{{ max }}</span>
    </div>
  </div>
</template>

<script lang='ts'>
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class McMProgressBar extends Vue {
  @Prop({ default: 0 }) value!: number
  @Prop({ default: 0 }) min!: number
  @Prop({ default: 100 }) max!: number

  get percentage() {
    if (this.value === 0) return 0
    return this.value * 100 / (this.max - this.min)
  }

  get left() {
    return `${this.percentage}%`
  }
}
</script>

<style scoped lang="scss">
.mcm-progress-bar {
  padding-top: 21px;

  .progress-bar {
    position: relative;
    height: 18px;
    padding: 4px 0;

    .value {
      position: absolute;
      width: 40px;
      margin-left: -20px;
      top: calc(-100% - 4px);
      text-align: center;
      font-size: 14px;
      line-height: 20px;
    }

    .progress-box {
      width: 100%;
      height: 6px;
      background: var(--mc-background-color);
      border-radius: 3px;

      .progress {
        height: 6px;
        background: var(--mc-color-primary-gradient);
        border-radius: 3px;
      }
    }
  }

  .range {
    font-size: 14px;
    line-height: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--mc-text-color);
  }
}
</style>
