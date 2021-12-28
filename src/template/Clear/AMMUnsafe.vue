<template>
  <div class="amm-unsafe">
    <BaseCardFrame :title="$t('perpetualSettle.emergency')">
      <template slot="content">
        <el-button class="emergency-button" size="large" :disabled="emergencyButtonDisabled" @click="onSetEmergencyState">
          {{ $t('perpetualSettle.emergency') }}
          <i v-if="buttonIsLoading" class="el-icon-loading"></i>
        </el-button>
      </template>
    </BaseCardFrame>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { BaseCardFrame } from '@/components'
import AmmUnsafeMixin from '@/template/components/Clear/ammUnsafeMixin'

@Component({
  components: {
    BaseCardFrame,
  },
})
export default class AMMUnsafe extends Mixins(AmmUnsafeMixin) {

  get buttonIsLoading(): boolean {
    return this.emergencyButtonState === 'loading'
  }
}
</script>

<style lang="scss" scoped>
.amm-unsafe {
  line-height: 390px;
  height: 503px;
  text-align: center;

  .emergency-button {
    width: 368px;
    height: 56px;
  }
}
</style>
