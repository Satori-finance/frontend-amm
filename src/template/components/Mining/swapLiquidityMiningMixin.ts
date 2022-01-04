import { Component, Mixins, Watch } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import BigNumber from 'bignumber.js'
import { namespace } from 'vuex-class'
import { queryBalancerMiningPoolInfo } from '@/api/balancerSwap'
import { toBigNumber } from '@/utils'
import { querySushiSwapMiningPoolInfo, querySushiSwapPairInfo } from '@/api/sushiSwap'
import { ADDRESS_ZERO } from '@uniswap/v3-sdk'
import { Provider } from '@ethersproject/providers'
import { Contract, ethers } from 'ethers'
import { dodoSwapMiningABI, dodoSwapPoolABI } from '@/assets/abi/dodoSwapABI'
import { _0, balanceOf, erc20Decimals, getERC20Contract, IERC20Factory } from '@mcdex/mai3.js'
import { NETWORK_PROVIDER_RPC_CONFIG, SUPPORTED_NETWORK_ID } from '@/const'
import { estimateBlockTime } from '@/utils/chain'
import { pancakeSwapMasterChefABI } from '@/assets/abi/pancakeSwapABI'
import moment from 'moment'
import { queryTokenPrice } from '@/api/token'
import { chainConfigs } from '@/config/chain'

interface SuShiMiningPoolInfo {
  pairAddress: string
  defaultRewardToken: {
    symbol: string,
    address: string
  }
}

interface BalancerMiningPoolInfo {
  poolAddress: string
  miningToken: {
    symbol: string
    weekReward: number
    address: string
  }[]
}

interface DODOMiningPoolInfo {
  poolAddress: string
  miningAddress: string
}

interface PancakeMiningPoolInfo {
  masterChefAddress: string
  pid: number
  lpApy: number
}

interface SwapPairItem {
  token0: {
    symbol: string
    address: string
    icon: string
  }
  token1: {
    symbol: string
    address: string
    icon: string
  }
}

export interface SwapLiquidityMiningPoolItem {
  poolType: 'sushi' | 'balancer' | 'dodo' | 'pancake'
  swapName: string
  iconName: string
  chainId: SUPPORTED_NETWORK_ID
  miningCoins: string[]
  pair: SwapPairItem
  show: boolean
  providerChangedUpdate: boolean
  apy: BigNumber | null
  apyCallFunc: (data: any) => Promise<BigNumber | null>
  comingSoon: boolean
  learMoreKey: string
  tutorialLink: string
  participateLink: string
  tipKey: string
  miningStartTimestampFunc: (provider?: Provider, providerL1?: Provider) => Promise<number>
  miningStartTimestamp: number
  miningPoolInfo: SuShiMiningPoolInfo | BalancerMiningPoolInfo | DODOMiningPoolInfo | PancakeMiningPoolInfo
}

const price = namespace('price')
const wallet = namespace('wallet')

@Component
export default class SwapLiquidityMiningMixin extends Mixins(ErrorHandlerMixin) {
  @price.Action('updateTokenPrice') updateTokenPrice!: (payload: { tokens: string[], networkId: SUPPORTED_NETWORK_ID }) => Promise<void>
  @price.Getter('tokenPriceFunc') tokenPriceFunc!: (token: string, networkId: SUPPORTED_NETWORK_ID) => BigNumber | null

  private loadingPoolInfoIndex = new Set<number>()

  protected loading: boolean = false

