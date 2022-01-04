import { Component, Vue, Watch } from 'vue-property-decorator'
import {
  _0,
  CHAIN_ID_INVERSE_SERVICE_ADDRESS,
  CHAIN_ID_TO_ORACLE_ROUTER_CREATOR_ADDRESS,
  CHAIN_ID_TO_POOL_CREATOR_ADDRESS,
  CHAIN_ID_TO_TUNABLE_ORACLE_REGISTER_ADDRESS,
  CHAIN_ID_TO_UNISWAP_V3_ORACLE_ROUTER_CREATOR_ADDRESS,
  CHAIN_ID_TO_UNISWAP_V3_TOOL_ADDRESS,
  DECIMALS,
  erc20Decimals,
  getERC20Contract,
  getInverseStateService,
  getLiquidityPool,
  getLiquidityPoolContract,
  getLpGovernorContract,
  getOracleRouterCreatorContract,
  getOracleRouterKey,
  getPoolCreatorContract,
  getReaderContract,
  getUniswapV3OracleKey,
  LiquidityPool,
  Reader,
  SymbolServiceFactory,
  UniswapV3OracleAdaptorCreatorFactory,
  UniswapV3ToolFactory,
} from '@mcdex/mai3.js'
import { DataNotFoundError } from '@/type'
import { ellipsisMiddle, toBigNumber } from '@/utils'
import { getGasStationTxParams } from '@/utils/gasPrice'
import { gasLimitConfig } from '@/config/gas'
import {
  EMPTY_ADDRESS,
  MAX_INT256_VALUE,
  TARGET_NETWORK_ID,
  UNISWAP_V3_FACTORY_ADDRESS,
} from '@/const'
import { LiquidityContractParams, LiquidityOracleParams, LiquidityPoolParams, RiskParams } from '@/template/Pool/type'
import { ethers } from 'ethers'
import { namespace } from 'vuex-class'
import { CreateNewPerpetualPoolProposal } from '@/template/components/Pool/poolProposalMixin'
import { Provider } from '@ethersproject/providers'
import { OracleLinkWithTunable } from '@/config/oracle'
import { UniswapOracle } from '@/business-components/SelectPerpetualOracle/types'
import _ from 'lodash'
import BigNumber from 'bignumber.js'
import { waitTransaction } from '@/utils/transaction'
import { TunableOracleRegisterFactory } from '@mcdex/mai3.js/dist/abi/TunableOracleRegisterFactory'

const wallet = namespace('wallet')

@Component
export default class CreatePerpetualMixin extends Vue {
  @wallet.Getter('signer') signer!: ethers.Signer | null
  @wallet.Getter('provider') provider!: Provider
  @wallet.Getter('isConnectedWallet') isConnectedWallet !: boolean

  selectedPool: LiquidityPoolParams | null = null
  selectedOracle: LiquidityOracleParams | null = null
  contractParams: LiquidityContractParams | null = null
  riskParams: RiskParams | null = null
  creatingPool: boolean = false
  creatingOracle: boolean = false
  settingPerpetualInverseState: boolean = false
  creatingPerpetual: boolean = false
  creatingProposal: boolean = false
  runningPool: boolean = false
  increasingObservationCardinality: boolean = false
  ran: boolean = false
  reader: Reader | null = null

  get isUniswapOracle() {
    return this.selectedOracle && this.selectedOracle.oracleRouterPath && !_.isArray(this.selectedOracle.oracleRouterPath)
  }

  get observationCardinality() {
    if (!this.isUniswapOracle) {
      return 0
    }
    const oracleRouterPath = this.selectedOracle!.oracleRouterPath as UniswapOracle
    // observationCardinality = t/13.3 + 3 * sqrt(t/13.3)
    const t = Math.max(oracleRouterPath.markPriceTWAP, oracleRouterPath.indexPriceTWAP)
    const temp = new BigNumber(t).div(13.3)
    return temp.sqrt().times(3).plus(temp).dp(0, BigNumber.ROUND_UP).toNumber()
  }

