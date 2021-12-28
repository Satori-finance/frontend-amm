import { Component, Mixins, Watch } from 'vue-property-decorator'
import BigNumber from 'bignumber.js'
import { namespace } from 'vuex-class'
import { ethers } from 'ethers'
import {
  AccountStorageDirectoryItem,
  Directory,
  MarginAccount,
  OrderConfirmParams,
  PerpetualCombinedState,
} from '@/type'
import { getPerpetualFromID, isDangerPerpetual, isLongPosition } from '@/utils/perpetual'
import { _0, _1, AccountDetails, computeAccount, InsufficientLiquidityError, PerpetualState } from '@mcdex/mai3.js'
import { ErrorHandlerMixin, BuildMarketTradeParams, TradeMixin } from '@/mixins'
import { ACCOUNT_EVENT, VUE_EVENT_BUS } from '@/event'
import { getReferralAddress, toBigNumber } from '@/utils'
import { getMarginAccountKey } from '@/store/account'
import { ROUTE } from '@/router'
import * as _ from 'lodash'
import { MarketTradeStrategy, ORDER_SIDE, ORDER_TYPE, TradeResult } from '@/ts'
import { currentChainConfig } from '@/config/chain'

const wallet = namespace('wallet')
const account = namespace('account')
const activePerpetuals = namespace('activePerpetuals')

interface StoreInfo {
  perpetualStore: PerpetualCombinedState | null
  accountStore: AccountDetails | null
  perpetualID: string
}

interface TableData {
  symbol: number
  symbolStr: string
  name: string
  isInverse: boolean
  perpetualID: string
  size: BigNumber
  positionValue: BigNumber
  margin: BigNumber
  liquidationPrice: BigNumber
  roe: BigNumber
  pnl: BigNumber
  fundingRevenue: BigNumber
  markPrice: BigNumber
  entryPrice: BigNumber
  underlyingSymbol: string
  underlyingFormatDecimals: number
  collateralSymbol: string
  collateralAddress: string
  contractSymbol: string
  priceSymbol: string
  priceFormatDecimals: number
  collateralFormatDecimals: number
  isEmergency: boolean
  isCleared: boolean
  isMarketClose: boolean
  marginRatio: BigNumber
  targetLeverage: BigNumber
  isMarginSafe: boolean
  selectedPerpetualAmmIsSafe: boolean
  selectedPerpetualOracleIsTerminated: boolean
}

type PositionItem = { perpetualID: string } & AccountStorageDirectoryItem

@Component
export default class PositionsMixin extends Mixins(ErrorHandlerMixin, TradeMixin) {
  @wallet.Getter('address') userAddress!: string | null
  @wallet.Getter('signer') signer!: ethers.Signer | null
  @account.Getter('accountStorageFunc') accountStorageFunc!: (perpetualID: string) => AccountStorageDirectoryItem | null
  @account.Getter('accountStorageWithPositions') accountStorageWithPositions!: Array<PositionItem>
  @account.State('marginAccounts') marginAccounts!: Directory<MarginAccount>
  @activePerpetuals.State('selectedPerpetualID') selectedPerpetualID!: string | null
  @account.State('loadingUserData') loading!: boolean

  BigNumber = BigNumber

  protected showCloseDialog = false
  protected closeData: any = null
  protected selectedIsInsufficientLiquidity: boolean = false
  protected isClosingPosition: boolean = false
  protected isDangerPerpetual = isDangerPerpetual
  protected closeDefaultSlippageTolerance = '3' // 3%

