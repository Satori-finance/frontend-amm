import { Component, Mixins } from 'vue-property-decorator'
import { TradeLineChartDataCallGroup } from '@/template/components/TradeChart/TradeLineChartMixin'
import { LineData, UTCTimestamp } from 'lightweight-charts'
import { getBeforeTimestamp, toBigNumber } from '@/utils'
import { ErrorHandlerMixin, SelectedPerpetualMixin } from '@/mixins'
import { querySpecifyPerpetual } from '@/api/perpetual'
import { FundingRate } from '@/type'
import { queryPerpFundingRates } from '@/api/fundingRate'
import _ from 'lodash'

@Component
export default class FundingRateChartMixin extends Mixins(SelectedPerpetualMixin, ErrorHandlerMixin) {

  protected selectedLineChartType: '8hRate' | 'annualized' = '8hRate'
  protected selectedTimeType: string = '1w'

  get timeOptions() {
    return this.dataCallGroup.map((item) => {
      return {
        label: item.label,
        value: item.value
      }
    })
  }

  get dataCallGroup():  TradeLineChartDataCallGroup[] {
    return [
      {
        label: '1D',
        value: '1d',
        dataCall: async (): Promise<LineData[]> => {
          const beforeTimestamp = getBeforeTimestamp('d', 1)
          return await this.getFundingRateHistory('minute', beforeTimestamp)
        },
        dataType: 'minute'
      },
      {
        label: '1W',
        value: '1w',
        dataCall: async (): Promise<LineData[]> => {
          const beforeTimestamp = getBeforeTimestamp('w', 1)
          return await this.getFundingRateHistory('hour', beforeTimestamp)
        },
        dataType: 'hour'
      },
      {
        label: '1M',
        value: '1m',
        dataCall: async (): Promise<LineData[]> => {
          const beforeTimestamp = getBeforeTimestamp('m', 1)
          return await this.getFundingRateHistory('hour', beforeTimestamp)
        },
        dataType: 'hour'
      },
      {
        label: 'All',
        value: 'all',
        dataCall: async (): Promise<LineData[]> => {
          return await this.getFundingRateHistory('hour', 0)
        },
        dataType: 'hour'
      }
    ]
  }

  async getFundingRateHistory(dataType: 'minute' | 'hour', beforeTimestamp: number): Promise<LineData[]> {
    if (!this.selectedPerpetualID) {
      return []
    }
    const nowTimestamp = Math.floor(Date.now() / 1000)
    const graphMaxLimit = 1000
    // query perpetual create time
    if (beforeTimestamp === 0) {
      const r = await this.callGraphApiFunc(() => {
        return querySpecifyPerpetual(this.selectedPerpetualID || '')
      })
      if (!r || r.perpetuals.length == 0) {
        return []
      }
      beforeTimestamp = Number(r.perpetuals[0].createdAtTimestamp) / 1000
    }
    const timeRangeLength = nowTimestamp - beforeTimestamp
    const maxQueryLine = timeRangeLength / (dataType === 'minute' ? 60 : 3600)

    // shard query
    let splitQueryTimeRange: { from: number, to: number }[] = []
    const timeInterval = dataType === 'minute' ? graphMaxLimit * 60 : graphMaxLimit * 3600
    for (let i=0; i<Math.ceil(maxQueryLine/graphMaxLimit); i++) {
      splitQueryTimeRange.push({
        from: beforeTimestamp + (i*timeInterval),
        to: beforeTimestamp + ((i+1) * timeInterval) - 1
      })
    }
    // query
    let queryResult: FundingRate[] = []
    const queryObject = splitQueryTimeRange.map((item) => {
      return this.callGraphApiFunc(() => {
        return queryPerpFundingRates(
          this.selectedPerpetualID || '',
          dataType,
          item.from,
          item.to
          )
      })
    })
    const promiseResult = await Promise.all(queryObject)
    promiseResult.forEach((item) => {
      queryResult.push(...item?.fundingRateList || [])
    })
    queryResult = _.uniqBy(queryResult, 'timestamp')
    queryResult = _.sortBy(queryResult, 'timestamp', 'desc')
    return queryResult.map((item) => {
      const value = toBigNumber(item.fundingRate).times(100)
      return {
        time: item.timestamp as UTCTimestamp,
        value: this.selectedPerpetualIsInverse ? value.negated().toNumber() : value.toNumber()
      }
    })
  }
}
