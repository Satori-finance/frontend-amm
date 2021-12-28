import { Component, Mixins, Vue, Watch } from 'vue-property-decorator'
import BigNumber from 'bignumber.js'
import { queryTransactionMiningInfo, queryTransactionMiningUserInfo } from '@/api/mining'
import { ErrorHandlerMixin } from '@/mixins'
import { TransactionMiningInfo, TransactionMiningUserInfo, LiquidityPoolDirectoryItem } from '@/type'
import { _0 } from '@mcdex/mai3.js'
import { namespace } from 'vuex-class'
import { queryBlockByTimestamp } from '@/api/block'
import moment from 'moment/moment'
import { currentChainConfig } from '@/config/chain'
import { padLeft } from '@/utils'
import { SATORI_ADDRESS } from '@/constants'

interface TransactionMiningData {
  refundRate: BigNumber
  remainingBudget: BigNumber
  miningFee24h: BigNumber
  miningReward24h: BigNumber
  paid: BigNumber
  unpaid: BigNumber
}

interface PoolItem {
  poolAddress: string
  collateral: string
  perpetuals: Array<{ symbol: string, underlying: string }>
}

const perpetual = namespace('perpetual')
const wallet = namespace('wallet')
const price = namespace('price')

@Component
export class TransactionMiningMixin extends Mixins(ErrorHandlerMixin) {
  @wallet.Getter('address') address!: string | null
  @perpetual.Getter('getLiquidityPoolFunc') getLiquidityPoolFunc!: (poolAddress: string) => LiquidityPoolDirectoryItem | null
  @perpetual.Action('updateLiquidityPool') updateLiquidityPool!: (poolAddress: string) => void
  @price.Getter('tokenPriceFunc') tokenPriceFunc!: (token: string) => BigNumber | null
  @price.Action('updateTokenPrice') updateTokenPrice!: (tokens: string[]) => Promise<void>

  protected miningInfo: TransactionMiningInfo | null = null
  protected miningUserInfo: TransactionMiningUserInfo | null = null
  protected loading = false
  protected loadingUserInfo = false

  get totalRewardsPromptToolTipText(): string {
    const price = this.tokenPriceFunc(SATORI_ADDRESS)
    return this.$t('dao.totalRewardsPrompt', {
      amount: this.miningData.miningReward24h.toFixed(2),
      value: !price ? '?' : this.miningData.miningReward24h.times(price).toFixed(2)
    }).toString()
  }

  get miningData(): TransactionMiningData {
    return {
      refundRate: (this.miningInfo?.rebateRate || _0) as BigNumber,
      remainingBudget: this.miningInfo?.budget ? (this.miningInfo.budget as BigNumber).minus(this.miningInfo?.minedBudget as BigNumber || _0) : _0,
      miningFee24h: this.miningUserInfo?.deltaTotalFee || _0,
      miningReward24h: this.miningUserInfo?.deltaTotalEarnSATORI || _0,
      paid: (this.miningUserInfo?.paidSATORI || _0) as BigNumber,
      unpaid: (this.miningUserInfo?.unPaidSATORI || _0) as BigNumber,
    }
  }

  get noData() {
    return this.tableBody.length <= 0
  }

  get tableBody() {
    this.loading = true
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
    this.loading = false
    return result
  }

  mounted() {
    this.getMiningInfo()
    this.updatePrice()
  }

  async updatePrice() {
    try {
      await this.updateTokenPrice([SATORI_ADDRESS])
    } catch (e) {
      await this.updatePrice()
    }
  }

  async getMiningInfo() {
    await this.callGraphApiFunc(async () => {
      this.loading = true
      try {
        const data = await queryTransactionMiningInfo(currentChainConfig.subgraphConfig.transactionMiningSubgraph)
        this.miningInfo = data.miningInfo
      } catch (e) {
        await this.getMiningInfo()
      } finally {
        this.loading = false
      }
    })
    if (this.miningInfo) {
      await Promise.all(this.miningInfo.pools.map(p => this.updateLiquidityPool(p)))
    }
  }

  @Watch('address', { immediate: true })
  async getMiningUserInfo() {
    if (!this.address) {
      return
    }
    await this.callGraphApiFunc(async () => {
      try {
        this.loadingUserInfo = true
        const blockInfo = await queryBlockByTimestamp(moment().subtract(1, 'day').unix(), currentChainConfig.subgraphConfig.blockSubgraph)
        const data = await queryTransactionMiningUserInfo(this.address!.toLowerCase(), currentChainConfig.subgraphConfig.transactionMiningSubgraph, blockInfo.block ? Number(blockInfo.block.number) : undefined)
        this.miningUserInfo = data.user
      } catch (e) {
        await this.getMiningUserInfo()
      } finally {
        this.loadingUserInfo = false
      }
    })
  }
}
