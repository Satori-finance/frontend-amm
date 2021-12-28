<template>
  <div>
    <!-- edit status dom -->
    <div class="select-oracle" v-show="showEdit">
      <SelectPerpetualOracle
        :collateral-address="collateralAddress"
        :collateral-symbol="collateralSymbol"
        :collateral-decimals="collateralDecimals"
        @next="onNextEvent"
        ref="selectPerpetualOracleRef"/>
    </div>

    <!-- view status dom -->
    <div class="readonly" v-show="!showEdit">
      <SelectPerpetualOracleView :selected-oracle-params="selectedOracleParams"/>
      <div class="action" v-if="!created && !readonly">
        <el-button type="secondary" @click="onEdit" :disabled="creating">{{ $t('base.edit') }}</el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Watch, Vue } from 'vue-property-decorator'
import { McLoading, McNoData } from '@/components'
import { SelectPerpetualOracle, SelectPerpetualOracleView } from '@/business-components'
import { SelectedOracleParams } from '@/business-components/SelectPerpetualOracle/types'
import * as _ from 'lodash'

@Component({
  components: {
    McLoading,
    McNoData,
    SelectPerpetualOracle,
    SelectPerpetualOracleView,
  },
})
export default class SelectOracle extends Vue {
  @Prop({ default: '', required: true }) collateralSymbol !: string
  @Prop({ default: '', required: true }) collateralAddress !: string
  @Prop({ default: 18, required: true }) collateralDecimals !: string
  @Prop({ required: true, default: false }) creating!: boolean
  @Prop({ required: true, default: false }) created!: boolean
  @Prop({ required: true, default: false }) readonly!: boolean
  @Ref('selectPerpetualOracleRef') selectPerpetualOracleRef !: HTMLElement

  status: 'editable' | 'readonly' = 'editable'

  selectedOracleParams: SelectedOracleParams | null = null

  get showEdit() {
    return !this.creating && !this.created && this.status === 'editable'
  }

  onNextEvent(params: SelectedOracleParams | null) {
    this.selectedOracleParams = params
    if (!params) {
      return
    }
    if (params.selectedType === 'registered') {
      this.status = 'readonly'
      this.$emit('change', {
        type: 'registered',
        underlyingAsset: params.underlyingSymbol,
        oracleRouterPath: _.cloneDeep(params.oracleRouterPath),
      })
    } else if (params.selectedType === 'uniswapV3') {
      this.status = 'readonly'
      this.$emit('change', {
        type: 'uniswapV3',
        underlyingAsset: params.underlyingSymbol,
        oracleRouterPath: _.cloneDeep(params.oracleRouterPath),
      })
    } else if (params.selectedType === 'custom') {
      this.status = 'readonly'
      this.$emit('change', {
        type: 'custom',
        underlyingAsset: params.underlyingSymbol,
        oracleAddress: params.oracleAddress,
      })
    }
  }

  /**
   * public func, do not rename
   */
  onEdit() {
    this.status = 'editable'
    this.$emit('change', null)
  }

  /**
   * public func, do not rename
   */
  reset() {
    this.status = 'editable'
    this.selectedOracleParams = null
    const ref = this.selectPerpetualOracleRef as any
    ref.reset()
  }
}
</script>

<style scoped lang="scss">
@import 'contract-form';

.svg-icon {
  height: 24px;
  width: 24px;
  vertical-align: -7px;
}

.select-oracle {
  .radio-group-tabs {
    ::v-deep {
      .el-radio-button__inner {
        width: 160px;
      }
    }
  }

  .el-form {
    .el-form-item {
      ::v-deep {
        .el-radio__label {
          font-size: 16px;
        }

        .el-input__inner {
          font-size: 16px;
        }
      }
    }
  }

  .selected-oracle-index {
    display: flex;

    .icon-triangle-bottom {
      font-size: 10px;
    }
  }

  .el-dialog {
    .is-medium {
      height: 557px;
    }
  }
}

.oracle-item-split {
  margin: 0 4px;
  color: var(--mc-text-color);
}

.el-icon-circle-close {
  cursor: pointer;
}

.readonly {
  .action {
    margin: 45px 115px auto;
    text-align: left;

    .el-button {
      width: 120px;
    }
  }
}

.mc-loading {
  position: absolute;
  height: 100%;
  width: 100%;
}
</style>