  async increaseObservationCardinality() {
    if (!this.isUniswapOracle || this.observationCardinality < 1) {
      return
    }
    if (!this.signer) {
      throw new DataNotFoundError('signer')
    }
    try {
      this.increasingObservationCardinality = true
      const toolContract = UniswapV3ToolFactory.connect(CHAIN_ID_TO_UNISWAP_V3_TOOL_ADDRESS[TARGET_NETWORK_ID], this.signer)
      const oracleRouterPath = this.selectedOracle!.oracleRouterPath as UniswapOracle
      const promiseInstance = await toolContract.increaseObservationCardinalityNext(UNISWAP_V3_FACTORY_ADDRESS, oracleRouterPath.route.tokenPath.map(t => t.address), oracleRouterPath.route.pools.map(p => p.fee), this.observationCardinality)
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.expandUniswap').toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      await transaction
    } catch (e) {
      console.error('expand uniswap error', e)
      throw e
    } finally {
      this.increasingObservationCardinality = false
    }
  }

  async createProposal(governor: string, oracleAddress: string) {
    if (
      !this.selectedOracle ||
      !this.contractParams ||
      !this.riskParams ||
      !this.selectedPool ||
      !this.signer
    ) {
      throw new DataNotFoundError('selectedOracle | contractParams | riskParams')
    }
    try {
      this.creatingProposal = true
      const proposal = new CreateNewPerpetualPoolProposal()
      proposal.buildProposalByParams(
        oracleAddress,
        [
          this.contractParams.initialMarginRate.shiftedBy(DECIMALS).toFixed(0),
          this.contractParams.maintenanceMarginRate.shiftedBy(DECIMALS).toFixed(0),
          this.contractParams.operatorFeeRate.shiftedBy(DECIMALS).toFixed(0),
          this.contractParams.lpFeeRate.shiftedBy(DECIMALS).toFixed(0),
          this.contractParams.referrerRebateRate.shiftedBy(DECIMALS).toFixed(0),
          this.contractParams.liquidationPenaltyRate.shiftedBy(DECIMALS).toFixed(0),
          this.contractParams.keeperGasReward.shiftedBy(DECIMALS).toFixed(0),
          this.contractParams.insuranceFundRate.shiftedBy(DECIMALS).toFixed(0),
          this.contractParams.maxOpenInterestRate.shiftedBy(DECIMALS).toFixed(0),
        ],
        [
          this.riskParams.halfSpread.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.openSlippage.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.closeSlippage.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.fundingRateLimit.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.ammMaxLeverage.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.closePriceDiscount.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.fundingRateFactor.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.defaultTargetLeverage.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.baseFundingRate.shiftedBy(DECIMALS).toFixed(0),
        ],
        [
          this.riskParams.minHalfSpread.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.minOpenSlippage.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.minCloseSlippage.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.minFundingRateLimit.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.minAMMMaxLeverage.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.minClosePriceDiscount.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.minFundingRateFactor.shiftedBy(DECIMALS).toFixed(0),
          '0', // defaultTargetLeverage
          this.riskParams.minBaseFundingRate.shiftedBy(DECIMALS).toFixed(0),
        ],
        [
          this.riskParams.maxHalfSpread.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.maxOpenSlippage.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.maxCloseSlippage.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.maxFundingRateLimit.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.maxAMMMaxLeverage.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.maxClosePriceDiscount.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.maxFundingRateFactor.shiftedBy(DECIMALS).toFixed(0),
          MAX_INT256_VALUE, // defaultTargetLeverage
          this.riskParams.maxBaseFundingRate.shiftedBy(DECIMALS).toFixed(0),
        ],
        {
          underlyingSymbol: this.selectedOracle.underlyingAsset,
          collateralSymbol: this.selectedPool.collateralSymbol,
        },
      )
      const lpGovernorContract = getLpGovernorContract(governor, this.signer)
      const transaction = await proposal.createProposal(governor, this.signer)
      const transactionResult = waitTransaction(transaction, lpGovernorContract)
      this.$transaction({
        location: 'top',
        transaction: transactionResult,
        content: this.$t('transaction.createProposal').toString(),
        transactionHash: transaction.hash ? transaction.hash : '',
      })
      return await transactionResult
    } catch (e) {
      console.error('create new perpetual proposal', e)
      throw e
    } finally {
      this.creatingProposal = false
    }
  }

