<template>
  <div class="select-perpetual-oracle">
    <div class="radio-group-tabs">
      <el-radio-group v-model="selectType" size="medium">
        <el-radio-button label="registered">{{ $t('newContract.registeredOracle') }}</el-radio-button>
        <el-radio-button v-if="!isBSC" label="uniswapV3">{{ $t('newContract.uniswapV3Oracle') }}</el-radio-button>
        <el-radio-button label="custom">{{ $t('newContract.custom') }}</el-radio-button>
      </el-radio-group>
    </div>
    <RegisteredOracleSelector
      ref="registeredSelector"
      v-if="selectType === 'registered'"
      :collateral-decimals="collateralDecimals"
      :collateral-address="collateralAddress"
      :collateral-symbol="collateralSymbol"
      @confirm="onConfirm"/>
    <UniswapOracleSelector
      ref="uniswapV3Selector"
      v-else-if="selectType === 'uniswapV3'"
      :collateral-decimals="collateralDecimals"
      :collateral-address="collateralAddress"
      :collateral-symbol="collateralSymbol"
      @confirm="onConfirm"/>
    <CustomOracleSelector
      ref="customSelector"
      v-else
      :collateral-decimals="collateralDecimals"
      :collateral-address="collateralAddress"
      :collateral-symbol="collateralSymbol"
      @confirm="onConfirm"/>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator'
import RegisteredOracleSelector from './RegisteredOracleSelector.vue'
import UniswapOracleSelector from './UniswapOracleSelector.vue'
import CustomOracleSelector from './CustomOracleSelector.vue'
import { currentChainConfig } from '@/config/chain'
import { SUPPORTED_NETWORK_ID } from '@/const'

@Component({
  components: {
    RegisteredOracleSelector,
    UniswapOracleSelector,
    CustomOracleSelector,
  },
})
export default class SelectPerpetualOracle extends Vue {

  @Prop({ default: '', required: true }) collateralSymbol !: string
  @Prop({ default: '', required: true }) collateralAddress !: string
  @Prop({ default: 18, required: true }) collateralDecimals !: number

  @Ref('registeredSelector') registeredSelector!: RegisteredOracleSelector | null
  @Ref('uniswapV3Selector') uniswapV3Selector!: UniswapOracleSelector | null
  @Ref('customSelector') customSelector!: CustomOracleSelector | null

  selectType: 'registered' | 'custom' | 'uniswapV3' = 'registered'

  get isBSC() {
    return currentChainConfig.chainID === SUPPORTED_NETWORK_ID.BSC
  }

  onConfirm(info: any) {
    this.$emit('next', info)
  }

  reset() {
    this.registeredSelector?.reset()
    this.uniswapV3Selector?.reset()
    this.customSelector?.reset()
  }
}
</script>

<style lang="scss" scoped>

.select-perpetual-oracle {
  .radio-group-tabs {
    text-align: center;
    margin-bottom: 30px;
    ::v-deep {
      .el-radio-button__inner {
        width: 160px;
      }
    }
  }
}
</style>
