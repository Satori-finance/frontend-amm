<template>
  <div class="clear-liquidation">
    <BaseCardFrame :title="$t('perpetualSettle.headTitle')">
      <template slot="content">
        <div class="content-container">
          <div class="content-wraper">
            <div class="progress">
              <div class="label">{{ $t('perpetualSettle.clearProgress') }}</div>
              <McProgressBar :max="Number(totalClearAccount)" :value="completedClearAccount"/>
            </div>
            <div class="incentives">
              <div class="label">{{ $t('perpetualSettle.clearIncentives') }}</div>
              <div class="value">{{ clearIncentivesValue }}</div>
              <div class="symbol">{{ collateralTokenSymbol }} / {{ $t('account') }}</div>
            </div>
            <div class="footer">
              <el-button size="large" :disabled="confirmButtonIsDisabled" @click="clearEvent">
                {{ $t('base.clear') }}
                <i v-if="buttonIsLoading" class="el-icon-loading"></i>
              </el-button>
            </div>
          </div>
        </div>
      </template>
    </BaseCardFrame>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { BaseCardFrame, McProgressBar } from '@/components'
import ClearLiquidationMixin from '@/template/components/Clear/clearLiquidationMixin'

@Component({
  components: {
    BaseCardFrame,
    McProgressBar,
  },
})
export default class ClearLiquidation extends Mixins(ClearLiquidationMixin) {

}
</script>

<style lang="scss" scoped>
.clear-liquidation {

  .content-container {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;

    .content-wraper {
      width: 368px;
    }

    .progress {
      .label {
        font-size: 14px;
        line-height: 20px;
      }
      .mc-progress-bar {
        margin-top: 8px;
      }
    }

    .incentives {
      margin-top: 24px;
      text-align: center;
      .label {
        font-size: 14px;
        line-height: 20px;
      }
      .value {
        margin-top: 8px;
        font-size: 40px;
        line-height: 48px;
      }
      .symbol {
        font-size: 14px;
        line-height: 20px;
        margin-top: 4px;
      }
    }

    .footer {
      margin-top: 24px;
      text-align: center;

      .el-button {
        width: 100%;
        height: 56px;
      }
    }
  }
}
</style>

<style scoped lang="scss">
.satori-fantasy .clear-liquidation {
  .content-container {
    .progress {
      .label {
        color: var(--mc-text-color);
      }
    }

    .incentives {
      .label {
        color: var(--mc-text-color);
      }
      .value {
        color: var(--mc-color-primary);
      }
    }
  }
}
</style>
