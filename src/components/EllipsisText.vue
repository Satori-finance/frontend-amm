<template>
  <Popover placement="top">
    <template #popover>
      <p>{{ $t('copiedToClipboard') }}</p>
    </template>
    <el-tooltip :content="text" placement="top" :open-delay="400">
      <span class="ellipsis-text-content" @click="copyToClipboard(text)">
        {{ showText !== '' ? showText : renderText }}
      </span>
    </el-tooltip>
  </Popover>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { copyToClipboard, ellipsisMiddle } from '@/utils/common'
import Popover from './Popover.vue'

@Component({
  components: {
    Popover
  }
})
export default class EllipsisText extends Vue {
  @Prop({ default: 6 }) private headLength!: number
  @Prop({ default: 4 }) private tailLength!: number
  @Prop({ default: '' }) private text!: number | string
  @Prop({ default: '' }) private showText!: number | string

  get renderText () {
    return ellipsisMiddle(this.text, this.headLength, this.tailLength)
  }

  copyToClipboard = copyToClipboard
}
</script>

<style lang="scss" scoped>
.ellipsis-text-content {
  display: inline-block;
  cursor: pointer !important;

  &:active {
    transform: scale(0.8);
    opacity: 0.8;
  }
}
</style>