  protected miningPoolList: SwapLiquidityMiningPoolItem[] = [
    {
      poolType: 'pancake',
      swapName: 'Pancake',
      iconName: 'CAKE',
      miningCoins: ['CAKE'],
      chainId: SUPPORTED_NETWORK_ID.BSC,
      pair: {
        token0: {
          symbol: 'SATORI',
          icon: require('@/assets/img/tokens/SATORI.svg'),
          address: '0x5fe80d2cd054645b9419657d3d10d26391780a7b',
        },
        token1: {
          symbol: 'BNB',
          icon: require('@/assets/img/tokens/BNB.svg'),
          address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
        },
      },
      show: true,
      providerChangedUpdate: true,
      apy: null,
      apyCallFunc: this.getPancakeMiningApy,
      comingSoon: false,
      learMoreKey: 'pancakeMcbBnbToolTip',
      tutorialLink: 'https://docs.pancakeswap.finance/products/yield-farming/how-to-use-farms',
      participateLink: 'https://pancakeswap.finance/farms',
      tipKey: 'pancakeMcbBnb',
      miningStartTimestamp: 1634299499,
      miningStartTimestampFunc: async (): Promise<number> => {
        const provider = new ethers.providers.StaticJsonRpcProvider({
          url: NETWORK_PROVIDER_RPC_CONFIG[SUPPORTED_NETWORK_ID.BSC],
          timeout: 30000,
        })

        if (!provider) {
          return moment().unix()
        }
        const startBlock = 11793300
        const blockNumber = await provider.getBlockNumber()
        if (blockNumber >= startBlock) {
          return 0
        }
        return estimateBlockTime(blockNumber, startBlock, SUPPORTED_NETWORK_ID.BSC)
      },
      miningPoolInfo: {
        pid: 463,
        masterChefAddress: '0x73feaa1eE314F8c655E354234017bE2193C9E24E',
        lpApy: 0,
      },
    },
    {
      poolType: 'dodo',
      swapName: 'DODO',
      iconName: 'DODO',
      miningCoins: ['DODO', 'SATORI'],
      chainId: SUPPORTED_NETWORK_ID.ARB,
      pair: {
        token0: {
          symbol: 'SATORI',
          icon: require('@/assets/img/tokens/SATORI.svg'),
          address: '0x4e352cf164e64adcbad318c3a1e222e9eba4ce42',
        },
        token1: {
          symbol: 'USDC',
          icon: require('@/assets/img/tokens/USDC.svg'),
          address: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
        },
      },
      show: false,
      providerChangedUpdate: true,
      apy: null,
      apyCallFunc: this.getDODOMiningApy,
      comingSoon: false,
      learMoreKey: 'dodoMcbUsdcToolTip',
      tutorialLink: 'https://dodoexhelp.zendesk.com/hc/en-us/articles/900005558383-How-to-participate-in-liquidity-mining-on-DODO-',
      participateLink: 'https://app.dodoex.io/liquidity?network=arbitrum&poolAddress=0x34851ea13bde818b1efe26d31377906b47c9bbe2',
      tipKey: 'dodoMcbUsdc',
      miningStartTimestamp: 1631707200,
      miningStartTimestampFunc: async (): Promise<number> => {
        return 0
      },
      miningPoolInfo: {
        poolAddress: '0x34851ea13bde818b1efe26d31377906b47c9bbe2',
        miningAddress: '0x98ceb851af3d8627287885d56aea863b848ceb6f',
      },
    },
    {
      poolType: 'balancer',
      swapName: 'Balancer',
      iconName: 'BAL',
      miningCoins: ['BAL', 'SATORI'],
      chainId: SUPPORTED_NETWORK_ID.ARB,
      pair: {
        token0: {
          symbol: 'SATORI',
          icon: require('@/assets/img/tokens/SATORI.svg'),
          address: '0x4e352cf164e64adcbad318c3a1e222e9eba4ce42',
        },
        token1: {
          symbol: 'ETH',
          icon: require('@/assets/img/tokens/ETH.svg'),
          address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
        },
      },
      show: false,
      providerChangedUpdate: false,
      apy: null,
      apyCallFunc: this.getBalancerMiningApy,
      comingSoon: false,
      learMoreKey: 'balancerMcbEthToolTip',
      tutorialLink: 'https://docs.balancer.fi/getting-started/walkthroughs/invest',
      participateLink: 'https://arbitrum.balancer.fi/#/pool/0xb5b77f1ad2b520df01612399258e7787af63025d000200000000000000000010',
      tipKey: 'balancerMcbEth',
      miningStartTimestamp: 1632096000,
      miningStartTimestampFunc: async (): Promise<number> => {
        return 1632096000
      },
      miningPoolInfo: {
        poolAddress: '0xb5b77f1ad2b520df01612399258e7787af63025d',
        miningToken: [
          {
            symbol: 'BAL',
            weekReward: 1600,
            address: '0x040d1edc9569d4bab2d15287dc5a4f10f56a56b8',
          }, {
            symbol: 'SATORI',
            weekReward: 875,
            address: '0x4e352cf164e64adcbad318c3a1e222e9eba4ce42',
          },
        ],
      },
    },
    {
      poolType: 'sushi',
      swapName: 'SuShiSwap',
      iconName: 'SUSHI',
      miningCoins: ['SUSHI', 'SATORI'],
      chainId: SUPPORTED_NETWORK_ID.ARB,
      pair: {
        token0: {
          symbol: 'USDC',
          icon: require('@/assets/img/tokens/USDC.svg'),
          address: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
        },
        token1: {
          symbol: 'ETH',
          icon: require('@/assets/img/tokens/ETH.svg'),
          address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
        },
      },
      show: false,
      providerChangedUpdate: false,
      apy: null,
      apyCallFunc: this.getSuShiSwapMiningApy,
      comingSoon: false,
      learMoreKey: '',
      tutorialLink: '',
      participateLink: '',
      tipKey: 'default',
      miningStartTimestamp: 0,
      miningStartTimestampFunc: async (): Promise<number> => {
        return 0
      },
      miningPoolInfo: {
        pairAddress: '0x905dfcd5649217c42684f23958568e533c711aa3',
        defaultRewardToken: {
          symbol: 'SUSHI',
          address: '0xd4d42f0b6def4ce0383636770ef773390d85c61a',
        },
      },
    },
  ]

