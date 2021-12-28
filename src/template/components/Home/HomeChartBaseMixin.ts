import { Component, Mixins } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import { McdexData } from '@/type'
import { queryMcdexDatasHistory } from '@/api/mcdexData'
import { arbChainConfig, bscChainConfig, chainConfigs, currentChainConfig } from '@/config/chain'
import { SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/constants'

@Component
export default class HomeChartBaseMixin extends Mixins(ErrorHandlerMixin) {

  protected supported_chain_count: number = 2

  async getMcdexTvlDatas(type: 'd' | 'h', beforeTimestamp: number): Promise<{
      margeData: McdexData[],
      sourceData: McdexData[][]
    }> {
    if (!chainConfigs[TARGET_NETWORK_ID]) {
      return {
        margeData: [],
        sourceData: []
      }
    }
    // const bscGraphUrl = bscChainConfig.subgraphConfig.dataSubgraph
    const bscGraphUrl = 'https://api.thegraph.com/subgraphs/name/mcdexio/mcdex3-bsc-perpetual'
    const [arbDataResult, bscDataResult] = await Promise.all([
      queryMcdexDatasHistory(type, beforeTimestamp, arbChainConfig.subgraphConfig.dataSubgraph),
      // queryMcdexDatasHistory(type, beforeTimestamp, bscGraphUrl),
      queryMcdexDatasHistory(type, beforeTimestamp, bscChainConfig.subgraphConfig.dataSubgraph),
    ])
    return {
      margeData: [...(bscDataResult?.mcdexDatas || []), ...(arbDataResult?.mcdexDatas || [])],
      sourceData: [[...(bscDataResult?.mcdexDatas || [])], [...(arbDataResult?.mcdexDatas || [])]]
    }
  }

  async getMcdexVolumeDatas(type: 'd' | 'h', beforeTimestamp: number): Promise<{
    margeData: McdexData[],
    sourceData: McdexData[][]
  }> {
    if (!chainConfigs[TARGET_NETWORK_ID]) {
      return {
        margeData: [],
        sourceData: []
      }
    }
    const [arbDataResult, bscDataResult] = await Promise.all([
      queryMcdexDatasHistory(type, beforeTimestamp, arbChainConfig.subgraphConfig.dataSubgraph),
      queryMcdexDatasHistory(type, beforeTimestamp, bscChainConfig.subgraphConfig.dataSubgraph),
    ])
    return {
      margeData: [...(bscDataResult?.mcdexDatas || []), ...(arbDataResult?.mcdexDatas || [])],
      sourceData: [[...(bscDataResult?.mcdexDatas || [])], [...(arbDataResult?.mcdexDatas || [])]]
    }
  }
}
