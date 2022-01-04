// this is a combination of DaoActionTypes
import { Component, Mixins, Vue } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import {
  ActionType2Signatures,
  CombinedDaoActionTypes,
  decodeProposal,
  encodeActionHash,
  encodeProposal,
  FunctionSignature2DaoActionTypes,
  noParseSignaturesAction,
} from './lowLevelDaoProposal'
import {
  CustomActionDatas,
  DaoActionData,
  MiningSupplyPoolType,
  MintSATORIActionDatas,
  SetLiquidityMiningRateActionDatas,
  SetSATORIStakingMiningRateActionDatas,
  SetMiningSupplyActionDatas,
  TransferVaultAssetsActionDatas,
} from '@/template/components/DAO/Actions/types'
import { getIpfsStorageData } from '@/api/ipfs'
import { queryPoolsFromGovernor, querySpecifiedPools } from '@/api/pool'
import { ellipsisMiddle, formatAddress, fromDecimals, toDecimals } from '@/utils'
import { isNativeToken } from '@/utils/chain'
import {
  EMPTY_ADDRESS,
  TARGET_NETWORK_ID
} from '@/const'
import BigNumber from 'bignumber.js'
import store from '@/store'
import {
  DECIMALS, erc20Decimals,
  erc20Symbol,
  getERC20Contract,
  normalizeBigNumberish,
} from '@mcdex/mai3.js'
import { currentChainConfig } from '@/config/chain'
import {
  CHAIN_ID_TO_DAO_MINING_ADDRESS,
  CHAIN_ID_TO_DAO_MINTER_ADDRESS,
  CHAIN_ID_TO_DAO_VAULT_ADDRESS
} from '@mcdex/mcdex-governance.js'

export interface IDaoActionBuilder {
  type: CombinedDaoActionTypes
  buildActionByParams(...params: any[]): void
  buildActionByCallDatas(): void
  details(vue: Vue): string
}

export interface DaoActionBuildData {
  targets: string[]
  values: string[]
  signatures: string[]
  calldatas: string[]
}

export interface DaoProposalIpfsStoreData {
  title: string
  overview: string
  forumLink: string
}

export interface DaoProposalDescription {
  title: string
  forumLink: string
  ipfsHash: string
}

@Component
export class DaoProposalMixin extends Mixins(ErrorHandlerMixin) {

  async getDaoProposalIpfsStoreData(hash: string): Promise<DaoProposalIpfsStoreData | null> {
    try {
      return await getIpfsStorageData(hash)
    } catch (e) {
      return null
    }
  }

  buildDescription(data: DaoProposalDescription): string {
    try {
      return JSON.stringify(data)
    } catch (e) {
      console.error("build dao proposal description fail, ", e)
      return ''
    }
  }

  parseDescription(value: string): DaoProposalDescription | null {
    try {
      const result = JSON.parse(value)
      if (result && result !== '') {
        return result as DaoProposalDescription
      } else {
        return null
      }
    } catch (e) {
      return null
    }
  }

  getActionObject(actionType: CombinedDaoActionTypes): DaoActionBase {
    let builder: DaoActionBase | null = null
    switch (actionType) {
      case CombinedDaoActionTypes.TransferVaultAssets:
        builder = new TransferVaultAssetsAction()
        break
      case CombinedDaoActionTypes.MintSATORI:
        builder = new MintSATORIAction()
        break
      case CombinedDaoActionTypes.SetLiquidityMiningRate:
        builder = new SetLiquidityMiningPoolRateAction()
        break
      case CombinedDaoActionTypes.SetUniswapMiningRate:
        builder = new SetUniswapMiningPoolRateAction()
        break
      case CombinedDaoActionTypes.SetSATORIStakingMiningRate:
        builder = new SetSATORIStakingMiningRateAction()
        break
      case CombinedDaoActionTypes.SetMiningSupply:
        builder = new SetMiningSupplyAction()
        break
    }
    if (!builder) {
      builder = new CustomAction()
    }
    return builder
  }

  // form data to callDatas
  buildActions(actions: DaoActionData[]): DaoActionBuildData[] {
    let result: DaoActionBuildData[] = []
    actions.forEach((action) => {
      const builder = this.getActionObject(action.selectActionType)
      builder.buildActionByParams(action.datas)
      result.push({
        targets: builder.targets,
        values: builder.values,
        signatures: builder.signatures,
        calldatas: builder.callDatas
      })
    })
    return result
  }

