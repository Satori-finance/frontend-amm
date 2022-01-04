<template>
  <div class="select-pool">
    <div class="editable" v-show="showEdit">
      <div class="radio-group-tabs">
        <el-radio-group v-model="selectType" size="medium">
          <el-radio-button label="new">{{ $t('newContract.newPool') }}</el-radio-button>
          <el-radio-button label="exiting">{{ $t('newContract.exitingPool') }}</el-radio-button>
        </el-radio-group>
      </div>
      <el-form
        label-width="256px"
        v-show="selectType === 'new'"
        :model="poolForm"
        :rules="poolFormRules"
        @submit.native.prevent
      >
        <el-form-item :label="$t('base.collateral')"
                      :error="showCollateralError ? $t('commonErrors.invalidTokenAddress') : ''"
                      :inline-message="true"
                      :show-message="showCollateralError">
          <input class="control-item collateral" readonly type="text" @click="tokenSelectorDialogVisible = true"
                 :placeholder="$t('collateralSearch.placeholder')" :value="selectedCollateralSymbol">
        </el-form-item>
        <el-form-item prop="insuranceFundCap" :inline-message="true">
          <template #label>
            <span>{{ $t('contractInfo.contractParams.insuranceFundCap') }}</span>
            <el-tooltip placement="top">
              <div slot="content"><span v-html="$t('contractInfo.contractParams.insuranceFundCapPrompt')"></span></div>
              <i class="iconfont icon-help-icon"></i>
            </el-tooltip>
          </template>
          <el-input class="control-item" v-model.trim="poolForm.insuranceFundCap">
            <span slot="suffix">{{ selectedCollateral.symbol }}</span>
          </el-input>
        </el-form-item>
        <el-form-item label=" " class="auto-height" label-width="168px">
          <el-checkbox v-model="isFastCreationEnabled">{{ $t('newContract.allowSuperOperator') }}</el-checkbox>
        </el-form-item>
        <el-form-item label=" " class="button-container">
          <el-button :disabled="disableNew" @click="confirm" class="control-item"
          >{{ $t('base.next') }}
          </el-button>
        </el-form-item>
      </el-form>

      <div v-show="selectType === 'exiting'">
        <table class="mc-data-table mc-data-table--border is-medium">
          <thead>
          <tr>
            <th>{{ $t('base.selected') }}</th>
            <th>{{ $t('base.poolAddress') }}</th>
            <th>{{ $t('base.collateral') }}</th>
            <th>{{ $t('base.status') }}</th>
            <th>{{ $t('base.sharedLiquidity') }}</th>
            <th>{{ $t('base.perpetuals') }}</th>
          </tr>
          </thead>
          <tbody>
          <tr
            v-for="(item, index) in tableBody"
            v-if="!item.operatorIsExpiration"
            :key="index"
            @click="selectedPoolIndex = index"
          >
            <td class="is-center">
              <el-radio v-model="selectedPoolIndex" :label="index"></el-radio>
            </td>
            <td class="is-center">
              <span class="pool-address" @click="toPoolInfo(item)">{{ item.poolAddress | ellipsisMiddle }}</span>
              <el-link :underline="false" :href="item.poolAddress | etherBrowserAddressFormatter" target="_blank">
                <i class="iconfont icon-transmit"></i>
              </el-link>
            </td>
            <td class="is-center">{{ item.collateral }}</td>
            <td class="is-center">
              <span v-if="item.status === 1">{{ $t('newContract.poolInitialization') }}</span>
              <span v-else-if="item.status === 2" class="running">{{ $t('newContract.poolRunning') }}</span>
            </td>
            <td class="is-center">
              <span class="unit" v-if="item.sharedLiquidity">$</span>{{ item.sharedLiquidity | liquidityFormatter }}
            </td>
            <td class="is-center">
              <PerpetualsViewer
                :max-row-count="1"
                :per-row-count="1"
                :collateral="item.collateral"
                :perpetuals="item.perpetuals || []"
                :new-page-open="true"
              />
            </td>
          </tr>
          </tbody>
        </table>
        <div class="action">
          <el-button :disabled="selectedPoolIndex === null" @click="onConfirmSelect" class="control-item">
            {{ $t('base.next') }}
          </el-button>
        </div>
      </div>
    </div>

    <div class="readonly" v-if="!showEdit">
      <!-- new pool readonly -->
      <table class="mc-data-table mc-data-table--border is-medium new-pool-show-table" v-if="selectType === 'new'">
        <tbody>
        <tr>
          <td>{{ $t('newContract.poolType') }}</td>
          <td>{{ $t('newContract.newPool') }}</td>
        </tr>
        <tr>
          <td>{{ $t('base.collateral') }}</td>
          <td>
            <span>{{ showCollateralStr }}</span>
            <el-link
              v-if="selectedCollateral.collateralAddress"
              :underline="false"
              :href="selectedCollateral.collateralAddress | etherBrowserAddressFormatter"
              target="_blank"
            >
              <i class="iconfont icon-transmit"></i>
            </el-link>
          </td>
        </tr>
        <tr>
          <td>{{ $t('contractInfo.contractParams.insuranceFundCap') }}</td>
          <td>
            {{ poolForm.insuranceFundCap | bigNumberFormatter }} {{ selectedCollateral.symbol }}
            <span v-if="!insuranceFundCapUSD.isZero()"> (${{ insuranceFundCapUSD | bigNumberFormatter }})</span>
          </td>
        </tr>
        </tbody>
      </table>
      <!-- exiting pool readonly -->
      <table class="mc-data-table mc-data-table--border is-medium" v-if="selectType === 'exiting'">
        <thead>
        <tr>
          <th>{{ $t('base.poolAddress') }}</th>
          <th>{{ $t('base.collateral') }}</th>
          <th>{{ $t('base.status') }}</th>
          <th>{{ $t('base.sharedLiquidity') }}</th>
        </tr>
        </thead>
        <tbody>
        <tr>
          <td class="is-center">
              <span class="pool-address" v-if="poolInfo.poolAddress" @click="toPoolInfo(poolInfo)">{{
                  poolInfo.poolAddress | ellipsisMiddle
                }}</span>
            <el-link
              v-if="poolInfo.poolAddress"
              :underline="false"
              :href="poolInfo.poolAddress | etherBrowserAddressFormatter"
              target="_blank"
            >
              <i class="iconfont icon-transmit"></i>
            </el-link>
          </td>
          <td class="is-center">{{ poolInfo.collateral }}<span></span></td>
          <td class="is-center">
            <span v-if="poolInfo.status === 1">{{ $t('newContract.poolInitialization') }}</span>
            <span v-else-if="poolInfo.status === 2" class="running">{{ $t('newContract.poolRunning') }}</span>
          </td>
          <td class="is-center">
            <span v-if="poolInfo.poolAddress">{{ poolInfo.sharedLiquidity | liquidityFormatter }}</span>
          </td>
        </tr>
        </tbody>
      </table>
      <div class="action" v-if="!created && !readonly">
        <el-button type="secondary" @click="onEdit" :disabled="creating">{{ $t('base.edit') }}</el-button>
      </div>
    </div>

    <McTokenSelectorDialog :visible.sync="tokenSelectorDialogVisible" v-model="selectedToken" :tokenList="collateralTokenWhiteList"/>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import { CollateralSelector } from '@/business-components'
