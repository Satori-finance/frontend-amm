<template>
  <div class="settle-my-position">
    <div class="info-box">
      <div class="title">{{ $t('perpetualSettle.myMarginBalance') }}</div>
      <div class="value">{{ marginBalance | bigNumberFormatter(collateralFormatDecimals) }}</div>
      <div class="unit"> {{ collateralTokenSymbol }}</div>
    </div>
    <div class="button-box">
      <McMStateButton :button-class="['orange', 'round', 'large']" :state.sync="withdrawButtonState"
                      :disabled="confirmButtonIsDisabled" @click="withdrawToWalletEvent">
        {{ $t('base.withdraw') }}
      </McMStateButton>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import ClearMyPositionMixin from '@/template/components/Clear/clearMyPositionMixin'
import { McMStateButton } from '@/mobile/components'

@Component({
  components: {
    McMStateButton,
  }
})
export default class ClearMyPosition extends Mixins(ClearMyPositionMixin) {
}
</script>

<style lang="scss" scoped>
.settle-my-position {

  .info-box {
    text-align: center;
    font-size: 14px;
    color: var(--mc-text-color-white);

    .title {
      font-size: 14px;
      line-height: 20px;
      color: var(--mc-text-color);
    }

    .value {
      margin-top: 8px;
      font-size: 40px;
    }

    .unit {
      margin-top: 4px;
      font-size: 14px;
    }
  }

  .button-box {
    margin-top: 24px;
    .van-button.large {
      width: 100%;
    }
  }
}
</style>
