import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { OrderDirectoryItem } from '@/store/order'
import { PerpetualProperty } from '@/type'
import { _0, _1, _2, LiquidityPoolStorage } from '@mcdex/mai3.js'
import { PerpetualStorage } from '@mcdex/mai3.js/dist/types'
import BigNumber from 'bignumber.js'
import { alignPriceToGroup, AMMDepthData, getAMMDepth } from '@/utils'
import { SUPPORTED_NETWORK_ID } from '@/constants'
import { currentChainConfig } from '@/config/chain'

const DefaultGroupLevel: {[id: number]: {
  [symbol: string]: number
}} = {
  [SUPPORTED_NETWORK_ID.BSC]: {
    '00015': 0.001,
    '00005': 0.1,   // eth
    '00002': 0.1,   // eth inverse
  },
  [SUPPORTED_NETWORK_ID.ARB]: {
    '00001': 0.1, // eth
    '00003': 0.1, // eth inverse
  }
}

@Component
export class AMMDepthMixin extends Vue {
  @Prop({ default: () => [] }) activeOrders!: OrderDirectoryItem[]
  @Prop({ required: true, default: () => null }) perpetualProperty!: PerpetualProperty | null
  @Prop({ required: true, default: () => null }) liquidityPool!: LiquidityPoolStorage | null
  @Prop({ required: true, default: () => null }) perpetualStorage!: PerpetualStorage | null

  protected selectedGroup: number | null = null
  protected count: number = 0

  get isInverse() {
    return !!this.perpetualProperty?.isInverse
  }

  get priceUnit() {
    return this.perpetualProperty?.priceSymbol || '--'
  }

  get amountUnit() {
    return this.perpetualProperty?.contractSymbol || '--'
  }

  get indexPrice() {
    return this.perpetualStorage?.indexPrice || null
  }

  get priceFormatDecimals() {
    let group = this.selectedGroup || 0
    if (group <= 0) {
      return 0
    }
    return group >= 1 ? 0 : Math.ceil(Math.log10(1.0 / group))
  }

  get contractFormatDecimals() {
    return this.perpetualProperty?.underlyingAssetFormatDecimals || 0
  }

  get underlyingAssetSymbol() {
    return this.perpetualProperty?.underlyingAssetSymbol || ''
  }

  get activeOrderPrices(): { buy: { [price: string]: true }, sell: { [price: string]: true } } {
    const prices = { buy: {}, sell: {} }
    this.activeOrders.forEach(item => {
      if (!this.perpetualProperty || !this.selectedGroup) {
        return
      }
      if (item.liquidityPoolAddress !== this.perpetualProperty.liquidityPoolAddress
        || item.perpetualIndex !== this.perpetualProperty.perpetualIndex) {
        return
      }
      let price = item.price as BigNumber
      let isBuy = (item.amount as BigNumber).gt(_0)
      if (this.perpetualProperty.isInverse) {
        price = _1.div(price)
        isBuy = !isBuy
      }
      const group = new BigNumber(this.selectedGroup)
      price = alignPriceToGroup(price, group, isBuy)
      if (isBuy) {
        this.$set(prices.buy, price.toFixed(), true)
      } else {
        this.$set(prices.sell, price.toFixed(), true)
      }
    })
    return prices
  }

  get asks(): Array<AMMDepthData> {
    if (!this.liquidityPool || !this.perpetualProperty || !this.selectedGroup) {
      return []
    }
    try {
      return getAMMDepth(
        this.liquidityPool, this.perpetualProperty.perpetualIndex,
        this.isInverse, true, new BigNumber(this.selectedGroup), this.count)
    } catch (e) {
      console.warn('[AMMDepth]:', e)
      return []
    }
  }

  get bids(): Array<AMMDepthData> {
    if (!this.liquidityPool || !this.perpetualProperty || !this.selectedGroup) {
      return []
    }
    try {
      return getAMMDepth(
        this.liquidityPool, this.perpetualProperty.perpetualIndex,
        this.isInverse, false, new BigNumber(this.selectedGroup), this.count)
    } catch (e) {
      console.warn('[AMMDepth]:', e)
      return []
    }
  }

  get visibleAsks(): Array<AMMDepthData> {
    return this.asks.slice(0, this.count)
  }

  get visibleBids(): Array<AMMDepthData> {
    return this.bids.slice(0, this.count)
  }

