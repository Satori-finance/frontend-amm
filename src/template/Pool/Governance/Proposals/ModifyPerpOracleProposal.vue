<template>
  <div class="modify-perp-oracle-proposal">
    <div class="step-item step01">
      <div class="step-title">
        <span>{{ $t('base.step') }} 1. </span>
        <span class="info">{{ $t('pool.poolProposal.modifyPerpOracleProposal.step01') }}</span>
      </div>
      <div class="step-body">
        <div class="perp-select-list">
          <table class="mc-data-table mc-data-table--border" v-if="step01Status === 'edit'">
            <thead>
            <tr>
              <th>{{ $t('pool.poolProposal.perpetual') }}</th>
              <th>{{ $t('pool.poolProposal.select') }}</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(item, index) in perpetuals" :key="index">
              <td class="is-center">
                {{ item.symbol }}
                {{ `${item.underlyingSymbol}-${item.collateralSymbol}` }}
              </td>
              <td class="is-center">
                <el-radio v-model="currentSelectedPerpIndex" :label="index"></el-radio>
              </td>
            </tr>
            </tbody>
          </table>
          <table class="mc-data-table mc-data-table--border" v-if="step01Status === 'show'">
            <thead>
            <tr>
              <th>{{ $t('pool.poolProposal.perpetual') }}</th>
            </tr>
            </thead>
            <tbody>
            <tr>
              <td class="is-center">
                {{ selectedPerpetual.symbol }}
                {{ `${selectedPerpetual.underlyingSymbol}-${selectedPerpetual.collateralSymbol}` }}
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="step-button-box">
        <div v-if="step01Status === 'edit'" class="edit-button">
          <div class="info-button">
            <el-button
              class="large"
              @click="
                step01Status = 'show'
                currentStepIndex = 1
                step02Status = 'edit'
              "
              :disabled="!selectedPerpetual"
            >
              {{ $t('base.next') }}
            </el-button>
          </div>
        </div>
        <div v-if="step01Status === 'show'" class="show-button">
          <div class="info-button">
            <el-button
              class="large"
              type="secondary"
              @click="
                step01Status = 'edit'
                currentStepIndex = 0
              "
              :disabled="buttonIsLoading"
            >
              {{ $t('base.edit') }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
    <div class="step-item step02" v-if="currentStepIndex === 1">
      <div class="step-item step01">
        <div class="step-title">
          <span>{{ $t('base.step') }} 2. </span>
          <span class="info">{{ $t('pool.poolProposal.modifyPerpOracleProposal.step02') }}</span>
        </div>
        <div class="step-body">
          <div v-if="step02Status === 'edit'" class="select-oracle">
            <SelectPerpetualOracle
              :collateral-symbol="selectedPerpCollateralSymbol"
              :collateral-address="selectedPerpCollateralAddress"
              :collateral-decimals="selectedPerpCollateralDecimals"
              @next="onSelectOracleNext"
            />
          </div>
          <div v-if="step02Status === 'show'">
            <SelectPerpetualOracleView :selected-oracle-params="selectedOracleParams"/>
            <div v-if="step02Status === 'show'" class="show-button">
              <div class="info-button">
                <el-button class="large" type="secondary" @click="step02Status = 'edit'" :disabled="buttonIsLoading">
                  {{ $t('base.edit') }}
                </el-button>
              </div>
              <div class="create-button">
                <el-tooltip
                  class="item"
                  effect="dark"
                  placement="top"
                  :disabled="!createButtonIsDisabled || canCreateProposal"
                >
                  <template slot="content">
                    <span v-if="hasActiveProposal" v-html="$t('pool.poolProposal.hasActiveProposalTip')"></span>
                    <span
                      v-else-if="!hasOperator && !canCreateProposal"
                      v-html="$t('pool.poolProposal.operatorHasExpiredTip')"
                    ></span>
                    <span v-else v-html="$t('pool.poolProposal.onlyOperatorCreateProposalTip')"></span>
                  </template>
                  <el-button
                    class="large"
                    @click="onCreateProposalEvent"
                    :class="{ 'is-disabled': createButtonIsDisabled }"
                  >
                    {{ $t('pool.poolInfo.governanceList.createProposal') }}
                    <i v-if="buttonIsLoading" class="el-icon-loading"></i>
                  </el-button>
                </el-tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins, Watch } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import { LiquidityPoolDirectoryItem, PerpetualCombinedState } from '@/type'
