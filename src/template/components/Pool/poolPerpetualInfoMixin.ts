import { Component, Prop, Mixins, Watch } from 'vue-property-decorator'
import {
  CHAIN_ID_INVERSE_SERVICE_ADDRESS, DECIMALS,
  getInverseStateService, IOracleFactory,
  LiquidityPoolStorage,
  PerpetualStorage,
} from '@mcdex/mai3.js'
import { DumOracleRouterPath, PerpetualOracleType, PerpetualProperty, TunableOracleInfo } from '@/type'
import { getPerpetualID } from '@/utils'
import { isNativeToken } from '@/utils/chain'
import { ErrorHandlerMixin } from '@/mixins'
import { getOperatorName } from '@/config/operator'
import { getOracleInfo, OracleVendor, registeredOracles } from '@/config/oracle'
import { namespace } from 'vuex-class'
import { ethers } from 'ethers'
import { TARGET_NETWORK_ID } from '@/const'
import { waitTransaction } from '@/utils/transaction'
import { PerpetualState } from '@mcdex/mai3.js'
import {
  getOracleRouterDmpPath,
  getPerpetualOracleType,
  getTunableOracleInfo,
} from '@/utils/oracle'

const wallet = namespace('wallet')
const perpetual = namespace('perpetual')

interface OracleDetail {
  oracleType: PerpetualOracleType
  oracles: (TunableOracleInfo & { oracle: DumOracleRouterPath | null } | null)[] | null
  withFineTuner: boolean
}

@Component
export class PoolPerpetualInfoMixin extends Mixins(ErrorHandlerMixin) {
  @wallet.Getter('address') accountAddress !: string | null
  @wallet.Getter('signer') walletSigner !: ethers.Signer
  @wallet.Getter('provider') provider !: ethers.providers.Provider
  @perpetual.Action('updatePerpetual') updatePerpetual!: (perpetualID: string) => Promise<void>
  @Prop({ default: () => null }) poolStorage!: LiquidityPoolStorage | null
  @Prop({ default: () => null }) perpetualStorage!: PerpetualStorage | null
  @Prop({ default: () => null }) perpetualProperty!: PerpetualProperty | null

  protected modifyingPerpDisplaying: boolean = false
  protected oracleDetail: OracleDetail = {
    oracleType: 'custom',
    oracles: null,
    withFineTuner: false,
  }
  protected loadingTunableInfoTimes: number = 0

  get isClearOrEmergency(): boolean {
    return !this.perpetualProperty || this.perpetualStorage?.state === PerpetualState.CLEARED || this.perpetualStorage?.state === PerpetualState.EMERGENCY
  }

  get collateralDecimals() {
    return this.perpetualProperty?.collateralFormatDecimals || 0
  }

  get collateralSymbol() {
    return this.perpetualProperty?.collateralTokenSymbol || ''
  }

  get accountIsOperator(): boolean {
    if (!this.poolStorage || !this.accountAddress || this.accountAddress === '') {
      return false
    }
    return this.poolStorage.operator.toLowerCase() === this.accountAddress.toLowerCase()
  }

  get modifyPerpDisplayText(): string {
    let beforeState = ''
    let afterState = ''
    if (this.perpetualProperty) {
      beforeState = this.perpetualProperty.isInverse ? this.$t('base.inverse').toString() : this.$t('base.vanilla').toString()
      afterState = this.perpetualProperty.isInverse ? this.$t('base.vanilla').toString() : this.$t('base.inverse').toString()
    }
    return this.$t('pool.poolInfo.modifyPerpDisplay', { beforeState, afterState }).toString()
  }

  get operatorName(): string {
    if (!this.poolStorage) return ''
    const name = getOperatorName(this.poolStorage.operator.toLowerCase())
    if (name === this.poolStorage.operator.toLowerCase()) return ''
    return name
  }

  get isNativeToken() {
    if (!this.poolStorage) {
      return false
    }
    return isNativeToken(this.poolStorage.collateral)
  }

