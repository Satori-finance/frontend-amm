<template>
  <div class="mc-simple-time-range">
    <span
      class="range-item mc-font-p12"
      :class="{ active: item.key === value }"
      v-for="item in options"
      :key="item.key"
      @click="selectValue(item.key)"
      >{{ item.label }}</span
    >
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
@Component
export default class SimpleTimeRange extends Vue {
  @Prop({ default: 0 }) private value!: string
  @Prop({ default: () => [] }) private options!: Array<{ key: string, label: string }>
  private selectValue(key: string) {
    this.$emit('input', key)
  }
}
</script>

<style lang="scss">
.mc-simple-time-range {
  display: inline-flex;
  align-items: center;
  .range-item {
    border-radius: var(--mc-border-radius-m);
    height: 20px;
    line-height: 20px;
    min-width: 60px;
    padding: 0 8px;
    color: var(--mc-text-color-white);
    background: var(--mc-background-color);
    cursor: pointer;
    text-align: center;
    &:not(:last-of-type) {
      margin-right: 8px;
    }

    &.active, &:hover {
      color: var(--color-primary);
      background: var(--mc-background-color);
    }
  }
}
</style>
