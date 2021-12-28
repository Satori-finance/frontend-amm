<template>
  <div class="uniswap-oracle-selector">
    <el-form ref="form" label-width="262px" @submit.native.prevent>
      <div>
        <el-form-item :label="$t('newContract.underlyingAsset')" :inline-message="true">
          <input class="control-item underlying" readonly type="text" @click="selectUnderlyingDialogVisible = true"
                 :placeholder="$t('newContract.inputUnderlyingSymbol')" :value="underlyingLabel">
        </el-form-item>
        <el-form-item :label="$t('newContract.oracleQuoteAsset')" :inline-message="true">
          <input class="control-item underlying" readonly type="text" @click="selectQuoteDialogVisible = true"
                 :placeholder="$t('newContract.inputOracleQuoteAsset')"
                 :value="quoteLabel">
        </el-form-item>


        <McLoading class="routes-table-wrap" :show-loading="loadingRoute" :hide-content="true"
                   :min-show-time="0" :show-loading-text="false" mask-color="transparent" v-if='underlyingSymbol'>
          <div class="registered-show-routes-tables" v-if="bestRouteInfo.bestRoute">
            <table class="mc-data-table mc-data-table--border is-medium">
              <thead>
              <tr>
                <th>{{ $t('base.selected') }}</th>
                <th>{{ $t('newContract.oracleRoutes') }}</th>
              </tr>
              </thead>
              <tbody>
              <tr v-if="bestRouteInfo.bestRoute" @click="selectRoutesIndex=0">
                <td class="is-center">
                  <el-radio v-model="selectRoutesIndex" :label="0"></el-radio>
                </td>
                <td>
                  <McUniswapV3OracleView :token-path="bestRouteInfo.bestRoute.tokenPath">
                    <template #title-suffix>
                      <el-button class="custom-oracle-btn" type="primary" size="mini"
                                 @click.stop="customRouteVisible = true">
                        {{ $t('newContract.customRoute') }}
                      </el-button>
                    </template>
                  </McUniswapV3OracleView>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
          <div class="tip-line" v-else-if="underlyingSymbol">
            <span v-html="$t('newContract.oracleLinkPrompt')"></span>
          </div>
        </McLoading>
        <template v-if="selectRoutesIndex ===0 && bestRouteInfo.bestRoute">
          <el-form ref="form" label-width="262px" :model="uniswapOracleTWAPForm" :rules="uniswapOracleTWAPRules"
                   @submit.native.prevent>
            <el-form-item class="index-price-twap" :label="$t('newContract.indexPriceTWAP')" prop="indexPrice"
                          :inline-message="true">
              <el-input class="control-item" type="text" :placeholder="$t('newContract.TWAPPlaceholder')"
                        v-model="uniswapOracleTWAPForm.indexPrice">
                <template #suffix>S</template>
              </el-input>
            </el-form-item>
            <el-form-item class="mark-price-twap" :label="$t('newContract.markPriceTWAP')" prop="markPrice"
                          :inline-message="true">
              <el-input class="control-item" type="text" :placeholder="$t('newContract.TWAPPlaceholder')"
                        v-model="uniswapOracleTWAPForm.markPrice">
                <template #suffix>S</template>
              </el-input>
            </el-form-item>
          </el-form>
        </template>
      </div>

      <!-- next button -->
      <el-tooltip placement="top" :content="$t('newContract.useUncertifiedOracleTip1')"
                  :disabled="tooltipIsDisabled">
        <el-form-item label=" " class="button-container">
          <el-button
            class="control-item"
            @click="onNextEvent"
            :loading="oracleLoading"
            :class="{'is-disabled': nextButtonIsDisabled}"
          >
            {{ $t('base.next') }}
          </el-button>
        </el-form-item>
      </el-tooltip>
    </el-form>

    <McTokenSelectorDialog :visible.sync="selectUnderlyingDialogVisible" v-model="selectedUnderlying"
                           :token-list="chainAllTokenList" :title="$t('newContract.underlyingAsset')"/>
    <McTokenSelectorDialog :visible.sync="selectQuoteDialogVisible" v-model="selectedQuote"
                           :token-list="chainAllTokenList"/>
    <CustomUniswapRouteDialog :visible.sync="customRouteVisible" :init-route="customRouteInfo" @change="changeRoute"/>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator'
