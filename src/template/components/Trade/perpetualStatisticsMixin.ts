import { Component, Mixins, Watch } from 'vue-property-decorator'
import { ErrorHandlerMixin, SelectedPerpetualMixin } from '@/mixins'
import { Acc, Perpetual, Volume } from '@/type'
import { getBeforeTimestamp, toBigNumber } from '@/utils'
import { queryPriceStatus } from '@/api/priceStatus'
import { USDTokenSet } from '@/config/tokens'
import BigNumber from 'bignumber.js'
import * as _ from 'lodash'
import { _0, computeFundingRate } from '@mcdex/mai3.js'
import { query24HPriceFromBackend } from '@/api/candle'

@Component
export default class PerpetualStatisticsMixin extends Mixins(SelectedPerpetualMixin, ErrorHandlerMixin) {
  graphPerpetual: Perpetual | null = null

  unitAccumulativeFundingHistory: Acc[] | null = null
  volumes: Volume[] | null = null
  protected priceInfoMap = new Map<string, { price: BigNumber, change24hRate: BigNumber, price24H: BigNumber }>()
  private loadTimer = 0

  mounted() {
    this.loadTimer = window.setInterval(() => {
      this.loadPriceStatus()
    }, 30000)
  }

  destroyed() {
    window.clearInterval(this.loadTimer)
  }

  get priceRate() {
    if (this.selectedPerpetualID) {
      return this.priceInfoMap.get(this.selectedPerpetualID)?.change24hRate.times(100)
    } else {
      return null
    }
  }

  get volumeDecimals(): number {
    if (!this.selectedLiquidityPool) {
      return 0
    }
    const collateralAddress = this.selectedLiquidityPool.liquidityPoolStorage.collateral.toLowerCase()
    if (USDTokenSet.has(collateralAddress)) {
      return 0
    }
    return 1
  }

  get priceUnit() {
    return this.selectedPerpetualProperty?.priceSymbol || ''
  }

  get collateralSymbol() {
    return this.selectedPerpetualProperty?.collateralTokenSymbol || ''
  }

  get underlyingSymbol() {
    return this.selectedPerpetualProperty?.underlyingAssetSymbol || ''
  }

  get underlyingDecimals() {
    return this.selectedPerpetualProperty?.underlyingAssetFormatDecimals || 0
  }

  get priceFormatDecimals() {
    return this.selectedPerpetualProperty?.priceFormatDecimals || 0
  }

  get indexChange24H() {
    if (this.selectedPerpetualID && this.selectedPerpetual) {
      const price = this.priceInfoMap.get(this.selectedPerpetualID)?.price
      const price24H = this.priceInfoMap.get(this.selectedPerpetualID)?.price24H
      return price && price24H ? price.minus(price24H) : null
    }
    return null
  }


  get indexChange24HRate() {
    if (this.selectedPerpetual && this.selectedPerpetualID) {
      return this.selectedPerpetualID ? this.priceInfoMap.get(this.selectedPerpetualID)?.change24hRate.times(100) : null
    }
    return null
  }

  get openInterest(): BigNumber | null {
    return this.selectedPerpetualStorage?.openInterest || null
  }

  get tradeVolumeIn24H(): BigNumber | null {
    if (this.selectedPerpetualIsSettle || this.volumes === null) {
      return null
    }
    if (this.volumes.length === 0) {
      return toBigNumber('0')
    }
    const trade24HVolume = _.sumBy(this.volumes, (o) => {
      return Number(o.volume)
    })
    return toBigNumber(trade24HVolume.toString())
  }

  get displayFundingRate(): BigNumber | null {
    if (!this.selectedPerpetual || this.selectedPerpetualIsSettle) {
      return null
    }
    const fundingRate = computeFundingRate(this.selectedPerpetual.liquidityPoolStorage, this.selectedPerpetual.perpetualProperty.perpetualIndex)
    if (fundingRate.isNaN()) {
      // liquidity = 0, etc.
      return _0
    }
    if (this.selectedPerpetualIsInverse) {
      return fundingRate.times(100).negated()
    }
    return fundingRate.times(100)
  }

  get displayAverageFundingRate(): BigNumber | null {
    if (!this.selectedPerpetual || this.unitAccumulativeFundingHistory === null ||
      this.selectedPerpetualIsSettle) {
      return null
    }
    if (!this.graphPerpetual || this.graphPerpetual.id !== this.selectedPerpetualID) {
      // double check: the 2 data sources must refer to the same perp
      return null
    }
    if (this.unitAccumulativeFundingHistory.length === 0) {
      return toBigNumber('0')
    }
    const t1 = this.unitAccumulativeFundingHistory[0].timestamp
    const acc1 = this.unitAccumulativeFundingHistory[0].acc
    const t2 = Date.now() / 1000
    const acc2 = this.selectedPerpetual.perpetualStorage.unitAccumulativeFunding
    const price2 = this.selectedPerpetual.perpetualStorage.markPrice
    if (t2 <= t1) {
      return toBigNumber('0')
    }
    //  acc2 - acc1     8h
    // ------------- ---------
    //    index2      t2 - t1
    let v = acc2.minus(acc1).div(t2 - t1).times(8 * 3600).div(price2).times(100)
    if (this.selectedPerpetualIsInverse) {
      v = v.negated()
    }
    return v
  }

  get averageFundingRatePrompt(): string {
    return this.$t('statisticsBar.accumulatedFundingRatePrompt').toString()
  }

  @Watch('selectedPerpetualID', { immediate: true })
  async onSelectedPerpetualIDChanged() {
    this.loadPriceStatus(true)
  }

  @Watch('selectedPerpetualStorage')
  async onPerpetualStorageChanged() {
    this.loadPriceStatus(false)
    this.loadPriceInfo()
  }

  async loadPriceStatus(isClearData = false) {
    await this.callGraphApiFunc(async () => {
      if (!this.selectedPerpetualID || !this.selectedPerpetualStorage) {
        return
      }
      if (isClearData) {
        this.graphPerpetual = null
        this.unitAccumulativeFundingHistory = null
        this.volumes = null
      }

      const before24hTimestamp = getBeforeTimestamp('d')
      const accBefore8hTimestamp = getBeforeTimestamp('h', 8)
      const data = await queryPriceStatus(
        this.selectedPerpetualID,
        this.selectedPerpetualStorage.oracle.toLowerCase(),
        before24hTimestamp,
        accBefore8hTimestamp,
      )
      if (data.perpetuals.length > 0) {
        this.graphPerpetual = data.perpetuals[0]
      }
      this.unitAccumulativeFundingHistory = data.accs
      this.volumes = data.volumes
    })
  }

  async loadPriceInfo() {
    const result = await this.callGraphApiFunc(async () => {
      if (!this.selectedPerpetualID || this.selectedPerpetualID === '' || !this.selectedPerpetualStorage) {
        return
      }
      return await query24HPriceFromBackend([{
        perpetualId: this.selectedPerpetualID.split('-').join('_'),
        oracleAddress: this.selectedPerpetualStorage.oracle.toLowerCase() || '',
      }], undefined, this.selectedPerpetualIsInverse)
    })
    if (!result) {
      return
    }
    this.priceInfoMap = result.priceInfo
  }
}
