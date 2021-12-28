import { Component, Mixins } from 'vue-property-decorator'
import HomeChartBaseMixin from './HomeChartBaseMixin'
import { LineData } from 'lightweight-charts'
import { getBeforeTimestamp } from '@/utils'
import { McdexData } from '@/type'
import _ from 'lodash'
import { LightDataCallRadioGroup } from '@/components/Chart/chart'
import BigNumber from 'bignumber.js'

@Component
export default class VolumeChartMixin extends Mixins(HomeChartBaseMixin) {

  protected latestVolumeValue: BigNumber | null = null

  mounted() {
    this.getLatest24HData()
  }

  get volumeRadioGroup (): LightDataCallRadioGroup[] {
    return [
      {
        label: this.$t('home.1d').toString(),
        value: '1d',
        dataType: 'hour',
        dataCall: async (): Promise<LineData[]> => {
          const beforeTimestamp = getBeforeTimestamp('d')
          const { margeData, sourceData } = await this.getMcdexVolumeDatas('h', beforeTimestamp)
          return this.parseAndMargeVolumeDatas(margeData)
        },
      },
      {
        label: this.$t('home.1w').toString(),
        value: '1w',
        dataType: 'day',
        dataCall: async (): Promise<LineData[]> => {
          const beforeTimestamp = getBeforeTimestamp('w')
          const { margeData, sourceData } = await this.getMcdexVolumeDatas('d', beforeTimestamp)
          return this.parseAndMargeVolumeDatas(margeData)
        },
      },
      {
        label: this.$t('home.1m').toString(),
        value: '1m',
        dataType: 'day',
        dataCall: async (): Promise<LineData[]> => {
          const beforeTimestamp = getBeforeTimestamp('m')
          const { margeData, sourceData } = await this.getMcdexVolumeDatas('d', beforeTimestamp)
          return this.parseAndMargeVolumeDatas(margeData)
        },
      },      {
        label: this.$t('home.all').toString(),
        value: 'all',
        dataType: 'day',
        dataCall: async (): Promise<LineData[]> => {
          const { margeData, sourceData } = await this.getMcdexVolumeDatas('d', 0)
          return this.parseAndMargeVolumeDatas(margeData)
        }
      }
    ]
  }

  async getLatest24HData() {
    const beforeTimestamp = getBeforeTimestamp('d')
    const { margeData, sourceData } = await this.getMcdexVolumeDatas('h', beforeTimestamp)
    const parsedData = this.parseAndMargeVolumeDatas(margeData)
    const t = _.sumBy(parsedData, o => Number(o.value))
    this.latestVolumeValue = new BigNumber(t)
  }

  parseAndMargeVolumeDatas(datas: McdexData[]): LineData[] {
    let resultDatas: LineData[] = []
    const groupDatas = _.groupBy(datas, 'timestamp')
    for (let timestamp in groupDatas) {
      const itemData = groupDatas[timestamp]
      resultDatas.push({
        time: Number(timestamp) as any,
        value: _.sumBy(itemData, (o)=> {
          return Number(o.totalVolumeUSD)
        })
      })
    }
    return _.sortBy(resultDatas, 'timestamp')
  }
}