import {
  _0,
  CHAIN_ID_TO_POOL_CREATOR_ADDRESS,
  getPoolCreatorContract,
  listLiquidityPoolOfOperator,
} from '@mcdex/mai3.js'
import { namespace } from 'vuex-class'
import { TARGET_NETWORK_ID } from '@/const'
import { Provider } from '@ethersproject/providers'
import { querySpecifiedPools } from '@/api/pool'
import { LiquidityPoolStruct, Perpetual, PoolStatus, TokenInfoItem } from '@/type'
import BigNumber from 'bignumber.js'
import { ErrorHandlerMixin } from '@/mixins'
import { ellipsisMiddle, toBigNumber } from '@/utils'
import { PerpetualsViewer } from '@/components'
import McTokenSelectorDialog from '@/business-components/McTokenSelectorDialog.vue'
import { isNativeToken } from '@/utils/chain'

interface TableData {
  poolAddress: string
  collateral: string
  collateralAddress: string
  collateralDecimals: number
  sharedLiquidity: BigNumber
  status: PoolStatus
  perpetuals?: Perpetual[]
  operatorIsExpiration: boolean
}

const wallet = namespace('wallet')
const price = namespace('price')
const token = namespace('token')

@Component({
  components: {
    McTokenSelectorDialog,
    CollateralSelector,
    PerpetualsViewer,
  },
})
export default class SelectPool extends Mixins(ErrorHandlerMixin) {
  @wallet.Getter('address') address!: string
  @wallet.Getter('provider') provider!: Provider
  @price.Action('updateTokenPrice') updateTokenPrice!: (tokens: string[]) => Promise<void>
  @price.Getter('tokenPriceFunc') tokenPriceFunc!: (token: string) => BigNumber | null
  @token.Getter('collateralTokenWhiteList') collateralTokenWhiteList!: TokenInfoItem[]

