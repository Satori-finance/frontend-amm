<template>
  <div class="preview-amm-depth">
    <div class="title">{{ $t('contractInfo.previewAMMDepth.title') }}</div>
    <div class="liquidity slider-item">
      <div class="label">
        <span>{{ $t('base.liquidity') }}</span>
        <span v-if="!price.isZero()" class="current-value">$ {{ liquidityUSD | bigNumberFormatter(0) }}</span>
        <span v-else class="current-value">{{ form.liquidityValue }} {{
            collateralInfo ? collateralInfo.symbol : ''
          }}</span>
      </div>
      <template v-if="!price.isZero()">
        <div class="slider">
          <McSimpleSlider v-model="liquidity" @input="onLiquidityChange" :step="0.1"
                          :tooltipFormatter="tooltipFormatterFunc" :tooltip-unit="'%'"/>
        </div>
        <div class="slider-label">
          <span>$ 0</span>
          <span>$ 100M</span>
        </div>
      </template>
      <template v-else>
        <div class="input-box">
          <el-form v-model="form" :rules="liquidityRule">
            <el-form-item prop="liquidityValue">
              <el-input v-model="form.liquidityValue">
                <template #suffix>{{ collateralInfo ? collateralInfo.symbol : '' }}</template>
              </el-input>
            </el-form-item>
          </el-form>
        </div>
      </template>
    </div>
    <div class="amm-position slider-item">
      <div class="label">
        <span>{{ $t('contractInfo.previewAMMDepth.ammPosition') }}</span>
      </div>
      <div class="position-box">
        <el-form ref="ammPositionInput" :model="form" :rules="ammPositionRule" inline-message>
          <el-form-item prop="ammPosition">
            <el-input v-model="form.ammPosition" @input="onAMMPositionInputChange">
              <template #suffix><span>{{ oracleInfo ? oracleInfo.symbol : '' }}</span></template>
            </el-input>
          </el-form-item>
        </el-form>
      </div>
      <div class="slider">
        <McSimpleSlider
          v-model="ammPosition"
          @input="onAMMPositionSliderChange"
          :disabled="maxPosition.eq(minPosition)"
          :min="minPosition.toNumber()"
          :max="maxPosition.toNumber()"
          :marks='[minPosition.toNumber(), 0, maxPosition.toNumber()]'
        />
      </div>
      <div class="slider-label">
        <span>{{ minPosition | bigNumberFormatter(0) }} {{
            oracleInfo ? oracleInfo.symbol : ''
          }}</span>
        <span>{{ maxPosition | bigNumberFormatter(0) }} {{
            oracleInfo ? oracleInfo.symbol : ''
          }}</span>
      </div>
    </div>

    <div class="amm-depth-box">
      <AMMDepth
        :liquidity-pool="liquidityPoolStorage"
        :perpetual-property="perpetualProperty"
        :perpetual-storage="perpetualStorage"
        :row-height="20"
        :w="5"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator'
import { McSimpleSlider } from '@/components'
import AMMDepth from '@/business-components/AMMDepth/AMMDepth.vue'
import BigNumber from 'bignumber.js'
import {
  _0,
  computeAMMPoolMargin,
  computeAMMSafeLongPositionAmount, computeAMMSafeShortPositionAmount,
  initAMMTradingContext,
  isAMMSafe,
  LiquidityPoolStorage,
  computeAMMTrade,
} from '@mcdex/mai3.js'
import { AccountStorage, PerpetualState, PerpetualStorage } from '@mcdex/mai3.js/dist/types'
import { CollateralInfo, LiquidityContractParams, OracleInfo, RiskParams } from '@/template/Pool/type'
import { PerpetualProperty } from '@/type'
import { getPerpetualFormatDecimals } from '@/utils/formatDecimals'
import { namespace } from 'vuex-class'
import { ElForm } from 'element-ui/types/form'
import { Value } from 'vue-slider-component/lib/typings'
import { formatBigNumber } from '@/utils'

