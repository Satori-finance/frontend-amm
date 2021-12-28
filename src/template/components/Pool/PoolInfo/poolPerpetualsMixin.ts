import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import { PoolBaseInfo } from '@/template/components/Pool/poolMixins'
import { LiquidityPoolDirectoryItem, PerpetualCombinedState, PerpetualProperty, Volume } from '@/type'
import { _0, _1, computeAccount, PerpetualState } from '@mcdex/mai3.js'
import BigNumber from 'bignumber.js'
import { getBeforeTimestamp, isLongPosition, toBigNumber } from '@/utils'
import { queryPoolPerpetualListDetails } from '@/api/pool'
import * as _ from 'lodash'
import { namespace } from 'vuex-class'
import { AccountStorage } from '@mcdex/mai3.js/dist/types'

export interface PerpetualTable {
  index: number
  symbol: string
  underlying: string
  status: PerpetualState
  ammPosition: BigNumber
  ammEntryPrice: BigNumber
  volume24Hours: BigNumber
  volume7Day: BigNumber
}

export interface PerpetualSubTable {
  underlyingDecimals: number
  isInverse: boolean
  markPrice: BigNumber
  sideSymbol: string
}

const perpetual = namespace('perpetual')

@Component
export default class PoolPerpetualsMixin extends Mixins(ErrorHandlerMixin) {
  @Prop({ required: true }) poolBaseInfo !: PoolBaseInfo | null
  @Prop({ required: true }) liquidityPool !: LiquidityPoolDirectoryItem | null
  @Prop({ required: true }) perpetualProperty !: PerpetualProperty | null
  @perpetual.Getter('getPerpetualFunc') getPerpetualFunc!: (perpetualId: string) => PerpetualCombinedState | null

  protected perpetuals: PerpetualTable[] = []
  protected loading: boolean = false

  async mounted () {
    await this.getPerpetualsTable()
  }

  get poolAddress (): string {
    if (!this.poolBaseInfo) return ''
    return this.poolBaseInfo.poolAddress.toLowerCase()
  }

  get noData (): boolean {
    return this.perpetuals.length === 0
  }

  get perpetualCount (): number {
    return this.perpetuals.length
  }

  get perpetualsSymbol (): string[] {
    if (!this.poolBaseInfo) return []
    let symbols: string[] = []
    this.poolBaseInfo.perpetuals.forEach((val) => {
      symbols.push(val.symbol)
    })
    return symbols
  }

  get collateralDecimals (): number {
    return this.perpetualProperty?.collateralFormatDecimals || 0
  }

  get underlyingAssetFormatDecimals (): number {
    return this.perpetualProperty?.decimals.underlyingAssetFormatDecimals || 0
  }

  get collateralSymbol (): string {
    return this.perpetualProperty?.collateralTokenSymbol ||
      (this.poolBaseInfo?.collateralSymbol || '')
  }

  get perpetualsSubTable(): { [indexID: string]: PerpetualSubTable } {
    if (!this.liquidityPool || this.perpetuals.length === 0) return {}
    let subTable: { [indexID: string]: PerpetualSubTable } = {}
    this.perpetuals.forEach((val) => {
      subTable[this.getPerpID(val.index)] = {
        underlyingDecimals: this.getUnderlyingDecimals(val.index),
        isInverse: this.getPerpetualIsInverse(val.index),
        markPrice: this.getPerpetualMarkPrice(val.index),
        sideSymbol: this.getPerpetualSideSymbol(val.index),
      }
    })
    return subTable
  }

  getPerpID(index: number): string {
    return `perp_${index}`
  }

  getPerpetualStatusText (status: PerpetualState) {
    if (status === PerpetualState.INVALID) return this.$t('perpetualStatus.invalid').toString()
    if (status === PerpetualState.INITIALIZING) return this.$t('perpetualStatus.initializing').toString()
    if (status === PerpetualState.NORMAL) return this.$t('perpetualStatus.normal').toString()
    if (status === PerpetualState.EMERGENCY) return this.$t('perpetualStatus.emergency').toString()
    if (status === PerpetualState.CLEARED) return this.$t('perpetualStatus.cleared').toString()
    return ''
  }

