<template>
  <div class="mc-notification" :class="[type]">
    <div class="mc-notification__content">
      <slot name="content">
        <p>{{ content }}</p>
      </slot>
    </div>
  </div>
</template>

<script lang='ts'>
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class McNotification extends Vue {
  @Prop({ default: 'info' }) type!: string
  @Prop({ default: '' }) content!: string
}
</script>

<style lang="scss" scoped>
.mc-notification {

  .mc-notification__content {
    text-align: center;
    padding: 16px;
    font-size: 14px;
    line-height: 20px;
  }
}
</style>

<style scoped lang="scss">
@import "~@mcdex/style/common/fantasy-var";

.satori-fantasy .mc-notification {
  background-color: var(--mc-background-color-darkest);

  &.error .mc-notification__content {
    color: var(--mc-color-error);
    background: rgba($--mc-color-error, 0.1);
  }

  &.info .mc-notification__content {
    color: var(--mc-color-info);
    background: rgba($--mc-color-info, 0.1);
  }

  &.warning .mc-notification__content {
    color: var(--mc-color-warning);
    background: rgba($--mc-color-warning, 0.1);
  }

  &.success .mc-notification__content {
    color: var(--mc-color-success);
    background: rgba($--mc-color-success, 0.1);
  }
}
</style>