  @Prop({ required: true, default: false }) creating!: boolean
  @Prop({ required: true, default: false }) created!: boolean
  @Prop({ required: true, default: false }) readonly!: boolean

  status: 'editable' | 'readonly' = 'editable'
  selectType: 'new' | 'exiting' = 'new'
  selectedCollateral: TokenInfoItem = { address: '', symbol: '', decimals: 0 }
  selectedPoolIndex: number | null = null
  existPools: LiquidityPoolStruct[] = []
  isFastCreationEnabled: boolean = true
  private insuranceFundCapUSD: BigNumber = _0
  private showCollateralError: boolean = false
  private tokenSelectorDialogVisible: boolean = false
  private selectedCollateralSymbol = ''
  private selectedToken: TokenInfoItem | null = null

  poolForm = {
    insuranceFundCap: '1000000',
  }

  poolFormRules = {
    insuranceFundCap: [{ validator: this.validateInputIsNumber, trigger: 'change' }],
  }

  get disableNew() {
    return (this.selectType === 'new' && !this.selectedCollateral.address) || this.invalidInsuranceFundCap || !this.selectedCollateralSymbol
  }

  get showEdit() {
    return !this.creating && !this.created && this.status === 'editable'
  }

  get invalidInsuranceFundCap() {
    const insuranceFundCap = Number(this.poolForm.insuranceFundCap)
    return isNaN(insuranceFundCap) || insuranceFundCap <= 0
  }

  get poolInfo(): TableData {
    const pool = this.tableBody[this.selectedPoolIndex || -1]
    if (this.selectType === 'exiting') {
      return {
        poolAddress: pool?.poolAddress || '',
        collateral: pool?.collateral || '',
        collateralAddress: pool?.collateralAddress || '',
        collateralDecimals: pool?.collateralDecimals || 0,
        sharedLiquidity: pool?.sharedLiquidity || _0,
        status: pool?.status || PoolStatus.Unknown,
        operatorIsExpiration: pool?.operatorIsExpiration || false,
      }
    } else {
      return {
        poolAddress: '',
        collateral: this.selectedCollateral.symbol,
        collateralAddress: this.selectedCollateral.address,
        collateralDecimals: this.selectedCollateral.decimals || 0,
        sharedLiquidity: _0,
        status: 0,
        operatorIsExpiration: false,
      }
    }
  }

  get tableBody(): TableData[] {
    return this.existPools.map((pool) => {
      return {
        poolAddress: pool.id,
        collateral:
          pool.collateralAddress && pool.collateralName
            ? isNativeToken(pool.collateralAddress)
            ? 'ETH'
            : pool.collateralName
            : '',
        collateralAddress: pool.collateralAddress || '',
        collateralDecimals: pool.collateralDecimals as number,
        sharedLiquidity: pool.poolMarginUSD as BigNumber,
        status: pool.status,
        perpetuals: pool.perpetuals,
        operatorIsExpiration: pool.operatorIsExpiration,
      }
    })
  }

