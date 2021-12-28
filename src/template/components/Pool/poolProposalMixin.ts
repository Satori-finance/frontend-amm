import { Component, Mixins, Vue } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { ContractTransaction } from '@ethersproject/contracts'
import { _0, DECIMALS, getLpGovernorContract, normalizeBigNumberish, PerpetualStorage } from '@mcdex/mai3.js'
import { toBigNumber } from '@/utils'
import { getGasStationTxParams } from '@/utils/gasPrice'
import { InvalidArgumentError, LiquidityPoolDirectoryItem, PerpetualProperty } from '@/type'
import { ParamsItem } from '@/template/Pool/Governance/Proposals/typs'
import { decodeProposal, encodeProposal, LowLevelPoolProposalTypes } from './lowLevelPoolProposal'

// this is a combination of PoolProposalTypes
export enum CombinedPoolProposalTypes {
  Unrecognized = 'unrecognized',
  ModifyPerpParams = 'modifyPerpParams', // setPerpetualBaseParameter + setPerpetualRiskParameter
  SettlePerp = 'settlePerp', // forceToSetEmergencyState
  ChangePerpPrivilege = 'changePerpPrivilege', // setLiquidityPoolParameter
  ChangeInsuranceFundCap = 'changeInsuranceFundCap', // setLiquidityPoolParameter
  AppointNewOperator = 'appointNewOperator', // setOperator
  CreateNewPerpetual = 'createNewPerpetual', // createPerpetual
  ChangeOracle = 'changeOracle', // setOracle // TODO!
  UpgradeContract = 'upgradeContract', // upgradeTo
}

export interface IPoolProposalBuilder {
  type: CombinedPoolProposalTypes
  buildProposalByParams(...params: any[]): void
  buildProposalByCallDatas(): void
  createProposal(lpGovernorAddress: string, singer: ethers.Signer): Promise<ContractTransaction>
  title(vue: Vue): string
}

@Component
export class PoolProposalMixin extends Mixins(ErrorHandlerMixin) {
  parsePoolDescription(descriptionStr: string): { [key: string]: string } | null {
    if (!descriptionStr) {
      return null
    }
    try {
      const ret = JSON.parse(descriptionStr)
      if (typeof ret !== 'object' || descriptionStr === '') {
        console.log('malformed pool description', descriptionStr)
        return null
      }
      return ret
    } catch (e) {
      console.log('malformed pool description', descriptionStr, e)
      return null
    }
  }

  getProposalTitle(
    liquidityPool: LiquidityPoolDirectoryItem | null,
    descriptionStr: string,
    callDatas: string[],
    signatures?: string[]
  ): string {
    if (!liquidityPool) {
      return ''
    }
    const description = this.parsePoolDescription(descriptionStr)
    const proposal = this.parsePoolProposal(liquidityPool, description, callDatas, signatures)
    if (!proposal) {
      return ''
    }
    return proposal.title(this)
  }

  parsePoolProposal(
    liquidityPool?: LiquidityPoolDirectoryItem | null,
    description?: { [key: string]: string } | null,
    callDatas?: string[],
    signatures?: string[]
  ): IPoolProposalBuilder | null {
    if (!callDatas || !signatures || callDatas.length !== signatures.length) {
      return null
    }

    const decoded: { type: LowLevelPoolProposalTypes; data: any[] }[] = []
    for (let i = 0; i < callDatas.length; i++) {
      decoded.push(decodeProposal(signatures[i], callDatas[i]))
    }
    let builder: PoolProposalBase | null = null
    if (callDatas.length === 2) {
      if (
        decoded[0].type === LowLevelPoolProposalTypes.SetPerpetualBaseParameter &&
        decoded[1].type === LowLevelPoolProposalTypes.SetPerpetualRiskParameter
      ) {
        builder = new ModifyPerpParamsPoolProposal()
      }
    } else if (callDatas.length === 1) {
      switch (decoded[0].type) {
        case LowLevelPoolProposalTypes.ForceToSetEmergencyState:
          builder = new SettlePerpPoolProposal()
          break
        case LowLevelPoolProposalTypes.SetLiquidityPoolParameter:
          if (description && description['beforeInsuranceFundCap']) {
            builder = new ChangeInsuranceFundCapPoolProposal()
          } else {
            builder = new ChangePerpPrivilegePoolProposal()
          }
          break
        case LowLevelPoolProposalTypes.TransferOperator:
          builder = new AppointNewOperatorPoolProposal()
          break
        case LowLevelPoolProposalTypes.CreatePerpetual:
          builder = new CreateNewPerpetualPoolProposal()
          break
        case LowLevelPoolProposalTypes.SetOracle:
          builder = new ChangeOraclePoolProposal()
          break
        case LowLevelPoolProposalTypes.SetPerpetualBaseParameter:
        case LowLevelPoolProposalTypes.SetPerpetualRiskParameter:
          builder = new ModifyPerpParamsPoolProposal()
          break
        case LowLevelPoolProposalTypes.UpgradeContract:
          builder = new UpgradeContractPoolProposal()
      }
    }
    if (builder === null) {
      builder = new UnknownPoolProposal()
    }
    builder.liquidityPool = liquidityPool
    builder.description = description
    builder.callDatas = callDatas
    builder.signatures = signatures
    builder.decoded = decoded
    try {
      builder.buildProposalByCallDatas()
    } catch (e) {
      console.warn('buildProposalByCallDatas failed', signatures, decoded, e)
      builder = toUnrecognizedProposal(builder)
    }
    return builder
  }
}

function toUnrecognizedProposal(builder: PoolProposalBase): PoolProposalBase {
  const ret = new UnknownPoolProposal()
  ret.liquidityPool = builder.liquidityPool
  ret.description = builder.description
  ret.callDatas = builder.callDatas
  ret.signatures = builder.signatures
  ret.decoded = builder.decoded
  return ret
}

