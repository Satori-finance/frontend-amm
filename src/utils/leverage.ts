import BigNumber from 'bignumber.js'

export function getLeverageFlag(leverage: number) {
  return new BigNumber(new BigNumber(leverage).toFormat(2)).times(100).toNumber() << 7
}