const liquidity = new BigNumber('100000000')  // $
const price = namespace('price')

function numberValidator(val: string): boolean {
  if (emptyValidator(val)) {
    return true
  } else {
    return !(new BigNumber(val).isNaN())
  }
}

function emptyValidator(val: string): boolean {
  return val.trim() === ''
}

function outOfRangeValidator(min: string, max: string, current: string): boolean {
  if (emptyValidator(min) || emptyValidator(max) || emptyValidator(current)) {
    return true
  } else {
    const minValue = new BigNumber(min)
    const maxValue = new BigNumber(max)
    const currentValue = new BigNumber(current)
    return minValue.isNaN() || maxValue.isNaN() || currentValue.isNaN() ? false : currentValue.gte(minValue) && currentValue.lte(maxValue)
  }
}

@Component({
  components: {
    McSimpleSlider,
    AMMDepth,
  },
})
export default class PreviewAMMDepth extends Vue {
  @price.Getter('tokenPriceFunc') tokenPriceFunc!: (token: string) => BigNumber | null

  @Prop({ default: () => null }) riskParams!: RiskParams | null
  @Prop({ default: () => null }) contractParams!: LiquidityContractParams | null
  @Prop({ default: () => null }) oracleInfo!: OracleInfo | null
  @Prop({ default: () => null }) collateralInfo!: CollateralInfo | null

  @Ref('ammPositionInput') ammPositionInput!: ElForm | undefined

