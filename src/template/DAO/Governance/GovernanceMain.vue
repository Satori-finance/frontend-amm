<template>
  <div class="governance-main">
    <router-view class="content"></router-view>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

@Component
export default class GovernanceMain extends Vue {
}
</script>

<style lang="scss" scoped>
.governance-main {
  display: flex;
  flex-direction: column;
  margin: auto;
  height: 100%;
  min-height: 600px;

  .content {
    flex: 1;
  }
}
</style>