export class PoolProposalBase implements IPoolProposalBuilder {
  public type = CombinedPoolProposalTypes.Unrecognized
  public liquidityPool: LiquidityPoolDirectoryItem | null | undefined = undefined
  public description: { [key: string]: string } | null | undefined = undefined
  public callDatas: string[] | undefined = undefined
  public signatures: string[] | undefined = undefined
  public decoded: { type: LowLevelPoolProposalTypes; data: any[] }[] = []

  async createProposal(lpGovernorAddress: string, singer: ethers.Signer): Promise<ContractTransaction> {
    if (!this.signatures || !this.callDatas) {
      throw new InvalidArgumentError('proposal is not ready')
    }
    const lpGovernorContract = getLpGovernorContract(lpGovernorAddress, singer)
    const gasLimit = await getGasStationTxParams()
    const descriptionStr: string = this.description ? JSON.stringify(this.description) : ''
    return lpGovernorContract.propose(this.signatures, this.callDatas, descriptionStr, gasLimit)
  }

  buildProposalByParams(...params: any[]): void {
    throw new Error('override me')
  }

  buildProposalByCallDatas(): void {
    throw new Error('override me')
  }

  title(vue: Vue): string {
    throw new Error('override me')
  }

  perpetualProperty(perpetualIndex: number): PerpetualProperty | null {
    if (!this.liquidityPool) {
      return null
    }
    for (let val of this.liquidityPool.perpetualPropertyMap) {
      if (val[1].perpetualIndex === perpetualIndex) {
        return val[1]
      }
    }
    return null
  }

  perpetualStorage(perpetualIndex: number): PerpetualStorage | null {
    if (!this.liquidityPool) {
      return null
    }
    const storage = this.liquidityPool.liquidityPoolStorage.perpetuals.get(perpetualIndex)
    if (storage === undefined) {
      return null
    }
    return storage
  }
}

export class ModifyPerpParamsPoolProposal extends PoolProposalBase implements IPoolProposalBuilder {
  public type = CombinedPoolProposalTypes.ModifyPerpParams
  public collateralSymbol: string = ''
  public contractParams: { [name: string]: ParamsItem } = {}
  public riskParams: { [name: string]: ParamsItem } = {}
  public perpetualIndex: number = -1

  validateValue(val: string): boolean {
    return val !== '' && !isNaN(Number(val))
  }

  getUpdateParams(item: ParamsItem, div: number = 1): string {
    if (this.validateValue(item.afterValue)) {
      return new BigNumber(item.afterValue)
        .div(div)
        .shiftedBy(DECIMALS)
        .toFixed(0)
    }
    return new BigNumber(item.beforeValue).shiftedBy(DECIMALS).toFixed(0)
  }

  isModifying(params: { [name: string]: ParamsItem }): boolean {
    for (let val of Object.values(params)) {
      if (val.afterValue !== '' && !isNaN(Number(val.afterValue))) {
        return true
      }
    }
    return false
  }

  baseParameterCallDatas(contractParams: { [name: string]: ParamsItem }): string {
    const v = [
      this.perpetualIndex,
      [
        this.getUpdateParams(contractParams.initialMarginRate, 100),
        this.getUpdateParams(contractParams.maintenanceMarginRate, 100),
        this.getUpdateParams(contractParams.operatorFeeRate, 100),
        this.getUpdateParams(contractParams.lpFeeRate, 100),
        this.getUpdateParams(contractParams.referrerRebateRate, 100),
        this.getUpdateParams(contractParams.liquidationPenaltyRate, 100),
        this.getUpdateParams(contractParams.keeperGasReward),
        this.getUpdateParams(contractParams.insuranceFundRate, 100),
        this.getUpdateParams(contractParams.maxOpenInterestRate),
      ],
    ]
    return encodeProposal(LowLevelPoolProposalTypes.SetPerpetualBaseParameter, v)
  }

  riskParameterCallDatas(riskParams: { [name: string]: ParamsItem }): string {
    const v = [
      this.perpetualIndex,
      [
        // value
        this.getUpdateParams(riskParams.halfSpread, 100),
        this.getUpdateParams(riskParams.openSlippage),
        this.getUpdateParams(riskParams.closeSlippage),
        this.getUpdateParams(riskParams.fundingRateLimit, 100),
        this.getUpdateParams(riskParams.ammMaxLeverage),
        this.getUpdateParams(riskParams.closePriceDiscount, 100),
        this.getUpdateParams(riskParams.fundingRateFactor, 100),
        this.getUpdateParams(riskParams.defaultTargetLeverage),
        this.getUpdateParams(riskParams.baseFundingRate, 100),
      ],
      [
        this.getUpdateParams(riskParams.minHalfSpread, 100),
        this.getUpdateParams(riskParams.minOpenSlippage),
        this.getUpdateParams(riskParams.minCloseSlippage),
        this.getUpdateParams(riskParams.minFundingRateLimit, 100),
        this.getUpdateParams(riskParams.minAMMMaxLeverage),
        this.getUpdateParams(riskParams.minClosePriceDiscount, 100),
        this.getUpdateParams(riskParams.minFundingRateFactor, 100),
        this.getUpdateParams(riskParams.minDefaultTargetLeverage),
        this.getUpdateParams(riskParams.minBaseFundingRate, 100),

      ], // min
      [
        this.getUpdateParams(riskParams.maxHalfSpread, 100),
        this.getUpdateParams(riskParams.maxOpenSlippage),
        this.getUpdateParams(riskParams.maxCloseSlippage),
        this.getUpdateParams(riskParams.maxFundingRateLimit, 100),
        this.getUpdateParams(riskParams.maxAMMMaxLeverage),
        this.getUpdateParams(riskParams.maxClosePriceDiscount, 100),
        this.getUpdateParams(riskParams.maxFundingRateFactor, 100),
        this.getUpdateParams(riskParams.maxDefaultTargetLeverage),
        this.getUpdateParams(riskParams.maxBaseFundingRate, 100),
      ], // max
    ]
    console.log(v)
    return encodeProposal(LowLevelPoolProposalTypes.SetPerpetualRiskParameter, v)
  }

