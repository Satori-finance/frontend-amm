import { Component, Mixins, Prop } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import { PoolBaseInfo } from '@/template/components/Pool/poolMixins'
import { PerpetualProperty, PoolLiquidityData, Volume } from '@/type'
import { LineData, UTCTimestamp, WhitespaceData } from 'lightweight-charts'
import { generateTimestampArray, getBeforeTimestamp, toBigNumber } from '@/utils'
import { queryPoolBaseInfo, queryPoolHistoryData, queryPoolLatestNAV, queryPoolVolumeHistory } from '@/api/pool'
import BigNumber from 'bignumber.js'
import _ from 'lodash'
import moment from 'moment'
import { LightDataCallRadioGroup } from '@/components/Chart/chart'

@Component
export default class PoolChartMixin extends Mixins(ErrorHandlerMixin) {
  @Prop({ required: true }) poolBaseInfo !: PoolBaseInfo | null
  @Prop({ required: true }) perpetualProperty !: PerpetualProperty | null

  get collateralSymbol(): string {
    return this.perpetualProperty?.collateralTokenSymbol ||
      (this.poolBaseInfo?.collateralSymbol || '')
  }

  get collateralDecimals() {
    return this.perpetualProperty?.collateralFormatDecimals || 0
  }

  get netAssetValueDecimals(): number {
    return this.collateralDecimals + 3
  }

  get liquidityRadioGroup(): LightDataCallRadioGroup[] {
    return [
      {
        label: this.$t('pool.chart.1d').toString(),
        value: '1d',
        dataType: 'hour',
        dataCall: async (): Promise<LineData[]> => {
          const beforeTimestamp = getBeforeTimestamp('d')
          const data = await this.getPoolDataHistory('h', beforeTimestamp)
          let latestData: BigNumber | null = null
          if (this.poolBaseInfo) {
            latestData = toBigNumber(this.poolBaseInfo.poolMargin)
          }
          return this.parseShareLiquidityData(data, latestData, beforeTimestamp)
        },
      }, {
        label: this.$t('pool.chart.1w').toString(),
        value: '1w',
        dataType: 'day',
        dataCall: async (): Promise<LineData[]> => {
          const beforeTimestamp = getBeforeTimestamp('w')
          const data = await this.getPoolDataHistory('d', beforeTimestamp)
          let latestData: BigNumber | null = null
          if (this.poolBaseInfo) {
            latestData = toBigNumber(this.poolBaseInfo.poolMargin)
          }
          return this.parseShareLiquidityData(data, latestData, beforeTimestamp)
        },
      }, {
        label: this.$t('pool.chart.1m').toString(),
        value: '1m',
        dataType: 'day',
        dataCall: async (): Promise<LineData[]> => {
          const beforeTimestamp = getBeforeTimestamp('m')
          const data = await this.getPoolDataHistory('d', beforeTimestamp)
          let latestData: BigNumber | null = null
          if (this.poolBaseInfo) {
            latestData = toBigNumber(this.poolBaseInfo.poolMargin)
          }
          return this.parseShareLiquidityData(data, latestData, beforeTimestamp)
        },
      }, {
        label: this.$t('pool.chart.all').toString(),
        value: 'all',
        dataType: 'day',
        dataCall: async (): Promise<LineData[]> => {
          const data = await this.getPoolDataHistory('d', 0)
          let latestData: BigNumber | null = null
          if (this.poolBaseInfo) {
            latestData = toBigNumber(this.poolBaseInfo.poolMargin)
          }
          return this.parseShareLiquidityData(data, latestData, null)
        },
      },
    ]
  }

