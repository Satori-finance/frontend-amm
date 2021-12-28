<template>
  <div class="mcm-notice-bar" :class="type" v-html="text">
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class NoticeBar extends Vue {
  @Prop({default: ''}) text!: string
  @Prop({default: 'info'}) type!: 'info' | 'warning' | 'error'
}
</script>

<style lang="scss" scoped>
@import "~@mcdex/style/common/var";

.mcm-notice-bar {
  padding: 16px;
  text-align: center;
  font-size: 14px;
  line-height: 20px;

  &.warning {
    color: var(--mc-color-warning);
    background: rgba($--mc-color-warning, 0.1);
  }

  &.error {
    color: var(--mc-color-error);
    background: rgba($--mc-color-error, 0.1);
  }
}
</style>
