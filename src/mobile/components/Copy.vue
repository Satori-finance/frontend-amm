<template>
  <div class="mc-copy-container">
    <Tooltip :content="$t('base.copied')" :show="showTooltip">
      <span class="mc-copy" @click.stop="copy">
        <slot></slot>
        <i v-show="!copied" class="iconfont icon-copy1" @click.stop="copy"></i>
        <i v-show="copied" class="iconfont icon-copied copied-icon"></i>
      </span>
    </Tooltip>
  </div>
</template>

<script lang="ts">
import { Vue, Prop, Component } from 'vue-property-decorator'
import { copyToClipboard } from '@/utils'
import Tooltip from './Tooltip.vue'

@Component({
  components: {
    Tooltip
  }
})
export default class Copy extends Vue {
  @Prop({ required: true }) content!: string
  @Prop({ default: true }) tooltip!: boolean

  private copied = false
  private showTooltip = false

  copy() {
    copyToClipboard(this.content)
    this.copied = true
    this.showTooltip = true
    setTimeout(() => {
      this.copied = false
    }, 1000)
    setTimeout(() => {
      this.showTooltip = false
    }, 1000)
  }
}
</script>

<style lang="scss" scoped>
.mc-copy-container {
  display: inline-block;

  ::v-deep .mcm-tooltip__reference {
    text-decoration-line: unset;
  }
}

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
