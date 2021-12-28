<template>
  <div class="create-contract">
    <BaseCardFrame :title="$t('newContract.createNewContract')">
      <div slot="content" class="body">
        <div class="operator-guidebook" v-html="$t('newContract.operatorGuidebook')"></div>
        <div class="create-steps">
          <el-collapse v-model="activeItem">
            <el-collapse-item class="step-item" :class="{ 'is-finished': selectPoolFinished }" name="select-pool">
              <template slot="title">
                <span class="step-title">
                  <span class="icon"></span>
                  <i class="el-icon-circle-check"></i>
                  <span class="mc-font-h5-bold">{{ $t('newContract.step1') }}</span>
                </span>
              </template>
              <div>
                <SelectPool
                  ref="selectPoolRef"
                  :readonly="enableCreate"
                  :creating="creating"
                  @change="onSelectedPoolChange"
                  :created="createSuccess"
                />
              </div>
            </el-collapse-item>
            <el-collapse-item class="step-item" :class="{ 'is-finished': selectOracleFinished }" name="select-oracle">
              <template slot="title">
                <span class="step-title">
                  <span class="icon"></span>
                  <i class="el-icon-circle-check"></i>
                  <span class="mc-font-h5-bold">{{ $t('newContract.step2') }}</span>
                </span>
              </template>
              <div>
                <SelectOracle
                  :readonly="enableCreate"
                  ref="selectOracleRef"
                  :creating="creating"
                  @change="onSelectedOracleChange"
                  :collateral-symbol="collateralSymbol"
                  :created="createSuccess"
                  :collateral-address="collateralAddress"
                  :collateral-decimals="collateralDecimals"
                />
              </div>
            </el-collapse-item>
            <el-collapse-item
              class="step-item"
              :class="{ 'is-finished': contractParamsFinished }"
              name="contract-params"
            >
              <template slot="title">
                <span class="step-title">
                  <span class="icon"></span>
                  <i class="el-icon-circle-check"></i>
                  <span class="mc-font-h5-bold">{{ $t('newContract.step3') }}</span>
                </span>
              </template>
              <div>
                <ContractParameters
                  :readonly="enableCreate"
                  ref="contractParamsRef"
                  :creating="creating"
                  @change="onContractParamsChange"
                  :collateral-symbol="collateralSymbol"
                  :underlying-symbol="underlyingAsset"
                  :created="createSuccess"
                  :selected-oracle="selectedOracle"
                  :select-pool-address="selectedPool ? selectedPool.liquidityPoolAddress : null"
                />
              </div>
            </el-collapse-item>
            <el-collapse-item class="step-item" :class="{ 'is-finished': riskParamsFinished }" name="risk-params">
              <template slot="title">
                <span class="step-title">
                  <span class="icon"></span>
                  <i class="el-icon-circle-check"></i>
                  <span class="mc-font-h5-bold">{{ $t('newContract.step4') }}</span>
                </span>
              </template>
              <div>
                <SetRiskParams
                  ref="riskParamsRef"
                  :readonly="enableCreate"
                  :creating="creating"
                  @change="onRiskParamsChange"
                  :created="createSuccess"
                  :oracle-info="oracleInfo"
                  :collateral-info="collateralInfo"
                  :contract-params="contractParams"
                />
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>

        <div class="step-container" v-if="enableCreate && (!createSuccess || !setPerpetualInverseSucceed)">
          <h1 class="submit-title mc-font-h3-bold">{{ $t('base.submitToBlockchain') }}</h1>

          <div class="content-box">
            <div class="actions">
              <el-button type="secondary" @click="onEditConfig" :disabled="creating || hasCreatedPool"
              >{{ $t('base.editConfiguration') }}
              </el-button>
              <McSteps
                ref="createSteps"
                :start-label="isCreatePerpetual ? $t('base.createPerpetual') : $t('base.createProposal')"
              >
                <template #start="prop">
                  <el-button
                    size="large"
                    class="create-button"
                    @click="prop.start.start"
                    :disabled="isCreatePerpetual ? disableCreatePerpetual : disableCreateProposal"
                  >
                    {{ prop.start.label }}
                    <i v-if="prop.start.running" class="el-icon-loading"></i>
                  </el-button>
                  <span v-if="!isCreatePerpetual && poolHasActiveProposal" class="warning-text">{{
                      $t('pool.poolProposal.hasActiveProposalTip')
                    }}</span>
                </template>
                <McStepItem
                  v-for="(step, index) in steps"
                  :label="$t(step.labelKey)"
                  :key="index"
                  :action="step.action"
                />
              </McSteps>
            </div>

            <el-alert class="error-alert-msg" type="error" v-if="errorMsg" :closable="false">{{ errorMsg }}</el-alert>
          </div>
        </div>

        <div
          class="success-info"
          v-if="createSuccess && selectedPool && isCreatePerpetual && setPerpetualInverseSucceed"
        >
          <h1 class="success-title mc-font-h3-bold">{{ $t('newContract.successTitle') }}</h1>
          <div class="success-message mc-font-p14">{{ $t('newContract.successMessage', { symbol: contract }) }}</div>
          <div class="new-pool-message mc-font-p14">
            <i class="el-icon-warning-outline"></i><span>{{ $t('newContract.newPoolMessage') }}</span>
          </div>
          <div class="new-pool-message mc-font-p14">
            <i class="el-icon-warning-outline"></i><span>{{ $t('newContract.operatorCheckInTip') }}</span>
          </div>
          <div class="button-container">
            <el-button type="secondary" :disabled="runningPool" @click="reset">
              {{ $t('newContract.continueAddPerpetual') }}
            </el-button>
            <el-button
              v-if="isCreatePerpetual && selectedPool.liquidityPoolStatus === 1 && !ran"
              :loading="runningPool"
              @click="onRunPool"
            >{{ $t('newContract.runPool') }}
            </el-button>
            <el-button type="secondary" :disabled="runningPool" @click="toAddLiquidityPage" v-else>
              {{ $t('pool.liquidityPage.addLiquidity') }}
            </el-button>
          </div>
        </div>

        <div class="success-info" v-if="createSuccess && selectedPool && !isCreatePerpetual">
          <h1 class="success-title mc-font-h3-bold">{{ $t('newContract.successProposalTitle') }}</h1>
          <div class="success-message mc-font-p14">{{ $t('newContract.successProposalMessage') }}</div>
          <div class="button-container">
            <el-button @click="toProposalPage">{{ $t('newContract.viewProposalDetail') }}</el-button>
          </div>
        </div>
      </div>
    </BaseCardFrame>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Ref, Watch } from 'vue-property-decorator'