import { Provider } from '@ethersproject/providers'
import { ExtendedPool, LinkedMap, TokenInfoItem, UnderlyingInfo, UnderlyingType, UniswapV3Pool } from '@/type'
import { ElForm } from 'element-ui/types/form'
import { ellipsisMiddle, toBigNumber } from '@/utils'
import { getGeneralizedUppercaseName } from '@/config/tokens'
import { namespace } from 'vuex-class'
import { UniswapOracle } from './types'
import SelectUnderlyingDialog from '../SelectUnderlying/SelectUnderlyingDialog.vue'
import { Currency, Token } from '@uniswap/sdk-core'
import { calcPoolAddresses, computeAllRoutes } from '@/utils/uniswap'
import { Route } from '@uniswap/v3-sdk'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { queryUniswapV3PoolsByAddresses } from '@/api/token'
import { TARGET_NETWORK_ID, UNISWAP_V3_FACTORY_ADDRESS } from '@/constants'
import { McLoading, McUniswapV3OracleView } from '@/components'
import CustomUniswapRouteDialog from '@/business-components/CustomUniswapRouteDialog.vue'
import _ from 'lodash'
import { _0, CHAIN_ID_TO_UNISWAP_V3_TOOL_ADDRESS, DECIMALS, UniswapV3ToolFactory } from '@mcdex/mai3.js'
import McTokenSelectorDialog from '@/business-components/McTokenSelectorDialog.vue'

const wallet = namespace('wallet')
const token = namespace('token')

@Component({
  components: {
    SelectUnderlyingDialog,
    McTokenSelectorDialog,
    McLoading,
    CustomUniswapRouteDialog,
    McUniswapV3OracleView,
  },
})
export default class UniswapOracleSelector extends Vue {
  @wallet.Getter('provider') provider!: Provider
  @token.Getter('chainAllTokenList') chainAllTokenList!: TokenInfoItem[]
  // bind: next event, params: SelectedOracleParams

  @Prop({ default: '', required: true }) collateralSymbol !: string
  @Prop({ default: '', required: true }) collateralAddress !: string
  @Prop({ default: 18, required: true }) collateralDecimals !: number

  @Ref('form') formRef!: ElForm

  private oracleLoading: boolean = false
  private selectRoutesIndex: number | null = null
  private selectUnderlyingDialogVisible: boolean = false
  private selectQuoteDialogVisible: boolean = false
  private selectedUnderlying: TokenInfoItem | null = null
  private selectedQuote: TokenInfoItem | null = null

  private underlyingSymbol = ''

  private bestRouteInfo: { bestRoute: Route<Currency, Currency> | null, price: BigNumber | null } = {
    bestRoute: null,
    price: null,
  }
  private chainId = TARGET_NETWORK_ID
  private loadingRoute = false
  private customRouteVisible = false
  private uniswapOracleTWAPForm = {
    indexPrice: '1',
    markPrice: '10',
  }

  get underlyingLabel() {
    return this.selectedUnderlying
      ? (`${this.selectedUnderlying.symbol}(${ellipsisMiddle(this.selectedUnderlying.address, 10, 12)})`)
      : ''
  }

  get quoteLabel() {
    return this.selectedQuote ? `${this.selectedQuote.symbol}(${ellipsisMiddle(this.selectedQuote.address, 10, 12)})` : ''
  }

  get customRouteInfo(): { tokenPath: TokenInfoItem[], feeAmounts: number[] } {
    return {
      tokenPath: this.bestRouteInfo.bestRoute ? this.bestRouteInfo.bestRoute.tokenPath.map(t => ({
        symbol: t.symbol,
        address: t.address,
        decimals: t.decimals,
      } as TokenInfoItem)) : [],
      feeAmounts: this.bestRouteInfo.bestRoute ? this.bestRouteInfo.bestRoute.pools.map(p => p.fee) : [],
    }
  }

  get nextTip(): boolean {
    return !this.selectedUnderlying || !this.selectedQuote || this.selectRoutesIndex === null
  }

  get uniswapOracleTWAPRules() {
    return {
      indexPrice: {
        validator: (rule: any, value: any, callback: Function) => {
          if (!new BigNumber(this.uniswapOracleTWAPForm.indexPrice).isInteger()) {
            callback(new Error(this.$t('newContract.indexPriceTWAPError').toString()))
            return
          }
          callback()
        },
        trigger: 'change',
      },
      markPrice: {
        validator: (rule: any, value: any, callback: Function) => {
          if (!new BigNumber(this.uniswapOracleTWAPForm.markPrice).isInteger() || new BigNumber(this.uniswapOracleTWAPForm.markPrice).lt(this.uniswapOracleTWAPForm.indexPrice)) {
            callback(new Error(this.$t('newContract.markPriceTWAPError').toString()))
            return
          }
          callback()
        },
        trigger: 'change',
      },
    }
  }