  buildProposalByParams(
    perpetualIndex: number,
    paramsForm: {
      contractParams: { [name: string]: ParamsItem }
      riskParams: { [name: string]: ParamsItem }
    },
    descriptionContent: { perpetualStorage: string }
  ) {
    console.log(paramsForm.riskParams)
    this.perpetualIndex = perpetualIndex
    this.contractParams = paramsForm.contractParams
    this.riskParams = paramsForm.riskParams
    this.signatures = []
    this.callDatas = []
    if (this.isModifying(paramsForm.contractParams)) {
      this.signatures.push(LowLevelPoolProposalTypes.SetPerpetualBaseParameter.toString())
      this.callDatas.push(this.baseParameterCallDatas(paramsForm.contractParams))
    }
    if (this.isModifying(paramsForm.riskParams)) {
      this.signatures.push(LowLevelPoolProposalTypes.SetPerpetualRiskParameter.toString())
      this.callDatas.push(this.riskParameterCallDatas(paramsForm.riskParams))
    }
    this.description = descriptionContent
  }

  getAfterValue(before: BigNumber, after: BigNumber): BigNumber | null {
    const afterVal = after.shiftedBy(-DECIMALS)
    if (afterVal.eq(before)) {
      return null
    }
    return afterVal
  }

  decodeBaseParamsCallDatas(data: any[]): { [name: string]: ParamsItem } {
    let perpetualStorage: PerpetualStorage | null = null
    if (!this.description) {
      perpetualStorage = this.perpetualStorage(this.perpetualIndex)
    } else {
      perpetualStorage = JSON.parse(this.description.perpetualStorage)
    }

    if (!perpetualStorage) {
      return {}
    }
    return {
      initialMarginRate: {
        beforeValue: new BigNumber(perpetualStorage.initialMarginRate).times(100).toFixed(2),
        afterValue: (() => {
          const val = this.getAfterValue(
            new BigNumber(perpetualStorage.initialMarginRate),
            new BigNumber(data[1][0].toString())
          )
          if (!val) {
            return ''
          }
          return val.times(100).toFixed(2)
        })(),
      },
      maintenanceMarginRate: {
        beforeValue: new BigNumber(perpetualStorage.maintenanceMarginRate).times(100).toFixed(2),
        afterValue: (() => {
          const val = this.getAfterValue(
            new BigNumber(perpetualStorage.maintenanceMarginRate),
            new BigNumber(data[1][1].toString())
          )
          if (!val) {
            return ''
          }
          return val.times(100).toFixed(2)
        })(),
      },
      operatorFeeRate: {
        beforeValue: new BigNumber(perpetualStorage.operatorFeeRate).times(100).toFixed(3),
        afterValue: (() => {
          const val = this.getAfterValue(
            new BigNumber(perpetualStorage.operatorFeeRate),
            new BigNumber(data[1][2].toString())
          )
          if (!val) {
            return ''
          }
          return val.times(100).toFixed(3)
        })(),
      },
      lpFeeRate: {
        beforeValue: new BigNumber(perpetualStorage.lpFeeRate).times(100).toFixed(3),
        afterValue: (() => {
          const val = this.getAfterValue(
            new BigNumber(perpetualStorage.lpFeeRate),
            new BigNumber(data[1][3].toString())
          )
          if (!val) {
            return ''
          }
          return val.times(100).toFixed(3)
        })(),
      },
      referrerRebateRate: {
        beforeValue: new BigNumber(perpetualStorage.referrerRebateRate).times(100).toFixed(2),
        afterValue: (() => {
          const val = this.getAfterValue(
            new BigNumber(perpetualStorage.referrerRebateRate),
            new BigNumber(data[1][4].toString())
          )
          if (!val) {
            return ''
          }
          return val.times(100).toFixed(2)
        })(),
      },
      liquidationPenaltyRate: {
        beforeValue: new BigNumber(perpetualStorage.liquidationPenaltyRate).times(100).toFixed(2),
        afterValue: (() => {
          const val = this.getAfterValue(
            new BigNumber(perpetualStorage.liquidationPenaltyRate),
            new BigNumber(data[1][5].toString())
          )
          if (!val) {
            return ''
          }
          return val.times(100).toFixed(2)
        })(),
      },
      keeperGasReward: {
        beforeValue: new BigNumber(perpetualStorage.keeperGasReward).toPrecision(5),
        afterValue: (() => {
          const val = this.getAfterValue(
            new BigNumber(perpetualStorage.keeperGasReward),
            new BigNumber(data[1][6].toString())
          )
          if (!val) {
            return ''
          }
          return val.toPrecision(5)
        })(),
      },
      insuranceFundRate: {
        beforeValue: new BigNumber(perpetualStorage.insuranceFundRate).times(100).toFixed(2),
        afterValue: (() => {
          const val = this.getAfterValue(
            new BigNumber(perpetualStorage.insuranceFundRate),
            new BigNumber(data[1][7].toString())
          )
          if (!val) {
            return ''
          }
          return val.times(100).toFixed(2)
        })(),
      },
      maxOpenInterestRate: {
        beforeValue: new BigNumber(perpetualStorage.maxOpenInterestRate).toFixed(0),
        afterValue: (() => {
          const val = this.getAfterValue(
            new BigNumber(perpetualStorage.maxOpenInterestRate),
            new BigNumber(data[1][8].toString())
          )
          if (!val) {
            return ''
          }
          return val.toFixed(0)
        })(),
      },
    }
  }

