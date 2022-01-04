<template>
  <div class="liquidation-take-over">
    <el-dialog
        :title="dialogTitle"
        top="0"
        custom-class="is-medium"
        :close-on-click-modal="false"
        :visible.sync="currentVisible"
        @closed="onClosed"
    >
      <div class="body-container">
        <div class="justify-line">
          <div>{{ $t('pool.liquidationTakeOver.liquidationPosition') }}</div>
          <div>
            <span>{{ $t('pool.liquidationPage.size') }}</span>
            <span class="value">
              {{ positionSize | bigNumberFormatter(underlyingDecimals) }}
              {{ underlyingSymbol }}
            </span>
          </div>
        </div>
        <div class="input-box">
          <el-form
              size="medium"
              :model="form"
              :rules="formRule"
              ref="form"
              @submit.native.prevent
          >
            <el-form-item prop="position">
              <el-input v-model="position" size="medium">
                <template slot="suffix">{{ underlyingSymbol }}</template>
              </el-input>
            </el-form-item>
          </el-form>
        </div>
        <div class="slider-box">
          <span class="left">
            <McSimpleSlider :value="form.positionPercentage" @input="setPositionPercentage" :step="1" :max="100"/>
          </span>
          <span class="right value">
            {{ form.positionPercentage | bigNumberFormatter(0) }} %
          </span>
        </div>
        <div class="content-line">
          {{ $t('pool.liquidationPage.liquidationPenalty') }}
          <span class="value-item value">
            {{ liquidationPenalty | bigNumberFormatter(collateralDecimals) }}
            {{ collateralSymbol }}
          </span>
        </div>
        <div class="panel-box">
          <div class="title">{{ $t('pool.liquidationTakeOver.myPosition') }}</div>
          <div class="panel">
            <div class="panel-line">
              <div>{{ $t('pool.liquidationPage.MarkPrice') }}</div>
              <div class="value">
                {{ markPrice | bigNumberFormatter(collateralDecimals) }}
                {{ collateralSymbol }}
              </div>
            </div>
            <div class="panel-line">
              <div>{{ $t('pool.liquidationPage.side') }}</div>
              <div class="value">
                <span :class="[getColorClass(myPosition)]">{{ getSideText(myPosition) }}</span>
                {{ underlyingSymbol }}
              </div>
            </div>
            <div class="panel-line">
              <div>{{ $t('base.position') }}</div>
              <div class="value">
                {{ myPosition | bigNumberFormatter(underlyingDecimals) }}
                {{ underlyingSymbol }}
              </div>
              <PNNumber
                  v-if="diffPosition && !diffPosition.isZero()"
                  class="suffix-text-item"
                  :number="diffPosition"
                  show-plus-sign
                  :decimals="underlyingDecimals"
              />
            </div>
            <div class="panel-line">
              <div>{{ $t('pool.liquidationTakeOver.availableCollateral') }}</div>
              <div class="value">
                {{ availableCollateral | bigNumberFormatter(collateralDecimals) }}
                {{ collateralSymbol }}
              </div>
              <PNNumber
                  v-if="diffAvailableCollateral && !diffAvailableCollateral.isZero()"
                  class="suffix-text-item"
                  :number="diffAvailableCollateral"
                  show-plus-sign
                  :decimals="collateralDecimals"
              />
            </div>
            <div class="panel-line">
              <div>{{ $t('base.leverage') }}</div>
              <div class="value">
                {{ leverage | leverageFormatter }} x
              </div>
              <PNNumber
                  v-if="diffLeverage && !diffLeverage.isZero()"
                  class="suffix-text-item"
                  :number="diffLeverage"
                  show-plus-sign
                  :decimals="leverageDecimals"
              />
            </div>
            <div class="panel-line">
              <div>{{ $t('pool.liquidationTakeOver.estimatedLiquidationPrice') }}</div>
              <div class="value">
                {{ liqPrice | bigNumberFormatter(collateralDecimals) }}
                {{ collateralSymbol }}
              </div>
              <PNNumber
                  v-if="diffLiqPrice && !diffLiqPrice.isZero()"
                  class="suffix-text-item"
                  :number="diffLiqPrice"
                  show-plus-sign
                  :decimals="collateralDecimals"
              />
            </div>
          </div>
        </div>
      </div>
      <span slot="footer">
        <div class="footer-button">
          <el-button @click="currentVisible=false" size="medium" type="secondary">{{ $t('base.cancel') }}</el-button>
          <el-button @click="onConfirmEvent" size="medium" :disabled="buttonIsDisabled">
            {{ $t('pool.transferOperator.transfer') }}
            <i v-if="confirmButtonLoading" class="el-icon-loading"></i>
          </el-button>
        </div>
      </span>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator'