  get formValidatorIsPass(): boolean {
    const markPrice = toBigNumber(this.uniswapOracleTWAPForm.markPrice)
    const indexPrice = toBigNumber(this.uniswapOracleTWAPForm.indexPrice)
    return markPrice.isInteger() && indexPrice.isInteger() && markPrice.gte(indexPrice)
  }

  get nextButtonIsDisabled(): boolean {
    return !this.formValidatorIsPass || this.loadingRoute || !this.selectedOracleRoute
  }

  get tooltipIsDisabled(): boolean {
    return !this.underlyingSymbol || !!this.bestRouteInfo.bestRoute
  }

  get generalizedCollateralName(): string {
    return getGeneralizedUppercaseName(this.collateralAddress) || this.collateralSymbol.toUpperCase()
  }

  get generalizedUnderlyingName(): string {
    return this.selectedUnderlying && getGeneralizedUppercaseName(this.selectedUnderlying.address) || this.underlyingSymbol.toUpperCase()
  }

  get selectedOracleRoute(): UniswapOracle | null {
    if (this.selectRoutesIndex === null) {
      return null
    } else if (this.bestRouteInfo.bestRoute) {
      return {
        route: this.bestRouteInfo.bestRoute,
        indexPriceTWAP: Number(this.uniswapOracleTWAPForm.indexPrice),
        markPriceTWAP: Number(this.uniswapOracleTWAPForm.markPrice),
        price: this.bestRouteInfo.price || _0,
      }
    } else {
      return null
    }
  }

  get tokenOutInfo() {
    return {
      address: this.selectedQuote?.address || this.collateralAddress,
      decimals: this.selectedQuote?.decimals || this.collateralDecimals,
      symbol: this.selectedQuote?.symbol || this.collateralSymbol,
    }
  }

  get uniswapTokenIn() {
    return this.selectedUnderlying && new Token(this.chainId, this.selectedUnderlying.address, this.selectedUnderlying.decimals!, this.selectedUnderlying.symbol)
  }

  get uniswapTokenOut() {
    return this.tokenOutInfo.address ? new Token(this.chainId, this.tokenOutInfo.address, this.tokenOutInfo.decimals, this.tokenOutInfo.symbol) : null
  }

  get uniswapV3PoolAddresses() {
    try {
      const addresses: string[] = this.uniswapTokenIn && this.uniswapTokenOut ? calcPoolAddresses(this.uniswapTokenIn, this.uniswapTokenOut, this.chainId).filter(address => address !== undefined) as string[] : []
      return addresses.map(address => address.toLowerCase())
    } catch (e) {
      return []
    }
  }

  private async calcBestRoute(routes: Route<Currency, Currency>[]) {
    if (!routes.length) {
      return { bestRoute: null, price: null }
    }
    const uniswapV3OracleTool = UniswapV3ToolFactory.connect(CHAIN_ID_TO_UNISWAP_V3_TOOL_ADDRESS[TARGET_NETWORK_ID], this.provider)
    const results = await Promise.all(routes.map(async route => {
      try {
        return await uniswapV3OracleTool.getPrice(UNISWAP_V3_FACTORY_ADDRESS, route.tokenPath.map(t => t.address), route.pools.map(p => p.fee))
      } catch (e) {
        return null
      }
    }))
    const {
      bestRoute,
      price,
    } = results.reduce<{ bestRoute: Route<Currency, Currency> | null, price: ethers.BigNumber | null }>((previousValue, currentValue, currentIndex) => {
      if (!currentValue) {
        return previousValue
      }
      if (!previousValue.price || currentValue.gt(previousValue.price)) {
        return { bestRoute: routes[currentIndex], price: currentValue }
      }
      return previousValue
    }, { bestRoute: null, price: null })
    return {
      bestRoute,
      price: price && price.gt(0) && bestRoute ? new BigNumber(price.toString()).shiftedBy(-DECIMALS) : null,
    }
  }

