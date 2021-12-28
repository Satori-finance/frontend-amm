<template>
  <div class="mc-simple-step">
    <div
      class="step-item"
      v-for="(item, index) in steps"
      :class="{ success: currentStep > index + 1, active: currentStep === index + 1 }"
      :key="index"
    >
      <span class="label">
        <span v-if="currentStep <= index + 1">{{ index + 1 }}</span>
        <i v-else class="el-icon-check"></i>
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Model } from 'vue-property-decorator'

@Component
export default class McSimpleStep extends Vue {
  @Prop({ required: true, default: 0 }) currentStep!: number
  @Prop({ required: true }) stepNum!: number

  get steps() {
    return new Array(this.stepNum)
  }
}
</script>

<style lang="scss" scoped>
.mc-simple-step {
  display: flex;
  align-items: center;
  height: 14px;

  .step-item {
    position: relative;
    flex: 1;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    &:not(:last-of-type):after {
      content: ' ';
      position: absolute;
      width: 100%;
      left: 50%;
      height: 2px;
      top: 6px;
      background-color: var(--mc-icon-color);
      z-index: 0;
    }

    .label {
      z-index: 1;
      display: inline-block;
      font-size: 10px;
      height: 14px;
      width: 14px;
      line-height: 14px;
      border-radius: 50%;
      color: white;
      background-color: var(--mc-icon-color);
    }

    &.active {
      &:not(:last-of-type):after,
      .label {
        background-color: var(--mc-color-primary);
      }
    }

    &.success {
      &:not(:last-of-type):after,
      .label {
        background-color: var(--mc-color-success);
      }
    }
  }
}
</style>
