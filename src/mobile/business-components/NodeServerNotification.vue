<template>
  <div class="node-server-notification"  v-if="nodeErrorNum > 5">
    {{ message }}
  </div>
</template>

<script lang='ts'>
import { Component, Mixins } from 'vue-property-decorator'
import { NodeServerErrorMixin } from '@/mixins'

@Component
export default class NodeServerNotification extends Mixins(NodeServerErrorMixin) {
}
</script>

<style lang="scss" scoped>
@import "~@mcdex/style/common/var";

.node-server-notification {
  padding: 16px;
  text-align: center;
  font-size: 14px;
  line-height: 16px;
  color: var(--mc-color-error);
  background: rgba($--mc-color-error, 0.1);
}
</style>