  private liquidity = 50
  private ammPosition = 0
  private form = {
    liquidityValue: '',
    ammPosition: '0',
  }
  private liquidityRule = {
    liquidityValue: [
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (
            !numberValidator(this.form.liquidityValue)
          ) {
            callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
            return
          }
          callback()
        },
        trigger: 'change',
      },
    ],
  }

  private ammPositionRule = {
    ammPosition: [
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (
            !numberValidator(this.form.ammPosition)
          ) {
            callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
            return
          }
          const min = this.positionAmountPair.asksAmount.dp(0, BigNumber.ROUND_DOWN).toString()
          const max = this.positionAmountPair.bidsAmount.dp(0, BigNumber.ROUND_DOWN).toString()
          if (!outOfRangeValidator(min, max, this.form.ammPosition)) {
            callback(new Error(this.$t('commonErrors.inputMinMaxError', { min, max }).toString()))
            return
          }
          callback()
        },
        trigger: 'change',
      },
    ],
  }

  get normalizeAMMPosition() {
    return new BigNumber(this.ammPosition)
  }

  get normalizeLiquidity() {
    const liquidity = new BigNumber(this.form.liquidityValue)
    return liquidity.isNaN() ? _0 : liquidity
  }

  get liquidityUSD() {
    return liquidity.times(this.liquidity).div(100)
  }

  get price() {
    return this.tokenPriceFunc(this.collateralInfo?.address || '') || _0
  }

  get liquidityPoolStorage(): LiquidityPoolStorage | null {
    if (!this.riskParams) {
      return null
    }
    let pool1 = this.zeroAMMPositionPoolStorage
    if (pool1 === null) {
      return null
    }
    let perp1 = pool1.perpetuals.get(0)
    if (!perp1) {
      return null
    }
    let dummyTrader : AccountStorage = {
      cashBalance: _0,
      positionAmount: _0,
      entryValue: null,
      entryFunding: null,
      targetLeverage: new BigNumber(this.riskParams.defaultTargetLeverage),
    }
    // open positions while keeping α = 0
    perp1.halfSpread.value = _0
    let pool2 = pool1
    if (!this.normalizeAMMPosition.isZero()) {
      try {
        pool2 = computeAMMTrade(pool1, 0, dummyTrader, this.normalizeAMMPosition.negated(), 0).newPool
      } catch (e) {
        console.warn('[Preview AMM]: ', e)
        return null
      }
    }
    let perp2 = pool2.perpetuals.get(0)
    if (!perp2) {
      return null
    }
    // restore α
    perp2.halfSpread.value = this.riskParams.halfSpread
    return pool2
  }

  get middleAMMPosition() {
    return this.positionAmountPair.asksAmount.plus(this.positionAmountPair.bidsAmount).div(2)
  }

  get zeroAMMPositionPoolStorage() {
    if (!this.riskParams || !this.oracleInfo || !this.contractParams || !this.collateralInfo) {
      return null
    }
    return {
      isSynced: true,
      isRunning: true,
      isFastCreationEnabled: true,
      creator: '',
      operator: '',
      transferringOperator: '',
      governor: '',
      shareToken: '',
      collateral: '',
      vault: '',
      vaultFeeRate: _0,
      poolCashBalance: this.normalizeLiquidity,
      collateralDecimals: this.collateralInfo.decimals,
      fundingTime: Date.now() / 1000,
      operatorExpiration: 0,
      insuranceFundCap: _0,
      insuranceFund: _0,
      donatedInsuranceFund: _0,
      isAMMMaintenanceSafe: true,
      liquidityCap: _0,
      shareTransferDelay: 0,
      perpetuals: new Map<number, PerpetualStorage>([
        [0, {
          state: PerpetualState.NORMAL,
          oracle: '',
          totalCollateral: _0,
          markPrice: this.oracleInfo.markPrice,
          indexPrice: this.oracleInfo.indexPrice,
          unitAccumulativeFunding: _0,
          initialMarginRate: this.contractParams.initialMarginRate,
          maintenanceMarginRate: this.contractParams.maintenanceMarginRate,
          operatorFeeRate: _0,
          lpFeeRate: _0,
          referrerRebateRate: _0,
          liquidationPenaltyRate: _0,
          keeperGasReward: _0,
          insuranceFundRate: _0,
          openInterest: _0,
          maxOpenInterestRate: new BigNumber('inf'),
          isInversePerpetual: this.contractParams.isInverse,
          isTerminated: false,
          halfSpread: {
            value: this.riskParams.halfSpread,
            maxValue: this.riskParams.minHalfSpread,
            minValue: this.riskParams.maxHalfSpread,
          },
          openSlippageFactor: {
            value: this.riskParams.openSlippage,
            maxValue: this.riskParams.maxOpenSlippage,
            minValue: this.riskParams.minOpenSlippage,
          },
          closeSlippageFactor: {
            value: this.riskParams.closeSlippage,
            maxValue: this.riskParams.maxCloseSlippage,
            minValue: this.riskParams.minCloseSlippage,
          },
          fundingRateLimit: {
            value: this.riskParams.fundingRateLimit,
            maxValue: this.riskParams.maxFundingRateLimit,
            minValue: this.riskParams.minFundingRateLimit,
          },
          fundingRateFactor: {
            value: this.riskParams.fundingRateFactor,
            maxValue: this.riskParams.maxFundingRateFactor,
            minValue: this.riskParams.minFundingRateFactor,
          },
          ammMaxLeverage: {
            value: this.riskParams.ammMaxLeverage,
            maxValue: this.riskParams.maxAMMMaxLeverage,
            minValue: this.riskParams.minAMMMaxLeverage,
          },
          maxClosePriceDiscount: {
            value: this.riskParams.closePriceDiscount,
            maxValue: this.riskParams.maxClosePriceDiscount,
            minValue: this.riskParams.minClosePriceDiscount,
          },
          baseFundingRate: {
            value: this.riskParams.baseFundingRate,
            maxValue: this.riskParams.maxBaseFundingRate,
            minValue: this.riskParams.minBaseFundingRate,
          },
          defaultTargetLeverage: {
            value: this.riskParams.defaultTargetLeverage,
            maxValue: this.riskParams.minDefaultTargetLeverage,
            minValue: this.riskParams.maxDefaultTargetLeverage,
          },
          symbol: 0,
          underlyingSymbol: this.oracleInfo.symbol,
          isMarketClosed: false,
          ammCashBalance: _0,
          ammPositionAmount: _0,
          fundingRate: _0,
        }],
      ]),
    }
  }

  get perpetualStorage(): PerpetualStorage | null {
    return this.liquidityPoolStorage?.perpetuals.get(0) || null
  }

  get perpetualProperty(): PerpetualProperty | null {
    const property = PerpetualProperty.emptyInstance()
    if (this.oracleInfo && this.collateralInfo) {
      property.underlyingAssetSymbol = this.oracleInfo.symbol
      property.collateralTokenSymbol = this.collateralInfo.symbol
      property.collateralTokenDecimals = this.collateralInfo.decimals
      property.decimals = getPerpetualFormatDecimals(this.collateralInfo.address, this.oracleInfo.indexPrice)
    }
    return property
  }

  // this only works if AMM's position = 0
  get positionAmountPair(): { bidsAmount: BigNumber, asksAmount: BigNumber } {
    if (!this.zeroAMMPositionPoolStorage) {
      return { bidsAmount: _0, asksAmount: _0 }
    }
    const perpetualIndex = 0

    try {
      let context = initAMMTradingContext(this.zeroAMMPositionPoolStorage, perpetualIndex)
      const beta = context.openSlippageFactor
      // pre-check
      if (!isAMMSafe(context, beta)) {
        console.warn('[Bug]preview AMM: AMM unsafe', this.zeroAMMPositionPoolStorage)
        return { bidsAmount: _0, asksAmount: _0 }
      }
      context = computeAMMPoolMargin(context, beta)
      if (context.poolMargin.lte(_0)) {
        console.warn('[Bug]preview AMM: pool margin must be positive', this.zeroAMMPositionPoolStorage)
        return { bidsAmount: _0, asksAmount: _0 }
      }
      return {
        bidsAmount: computeAMMSafeLongPositionAmount(context, beta),
        asksAmount: computeAMMSafeShortPositionAmount(context, beta),
      }
    } catch (e) {
      console.warn('[Error] preview AMM:', e)
      // if emergency or others error
      return { bidsAmount: _0, asksAmount: _0 }
    }
  }

  get minPosition() {
    return this.positionAmountPair.asksAmount.dp(0, BigNumber.ROUND_DOWN)
  }

  get maxPosition() {
    return this.positionAmountPair.bidsAmount.dp(0, BigNumber.ROUND_DOWN)
  }

  onAMMPositionSliderChange(val: number) {
    this.form.ammPosition = val.toString()
  }

  onAMMPositionInputChange(value: string) {
    const position = new BigNumber(value)
    if (position.isNaN()) {
      return
    }
    this.ammPosition = position.dp(0).toNumber()
  }

  tooltipFormatterFunc(v: Value): string {
    return `${formatBigNumber(v, 1)}%`
  }

  @Watch('price', { immediate: true })
  onLiquidityChange() {
    if (this.price.isZero()) {
      return
    }
    this.form.liquidityValue = liquidity.div(this.price).times(this.liquidity).div(100).toFixed()
  }

  @Watch('normalizeLiquidity')
  ammPositionValidate() {
    this.ammPositionInput?.validate()
  }
}
</script>

<style scoped lang="scss">
.preview-amm-depth {
  padding: 20px;
  background: #131A31;

  .title {
    font-size: 18px;
    line-height: 24px;
    font-weight: bold;
    color: var(--mc-text-color);
    margin-bottom: 10px;
  }

  .slider-item {
    .label {
      height: 40px;
      font-size: 14px;
      line-height: 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;

      .current-value {
        color: white;
      }
    }

    .slider {
      display: flex;
      align-items: center;
      height: 24px;
    }

    .slider-label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 14px;
      line-height: 20px;
      color: #FFFFFF;
    }
  }

  .amm-position {
    margin-top: 16px;

    .position-box {
      .el-form-item {
        margin-bottom: 10px;
      }
    }
  }

  .amm-depth-box {
    height: 580px;
    margin-top: 26px;
  }
}
</style>
