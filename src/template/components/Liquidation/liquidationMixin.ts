import { Mixins, Component } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import BigNumber from 'bignumber.js'
import { isDangerPerpetual } from '@/utils/perpetual'
import { padLeft } from '@/utils/common'


export interface LiquidationTableItem {
  trader: string
  symbol: number
  poolAddress: string
  underlyingSymbol: string
  collateralSymbol: string
  position: BigNumber
  markPrice: BigNumber
  notionalSize: BigNumber
  liquidationPenalty: BigNumber
  keeperGasReward: BigNumber
  underlyingDecimals: number
  collateralDecimals: number
}

@Component
export class LiquidationMixin extends Mixins(ErrorHandlerMixin) {

  protected loading: boolean = false
  protected currentPage: number = 1
  protected listCount: number = 0
  protected isDangerPerpetual = isDangerPerpetual
  protected padLeft = padLeft
  protected currentLiquidationItem: LiquidationTableItem | null = null

  get tableData (): LiquidationTableItem[] {
    // TODO MOCK
    return [
      {
        trader: '0xb2ee6cfdc59a8bf89209cc849fe2e36ded7c9fe6',
        symbol: 1,
        poolAddress: '',
        underlyingSymbol: 'ETH',
        collateralSymbol: 'USDC',
        position: new BigNumber('100'),
        markPrice: new BigNumber('1200'),
        notionalSize: new BigNumber('120000'),
        liquidationPenalty: new BigNumber('0.2'),
        keeperGasReward: new BigNumber('0.4'),
        underlyingDecimals: 5,
        collateralDecimals: 2
      },
      {
        trader: '0xb2ee6cfdc59a8bf89209cc849fe2e36ded7c9fe6',
        symbol: 10001,
        poolAddress: '',
        underlyingSymbol: 'ETH',
        collateralSymbol: 'USDC',
        position: new BigNumber('100'),
        markPrice: new BigNumber('1200'),
        notionalSize: new BigNumber('120000'),
        liquidationPenalty: new BigNumber('0.2'),
        keeperGasReward: new BigNumber('0.4'),
        underlyingDecimals: 5,
        collateralDecimals: 2
      }]
  }

  get noData (): boolean {
    return this.tableData.length === 0
  }

  onLiquidateEvent() {

  }
}