import { BaseCardFrame, McStepItem, McSteps, McStepStatus } from '@/components'
import SelectPool from './SelectPool.vue'
import SelectOracle from './SelectOracle.vue'
import ContractParameters from './ContractParameters.vue'
import SetRiskParams from './SetRiskParams.vue'
import {
  CollateralInfo,
  LiquidityContractParams,
  LiquidityOracleParams,
  LiquidityPoolParams,
  OracleInfo,
  RiskParams,
} from '../type'
import {
  CHAIN_ID_TO_ORACLE_ROUTER_CREATOR_ADDRESS,
  CHAIN_ID_TO_UNISWAP_V3_ORACLE_ROUTER_CREATOR_ADDRESS,
  CHAIN_ID_TO_UNISWAP_V3_TOOL_ADDRESS,
  DECIMALS,
  erc20Decimals,
  getERC20Contract,
  getLiquidityPool,
  getLiquidityPoolContract,
  getOracleContract,
  getOracleRouterCreatorContract,
  getOracleRouterKey,
  getUniswapV3OracleKey,
  LiquidityPool,
  LiquidityPoolStorage,
  previewOracleRouter,
  UniswapV3OracleAdaptorCreatorFactory,
  UniswapV3ToolFactory,
} from '@mcdex/mai3.js'
import { namespace } from 'vuex-class'
import { ErrorHandlerMixin } from '@/mixins'
import { normalizeError, PoolStatus } from '@/type'
import CreatePerpetualMixin from '@/template/components/Pool/createPerpetualMixin'
import { padLeft } from '@/utils'
import _ from 'lodash'
import { checkPoolHasActiveProposal, onCreatedGetProposalId } from '@/template/components/Pool/lowLevelPoolProposal'
import BigNumber from 'bignumber.js'
import { EMPTY_ADDRESS, TARGET_NETWORK_ID, UNISWAP_V3_FACTORY_ADDRESS } from '@/constants'
import { StepStatus } from '@/components/Steps/type'
import { ROUTE } from '@/router'
import { OracleLink, OracleLinkWithTunable } from '@/config/oracle'
import { UniswapOracle } from '@/business-components/SelectPerpetualOracle/types'

