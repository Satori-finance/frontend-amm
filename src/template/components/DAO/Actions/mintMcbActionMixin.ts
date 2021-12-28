import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import { MintSATORIActionDatas } from '@/template/components/DAO/Actions/types'
import { TARGET_NETWORK_ID } from '@/constants'
import BigNumber from 'bignumber.js'
import { Provider } from '@ethersproject/providers'
import { namespace } from 'vuex-class'
import { _0, DECIMALS, normalizeBigNumberish } from '@mcdex/mai3.js'
import { getMinterContract, CHAIN_ID_TO_DAO_MINTER_ADDRESS, DAO_STAKE_TOKEN_SYMBOL } from '@mcdex/mcdex-governance.js'
import _ from 'lodash'
import { ethers } from 'ethers'

const wallet = namespace('wallet')

@Component
export default class MintMcbActionMixin extends Mixins(ErrorHandlerMixin) {
  @Prop({ required: true }) actionIndex !: number
  @Prop({ required: true }) actionDefaultDatas !: MintSATORIActionDatas
  @wallet.Getter('providerL1') providerL1!: Provider | null
  @wallet.Getter('provider') provider!: Provider | null

  private daoTokenSymbol: string = DAO_STAKE_TOKEN_SYMBOL

  protected actionDatasForm: MintSATORIActionDatas = this.actionDefaultDatas
  protected mintableBalance: BigNumber = new BigNumber(0)

  get normalizeAmount(): BigNumber {
    return this.actionDatasForm.amount ? new BigNumber(this.actionDatasForm.amount) : _0
  }

  get invalidAmount(): boolean {
    return this.normalizeAmount.isNaN() || this.normalizeAmount.lte(_0) ||
      this.normalizeAmount.gt(this.mintableBalance)
  }

  get invalidReceiveAddress(): boolean {
    return !ethers.utils.isAddress(this.actionDatasForm.receiveAddress)
  }

  getDataFunc = _.debounce(async () => {
    await this.getMintableBalance()
  }, 200)

  async getMintableBalance() {
    await this.callChainReadFunc(async () => {
      if(!this.provider) {
        return
      }
      const minterContract = getMinterContract(CHAIN_ID_TO_DAO_MINTER_ADDRESS[TARGET_NETWORK_ID], this.provider)
      const mintableAmounts = await minterContract.callStatic.getMintableAmounts()
      this.mintableBalance = normalizeBigNumberish(mintableAmounts.baseMintableAmount).shiftedBy(-DECIMALS)
    })
  }

  @Watch('provider', { immediate: true })
  onProviderChanged() {
    this.getDataFunc()
  }

  @Watch('actionDefaultDatas')
  onActionIndexChanged() {
    this.actionDatasForm = this.actionDefaultDatas
  }

  @Watch('actionDatasForm', { deep: true })
  onActionDatasChanged() {
    this.$emit('update', this.actionIndex, this.actionDatasForm)
  }
}
