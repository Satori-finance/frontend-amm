import { Component, Mixins, Watch } from 'vue-property-decorator'
import { ErrorHandlerMixin } from "@/mixins"
import { ethers } from "ethers"
import { Provider } from "@ethersproject/providers"
import BigNumber from "bignumber.js"
import {
  SATORI_ADDRESS,
  SATORI_ADDRESS_CONFIG,
  NETWORK_PROVIDER_RPC,
  NETWORK_PROVIDER_RPC_CONFIG,
  SUPPORTED_NETWORK_ID,
} from '@/constants'
import { toBigNumber } from "@/utils"
import {  normalizeBigNumberish } from "@mcdex/mai3.js"
import { namespace } from "vuex-class"
import { DAO_STAKE_TOKEN_SYMBOL } from '@mcdex/mcdex-governance.js'
import { SUPPORTED_WALLET } from '@/business-components/wallet/wallet-connector'
import { Mcb } from '@mcdex/mcdex-governance.js/dist/abi/Mcb'
import { McbFactory } from '@mcdex/mcdex-governance.js/dist/abi/McbFactory'
import { queryBlockByTimestamp } from '@/api/block'
import moment from 'moment/moment'
import { chainConfigs } from '@/config/chain'
import { queryTokenPrice } from '@/api/token'
import { tokenMap } from '@/config/tokenMap'

const wallet = namespace('wallet')
const price = namespace('price')

@Component
export default class SATORIInfoMixin extends Mixins(ErrorHandlerMixin) {
  @wallet.State('walletType') walletType!: SUPPORTED_WALLET | null
  @wallet.Getter('address') userAddress !: string | null
  @price.Getter('tokenPriceFunc') tokenPriceFunc!: (token: string, networkId: number) => BigNumber | null
  @price.Action('updateTokenPrice') updateTokenPrice!: (payload: { tokens: string[], networkId: number }) => Promise<void>

  private daoTokenSymbol = DAO_STAKE_TOKEN_SYMBOL
  private currentTotalSupply: BigNumber = toBigNumber('0')
  private supplyCap: BigNumber = toBigNumber('10000000')
  private loadTimer = 0
  private currentTotalSupplyLoading: boolean = false
  private satori24hChangeRate: BigNumber | null = null

  async mounted() {
    this.updateSATORIInfo()
    this.updateTokenPrice({ tokens: [SATORI_ADDRESS_CONFIG[SUPPORTED_NETWORK_ID.ARB]], networkId: SUPPORTED_NETWORK_ID.ARB })
    this.getSATORI24hChange()
    this.loadTimer = window.setInterval(() => {
      this.updateTokenPrice({ tokens: [SATORI_ADDRESS_CONFIG[SUPPORTED_NETWORK_ID.ARB]], networkId: SUPPORTED_NETWORK_ID.ARB })
      this.getSATORI24hChange()
    }, 60000)
  }

  destroyed() {
    window.clearInterval(this.loadTimer)
  }

  async updateSATORIInfo(loadingTimes: number = 5) {
    this.currentTotalSupplyLoading = true
    try {
      loadingTimes--
      const supplyResult = await this.callChainReadFunc(async () => {
        const decimals = 18
        const mcbContract: Mcb = McbFactory.connect(SATORI_ADDRESS_CONFIG[SUPPORTED_NETWORK_ID.ARB], new ethers.providers.StaticJsonRpcProvider({ url: NETWORK_PROVIDER_RPC_CONFIG[SUPPORTED_NETWORK_ID.ARB], timeout: 30000 }))
        const [ l1, l2 ] = await Promise.all([
          await mcbContract.tokenSupplyOnL1(),
          await mcbContract.totalSupply()
        ])
        return {
          l1Supply: normalizeBigNumberish(l1).shiftedBy(-decimals),
          l2Supply: normalizeBigNumberish(l2).shiftedBy(-decimals)
        }
      },true)
      this.currentTotalSupply = supplyResult ? supplyResult.l1Supply.plus(supplyResult.l2Supply) : new BigNumber(0)
    } catch (e) {
      if (loadingTimes) {
        await this.updateSATORIInfo(loadingTimes)
      }
    }
    this.currentTotalSupplyLoading = false
  }

  get circulatingSupply(): BigNumber {
    return this.currentTotalSupply
  }

  get maxSupplyCap(): BigNumber {
    return this.supplyCap
  }

  get percentage(): BigNumber {
    return this.currentTotalSupply.div(this.supplyCap).times(100).decimalPlaces(1)
  }

  get price(): BigNumber | null {
    const SATORIPrice = this.tokenPriceFunc(SATORI_ADDRESS_CONFIG[SUPPORTED_NETWORK_ID.ARB], SUPPORTED_NETWORK_ID.ARB)
    if (SATORIPrice) {
      return SATORIPrice
    } else {
      return null
    }
  }

  get fullyDilutedValuation(): BigNumber | null {
    const SATORIPrice = this.tokenPriceFunc(SATORI_ADDRESS_CONFIG[SUPPORTED_NETWORK_ID.ARB], SUPPORTED_NETWORK_ID.ARB)
    if (SATORIPrice && this.maxSupplyCap) {
      return SATORIPrice.times(this.maxSupplyCap)
    } else {
      return null
    }
  }

  get marketCap(): BigNumber | null {
    const SATORIPrice = this.tokenPriceFunc(SATORI_ADDRESS_CONFIG[SUPPORTED_NETWORK_ID.ARB], SUPPORTED_NETWORK_ID.ARB)
    if (SATORIPrice && this.circulatingSupply && !this.currentTotalSupplyLoading) {
      return SATORIPrice.times(this.circulatingSupply)
    } else {
      return null
    }
  }

  async getSATORI24hChange() {
    const data = await this.callGraphApiFunc(async () => {
      const blockInfo = await queryBlockByTimestamp(moment().subtract(1, 'day').unix(), chainConfigs[SUPPORTED_NETWORK_ID.MAINNET].subgraphConfig.blockSubgraph)
      return await queryTokenPrice([SATORI_ADDRESS_CONFIG[SUPPORTED_NETWORK_ID.MAINNET]], blockInfo.block ? Number(blockInfo.block.number) : undefined)
    })
    const mcbPriceYesterday = data?.get(SATORI_ADDRESS_CONFIG[SUPPORTED_NETWORK_ID.MAINNET].toLowerCase())
    if (!data || !this.price || !mcbPriceYesterday) {
      return
    }
    const mcb24hChange = this.price.minus(mcbPriceYesterday).div(mcbPriceYesterday)
    this.satori24hChangeRate = mcb24hChange.times(100)
  }
}