const wallet = namespace('wallet')

enum STEP_TYPE {
  CREATE_POOL = 'CREATE_POOL',
  CREATE_ORACLE = 'CREATE_ORACLE',
  INCREASE_OBSERVATION_CARDINALITY = 'INCREASE_OBSERVATION_CARDINALITY',
  CREATE_PERPETUAL = 'CREATE_PERPETUAL',
  CREATE_PROPOSAL = 'CREATE_PROPOSAL',
  SET_PERPETUAL_INVERSE = 'SET_PERPETUAL_INVERSE'
}

@Component({
  components: {
    BaseCardFrame,
    SelectPool,
    SelectOracle,
    ContractParameters,
    SetRiskParams,
    McSteps,
    McStepItem,
  },
})
export default class CreateContract extends Mixins(ErrorHandlerMixin, CreatePerpetualMixin) {

  @Ref('selectPoolRef') selectPoolRef!: SelectPool
  @Ref('selectOracleRef') selectOracleRef!: SelectOracle
  @Ref('contractParamsRef') contractParamsRef!: ContractParameters
  @Ref('riskParamsRef') riskParamsRef!: SetRiskParams
  @Ref('createSteps') createSteps!: McSteps

  private createdInfo: { liquidityPool: string, perpetualIndex: number, symbol: number } | null = null
  private createdLiquidityPool: LiquidityPool | null = null
  private createdOracleAddress: string | null = null
  private activeItem: string[] = []
  private proposalId: string | null = null
  private setPerpetualInverseSucceed: boolean = false
  private selectOptions = {
    selectPool: 'select-pool',
    selectOracle: 'select-oracle',
    contractParams: 'contract-params',
    riskParams: 'risk-params',
  }
  private existLiquidityPoolStorage: LiquidityPoolStorage | null = null
  private poolHasActiveProposal: boolean = false
  private oracleInfo: OracleInfo | null = null
  private collateralInfo: CollateralInfo | null = null
  private exitedOracleAddress: string | null = null
  private errorMsg = ''
  private hasCreatedPool: boolean = false
  private needIncreaseObservationCardinalityNext = false
  private needTunableOracles: string[] = []
  private needCreateOracle = false

  get steps(): Array<{ labelKey: string, action: () => Promise<void> }> {
    const steps = new Array<{ labelKey: string, action: () => Promise<void> }>()
    if (!this.selectedPool?.liquidityPoolAddress) {
      steps.push({ labelKey: 'base.createPool', action: this.onCreatePool.bind(this) })
    }
    this.needTunableOracles.forEach(oracle => {
      steps.push({ labelKey: 'base.createTunableOracle', action: this.genCreateTunableOracleFunc(oracle).bind(this)})
    })
    if (this.needCreateOracle) {
      steps.push({ labelKey: 'base.createOracle', action: this.onCreateOracle.bind(this) })
    }
    if (this.needIncreaseObservationCardinalityNext) {
      steps.push({ labelKey: 'newContract.expandUniswap', action: this.onIncreaseObservationCardinality.bind(this) })
    }
    if (this.isCreatePerpetual) {
      steps.push({ labelKey: 'base.createPerpetual', action: this.onCreatePerpetual.bind(this) })
      if (this.contractParams && this.contractParams.isInverse) {
        steps.push({ labelKey: 'base.setContractDisplay', action: this.onSetPerpetualInverse.bind(this) })
      }
    } else {
      steps.push({ labelKey: 'base.createProposal', action: this.onCreateProposal.bind(this) })
    }
    return steps
  }