import { LiquidationTakeOverMixin } from '@/template/components/Liquidation/liquidationTakeOverMixin'
import BigNumber from 'bignumber.js'
import { McSimpleSlider, PNNumber } from '@/components'
import { LEVERAGE_DECIMALS } from '@/const'

@Component({
  components: {
    McSimpleSlider,
    PNNumber
  }
})
export default class LiquidationTakeOver extends Mixins(LiquidationTakeOverMixin) {
  @Prop({ default: false }) visible!: boolean

  protected leverageDecimals = LEVERAGE_DECIMALS

  get currentVisible() {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
  }

  get buttonIsDisabled(): boolean {
   return false
  }

  get dialogTitle(): string {
    return this.$t('pool.liquidationTakeOver.title', {
      name: `${this.underlyingSymbol}-${this.collateralSymbol}`
    }).toString()
  }

  getColorClass(value: BigNumber): string {
    if (value.gt(0)) {
      return 'long-color'
    }
    if (value.lt(0)) {
      return 'short-color'
    }
    return ''
  }

  getSideText(position: BigNumber): string {
    if (position.gt(0)) {
      return this.$t('base.long').toString()
    }
    if (position.lt(0)) {
      return this.$t('base.short').toString()
    }
    return ''
  }

  onClosed() {
    this.$emit('closed')
    this.form.position = ''
    this.form.positionPercentage = 0
  }
}
</script>

<style lang="scss" scoped>
@import "~@mcdex/style/common/var";

.liquidation-take-over {
  ::v-deep {
    .el-dialog.is-medium {
      height: 606px;
      padding-bottom: 32px;

      .el-dialog__footer {
        .el-button {
          width: 106px;
          margin: 0 12px;
        }
      }
    }

    .el-input__inner {
      font-size: 14px;
    }
  }

  .value {
    color: var(--mc-text-color-white);
  }

  .justify-line {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    font-weight: 400;
    color: var(--mc-text-color);
    margin-bottom: 8px;
  }

  .body-container {
    padding: 36px 91px 0 91px;

    .slider-box {
      margin-top: 37px;
      display: flex;
      justify-content: space-between;
      height: 16px;
      line-height: 8px;

      .left {
        width: 89%;
      }

      .right {
        font-size: 14px;
        margin-right: 3px;
      }
    }

    .content-line {
      margin-top: 8px;
      color: var(--mc-text-color);
      font-size: 14px;
      font-weight: 400;

      .value-item {
        margin-left: 4px;
      }
    }

    .panel-box {
      margin-top: 30px;
      .title {
        font-size: 16px;
        font-weight: 700;
        color: var(--mc-text-color-white);
        margin-bottom: 10px;
      }

      .panel {
        padding: 22px;
        width: 450px;
        height: 204px;
        border-radius: 4px;
        background: var(--mc-background-color-dark);

        .panel-line {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 14px;
          color: var(--mc-text-color);
          line-height: 26.6px;

          .value {
            margin-right: 48px;
          }

          .suffix-text-item {
            position: absolute;
            left: calc(100% - 45px);
            width: 100px;
          }
        }
      }
    }
  }

  .long-color {
    color: var(--mc-color-blue);
  }

  .short-color {
    color: var(--mc-color-orange);
  }

}
</style>
