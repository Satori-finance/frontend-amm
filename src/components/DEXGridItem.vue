<template>
  <div class="dex-grid-item">
    <div class="operation">
      <i v-if="maximizable && isMaximized" class="iconfont icon-shrink icon-link" @click="onClickShrink()"></i>
      <i v-if="maximizable && !isMaximized" class="iconfont icon-enlarge icon-link" @click="onClickMaximize()"></i>
      <i v-if="closable" class="iconfont icon-close icon-link" @click="onClickClose()" style="margin-right: 0;"></i>
    </div>
    <div style="height: 100%;">
      <slot ref="component"></slot>
    </div>
  </div>
</template>

<script lang="ts">
import {Vue, Component, Prop} from 'vue-property-decorator'

@Component
export default class DEXGridItem extends Vue {
  @Prop({default: false}) isMaximized!: boolean
  @Prop({default: false}) closable!: boolean
  @Prop({default: false}) maximizable!: boolean

  private onClickShrink() {
    this.$emit('shrinkGridItem')
  }
  private onClickMaximize() {
    this.$emit('maximizeGridItem')
  }
  private onClickClose() {
    this.$emit('closeGridItem')
  }
}
</script>

<style lang="scss" scoped>
.dex-grid-item {
  height: 100%;
  position: relative;
  .operation {
    position: absolute;
    right: 13px;
    top: 17px;
    z-index: 2;
    display: flex;
    align-items: center;

    .icon-enlarge {
      margin-top: -13px;
      font-size: 38px;
      margin-right: -8px;
    }

    i {
      cursor: pointer;
      font-size: 14px;
      margin: 0 0.05rem;
      color: var(--mc-text-color);

      &:hover {
        color: var(--mc-text-color-white);
      }
    }
  }
}
</style>

<style lang="scss" scoped>
.dex-grid-item {
  background: var(--mc-background-color);
}
</style>
