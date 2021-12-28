import { Component, Mixins, Watch } from 'vue-property-decorator'
import { ErrorHandlerMixin, SelectedPerpetualMixin } from '@/mixins'
import { namespace } from 'vuex-class'
import { Perpetual } from '@/type'
import { _0 } from '@mcdex/mai3.js'
import BigNumber from 'bignumber.js'
import * as _ from 'lodash'
import { query24HPrice, query24HPriceFromBackend } from '@/api/candle'

const perpetual = namespace('perpetual')
const perpetualSelector = namespace('perpetualSelector')

interface TableData {
  symbol: number
  symbolStr: string
  name: string
  collateralTokenSymbol: string
  collateralFormatDecimals?: number
  liquidityAmountUSD: BigNumber
  liquidityAmount: BigNumber
  price: BigNumber | null
  change24h: BigNumber | null
  deltaTotalVolumeUSD: BigNumber
  deltaTotalVolume: BigNumber
  isInverse: boolean
  collateralAddress: string | null
  underlyingSymbol: string | null
}

@Component
export class PerpetualSelectorMixin extends Mixins(SelectedPerpetualMixin, ErrorHandlerMixin) {
  @perpetual.Action('updatePerpetual') updatePerpetual!: (perpetualID: string) => Promise<void>
  @perpetualSelector.State('searchKey') searchKey!: string
  @perpetualSelector.State('perpetualType') perpetualType!: 'certified' | 'uncertified'
  @perpetualSelector.State('loading') loading!: boolean
  @perpetualSelector.Getter('perpetualsBySearchKey') perpetualsBySearchKey!: Perpetual[]
  @perpetualSelector.Action('updatePerpetuals') updatePerpetuals!: () => Promise<void>
  @perpetualSelector.Mutation('setPerpetualType') setPerpetualType!: (type: 'certified' | 'uncertified') => void
  @perpetualSelector.Mutation('setSearchKey') setSearchKey!: (key: string) => void

  protected timer: number = 0
  protected requestID = 0
  protected priceInfoMap = new Map<string, { price: BigNumber; change24hRate: BigNumber; price24H: BigNumber }>()

  get perpetualResult(): Perpetual[] {
    return _.orderBy(
      this.perpetualsBySearchKey,
      [
        // 24h vol
        (item) => item.deltaTotalVolumeUSD.toNumber(),
      ],
      ['desc']
    ).slice(0, 50)
  }

  get perpetualInfo() {
    if (!this.selectedPerpetualProperty) {
      return ''
    }
    return `${this.selectedPerpetualProperty.symbolStr} ${this.selectedPerpetualProperty.name}`
  }

  get tableBody(): TableData[] {
    const data: TableData[] = this.perpetualResult
      .filter((item) => !(item.liquidityPool?.poolMargin as BigNumber).isZero() && item.state === 2)
      .map((item) => {
        const perpetual = this.getPerpetualFunc(item.id)
        return {
          symbol: perpetual?.perpetualProperty.symbol || 1,
          symbolStr: perpetual?.perpetualProperty.symbolStr || '',
          name: perpetual?.perpetualProperty.name || '',
          collateralTokenSymbol: perpetual?.perpetualProperty.collateralTokenSymbol || '',
          collateralFormatDecimals: perpetual?.perpetualProperty.collateralFormatDecimals || 0,
          liquidityAmountUSD: (item.liquidityPool?.poolMarginUSD || _0) as BigNumber,
          liquidityAmount: (item.liquidityPool?.poolMargin || _0) as BigNumber,
          price: perpetual?.perpetualStorage.indexPrice || _0,
          change24h: this.priceInfoMap.get(item.id)?.change24hRate.times(100) || null,
          deltaTotalVolumeUSD: item.deltaTotalVolumeUSD,
          deltaTotalVolume: item.deltaTotalVolume,
          isInverse: perpetual?.perpetualProperty.isInverse || false,
          collateralAddress: perpetual?.liquidityPoolStorage.collateral || null,
          underlyingSymbol: perpetual?.perpetualProperty.underlyingAssetSymbol || null,
        }
      })

    if (this.perpetualType === 'certified') {
      return _.orderBy(data, ['symbol'], ['asc'])
    }
    return _.orderBy(
      data,
      [
        (item) => item.deltaTotalVolumeUSD.toNumber(),
        // show larger liquidity first
        (item) => item.liquidityAmountUSD.toNumber(),
        (item) => item.liquidityAmount.toNumber(),
        // numeric
        'symbol',
      ],
      ['desc', 'desc', 'asc', 'asc']
    )
  }

  get noData() {
    return this.tableBody.length <= 0
  }

  mounted() {
    this.updatePerpetuals()
  }

  @Watch('perpetualResult')
  private async onPerpetualResultChange() {
    const result = await query24HPriceFromBackend(
      this.perpetualResult.map((p) => ({
        perpetualId: p.id.split('-').join('_'),
        oracleAddress: p.oracleAddress || '',
      }))
    )
    if (result) {
      this.priceInfoMap = result.priceInfo
    }
    await Promise.all(
      this.perpetualResult.map((item: Perpetual) => {
        return this.getPerpetualFunc(item.id) ? null : this.updatePerpetual(item.id)
      })
    )
  }
}
