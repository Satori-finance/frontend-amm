<template>
  <div class="clear-main">
    <div
      class="notice-container"
    >
      <McNotification v-if="isGlobalSettled" type="error">
        <span slot="content">
          {{ $t('perpetualSettle.perpetualClosedTip') }}
          {{ $t('perpetualSettle.clearedPrice') }}
          {{ globalSettlePrice | bigNumberFormatter(priceFormatDecimals) }}
          {{ priceUnit }}
        </span>
      </McNotification>
      <McNotification v-else-if="selectedPerpetual.perpetualProperty.unChangePerpetualState === PerpetualState.NORMAL
                                    && selectedPerpetualOracleIsTerminated" type="warning"
                      :content="$t('globalNotification.ammUnsafePrompt')"></McNotification>
      <McNotification v-else-if="!isClearEnd" type="warning"
                      :content="$t('perpetualSettle.perpetualEmergencyTip')"></McNotification>
    </div>
    <el-row class="panel row" v-if="selectedPerpetual.perpetualProperty.unChangePerpetualState === PerpetualState.NORMAL
                                    && selectedPerpetualOracleIsTerminated">
      <el-col :span="24">
        <AMMUnsafe/>
      </el-col>
    </el-row>
    <el-row class="panel row" v-else-if="selectedPerpetualIsSettle">
      <el-col :span="12">
        <ClearLiquidation/>
      </el-col>
      <el-col :span="12">
        <ClearMyPosition/>
      </el-col>
    </el-row>
    <el-row class="panel row" v-else-if="!selectedPerpetualAmmIsSafe">
      <el-col :span="24">
        <AMMUnsafe/>
      </el-col>
    </el-row>
    <div class="orders row">
      <PositionsAndOrders/>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import ClearLiquidation from './ClearLiquidation.vue'
import ClearMyPosition from './ClearMyPosition.vue'
import PositionsAndOrders from '@/template/Trade/PositionAndOrders/PositionsAndOrders.vue'
import AMMUnsafe from './AMMUnsafe.vue'
import { SelectedPerpetualMixin } from '@/mixins'
import { PerpetualState } from '@mcdex/mai3.js'
import { McNotification } from '@/components'
import BigNumber from 'bignumber.js'

@Component({
  components: {
    ClearLiquidation,
    ClearMyPosition,
    PositionsAndOrders,
    AMMUnsafe,
    McNotification,
  },
})
export default class PerpetualClearMain extends Mixins(SelectedPerpetualMixin) {
  PerpetualState = PerpetualState

  get globalSettlePrice(): BigNumber | null {
    if (!this.selectedPerpetualStorage) return null
    return this.selectedPerpetualStorage.markPrice
  }

  get priceUnit() {
    return this.selectedPerpetualProperty?.priceSymbol || ''
  }

  get priceFormatDecimals(): number {
    return this.selectedPerpetualProperty?.priceFormatDecimals || 0
  }

  get isEmergency(): boolean {
    if (!this.selectedPerpetualStorage) return false
    return this.selectedPerpetualStorage.state === PerpetualState.EMERGENCY
  }

  get isGlobalSettled(): boolean {
    if (!this.selectedPerpetualStorage) return false
    return this.selectedPerpetualStorage.state === PerpetualState.CLEARED
  }

  get isClearEnd(): boolean {
    if (!this.selectedPerpetualStorage) return false
    return this.selectedPerpetualStorage.state === PerpetualState.CLEARED
  }
}
</script>

<style lang="scss" scoped>
@import '~@mcdex/style/common/var';

.clear-main {
  flex: auto;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 1440px;
  margin: 0 auto;

  .notice-container {
    margin: 1px 0;

    .notice-line {
      font-size: 13px;
      height: 40px;
      padding: 12px 20px;
    }

    .warn {
      color: var(--mc-color-warning);
      background: rgba(255, 177, 16, 0.1);
    }
  }

  .row {
    margin-top: 1px;
  }

  .panel {
    ::v-deep .content {
      height: 412px;
    }
  }

  .last-line {
    flex: 1;
    margin-bottom: 11px;
    min-height: 342px;
  }

  .orders {
    height: 466px;
    overflow: hidden;

    .position-orders {
      height: 100%;
    }
  }
}
</style>