  get askTotals(): Array<BigNumber> {
    return this.visibleAsks.map((x) => {
      return x.total.dp(this.contractFormatDecimals, BigNumber.ROUND_UP)
    })
  }

  get bidTotals(): Array<BigNumber> {
    return this.visibleBids.map((x) => {
      return x.total.dp(this.contractFormatDecimals, BigNumber.ROUND_UP)
    })
  }

  get maxTotal() {
    let maxAskTotal = this.askTotals.length > 0 ? this.askTotals[this.askTotals.length - 1] : _0
    let maxBidTotal = this.bidTotals.length > 0 ? this.bidTotals[this.bidTotals.length - 1] : _0
    return maxAskTotal.gt(maxBidTotal) ? maxAskTotal : maxBidTotal
  }

  get groupOption(): number[] {
    let result: number[] = []
    if (!this.perpetualProperty) {
      return result
    }
    // based on price decimals
    const priceDecimals = this.perpetualProperty.isInverse ?
      this.perpetualProperty.decimals.inversePriceFormatDecimals :
      this.perpetualProperty.decimals.priceFormatDecimals
    let k = new BigNumber('0.1')
    k = k.pow(priceDecimals)
    for (let i = 0; i <= 4; i++) {
      result.push(k.toNumber())
      k = k.times(10)
    }
    return result
  }

  get selectOptions() {
    return this.groupOption.map(item => {
      return {
        label: item,
        value: item,
      }
    })
  }

  get spreadLines() {
    return [{ key: 'spread', price: this.spread, amount: this.spreadPercent, total: _0 }]
  }

  get spread() {
    if (this.bids.length <= 0 || this.asks.length <= 0) {
      return _0
    }
    const bestAsk = this.asks[0].price
    const bestBid = this.bids[0].price
    const spread = bestAsk.minus(bestBid)
    return spread
  }

  get spreadPercent() {
    if (this.bids.length <= 0 || this.asks.length <= 0) {
      return _0
    }
    const bestAsk = this.asks[0].price
    const bestBid = this.bids[0].price
    const spread = bestAsk.minus(bestBid)
    const mid = bestAsk.plus(bestBid).div(_2)
    if (mid.isZero()) {
      return _0
    }
    return spread.div(mid).times(100).dp(2, BigNumber.ROUND_HALF_UP)
  }

  @Watch('perpetualProperty', { immediate: true, deep: true })
  private clearSelectedGroup(newProperty: PerpetualProperty | null, oldProperty: PerpetualProperty | null) {
    if (
      newProperty?.liquidityPoolAddress !== oldProperty?.liquidityPoolAddress ||
      newProperty?.perpetualIndex !== oldProperty?.perpetualIndex ||
      newProperty?.isInverse !== oldProperty?.isInverse
    ) {
      this.selectedGroup = null
      this.autoSetDefaultGroup()
    }
  }

  @Watch('perpetualStorage', { immediate: true, deep: true })
  private autoSetDefaultGroup() {
    if (!this.perpetualStorage || !this.perpetualProperty || this.selectedGroup !== null) {
      return
    }
    // default white list
    const currentChainDefaultGroup = DefaultGroupLevel[currentChainConfig.chainID]
    if (currentChainDefaultGroup && currentChainDefaultGroup[this.perpetualProperty.symbolStr]) {
      this.selectedGroup = currentChainDefaultGroup[this.perpetualProperty.symbolStr]
      return
    }

    // set the default group near the halfSpread
    let halfSpread = this.perpetualStorage.halfSpread.value
    if (halfSpread.isZero()) {
      halfSpread = new BigNumber('0.0001')
    }
    const priceDecimals = this.perpetualProperty.isInverse ?
      this.perpetualProperty.decimals.inversePriceFormatDecimals :
      this.perpetualProperty.decimals.priceFormatDecimals
    let reference = this.isInverse ?
      new BigNumber(1).div(this.perpetualStorage.markPrice) :
      this.perpetualStorage.markPrice
    reference = reference.times(halfSpread).dp(priceDecimals)
    // get the largest group where group <= reference
    let groups = this.groupOption.filter(g => reference.gt(g))
    let auto: number
    if (groups.length > 0) {
      auto = groups[groups.length - 1]
    } else if (this.groupOption.length > 0) {
      auto = this.groupOption[0]
    } else {
      auto = 1
    }
    this.selectedGroup = auto
  }
}