  protected loadTimer = 0
  protected chainConfigs = chainConfigs

  mounted() {
    this.updatePoolsMiningInfo()

    this.loadTimer = window.setInterval(() => {
      this.updatePoolsMiningInfo()
    }, 60 * 1000)
  }

  beforeDestroy() {
    window.clearInterval(this.loadTimer)
  }

  poolIsStartMining(t: number): boolean {
    return Date.now() / 1000 >= t
  }

  async getSuShiSwapMiningApy(poolInfo: SwapLiquidityMiningPoolItem): Promise<BigNumber | null> {
    try {
      const miningPoolInfo: SuShiMiningPoolInfo = poolInfo.miningPoolInfo as SuShiMiningPoolInfo

      const [pairs, miniChefInfo] = await Promise.all([
        querySushiSwapPairInfo(miningPoolInfo.pairAddress),
        querySushiSwapMiningPoolInfo(miningPoolInfo.pairAddress),
      ])
      if (!pairs || pairs.pairs.length === 0 || !miniChefInfo || miniChefInfo.pools.length === 0
        || miniChefInfo.miniChefs.length === 0) {
        throw new Error(`graph query has null, [pair: ${JSON.stringify(pairs)}], [miniChefInfo: ${JSON.stringify(miniChefInfo)}]`)
      }

      const pair = pairs.pairs[0]
      const miniChef = miniChefInfo.miniChefs[0]
      const pool = miniChefInfo.pools[0]

      const tokens: string[] = [miningPoolInfo.defaultRewardToken.address.toLowerCase()]
      if (pool.rewarder.rewardToken != ADDRESS_ZERO) {
        tokens.push(pool.rewarder.rewardToken.toLowerCase())
      }
      await this.updateTokenPrice({ tokens, networkId: poolInfo.chainId })

      const averageBlockTime = 0.01
      const blocksPerDay = 86400 / Number(averageBlockTime)

      const tvl = ((): BigNumber | null => {
        // (pool.balance / 1e18) / pair.totalSupply * pair.reserveUSD
        return toBigNumber(pool.slpBalance).div(1e18).div(pair.totalSupply).times(pair.reserveUSD)
      })()

      const rewardUsdValue = ((): BigNumber | null => {
        let r: BigNumber = new BigNumber(0)
        // default reward value
        const sushiPerBlock = toBigNumber(miniChef.sushiPerSecond).div(1e18).times(averageBlockTime)
        const rewardPerBlock = toBigNumber(pool.allocPoint).div(miniChef.totalAllocPoint).times(sushiPerBlock)
        const rewardPerDay = rewardPerBlock.times(blocksPerDay)
        const defaultRewardCoinPrice = this.tokenPriceFunc(miningPoolInfo.defaultRewardToken.address.toLowerCase(), poolInfo.chainId)
        if (!defaultRewardCoinPrice) {
          return null
        }
        r = r.plus(rewardPerDay.times(defaultRewardCoinPrice))
        // owner set reward
        const decimals = 1e18
        if (pool.rewarder.rewardToken != ADDRESS_ZERO) {
          const ownerSetReward = toBigNumber(pool.rewarder.rewardPerSecond).div(decimals).times(averageBlockTime).times(blocksPerDay)
          const price = this.tokenPriceFunc(pool.rewarder.rewardToken.toLowerCase(), poolInfo.chainId)
          if (!price) {
            return null
          }
          r = r.plus(ownerSetReward.times(price))
        }
        return r
      })()

      if (!tvl || !rewardUsdValue) {
        throw new Error(`value has null, totalLiquidity:
        [tvl: ${tvl?.toFixed() || null}],
        [rewardUsdValue: ${rewardUsdValue?.toFixed() || null}]`)
      }
      return rewardUsdValue.div(tvl).times(365).times(100)
    } catch (e) {
      console.warn(`get ${poolInfo.pair.token0.symbol}/${poolInfo.pair.token1.symbol} sushiSwap mining apy fail, `, e)
    }
    return null
  }

