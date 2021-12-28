import { SUPPORTED_NETWORK_ID } from '@/constants'

export const daoPool: { [targetNetwork: number]: string[] } = {
  [SUPPORTED_NETWORK_ID.ARB]: ['0xab324146c49b23658e5b3930e641bdbdf089cbac', '0xc7b2ad78fded2bbc74b50dc1881ce0f81a7a0cca'],
  [SUPPORTED_NETWORK_ID.ARB_TESTNET]: ['0xc32a2dfee97e2babc90a2b5e6aef41e789ef2e13'],
  [SUPPORTED_NETWORK_ID.BSC]: ['0xdb282bbace4e375ff2901b84aceb33016d0d663d', '0x2ea001032b0EB424120B4dEC51Bf02DB0dF46c78'.toLowerCase()]
}
