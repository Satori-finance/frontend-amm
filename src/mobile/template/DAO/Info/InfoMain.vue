<template>
  <div class="info-main">
    <div class="info-box-item">
      <SATORIInfo />
    </div>
    <div class="info-box-item">
      <VaultInfo />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import SATORIInfo from './SatoriInfo.vue'
import VaultInfo from './VaultInfo.vue'

@Component({
  components: {
    SATORIInfo,
    VaultInfo,
  }
})
export default class InfoMain extends Vue {

}
</script>

<style lang="scss" scoped>
@import "./info.scss";

.info-main {

}
</style>