  decodeRiskParamsCallDatas(data: any[]): { [name: string]: ParamsItem } {
    let perpetualStorage: PerpetualStorage | null = null
    if (!this.description) {
      perpetualStorage = this.perpetualStorage(this.perpetualIndex)
    } else {
      perpetualStorage = JSON.parse(this.description.perpetualStorage)
    }
    if (!perpetualStorage) {
      return {}
    }
    return {
      halfSpread: {
        beforeValue: new BigNumber(perpetualStorage.halfSpread.value).times(100).toFixed(2),
        afterValue: (() => {
          const val = this.getAfterValue(
            new BigNumber(perpetualStorage.halfSpread.value),
            new BigNumber(data[1][0].toString())
          )
          if (!val) {
            return ''
          }
          return val.times(100).toFixed(2)
        })(),
      },
      minHalfSpread: {
        beforeValue: new BigNumber(perpetualStorage.halfSpread.minValue).times(100).toFixed(2),
        afterValue: (() => {
          const val = this.getAfterValue(
            new BigNumber(perpetualStorage.halfSpread.minValue),
            new BigNumber(data[2][0].toString())
          )
          if (!val) {
            return ''
          }
          return val.times(100).toFixed(2)
        })(),
      },
      maxHalfSpread: {
        beforeValue: new BigNumber(perpetualStorage.halfSpread.maxValue).times(100).toFixed(2),
        afterValue: (() => {
          const val = this.getAfterValue(
            new BigNumber(perpetualStorage.halfSpread.maxValue),
            new BigNumber(data[3][0].toString())
          )
          if (!val) {
            return ''
          }
          return val.times(100).toFixed(2)
        })(),
      },
      openSlippage: {
        beforeValue: new BigNumber(perpetualStorage.openSlippageFactor.value).toFixed(2),
        afterValue: (() => {
          const val = this.getAfterValue(
            new BigNumber(perpetualStorage.openSlippageFactor.value),
            new BigNumber(data[1][1].toString())
          )
          if (!val) {
            return ''
          }
          return val.toFixed(2)
        })(),
      },
      minOpenSlippage: {
        beforeValue: new BigNumber(perpetualStorage.openSlippageFactor.minValue).toFixed(2),
        afterValue: (() => {
          const val = this.getAfterValue(
            new BigNumber(perpetualStorage.openSlippageFactor.minValue),
            new BigNumber(data[2][1].toString())
          )
          if (!val) {
            return ''
          }
          return val.toFixed(2)
        })(),
      },
      maxOpenSlippage: {
        beforeValue: new BigNumber(perpetualStorage.openSlippageFactor.maxValue).toFixed(2),
        afterValue: (() => {
          const val = this.getAfterValue(
            new BigNumber(perpetualStorage.openSlippageFactor.maxValue),
            new BigNumber(data[3][1].toString())
          )
          if (!val) {
            return ''
          }
          return val.toFixed(2)
        })(),
      },
      closeSlippage: {
        beforeValue: new BigNumber(perpetualStorage.closeSlippageFactor.value).toFixed(2),
        afterValue: (() => {
          const val = this.getAfterValue(
            new BigNumber(perpetualStorage.closeSlippageFactor.value),
            new BigNumber(data[1][2].toString())
          )
          if (!val) {
            return ''
          }
          return val.toFixed(2)
        })(),
      },
      minCloseSlippage: {
        beforeValue: new BigNumber(perpetualStorage.closeSlippageFactor.minValue).toFixed(2),
        afterValue: (() => {
          const val = this.getAfterValue(
            new BigNumber(perpetualStorage.closeSlippageFactor.minValue),
            new BigNumber(data[2][2].toString())
          )
          if (!val) {
            return ''
          }
          return val.toFixed(2)
        })(),
      },
      maxCloseSlippage: {
        beforeValue: new BigNumber(perpetualStorage.closeSlippageFactor.maxValue).toFixed(2),
        afterValue: (() => {
          const val = this.getAfterValue(
            new BigNumber(perpetualStorage.closeSlippageFactor.maxValue),
            new BigNumber(data[3][2].toString())
          )
          if (!val) {
            return ''
          }
          return val.toFixed(2)
        })(),
      },
      fundingRateFactor: {
        beforeValue: new BigNumber(perpetualStorage.fundingRateFactor.value).times(100).toFixed(2),
        afterValue: (() => {
          const val = this.getAfterValue(perpetualStorage.fundingRateFactor.value, new BigNumber(data[1][6].toString()))
          if (!val) {
            return ''
          }
          return val.times(100).toFixed(2)
        })(),
      },
      minFundingRateFactor: {
        beforeValue: new BigNumber(perpetualStorage.fundingRateFactor.minValue).times(100).toFixed(2),
        afterValue: (() => {
          const val = this.getAfterValue(
            new BigNumber(perpetualStorage.fundingRateFactor.minValue),
            new BigNumber(data[2][6].toString())
          )
          if (!val) {
            return ''
          }
          return val.times(100).toFixed(2)
        })(),
      },
      maxFundingRateFactor: {
        beforeValue: new BigNumber(perpetualStorage.fundingRateFactor.maxValue).times(100).toFixed(2),
        afterValue: (() => {
          const val = this.getAfterValue(
            new BigNumber(perpetualStorage.fundingRateFactor.maxValue),
            new BigNumber(data[3][6].toString())
          )
          if (!val) {
            return ''
          }
          return val.times(100).toFixed(2)
        })(),
      },
      fundingRateLimit: {
        beforeValue: new BigNumber(perpetualStorage.fundingRateLimit.value).times(100).toFixed(2),
        afterValue: (() => {
          const val = this.getAfterValue(perpetualStorage.fundingRateLimit.value, new BigNumber(data[1][3].toString()))
          if (!val) {
            return ''
          }
          return val.times(100).toFixed(2)
        })(),
      },
      minFundingRateLimit: {
        beforeValue: new BigNumber(perpetualStorage.fundingRateLimit.minValue).times(100).toFixed(2),
        afterValue: (() => {
          const val = this.getAfterValue(
            new BigNumber(perpetualStorage.fundingRateLimit.minValue),
            new BigNumber(data[2][3].toString())
          )
          if (!val) {
            return ''
          }
          return val.times(100).toFixed(2)
        })(),
      },
      maxFundingRateLimit: {
        beforeValue: new BigNumber(perpetualStorage.fundingRateLimit.maxValue).times(100).toFixed(2),
        afterValue: (() => {
          const val = this.getAfterValue(
            new BigNumber(perpetualStorage.fundingRateLimit.maxValue),
            new BigNumber(data[3][3].toString())
          )
          if (!val) {
            return ''
          }
          return val.times(100).toFixed(2)
        })(),
      },
      ammMaxLeverage: {
        beforeValue: new BigNumber(perpetualStorage.ammMaxLeverage.value).toFixed(2),
        afterValue: (() => {
          const val = this.getAfterValue(
            new BigNumber(perpetualStorage.ammMaxLeverage.value),
            new BigNumber(data[1][4].toString())
          )
          if (!val) {
            return ''
          }
          return val.toFixed(2)
        })(),
      },
      minAMMMaxLeverage: {
        beforeValue: new BigNumber(perpetualStorage.ammMaxLeverage.minValue).toFixed(2),
        afterValue: (() => {
          const val = this.getAfterValue(
            new BigNumber(perpetualStorage.ammMaxLeverage.minValue),
            new BigNumber(data[2][4].toString())
          )
          if (!val) {
            return ''
          }
          return val.toFixed(2)
        })(),
      },
      maxAMMMaxLeverage: {
        beforeValue: new BigNumber(perpetualStorage.ammMaxLeverage.maxValue).toFixed(2),
        afterValue: (() => {
          const val = this.getAfterValue(
            new BigNumber(perpetualStorage.ammMaxLeverage.maxValue),
            new BigNumber(data[3][4].toString())
          )
          if (!val) {
            return ''
          }
          return val.toFixed(2)
        })(),
      },
      closePriceDiscount: {
        beforeValue: new BigNumber(perpetualStorage.maxClosePriceDiscount.value).times(100).toFixed(2),
        afterValue: (() => {
          const val = this.getAfterValue(
            new BigNumber(perpetualStorage.maxClosePriceDiscount.value),
            new BigNumber(data[1][5].toString())
          )
          if (!val) {
            return ''
          }
          return val.times(100).toFixed(2)
        })(),
      },
      minClosePriceDiscount: {
        beforeValue: new BigNumber(perpetualStorage.maxClosePriceDiscount.minValue).times(100).toFixed(2),
        afterValue: (() => {
          const val = this.getAfterValue(
            new BigNumber(perpetualStorage.maxClosePriceDiscount.minValue),
            new BigNumber(data[2][5].toString())
          )
          if (!val) {
            return ''
          }
          return val.times(100).toFixed(2)
        })(),
      },
      maxClosePriceDiscount: {
        beforeValue: new BigNumber(perpetualStorage.maxClosePriceDiscount.maxValue).times(100).toFixed(2),
        afterValue: (() => {
          const val = this.getAfterValue(
            new BigNumber(perpetualStorage.maxClosePriceDiscount.maxValue),
            new BigNumber(data[3][5].toString())
          )
          if (!val) {
            return ''
          }
          return val.times(100).toFixed(2)
        })(),
      },
      defaultTargetLeverage: {
        beforeValue: new BigNumber(perpetualStorage.defaultTargetLeverage.value).toFixed(0),
        afterValue: (() => {
          if (perpetualStorage) {
            const val = this.getAfterValue(
              new BigNumber(perpetualStorage?.defaultTargetLeverage.value),
              new BigNumber(data[1][7].toString())
            )
            if (!val) {
              return ''
            }
            return val.toFixed(0)
          }
          return ''
        })(),
      },
      minDefaultTargetLeverage: {
        beforeValue: new BigNumber(perpetualStorage.defaultTargetLeverage.minValue).toFixed(0),
        afterValue: (() => {
          if (perpetualStorage) {
            const val = this.getAfterValue(
              new BigNumber(perpetualStorage?.defaultTargetLeverage.minValue),
              new BigNumber(data[2][7].toString())
            )
            if (!val) {
              return ''
            }
            return val.toFixed(0)
          }
          return ''
        })(),
      },
      maxDefaultTargetLeverage: {
        beforeValue: new BigNumber(perpetualStorage.defaultTargetLeverage.maxValue).toFixed(0),
        afterValue: (() => {
          if (perpetualStorage) {
            const val = this.getAfterValue(
              new BigNumber(perpetualStorage?.defaultTargetLeverage.maxValue),
              new BigNumber(data[3][7].toString())
            )
            if (!val) {
              return ''
            }
            return val.toFixed(0)
          }
          return ''
        })(),
      },
      baseFundingRate: {
        beforeValue: new BigNumber(perpetualStorage.baseFundingRate.value).toFixed(2),
        afterValue: (() => {
          const val = this.getAfterValue(
            new BigNumber(perpetualStorage.baseFundingRate.value),
            new BigNumber(data[1][8].toString())
          )
          if (!val) {
            return ''
          }
          return val.times(100).toFixed(2)
        })(),
      },
      minBaseFundingRate: {
        beforeValue: new BigNumber(perpetualStorage.baseFundingRate.minValue).toFixed(2),
        afterValue: (() => {
          const val = this.getAfterValue(
            new BigNumber(perpetualStorage.baseFundingRate.minValue),
            new BigNumber(data[2][8].toString())
          )
          if (!val) {
            return ''
          }
          return val.times(100).toFixed(2)
        })(),
      },
      maxBaseFundingRate: {
        beforeValue: new BigNumber(perpetualStorage.baseFundingRate.maxValue).toFixed(2),
        afterValue: (() => {
          const val = this.getAfterValue(
            new BigNumber(perpetualStorage.baseFundingRate.maxValue),
            new BigNumber(data[3][8].toString())
          )
          if (!val) {
            return ''
          }
          return val.times(100).toFixed(2)
        })(),
      },
    }
  }

