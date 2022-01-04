import _ from 'lodash'
import { Perpetual } from '@/type'
import BigNumber from 'bignumber.js'
import {
  _0,
  getLiquidityPool,
  getReaderContract,
  PerpetualState,
  PerpetualStorage,
} from '@mcdex/mai3.js'
import { queryPerpetuals } from '@/api/perpetual'
import { ARB_ONE_DOMAIN, NETWORK_PROVIDER_RPC_CONFIG, SUPPORTED_NETWORK_ID } from '@/const'
import { Watch, Component, Mixins } from 'vue-property-decorator'
import { query24HPriceFromBackend } from '@/api/candle'
import { ErrorHandlerMixin } from '@/mixins'
import { queryBlockByTimestamp } from '@/api/block'
import moment from 'moment/moment'
import { arbChainConfig, bscChainConfig, CHAIN_SYMBOL, ChainConfig, currentChainConfig } from '@/config/chain'
import { ethers } from 'ethers'

interface TableData {
  chain: CHAIN_SYMBOL
  chainName: string
  chainID: number
  poolAddress: string
  perpetualID: string
  symbol: string
  underlying: string
  collateralSymbol: string
  collateralAddress: string
  liquidity: BigNumber
  indexPrice: BigNumber | null
  change24h: BigNumber | null
  deltaTotalVolumeUSD: BigNumber
  state: PerpetualState
  isInverse: boolean
}

type OracleData = { perpetuals: Perpetual[], priceInfo: Map<string, { price: BigNumber, change24hRate: BigNumber, price24H: BigNumber }>, config: ChainConfig, storage: PerpetualStorage[] }

@Component
export default class HomePerpetualMixin extends Mixins(ErrorHandlerMixin) {
  protected activeChain: CHAIN_SYMBOL | 'all' = 'all'
  protected searchKey = ''
  protected loading = 0
  protected priceLoading = false
  protected requestID = 0
  protected emergency = PerpetualState.EMERGENCY
  protected cleared = PerpetualState.CLEARED
  protected timer = 0
  protected data: OracleData[] = []

  get configs() {
    return [
      arbChainConfig,
      bscChainConfig,
    ]
  }

  get oracleChains() {
    let chains = this.configs.map(c => {
      return {
        label: c.chainName,
        value: c.chainSymbol,
        config: c,
      }
    })

    return chains
  }

  get chains() {
    return [
      {
        label: this.$t('base.all'),
        value: 'all',
      },
    ].concat(this.oracleChains)
  }

  get noData() {
    return this.tableBody.length <= 0
  }

  get totalCount(): string {
    let num = 0
    if (this.activeChain === 'all') {
      num = this.allData.length
    } else {
      num = this.allData.filter(item => item.chain === this.activeChain).length
    }
    return num >= 1000 ? '1000+' : num.toString()
  }

  get tableBody(): TableData[] {
    let data: TableData[] = []
    if (this.activeChain === 'all') {
      data = this.allData
    } else {
      data = this.allData.filter(item => item.chain === this.activeChain)
    }
    return _.orderBy(
      data,
      [
        (item) => !!item.indexPrice,
        // show larger liquidity first
        (item) => item.deltaTotalVolumeUSD.toNumber(),
        (item) => item.liquidity.toNumber(),
        // numeric
        'symbol',
      ],
      ['desc', 'desc', 'desc', 'asc'],
    ).slice(0, 10)
  }

  get allData() {
    const result = this.data.map((d) => {
      return d.perpetuals.map((item, index) => {
        return {
          chain: d.config.chainSymbol,
          chainName: d.config.chainName,
          chainID: d.config.chainID,
          poolAddress: item.liquidityPool?.id || '',
          perpetualID: item.id,
          symbol: item.symbol!,
          underlying: item.underlying || '',
          collateralSymbol: item.liquidityPool?.collateralName || '',
          collateralAddress: item.liquidityPool?.collateralAddress || '',
          liquidity: (item.liquidityPool?.poolMarginUSD as BigNumber) || _0,
          indexPrice: d.storage[index].isInversePerpetual ? new BigNumber(1).div(d.priceInfo.get(item.id)?.price || 0)
            : d.priceInfo.get(item.id)?.price || null,
          change24h: d.storage[index].isInversePerpetual ? d.priceInfo.get(item.id)?.change24hRate.times(100).negated() || null
            : d.priceInfo.get(item.id)?.change24hRate.times(100) || null,
          deltaTotalVolumeUSD: item.deltaTotalVolumeUSD as BigNumber,
          state: item.state || 0,
          isInverse: d.storage[index].isInversePerpetual,
        }
      })
    })

    return _.flatMap(result)
  }

