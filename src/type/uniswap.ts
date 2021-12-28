import { Pool } from '@uniswap/v3-sdk'
import { BigintIsh, Token } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk/dist/constants'
import { TickDataProvider } from '@uniswap/v3-sdk/dist/entities/tickDataProvider'
import { Tick, TickConstructorArgs } from '@uniswap/v3-sdk/dist/entities/tick'

export class ExtendedPool extends Pool {
  id: string = ''
  constructor(id: string, tokenA: Token, tokenB: Token, fee: FeeAmount, sqrtRatioX96: BigintIsh, liquidity: BigintIsh, tickCurrent: number, ticks?: TickDataProvider | (Tick | TickConstructorArgs)[]) {
    super(tokenA, tokenB, fee, sqrtRatioX96, liquidity, tickCurrent, ticks);
    this.id = id
  }
}