  async getBalancerMiningApy(poolInfo: SwapLiquidityMiningPoolItem): Promise<BigNumber | null> {
    try {
      const miningPoolInfo: BalancerMiningPoolInfo = poolInfo.miningPoolInfo as BalancerMiningPoolInfo

      const queryPoolResult = await queryBalancerMiningPoolInfo(miningPoolInfo.poolAddress)
      let tokens = [
        poolInfo.pair.token0.address.toLowerCase(), poolInfo.pair.token1.address.toLowerCase(),
        ...miningPoolInfo.miningToken.map((item) => item.address.toLowerCase()),
      ]
      if (!queryPoolResult || queryPoolResult.pools.length === 0) {
        throw new Error(`graph query has null, [miningPoolInfo: ${queryPoolResult}]`)
      }

      const pool = queryPoolResult.pools[0]

      pool.tokens.forEach((item) => {
        tokens.push(item.address.toLowerCase())
      })
      await this.updateTokenPrice({ tokens: Array.from(new Set(tokens)), networkId: poolInfo.chainId })

      const totalSwapFee = pool.totalSwapFee as BigNumber
      const totalLiquidity = ((): BigNumber | null => {
        let r: BigNumber = new BigNumber(0)
        for (let i = 0; i < pool.tokens.length; i++) {
          const token = pool.tokens[i]
          const price = this.tokenPriceFunc(token.address.toLowerCase(), poolInfo.chainId)
          if (!price) {
            return pool.totalLiquidity as BigNumber
          }
          r = r.plus(price.times(token.balance))
        }
        return r
      })()
      const rewardCoinValue = ((): BigNumber | null => {
        let r: BigNumber = new BigNumber(0)
        for (let i = 0; i < miningPoolInfo.miningToken.length; i++) {
          const token = miningPoolInfo.miningToken[i]
          const reward = toBigNumber(token.weekReward / 7)
          const price = this.tokenPriceFunc(token.address.toLowerCase(), poolInfo.chainId)
          if (!price) {
            return null
          }
          r = r.plus(reward.times(price))
        }
        return r
      })()
      if (!totalLiquidity || !rewardCoinValue || !totalSwapFee) {
        throw new Error(`value has null, totalLiquidity:
        [totalLiquidity: ${totalLiquidity?.toFixed() || null}],
        [rewardCoinValue: ${rewardCoinValue?.toFixed() || null}],
        [totalSwapFee: ${totalSwapFee.toFixed() || null}]`)
      }
      // totalRewardUsdValue * 365 / totalLiquidity
      const rewardApy = rewardCoinValue.div(totalLiquidity).times(365).times(100)
      // totalSwapFee * 365 / totalLiquidity
      const feeApy = totalSwapFee.times(365).div(totalLiquidity)
      return rewardApy.plus(feeApy)
    } catch (e) {
      console.warn(`get ${poolInfo.pair.token0.symbol}/${poolInfo.pair.token1.symbol} balancer mining apy fail, `, e)
    }
    return null
  }