  get positionStoreInfos(): Array<StoreInfo> {
    if (!this.userAddress) {
      return []
    }
    return this.accountStorageWithPositions.map(item => {
      const perpetualInfo = this.getPerpetualFunc(item.perpetualID)
      const { liquidityPoolAddress, perpetualIndex } = getPerpetualFromID(item.perpetualID)
      const liquidityPool = this.getLiquidityPoolFunc(liquidityPoolAddress)
      if (!perpetualInfo || !liquidityPool) {
        return {
          perpetualStore: null,
          accountStore: null,
          perpetualID: item.perpetualID,
        }
      }
      const marginAccountKey = getMarginAccountKey(this.userAddress as string, item.perpetualID)
      const marginAccount = this.marginAccounts.get(marginAccountKey)
      const entryValue = marginAccount && toBigNumber(marginAccount.position).isEqualTo(item.positionAmount) ? toBigNumber(marginAccount.entryValue) : null
      const entryFunding = marginAccount && toBigNumber(marginAccount.position).isEqualTo(item.positionAmount) ? toBigNumber(marginAccount.entryFunding) : null
      const accountDetail = computeAccount(liquidityPool.liquidityPoolStorage, perpetualIndex, {
        ...item,
        entryValue,
        entryFunding,
      })
      return {
        perpetualStore: perpetualInfo,
        accountStore: accountDetail,
        perpetualID: item.perpetualID,
      }
    })
  }


  get noData() {
    return this.tableBody.length <= 0
  }

  get tableBody(): TableData[] {
    let result: any = []

    this.positionStoreInfos.forEach((item, index) => {
      const perpetual = item.perpetualStore
      const account = item.accountStore
      if (account) {
        result.push({
          symbol: perpetual?.perpetualProperty.symbol,
          symbolStr: perpetual?.perpetualProperty.symbolStr,
          name: perpetual?.perpetualProperty.name,
          isInverse: perpetual?.perpetualProperty.isInverse,
          perpetualID: item.perpetualID,
          size: account.accountStorage.positionAmount,
          positionValue: account.accountComputed.positionValue,
          margin: account.accountComputed.marginBalance,
          liquidationPrice: account.accountComputed.liquidationPrice,
          roe: account.accountComputed.roe,
          pnl: account.accountComputed.pnl2,
          fundingRevenue: account.accountComputed.fundingPNL,
          markPrice: perpetual?.perpetualStorage.markPrice,
          entryPrice: account.accountComputed.entryPrice,
          underlyingSymbol: perpetual?.perpetualStorage.underlyingSymbol,
          underlyingFormatDecimals: perpetual?.perpetualProperty.underlyingAssetFormatDecimals,
          collateralSymbol: perpetual?.perpetualProperty.collateralTokenSymbol,
          collateralAddress: perpetual?.liquidityPoolStorage.collateral || '',
          contractSymbol: perpetual?.perpetualProperty.contractSymbol || '',
          priceSymbol: perpetual?.perpetualProperty.priceSymbol || '',
          priceFormatDecimals: perpetual?.perpetualProperty.priceFormatDecimals,
          collateralFormatDecimals: perpetual?.perpetualProperty.collateralFormatDecimals,
          selectedPerpetualAmmIsSafe: perpetual?.liquidityPoolStorage.isAMMMaintenanceSafe,
          selectedPerpetualOracleIsTerminated: perpetual?.perpetualStorage.isTerminated,
          isEmergency: perpetual?.perpetualStorage.state === PerpetualState.EMERGENCY,
          isCleared: perpetual?.perpetualStorage.state === PerpetualState.CLEARED,
          isMarketClose: perpetual?.perpetualStorage.isMarketClosed || false,
          marginRatio: account.accountComputed.marginRatio,
          targetLeverage: account.accountComputed.leverage,
          isMarginSafe: account.accountComputed.isMarginSafe,
        })
      }
    })

    return _.sortBy(result, ['symbol', 'name'])
  }

  showChangeMargin(item: any, operateType = 'deposit') {
    VUE_EVENT_BUS.emit(ACCOUNT_EVENT.CHANGE_MARGIN, { perpetualID: item.perpetualID, type: operateType })
  }

  switchContract(item: any) {
    if (this.$route.name === ROUTE.TRADE_MAIN && this.$route.params.symbol === item.symbolStr) {
      return
    }
    this.$router.push({ name: ROUTE.TRADE_MAIN, params: { symbol: item.symbolStr } })
  }

  resetCloseData() {
    this.resetForm()
    this.tradingPerpetualID = null
    this.closeData = null
    this.refreshPerpetualAndAccount = false
    this.selectedIsInsufficientLiquidity = false
  }

