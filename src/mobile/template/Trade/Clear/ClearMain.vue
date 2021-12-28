<template>
  <div class="clear-main">
    <AMMUnsafe v-if="selectedPerpetual.perpetualProperty.unChangePerpetualState === PerpetualState.NORMAL
                                    && selectedPerpetualOracleIsTerminated" />
    <ClearLiquidation v-else-if="isEmergency" />
    <ClearMyPosition v-else-if="isGlobalSettled" />
    <AMMUnsafe v-else-if="!selectedPerpetualAmmIsSafe" />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { SelectedPerpetualMixin } from '@/mixins'
import ClearLiquidation from './ClearLiquidation.vue'
import ClearMyPosition from './ClearMyPosition.vue'
import AMMUnsafe from './AMMUnsafe.vue'
import { PerpetualState } from '@mcdex/mai3.js'

@Component({
  components: {
    ClearLiquidation,
    ClearMyPosition,
    AMMUnsafe,
  }
})
export default class ClearMain extends Mixins(SelectedPerpetualMixin) {

  PerpetualState = PerpetualState

  get isEmergency(): boolean {
    if (!this.selectedPerpetualStorage) return false
    return this.selectedPerpetualStorage.state === PerpetualState.EMERGENCY
  }

  get isGlobalSettled(): boolean {
    if (!this.selectedPerpetualStorage) return false
    return this.selectedPerpetualStorage.state === PerpetualState.CLEARED
  }
}
</script>

<style scoped lang="scss">
.clear-main {
  width: 100%;
}
</style>
