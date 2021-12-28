import { Component, Mixins } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'

@Component
export class UniswapMiningPoolMixin extends Mixins(ErrorHandlerMixin) {

  get uniswapMiningPoolOptions() {
    return [
        {
        value: '0x10cfa744c77f1cb9a77fa418ac4a1b6ec62bcce4',
        label: 'Uniswap SATORI-ETH'
      },
      {
        value: '0x4c508567eaea699f61483c933184d351e7ecb862',
        label: 'Uniswap SATORI-USDC'
      }
    ]
  }

}