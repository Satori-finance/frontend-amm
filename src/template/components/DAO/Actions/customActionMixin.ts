import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import { CustomActionDatas } from '@/template/components/DAO/Actions/types'
import BigNumber from 'bignumber.js'
import { _0 } from '@mcdex/mai3.js'
import { ethers } from 'ethers'
import { currentChainConfig } from '@/config/chain'

@Component
export default class CustomActionMixin extends Mixins(ErrorHandlerMixin) {
  @Prop({ required: true }) actionIndex !: number
  @Prop({ required: true }) actionDefaultDatas !: CustomActionDatas

  protected actionDatasForm: CustomActionDatas = this.actionDefaultDatas

  get valueSymbol(): string {
    return currentChainConfig.symbol
  }

  get normalizeValue(): BigNumber {
    return this.actionDatasForm.value ? new BigNumber(this.actionDatasForm.value) : _0
  }

  get invalidAssetValue(): boolean {
    return this.normalizeValue.isNaN() || this.normalizeValue.lt(_0)
  }

  get invalidTo(): boolean {
    return !ethers.utils.isAddress(this.actionDatasForm.to)
  }

  get invalidCallData(): boolean {
    return this.actionDatasForm.callData === ''
  }

  get invalidSignature(): boolean {
    return this.actionDatasForm.signature === ''
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