  get volumeRadioGroup(): LightDataCallRadioGroup[] {
    return [
      {
        label: this.$t('pool.chart.1d').toString(),
        value: '1d',
        dataType: 'hour',
        dataCall: async (): Promise<LineData[]> => {
          const beforeTimestamp = getBeforeTimestamp('d')
          return await this.getPoolVolumeHistory('h', beforeTimestamp, false)
        },
      }, {
        label: this.$t('pool.chart.1w').toString(),
        value: '1w',
        dataType: 'day',
        dataCall: async (): Promise<LineData[]> => {
          const beforeTimestamp = getBeforeTimestamp('w')
          return await this.getPoolVolumeHistory('d', beforeTimestamp, false)
        },
      }, {
        label: this.$t('pool.chart.1m').toString(),
        value: '1m',
        dataType: 'day',
        dataCall: async (): Promise<LineData[]> => {
          const beforeTimestamp = getBeforeTimestamp('m')
          return await this.getPoolVolumeHistory('d', beforeTimestamp, false)
        },
      }, {
        label: this.$t('pool.chart.all').toString(),
        value: 'all',
        dataType: 'day',
        dataCall: async (): Promise<LineData[]> => {
          return await this.getPoolVolumeHistory('d', 0, false)
        },
      },
    ]
  }

  get navRadioGroup(): LightDataCallRadioGroup[] {
    return [
      {
        label: this.$t('pool.chart.1d').toString(),
        value: '1d',
        dataType: 'hour',
        dataCall: async (): Promise<LineData[]> => {
          const beforeTimestamp = getBeforeTimestamp('d')
          const data = await this.getPoolDataHistory('h', beforeTimestamp)
          const patchData = await this.getLatestPoolNetAssetValue()
          return this.parseShareNAVData(data, patchData, beforeTimestamp)
        },
      }, {
        label: this.$t('pool.chart.1w').toString(),
        value: '1w',
        dataType: 'day',
        dataCall: async (): Promise<LineData[]> => {
          const beforeTimestamp = getBeforeTimestamp('w')
          const data = await this.getPoolDataHistory('d', beforeTimestamp)
          const patchData = await this.getLatestPoolNetAssetValue()
          return this.parseShareNAVData(data, patchData, beforeTimestamp)
        },
      }, {
        label: this.$t('pool.chart.1m').toString(),
        value: '1m',
        dataType: 'day',
        dataCall: async (): Promise<LineData[]> => {
          const beforeTimestamp = getBeforeTimestamp('m')
          const data = await this.getPoolDataHistory('d', beforeTimestamp)
          const patchData = await this.getLatestPoolNetAssetValue()
          return this.parseShareNAVData(data, patchData, beforeTimestamp)
        },
      }, {
        label: this.$t('pool.chart.all').toString(),
        value: 'all',
        dataType: 'day',
        dataCall: async (): Promise<LineData[]> => {
          const data = await this.getPoolDataHistory('d', 0)
          const patchData = await this.getLatestPoolNetAssetValue()
          return this.parseShareNAVData(data, patchData, null)
        },
      },
    ]
  }

  async getPoolDataHistory(type: 'd' | 'h', beforeTimestamp: number): Promise<PoolLiquidityData[]> {
    if (!this.poolBaseInfo || this.poolBaseInfo.poolAddress === '') {
      return []
    }
    const poolAddress = this.poolBaseInfo.poolAddress
    const queryData = await this.callGraphApiFunc(() => {
      return queryPoolHistoryData(poolAddress, type, beforeTimestamp)
    })
    if (!queryData || queryData.poolDatas.length === 0) {
      return []
    }
    return queryData.poolDatas
  }

