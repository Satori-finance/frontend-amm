<template>
  <div class="perpetual-chart">
    <span class="head-title">{{ $t('pool.poolInfo.perpetualChart') }}</span>
    <div class="chart-data-type-select">
      <el-radio-group v-model="activeDataType" size="medium">
        <el-radio-button label="volume">{{ $t('base.volume24H') }}</el-radio-button>
      </el-radio-group>
    </div>
    <div class="chart-container">
      <HistogramChart v-if="activeDataType==='volume' && perpetualID !== ''" :chart-size="chartSize"
                      unit-position="right" :unit="collateralSymbol" default-radio="1w"
                      :data-call-radio-group="volumeRadioGroup" key="volumeChart"
                      :is-price-formatter="true" :default-price-decimals="collateralDecimals"
                      :show-value-change="false"/>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import { HistogramChart } from '@/components'
import { LineData, UTCTimestamp, WhitespaceData } from 'lightweight-charts'
import { PerpetualProperty, Volume } from '@/type'
import { generateTimestampArray, getBeforeTimestamp, toBigNumber } from '@/utils'
import { queryPerpVolumeHistory } from '@/api/perpetual'
import { PerpetualStorage } from '@mcdex/mai3.js'
import BigNumber from 'bignumber.js'
import _ from 'lodash'
import moment from 'moment'
import { LightDataCallRadioGroup } from '@/components/Chart/chart'

@Component({
  components: {
    HistogramChart,
  },
})
export default class PerpetualChart extends Mixins(ErrorHandlerMixin) {
  @Prop({ required: true, default: () => null }) perpetualProperty!: PerpetualProperty | null
  @Prop({ default: () => null }) perpetualStorage!: PerpetualStorage | null

  private chartSize: { width: number, height: number } = { width: 726, height: 188 }
  private activeDataType: string = 'volume'

  get collateralSymbol() {
    return this.perpetualProperty?.collateralTokenSymbol || ''
  }

  get collateralDecimals() {
    return this.perpetualProperty?.collateralFormatDecimals || 0
  }

  get oracleAddress(): string {
    if (!this.perpetualStorage) return ''
    return this.perpetualStorage.oracle.toLowerCase()
  }

  get perpetualID(): string {
    if (!this.perpetualProperty) return ''
    return this.perpetualProperty.perpetualID
  }

  get volumeRadioGroup(): LightDataCallRadioGroup[] {
    return [
      {
        label: this.$t('pool.chart.1d').toString(),
        value: '1d',
        dataType: 'hour',
        dataCall: async (): Promise<LineData[]> => {
          const beforeTimestamp = getBeforeTimestamp('d')
          return await this.getPerpVolumeHistory('h', beforeTimestamp, false)
        },
      }, {
        label: this.$t('pool.chart.1w').toString(),
        value: '1w',
        dataType: 'day',
        dataCall: async (): Promise<LineData[]> => {
          const beforeTimestamp = getBeforeTimestamp('w')
          return await this.getPerpVolumeHistory('d', beforeTimestamp, false)
        },
      }, {
        label: this.$t('pool.chart.1m').toString(),
        value: '1m',
        dataType: 'day',
        dataCall: async (): Promise<LineData[]> => {
          const beforeTimestamp = getBeforeTimestamp('m')
          return await this.getPerpVolumeHistory('d', beforeTimestamp, false)
        },
      }, {
        label: this.$t('pool.chart.all').toString(),
        value: 'all',
        dataType: 'day',
        dataCall: async (): Promise<LineData[]> => {
          return await this.getPerpVolumeHistory('d', 0, false)
        },
      },
    ]
  }

  async getPerpVolumeHistory(type: 'd' | 'h', beforeTimestamp: number, isPatchData: boolean): Promise<LineData[]> {
    if (!this.perpetualProperty || this.perpetualID === '') {
      return []
    }
    const nowTimestamp = Math.floor(Date.now() / 1000)
    const queryData = await this.callGraphApiFunc(() => {
      return queryPerpVolumeHistory(this.perpetualID, type, beforeTimestamp)
    })
    if (!queryData) {
      return []
    }

    if (queryData.perpetuals.length > 0 && queryData.perpetuals[0].createdAtTimestamp) {
      const createTimestamp = (queryData.perpetuals[0].createdAtTimestamp as moment.Moment).unix()
      beforeTimestamp = beforeTimestamp === 0 || beforeTimestamp <= createTimestamp ? createTimestamp : beforeTimestamp
    }

    const patchTimestampArray = generateTimestampArray(
      type === 'h' ? 'hour' : 'day',
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

    const newData: LineData[] = patchTimestampArray.map((t, i) => ({
      time: t as UTCTimestamp,
      value: dataArray[i],
    }))

    if (isPatchData && newData.length > 0) {
      let patchData = _.sumBy(queryData.volumes24h, (val: Volume) => {
        return (val.volume as BigNumber).toNumber()
      })
      const nowTime = Date.now() / 1000
      newData[newData.length - 1] = {
        time: nowTime as UTCTimestamp,
        value: patchData,
      }
    }
    return newData
  }
}
</script>

<style scoped lang="scss">
@import "../info.scss";

.perpetual-chart {
}
</style>
