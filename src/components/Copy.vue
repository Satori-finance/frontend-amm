<template>
  <el-tooltip :content="$t('base.copied')" :manual="true" :value="copied" placement="top" :disabled="!tooltip">
    <span class="mc-copy" @click.stop="copy">
      <slot></slot>
      <i v-show="!copied" class="iconfont icon-copy1" @click.stop="copy"></i>
      <i v-show="copied" class="iconfont icon-copied copied-icon"></i>
    </span>
  </el-tooltip>
</template>

<script lang="ts">
import { Vue, Prop, Component } from 'vue-property-decorator'
import { copyToClipboard } from '@/utils'

@Component
export default class Copy extends Vue {
  @Prop({ required: true }) content!: string
  @Prop({ default: true }) tooltip!: boolean

  private copied = false

  copy() {
    copyToClipboard(this.content)
    this.copied = true
    setTimeout(() => {
      this.copied = false
    }, 500)
  }
}
</script>

<style lang="scss" scoped>
.mc-copy {
  text-decoration: none !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  .icon-copy1 {
    color: var(--mc-text-color);
    font-size: 16px;

    &:hover {
      color: #8694b9;
    }
  }

  .copied-icon {
    color: var(--mc-text-color);
    font-size: 16px;
  }
}
</style>