  get createSuccess() {
    return !!(this.createdInfo || this.proposalId)
  }

  get creating() {
    return this.creatingProposal || this.creatingPerpetual || this.creatingPool || this.creatingOracle
  }

  get enableCreate() {
    return this.selectPoolFinished && this.selectOracleFinished && this.contractParamsFinished && this.riskParamsFinished
  }

  get selectPoolFinished() {
    return !!this.selectedPool
  }

  get selectOracleFinished() {
    return !!this.selectedOracle
  }

  get contractParamsFinished() {
    return !!this.contractParams
  }

  get riskParamsFinished() {
    return !!this.riskParams
  }

  get collateralSymbol(): string {
    if (!this.selectedPool) return ''
    return this.selectedPool.collateralSymbol
  }

  get collateralAddress(): string {
    if (!this.selectedPool) return ''
    return this.selectedPool.collateralAddress
  }

  get collateralDecimals(): number {
    if (!this.selectedPool) return 0
    return this.selectedPool.collateralDecimals
  }

  get underlyingAsset(): string {
    return this.selectedOracle?.underlyingAsset || ''
  }

  get contract(): string {
    if (!this.createdInfo || !this.underlyingAsset || !this.collateralSymbol) {
      return ''
    }
    return `${padLeft(this.createdInfo.symbol, 5)} ${this.underlyingAsset}-${this.collateralSymbol}`
  }

  get isCreatePerpetual() {
    return !this.selectedPool || !this.selectedPool.liquidityPoolAddress || this.selectedPool.isFastCreationEnabled
      || this.selectedPool.liquidityPoolStatus === PoolStatus.Initialize || this.existLiquidityPoolStorage?.isFastCreationEnabled
  }

  get disableCreatePerpetual() {
    return !this.selectedPool || !this.signer || !this.selectedPool?.collateralAddress || (!this.selectedOracle?.oracleRouterPath && !this.selectedOracle?.oracleAddress)
  }

  get disableCreateProposal() {
    return !this.selectedPool || !this.signer || !this.reader || !this.selectedPool.liquidityPoolAddress || (!this.selectedOracle?.oracleRouterPath && !this.selectedOracle?.oracleAddress) || this.poolHasActiveProposal
  }

  get disableRunPool() {
    const address = this.selectedPool?.liquidityPoolAddress || this.createdLiquidityPool?.address
    return !this.signer || !address
  }

  onSelectedPoolChange(pool: LiquidityPoolParams | null) {
    this.selectedPool = pool
    this.updateExistLiquidityPoolStorage()
    if (_.findIndex(this.activeItem, this.selectOptions.selectOracle) < 0) {
      this.activeItem.push(this.selectOptions.selectOracle)
    }
    this.getCollateralInfo()
  }

  onSelectedOracleChange(oracle: LiquidityOracleParams | null) {
    this.selectedOracle = oracle
    if (_.findIndex(this.activeItem, this.selectOptions.contractParams) < 0) {
      this.activeItem.push(this.selectOptions.contractParams)
    }
    this.getOracleInfo()
    this.getExitedOracleAdapter()
    this.checkUniswapV3PathCardinality()
  }

  onContractParamsChange(params: LiquidityContractParams | null) {
    this.contractParams = params
    if (_.findIndex(this.activeItem, this.selectOptions.riskParams) < 0) {
      this.activeItem.push(this.selectOptions.riskParams)
    }
    this.$nextTick(() => {
      this.riskParamsRef.setInitialData()
    })
  }

  onRiskParamsChange(params: RiskParams | null) {
    this.riskParams = params
  }

  async getCollateralInfo() {
    if (!this.selectedPool) {
      this.collateralInfo = null
      return
    }
    await this.callChainReadFunc(async () => {
      if (!this.selectedPool || !this.provider) {
        return
      }
      const erc20Token = getERC20Contract(this.selectedPool.collateralAddress, this.provider)
      const decimals = await erc20Decimals(erc20Token)
      this.collateralInfo = {
        symbol: this.selectedPool.collateralSymbol,
        decimals: decimals,
        address: this.selectedPool.collateralAddress,
      }
    })
  }

