import { Component, Mixins, Watch } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import { Provider } from '@ethersproject/providers'
import { namespace } from 'vuex-class'
import { PoolStruct } from '@/type'
import { queryAllPools } from '@/api/pool'
import _ from 'lodash'
import { isNativeToken } from '@/utils/chain'
import { currentChainConfig } from '@/config/chain'

const wallet = namespace('wallet')

@Component
export class LiquidityMiningPoolMixin extends Mixins(ErrorHandlerMixin) {
  @wallet.Getter('provider') provider!: Provider | null
  @wallet.Getter('providerL1') providerL1!: Provider

  protected liquidityPoolLoading: boolean = true
  protected currentBlockNumber: number = 0
  protected pools: PoolStruct[] = []

  get liquidityMiningPoolOptions() {
    let result: Array<{ label: string, value: string }> = []
    for (let i=0;i<this.pools.length;i++) {
      const item = this.pools[i]
      result.push({
        label: item?.collateralName || '',
        value: item.id.toLowerCase()
      })
    }
    return result
  }

  getLiquidityMiningPoolDataFunc = _.debounce(async () => {
    await this.getAllMiningPools()
    if (this.providerL1) {
      this.currentBlockNumber = await this.providerL1.getBlockNumber()
    }
  }, 200)

  async getAllMiningPools() {
    this.liquidityPoolLoading = true
    await this.callGraphApiFunc(async () => {
      const result = await queryAllPools()
      if (result) {
        this.pools = result.poolList.map(p => {
          p.collateralName = isNativeToken(p.collateralAddress || '') ? currentChainConfig.symbol : p.collateralName
          return p
        })
      }
    })
    this.liquidityPoolLoading = false
  }

  @Watch('provider', { immediate: true })
  @Watch('providerL1', { immediate: true })
  onLiquidityPoolMixinProviderChanged() {
    if (!this.provider) {
      return
    }
    this.getLiquidityMiningPoolDataFunc()
  }
}
