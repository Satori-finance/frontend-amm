<template>
  <div class="mc-radio-group">
    <div class="radio-group">
      <div class="radio-item" v-for="(item, index) in options" :key="index" @click="setSelectedValue(item.value)"
           :class="{ 'is-selected': item.value === value }"
           >
        {{ item.label }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class RadioGroup extends Vue {
  @Prop({ required: true }) value !: string
  @Prop({ required: true }) options !: Array<{ label: string, value: string }>

  setSelectedValue(value: string) {
    this.$emit('input', value)
  }
}
</script>

<style scoped lang="scss">
.mc-radio-group {
  .radio-group {
    display: flex;
    justify-content: space-around;

    .radio-item {
      width: 100%;
      display: inline-block;
      text-align: center;
      height: 28px;
      line-height: 28px;
      margin: 0 2px;
      background: var(--mc-background-color-dark);
      font-size: 13px;
      font-weight: 400;
      color: var(--mc-text-color);
      border-radius: 8px;

      &:first-child {
        margin-left: 0;
      }

      &:last-child {
        margin-right: 0;
      }
    }

    .is-selected {
      border: 1px solid var(--mc-color-primary);
      height: 28px;
      line-height: 28px;
    }
  }
}
</style>