  async getOracleInfo() {
    await this.callChainReadFunc(async () => {
      if (!this.selectedOracle || !this.provider) {
        this.oracleInfo = null
        return
      }
      if (this.selectedOracle.type === 'custom') {
        const oracle = getOracleContract(this.selectedOracle.oracleAddress!, this.provider)
        const [markPriceInfo, indexPriceInfo, underlyingAsset] = await Promise.all([oracle.callStatic.priceTWAPLong(), oracle.callStatic.priceTWAPShort(), oracle.callStatic.underlyingAsset()])
        this.oracleInfo = {
          markPrice: new BigNumber(markPriceInfo.newPrice.toString()).shiftedBy(-DECIMALS),
          indexPrice: new BigNumber(indexPriceInfo.newPrice.toString()).shiftedBy(-DECIMALS),
          symbol: underlyingAsset,
        }
      } else if (this.selectedOracle.type === 'registered') {
        const oracleRouterPath = this.selectedOracle.oracleRouterPath as OracleLinkWithTunable[]
        const path = oracleRouterPath.map(item => ({
          oracle: item.oracle.address,
          isInverse: item.inverse,
        }))
        const preview = await previewOracleRouter(path, this.provider)
        this.oracleInfo = {
          markPrice: preview.markPrice,
          indexPrice: preview.indexPrice,
          symbol: this.selectedOracle.underlyingAsset,
        }
      } else if (this.selectedOracle.type === 'uniswapV3') {
        const routerPath = this.selectedOracle.oracleRouterPath as UniswapOracle
        const route = routerPath.route
        this.oracleInfo = {
          markPrice: routerPath.price,
          indexPrice: routerPath.price,
          symbol: route.input.symbol || '',
        }
      }
    })
  }

  async checkOracleRouterAdapter() {
    if (!this.selectedOracle || !this.provider) {
      this.exitedOracleAddress = null
      this.needCreateOracle = false
      return
    }
    const oracleRouterPath = this.selectedOracle.oracleRouterPath as OracleLinkWithTunable[]
    const path = oracleRouterPath.map(item => ({
      oracle: item.oracle.address,
      isInverse: item.inverse,
      canTune: item.oracle.canTune,
      isTunable: item.isTunable,
    }))
    // has canTune oracle, must to tune this oracle
    if (oracleRouterPath.find(path => !path.isTunable && path.oracle.canTune)) {
      this.exitedOracleAddress = null
      this.needCreateOracle = path.length !== 1
      return
    }
    if (path.length === 1 && !path[0].isInverse) {
      this.exitedOracleAddress = path[0].oracle
      this.needCreateOracle = false
    } else {
      this.exitedOracleAddress = await this.callChainReadFunc(async () => {
        try {
          const creator = getOracleRouterCreatorContract(CHAIN_ID_TO_ORACLE_ROUTER_CREATOR_ADDRESS[TARGET_NETWORK_ID], this.provider!)
          const address = await creator.routers(getOracleRouterKey(path))
          return address === EMPTY_ADDRESS ? null : address
        } catch (e) {
          return null
        }
      })
      this.needCreateOracle = !this.exitedOracleAddress
    }
  }

  async checkUniswapV3RouterAdapter() {
    if (!this.selectedOracle || !this.provider) {
      this.exitedOracleAddress = null
      return
    }
    this.exitedOracleAddress = await this.callChainReadFunc(async () => {
      try {
        const creator = UniswapV3OracleAdaptorCreatorFactory.connect(CHAIN_ID_TO_UNISWAP_V3_ORACLE_ROUTER_CREATOR_ADDRESS[TARGET_NETWORK_ID], this.provider!)
        const oracleRouterPath = this.selectedOracle!.oracleRouterPath as UniswapOracle
        const key = getUniswapV3OracleKey(
          oracleRouterPath.route.tokenPath.map(v => v.address),
          oracleRouterPath.route.pools.map(v => v.fee),
          oracleRouterPath.indexPriceTWAP,
          oracleRouterPath.markPriceTWAP,
        )
        const address = await creator.adaptors(key)
        return address === EMPTY_ADDRESS ? null : address
      } catch (e) {
        return null
      }
    })
  }