  mounted() {
    this.getData()
  }

  isDangerPerpetual(symbol: number) {
    return symbol > 9999
  }

  goTrade(item: TableData) {
    if (currentChainConfig.chainID !== item.chainID) {
      return
    }
    window.open(`${ARB_ONE_DOMAIN}/trade/${item.symbol}`, '_self')
  }

  goPoolInfo(item: TableData) {
    if (currentChainConfig.chainID !== item.chainID) {
      return
    }
    window.open(`${ARB_ONE_DOMAIN}/pool/${item.poolAddress}/info`, '_self')
  }

  goPerpetualInfo(item: TableData) {
    if (currentChainConfig.chainID !== item.chainID) {
      return
    }
    window.open(`${ARB_ONE_DOMAIN}/pool/${item.poolAddress}/${item.symbol}`, '_self')
  }

  @Watch('searchKey')
  private search() {
    if (this.timer) {
      window.clearTimeout(this.timer)
      this.timer = 0
    }
    this.timer = window.setTimeout(async () => {
      await this.getData()
    }, 500)
  }

  private async getData() {
    this.loading++
    const requestID = ++this.requestID
    try {
      const data = await this.getPerpetualData(this.configs, this.searchKey)
      if (this.requestID === requestID) {
        this.data = data
      }
    } finally {
      this.loading--
    }
  }

  private async getPerpetualData(configs: ChainConfig[], key: string = '', retryNum = 5)
    : Promise<OracleData[]> {
    try {
      const blockInfos = await Promise.all(configs.map(config => {
        return queryBlockByTimestamp(
          moment()
            .subtract(1, 'day')
            .unix(),
          config.subgraphConfig.blockSubgraph,
        )
      }))

      const results = await Promise.all(blockInfos.map((blockInfo, index) => {
        return queryPerpetuals({
          search: key,
          subgraphUrl: configs[index].subgraphConfig.dataSubgraph,
          oldBlockNumber: blockInfo.block ? Number(blockInfo.block.number) : undefined,
        })
      }))

      const sortedDatas = results.map(r => {
        return _.orderBy(
          r.perpetuals,
          [
            (item) => item.deltaTotalVolumeUSD.toNumber(),
            (item) => ((item.liquidityPool?.poolMarginUSD as BigNumber) || _0).toNumber(),
            'symbol',
          ],
          ['desc', 'desc', 'asc'],
        ).slice(0, 10)
      })

      const [priceInfos, perpetualStorages] = await Promise.all([
        Promise.all(sortedDatas.map((data, index) => {
          return query24HPriceFromBackend(
            data.map((p) => ({
              perpetualId: p.id.split('-').join('_'),
              oracleAddress: p.oracleAddress || '',
            })),
            configs[index].backendConfig.oracleService,
          )
        })),
        Promise.all(sortedDatas.map(async (data, index) => {
          const provider = new ethers.providers.StaticJsonRpcProvider({ url: NETWORK_PROVIDER_RPC_CONFIG[configs[index].chainID], timeout: 30000 })
          const reader = await getReaderContract(provider)
          return Promise.all(data.map(async p => {
            return (await getLiquidityPool(reader, p.liquidityPool!.id)).perpetuals.get(p.index as number) as PerpetualStorage
          }))
        })),
      ])

      return [...configs.map((config, index) => {
        return {
          perpetuals: sortedDatas[index],
          priceInfo: priceInfos[index].priceInfo,
          config: config,
          storage: perpetualStorages[index],
        }
      })]
    } catch (e) {
      if (retryNum <= 0) {
        throw e
      }
      return await this.getPerpetualData(configs, key, retryNum - 1)
    }
  }
}