  getOracleIntro(oracleAddress: string) {
    let oracleList = registeredOracles.filter(
      function(element) {
        return oracleAddress === element.address && element.underlyingAssetSymbol === 'DPI' || element.underlyingAssetSymbol === 'SP500' && oracleAddress === element.address
      },
    )
    return oracleList.length === 1 ? oracleList[0].underlyingAssetSymbol : 'OTHERS'
  }

  getOracleTypeName(item: (TunableOracleInfo & { oracle: DumOracleRouterPath | null })): string {
    const info = getOracleInfo(item.externalOracle || '') || getOracleInfo(item?.oracle?.oracle || '')
    if (!info) {
      return this.$t('base.custom').toString()
    }
    return OracleVendor[info?.vendor]
  }

  isWithFineTuner(tunableInfo?: TunableOracleInfo | null) {
    return !!(tunableInfo && tunableInfo.fineTuner && Number(tunableInfo.fineTuner) !== 0)
  }

  async onModifyPerpetualDisplay() {
    this.modifyingPerpDisplaying = true
    await this.callChainFunc(async () => {
      if (!this.perpetualProperty || !this.walletSigner) {
        return
      }
      const setDisplay = !this.perpetualProperty.isInverse
      const contract = getInverseStateService(CHAIN_ID_INVERSE_SERVICE_ADDRESS[TARGET_NETWORK_ID], this.walletSigner)
      const promiseInstance = await contract.setInverseState(
        this.perpetualProperty.liquidityPoolAddress,
        this.perpetualProperty.perpetualIndex,
        setDisplay,
      )
      const transaction = waitTransaction(promiseInstance)
      this.$transaction({
        transaction: transaction,
        content: this.$t('transaction.setContractDisplay').toString(),
        transactionHash: promiseInstance.hash ? promiseInstance.hash : '',
      })
      const txResult = await transaction
      const perpetualId = getPerpetualID(this.perpetualProperty.liquidityPoolAddress, this.perpetualProperty.perpetualIndex)
      await this.updatePerpetual(perpetualId)
      return txResult
    })
    this.modifyingPerpDisplaying = false
  }

  @Watch('perpetualStorage', { immediate: true })
  async getOracleInfo() {
    if (!this.perpetualStorage?.oracle) {
      return null
    }
    try {
      const oracleType = await getPerpetualOracleType(this.perpetualStorage.oracle, this.provider)
      if (oracleType === 'oracleRouter') {
        const oracleRouterPath = await getOracleRouterDmpPath(this.perpetualStorage.oracle, this.provider)
        const oraclesTunableInfo = await Promise.all(oracleRouterPath.map(async p => {
          const tunableOracleInfo = await getTunableOracleInfo(p.oracle)
          return Object.assign({ oracle: p }, tunableOracleInfo)
        }))
        this.oracleDetail = {
          oracleType,
          oracles: oraclesTunableInfo,
          withFineTuner: oraclesTunableInfo.filter(i => this.isWithFineTuner(i)).length > 0,
        }
      } else if (oracleType === 'uniswapv3') {
        this.oracleDetail = {
          oracleType,
          oracles: null,
          withFineTuner: false,
        }
      } else {
        const info = await getTunableOracleInfo(this.perpetualStorage.oracle)
        const oracleContract = IOracleFactory.connect(this.perpetualStorage.oracle, this.provider)
        const [underlyingAsset, collateral] = await Promise.all([oracleContract.underlyingAsset(), oracleContract.collateral()])
        this.oracleDetail = {
          oracleType,
          oracles: [Object.assign({
            oracle: {
              underlyingAsset,
              collateral,
              isInverse: false,
              oracle: this.perpetualStorage.oracle,
            },
          }, info)],
          withFineTuner: this.isWithFineTuner(info),
        }
      }
      this.loadingTunableInfoTimes++
    } catch (e) {
      throw e
    }
  }
}
