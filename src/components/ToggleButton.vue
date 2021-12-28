<template>
  <div
    class="switch"
    @click="!disabled && $emit('switchHandler')"
    :class="{'disabled': disabled, 'isOpen': isOpen}"
  >
    <div class="point" :class="{'isOpen': isOpen}"></div>
  </div>
</template>

<script lang="ts">
import {Vue, Component, Prop, Watch} from 'vue-property-decorator'

interface Option {
  value: string | number | boolean,
  flag: boolean
}

@Component
export default class ToggleButton extends Vue {
  @Prop({required: true}) private value!: Option['value']
  @Prop({
    default: [
      { value: 'on', flag: true },
      { value: 'off', flag: false }
    ]
  }) private options!: Array<Option>
  @Prop({default: false}) private disabled!: boolean

  get isOpen() {
    let flag = false
    this.options.some(item => {
      if (item.value === this.value) {
        flag = item.flag
        return true
      }
    })
    return flag
  }
}
</script>

<style lang="scss" scoped>
.switch {
  width: 0.4rem;
  height: 0.2rem;
  border-radius: 0.2rem;
  display: inline-block;
  cursor: pointer;
  position: relative;
  .point {
    width: 0.18rem;
    height: 0.18rem;
    border-radius: 50%;
    position: absolute;
    top: 0.01rem;
    right: 100%;
    transform: translateX(100%);
    transition: transform 0.3s ease, right 0.3s ease;
    &.isOpen {
      right: 0;
      transform: translateX(0);
    }
  }
  .disabled {
    opacity: 0.3;
  }
}
</style>

<style lang="scss" scoped>
.dex-theme-dark {
  .switch {
    background: #2B314A;
    &.isOpen {
      background: var(--strong-menu-color);
    }
    .point {
      background-image: linear-gradient(-180deg, #6b758e, #495269);
      &.isOpen {
        background-image: linear-gradient(180deg, #fff, #c2d8ff);
      }
    }
  }
}
</style>
