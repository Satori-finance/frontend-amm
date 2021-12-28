<template>
  <el-popover popper-class="mc-popover-panel" v-model="showing" ref="popover" trigger="manual" v-bind="$attrs">
    <template #default>
      <slot name="popover"></slot>
    </template>
    <template #reference>
      <span @click="show"><slot/></span>
    </template>
  </el-popover>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component
export default class Popover extends Vue {
  @Prop({ default: 1500 }) private delay!: number

  showing = false

  show() {
    this.showing = true
    setTimeout(() => {
      this.showing = false
    }, this.delay)
  }
}
</script>

<style lang="scss">
.mc-popover-panel {
  background: white;
  padding: 8px;
  color: var(--mc-text-color);
  font-size: 12px;
  line-height: 18px;

  &.el-popper[x-placement^=top] .popper__arrow::after {
    border-top-color: white;
  }
}
</style>