  async getPoolVolumeHistory(interval: 'd' | 'h', beforeTimestamp: number, isPatchData: boolean): Promise<LineData[]> {
    const nowTimestamp = Math.floor(Date.now() / 1000)
    if (!this.poolBaseInfo || this.poolBaseInfo.poolAddress === '') {
      return []
    }
    // history
    const poolAddress = this.poolBaseInfo.poolAddress
    const queryData = await this.callGraphApiFunc(() => {
      return queryPoolVolumeHistory(poolAddress, interval, beforeTimestamp)
    })
    if (!queryData) {
      return []
    }
    if (queryData.pools.length > 0 && queryData.pools[0].createdAtTimestamp) {
      // left = create
      const createTimestamp = (queryData.pools[0].createdAtTimestamp as moment.Moment).unix()
      beforeTimestamp = beforeTimestamp === 0 || beforeTimestamp <= createTimestamp ? createTimestamp : beforeTimestamp
    }

    // fill 0 for the missing bucket
    const patchTimestampArray = generateTimestampArray(
      interval === 'h' ? 'hour' : 'day',
      beforeTimestamp,
      nowTimestamp,
    )
    const dataArray = _.fill(Array(patchTimestampArray.length), 0)
    const volumes = _.orderBy<Volume>(queryData.volumes, 'timestamp', 'asc')
    for (let i = 0, j = 0; ;) {
      if (i >= volumes.length || j >= patchTimestampArray.length) {
        break
      }
      const beforeTimestamp = patchTimestampArray[j - 1] || 0
      const targetTimestamp = patchTimestampArray[j]
      const volumeItem = volumes[i]
      const volumeTimestamp = Number(volumeItem.timestamp as string)
      if (volumeTimestamp > beforeTimestamp && volumeTimestamp <= targetTimestamp) {
        dataArray[j] += toBigNumber(volumeItem.volume).toNumber()
        i++
      } else {
        j++
      }
    }

    // map to array
    let flatten: LineData[] = patchTimestampArray.map((t, i) => ({
      time: t as UTCTimestamp,
      value: dataArray[i],
    }))

    // last bucket
    if (isPatchData) {
      const patchData = await this.getLatestPoolVolume()
      if (patchData) {
        const i = flatten[flatten.length - 1]
        const nowTime = Date.now() / 1000
        flatten[flatten.length - 1] = {
          time: nowTime as UTCTimestamp,
          value: patchData.toNumber()
        }
      }
    }

    return flatten
  }

  async getLatestPoolVolume(): Promise<BigNumber | null> {
    if (!this.poolBaseInfo || this.poolBaseInfo.poolAddress === '') {
      return null
    }
    const before24hTimestamp = getBeforeTimestamp('d')
    const poolAddress = this.poolBaseInfo.poolAddress
    const volumes = await this.callGraphApiFunc(() => {
      return queryPoolVolumeHistory(poolAddress, 'h', before24hTimestamp)
    })
    if (!volumes || volumes.volumes.length === 0) {
      return null
    }
    const totalVolume = _.sumBy(volumes.volumes, (o) => {
      return Number(o.volume)
    })
    return new BigNumber(totalVolume)
  }

  async getLatestPoolNetAssetValue(): Promise<BigNumber | null> {
    if (!this.poolBaseInfo || this.poolBaseInfo.poolAddress === '') {
      return null
    }
    const poolAddress = this.poolBaseInfo.poolAddress
    const nav = await this.callGraphApiFunc(() => {
      return queryPoolLatestNAV(poolAddress)
    })
    if (!nav || nav.poolDayDatas.length === 0) {
      return null
    }
    return toBigNumber(nav.poolDayDatas[0].netAssetValue)
  }

  parseShareLiquidityData(
    data: PoolLiquidityData[],
    latestData: BigNumber | null,
    startTime: number | null
  ): LineData[] {
    let newData: LineData[] = []
    data.forEach((val) => {
      newData.push({
        time: val.timestamp as string,
        value: toBigNumber(val.poolMargin).toNumber(),
      })
    })
    if (latestData) {
      newData.push({
        time: Math.floor(Date.now() / 1000) as UTCTimestamp,
        value: latestData.toNumber(),
      })
    }
    if (newData.length > 0 && startTime) {
      newData.unshift({
        time: startTime as UTCTimestamp,
        value: newData[0].value,
      })
    }
    return newData
  }

  parseShareNAVData(
    data: PoolLiquidityData[],
    latestData: BigNumber | null,
    startTime: number | null
  ): LineData[] {
    let newData: LineData[] = []
    data.forEach((val) => {
      newData.push({
        time: val.timestamp as string,
        value: toBigNumber(val.netAssetValue).toNumber(),
      })
    })
    if (latestData) {
      newData.push({
        time: Math.floor(Date.now() / 1000) as UTCTimestamp,
        value: latestData.toNumber(),
      })
    }
    if (newData.length > 0 && startTime) {
      newData.unshift({
        time: startTime as UTCTimestamp,
        value: newData[0].value,
      })
    }
    return newData
  }
}