  buildProposalByCallDatas() {
    this.collateralSymbol = ''
    this.contractParams = {}
    this.riskParams = {}
    this.perpetualIndex = -1
    if (this.decoded.length === 0) {
      return
    }
    for (let i = 0; i < this.decoded.length; i++) {
      const perpetualIndex = (this.decoded[i].data[0] as ethers.BigNumber).toNumber()
      if (this.perpetualIndex < 0) {
        this.perpetualIndex = perpetualIndex
      } else if (this.perpetualIndex != perpetualIndex) {
        throw new Error('decode pool proposal failed: perpetual index changed')
      }
      this.collateralSymbol = this.perpetualProperty(perpetualIndex)?.collateralTokenSymbol || ''
      switch (this.decoded[i].type) {
        case LowLevelPoolProposalTypes.SetPerpetualBaseParameter:
          this.contractParams = this.decodeBaseParamsCallDatas(this.decoded[i].data)
          break
        case LowLevelPoolProposalTypes.SetPerpetualRiskParameter:
          this.riskParams = this.decodeRiskParamsCallDatas(this.decoded[i].data)
          break
      }
    }
  }

  title(vue: Vue): string {
    if (this.decoded.length === 0) {
      return ''
    }
    if (!this.liquidityPool) {
      return ''
    }
    const perpetual = this.perpetualProperty(this.perpetualIndex)
    if (!perpetual) {
      return ''
    }
    return vue
      .$t('pool.poolProposal.perpParamsProposal.proposalTitle', {
        symbol: `${perpetual.symbolStr} ${perpetual.underlyingAssetSymbol}-${perpetual.collateralTokenSymbol}`,
      })
      .toString()
  }
}