  checkActionsRepeatIndex(buildActionData: DaoActionBuildData[]): number[] {
    let hashArray: string[] = []
    buildActionData.forEach(item => {
      hashArray.push(encodeActionHash(item.targets, item.signatures, item.calldatas, item.values[0]))
    })
    const s = new Set(hashArray)
    if (s.size === hashArray.length) {
      return []
    }
    let r = new Set<number>()
    for (let i=0;i<hashArray.length;i++) {
      const v1 = hashArray[i]
      for (let j=i+1; j<hashArray.length; j++) {
        if (v1 === hashArray[j]) {
          r.add(j)
        }
      }
    }
    return Array.from(r)
  }

  // callDatas to view data
  async parseActions(data: DaoActionBuildData): Promise<DaoActionBase[]> {
    let result: DaoActionBase[] = []
    const signatures = data.signatures
    for (let i=0;i<signatures.length;i++) {
      const signature = signatures[i]
      if (noParseSignaturesAction.indexOf(signature) > -1) {
        continue
      }
      const actionType = FunctionSignature2DaoActionTypes[signature]
      let builder: DaoActionBase = this.getActionObject(CombinedDaoActionTypes.Custom)
      if (typeof actionType !== 'undefined') {
        builder = this.getActionObject(actionType)
      }
      builder.targets = [data.targets[i]]
      builder.values = [data.values[i]]
      builder.signatures = [data.signatures[i]]
      builder.callDatas = [data.calldatas[i]]
      await builder.buildActionByCallDatas()
      result.push(builder)
    }
    return result
  }
}

export class DaoActionBase implements IDaoActionBuilder {
  public type = CombinedDaoActionTypes.Custom
  public callDatas: string[] = []
  public signatures: string[] = []
  public values: string[] = []
  public targets: string[] = []

  buildActionByParams(...params: any[]): void {
    throw new Error('override me')
  }

  async buildActionByCallDatas(): Promise<void> {
    throw new Error('override me')
  }

  details(vue: Vue): string {
    throw new Error('override me')
  }
}

export class TransferVaultAssetsAction extends DaoActionBase implements IDaoActionBuilder {
  public type = CombinedDaoActionTypes.TransferVaultAssets
  private actionSignatures: { [name: string]: string } = ActionType2Signatures[this.type.toString()]
  private tokenAddress: string | undefined = undefined
  private receiveAddress: string | undefined = undefined
  private amount: BigNumber | undefined = undefined
  private tokenSymbolName: string | undefined = undefined

  buildActionByParams(form: TransferVaultAssetsActionDatas) {
    this.targets = [formatAddress(CHAIN_ID_TO_DAO_VAULT_ADDRESS[TARGET_NETWORK_ID])]
    this.values = ['0']
    if (form.assetsTokenAddress.toLowerCase() === EMPTY_ADDRESS) {
      this.buildEthSignature(form)
    } else {
      this.buildErc20Signature(form)
    }
  }

  buildEthSignature(form: TransferVaultAssetsActionDatas) {
    const v: any[] = [formatAddress(form.receiveAddress), toDecimals(form.assetsAmount, DECIMALS)]
    this.signatures = [this.actionSignatures.transferETH.toString()]
    this.callDatas = [encodeProposal(this.actionSignatures.transferETH, v)]
  }

  async parseEthSignature() {
    const decodedData = decodeProposal(this.signatures[0], this.callDatas[0])
    this.tokenAddress = EMPTY_ADDRESS
    this.receiveAddress = decodedData[0]
    this.amount = normalizeBigNumberish(fromDecimals(normalizeBigNumberish(decodedData[1]), DECIMALS))
    this.tokenSymbolName = currentChainConfig.symbol
  }

  buildErc20Signature(form: TransferVaultAssetsActionDatas) {
    const v: any[] = [form.assetsTokenAddress, formatAddress(form.receiveAddress), toDecimals(form.assetsAmount, form.assetsTokenDecimals)]
    this.signatures = [this.actionSignatures.transferERC20.toString()]
    this.callDatas = [encodeProposal(this.actionSignatures.transferERC20, v)]
  }

  async parseErc20Signature() {
    const decodedData = decodeProposal(this.signatures[0], this.callDatas[0])
    const provider = store.getters['wallet/provider']
    this.tokenAddress = decodedData[0]
    this.receiveAddress = decodedData[1]
    const amount = normalizeBigNumberish(decodedData[2])
    if (provider && this.tokenAddress) {
      const erc20Contract = getERC20Contract(this.tokenAddress, provider)
      if (isNativeToken(this.tokenAddress)) {
        this.tokenSymbolName = currentChainConfig.symbol
      } else {
        this.tokenSymbolName = await erc20Symbol(erc20Contract)
      }
      const decimals = await erc20Decimals(erc20Contract)
      this.amount = normalizeBigNumberish(fromDecimals(amount, decimals))
    }
  }