  getPerpetual (index: number): PerpetualCombinedState | null {
    if (this.poolAddress === '' || index < 0) {
      return null
    }
    const perpetualID = `${this.poolAddress}-${index}`
    const perp = this.getPerpetualFunc(perpetualID)
    if (!perp) {
      return null
    }
    return perp
  }

  getUnderlyingDecimals(index: number): number {
    const perp = this.getPerpetual(index)
    if (!perp) {
      return 0
    }
    return perp.perpetualProperty.underlyingAssetFormatDecimals
  }

  getPerpetualIsInverse(index: number): boolean {
    const perp = this.getPerpetual(index)
    if (!perp) {
      return false
    }
    return perp.perpetualProperty.isInverse
  }

  getPerpetualMarkPrice(index: number): BigNumber {
    const perp = this.getPerpetual(index)
    if (!perp) {
      return _0
    }
    return perp.perpetualStorage.markPrice
  }

  getPerpetualSideSymbol(index: number): string {
    const perp = this.getPerpetual(index)
    if (!perp) {
      return ''
    }
    return perp.perpetualProperty.contractSymbol
  }

  getSideText(position: BigNumber, isInverse: boolean = false): string {
    if (position.isZero()) {
      return ''
    }
    if (isLongPosition(position, isInverse)) {
      return this.$t('base.long').toString()
    } else {
      return this.$t('base.short').toString()
    }
  }

  getEntryPrice(index: number, entryValue: BigNumber): BigNumber | null {
    const perp = this.getPerpetual(index)
    if (!this.liquidityPool || !perp) {
      return null
    }
    const accountStorage = {
      cashBalance: perp.perpetualStorage.ammCashBalance,
      positionAmount: perp.perpetualStorage.ammPositionAmount,
      targetLeverage: _1,
      entryValue: entryValue,
      entryFunding: null,
    } as AccountStorage
    return computeAccount(this.liquidityPool.liquidityPoolStorage, index, accountStorage).accountComputed.entryPrice
  }

  computePositionValue(perpIndex: number, positionSize: BigNumber): BigNumber {
    const perpSubTableData = this.perpetualsSubTable[this.getPerpID(perpIndex)]
    return positionSize.abs().times(perpSubTableData.markPrice)
  }

  @Watch('perpetualsSymbol')
  async getPerpetualsTable () {
    if (this.loading) {
      return
    }
    this.perpetuals = []
    if (this.poolAddress === '' || this.perpetualsSymbol.length === 0) {
      return
    }
    this.loading = true
    const before24hTimestamp = getBeforeTimestamp('d')
    const before7DTimestamp = getBeforeTimestamp('d', 7)
    const perpetuals = await this.callGraphApiFunc(() => {
      return queryPoolPerpetualListDetails(this.poolAddress, this.perpetualsSymbol, before24hTimestamp, before7DTimestamp)
    })
    if (!perpetuals || perpetuals.perpetuals.length === 0) {
      this.loading = false
      return
    }

    const computeVolumes = (symbol: string, volumes: Volume[]): BigNumber => {
      if (symbol === '') return _0
      let volumesList: BigNumber[] = []
      for (let i = 0; i < volumes.length; i++) {
        const v = volumes[i]
        if (!v.perpetual) {
          continue
        }
        if (v.perpetual.symbol && v.perpetual.symbol === symbol) {
          volumesList.push(toBigNumber(v.volume))
        }
      }
      const totalVolume = _.sumBy(volumesList, (o) => {
        return o.toNumber()
      })
      return new BigNumber(totalVolume)
    }

    perpetuals.perpetuals.forEach((val) => {
      const index = Number(val.index) < 0 ? -1 : Number(val.index)
      const ammPosition = toBigNumber(val?.position || '0')
      const ammEntryValue = toBigNumber(val?.entryValue || '0')
      this.perpetuals.push({
        index: index,
        symbol: val?.symbol || '',
        underlying: val?.underlying || '',
        status: val?.state || PerpetualState.INVALID,
        ammPosition: ammPosition,
        ammEntryPrice: this.getEntryPrice(index,ammEntryValue) || _0,
        volume24Hours: computeVolumes(val.symbol || '', perpetuals.volumes24H),
        volume7Day: computeVolumes(val.symbol || '', perpetuals.volumes7D),
      })
    })
    this.loading = false
  }
}