  async checkUniswapV3PathCardinality() {
    if (!this.isUniswapOracle || this.observationCardinality < 1) {
      this.needIncreaseObservationCardinalityNext = false
      return
    }
    const toolContract = UniswapV3ToolFactory.connect(CHAIN_ID_TO_UNISWAP_V3_TOOL_ADDRESS[TARGET_NETWORK_ID], this.provider)
    const oracleRouterPath = this.selectedOracle!.oracleRouterPath as UniswapOracle
    const result = await toolContract.callStatic.increaseObservationCardinalityNext(UNISWAP_V3_FACTORY_ADDRESS, oracleRouterPath.route.tokenPath.map(t => t.address), oracleRouterPath.route.pools.map(p => p.fee), this.observationCardinality)
    this.needIncreaseObservationCardinalityNext = result.toNumber() > 0
  }

  async getExitedOracleAdapter() {
    if (!this.selectedOracle || !this.provider) {
      this.exitedOracleAddress = null
      return
    }
    if (this.selectedOracle.type === 'custom') {
      this.exitedOracleAddress = this.selectedOracle.oracleAddress!
    } else if (this.selectedOracle.type === 'registered') {
      await this.checkOracleRouterAdapter()
    } else if (this.selectedOracle.type === 'uniswapV3') {
      await this.checkUniswapV3RouterAdapter()
    }
  }

  async onCreatePool() {
    await this.callChainFunc(async () => {
      try {
        this.createdLiquidityPool = await this.createLiquidityPool() || null
        this.hasCreatedPool = true
      } catch (e) {
        const err = normalizeError(e)
        this.setStepError(this.$t(err.helpKey, { message: e.message }).toString())
        throw e
      }
    }, undefined, true)
  }

  genCreateTunableOracleFunc(externalOracle: string) {
    return async () => {
      const poolAddress = this.selectedPool?.liquidityPoolAddress || this.createdLiquidityPool?.address
      if (!poolAddress) {
        throw Error('empty pool address')
      }
      await this.callChainFunc(async () => {
        try {
          const newTunableOracleAddress = await this.createTunableOracleFunc(poolAddress, externalOracle);
          (this.selectedOracle!.oracleRouterPath as OracleLinkWithTunable[]).forEach(o => {
            if (o.oracle.address === externalOracle) {
              o.oracle.address = newTunableOracleAddress
              o.oracle.canTune = false
              o.isTunable = true
            }
          })
        } catch (e) {
          const err = normalizeError(e)
          this.setStepError(this.$t(err.helpKey, { message: e.message }).toString())
          throw e
        }
      }, undefined, true)
     await this.checkOracleRouterAdapter()
    }
  }

  async onCreateOracle() {
    await this.callChainFunc(async () => {
      try {
        this.createdOracleAddress = await this.createOracle() || null
      } catch (e) {
        const err = normalizeError(e)
        this.setStepError(this.$t(err.helpKey, { message: e.message }).toString())
        throw e
      }
    }, undefined, true)
  }

  async onCreatePerpetual() {
    if (this.disableCreatePerpetual) {
      return
    }
    await this.callChainFunc(async () => {
      const address = this.selectedPool?.liquidityPoolAddress || this.createdLiquidityPool?.address
      const oracleAddress = this.exitedOracleAddress || this.createdOracleAddress
      if (!address || !oracleAddress) {
        return
      }
      // create perpetual
      try {
        const liquidityPool = getLiquidityPoolContract(address, this.signer!)
        this.createdInfo = await this.createPerpetual(liquidityPool, oracleAddress)
        if (this.contractParams && !this.contractParams.isInverse) {
          this.setPerpetualInverseSucceed = true
        }
      } catch (e) {
        const err = normalizeError(e)
        this.setStepError(this.$t(err.helpKey, { message: e.message }).toString())
        throw e
      }
    }, undefined, true)
  }