  async buildActionByCallDatas() {
    if (this.callDatas.length === 0 || this.signatures.length === 0) {
      return
    }
    try {
      switch (this.signatures[0]) {
        case this.actionSignatures.transferETH:
          await this.parseEthSignature()
          break
        case this.actionSignatures.transferERC20:
          await this.parseErc20Signature()
          break
      }
    } catch (e) {
      console.error("parse dao proposal transfer vault assets fail, ", e)
    }
  }

  details(vue: Vue): string {
    return vue.$t('dao.actionCard.transferVaultAssetsDetails', {
      amount: this.amount?.toFixed(4) || '',
      tokenName: this.tokenSymbolName || '',
      // receiveAddress: ellipsisMiddle(this.receiveAddress || '')
      receiveAddress: this.receiveAddress || ''
    }).toString()
  }
}

export class MintSATORIAction extends DaoActionBase implements IDaoActionBuilder {
  public type = CombinedDaoActionTypes.MintSATORI
  private actionSignatures: { [name: string]: string } = ActionType2Signatures[this.type.toString()]
  private mintAmount: BigNumber | undefined = undefined
  private recipientAddress: string | undefined = undefined

  buildActionByParams(form: MintSATORIActionDatas) {
    this.targets = [formatAddress(CHAIN_ID_TO_DAO_MINTER_ADDRESS[TARGET_NETWORK_ID])]
    this.values = ['0']
    const v: any[] = [formatAddress(form.receiveAddress), toDecimals(form.amount, DECIMALS)]   // mcb decimals: 18, only: mcb
    this.signatures = [this.actionSignatures.mintFromBase.toString()]
    this.callDatas = [encodeProposal(this.actionSignatures.mintFromBase, v)]
  }

  async buildActionByCallDatas() {
    if (this.signatures.length === 0) {
      return
    }
    if (this.callDatas.length > 0) {
      const decodedData = decodeProposal(this.signatures[0], this.callDatas[0])
      // mcb decimals: 18, only: mcb
      this.mintAmount = normalizeBigNumberish(fromDecimals(normalizeBigNumberish(decodedData[1]).toString(), DECIMALS))
      this.recipientAddress = decodedData[0]
     }
  }

  details(vue: Vue): string {
    return vue.$t('dao.actionCard.mintSATORIDetails', {
      amount: this.mintAmount ? this.mintAmount.toFixed(3) : '0',
      // receiveAddress: ellipsisMiddle(this.recipientAddress || ''),
      receiveAddress: this.recipientAddress || '',
    }).toString()
  }
}

export class SetLiquidityMiningPoolRateAction extends DaoActionBase implements IDaoActionBuilder {
  public type = CombinedDaoActionTypes.SetLiquidityMiningRate
  private actionSignatures: { [name: string]: string } = ActionType2Signatures[this.type.toString()]
  private miningRate: number | undefined = undefined
  private liquidityAddress: string | undefined = undefined
  private miningTokenName: string = 'SATORI'
  private poolCollateralTokenName: string = ''

  buildActionByParams(form: SetLiquidityMiningRateActionDatas) {
    this.targets = [formatAddress(form.governorAddress)]
    this.values = ['0']
    const v: any[] = [toDecimals(form.miningRate, DECIMALS)]   // mcb decimals: 18, only: mcb
    this.signatures = [this.actionSignatures.setRewardRate.toString()]
    this.callDatas = [encodeProposal(this.actionSignatures.setRewardRate, v)]
  }

  async buildActionByCallDatas() {
    if (this.signatures.length === 0) {
      return
    }
    if (this.callDatas.length > 0) {
      const decodedData = decodeProposal(this.signatures[0], this.callDatas[0])
      // mcb decimals: 18, only: mcb
      const rate = normalizeBigNumberish(fromDecimals(decodedData, DECIMALS))
      this.miningRate = Number(normalizeBigNumberish(rate).toPrecision())
    }
    if (this.targets.length > 0) {
      const governanceAddress = this.targets[0]
      if (governanceAddress && governanceAddress !== '') {
        try {
          const poolsResult = await queryPoolsFromGovernor(governanceAddress)
          if (poolsResult && poolsResult.pools.length > 0) {
            const currentPool = poolsResult.pools[0]
            this.liquidityAddress = currentPool.id
            this.poolCollateralTokenName = isNativeToken(currentPool.collateralAddress || '') ?
              currentChainConfig.symbol : currentPool.collateralName || ''
          }
        } catch (e) {
          console.warn("dao proposal query liquidity pool info of graph fail, ", e)
        }
      }
    }
  }

