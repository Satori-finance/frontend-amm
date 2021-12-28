<template>
  <div class="button-radio-group">
    <div class="radio-group">
      <div class="radio-item" v-for="(item, index) in values" :key="item" @click="setSelectedValue(item)"
           :class="{ 'is-selected': item === value, 'start-item': index===0, 'end-item': index===values.length-1 }"
           >
        {{ item }}{{ suffix }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class ButtonRadioGroup extends Vue {
  @Prop({ required: true }) value !: string | number
  @Prop({ required: true }) values !: (string | number)[]
  @Prop({ default: '' }) suffix !: string

  setSelectedValue(value: string | number) {
    this.$emit('input', value)
  }
}
</script>

<style scoped lang="scss">
.button-radio-group {
  .radio-group {
    display: flex;
    justify-content: space-around;

    .radio-item {
      width: 100%;
      display: inline-block;
      text-align: center;
      height: 32px;
      line-height: 32px;
      margin: 0 4px;
      background: var(--mc-background-color);
      font-size: 14px;
      font-weight: 400;
      color: var(--mc-text-color-white);
      border-radius: 8px;
    }

    .start-item {
      margin-left: 0;
    }

    .end-item {
      margin-right: 0;
    }

    .is-selected {
      color: var(--mc-color-primary);
      height: 32px;
      line-height: 32px;
    }
  }
}
</style>