  async createPerpetual(
    pool: LiquidityPool,
    oracleAddress: string,
  ): Promise<{ liquidityPool: string; perpetualIndex: number; symbol: number }> {
    if (!this.selectedOracle || !this.contractParams || !this.riskParams || !this.selectedPool || !this.signer) {
      throw new DataNotFoundError('selectedOracle | contractParams | riskParams')
    }
    try {
      this.creatingPerpetual = true
      const gas = await getGasStationTxParams(gasLimitConfig.CREATE_PERPETUAL_GAS_LIMIT)

      const promiseInstance = await pool.createPerpetual(
        oracleAddress,
        [
          this.contractParams.initialMarginRate.shiftedBy(DECIMALS).toFixed(0),
          this.contractParams.maintenanceMarginRate.shiftedBy(DECIMALS).toFixed(0),
          this.contractParams.operatorFeeRate.shiftedBy(DECIMALS).toFixed(0),
          this.contractParams.lpFeeRate.shiftedBy(DECIMALS).toFixed(0),
          this.contractParams.referrerRebateRate.shiftedBy(DECIMALS).toFixed(0),
          this.contractParams.liquidationPenaltyRate.shiftedBy(DECIMALS).toFixed(0),
          this.contractParams.keeperGasReward.shiftedBy(DECIMALS).toFixed(0),
          this.contractParams.insuranceFundRate.shiftedBy(DECIMALS).toFixed(0),
          this.contractParams.maxOpenInterestRate.shiftedBy(DECIMALS).toFixed(0),
        ],
        [
          this.riskParams.halfSpread.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.openSlippage.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.closeSlippage.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.fundingRateLimit.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.ammMaxLeverage.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.closePriceDiscount.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.fundingRateFactor.shiftedBy(DECIMALS).toFixed(0),
          this.contractParams.defaultTargetLeverage.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.baseFundingRate.shiftedBy(DECIMALS).toFixed(0),
        ],
        [
          this.riskParams.minHalfSpread.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.minOpenSlippage.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.minCloseSlippage.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.minFundingRateLimit.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.minAMMMaxLeverage.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.minClosePriceDiscount.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.minFundingRateFactor.shiftedBy(DECIMALS).toFixed(0),
          0, // defaultTargetLeverage
          this.riskParams.minBaseFundingRate.shiftedBy(DECIMALS).toFixed(0),
        ],
        [
          this.riskParams.maxHalfSpread.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.maxOpenSlippage.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.maxCloseSlippage.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.maxFundingRateLimit.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.maxAMMMaxLeverage.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.maxClosePriceDiscount.shiftedBy(DECIMALS).toFixed(0),
          this.riskParams.maxFundingRateFactor.shiftedBy(DECIMALS).toFixed(0),
          MAX_INT256_VALUE, // defaultTargetLeverage
          this.riskParams.maxBaseFundingRate.shiftedBy(DECIMALS).toFixed(0),
        ],
        gas,
      )
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.createPerpetual', {
          name: `${this.selectedOracle.underlyingAsset}-${this.selectedPool.collateralSymbol}`,
        }).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      const receipt = await transaction
      if (receipt.status === 0) {
        throw new Error('failed to deploy')
      }