  get showCollateralStr(): string {
    const collateralAddress = this.selectedCollateral.address
    const collateralSymbol = this.selectedCollateral.symbol
    if (collateralAddress !== '' && collateralSymbol !== '') {
      return `${collateralSymbol} (${ellipsisMiddle(collateralAddress, 10, 12)})`
    }
    if (collateralAddress !== '') {
      return collateralAddress
    }
    if (collateralSymbol !== '') {
      return collateralSymbol
    }
    return ''
  }

  get collateralPrice(): BigNumber {
    if (this.selectedCollateral.address === '') {
      return _0
    }
    return this.tokenPriceFunc(this.selectedCollateral.address) || _0
  }

  confirm() {
    this.status = 'readonly'
    this.$emit('change', {
      liquidityPoolAddress: '',
      liquidityPoolStatus: PoolStatus.Initialize,
      collateralAddress: this.selectedCollateral.address,
      collateralSymbol: this.selectedCollateral.symbol,
      collateralDecimals: this.selectedCollateral.decimals || 0,
      isFastCreationEnabled: this.isFastCreationEnabled,
      insuranceFundCap: this.poolForm.insuranceFundCap,
    })
  }

  @Watch('collateralPrice', { immediate: true })
  @Watch('poolForm.insuranceFundCap', { immediate: true })
  onCollateralPriceChanged() {
    const insuranceFundCap = toBigNumber(this.poolForm.insuranceFundCap)
    if (this.collateralPrice.isZero() || insuranceFundCap.isZero() || insuranceFundCap.isNaN()) {
      this.insuranceFundCapUSD = _0
      return
    }
    this.insuranceFundCapUSD = insuranceFundCap.times(this.collateralPrice)
  }

  /**
   * public func, do not rename
   */
  onEdit() {
    this.status = 'editable'
    this.$emit('change', null)
  }

  onConfirmSelect() {
    if (this.selectType === 'exiting' && this.selectedPoolIndex !== null) {
      const pool = this.tableBody[this.selectedPoolIndex]
      if (!pool) {
        return
      }
      this.status = 'readonly'
      this.selectedCollateral.symbol = pool.collateral
      this.selectedCollateral.address = pool.collateralAddress
      this.$emit('change', {
        liquidityPoolAddress: pool.poolAddress,
        liquidityPoolStatus: pool.status,
        collateralAddress: pool.collateralAddress,
        collateralSymbol: pool.collateral,
        collateralDecimals: pool.collateralDecimals,
        isFastCreationEnabled: false,
        insuranceFundCap: '0',
      })
      this.selectedCollateralSymbol = ''
    }
  }

  @Watch('address', { immediate: true })
  async getExistPools() {
    const poolCreatorAddress = CHAIN_ID_TO_POOL_CREATOR_ADDRESS[TARGET_NETWORK_ID]

    if (!this.address || !this.provider || !poolCreatorAddress) {
      return
    }
    const pools = await this.callChainReadFunc(async () => {
      try {
        const poolCreator = getPoolCreatorContract(poolCreatorAddress, this.provider)
        return await listLiquidityPoolOfOperator(poolCreator, this.address)
      } catch (e) {
        return []
      }
    })
    const id2Result = new Map<string, LiquidityPoolStruct>(
      pools.map((p: string) => {
        const lp = new LiquidityPoolStruct()
        lp.id = p.toLowerCase()
        return [lp.id, lp]
      }),
    )
    await this.callGraphApiFunc(async () => {
      const poolsResult = await querySpecifiedPools(pools.map((p: string) => p.toLowerCase()))
      // chain.pools left join graph.pools
      poolsResult.pools.forEach((i) => {
        id2Result.set(i.id.toLowerCase(), i)
      })
    })
    this.existPools = [...id2Result.values()]
  }

