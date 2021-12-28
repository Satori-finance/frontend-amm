import { Component, Prop, Vue } from 'vue-property-decorator'
import { PerpetualStorage } from '@mcdex/mai3.js'
import { PerpetualCombinedState, PerpetualProperty } from '../type'
import { namespace } from 'vuex-class'

const perpetual = namespace('perpetual')

@Component
export class PerpetualStorageMixin extends Vue {
  @perpetual.Getter('getPerpetualFunc') getPerpetualFunc!: (perpetualID: string) => PerpetualCombinedState | null
  @perpetual.Action('updatePerpetual') updatePerpetual!: (perpetualID: string) => Promise<void>

  @Prop() perpetualID: string | null = null

  get perpetual(): PerpetualCombinedState | null {
    if (!this.perpetualID || !this.getPerpetualFunc) {
      return null
    }
    return this.getPerpetualFunc(this.perpetualID)
  }

  get perpetualProperty(): PerpetualProperty | null {
    return this.perpetual ? this.perpetual.perpetualProperty : null
  }

  get perpetualStorage(): PerpetualStorage | null {
    return this.perpetual ? this.perpetual.perpetualStorage : null
  }

  get collateralFormatDecimals(): number | null {
    return this.perpetualProperty ? this.perpetualProperty.collateralFormatDecimals : null
  }

  get underlyingAssetFormatDecimals(): number | null {
    return this.perpetualProperty ? this.perpetualProperty.underlyingAssetFormatDecimals : null
  }

  get underlyingAssetSymbol(): string {
    return this.perpetualProperty ? this.perpetualProperty.underlyingAssetSymbol : '--'
  }

  get collateralTokenSymbol(): string {
    return this.perpetualProperty ? this.perpetualProperty.collateralTokenSymbol : '--'
  }
}
