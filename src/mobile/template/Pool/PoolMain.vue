<template>
  <div class="pool-main">
    <router-view />
  </div>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class PoolMain extends Vue {

}
</script>

<style lang="scss">
.pool-main {
  height: 100%;
}
</style>