export class SettlePerpPoolProposal extends PoolProposalBase implements IPoolProposalBuilder {
  public type = CombinedPoolProposalTypes.SettlePerp
  public perpetualIndex: number = -1
  public settlementPrice: BigNumber = _0

  buildProposalByParams(perpetualIndex: number, settlementPrice: BigNumber) {
    this.perpetualIndex = perpetualIndex
    this.settlementPrice = settlementPrice
    const v = [perpetualIndex, settlementPrice.shiftedBy(DECIMALS).toFixed(0)]
    this.signatures = [LowLevelPoolProposalTypes.ForceToSetEmergencyState.toString()]
    this.callDatas = [encodeProposal(LowLevelPoolProposalTypes.ForceToSetEmergencyState, v)]
    this.description = null
  }

  buildProposalByCallDatas() {
    this.perpetualIndex = -1
    if (this.decoded.length === 0) {
      return
    }
    this.perpetualIndex = (this.decoded[0].data[0] as ethers.BigNumber).toNumber()
    this.settlementPrice = new BigNumber((this.decoded[0].data[1] as ethers.BigNumber).toString()).shiftedBy(-DECIMALS)
  }

  title(vue: Vue): string {
    if (!this.liquidityPool) {
      return ''
    }
    const perpetual = this.perpetualProperty(this.perpetualIndex)
    if (!perpetual) {
      return ''
    }
    return vue
      .$t('pool.poolProposal.settlePerpProposal.proposalTitle', {
        symbol: `${perpetual.symbolStr} ${perpetual.underlyingAssetSymbol}-${perpetual.collateralTokenSymbol}`,
      })
      .toString()
  }
}

export class ChangePerpPrivilegePoolProposal extends PoolProposalBase implements IPoolProposalBuilder {
  public type = CombinedPoolProposalTypes.ChangePerpPrivilege
  public isAllow: boolean = false

  buildProposalByParams(
    isAllow: boolean,
    oldParams: {
      insuranceFundCap: BigNumber
    }
  ) {
    this.isAllow = isAllow
    const v = [[isAllow ? 1 : 0, oldParams.insuranceFundCap.shiftedBy(DECIMALS).toFixed()]]
    this.signatures = [LowLevelPoolProposalTypes.SetLiquidityPoolParameter.toString()]
    this.callDatas = [encodeProposal(LowLevelPoolProposalTypes.SetLiquidityPoolParameter, v)]
    this.description = null
  }

  buildProposalByCallDatas() {
    this.isAllow = false
    if (this.decoded.length === 0) {
      return
    }
    this.isAllow = (this.decoded[0].data[0][0] as ethers.BigNumber).toString() === '1'
  }

  title(vue: Vue): string {
    if (this.decoded.length === 0) {
      return ''
    }
    return vue
      .$t('pool.poolProposal.changePerpPrivilegeProposal.proposalTitle', {
        status: this.isAllow
          ? vue.$t('pool.poolProposal.changePerpPrivilegeProposal.allow').toString()
          : vue.$t('pool.poolProposal.changePerpPrivilegeProposal.notAllow').toString(),
      })
      .toString()
  }
}

export class ChangeInsuranceFundCapPoolProposal extends PoolProposalBase implements IPoolProposalBuilder {
  public type = CombinedPoolProposalTypes.ChangeInsuranceFundCap
  public insuranceFundCap: BigNumber | null = null
  public beforeInsuranceFundCap: BigNumber | null = null

  buildProposalByParams(
    insuranceFundCap: BigNumber,
    oldParams: { isAllow: boolean },
    descriptionContent: { beforeInsuranceFundCap: string }
  ) {
    this.insuranceFundCap = insuranceFundCap
    const v = [[oldParams.isAllow ? 1 : 0, this.insuranceFundCap.shiftedBy(DECIMALS).toFixed()]]
    this.signatures = [LowLevelPoolProposalTypes.SetLiquidityPoolParameter.toString()]
    this.callDatas = [encodeProposal(LowLevelPoolProposalTypes.SetLiquidityPoolParameter, v)]
    this.description = descriptionContent
  }