import { ethers } from 'ethers'
import { namespace } from 'vuex-class'
import { getPerpetualID } from '@/utils'
import {
  CHAIN_ID_TO_ORACLE_ROUTER_CREATOR_ADDRESS, CHAIN_ID_TO_UNISWAP_V3_ORACLE_ROUTER_CREATOR_ADDRESS, DECIMALS,
  getOracleRouterCreatorContract,
  getOracleRouterKey,
  getUniswapV3OracleKey,
  PerpetualState,
  UniswapV3OracleAdaptorCreatorFactory,
} from '@mcdex/mai3.js'
import { SelectPerpetualOracle, SelectPerpetualOracleView } from '@/business-components'
import { SelectedOracleParams, UniswapOracle } from '@/business-components/SelectPerpetualOracle/types'
import { EMPTY_ADDRESS, TARGET_NETWORK_ID } from '@/constants'
import { Provider } from '@ethersproject/providers'
import { ChangeOraclePoolProposal } from '@/template/components/Pool/poolProposalMixin'
import { OracleLinkWithTunable } from '@/config/oracle'
import _ from 'lodash'
import { waitTransaction } from '@/utils/transaction'

const wallet = namespace('wallet')
const perpetual = namespace('perpetual')

interface PerpetualItem {
  index: number
  symbol: string
  collateralSymbol: string
  underlyingSymbol: string
  collateralDecimals: number
}

@Component({
  components: {
    SelectPerpetualOracle,
    SelectPerpetualOracleView,
  },
})
export default class ModifyPerpOracleProposal extends Mixins(ErrorHandlerMixin) {
  @Prop({ required: true }) liquidityPool !: LiquidityPoolDirectoryItem | null
  @Prop({ required: true }) canCreateProposal !: boolean
  @Prop({ required: true }) hasOperator !: boolean
  @Prop({ required: true }) hasActiveProposal !: boolean
  @wallet.Getter('signer') signer !: ethers.Signer | null
  @wallet.Getter('provider') provider !: Provider | null
  @perpetual.Getter('getPerpetualFunc') getPerpetualFunc!: (perpetualID: string) => PerpetualCombinedState | null

  mounted() {
    this.loadPoolPerpetuals()
  }

  selectedOracleParams: SelectedOracleParams | null = null
  private exitedOracleAddress: string | null = null
  private buttonIsLoading: boolean = false
  private perpetuals: PerpetualItem[] = []
  private currentStepIndex: number = 0
  private currentSelectedPerpIndex: number = 0
  private stepsStatus: { [index: number]: 'edit' | 'show' } = {
    0: 'edit',
    1: 'edit',
  }

  get step01Status(): 'edit' | 'show' {
    return this.stepsStatus[0]
  }

  set step01Status(status: 'edit' | 'show') {
    this.stepsStatus[0] = status
  }

  get step02Status(): 'edit' | 'show' {
    return this.stepsStatus[1]
  }

  set step02Status(status: 'edit' | 'show') {
    this.stepsStatus[1] = status
  }

  get selectedPerpetual(): PerpetualItem | null {
    return this.perpetuals[this.currentSelectedPerpIndex]
  }

  get selectedPerpCollateralSymbol(): string {
    return this.selectedPerpetual?.collateralSymbol || ''
  }

  get selectedPerpCollateralDecimals(): number {
    return this.selectedPerpetual?.collateralDecimals || DECIMALS
  }

  get selectedPerpUnderlyingSymbol(): string {
    return this.selectedPerpetual?.underlyingSymbol || ''
  }

  get selectedPerpCollateralAddress(): string {
    return this.liquidityPool?.liquidityPoolStorage.collateral || ''
  }

  get selectedPerpetualStorage(): PerpetualCombinedState | null {
    if (!this.getPerpetualFunc || !this.selectedPerpetual || !this.liquidityPool) {
      return null
    }
    const perpetualID = getPerpetualID(this.liquidityPool.liquidityPoolAddress, this.selectedPerpetual.index)
    return this.getPerpetualFunc(perpetualID)
  }

  get createButtonIsDisabled(): boolean {
    if (!this.selectedOracleParams) {
      return true
    }
    if (!this.canCreateProposal) {
      return true
    }
    if (this.currentStepIndex !== 1 || this.step02Status !== 'show') {
      return true
    }
    return this.buttonIsLoading
  }

