import { Component, Watch, Mixins, Prop } from 'vue-property-decorator'
import { State } from 'vuex-class'
import { PerpetualProperty } from '@/type'
import { SelectedPerpetualMixin, ErrorHandlerMixin } from '@/mixins'
import { queryInitRecentTrades, queryUpdateRecentTrades } from '@/api/recentTrade'
import { toBigNumber, getTimestamp } from '@/utils'
import { MAX_RECENT_TRADE_AMOUNT, MAX_RECENT_TRADE_BEFORE_TIMESTAMP } from '@/config/api'

@Component
export default class RecentTradeMixin extends Mixins(SelectedPerpetualMixin, ErrorHandlerMixin) {
  @State('latestBlockNumber') latestBlockNumber !: number | null
  @Prop({ default: () => null }) perpetualProperty!: PerpetualProperty | null
  protected trades: any[] = []
  private loading: boolean = false
  private maxRecentTradesCount = MAX_RECENT_TRADE_AMOUNT
  private toBigNumber = toBigNumber
  private loadTimer = 0
  private graphSyncPerpetualID = ''
  private graphSyncBlockNumber = 0

  get priceUnit() {
    return this.selectedPerpetualProperty?.priceSymbol || '--'
  }
  get amountUnit() {
    return this.selectedPerpetualProperty?.underlyingAssetSymbol || '--'
  }

  get isInverse() {
    return !!this.selectedPerpetualProperty?.isInverse
  }

  get priceFormatDecimals() {
    return this.selectedPerpetualProperty?.priceFormatDecimals || 0
  }

  get contractFormatDecimals() {
    return this.selectedPerpetualProperty?.contractFormatDecimals || 0
  }

  async mounted() {
    this.loadTimer = window.setInterval(() => {
      this.loadTrades()
    }, 10000)
  }

  destroyed() {
    window.clearInterval(this.loadTimer)
    this.loading = false
  }

  @Watch('selectedPerpetualID', { immediate: true })
  @Watch('latestBlockNumber')
  async loadTrades() {
    if (!this.selectedPerpetualID) {
      return
    }
    const perpetualID = this.selectedPerpetualID
    if (!this.graphSyncBlockNumber || this.graphSyncPerpetualID != perpetualID) {
      // first init recent trade table
      this.loading = true
      const currentTimestamp = getTimestamp()
      const before24hTimestamp = currentTimestamp - MAX_RECENT_TRADE_BEFORE_TIMESTAMP
      await this.callGraphApiFunc(async () => {
        const data = await queryInitRecentTrades(perpetualID, this.maxRecentTradesCount, before24hTimestamp)
        this.trades = data.recentTrades
        if (this.trades.length > 0) {
          this.graphSyncBlockNumber = Number(this.trades[0].blockNumber)
        }
        this.graphSyncPerpetualID = perpetualID
      })
      this.loading = false
    } else {
      // update recent trade table
      await this.callGraphApiFunc(async () => {
        const data = await queryUpdateRecentTrades(perpetualID, this.graphSyncBlockNumber)
        while (this.trades.length > this.maxRecentTradesCount) {
          this.trades.pop()
        }
        if (data.recentTrades.length > 0) {
          this.graphSyncBlockNumber = Number(data.recentTrades[0].blockNumber)
          this.trades.unshift(...data.recentTrades)
        }
      })
    }
  }

}
