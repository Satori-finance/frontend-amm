import { Component, Watch, Mixins } from 'vue-property-decorator'
import { PNNumber, McLoading } from '@/components'
import { queryTrades } from '@/api/trade'
import { namespace } from 'vuex-class'
import {
  PerpetualProperty,
  Trade,
  PerpetualCombinedState,
  Directory,
  isMCError,
  LiquidityPoolDirectoryItem,
} from '@/type'
import { getPerpetualFromID, isLongPosition } from '@/utils/perpetual'
import { ethers } from 'ethers'
import moment from 'moment'
import { formatPrice, toBigNumber } from '@/utils/bignumberUtil'
import { ErrorHandlerMixin, processStoreErrors } from '@/mixins'
import { ACCOUNT_EVENT, PLACE_ORDER_EVENT, VUE_EVENT_BUS } from '@/event'
import { ROUTE } from '@/router'
import { ExportCsv, momentFormatter } from '@/utils'
import BigNumber from 'bignumber.js'
import { _0 } from '@mcdex/mai3.js'
import debounceAsync from '@seregpie/debounce-async'
import _ from 'lodash'

const wallet = namespace('wallet')
const perpetual = namespace('perpetual')

@Component({
  components: {
    PNNumber,
    McLoading,
  },
})
export default class TradeHistoryMixin extends Mixins(ErrorHandlerMixin) {
  @wallet.Getter('address') address!: string | null
  @wallet.Getter('signer') signer!: ethers.Signer | null
  @perpetual.Getter('getPerpetualFunc') getPerpetualFunc!: (perpetualID: string) => PerpetualCombinedState | null
  @perpetual.Action('updatePerpetual') updatePerpetual!: (perpetualID: string) => Promise<void>
  @perpetual.Action('updateLiquidityPool') updateLiquidityPool!: (poolAddress: string) => Promise<void>
  @perpetual.State('liquidityPool') liquidityPool!: Directory<LiquidityPoolDirectoryItem>

  protected trades: Trade[] = []
  protected loading = false
  protected reloading = false
  protected noMore = false
  protected pageSize = 30
  protected debounceGetTrades = debounceAsync(this.getTrades, 100)
  protected debounceLoad = debounceAsync(this.load, 100)

  protected filters: { contract: string, side: string, type: string, startDate: Date | null, endDate: Date | null } = {
    contract: '',
    side: '',
    type: '',
    startDate: null,
    endDate: null,
  }

  formatPrice = formatPrice

  get tableBody(): Array<Trade & { perpetualProperty: PerpetualProperty }> {
    const result: any = []
    this.trades.forEach(item => {
      result.push(this.convertTrade(item))
    })
    return _.orderBy(
      result,
      [
        'blockNumber',
        'logIndex',
        'isClose'
      ],
      ['desc', 'desc', 'asc']
    )
  }

  get noData() {
    return this.tableBody.length <= 0
  }

  mounted() {
    VUE_EVENT_BUS.on(ACCOUNT_EVENT.POSITION_CHANGED, this.reload)
    VUE_EVENT_BUS.on(PLACE_ORDER_EVENT.OrderFilled, this.reload)
  }

  destroyed() {
    VUE_EVENT_BUS.off(ACCOUNT_EVENT.POSITION_CHANGED, this.reload)
    VUE_EVENT_BUS.off(PLACE_ORDER_EVENT.OrderFilled, this.reload)
  }

  protected getType(trade: Trade) {
    if (trade.type === 0) {
      if (trade.isClose) {
        return this.$t('tradeType.close')
      } else {
        return this.$t('tradeType.open')
      }
    } else {
      return this.$t('tradeType.liquidate')
    }
  }

  protected async getTrades() {
    await this.callGraphApiFunc(async () => {
      if (this.noMore || !this.address) {
        return null
      }
      this.loading = true
      try {
        const result = await queryTrades({
          userAddress: this.address,
          startTime: this.filters.startDate ? moment(this.filters.startDate).unix().toString() : undefined,
          endTime: this.filters.endDate ? moment(this.filters.endDate).add(1, 'day').unix().toString() : undefined,
          pageSize: this.pageSize,
          offset: this.trades.length,
          perpetualID: this.filters.contract,
        })
        this.noMore = result.trades.length <= 0
        this.trades = Array<Trade>().concat(this.trades, result.trades)
      } catch (e) {
        console.error(e)
      } finally {
        this.loading = false
      }
    })
  }

  protected convertTrade(trade: Trade): Trade & { perpetualProperty: PerpetualProperty } {
    const perpetual = this.getPerpetualFunc(trade.perpetualID as string)
    if (!perpetual) {
      this.updatePerpetual(trade.perpetualID as string)
    }
    return Object.assign({
      perpetualProperty: perpetual?.perpetualProperty || PerpetualProperty.emptyInstance(),
      underlyingSymbol: perpetual?.perpetualStorage.underlyingSymbol,
      collateralSymbol: perpetual?.perpetualProperty.collateralTokenSymbol
    }, trade)
  }