  async getDODOMiningApy(poolInfo: SwapLiquidityMiningPoolItem): Promise<BigNumber | null> {
    try {
      const miningPoolInfo: DODOMiningPoolInfo = poolInfo.miningPoolInfo as DODOMiningPoolInfo
      const provider = new ethers.providers.StaticJsonRpcProvider({
        url: NETWORK_PROVIDER_RPC_CONFIG[poolInfo.chainId],
        timeout: 30000,
      })
      if (!provider) {
        throw new Error('provider not ready')
      }
      const poolContract = new Contract(miningPoolInfo.poolAddress, dodoSwapPoolABI, provider)
      const miningContract = new Contract(miningPoolInfo.miningAddress, dodoSwapMiningABI, provider)

      const averageBlockTime = 12.893
      const blocksPerDay = 86400 / Number(averageBlockTime)

      const rewardTokesListFunc = async (): Promise<{
        token: string
        rewardPerBlock: BigNumber
      }[]> => {
        let rList: {
          token: string
          rewardPerBlock: BigNumber
        }[] = []
        const tokenNum = Number((await miningContract.getRewardNum()).toString())
        for (let i = 0; i < tokenNum; i++) {
          // rewardToken: index -> 0, rewardPerBlock: index -> 4
          const info = await miningContract.rewardTokenInfos(i)
          const tokenDecimals = await erc20Decimals(getERC20Contract(info[0], provider))
          rList.push({
            token: info[0],
            rewardPerBlock: toBigNumber(info[4].toString()).shiftedBy(-tokenDecimals),
          })
        }
        return rList
      }

      const tvlTokenListFunc = async (): Promise<{
        token: string
        balance: BigNumber
      }[]> => {
        const getBalance = async (address: string): Promise<BigNumber> => {
          const erc20Contract = getERC20Contract(address, provider)
          const decimals = await erc20Decimals(erc20Contract)
          return await balanceOf(erc20Contract, miningPoolInfo.poolAddress, decimals)
        }
        const [token0Balance, token1Balance] = await Promise.all([
          getBalance(poolInfo.pair.token0.address),
          getBalance(poolInfo.pair.token1.address),
        ])
        const r = [
          {
            token: poolInfo.pair.token0.address,
            balance: token0Balance,
          },
          {
            token: poolInfo.pair.token1.address,
            balance: token1Balance,
          },
        ]
        return r
      }
      const [dlpTotalSupply, miningPoolDLPBalance, rewardTokesList, tvlTokenList] = await Promise.all([
        poolContract.totalSupply(),
        poolContract.balanceOf(miningPoolInfo.miningAddress),
        rewardTokesListFunc(),
        tvlTokenListFunc(),
      ])

      await this.updateTokenPrice({
        tokens: [
          ...rewardTokesList.map(item => item.token),
          ...tvlTokenList.map(item => item.token),
        ], networkId: poolInfo.chainId,
      })

      const tvl = ((): BigNumber | null => {
        let r = new BigNumber(0)
        tvlTokenList.forEach(item => {
          const price = this.tokenPriceFunc(item.token, poolInfo.chainId)
          if (!price) {
            return null
          }
          r = r.plus(
            item.balance.times(price),
          )
        })
        return toBigNumber(miningPoolDLPBalance.toString()).div(dlpTotalSupply.toString()).times(r)
      })()

      const rewardTokensUsdValue = ((): BigNumber | null => {
        let r = new BigNumber(0)
        rewardTokesList.forEach(item => {
          const price = this.tokenPriceFunc(item.token, poolInfo.chainId)
          if (!price) {
            return null
          }
          r = r.plus(
            item.rewardPerBlock.times(blocksPerDay).times(price),
          )
        })
        return r
      })()

      if (!tvl || !rewardTokensUsdValue) {
        throw new Error(`value has null, totalLiquidity:
        [tvl: ${tvl?.toFixed() || null}],
        [rewardTokensUsdValue: ${rewardTokensUsdValue?.toFixed() || null}]`)
      }

      return rewardTokensUsdValue.div(tvl).times(365).times(100)
    } catch (e) {
      console.warn(`get ${poolInfo.pair.token0.symbol}/${poolInfo.pair.token1.symbol} DODO Swap mining apy fail, `, e)
    }
    return null
  }

