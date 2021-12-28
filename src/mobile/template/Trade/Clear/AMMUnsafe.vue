<template>
  <div class="amm-emergency">
    <div class="emergency-container">
      <div class="emergency-image">
        <McMNoData></McMNoData>
      </div>
      <div class="emergency-button">
        <McMStateButton :state.sync="emergencyButtonState" @click="onSetEmergencyState" :disabled="emergencyButtonDisabled"
                        :button-class="['round', 'large']">
          {{ $t('perpetualSettle.emergency') }}
        </McMStateButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import AmmUnsafeMixin from '@/template/components/Clear/ammUnsafeMixin'
import { McMStateButton, McMNoData } from '@/mobile/components'

@Component({
  components: {
    McMStateButton,
    McMNoData
  }
})
export default class AMMUnsafe extends Mixins(AmmUnsafeMixin) {
}
</script>

<style lang="scss" scoped>
.amm-emergency {
  margin-top: 16px;
  .emergency-container {
    text-align: center;

    .emergency-button {
      margin-top: 24px;
      .van-button.large {
        width: 100%;
      }
    }
  }
}
</style>
