<template>
  <div class="node-server-notification" v-if="nodeErrorNum > 5">
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
.node-server-notification {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 8px;
  color: var(--mc-color-error);
  background: rgba(255, 78, 89, 0.1);
  font-size: 14px;
  line-height: 20px;
  min-height: 40px;
}
</style>
