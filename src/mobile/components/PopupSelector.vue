<template>
  <div class="mc-mobile-select" ref="selectWrap">
    <div class="selector mc-select" @click="showSelectorDown=!showSelectorDown">
      <slot name="value">
        <div class="left-value">
          {{ valueLabel }}
        </div>
      </slot>
      <slot name="icon">
        <div class="right-icon">
          <i class="iconfont icon-bold-down" :class="{'reverse': showSelectorDown }"></i>
        </div>
      </slot>
    </div>
    <div class="popup">
      <van-popup
        v-model="showSelectorDown"
        round position="bottom"
        class="safe-area-inset-bottom"
        :safe-area-inset-bottom="true">
        <div class="value-line" v-for="option in options" :key="option.value"
             :class="{'is-selected': isSelectedValue(option.value)}" @click="onSelected(option.value)">
          {{ option.label }}
        </div>
        <div class="split-line"></div>
        <div class="cancel-line" @click="showSelectorDown = false">
          {{ $t('base.cancel') }}
        </div>
      </van-popup>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class PopupSelector extends Vue {
  @Prop({ required: true }) value !: string | number
  @Prop({ required: true, default: () => []}) options !: Array<{label: string, value: string | number}>

  private showSelectorDown: boolean = false

  get valueLabel(): string {
    for(let i=0;i<this.options.length;i++) {
      const option = this.options[i]
      if (option.value === this.value) {
        return option.label.toString()
      }
    }
    return ''
  }

  private isSelectedValue(val: string | number): boolean {
    return this.value === val
  }

  onSelected(val: string | number) {
    this.$emit('input', val)
    this.showSelectorDown = false
  }
}
</script>

<style scoped lang="scss">
.mc-mobile-select {
  .selector {
    padding: 0 12px;
    height: 28px;
    align-items: center;
    width: 100%;
    display: flex;
    justify-content: space-between;
    border-radius: 8px;
    background: var(--mc-background-color);
    .left-value {
      font-size: 14px;
      color: var(--mc-text-color-white);
      font-weight: 400;
    }
    .right-icon {
      height: 12px;
      line-height: 12px;

      i {
        font-size: 12px;
        color: var(--mc-text-color);
        display: block;
      }
    }
  }

  .popup {
    .value-line {
      font-size: 16px;
      font-weight: 400;
      color: var(--mc-text-color);
      padding: 15px 0;
      text-align: center;
      width: 100%;
      box-shadow: inset 0 1px 0 #1A2136;
      height: 56px;
      line-height: 24px;
    }

    .van-popup {
      :first-child {
        box-shadow: unset;
      }
    }

    .is-selected {
      color: var(--mc-color-primary);
    }

    .split-line {
      width: 100%;
      height: 12px;
      background: var(--mc-background-color-darkest);
    }

    .cancel-line {
      font-size: 16px;
      line-height: 24px;
      font-weight: 400;
      color: var(--mc-text-color);
      padding: 16px 0;
      text-align: center;
      width: 100%;
    }
  }

  .reverse {
    display: inline-block;
    -moz-transform: rotate(180deg);
    -webkit-transform: rotate(180deg);
    transform: rotateX(180deg);
  }
}
</style>