  @Watch('liquidityPool')
  loadPoolPerpetuals() {
    if (!this.liquidityPool) {
      return
    }
    const perpetualsStorage = this.liquidityPool.liquidityPoolStorage.perpetuals
    this.perpetuals = []
    this.liquidityPool.perpetualPropertyMap.forEach(val => {
      const perpetualStorage = perpetualsStorage.get(val.perpetualIndex)
      if (perpetualStorage && perpetualStorage.state === PerpetualState.NORMAL) {
        this.perpetuals.push({
          index: val.perpetualIndex,
          symbol: val.symbolStr,
          collateralSymbol: val.collateralTokenSymbol,
          underlyingSymbol: val.underlyingAssetSymbol,
          collateralDecimals: val.collateralTokenDecimals,
        })
      }
    })
  }

  async getExitedOracleAdapter() {
    if (!this.selectedOracleParams || !this.provider) {
      this.exitedOracleAddress = null
      return
    }
    if (this.selectedOracleParams.selectedType === 'custom') {
      this.exitedOracleAddress = this.selectedOracleParams.oracleAddress!
    } else if (this.selectedOracleParams.selectedType === 'registered') {
      if (!_.isArray(this.selectedOracleParams.oracleRouterPath)) {
        this.exitedOracleAddress = null
        return
      }
      const oracleRouterPath = this.selectedOracleParams.oracleRouterPath as OracleLinkWithTunable[]
      const path = oracleRouterPath.map(item => ({
        oracle: item.oracle.address,
        isInverse: item.inverse,
      }))
      if (path.length === 1 && !path[0].isInverse) {
        this.exitedOracleAddress = path[0].oracle
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
      }
    } else if (this.selectedOracleParams.selectedType === 'uniswapV3') {
      this.exitedOracleAddress = await this.callChainReadFunc(async () => {
        try {
          const creator = UniswapV3OracleAdaptorCreatorFactory.connect(CHAIN_ID_TO_UNISWAP_V3_ORACLE_ROUTER_CREATOR_ADDRESS[TARGET_NETWORK_ID], this.provider!)
          const oracleRouterPath = this.selectedOracleParams!.oracleRouterPath as UniswapOracle
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
  }

  async onCreateProposalEvent() {
    if (this.currentStepIndex !== 1 || this.step02Status !== 'show' || this.createButtonIsDisabled
      || !this.selectedOracleParams || !this.exitedOracleAddress) {
      return
    }
    await this.callChainFunc(async () => {
      if (!this.liquidityPool || !this.signer || !this.selectedPerpetual ||
        !this.selectedPerpetualStorage || !this.selectedOracleParams || !this.exitedOracleAddress) {
        return
      }
      const poolProposal = new ChangeOraclePoolProposal()
      poolProposal.buildProposalByParams(
        this.selectedPerpetual.index,
        this.exitedOracleAddress,
      )
      this.buttonIsLoading = true
      const transaction = await poolProposal.createProposal(this.liquidityPool.liquidityPoolStorage.governor, this.signer)
      const transactionResult = waitTransaction(transaction)
      this.$transaction({
        location: 'top',
        transaction: transactionResult,
        content: this.$t('transaction.createProposal').toString(),
        transactionHash: transaction.hash ? transaction.hash : '',
      })
      const txResult = await transactionResult
      this.$emit('success')
      return txResult
    })
    this.buttonIsLoading = false
  }

  async onSelectOracleNext(params: SelectedOracleParams | null) {
    this.selectedOracleParams = params
    this.step02Status = 'show'
    await this.getExitedOracleAdapter()
  }
}
</script>

<style scoped lang="scss">
@import '../governance.scss';

.modify-perp-oracle-proposal {
  .step01 {
    .step-button-box {
      .edit-button {
        margin-left: 116px;
      }

      .show-button {
        margin-left: 116px;
      }
    }
  }

  .step02 {
    ::v-deep {
      .select-perpetual-oracle {
        .radio-group-tabs {
          text-align: unset;
          margin-left: 245px;
        }

        .registered-show-routes-tables {
          .mc-data-table {
            margin-left: 100px;
          }
        }
      }

      .select-perpetual-oracle-view {
        .mc-data-table {
          margin: unset;
        }
      }

      margin: unset;
    }

    .show-button {
      margin-top: 30px;
      width: 730px;
      display: flex;
      justify-content: space-between;

      .edit-button {
        margin-left: 488px;
      }

      .create-button {
        margin-left: 104px;

        .el-button {
          width: 275px;
        }
      }
    }
  }

  .step-body {
    .select-oracle {
      ::v-deep div.el-loading-spinner {
        text-align: unset;
        margin-left: 480px;
      }
    }
  }

  ::v-deep {
    .select-perpetual-oracle {
      .mc-loading {
        width: 75%;
      }
    }
  }
}
</style>