  async getPancakeMiningApy(poolInfo: SwapLiquidityMiningPoolItem): Promise<BigNumber | null> {
    // apy = cake apr + lp apy
    // yearly cake rewards = pool allocPoint * CAKE_PER_YEAR / totalAllocPoint
    // cake apy = yearly cake rewards * cake price * 100 / pool liquidity usd
    // lp apy = 配置

    const CAKE_PER_BLOCK = 40
    const BLOCKS_PER_YEAR = (60 / 3) * 60 * 24 * 365 // 10512000
    const CAKE_PER_YEAR = CAKE_PER_BLOCK * BLOCKS_PER_YEAR
    const CAKE_ADDRESS = '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82'

    const provider = new ethers.providers.StaticJsonRpcProvider({
      url: NETWORK_PROVIDER_RPC_CONFIG[poolInfo.chainId],
      timeout: 30000,
    })
    const info = poolInfo.miningPoolInfo as PancakeMiningPoolInfo
    const masterChef = new Contract(info.masterChefAddress, pancakeSwapMasterChefABI, provider)
    const [pancakePoolInfo, totalAllocPoint] = await Promise.all([
      masterChef.poolInfo(info.pid),
      masterChef.totalAllocPoint(),
    ])
    const [lpAddress, allocPoint, lastRewardBlock, accCakePerShare] = pancakePoolInfo
    const yearlyCakeRewards = new BigNumber(allocPoint.toString()).div(totalAllocPoint.toString()).times(CAKE_PER_YEAR)

    const erc20 = IERC20Factory.connect(poolInfo.pair.token1.address, provider)
    const lpTokenContract = IERC20Factory.connect(lpAddress, provider)
    const [erc20Balance, decimals, lpTokenInMC, lpTokenTotalSupply] = await Promise.all([
      erc20.balanceOf(lpAddress),
      erc20.decimals(),
      lpTokenContract.balanceOf(info.masterChefAddress),
      lpTokenContract.totalSupply(),
    ])
    const token1Balance = new BigNumber(erc20Balance.toString()).shiftedBy(-new BigNumber(decimals.toString()).toNumber())
    const lpFarmRatio = new BigNumber(lpTokenInMC.toString()).div(lpTokenTotalSupply.toString())
    const priceResult = await queryTokenPrice([poolInfo.pair.token1.address, CAKE_ADDRESS], undefined, SUPPORTED_NETWORK_ID.BSC)
    const token1Price = priceResult.get(poolInfo.pair.token1.address) || _0
    const cakePrice = priceResult.get(CAKE_ADDRESS) || _0
    const poolLiquidityUSD = token1Balance.times(2).times(token1Price).times(lpFarmRatio)
    const cakeApy = yearlyCakeRewards.times(cakePrice).times(100).div(poolLiquidityUSD)
    return cakeApy.plus(info.lpApy)
  }

  updatePoolsMiningInfo() {
    for (let i = 0; i < this.miningPoolList.length; i++) {
      const poolInfo = this.miningPoolList[i]
      this.computePoolMiningInfo(poolInfo, i)
    }
  }

  async computePoolMiningInfo(poolInfo: SwapLiquidityMiningPoolItem, index: number) {
    if (this.loadingPoolInfoIndex.has(index)) {
      return
    }
    this.loadingPoolInfoIndex.add(index)
    const updateApyFunc = async (sPoolInfo: SwapLiquidityMiningPoolItem) => {
      let apy: BigNumber | null = null
      if (!poolInfo.show || poolInfo.comingSoon) {
        apy = null
      } else {
        apy = await poolInfo.apyCallFunc(poolInfo)
      }
      this.$set(this.miningPoolList, index, {
        ...sPoolInfo,
        apy: apy,
      })
    }

    const updateStartTimestampFunc = async () => {
      const startTimestamp = await poolInfo.miningStartTimestampFunc()
      const newPoolInfo = {
        ...poolInfo,
        miningStartTimestamp: startTimestamp,
      }
      this.$set(this.miningPoolList, index, newPoolInfo)
      if (this.poolIsStartMining(startTimestamp)) {
        updateApyFunc(newPoolInfo)
      }
    }
    await updateStartTimestampFunc()
    this.loadingPoolInfoIndex.delete(index)
  }
}
