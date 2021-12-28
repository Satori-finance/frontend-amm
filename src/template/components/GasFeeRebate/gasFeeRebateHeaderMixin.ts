import { Component, Mixins, Watch } from 'vue-property-decorator'
import { currentChainEpochGasFeeRebateRate, gasFeeRebateIsEnd } from './gasFeeRebateConfig'
import { GasFeeRebateClaimMixin } from '@/template/components/GasFeeRebate/gasFeeRebateClaimMixin'

@Component
export class GasFeeRebateHeaderMixin extends Mixins(GasFeeRebateClaimMixin) {

  mounted() {
    this.checkAccountAllEpochIsClaimed()
  }

  get currentGasFeeRebateRate() {
    return currentChainEpochGasFeeRebateRate
  }

  get gasFeeRebateIsEnd() {
    return gasFeeRebateIsEnd
  }

  @Watch('provider')
  onProviderChanged() {
    if (!this.provider) {
      return
    }
    this.checkAccountAllEpochIsClaimed()
  }
}