  details(vue: Vue): string {
    return vue.$t('dao.actionCard.setLiquidityMiningRateDetails', {
      poolCollateral: this.poolCollateralTokenName,
      // poolAddress: ellipsisMiddle(this.liquidityAddress || ''),
      poolAddress: this.liquidityAddress || '',
      rate: this.miningRate || '',
      miningTokenName: this.miningTokenName
    }).toString()
  }
}

export class SetUniswapMiningPoolRateAction extends DaoActionBase implements IDaoActionBuilder {
  // TODO???
  public type = CombinedDaoActionTypes.SetUniswapMiningRate

  buildActionByParams() {
    const v: any[] = []
    this.signatures = []
    this.callDatas = []
  }

  async buildActionByCallDatas() {
    this.signatures = []
  }

  details(vue: Vue): string {
    return ''
  }
}

export class SetSATORIStakingMiningRateAction extends DaoActionBase implements IDaoActionBuilder {
  public type = CombinedDaoActionTypes.SetSATORIStakingMiningRate
  private actionSignatures: { [name: string]: string } = ActionType2Signatures[this.type.toString()]
  private miningTokenName: string | undefined = undefined
  private miningTokenAddress: string | undefined = undefined
  private miningRate: number | undefined = undefined

  buildActionByParams(form: SetSATORIStakingMiningRateActionDatas) {
    this.targets = [formatAddress(CHAIN_ID_TO_DAO_MINING_ADDRESS[TARGET_NETWORK_ID])]
    this.values = ['0']
    const v: any[] = [formatAddress(form.assetsTokenAddress), toDecimals(form.miningRate, form.assetsTokenDecimals)]
    try {
      if (form.isSetRewardPlan === null) {
        throw 'get staking token has plan is null'
      }
      const signature: string = form.isSetRewardPlan ? this.actionSignatures.setRewardRate : this.actionSignatures.createRewardPlan
      this.signatures = [signature.toString()]
      this.callDatas = [encodeProposal(signature, v)]
    } catch (e) {
      console.error("build mcb staking mining rate action by params fail, e:", e)
      throw e
    }
  }

  async buildActionByCallDatas() {
    if (this.callDatas.length === 0 || this.signatures.length === 0) {
      return
    }
    const decodedData = decodeProposal(this.signatures[0], this.callDatas[0])
    try {
      this.miningTokenAddress = decodedData[0]
      const miningRate = normalizeBigNumberish(decodedData[1])
      const provider = store.getters['wallet/provider']
      if (provider && this.miningTokenAddress) {
        const erc20Contract = getERC20Contract(this.miningTokenAddress, provider)
        if (isNativeToken(this.miningTokenAddress || '')) {
          this.miningTokenName = currentChainConfig.symbol
        } else {
          this.miningTokenName = await erc20Symbol(erc20Contract)
        }
        const decimals = await erc20Decimals(erc20Contract)
        this.miningRate = Number(normalizeBigNumberish(fromDecimals(miningRate, decimals)).toPrecision())
      }
    } catch (e) {
      console.error('parse set mcb staking mining rate action, get token symbol name fail, ', e)
    }
  }

  details(vue: Vue): string {
    return vue.$t('dao.actionCard.setSATORIStakingMiningRateDetails', {
      miningTokenName: this.miningTokenName || '',
      rate: this.miningRate || '',
    }).toString()
  }
}

export class SetMiningSupplyAction extends DaoActionBase implements IDaoActionBuilder {
  public type = CombinedDaoActionTypes.SetMiningSupply
  private actionSignatures: { [name: string]: string } = ActionType2Signatures[this.type.toString()]
  private miningTokenName: string | undefined = undefined
  private miningPoolName: string | undefined = undefined
  private supplyAmount: BigNumber | undefined = undefined

  buildActionByParams(form: SetMiningSupplyActionDatas) {
    this.values = ['0']
    switch (form.poolType) {
      case MiningSupplyPoolType.Liquidity:
        this.buildLiquidityPoolType(form)
        break
      case MiningSupplyPoolType.Staking:
        this.buildStakingPoolType(form)
        break
    }
  }

