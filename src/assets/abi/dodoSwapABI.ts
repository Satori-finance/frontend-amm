export const dodoSwapMiningABI= [
  "function getRewardNum() view returns(uint256)",
  "function rewardTokenInfos(uint256) view returns(address,uint256,uint256,address,uint256,uint256,uint256)"
]

export const dodoSwapPoolABI = [
  "function totalSupply() view returns(uint256)",
  "function balanceOf(address) view returns(uint256)",
  "function decimals() view returns(uint8)",
  "function rewardTokenInfos(uint256) view returns(address,uint256,uint256,address,uint256,uint256,uint256)"
]