  get closeOrderConfirmParams(): OrderConfirmParams {
    let tradeResult: TradeResult | null = null
    try {
      tradeResult = this.tradeStrategy.getTradeResult(this.tradeStrategyContext)
    } catch (e) {
      // ignore error
    }

    return {
      orderType: ORDER_TYPE.MarketOrder,
      orderSide: this.tradeForm.orderSide,
      tradeSymbol: this.closeData?.contractSymbol || '',
      priceUnit: this.closeData?.priceSymbol || '',
      price: toBigNumber(this.tradeForm.price),
      priceImpact: this.tradePriceImpact,
      priceDecimals: this.closeData?.priceFormatDecimals || 0,
      amount: toBigNumber(this.tradeForm.amount),
      amountDecimals: this.closeData?.underlyingFormatDecimals || 0,
      marginRatio: tradeResult ? tradeResult.trader.accountComputed.marginRatio :
        this.tradingAccountDetails?.accountComputed.marginRatio || _0,
      newTotalLeverage: tradeResult ? tradeResult.trader.accountComputed.leverage : this.tradingAccountDetails?.accountComputed.leverage || _0,
      liqPrice: tradeResult ? tradeResult.trader.accountComputed.liquidationPrice :
        this.tradingAccountDetails?.accountComputed.liquidationPrice || _0,
      isInverse: this.closeData?.isInverse || false,
      isClosePosition: this.isClosePosition,
      closePositionPnl: this.closePositionPnl,
      collateralSymbol: this.closeData?.collateralSymbol || '',
      underlyingSymbol: this.closeData?.underlyingSymbol || '',
      collateralDecimals: this.closeData?.collateralFormatDecimals || 0,
      underlyingDecimals: this.closeData?.underlyingFormatDecimals || 0,
      maintenanceMargin: this.afterTradingMaintenanceMargin,
      marginBalance: this.afterTradingMarginBalance,
      maxAvailableAmount: this.maxAvailableAmount,
    }
  }

  initialClosePositionFormData() {
    if (!this.closeData) {
      return
    }
    this.selectedIsInsufficientLiquidity = false
    this.tradeForm.isCloseOnly = true
    try {
      // get order side
      const positionAmount = this.tradeStrategyContext.trader?.accountStorage.positionAmount
      if (!positionAmount || positionAmount.isZero()) { // not position or account details is null
        return
      }
      if (positionAmount.lt(0)) {
        this.tradeForm.orderSide = this.closeData.isInverse ? ORDER_SIDE.Sell : ORDER_SIDE.Buy
      }
      if (positionAmount.gt(0)) {
        this.tradeForm.orderSide = this.closeData.isInverse ? ORDER_SIDE.Buy : ORDER_SIDE.Sell
      }
      this.tradeForm.amount = positionAmount.abs().toFixed()
    } catch (e) {
      console.warn('position list, initial close position form data: ', e)
    }
  }

  @Watch('tradeStrategyContext', { immediate: true })
  onTradeStrategyContextChanged() {
    try {
      const strategyResult = this.tradeStrategy.getValueByAmount(this.tradeStrategyContext)
      if (!strategyResult || !strategyResult.newPrice) {
        return
      }
      this.selectedIsInsufficientLiquidity = false
      this.tradeForm.price = strategyResult.newPrice.toFixed(this.closeData?.priceFormatDecimals || 0,
        this.priceFormatRound)
    } catch (err) {
      if (err instanceof InsufficientLiquidityError) {
        this.selectedIsInsufficientLiquidity = true
      }
      this.tradeForm.price = this.closeData.markPrice
    }
  }

  @Watch('accountStorageWithPositions')
  onPositionsChange(newVal: PositionItem[], oldVal: PositionItem[]) {
    const newPositions = _.orderBy(newVal, 'perpetualID')
    const oldPositions = _.orderBy(oldVal, 'perpetualID')
    const diffPositions = _.differenceWith<PositionItem, PositionItem>(newPositions, oldPositions, (a, b) => {
      return a.perpetualID === b.perpetualID && a.positionAmount.isEqualTo(b.positionAmount)
    })
    if (newVal.length !== oldVal.length || diffPositions.length) {
      this.$emit('change')
      VUE_EVENT_BUS.emit(ACCOUNT_EVENT.POSITION_CHANGED)
    }
  }

