// operator configure

import { NETWORK_ENV, SUPPORTED_NETWORK_ID } from '@/constants'

export let operatorWhiteList: { [operatorAddress: string]: string } = {}

if (NETWORK_ENV.CHAIN_ID === SUPPORTED_NETWORK_ID.S10POA) {
  operatorWhiteList = {
    '0x00ccd6299d50f87dd1c7ce29a9950d9033e3d732': 'SATORI DAO',
  }
} else if (NETWORK_ENV.CHAIN_ID === SUPPORTED_NETWORK_ID.KOVAN) {
  operatorWhiteList = {
    '0xa2aAD83466241232290bEbcd43dcbFf6A7f8d23a': 'SATORI DAO',
  }
} else if (NETWORK_ENV.CHAIN_ID === SUPPORTED_NETWORK_ID.ARB_TESTNET) {
  operatorWhiteList = {
    '0xa2aAD83466241232290bEbcd43dcbFf6A7f8d23a': 'SATORI DAO',
  }
} else if (NETWORK_ENV.CHAIN_ID === SUPPORTED_NETWORK_ID.ARB) {
  operatorWhiteList = {
    '0x904b5993fc92979eeedc19ccc58bed6b7216667c': 'SATORI DAO',
    '0x25c646AdF184051B35A405B9aaEBA321E8d5342a': 'SATORI DAO',
    '0xe9e60660459428e43aba1c334d1246747f2aa856': 'SATORI DAO',
    '0x867d38b15594f294284e23e571963b787124bb3a': 'Lemma.Finance',
  }
} else if (NETWORK_ENV.CHAIN_ID === SUPPORTED_NETWORK_ID.OPTIMISM_TESTNET) {
  operatorWhiteList = {
    '0x904b5993fc92979eeedc19ccc58bed6b7216667c': 'SATORI DAO',
    '0x25c646AdF184051B35A405B9aaEBA321E8d5342a': 'SATORI DAO',
  }
} else if (NETWORK_ENV.CHAIN_ID === SUPPORTED_NETWORK_ID.OPTIMISM) {
  operatorWhiteList = {
    '0xa2aAD83466241232290bEbcd43dcbFf6A7f8d23a': 'SATORI DAO',
  }
} else if (NETWORK_ENV.CHAIN_ID === SUPPORTED_NETWORK_ID.BSC) {
  operatorWhiteList = {
    '0xcfa46e1b666fd91bf39028055d506c1e4ca5ad6e': 'SATORI DAO',
    '0x69c1a51711b061e5935c648beb16e349898b17df': 'dForceDAO',
    '0x87bf9c6459c05c136bf74d010691cd79d36dbe0f': 'OpenDAO',
    '0x42e8e7446b01a8b907adccd0094012199592870b': 'DeCus DAO'
  }
}

export function getOperatorName(operatorAddress: string): string {
  return operatorWhiteList[operatorAddress.toLowerCase()] || operatorAddress
}