  buildProposalByCallDatas() {
    this.insuranceFundCap = null
    if (this.decoded.length === 0) {
      return
    }
    this.insuranceFundCap = normalizeBigNumberish(this.decoded[0].data[0][1]).shiftedBy(-DECIMALS)
    if (typeof this.description !== 'undefined' && this.description) {
      const v = this.description['beforeInsuranceFundCap']
      this.beforeInsuranceFundCap = v ? toBigNumber(v) : null
    }
  }

  title(vue: Vue): string {
    if (this.decoded.length === 0) {
      return ''
    }
    return vue.$t('pool.poolProposal.changeInsuranceFundCapProposal.proposalTitle').toString()
  }
}

export class AppointNewOperatorPoolProposal extends PoolProposalBase implements IPoolProposalBuilder {
  public type = CombinedPoolProposalTypes.AppointNewOperator
  public newOperatorAddress: string = ''

  buildProposalByParams(newOperatorAddress: string) {
    this.newOperatorAddress = newOperatorAddress
    const v = [newOperatorAddress]
    this.signatures = [LowLevelPoolProposalTypes.TransferOperator.toString()]
    this.callDatas = [encodeProposal(LowLevelPoolProposalTypes.TransferOperator, v)]
  }

  buildProposalByCallDatas() {
    this.newOperatorAddress = ''
    if (this.decoded.length === 0) {
      return
    }
    this.newOperatorAddress = this.decoded[0].data[0]
  }

  title(vue: Vue): string {
    return vue.$t('pool.poolProposal.appointOperatorProposal.proposalTitle').toString()
  }
}

export class CreateNewPerpetualPoolProposal extends PoolProposalBase implements IPoolProposalBuilder {
  public type = CombinedPoolProposalTypes.CreateNewPerpetual
  public oracleAddress: string = ''
  public coreParams: Array<string> = []
  public riskParams: Array<string> = []
  public minRiskParams: Array<string> = []
  public maxRiskParams: Array<string> = []

  buildProposalByParams(
    oracleAddress: string,
    coreParams: Array<string>,
    riskParams: Array<string>,
    minRiskParams: Array<string>,
    maxRiskParams: Array<string>,
    descriptionContent: { underlyingSymbol: string; collateralSymbol: string }
  ) {
    this.oracleAddress = oracleAddress
    const v = [oracleAddress, coreParams, riskParams, minRiskParams, maxRiskParams]
    this.signatures = [LowLevelPoolProposalTypes.CreatePerpetual.toString()]
    this.callDatas = [encodeProposal(LowLevelPoolProposalTypes.CreatePerpetual, v)]
    this.description = descriptionContent
  }

  buildProposalByCallDatas() {
    this.oracleAddress = ''
    this.coreParams = []
    this.riskParams = []
    this.minRiskParams = []
    this.maxRiskParams = []
    if (this.decoded.length === 0) {
      return
    }
    // use proposalDetails instead
  }

