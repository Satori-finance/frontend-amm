<template>
  <div class="radio-group-tabs">
    <div class="tabs">
      <div class="tab-item" v-for="item in options" :key=item.value @click="setSelectedValue(item.value)"
           :class="{ 'is-selected': item.value === value }">
        <div
            :class="[item.itemSelectedClass&&item.value === value?item.itemSelectedClass:'', 'label']"
        >{{ item.label }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class RadioGroupTabs extends Vue {
  @Prop({ required: true }) value !: string
  @Prop({ required: true }) options !: Array<{ label: string, value: string, itemSelectedClass?: string }>

  setSelectedValue(value: string) {
    this.$emit('input', value)
  }
}
</script>

<style scoped lang="scss">
.radio-group-tabs {
  .tabs {
    display: flex;
    justify-content: space-around;
    height: 48px;
    width: 100%;
    background: var(--mc-background-color-darkest);
    border-radius: 12px;
  }

  .tab-item {
    display: inline-block;
    height: 100%;
    width: 100%;
    text-align: center;
    line-height: 48px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 400;
    color: var(--mc-text-color);
    transition: color 0.3s;
  }

  .label {
    border-radius: 12px;
  }

  .is-selected {
    background: var(--mc-background-color);
  }
}
</style>