  async onSetPerpetualInverse() {
    await this.callChainFunc(async () => {
      if (!this.createdInfo) {
        throw new Error('created info is null')
      }
      try {
        await this.setPerpetualInverse(this.createdInfo.liquidityPool, this.createdInfo.perpetualIndex)
        this.setPerpetualInverseSucceed = true
      } catch (e) {
        const err = normalizeError(e)
        this.setStepError(this.$t(err.helpKey, { message: e.message }).toString())
        throw e
      }
    }, undefined, true)
  }

  async onIncreaseObservationCardinality() {
    if (!this.needIncreaseObservationCardinalityNext) {
      return
    }
    await this.callChainFunc(async () => {
      try {
        await this.increaseObservationCardinality()
      } catch (e) {
        const err = normalizeError(e)
        this.setStepError(this.$t(err.helpKey, { message: e.message }).toString())
        throw e
      }
    }, undefined, true)
  }

  async onCreateProposal() {
    if (this.disableCreateProposal) {
      return
    }
    await this.callChainFunc(async () => {
      const address = this.selectedPool?.liquidityPoolAddress || this.createdLiquidityPool?.address
      const oracleAddress = this.exitedOracleAddress || this.createdOracleAddress
      if (!address || !oracleAddress) {
        return
      }
      try {
        const poolStorage = await getLiquidityPool(this.reader!, address as string)
        const receipt = await this.createProposal(poolStorage.governor, oracleAddress)
        this.proposalId = onCreatedGetProposalId(receipt)
        this.setPerpetualInverseSucceed = true
      } catch (e) {
        const err = normalizeError(e)
        this.setStepError(this.$t(err.helpKey, { message: e.message }).toString())
        throw e
      }
    }, undefined, true)
  }

  async onRunPool() {
    if (this.disableRunPool) {
      return
    }
    await this.callChainFunc(async () => {
      const address = this.selectedPool?.liquidityPoolAddress || this.createdLiquidityPool?.address
      if (!address) {
        return
      }
      const liquidityPool = getLiquidityPoolContract(address, this.signer!)
      await this.runPool(liquidityPool)
    })
  }

  toAddLiquidityPage() {
    const address = this.createdInfo?.liquidityPool || ''
    this.$router.push({ name: ROUTE.POOL_LIQUIDITY, params: { poolAddress: address } })
  }

  onEditConfig() {
    this.selectPoolRef.onEdit()
    this.selectOracleRef.onEdit()
    this.contractParamsRef.onEdit()
    this.riskParamsRef.onEdit()
  }

  onSubmit() {
    this.createSteps.start()
  }

  setStepError(message: string) {
    this.errorMsg = message
  }

  @Watch('enableCreate')
  onEnableCreateChange() {
    this.errorMsg = ''
  }

  @Watch('selectedPool.liquidityPoolAddress')
  async updateExistLiquidityPoolStorage() {
    if (!this.selectedPool || !this.selectedPool.liquidityPoolAddress) {
      this.existLiquidityPoolStorage = null
    } else {
      if (this.reader) {
        this.existLiquidityPoolStorage = await getLiquidityPool(this.reader, this.selectedPool.liquidityPoolAddress as string) || null
      } else {
        this.existLiquidityPoolStorage = null
      }
      if (this.existLiquidityPoolStorage) {
        this.selectedPool.liquidityPoolStatus = this.existLiquidityPoolStorage.isRunning ? PoolStatus.Normal :
          this.selectedPool.liquidityPoolStatus
      }
    }
  }

  @Watch('selectedOracle')
  updateNeedTunableOracles() {
    this.needTunableOracles = this.selectedOracle && this.selectedOracle.type === 'registered' ? (this.selectedOracle.oracleRouterPath as OracleLinkWithTunable[]).filter(o => !o.isTunable && o.oracle.canTune).map(o => o.oracle.address) : []
  }

  @Watch('existLiquidityPoolStorage', { deep: true })
  @Watch('provider')
  async onExistSelectedPoolChange() {
    await this.callChainReadFunc(async () => {
      if (!this.existLiquidityPoolStorage || this.existLiquidityPoolStorage.isFastCreationEnabled || !this.provider) {
        this.poolHasActiveProposal = false
        return
      }
      this.poolHasActiveProposal = await checkPoolHasActiveProposal(
        this.existLiquidityPoolStorage.governor,
        this.provider,
      )
    })
  }