  @Watch('uniswapV3PoolAddresses', { immediate: true })
  private async loadUniswapPoolsByAddresses() {
    if (!this.uniswapTokenOut || !this.uniswapTokenIn) {
      return
    }
    try {
      this.loadingRoute = true
      const poolMap = new LinkedMap<string, UniswapV3Pool | null>(this.uniswapV3PoolAddresses.map(p => [p, null]))
      const result = await queryUniswapV3PoolsByAddresses(this.uniswapV3PoolAddresses)
      result.pools.forEach(p => {
        poolMap.set(p.id, p)
      })
      const pools = _.uniqBy(Array.from(poolMap.values()).filter(p => p !== null) as UniswapV3Pool[], 'id')
      const uniswapV3PoolsWithFeeAmount: ExtendedPool[] = []
      pools.forEach(p => {
        const pool = p.toPoolWithFeeAmount(this.chainId)
        if (pool && (p.liquidity as BigNumber).gt(0)) {
          uniswapV3PoolsWithFeeAmount.push(pool)
        }
      })
      const uniswapV3OracleRoutes = uniswapV3PoolsWithFeeAmount.length <= 0 ? [] : computeAllRoutes(this.uniswapTokenIn, this.uniswapTokenOut, uniswapV3PoolsWithFeeAmount, this.chainId)
      this.bestRouteInfo = await this.calcBestRoute(uniswapV3OracleRoutes)
    } catch (e) {
      console.warn('load uniswap v3 pools by token', e)
    } finally {
      this.loadingRoute = false
    }
  }

  created() {
    this.reset()
    this.resetFormFields()
  }

  resetFormFields() {
    const form = this.$refs.form as ElForm
    if (form) {
      form.resetFields()
    }
  }

  onNextEvent() {
    if (!this.formValidatorIsPass || this.nextButtonIsDisabled) {
      return
    }
    this.$emit('confirm', {
      selectedType: 'uniswapV3',
      underlyingSymbol: this.underlyingSymbol,
      oracleRouterPath: this.selectedOracleRoute,
      quoteSymbol: this.tokenOutInfo.symbol,
    })
  }

  changeRoute(routeInfo: { route: Route<Currency, Currency>, price: BigNumber }) {
    this.bestRouteInfo.bestRoute = routeInfo.route
    this.bestRouteInfo.price = routeInfo.price
  }

  reset() {
    this.underlyingSymbol = ''
    this.selectedUnderlying = null
    this.bestRouteInfo = { bestRoute: null, price: null }
  }

  @Watch('selectedUnderlying')
  private onSelectedUnderlyingChange() {
    this.bestRouteInfo = { bestRoute: null, price: null }
    if (!this.selectedUnderlying) {
      this.underlyingSymbol = ''
      return
    }
    this.underlyingSymbol = this.selectedUnderlying.symbol
  }
}
</script>

<style lang="scss" scoped>

.uniswap-oracle-selector {
  .svg-icon {
    height: 24px;
    width: 24px;
    vertical-align: -7px;
  }

  .control-item {
    width: 450px;

    &.underlying {
      cursor: pointer;
      padding: 0 10px;
      color: var(--mc-text-color-white);
      height: 48px;
      background: var(--mc-background-color-dark);
      font-size: 16px;

      &::placeholder {
        color: var(--mc-text-color);
      }
    }
  }

  .iconfont {
    margin-left: 4px;
  }

  .iconfont:hover {
    color: var(--mc-color-primary);
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

      &.index-price-twap {
        margin-top: 10px;
      }
    }
  }

  .el-dialog {
    .is-medium {
      height: 557px;
    }
  }
}

.routes-table-wrap {
  min-height: 30px;

  ::v-deep .tip-line {
    margin-left: 125px;
    margin-top: 30px;
    font-size: 14px;
    font-weight: 400;
    margin-right: 100px;

    span {
      a {
        color: var(--mc-color-primary) !important;
      }
    }
  }
}

.registered-show-routes-tables {

  ::v-deep {
    .el-radio__label {
      display: none;
    }
  }

  .mc-data-table {
    width: 700px;
    margin: auto;

    tr {
      font-size: 14px;
      font-weight: 400;
    }

    th:nth-of-type(2) {
      text-align: center;
      padding-left: 18px;
    }

    td:nth-of-type(2) {
      text-align: center;
      padding-left: 10px;
    }

    td {
      color: var(--mc-text-color-white);
    }
  }

  .uniswap-oracle .custom-oracle-btn {
    height: 24px;
    font-size: 12px;
  }

  .oracle-item-split {
    color: var(--mc-icon-color-light);
  }
}

</style>

<style lang="scss" scoped>
.el-form {
  .el-form-item {

    &.button-container {
      margin-top: 30px;
    }

    ::v-deep {
      .el-form-item__label {
        width: 385px;
        padding-right: 20px;
        font-size: 14px;
        font-weight: 400;
        color: var(--mc-text-color);

        .iconfont {
          padding-left: 4px;
        }
      }
    }

    .el-radio__label {
      font-size: 14px;
      font-weight: 400;
      color: var(--mc-text-color);
    }

    .el-input {
      font-size: 16px;
      font-weight: 400;
    }
  }
}
</style>
