import { Mixins, Component, Prop } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import { LiquidationTableItem } from 'src/template/components/Liquidation/liquidationMixin'
import BigNumber from 'bignumber.js'

@Component
export class LiquidationTakeOverMixin extends Mixins(ErrorHandlerMixin) {
  @Prop({ required: true }) liquidationInfo!: LiquidationTableItem | null

  protected confirmButtonLoading: boolean = false

  protected form = {
    position: '',
    positionPercentage: 0
  }

  private formRule = {
    position: [],
  }

  get position(): string {
    return this.form.position
  }

  set position(val: string) {
    this.form.position = val
  }

  setPositionPercentage(val: number) {
    this.form.positionPercentage = val
  }

  get collateralSymbol(): string {
    return this.liquidationInfo?.collateralSymbol || ''
  }

  get underlyingSymbol(): string {
    return this.liquidationInfo?.underlyingSymbol || ''
  }

  get underlyingDecimals(): number {
    return this.liquidationInfo?.underlyingDecimals || 0
  }

  get collateralDecimals(): number {
    return this.liquidationInfo?.collateralDecimals || 0
  }

  get positionSize(): BigNumber | null {
    return this.liquidationInfo?.position || null
  }

  get liquidationPenalty(): BigNumber | null {
    return this.liquidationInfo?.liquidationPenalty || null
  }

  get markPrice(): BigNumber | null {
    return this.liquidationInfo?.markPrice || null
  }

  get myPosition(): BigNumber {
    return new BigNumber(0)
  }

  get availableCollateral(): BigNumber {
    return new BigNumber(0)
  }

  get leverage(): BigNumber {
    return new BigNumber(0)
  }

  get liqPrice(): BigNumber {
    return new BigNumber(0)
  }

  get diffPosition(): BigNumber {
    return new BigNumber('1')
  }

  get diffAvailableCollateral(): BigNumber {
    return new BigNumber(0)
  }

  get diffLeverage(): BigNumber {
    return new BigNumber(0)
  }

  get diffLiqPrice(): BigNumber {
    return new BigNumber(0)
  }

  onConfirmEvent() {

  }

}