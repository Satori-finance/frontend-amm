import { Component, Mixins } from 'vue-property-decorator'
import { ErrorHandlerMixin, SelectedPerpetualMixin } from '@/mixins'
import { ButtonState } from '@/type'
import { namespace } from 'vuex-class'
import { ethers } from 'ethers'
import { getLiquidityPoolContract } from '@mcdex/mai3.js'
import { getGasStationTxParams } from '@/utils/gasPrice'
import { gasLimitConfig } from '@/config/gas'
import { MAX_UINT256_VALUE } from '@/const'
import { waitTransaction } from '@/utils/transaction'

const wallet = namespace('wallet')
const perpetual = namespace('perpetual')

@Component
export default class AmmUnsafeMixin extends Mixins(SelectedPerpetualMixin, ErrorHandlerMixin) {
  @wallet.Getter('signer') walletSigner!: ethers.Signer | null
  @perpetual.Action('updatePerpetual') updatePerpetual!: (perpetualID: string) => Promise<void>

  protected emergencyButtonState: ButtonState = ''

  get emergencyButtonDisabled(): boolean {
    if (this.isWrongNetwork || !this.walletSigner) {
      return true
    }
    return this.emergencyButtonState === 'loading'
  }

  async onSetEmergencyState() {
    await this.callChainFunc(async () => {
      this.emergencyButtonState = 'loading'
      if(!this.walletSigner || !this.selectedPerpetualProperty) {
        this.emergencyButtonState = 'fail'
        return
      }
      if (this.selectedPerpetualOracleIsTerminated || !this.selectedPerpetualAmmIsSafe) {
        try {
          const poolAddress = this.selectedPerpetualProperty.liquidityPoolAddress
          const poolContract = getLiquidityPoolContract(poolAddress, this.walletSigner)
          const gas = await getGasStationTxParams(gasLimitConfig.PERP_SET_EMERGENCY_GAS_LIMIT)
          const perpetualIndex = this.selectedPerpetualProperty.perpetualIndex
          const p = !this.selectedPerpetualAmmIsSafe ? MAX_UINT256_VALUE : perpetualIndex
          const setEmergencyState = await poolContract.setEmergencyState(p, gas)
          const transaction = waitTransaction(setEmergencyState)
          this.$transaction({
            transaction: transaction,
            content: this.$t('transaction.setPerpEmergencyState', {
              symbol: !this.selectedPerpetualAmmIsSafe ? this.$t('base.all').toString() : this.selectedPerpetualProperty.symbol || '',
            }).toString(),
            transactionHash: setEmergencyState.hash ? setEmergencyState.hash : '',
          })
          // refresh perpetual
          const txResult = await transaction
          await this.updatePerpetual(this.selectedPerpetualID || '')
          this.emergencyButtonState = 'success'
          return txResult
        } catch (e) {
          this.emergencyButtonState = 'fail'
          throw e
        }
      }
    })
  }
}
