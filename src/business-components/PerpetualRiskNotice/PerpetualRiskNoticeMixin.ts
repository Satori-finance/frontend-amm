import { Component, Mixins, Watch } from 'vue-property-decorator'
import { ErrorHandlerMixin, SelectedPerpetualMixin } from '@/mixins'
import { getOracleInfo, OracleVendor } from '@/config/oracle'
import { getLocalStorage } from '@/utils'
import { RISK_NOTICE_POP_UP } from '@/constants'
import { IOracleFactory } from '@mcdex/mai3.js'
import { DumOracleRouterPath, DumUniswapV3RouterPath, PerpetualOracleType, TunableOracleInfo } from '@/type'
import {
  getOracleRouterDmpPath,
  getPerpetualOracleType,
  getTunableOracleInfo,
  getUniswapV3RouterPath,
  isWhitelistOracle,
} from '@/utils/oracle'

interface OracleDetail {
  oracleType: PerpetualOracleType
  oracles: (TunableOracleInfo & { oracle: DumOracleRouterPath | null } | null)[] | null
  withFineTuner: boolean
}

@Component
export default class PerpetualRiskNoticeMixin extends Mixins(SelectedPerpetualMixin, ErrorHandlerMixin) {
  protected currentVisible: boolean = false
  protected isCheckKnow: boolean = false
  protected oracleRouterPath: Array<DumOracleRouterPath> = []
  protected uniswapV3RouterPath: DumUniswapV3RouterPath | null = null
  protected oracleType: PerpetualOracleType = 'custom'
  protected loadSucceeded: boolean = false
  active: boolean = false
  protected oracleDetail: OracleDetail = {
    oracleType: 'custom',
    oracles: null,
    withFineTuner: false,
  }

  @Watch('symbol', { immediate: true })
  @Watch('address', { immediate: true })
  @Watch('active')
  showRiskNotice() {
    if (!this.symbol || !this.address || !this.active) {
      this.currentVisible = false
    } else {
      const isShow = !getLocalStorage(`${RISK_NOTICE_POP_UP}-${this.symbol}-${this.address}`)
      this.currentVisible = !!this.selectedPerpetualID && isShow && this.symbol >= 10000
    }
    if (!this.currentVisible) {
      this.$emit('close')
    }
  }

  get underlyingAsset(): string {
    return this.selectedPerpetualProperty?.underlyingAssetSymbol || ''
  }

  get collateral(): string {
    return this.selectedPerpetualProperty?.collateralTokenSymbol || ''
  }

  get name() {
    return this.underlyingAsset + '-' + this.collateral || ''
  }

  get symbol() {
    return this.selectedPerpetualProperty?.symbol || ''
  }

  get collateralAddress(): string {
    return this.selectedLiquidityPoolStorage?.collateral || ''
  }

  get oracleAddress(): string {
    return this.selectedPerpetualStorage?.oracle || ''
  }

  get isOracleUnregistered(): boolean {
    return !isWhitelistOracle(this.oracleAddress)
  }

  get loading() {
    return this.selectedPerpetualProperty === null || this.selectedLiquidityPoolStorage === null || this.selectedPerpetualStorage === null || !this.loadSucceeded
  }

  async loadOracleBaseInfo() {
    this.loadSucceeded = false
    await this.callChainReadFunc(async () => {
      if (!this.provider || this.oracleAddress === '') {
        return
      }
      this.oracleType = await getPerpetualOracleType(this.oracleAddress, this.provider)
      if (this.oracleType === 'oracleRouter') {
        this.oracleRouterPath = await getOracleRouterDmpPath(this.oracleAddress, this.provider)
        const oraclesTunableInfo = await Promise.all(this.oracleRouterPath.map(async p => {
          const tunableOracleInfo = await getTunableOracleInfo(p.oracle)
          return Object.assign({ oracle: p }, tunableOracleInfo)
        }))
        this.oracleDetail = {
          oracleType: this.oracleType,
          oracles: oraclesTunableInfo,
          withFineTuner: oraclesTunableInfo.filter(i => this.isWithFineTuner(i)).length > 0,
        }
      } else if (this.oracleType === 'uniswapv3') {
        this.uniswapV3RouterPath = await getUniswapV3RouterPath(this.oracleAddress, this.provider)
        this.oracleDetail = {
          oracleType: this.oracleType,
          oracles: null,
          withFineTuner: false,
        }
      } else {
        this.oracleRouterPath = []
        const oracleContract = IOracleFactory.connect(this.oracleAddress, this.provider)
        const underlyingAsset = await oracleContract.underlyingAsset()
        const collateral = await oracleContract.collateral()
        this.oracleRouterPath.push({ oracle: this.oracleAddress, isInverse: false, underlyingAsset: underlyingAsset, collateral: collateral })
        const info = await getTunableOracleInfo(this.oracleAddress)
        this.oracleDetail = {
          oracleType: this.oracleType,
          oracles: [Object.assign({
            oracle: {
              underlyingAsset,
              collateral,
              isInverse: false,
              oracle: this.oracleAddress,
            },
          }, info)],
          withFineTuner: this.isWithFineTuner(info),
        }
      }
    })
    this.loadSucceeded = true
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
}
