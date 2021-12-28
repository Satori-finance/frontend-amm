<template>
  <div class="mcm-step-item" :class="{'wait-exec-item': isWaitExecStep}">
    <div>
      <span class="icon-item step-id">{{ index + 1 }}</span>
      <span class="label">{{ label }}</span>
    </div>
    <div class="right-box">
      <div class="status">
        <span v-if="isNoneStatus"></span>
        <span v-if="isWaitStatus" class="icon-item wait-status">
          <i class="iconfont icon-step-refresh"></i>
        </span>
        <span v-if="isSuccessStatus" class="icon-item success-status">
          <i class="iconfont icon-step-success"></i>
        </span>
        <span v-if="isFailedStatus" class="icon-item failed-status">
          <i class="iconfont icon-step-failed"></i>
        </span>
      </div>
      <div class="addon" v-if="$slots.addon">
        <slot name="addon"></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { StepStatus } from './type'
import McMSteps from './McMSteps.vue'

@Component
export default class McMStepItem extends Vue {
  @Prop({ default: '' }) label!: string
  @Prop({ default: 1 }) margin!: number
  @Prop({ required: true }) action!: () => Promise<any>

  index = 0

  get status() {
    return this.isActive ? (this.$parent as McMSteps).status : StepStatus.NONE
  }

  get currentStepIndex() {
    return (this.$parent as McMSteps).active
  }

  get isActive() {
    return this.index === this.currentStepIndex
  }

  get isNoneStatus(): boolean {
    return this.status === StepStatus.NONE
  }

  get isWaitStatus(): boolean {
    return this.isActive && this.status === StepStatus.WAIT
  }

  get isSuccessStatus(): boolean {
    return this.index < this.currentStepIndex || (this.isActive && this.status === StepStatus.SUCCESS)
  }

  get isFailedStatus(): boolean {
    return this.isActive && this.status === StepStatus.FAILED
  }

  get isWaitExecStep() {
    return this.index >= this.currentStepIndex && this.isNoneStatus
  }

  created() {
    if (!(this.$parent instanceof McMSteps)) {
      console.error('[McMStepItem]: parent must be instance of McMSteps')
      return
    }
    (this.$parent as McMSteps).updateItems(this)
  }

  destroyed() {
    (this.$parent as McMSteps).deleteItem(this)
  }
}
</script>

<style scoped lang="scss">
.mcm-step-item {
  display: flex;
  justify-content: space-between;
  font-weight: 400;

  &.wait-exec-item {
    .icon-item, .label {
      opacity: 0.5;
    }
  }

  .icon-item {
    height: 24px;
    width: 24px;
    color: var(--mc-text-color-white);
    border-radius: 50%;
    font-size: 14px;
    line-height: 24px;
    text-align: center;
    display: inline-block;

    .el-icon-item {
      font-size: 14px;
    }

    .iconfont {
      font-size: 16px;
    }
  }

  .step-id {
    background: var(--color-primary);
  }

  .label {
    margin-left: 7px;
    font-size: 13px;
    color: var(--mc-text-color);
  }

  .right-box {
    display: flex;
    align-items: center;
    justify-content: center;

    .addon {
      margin-left: 10px;
    }
  }

  .status {
    .wait-status {
      background: var(--mc-color-warning);
      animation: rotating 1.5s linear infinite;
    }

    .success-status {
      background: var(--mc-color-success);
    }

    .failed-status {
      background: var(--mc-color-error);
    }
  }
}
</style>