  protected async load() {
    if (this.loading) {
      return
    }
    await this.debounceGetTrades()
  }

  @Watch('address')
  protected async reload() {
    if (this.reloading) {
      return
    }
    this.trades = []
    this.noMore = false
    this.reloading = true
    await this.debounceLoad()
    this.reloading = false
  }

  @Watch('filters', { deep: true })
  protected onFilterChange() {
    this.reload()
  }

  protected getSideClass(item: Trade & { perpetualProperty: PerpetualProperty }) {
    if (item.isClose) {
      return !isLongPosition(item.amount as BigNumber, item.perpetualProperty.isInverse) ? ['is-long'] : ['is-short']
    } else {
      return isLongPosition(item.amount as BigNumber, item.perpetualProperty.isInverse) ? ['is-long'] : ['is-short']
    }
  }

  switchContract(item: Trade & { perpetualProperty: PerpetualProperty }) {
    if (this.$route.name === ROUTE.TRADE_MAIN && this.$route.params.symbol === item.perpetualProperty.symbolStr) {
      return
    }
    this.$router.push({ name: ROUTE.TRADE_MAIN, params: { symbol: item.perpetualProperty.symbolStr } })
  }

  async exportToCSV() {
    if (!this.address) {
      return
    }
    try {
      const result = await queryTrades({
        userAddress: this.address,
        startTime: this.filters.startDate ? moment(this.filters.startDate).unix().toString() : undefined,
        endTime: this.filters.endDate ? moment(this.filters.endDate).add(1, 'day').unix().toString() : undefined,
        pageSize: 1000,
        offset: 0,
        perpetualID: this.filters.contract,
      })
      const needUpdatePools = result.trades
        .filter(trade => {
          const { liquidityPoolAddress } = getPerpetualFromID(trade.perpetualID!.toLowerCase())
          return !this.liquidityPool.has(liquidityPoolAddress)
        })
        .map(trade => {
          const { liquidityPoolAddress } = getPerpetualFromID(trade.perpetualID!.toLowerCase())
          return liquidityPoolAddress
        })

      await Promise.all(needUpdatePools.map(async (poolAddress) => {
        await this.updateLiquidityPool(poolAddress)
      }))

      const data = result.trades.map((item) => {
        const perpetualProperty = this.getPerpetualFunc(item.perpetualID!.toLowerCase())?.perpetualProperty
        return {
          time: `"${momentFormatter(moment.unix(Number(item.timestamp)).local(), 'llll')}"`,
          contract: perpetualProperty ? `${perpetualProperty.symbolStr} ${perpetualProperty.name}` : '',
          side: `${(item.amount as BigNumber).gt(_0) ? this.$t('base.long') : this.$t('base.short')} ${perpetualProperty ? perpetualProperty.underlyingAssetSymbol : ''}`,
          price: `${(item.price as BigNumber).toFixed()} ${perpetualProperty ? perpetualProperty.collateralTokenSymbol : ''}`,
          size: `${(item.amount as BigNumber).toFixed()} ${perpetualProperty ? perpetualProperty.underlyingAssetSymbol : ''}`,
          volume: `${(item.amount as BigNumber).times(toBigNumber(item.price)).toFixed()} ${perpetualProperty ? perpetualProperty.collateralTokenSymbol : ''}`,
          fee: `${(item.fee as BigNumber).toFixed()} ${perpetualProperty ? perpetualProperty.collateralTokenSymbol : ''}`,
          pnl: !(item.pnl as BigNumber).isNaN() ? `${(item.pnl as BigNumber).toFixed()} ${perpetualProperty ? perpetualProperty.collateralTokenSymbol : ''}` : '',
        }
      })
      const format = [
        { name: this.$t('base.time'), key: 'time' },
        { name: this.$t('base.contract'), key: 'contract' },
        { name: this.$t('base.side'), key: 'side' },
        { name: this.$t('base.price'), key: 'price' },
        { name: this.$t('base.size'), key: 'size' },
        { name: this.$t('base.volume'), key: 'volume' },
        { name: this.$t('base.fee'), key: 'fee' },
        { name: this.$t('base.pnl'), key: 'pnl' },
      ]
      const csv = new ExportCsv(data)
      csv.format(format)
      csv.setFileName(`trade-history-${moment().format('YYYY-MM-DD-HH-mm-ss')}.csv`)
      csv.exportCsv()
    } catch (e) {
      let error = e
      if (!isMCError(e)) {
        error = { helpCaptionKey: 'messageTip.exportFail', helpKey: '' }
      }
      processStoreErrors(this, error)
    }
  }
}
