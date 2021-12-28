<template>
  <div class="mc-radio-group" :style="{ height: `${height}px` }">
    <div class="radio-item" v-for="(item, index) in values" :key="item" @click="setSelectedValue(item)"
         :class="{ 'is-selected': item === value }"
    >{{ item }}{{ suffix }}</div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class McRadioGroup extends Vue {
  @Prop({ required: true }) value !: string | number
  @Prop({ required: true }) values !: (string | number)[]
  @Prop({ default: '' }) suffix !: string
  @Prop({ default: 32 }) height !: number

  setSelectedValue(value: string | number) {
    this.$emit('input', value)
  }
}
</script>

<style scoped lang="scss">
.mc-radio-group {
  display: flex;
  justify-content: space-around;

  .radio-item {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 4px;
    background: var(--mc-background-color);
    font-size: 14px;
    font-weight: 400;
    color: var(--mc-text-color-white);
    border-radius: 8px;
    cursor: pointer;

    &:first-child {
      margin-left: 0;
    }

    &:last-child {
      margin-right: 0;
    }

    &:hover {
      color: var(--mc-color-primary);
    }
  }

  .is-selected {
    color: var(--mc-color-primary);
  }
}
</style>
