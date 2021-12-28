<template>
  <div class="mining-main">
    <router-view />
  </div>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class MiningMain extends Vue {

}
</script>

<style lang="scss" scoped>
.mining-main {
  height: 100%;
}
</style>