  proposalDetails(): {
    oracleAddress: string
    collateralSymbol: string
    underlyingSymbol: string
    contractParams: {
      initialMarginRate: BigNumber
      maintenanceMarginRate: BigNumber
      operatorFeeRate: BigNumber
      lpFeeRate: BigNumber
      referrerRebateRate: BigNumber
      liquidationPenaltyRate: BigNumber
      keeperGasReward: BigNumber
      insuranceFundRate: BigNumber
      maxOpenInterestRate: BigNumber
    }
    riskParams: {
      halfSpread: BigNumber
      minHalfSpread: BigNumber
      maxHalfSpread: BigNumber
      openSlippage: BigNumber
      minOpenSlippage: BigNumber
      maxOpenSlippage: BigNumber
      closeSlippage: BigNumber
      minCloseSlippage: BigNumber
      maxCloseSlippage: BigNumber
      fundingRateFactor: BigNumber
      minFundingRateFactor: BigNumber
      maxFundingRateFactor: BigNumber
      fundingRateLimit: BigNumber
      minFundingRateLimit: BigNumber
      maxFundingRateLimit: BigNumber
      ammMaxLeverage: BigNumber
      minAMMMaxLeverage: BigNumber
      maxAMMMaxLeverage: BigNumber
      closePriceDiscount: BigNumber
      minClosePriceDiscount: BigNumber
      maxClosePriceDiscount: BigNumber
      baseFundingRate: BigNumber
      minBaseFundingRate: BigNumber
      maxBaseFundingRate: BigNumber
      defaultTarget: BigNumber
      minDefaultTarget: BigNumber
      maxDefaultTarget: BigNumber
    }
  } | null {
    if (this.decoded.length === 0) {
      return null
    }
    const data = this.decoded[0].data
    return {
      oracleAddress: data[0],
      collateralSymbol: this.description?.collateralSymbol || '',
      underlyingSymbol: this.description?.underlyingSymbol || '',
      contractParams: {
        initialMarginRate: new BigNumber(data[1][0].toString()).shiftedBy(-DECIMALS),
        maintenanceMarginRate: new BigNumber(data[1][1].toString()).shiftedBy(-DECIMALS),
        operatorFeeRate: new BigNumber(data[1][2].toString()).shiftedBy(-DECIMALS),
        lpFeeRate: new BigNumber(data[1][3].toString()).shiftedBy(-DECIMALS),
        referrerRebateRate: new BigNumber(data[1][4].toString()).shiftedBy(-DECIMALS),
        liquidationPenaltyRate: new BigNumber(data[1][5].toString()).shiftedBy(-DECIMALS),
        keeperGasReward: new BigNumber(data[1][6].toString()).shiftedBy(-DECIMALS),
        insuranceFundRate: new BigNumber(data[1][7].toString()).shiftedBy(-DECIMALS),
        maxOpenInterestRate: new BigNumber(data[1][8].toString()).shiftedBy(-DECIMALS),
      },
      riskParams: {
        halfSpread: new BigNumber(data[2][0].toString()).shiftedBy(-DECIMALS),
        minHalfSpread: new BigNumber(data[3][0].toString()).shiftedBy(-DECIMALS),
        maxHalfSpread: new BigNumber(data[4][0].toString()).shiftedBy(-DECIMALS),

        openSlippage: new BigNumber(data[2][1].toString()).shiftedBy(-DECIMALS),
        minOpenSlippage: new BigNumber(data[3][1].toString()).shiftedBy(-DECIMALS),
        maxOpenSlippage: new BigNumber(data[4][1].toString()).shiftedBy(-DECIMALS),

        closeSlippage: new BigNumber(data[2][2].toString()).shiftedBy(-DECIMALS),
        minCloseSlippage: new BigNumber(data[3][2].toString()).shiftedBy(-DECIMALS),
        maxCloseSlippage: new BigNumber(data[4][2].toString()).shiftedBy(-DECIMALS),

        fundingRateLimit: new BigNumber(data[2][3].toString()).shiftedBy(-DECIMALS),
        minFundingRateLimit: new BigNumber(data[3][3].toString()).shiftedBy(-DECIMALS),
        maxFundingRateLimit: new BigNumber(data[4][3].toString()).shiftedBy(-DECIMALS),

        ammMaxLeverage: new BigNumber(data[2][4].toString()).shiftedBy(-DECIMALS),
        minAMMMaxLeverage: new BigNumber(data[3][4].toString()).shiftedBy(-DECIMALS),
        maxAMMMaxLeverage: new BigNumber(data[4][4].toString()).shiftedBy(-DECIMALS),

        closePriceDiscount: new BigNumber(data[2][5].toString()).shiftedBy(-DECIMALS),
        minClosePriceDiscount: new BigNumber(data[3][5].toString()).shiftedBy(-DECIMALS),
        maxClosePriceDiscount: new BigNumber(data[4][5].toString()).shiftedBy(-DECIMALS),

        fundingRateFactor: new BigNumber(data[2][6].toString()).shiftedBy(-DECIMALS),
        minFundingRateFactor: new BigNumber(data[3][6].toString()).shiftedBy(-DECIMALS),
        maxFundingRateFactor: new BigNumber(data[4][6].toString()).shiftedBy(-DECIMALS),

        defaultTarget: new BigNumber(data[2][7].toString()).shiftedBy(-DECIMALS),
        minDefaultTarget: new BigNumber(data[3][7].toString()).shiftedBy(-DECIMALS),
        maxDefaultTarget: new BigNumber(data[4][7].toString()).shiftedBy(-DECIMALS),

        baseFundingRate: new BigNumber(data[2][8].toString()).shiftedBy(-DECIMALS),
        minBaseFundingRate: new BigNumber(data[3][8].toString()).shiftedBy(-DECIMALS),
        maxBaseFundingRate: new BigNumber(data[4][8].toString()).shiftedBy(-DECIMALS),
      },
    }
  }

  title(vue: Vue): string {
    if (!this.description) {
      return ''
    }
    return vue
      .$t('pool.poolProposal.createNewPerpetualProposal.proposalTitle', {
        symbol: `${this.description.underlyingSymbol}-${this.description.collateralSymbol}`,
      })
      .toString()
  }
}

export class ChangeOraclePoolProposal extends PoolProposalBase implements IPoolProposalBuilder {
  public type = CombinedPoolProposalTypes.ChangeOracle
  public oracleAddress: string = ''
  public perpetualIndex: number = -1

  buildProposalByParams(perpetualIndex: number, oracleAddress: string) {
    this.oracleAddress = oracleAddress
    const v = [perpetualIndex, oracleAddress]
    this.signatures = [LowLevelPoolProposalTypes.SetOracle.toString()]
    this.callDatas = [encodeProposal(LowLevelPoolProposalTypes.SetOracle, v)]
    this.description = null
  }
  buildProposalByCallDatas() {
    this.perpetualIndex = -1
    this.oracleAddress = ''
    if (this.decoded.length === 0) {
      return
    }
    this.perpetualIndex = (this.decoded[0].data[0] as ethers.BigNumber).toNumber()
    this.oracleAddress = this.decoded[0].data[1]
  }
  title(vue: Vue): string {
    if (!this.liquidityPool) {
      return ''
    }
    const perpetual = this.perpetualProperty(this.perpetualIndex)
    if (!perpetual) {
      return ''
    }
    return vue
      .$t('pool.poolProposal.changeOracle.proposalTitle', {
        symbol: `${perpetual.symbolStr} ${perpetual.underlyingAssetSymbol}-${perpetual.collateralTokenSymbol}`,
      })
      .toString()
  }
}

export class UpgradeContractPoolProposal extends PoolProposalBase implements IPoolProposalBuilder {
  public type = CombinedPoolProposalTypes.UpgradeContract

  buildProposalByParams() {}

  buildProposalByCallDatas() {}

  title(vue: Vue): string {
    return vue.$t('pool.poolProposal.upgradeContractProposal.proposalTitle').toString()
  }
}

export class UnknownPoolProposal extends PoolProposalBase implements IPoolProposalBuilder {
  public type = CombinedPoolProposalTypes.Unrecognized
  createProposal(lpGovernorAddress: string, singer: ethers.Signer): Promise<ContractTransaction> {
    throw new InvalidArgumentError('not supported yet')
  }
  buildProposalByParams() {
    throw new InvalidArgumentError('not supported yet')
  }
  buildProposalByCallDatas() {}
  title(vue: Vue): string {
    return vue.$t('pool.poolProposal.unknownProposal.proposalTitle').toString()
  }
  proposalDetails(): any {
    return null
  }
}
