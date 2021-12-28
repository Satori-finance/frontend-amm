<template>
  <div class="mc-step-item" :class="{'wait-exec-item': isWaitExecStep}">
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
import McSteps from './McSteps.vue'

@Component
export default class McStepItem extends Vue {
  @Prop({ default: '' }) label!: string
  @Prop({ default: 1 }) margin!: number
  @Prop({ required: true }) action!: () => Promise<any>

  index = 0

  get status() {
    return this.isActive ? (this.$parent as McSteps).status : StepStatus.NONE
  }

  get currentStepIndex() {
    return (this.$parent as McSteps).active
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
    if (!(this.$parent instanceof McSteps)) {
      console.error('[McStepItem]: parent must be instance of McSteps')
      return
    }
    (this.$parent as McSteps).updateItems(this)
  }

  destroyed() {
    (this.$parent as McSteps).deleteItem(this)
  }
}
</script>

<style scoped lang="scss">
.mc-step-item {
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

  .label {
    margin-left: 7px;
    font-size: 14px;
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
      animation: rotating 1.5s linear infinite;
    }
  }
}
</style>

<style scoped lang="scss">
.satori-fantasy {
  .mc-step-item {
    .icon-item {
      color: var(--mc-text-color-white);
    }

    .step-id {
      background: var(--mc-color-primary);
    }

    .label {
      color: var(--mc-text-color);
    }

    .status {
      .wait-status {
        background: var(--mc-color-warning);
      }

      .success-status {
        background: var(--mc-color-success);
      }

      .failed-status {
        background: var(--mc-color-error);
      }
    }
  }
}
</style>
