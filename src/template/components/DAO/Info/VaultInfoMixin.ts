import { Component, Mixins, Watch } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import { ethers } from 'ethers'
import { Provider } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import { NETWORK_PROVIDER_RPC_CONFIG, SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/const'
import { toBigNumber } from '@/utils'
import { queryCapturedFeeUSD } from '@/api/dao'
import { _0, DECIMALS, normalizeBigNumberish } from '@mcdex/mai3.js'
import {
  getMinterContract,
  getValueCaptureContract,
  CHAIN_ID_TO_DAO_MINTER_ADDRESS,
  CHAIN_ID_TO_DAO_VALUE_CAPTURE_ADDRESS,
  DAO_STAKE_TOKEN_SYMBOL
} from '@mcdex/mcdex-governance.js'
import { namespace } from 'vuex-class'
import moment from 'moment/moment'
import { queryBlockByTimestamp } from '@/api/block'
import { chainConfigs } from '@/config/chain'

const wallet = namespace('wallet')
const price = namespace('price')

@Component
export default class VaultInfoMixin extends Mixins(ErrorHandlerMixin) {
  @wallet.Getter('signer') walletSigner!: ethers.Signer | null
  @wallet.Getter('address') userAddress !: string | null

  private provider = new ethers.providers.StaticJsonRpcProvider({ url: NETWORK_PROVIDER_RPC_CONFIG[SUPPORTED_NETWORK_ID.ARB], timeout: 30000 })
  private daoTokenSymbol = DAO_STAKE_TOKEN_SYMBOL
  private totalCapturedValue: BigNumber = toBigNumber('0')
  private capturedValue24h: BigNumber = toBigNumber('0')
  private mintableSATORI: BigNumber = toBigNumber('0')
  private capturedValueLoading: Boolean = false
  private mintableSATORILoading: Boolean = false

  @Watch('userAddress', { immediate: true })
  async getCapturedValue24h () {
    this.capturedValueLoading = true
    // get current total captured fee usd
    let data = await this.callGraphApiFunc(() => {
      return queryCapturedFeeUSD('satoriDao', undefined, chainConfigs[SUPPORTED_NETWORK_ID.ARB].subgraphConfig.daoSubgraph)
    })
    if (!data || data.capturedValues.length === 0) {
      return
    }
    this.totalCapturedValue = new BigNumber(data.capturedValues[0].totalCapturedUSD)

    // get before24h total captured fee usd
    data = await this.callGraphApiFunc(async () => {
      const blockInfo = await queryBlockByTimestamp(moment().subtract(1, 'day').unix(), chainConfigs[SUPPORTED_NETWORK_ID.ARB].subgraphConfig.blockSubgraph)
      return queryCapturedFeeUSD('satoriDao', blockInfo.block ? Number(blockInfo.block.number) : undefined)
    })
    if (!data || data.capturedValues.length === 0) {
      return
    }
    let before24hCapturedFeeUSD = data.capturedValues[0].totalCapturedUSD
    this.capturedValue24h = new BigNumber(this.totalCapturedValue).minus(new BigNumber(before24hCapturedFeeUSD))
    this.capturedValueLoading = false
  }

  @Watch('provider', { immediate: true })
  async onProviderChangedToUpdate() {
    this.mintableSATORILoading = true
    const mintableSATORI = await this.callChainReadFunc(async () => {
      if (!this.provider) {
        return new BigNumber('0')
      }
      const minterContract = getMinterContract(CHAIN_ID_TO_DAO_MINTER_ADDRESS[SUPPORTED_NETWORK_ID.ARB], this.provider)
      const mintableAmounts = await minterContract.callStatic.getMintableAmounts()
      const baseMintableAmount = normalizeBigNumberish(mintableAmounts.baseMintableAmount).shiftedBy(-DECIMALS)
      let seriesAMintableAmount = _0
      if (mintableAmounts.roundMintableAmounts.length > 0) {
        seriesAMintableAmount = normalizeBigNumberish(mintableAmounts.roundMintableAmounts[0]).shiftedBy(-DECIMALS)
      }
      return seriesAMintableAmount.plus(baseMintableAmount)
    })
    if (mintableSATORI) {
      this.mintableSATORILoading = false
      this.mintableSATORI = mintableSATORI.toString()
    }
  }
}