  buildLiquidityPoolType(form: SetMiningSupplyActionDatas) {
    const amount = toDecimals(form.supplyAmount, DECIMALS)   // mcb decimals: 18, only: mcb
    const v: any[] = [amount]
    this.targets = [formatAddress(form.governorAddress)]
    this.signatures = [this.actionSignatures.liquidityMining.toString()]
    this.callDatas = [encodeProposal(this.actionSignatures.liquidityMining, v)]
  }

  async parseLiquidityPoolType() {
    const decodedData = decodeProposal(this.signatures[0], this.callDatas[0])
    // mcb decimals: 18, only: mcb
    this.supplyAmount = normalizeBigNumberish(fromDecimals(normalizeBigNumberish(decodedData), DECIMALS))
    this.miningTokenName = 'SATORI'
    const governanceAddress = this.targets[0]
    let poolCollateralName: string = ''
    let liquidityPoolAddress: string = ''
    if (governanceAddress && governanceAddress !== '') {
      try {
        const poolsResult = await queryPoolsFromGovernor(governanceAddress)
        if (poolsResult && poolsResult.pools.length > 0) {
          const currentPool = poolsResult.pools[0]
          liquidityPoolAddress = currentPool.id
          poolCollateralName = isNativeToken(currentPool.collateralAddress || '') ?
            currentChainConfig.symbol : currentPool.collateralName || ''
        }
      } catch (e) {
        console.warn("dao proposal query liquidity pool info of graph fail, ", e)
      }
    }
    this.miningPoolName = `${ellipsisMiddle(liquidityPoolAddress)}(${poolCollateralName})`
  }

  buildStakingPoolType(form: SetMiningSupplyActionDatas) {
    const amount = toDecimals(form.supplyAmount, form.assetsTokenDecimals)
    const v: any[] = [formatAddress(form.assetsTokenAddress), amount]
    this.targets = [formatAddress(CHAIN_ID_TO_DAO_MINING_ADDRESS[TARGET_NETWORK_ID])]
    this.signatures = [this.actionSignatures.stakingMining.toString()]
    this.callDatas = [encodeProposal(this.actionSignatures.stakingMining, v)]
  }

  async parseStakingPoolType() {
    const decodedData = decodeProposal(this.signatures[0], this.callDatas[0])
    try {
      const provider = store.getters['wallet/provider']
      const supplyAmount = normalizeBigNumberish(decodedData[1])
      const tokenAddress = decodedData[0]
      if (provider && tokenAddress) {
        const erc20Contract = getERC20Contract(tokenAddress, provider)
        if (isNativeToken(tokenAddress)) {
          this.miningTokenName = currentChainConfig.symbol
        } else {
          this.miningTokenName = await erc20Symbol(erc20Contract)
        }
        const decimals = await erc20Decimals(erc20Contract)
        this.supplyAmount = normalizeBigNumberish(fromDecimals(supplyAmount.toString(), decimals))
      }
      this.miningPoolName = this.miningTokenName
    } catch (e) {
      console.error("parse dao proposal set mining supply fail,", e)
    }
  }

  get miningSupplyType(): 'liquidity' | 'uniswap' | 'staking' | null {
    const signature = this.signatures[0]
    if (!signature) {
      return null
    }
    if (signature === this.actionSignatures.liquidityMining.toString()) {
      return 'liquidity'
    } else if (signature === this.actionSignatures.stakingMining.toString()) {
      return 'staking'
    }
    return null
  }

  async buildActionByCallDatas() {
    if (this.callDatas.length === 0 || this.signatures.length ==0 ) {
      return
    }
    if(this.miningSupplyType === 'liquidity') {
      await this.parseLiquidityPoolType()
    }
    if (this.miningSupplyType === 'staking') {
      await this.parseStakingPoolType()
    }
  }

  details(vue: Vue): string {
    return vue.$t('dao.actionCard.setMiningSupplyDetails', {
      miningTokenName: this.miningTokenName || '',
      miningPoolName: this.miningPoolName || '',
      amount: this.supplyAmount?.toPrecision() || '0',
    }).toString()
  }
}

export class CustomAction extends DaoActionBase implements IDaoActionBuilder {
  public type = CombinedDaoActionTypes.Custom

  buildActionByParams(form: CustomActionDatas) {
    this.targets = [formatAddress(form.to)]
    this.values = [new BigNumber(form.value).shiftedBy(DECIMALS).toString()]
    this.signatures = [form.signature]
    this.callDatas = [form.callData]
  }

  async buildActionByCallDatas() {}

  details(vue: Vue): string {
    return vue.$t('dao.actionCard.customDetails', {
      signature: this.signatures[0] || ''
    }).toString()
  }
}
