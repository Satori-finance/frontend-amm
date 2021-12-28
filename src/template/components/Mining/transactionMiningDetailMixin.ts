import { Component, Mixins, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { LiquidityPoolDirectoryItem, TransactionMiningInfo } from '@/type'
import { queryTransactionMiningInfo } from '@/api/mining'
import { currentChainConfig } from '@/config/chain'
import { ErrorHandlerMixin } from '@/mixins'
import { padLeft } from '@/utils'

const perpetual = namespace('perpetual')

interface PoolItem {
  poolAddress: string
  collateral: string
  perpetuals: Array<{ symbol: string, underlying: string }>
}

@Component
export class TransactionMiningDetailMixin extends Mixins(ErrorHandlerMixin) {
  @perpetual.Getter('getLiquidityPoolFunc') getLiquidityPoolFunc!: (poolAddress: string) => LiquidityPoolDirectoryItem | null
  @perpetual.Action('updateLiquidityPool') updateLiquidityPool!: (poolAddress: string) => void

  protected miningInfo: TransactionMiningInfo | null = null
  protected loading = false

  get noData() {
    return this.tableBody.length <= 0
  }

  get tableBody() {
    const result: PoolItem[] = []
    this.miningInfo?.pools.forEach(poolAddress => {
      const pool = this.getLiquidityPoolFunc(poolAddress)
      if (pool && pool.perpetualPropertyMap.size) {
        const perpetuals: Array<{ symbol: string, underlying: string }> = []
        pool.liquidityPoolStorage.perpetuals.forEach(p => {
          perpetuals.push({ symbol: padLeft(p.symbol, 5), underlying: p.underlyingSymbol })
        })
        result.push({
          poolAddress: pool.liquidityPoolAddress,
          collateral: pool.perpetualPropertyMap.values().next().value.collateralTokenSymbol,
          perpetuals: perpetuals,
        })
      }
    })

    return result
  }

  mounted() {
    this.getMiningInfo()
  }

  async getMiningInfo() {
    await this.callGraphApiFunc(async () => {
      this.loading = true
      try {
        const data = await queryTransactionMiningInfo(currentChainConfig.subgraphConfig.transactionMiningSubgraph)
        this.miningInfo = data.miningInfo
      } finally {
        this.loading = false
      }
    })
    if (this.miningInfo) {
      await Promise.all(this.miningInfo.pools.map(p => this.updateLiquidityPool(p)))
    }
  }
}
