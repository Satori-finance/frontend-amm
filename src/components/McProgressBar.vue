<template>
  <div class="mc-progress-bar">
    <div class="progress">
      <el-progress :percentage="percentage" :show-text="false"></el-progress>
      <div class="value" :style="{ left: left }">{{ value }}</div>
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
export default class McProgressBar extends Vue {
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
.mc-progress-bar {
  padding-top: 21px;

  .progress {
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
