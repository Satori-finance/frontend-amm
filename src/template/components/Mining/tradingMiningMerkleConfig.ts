export type TradingMiningEpochClaimUsers = { [epoch: number]: string[][] }

export let tradingMiningMerkleConfig: { [chainId: number]: TradingMiningEpochClaimUsers } = {}

window.SATORI_CONFIG?.onResolve('tradingMiningMerkle').then(config => {
  tradingMiningMerkleConfig = config
})
