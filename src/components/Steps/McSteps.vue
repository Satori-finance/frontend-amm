<template>
  <div class="mc-steps">
    <slot name="start"
          :start="{steps, running, label: startButtonText, currentStep, active, start, success: status === successStatus, failed: status === failedStatus}">
      <el-button @click="start" :disabled="status === successStatus || !steps.length" :loading="runningValue">
        {{ startButtonText }}
      </el-button>
    </slot>

    <div class="mc-step-items" v-show="steps.length > 1">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import McStepItem from './McStepItem.vue'
import { StepStatus } from './type'

@Component
export default class McSteps extends Vue {
  @Prop({ default: '' }) startLabel!: string

  private activeValue: number = 0
  private statusValue: StepStatus = StepStatus.NONE
  private runningValue: boolean = false
  private readonly successStatus = StepStatus.SUCCESS
  private readonly failedStatus = StepStatus.FAILED

  steps: McStepItem[] = []

  get status() {
    return this.statusValue
  }

  get active() {
    return this.activeValue
  }

  get running() {
    return this.runningValue
  }

  get currentStep() {
    return this.steps[this.active] || null
  }

  get startButtonText() {
    return `${this.status === StepStatus.FAILED ? `${this.$t('base.retry')} ` : ''}${this.startLabel || this.$t('base.submitToBlockchain')}`
  }

  @Watch('steps')
  onStepsChange() {
    this.steps.forEach((child, index) => {
      child.index = index
    })
  }

  async start() {
    if (this.runningValue) {
      return
    }
    this.runningValue = true
    try {
      this.$emit('start')
      this.statusValue = StepStatus.WAIT
      await this.executeAction()
      this.statusValue = StepStatus.SUCCESS
      this.$emit('success')
    } catch (e) {
      this.statusValue = StepStatus.FAILED
      this.$emit('error')
    } finally {
      this.runningValue = false
      this.$emit('finish')
    }
  }

  reset() {
    this.activeValue = 0
    this.statusValue = StepStatus.NONE
    this.runningValue = false
  }

  updateItems(step: McStepItem) {
    const index = this.steps.indexOf(step)
    if (index > -1) {
      this.$set(this.steps, index, step)
    } else {
      this.steps.push(step)
    }
  }

  deleteItem(step: McStepItem) {
    const index = this.steps.indexOf(step)
    this.$delete(this.steps, index)
  }

  private async executeAction() {
    if (this.activeValue >= this.steps.length) {
      return
    }
    const step = this.steps[this.activeValue]
    await step.action()
    if (this.activeValue < this.steps.length - 1) {
      this.activeValue++
      await this.executeAction()
    }
  }
}
</script>

<style scoped lang="scss">
.mc-steps {
  .el-button {
    width: 100%;
  }

  .mc-step-items {
    overflow: hidden;
  }

  .mc-step-item {
    margin: 12px 0;
    width: 100%;
  }

  .mc-step-item:last-child {
    margin-bottom: 0;
  }
}
</style>