  @Watch('selectedToken')
  private onSelectedCollateralChange() {
    if (!this.selectedToken) {
      this.selectedCollateralSymbol = ''
      return
    }
    this.selectedCollateral = {
      address: this.selectedToken.address,
      symbol: this.selectedToken.symbol,
      decimals: this.selectedToken.decimals,
    }
    this.updateTokenPrice([this.selectedCollateral.address])
    this.selectedCollateralSymbol = this.selectedToken.symbol
  }

  toPoolInfo(item: TableData) {
    this.$router.push({ name: 'poolInfo', params: { poolAddress: item.poolAddress.toLowerCase() } })
  }

  /**
   * public func, do not rename
   */
  reset() {
    this.status = 'editable'
    this.selectType = 'new'
    this.selectedCollateral = { address: '', symbol: '', decimals: 0 }
    this.selectedPoolIndex = null
    this.isFastCreationEnabled = false
    this.existPools = []
    this.getExistPools()
  }

  /**
   * public func, do not rename
   */
  async setPool(poolAddress: string) {
    this.existPools = []
    await this.getExistPools()
    this.selectedPoolIndex =
      this.existPools.findIndex((pool) => pool.id.toLowerCase() === poolAddress.toLowerCase()) || null
    const pool = this.existPools[this.selectedPoolIndex === null ? -1 : this.selectedPoolIndex]
    if (pool) {
      this.status = 'editable'
      this.selectType = 'exiting'
      this.isFastCreationEnabled = false
      this.selectedCollateral = {
        address: pool.collateralAddress?.toLowerCase() || '',
        symbol: pool.collateralName || '',
        decimals: pool.collateralDecimals as number || 0,
      }
    } else {
      this.status = 'editable'
      this.selectType = 'new'
      this.selectedCollateral = { address: '', symbol: '', decimals: 0 }
      this.selectedPoolIndex = null
      this.isFastCreationEnabled = false
    }
  }

  validateInputIsNumber(rule: any, value: string, callback: Function) {
    if (value === '') {
      callback()
      return
    }
    const valueFloat = Number(value)
    if (isNaN(valueFloat) || valueFloat < 0) {
      callback(new Error(this.$t('commonErrors.enteredWrong').toString()))
    } else {
      callback()
    }
  }
}
</script>

<style scoped lang="scss">
@import 'contract-form';

.el-form-item.auto-height ::v-deep .el-form-item__content {
  line-height: 20px;
}

.radio-group-tabs {
  ::v-deep {
    .el-radio-button__inner {
      width: 180px;
    }
  }
}

.el-checkbox {
  white-space: normal;
}

.el-checkbox ::v-deep .el-checkbox__label {
  color: var(--mc-text-color);
}

.mc-data-table {
  font-size: 14px;
  line-height: 20px;
  width: 730px;
  margin: auto;

  tbody,
  thead {
    font-size: 14px;
    line-height: 20px;
  }

  td {
    color: white;
  }

  .pool-address {
    display: inline-block;
    cursor: pointer;
    margin-right: 4px;
  }

  .el-link {
    font-size: 10px;
    color: var(--mc-icon-color-brighter);
  }

  .unit {
    display: inline-block;
    margin-right: 4px;
  }

  .running {
    color: var(--mc-color-success);
  }

  ::v-deep {
    .el-radio__label {
      display: none;
    }
  }
}

.new-pool-show-table {
  td:nth-of-type(1) {
    color: var(--mc-text-color);
  }

  td {
    padding-left: 16px;
  }
}

.action {
  width: 730px;
  margin: 45px auto auto;
}

.editable {
  .action {
    text-align: center;
  }
}

.readonly {
  .action {
    text-align: left;

    .el-button {
      width: 120px;
    }
  }
}

.control-item{
  &.collateral {
    cursor: pointer;
    padding: 0 10px;
    color: var(--mc-text-color-white);
    height: 48px;
    background: var(--mc-background-color-dark);
    font-size: 16px;

    &::placeholder {
      color: var(--mc-text-color);
    }
  }
}
</style>