  toProposalPage() {
    this.$router.push({
      name: 'poolProposalVote', params: {
        poolAddress: this.selectedPool?.liquidityPoolAddress || '',
        index: this.proposalId || '',
      },
    })
  }

  reset() {
    this.selectPoolRef.setPool(this.selectedPool?.liquidityPoolAddress || this.createdLiquidityPool?.address || '')
    this.selectedPool = null
    this.selectedOracle = null
    this.contractParams = null
    this.riskParams = null
    this.creatingPool = false
    this.creatingPerpetual = false
    this.creatingOracle = false
    this.creatingProposal = false
    this.ran = false
    this.createdInfo = null
    this.existLiquidityPoolStorage = null
    this.proposalId = null
    this.activeItem = []
    this.exitedOracleAddress = null
    this.selectOracleRef.reset()
    this.contractParamsRef.reset()
    this.riskParamsRef.reset()
    this.hasCreatedPool = false
    this.needTunableOracles = []
    this.needCreateOracle = false
  }
}
</script>

<style lang="scss" scoped>
.create-contract {
  height: 100%;
  display: flex;
  flex-direction: column;

  .base-card-frame {
    flex: 1;
  }

  .body {
    height: 100%;
    width: 960px;
    margin: auto;
    padding-top: 17px;

    .info {
      height: 24px;
    }

    .operator-guidebook {
      text-align: center;
      font-size: 16px;
      line-height: 24px;
      color: var(--mc-text-color);

      ::v-deep a {
        color: var(--mc-color-primary);
      }
    }

    .create-steps {
      margin-top: 58px;

      .step-item {
        margin-bottom: 60px;

        ::v-deep .el-collapse-item__content {
          padding: 45px 0 0 0;
        }

        ::v-deep .el-collapse-item__header {
          color: var(--mc-text-color-white);

          .step-title {
            display: flex;
            align-items: center;
          }

          .icon {
            display: inline-block;
            height: 16px;
            width: 16px;
            border: 1px solid var(--mc-text-color-white);
            border-radius: 50%;
            margin-right: 4px;
          }

          .el-icon-circle-check {
            display: none;
            font-size: 18px;
            margin-right: 4px;
          }

          .el-collapse-item__arrow {
            color: var(--mc-color-secondary);
          }
        }

        &.is-active {
          ::v-deep .el-collapse-item__header {
            color: white;

            .el-collapse-item__arrow {
              color: var(--mc-color-primary);
            }
          }
        }

        &.is-finished {
          ::v-deep .el-collapse-item__header {
            border-color: var(--mc-color-secondary);

            color: var(--mc-text-color-white);

            .icon {
              display: none;
            }

            .el-icon-circle-check {
              display: inline-block;
            }
          }
        }
      }
    }

    .success-info {
      color: var(--mc-text-color);
      border-top: 2px solid var(--mc-border-color);
      margin-bottom: 60px;

      .success-title {
        margin: 35px 0;
        color: var(--mc-color-success);
      }

      .success-message {
        margin-bottom: 35px;
      }

      .new-pool-message {
        display: flex;
        align-items: center;

        margin-top: 35px;

        &:first-child {
          margin-top: 0;
        }

        .el-icon-warning-outline {
          display: inline-block;
          height: 24px;
          line-height: 24px;
          margin-right: 10px;
          color: var(--mc-color-warning);
        }
      }

      .button-container {
        text-align: center;
        margin-top: 60px;

        .el-button {
          width: 240px;
          margin: 0 35px;
          padding: 0;
        }
      }
    }
  }

  .step-container {
    border-top: 2px solid var(--mc-border-color);

    .submit-title {
      margin: 35px 0;
    }

    .content-box {
      width: 730px;
      margin: auto;

      .actions {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;

        .el-button,
        .mc-steps {
          width: 275px;

          .warning-text {
            color: var(--mc-color-warning);
            text-decoration: none;
            line-height: 20px;
            display: block;
            margin-top: 8px;
            font-size: 14px;
          }
        }
      }
    }
  }

  .error-alert-msg {
    margin-top: 8px;
  }
}
</style>
