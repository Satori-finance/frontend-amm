<template>
  <div class="mc-radio-bevel-tabs" :style="{height: height + 'px'}">
    <div class="mc-radio-bevel-tabs-bg" :style="bgStyle">
      <div class="left"><img src="@/assets/img/bg-left.svg" alt=""></div>
      <div class="center"></div>
      <div class="right"><img src="@/assets/img/bg-right.svg" alt=""></div>
    </div>
    <div class="radio-item"
         ref="items"
         v-for="(item, index) in options"
         :class="{active: index === selectedIndex}"
         @click="selectItem(item)">{{
        item.label
      }}
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

@Component
export default class McRadioBevelTabs extends Vue {
  @Prop({ default: 0 }) value!: string
  @Prop({ default: () => [] }) options!: Array<{ label: string, value: string }>
  @Prop({ default: 40 }) height!: number

  private selectedItem: HTMLElement | null = null

  get selectedIndex() {
    return this.options.findIndex(o => o.value === this.value)
  }

  get bgStyle() {
    const width = (1 / this.options.length) * 100
    let offset = 0
    if (this.selectedIndex === 0) {
      offset = -14.5
    } else if (this.selectedIndex === this.options.length - 1) {
      offset = 14.5
    }
    return {
      width: `${width}%`,
      left: `calc(${width * this.selectedIndex}% + ${offset}px)`,
    }
  }

  private selectItem(item: { label: string, value: string }) {
    this.$emit('input', item.value)
  }

  @Watch('selectedIndex', { immediate: true })
  private onSelectedIndexChange() {
    this.$nextTick(() => {
      const items = this.$refs.items
      this.selectedItem = items ? (items as HTMLElement[])[this.selectedIndex] || null : null
    })
  }
}
</script>

<style lang="scss" scoped>
.mc-radio-bevel-tabs {
  position: relative;
  display: flex;
  align-items: center;
  overflow: hidden;
  background-color: var(--mc-background-color-darkest);
  border-radius: var(--mc-border-radius-m);
  font-size: 14px;
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
    }
  }

  .mc-radio-bevel-tabs-bg {
    position: absolute;
    height: 100%;
    left: 0;
    transition: all 0.3s;
    z-index: 0;

    .left, .right {
      position: absolute;
      width: 29px;
      height: 100%;
      top: 0;

      img {
        height: 100%;
        width: 100%;
      }
    }

    .left {
      left: -29px;
    }

    .right {
      right: -29px;
    }

    .center {
      background-color: var(--mc-background-color);
      height: 100%;
    }
  }
}
</style>

