<template>
  <div class="mc-radio-tabs" :style="{height: height + 'px'}">
    <div class="radio-item"
         ref="items"
         v-for="(item, index) in options"
         :class="{active: index === selectedIndex}"
         @click="selectItem(item)">{{
        item.label
      }}</div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

@Component
export default class McRadioTabs extends Vue {
  @Prop({ default: 0 }) value!: string
  @Prop({ default: () => [] }) options!: Array<{ label: string, value: string }>
  @Prop({ default: 48 }) height!: number

  get selectedIndex() {
    return this.options.findIndex(o => o.value === this.value)
  }

  private selectItem(item: { label: string, value: string }) {
    this.$emit('input', item.value)
  }
}
</script>

<style lang="scss" scoped>
.mc-radio-tabs {
  position: relative;
  display: flex;
  align-items: center;
  overflow: hidden;
  background-color: var(--mc-background-color-darkest);
  border-radius: var(--mc-border-radius-l);
  font-size: 16px;
  line-height: 20px;

  .radio-item {
    flex: 1;
    text-align: center;
    z-index: 1;
    transition: color 0.3s;
    color: var(--mc-text-color);
    cursor: pointer;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    &.active {
      color: var(--mc-text-color-white);
      background: var(--mc-background-color);
      border-radius: var(--mc-border-radius-l);
    }
  }
}
</style>