  async onClosePositionEvent() {
    this.isClosingPosition = true
    try {
      this.tradeState = ''
      if (!this.contractAmount || !this.tradeAccountAddress ||
        this.tradeAccountAddress === '' || !this.closeData || !this.tradingLiquidityPoolInfo || !this.tradingLiquidityPool) {
        return
      }
      let tradePrice = this.convertPriceFromSlippage(
        toBigNumber(this.tradeForm.price),
        toBigNumber(this.setSlippageTolerance),
        this.closeData.isInverse || false,
      )
      let noticePrice = () => {
        let priceLimit = toBigNumber(this.tradeForm.price)
        if (this.closeData.isInverse) {
          priceLimit = _1.div(priceLimit)
        }
        return priceLimit.toFixed(this.closeData.collateralFormatDecimals)
      }
      const tradeParams: BuildMarketTradeParams = {
        accountAddress: this.tradeAccountAddress,
        limitPrice: tradePrice.toFixed(),
        amount: this.contractAmount,
        expire: currentChainConfig.marketOrderExpireTime,
        symbol: this.closeData ? `${this.closeData.symbolStr} ${this.closeData.name}` : '',
        referrer: getReferralAddress(this.tradeAccountAddress || ''),
        noticeAmount: this.tradeForm.amount,
        noticePrice: noticePrice(),
        isCloseOnly: true,
        liquidityPoolAddress: this.tradingLiquidityPoolInfo.liquidityPoolAddress,
        perpetualIndex: this.tradingLiquidityPoolInfo.perpetualIndex,
      }
      await this.callChainFunc(async () => {
        if (!this.tradingLiquidityPool) {
          return
        }
        await this.onMarketTrade(tradeParams, this.tradingLiquidityPool.liquidityPoolStorage, true)
      }, undefined, true)
    } catch (e) {
      console.warn('position list, call chain close position: ', e)
      throw e
    } finally {
      this.isClosingPosition = false
      // end clear
      if (this.tradeState === 'success') {
        this.resetCloseData()
      }
    }
  }

  protected async closePosition(item: PositionItem) {
    if (this.isWrongNetwork) {
      return
    }
    this.tradeStrategy = new MarketTradeStrategy()
    this.tradingPerpetualID = item.perpetualID
    this.closeData = item
    this.refreshPerpetualAndAccount = true
    this.setSlippageTolerance = this.closeDefaultSlippageTolerance
    this.initialClosePositionFormData()
    this.onTradeStrategyContextChanged()
    this.showCloseDialog = true
  }

  protected getSideClass(item: any) {
    return isLongPosition(item.size, item.isInverse) ? ['is-long'] : ['is-short']
  }

  protected getMarginRatioClass(item: any) {
    if (item.isEmergency || item.isCleared || item.size?.eq(0) || !item.selectedPerpetualAmmIsSafe || item.selectedPerpetualOracleIsTerminated) {
      return 'dim-color'
    }
    const marginRatio: number = item.marginRatio.toNumber()
    if (marginRatio < 1 / 3) {
      return marginRatio === 0 ? 'dim-color' : 'green-color'
    } else if (marginRatio > 2 / 3) {
      return 'red-color'
    } else {
      return 'yellow-color'
    }
  }

  protected getMarginRatioIcon(item: any) {
    const marginRatio: number = item.marginRatio.toNumber()
    if (marginRatio < 1 / 3) {
      return '#icon-dash-green'
    } else if (marginRatio > 2 / 3) {
      return '#icon-dash-red'
    } else {
      return '#icon-dash-yellow'
    }
  }

  protected setMaxAvailableTradeAmount() {
    if (!this.maxAvailableAmount) {
      this.tradeForm.amount = '0'
    } else {
      this.tradeForm.amount = this.maxAvailableAmount.toFixed()
      this.onTradeStrategyContextChanged()
    }
  }

  onClosedOrderConfirmDialog() {
    if (!this.isClosingPosition) {
      this.resetCloseData()
    }
    this.refreshPerpetualAndAccount = false
  }
}