      const symbolService = SymbolServiceFactory.connect(EMPTY_ADDRESS, this.signer)
      const events: Array<| null
        | (ethers.utils.Result & {
        liquidityPool?: string
        perpetualIndex?: ethers.BigNumber
        symbol?: ethers.BigNumber
      })> = receipt.logs
        .map((l) => {
          try {
            const log = symbolService.interface.parseLog(l)
            if (log.name === 'AllocateSymbol') {
              return log.args
            }
            return null
          } catch {
            return null
          }
        })
        .filter((i) => i !== null)
      if (events.length === 0) {
        // ignore the error
        return { symbol: 0, liquidityPool: '', perpetualIndex: 0 }
      }
      return {
        liquidityPool: events[0]?.liquidityPool || '',
        perpetualIndex: events[0]?.perpetualIndex?.toNumber() || 0,
        symbol: events[0]?.symbol?.toNumber() || 0,
      }
    } catch (e) {
      console.error('create perpetual', e)
      throw e
    } finally {
      this.creatingPerpetual = false
    }
  }

  async createLiquidityPool() {
    this.creatingPool = true
    try {
      const creator = getPoolCreatorContract(CHAIN_ID_TO_POOL_CREATOR_ADDRESS[TARGET_NETWORK_ID], this.signer!)
      const gas = await getGasStationTxParams(gasLimitConfig.CREATE_POOL_GAS_LIMIT)
      let promiseInstance
      let newPoolAddress

      const now = Date.now()
      const erc20Contract = getERC20Contract(this.selectedPool!.collateralAddress, this.signer!)
      const collateralDecimals = await erc20Decimals(erc20Contract)
      const insuranceFundCap = toBigNumber(this.selectedPool?.insuranceFundCap)
      const initData = ethers.utils.defaultAbiCoder.encode(
        ['bool', 'int256', 'uint256', 'uint256'],
        [
          this.selectedPool?.isFastCreationEnabled || false,
          insuranceFundCap.shiftedBy(DECIMALS).toFixed(0),
          '0', // liquidity cap
          '1', // shareTransferDelay
        ],
      )
      newPoolAddress = await creator.callStatic.createLiquidityPool(
        this.selectedPool!.collateralAddress,
        collateralDecimals,
        now,
        initData,
      )
      promiseInstance = await creator.createLiquidityPool(
        this.selectedPool!.collateralAddress,
        collateralDecimals,
        now,
        initData,
        gas,
      )

      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.createPool', { collateral: this.selectedPool!.collateralSymbol }).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      await transaction
      return getLiquidityPoolContract(newPoolAddress.liquidityPool, this.signer!)
    } catch (e) {
      console.error('create pool', e)
      throw e
    } finally {
      this.creatingPool = false
    }
  }

  async createTunableOracleFunc(poolAddress: string, oracleAddress: string): Promise<string> {
    const tunableRegisterAddress = CHAIN_ID_TO_TUNABLE_ORACLE_REGISTER_ADDRESS[TARGET_NETWORK_ID]
    if (!tunableRegisterAddress) {
      throw Error(`invalid register address in ${TARGET_NETWORK_ID}`)
    }
    const tunableRegisterContract = TunableOracleRegisterFactory.connect(tunableRegisterAddress, this.signer!)
    const gas = await getGasStationTxParams(gasLimitConfig.NEW_TUNABLE_ORACLE_GAS_LIMIT)
    const newOracle = await tunableRegisterContract.newTunableOracle(poolAddress, oracleAddress, gas)
    const transaction = waitTransaction(newOracle)
    this.$transaction({
      transaction: transaction,
      content: this.$t('transaction.createTunableOracle', {externalAddress: ellipsisMiddle(oracleAddress)}).toString(),
      transactionHash: newOracle.hash ? newOracle.hash : '',
    })
    const receipt = await transaction

    const events = receipt.logs.map(log => {
      try {
        return tunableRegisterContract.interface.parseLog(log)
      } catch (e) {
        return null
      }
    })
    const tunableOracleCreatedEvent = events.find(event => event && event.name === 'TunableOracleCreated')
    const address = tunableOracleCreatedEvent?.args?.newOracle || null
    if (!address) {
      throw Error('Create tunable oracle failed')
    }
    return address
  }

  async createOracleRouter(): Promise<string> {
    const creator = getOracleRouterCreatorContract(CHAIN_ID_TO_ORACLE_ROUTER_CREATOR_ADDRESS[TARGET_NETWORK_ID], this.signer!)
    const gas = await getGasStationTxParams(gasLimitConfig.CREATE_ORACLE_GAS_LIMIT)
    const oracleRouterPath = this.selectedOracle!.oracleRouterPath as OracleLinkWithTunable[]
    const path = oracleRouterPath.map(item => ({
      oracle: item.oracle.address,
      isInverse: item.inverse,
      isTunable: item.isTunable,
    }))

    const promiseInstance = await creator.createOracleRouter(path, gas)
    const transaction = waitTransaction(promiseInstance)
    this.$transaction({
      transaction: transaction,
      content: this.$t('transaction.createOracle').toString(),
      transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
    })
    await transaction
    return await creator.routers(getOracleRouterKey(path))
  }

  async createUniswapV3Oracle() {
    const oracleRouterPath = this.selectedOracle!.oracleRouterPath as UniswapOracle
    // short -> index, long -> mark, 0 < short <= long
    const shortPeriod = oracleRouterPath.indexPriceTWAP
    const longPeriod = oracleRouterPath.markPriceTWAP
    if (shortPeriod <= 0 || shortPeriod > longPeriod) {
      throw new Error('Uniswap oracle twap conditions are not met')
    }
    const creator = UniswapV3OracleAdaptorCreatorFactory.connect(CHAIN_ID_TO_UNISWAP_V3_ORACLE_ROUTER_CREATOR_ADDRESS[TARGET_NETWORK_ID], this.signer!)
    const gas = await getGasStationTxParams(gasLimitConfig.CREATE_ORACLE_GAS_LIMIT)
    const promiseInstance = await creator.createAdaptor(
      UNISWAP_V3_FACTORY_ADDRESS,
      oracleRouterPath.route.tokenPath.map(v => v.address),
      oracleRouterPath.route.pools.map(v => v.fee),
      shortPeriod,
      longPeriod,
      gas,
    )
    const transaction = waitTransaction(promiseInstance)
    this.$transaction({
      transaction: transaction,
      content: this.$t('transaction.createOracle').toString(),
      transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
    })
    await transaction
    const key = getUniswapV3OracleKey(
      oracleRouterPath.route.tokenPath.map(v => v.address),
      oracleRouterPath.route.pools.map(v => v.fee),
      shortPeriod,
      longPeriod,
    )
    return await creator.adaptors(key)
  }

  async createOracle() {
    if (!this.selectedOracle) {
      throw Error('invalid selectedOracle')
    }
    this.creatingOracle = true
    try {
      if (_.isArray(this.selectedOracle.oracleRouterPath)) {
        return await this.createOracleRouter()
      } else {
        return await this.createUniswapV3Oracle()
      }
    } catch (e) {
      console.error('create oracle', e)
      throw e
    } finally {
      this.creatingOracle = false
    }
  }

  async setPerpetualInverse(
    liquidityPoolAddress: string,
    perpetualIndex: number,
  ) {
    if (!this.contractParams) {
      throw Error('invalid contractParams')
    }
    this.settingPerpetualInverseState = true
    try {
      const contract = getInverseStateService(CHAIN_ID_INVERSE_SERVICE_ADDRESS[TARGET_NETWORK_ID], this.signer!)
      const promiseInstance = await contract.setInverseState(liquidityPoolAddress, perpetualIndex, this.contractParams.isInverse)
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.setContractDisplay').toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      return await transaction
    } catch (e) {
      console.error('set perpetual inverse', e)
      throw e
    } finally {
      this.settingPerpetualInverseState = false
    }
  }

  async runPool(liquidityPool: LiquidityPool) {
    if (!this.selectedPool) {
      return
    }
    try {
      this.runningPool = true
      const reader = await getReaderContract(liquidityPool.provider)
      const liquidityPoolStorage = await getLiquidityPool(reader, liquidityPool.address)
      const gasLimit = liquidityPoolStorage.perpetuals.size * gasLimitConfig.RUN_POOL_GAS_LIMIT_K + gasLimitConfig.RUN_POOL_GAS_LIMIT_B
      const gas = await getGasStationTxParams(gasLimit)
      const promiseInstance = await liquidityPool.runLiquidityPool(gas)
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.runPool', { collateral: this.selectedPool.collateralSymbol }).toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      await transaction
      this.ran = true
    } catch (e) {
      console.error('run pool', e)
    } finally {
      this.runningPool = false
    }
  }

  @Watch('signer', { immediate: true })
  async onSignerChange() {
    if (this.signer) {
      this.reader = await getReaderContract(this.signer)
    }
  }
}
