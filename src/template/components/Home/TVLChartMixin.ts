import { Component, Mixins } from 'vue-property-decorator'
import HomeChartBaseMixin from './HomeChartBaseMixin'
import { LineData, UTCTimestamp } from 'lightweight-charts'
import { getBeforeTimestamp } from '@/utils'
import { McdexData } from '@/type'
import _ from 'lodash'
import { LightDataCallRadioGroup } from '@/components/Chart/chart'
import BigNumber from 'bignumber.js'

@Component
export default class TVLChartMixin extends Mixins(HomeChartBaseMixin) {

  protected latestTvlValue: BigNumber | null = null

  mounted() {
    // this.getLatestTvlValue()
  }

  get tvlRadioGroup (): LightDataCallRadioGroup[] {
    return [
      {
        label: this.$t('home.1d').toString(),
        value: '1d',
        dataType: 'hour',
        dataCall: async (): Promise<LineData[]> => {
          this.latestTvlValue = null
          const beforeTimestamp = getBeforeTimestamp('d')
          const { margeData, sourceData } = await this.getMcdexTvlDatas('h', beforeTimestamp)
          const newSourceDate = this.patchSourceData(sourceData)
          const lastValue = this.lastValue(newSourceDate)
          this.latestTvlValue = lastValue
          let newMargeData: McdexData[] = []
          newSourceDate.forEach((item) => {
            newMargeData.push(...item)
          })
          return this.parseAndMargeTVLDatas(newMargeData, lastValue)
        },
      },
      {
        label: this.$t('home.1w').toString(),
        value: '1w',
        dataType: 'day',
        dataCall: async (): Promise<LineData[]> => {
          this.latestTvlValue = null
          const beforeTimestamp = getBeforeTimestamp('w')
          const { margeData, sourceData } =  await this.getMcdexTvlDatas('d', beforeTimestamp)
          const newSourceDate = this.patchSourceData(sourceData)
          const lastValue = this.lastValue(newSourceDate)
          this.latestTvlValue = lastValue
          let newMargeData: McdexData[] = []
          newSourceDate.forEach((item) => {
            newMargeData.push(...item)
          })
          return this.parseAndMargeTVLDatas(newMargeData, lastValue)
        },
      },
      {
        label: this.$t('home.1m').toString(),
        value: '1m',
        dataType: 'day',
        dataCall: async (): Promise<LineData[]> => {
          this.latestTvlValue = null
          const beforeTimestamp = getBeforeTimestamp('m')
          const { margeData, sourceData } = await this.getMcdexTvlDatas('d', beforeTimestamp)
          const newSourceDate = this.patchSourceData(sourceData)
          const lastValue = this.lastValue(newSourceDate)
          this.latestTvlValue = lastValue
          let newMargeData: McdexData[] = []
          newSourceDate.forEach((item) => {
            newMargeData.push(...item)
          })
          return this.parseAndMargeTVLDatas(newMargeData, lastValue)
        },
      },      {
        label: this.$t('home.all').toString(),
        value: 'all',
        dataType: 'day',
        dataCall: async (): Promise<LineData[]> => {
          this.latestTvlValue = null
          const { margeData, sourceData } = await this.getMcdexTvlDatas('d', 0)
          const newSourceDate = this.patchSourceData(sourceData)
          const lastValue = this.lastValue(newSourceDate)
          this.latestTvlValue = lastValue
          let newMargeData: McdexData[] = []
          newSourceDate.forEach((item) => {
            newMargeData.push(...item)
          })
          return this.parseAndMargeTVLDatas(newMargeData, lastValue)
        }
      }
    ]
  }

  async getLatestTvlValue() {
    const beforeTimestamp = getBeforeTimestamp('d')
    const { margeData, sourceData } = await this.getMcdexTvlDatas('h', beforeTimestamp)
    const lastValue = this.lastValue(sourceData)
    const parsedData = this.parseAndMargeTVLDatas(margeData, lastValue)
    if (parsedData.length > 0) {
      this.latestTvlValue = new BigNumber(parsedData[parsedData.length-1].value)
    } else {
      this.latestTvlValue = null
    }
  }

  lastValue(sourceData: McdexData[][]): BigNumber {
    let v = new BigNumber(0)
    sourceData.forEach((list) => {
      if (list.length !== 0) {
        const item = list[list.length - 1]
        v = v.plus(item.totalValueLockedUSD)
      }
    })
    return v
  }

  patchSourceData(sourceData: McdexData[][]): McdexData[][] {
    let r: McdexData[][] = []
    sourceData.forEach((sourceItem) => {
      const s = _.sortBy(sourceItem, 'timestamp').reverse()
      for (let i = 0; i < s.length; i++) {
        const dataItem = s[i]
        if (Number(dataItem.totalValueLockedUSD) !== 0) {
          continue
        }
        for (let j = i+1; j<s.length; j++) {
          const jDataItem = s[j]
          if (Number(jDataItem.totalValueLockedUSD) !== 0) {
            s[i] = Object.assign({
              ...s[i],
              totalValueLockedUSD: jDataItem.totalValueLockedUSD
            })
            break
          }
        }
      }
      r.push(s.reverse())
    })
    return r
  }

  parseAndMargeTVLDatas(datas: McdexData[], lastValue: BigNumber | null): LineData[] {
    let resultDatas: LineData[] = []
    const groupDatas = _.groupBy(_.sortBy(datas, 'timestamp'), 'timestamp')
    for (let timestamp in groupDatas) {
      const itemData = groupDatas[timestamp]
      if(itemData.length >= this.supported_chain_count) {
        resultDatas.push({
          time: Number(timestamp) as UTCTimestamp,
          value: _.sumBy(itemData, (o)=> {
            return Number(o.totalValueLockedUSD)
          })
        })
      }
    }
    resultDatas = _.sortBy(resultDatas, 'timestamp')
    if (lastValue) {
      const i = resultDatas[resultDatas.length - 1]
      resultDatas[resultDatas.length - 1] = {
        ...i,
        value: lastValue.toNumber()
      }
    }
    return resultDatas
  }
}
