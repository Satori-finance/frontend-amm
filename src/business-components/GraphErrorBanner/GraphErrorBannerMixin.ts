import { Component, Mixins, Watch } from 'vue-property-decorator'
import { ErrorHandlerMixin, SelectedPerpetualMixin } from '@/mixins'
import { SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/constants'
import BigNumber from 'bignumber.js'
import { queryLatestBlockNumber } from '@/api/block'
import { currentChainConfig } from '@/config/chain'
import { Provider } from '@ethersproject/providers'
import { namespace } from 'vuex-class'

const wallet = namespace('wallet')

@Component
export default class GraphErrorBannerMixin extends Mixins(ErrorHandlerMixin) {
  @wallet.Getter('provider') provider !: Provider

  protected timer: number = 0
  protected isShowBanner: boolean = false
  protected isDontShow: boolean = false
  protected currentBlockNumber: number = 0
  protected graphBlockNumber: number = 0
  protected behindBlock: number = 0

  get subgraphName(): string {
    if (TARGET_NETWORK_ID === SUPPORTED_NETWORK_ID.BSC) {
      // return 'mcdex3-bsc-perpetual'
      return 'mcdex3-bsc-perpetual2'
    } else if (TARGET_NETWORK_ID === SUPPORTED_NETWORK_ID.ARB) {
      return 'mcdex3-arb-perpetual'
    }
    return ''
  }

  async checkGraphBlock() {
    clearTimeout(this.timer)
    const currentBlockNumber = await this.getLatestBlockNumber()
    const graphBlockNumber = await this.getGraphBlockNumber()

    if (!currentBlockNumber || !graphBlockNumber) {
      await this.checkGraphBlock()
      return
    }
    const behindBlock = new BigNumber(currentBlockNumber).minus(new BigNumber(graphBlockNumber))

    if (this.isDontShow) {
      return
    }
    this.currentBlockNumber = currentBlockNumber
    this.graphBlockNumber = graphBlockNumber
    this.behindBlock = behindBlock.toNumber()
    this.isShowBanner = behindBlock.abs().gt(50);
    this.timer = window.setTimeout(this.checkGraphBlock, 300000)
  }

  async getLatestBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber()
  }

  async getGraphBlockNumber(): Promise<number | null> {
    if (!this.subgraphName) {
      return null
    }
    const blockNumber = await this.callGraphApiFunc(() => {
      return queryLatestBlockNumber(this.subgraphName,currentChainConfig.subgraphConfig.checkBlockSubgraph)
    })
    if (!blockNumber || !blockNumber.latestBlock) {
      return null
    }
    return Number(blockNumber.latestBlock)
  }
}
