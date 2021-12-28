<template>
  <div class="registered-oracle-selector">
    <el-form ref="form" :model="form" :rules="rules" label-width="262px" @submit.native.prevent>

      <el-form-item :label="$t('newContract.underlyingAsset')" :inline-message="true">
        <input class="control-item underlying" readonly type="text" @click="selectUnderlyingDialogVisible = true"
               :placeholder="$t('newContract.inputUnderlyingSymbol')" :value="underlyingSymbol">
      </el-form-item>
      <el-form-item :label="$t('newContract.oracleQuoteAsset')" :inline-message="true"
                    v-show="collateralAddress && !collateralInQuoteList">
        <el-autocomplete
          class="control-item"
          :placeholder="$t('newContract.inputOracleQuoteAsset')"
          popper-class="create-perpetual-select-oracle"
          :fetch-suggestions="queryQuoteAssetsList"
          v-model.trim="quoteSymbol"
        >
          <template slot="suffix">
            <i class="el-icon-circle-close" v-if="quoteSymbol !== ''" @click="quoteSymbol=''"></i>
          </template>
        </el-autocomplete>
      </el-form-item>

      <div class="registered-show-routes-tables"
           v-if="(oracleRoutes.length > 0 && oracleRoutes[0].length > 0)">
        <McLoading class="routes-table-wrap" :show-loading="loadingOracleRoutes" :hide-content="true"
                   :min-show-time="0" :show-loading-text="false" mask-color="transparent">
          <table class="mc-data-table mc-data-table--border is-medium">
            <thead>
            <tr>
              <th>{{ $t('base.selected') }}</th>
              <th>{{ $t('newContract.oracleRoutes') }}</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(links, index) in oracleRoutesWithTunableFlag" :key="index" @click="selectRoutesIndex = index"
                v-if="links.length">
              <td class="is-center">
                <el-radio v-model="selectRoutesIndex" :label="index"><span></span></el-radio>
              </td>
              <td>
              <span v-for="(link, j) in links" :key="j" class="oracle-route">
                <span>
                  <svg class="svg-icon" aria-hidden="true"
                       v-if="getOracleTypeName(link.oracle.address) === 'chainlink'">
                    <use :xlink:href="`#icon-chainlink`"></use>
                  </svg>
                  <svg class="svg-icon" aria-hidden="true" v-if="getOracleTypeName(link.oracle.address) === 'band'">
                    <use :xlink:href="`#icon-band`"></use>
                  </svg>
                  <svg class="svg-icon" aria-hidden="true"
                       v-if="getOracleTypeName(link.oracle.address) === 'mcdex'">
                    <use :xlink:href="`#icon-token-mcb`"></use>
                  </svg>
                  {{ link.oracle.address | oracleNameFormatter }}
                </span>
                <span v-if="link.isTunable" class="fine-tuner">
                  {{
                    getOracleTypeName(link.oracle.address) === 'mcdex' ? $t('base.chainlinkWithFineTuner') : $t('base.withFineTuner')
                  }}
                </span>
                <span class="oracle-item-split" v-if="j < (links.length-1)">
                  <i class="el-icon-right"></i>
                </span>
              </span>
              </td>
            </tr>
            </tbody>
          </table>
        </McLoading>
      </div>
      <div class="tip-line"
           v-else-if="underlyingSymbol || (oracleRoutes.length > 0 && oracleRoutes[0].length === 0)">
        <span v-html="$t('newContract.oracleLinkPrompt')"></span>
      </div>

      <!-- next button -->
      <el-tooltip placement="top" :content="$t('newContract.useUncertifiedOracleTip1')"
                  :disabled="tooltipIsDisabled">
        <el-form-item label=" " class="button-container">
          <el-button
            class="control-item"
            @click="onNextEvent"
            :loading="oracleLoading"
            :class="{'is-disabled': nextButtonIsDisabled}"
          >
            {{ $t('base.next') }}
          </el-button>
        </el-form-item>
      </el-tooltip>
    </el-form>

    <SelectUnderlyingDialog :visible.sync="selectUnderlyingDialogVisible" v-model="selectedUnderlying"/>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator'
import { Provider } from '@ethersproject/providers'
import {
  TokenInfoItem,
  UnderlyingInfo,
  UnderlyingType,
} from '@/type'
import { ElForm } from 'element-ui/types/form'
import { CheckOracleAdaptorError, checkValidOracleAdaptor } from '@/utils'
import { getGeneralizedUppercaseName } from '@/config/tokens'
import { findOracleRoutes, OracleLink, OracleLinkWithTunable, registeredOracleQuoteAssetsList } from '@/config/oracle'
import { namespace } from 'vuex-class'
import { getOracleTypeName } from './types'
import SelectUnderlyingDialog from '../SelectUnderlying/SelectUnderlyingDialog.vue'
import { isTunableOracle } from '@/utils/oracle'
import { McLoading } from '@/components'

const wallet = namespace('wallet')
const token = namespace('token')

@Component({
  components: {
    SelectUnderlyingDialog,
    McLoading,
  },
})
export default class RegisteredOracleSelector extends Vue {
  @wallet.Getter('provider') provider!: Provider
  @token.Getter('collateralTokenWhiteList') collateralTokenWhiteList!: TokenInfoItem[]
  // bind: next event, params: SelectedOracleParams

  @Prop({ default: '', required: true }) collateralSymbol !: string
  @Prop({ default: '', required: true }) collateralAddress !: string
  @Prop({ default: 18, required: true }) collateralDecimals !: number

  @Ref('form') formRef!: ElForm

  private oracleLoading: boolean = false
  private selectRoutesIndex: number | null = null
  private selectUnderlyingDialogVisible: boolean = false
  private selectedUnderlying: UnderlyingInfo | null = null

  private getOracleTypeName = getOracleTypeName

  private underlyingSymbol = ''
  private quoteSymbol = ''
  private form = {
    adapterAddress: '',
    quoteSymbol: '',
  }
  private oracleRoutesWithTunableFlag: OracleLinkWithTunable[][] = []
  private loadingOracleRoutes = false

  get nextTip(): boolean {
    return (this.collateralInQuoteList ? this.underlyingSymbol === '' : this.underlyingSymbol === '' || this.quoteSymbol === '') || this.selectRoutesIndex === null
  }

  get rules() {
    return {
      adapterAddress: {
        validator: async (rule: any, value: any, callback: Function) => {
          this.underlyingSymbol = ''
          this.selectedUnderlying = null
          this.form.quoteSymbol = ''
          if (!this.form.adapterAddress) {
            callback()
            return
          }
          if (!this.provider) {
            callback()
            return
          }
          try {
            this.oracleLoading = true
            const {
              underlyingAsset,
              quoteSymbol,
            } = await checkValidOracleAdaptor(this.form.adapterAddress, this.provider)
            this.underlyingSymbol = underlyingAsset
            this.form.quoteSymbol = quoteSymbol
            callback()
          } catch (e) {
            if (e instanceof CheckOracleAdaptorError) {
              callback(new Error(this.$t(e.reason, e.args).toString()))
            } else {
              callback(new Error(this.$t('newContract.invalidOracleAdapter').toString()))
            }
          } finally {
            this.oracleLoading = false
          }
        },
        trigger: 'change',
      },
    }
  }

  get formValidatorIsPass(): boolean {
    return !!this.collateralAddress && !!this.selectedUnderlying && this.selectRoutesIndex !== null && this.selectRoutesIndex > -1
  }

  get nextButtonIsDisabled(): boolean {
    return !this.formValidatorIsPass
  }

  get tooltipIsDisabled(): boolean {
    return !this.underlyingSymbol || !this.oracleRoutes || (this.oracleRoutes.length > 0 && this.oracleRoutes[0].length !== 0)
  }

  get generalizedCollateralName(): string {
    return getGeneralizedUppercaseName(this.collateralAddress) || this.collateralSymbol.toUpperCase()
  }

  get generalizedUnderlyingName(): string {
    return this.selectedUnderlying && typeof this.selectedUnderlying.info !== 'string' ? getGeneralizedUppercaseName(this.selectedUnderlying.info.address) || this.underlyingSymbol.toUpperCase() : this.underlyingSymbol.toLowerCase()
  }

  get oracleRoutes(): OracleLink[][] {
    // whitelist collateral address
    if (!this.collateralInQuoteList) {
      if (!this.quoteSymbol || this.quoteSymbol === '') {
        return []
      }
      return findOracleRoutes(this.quoteSymbol.toUpperCase(), this.generalizedUnderlyingName)
    }
    // not in whitelist
    if (!this.underlyingSymbol || this.underlyingSymbol === '') {
      return []
    }
    return findOracleRoutes(this.generalizedCollateralName, this.generalizedUnderlyingName)
  }

  get selectedOracleRoute(): OracleLinkWithTunable[] {
    if (this.selectRoutesIndex === null) {
      return []
    }
    const route = this.oracleRoutesWithTunableFlag[this.selectRoutesIndex]
    return typeof route === 'undefined' ? [] : route
  }

  get collateralInQuoteList(): boolean {
    return !!getGeneralizedUppercaseName(this.collateralAddress)
  }

  created() {
    this.reset()
    this.resetFormFields()
  }

  resetFormFields() {
    const form = this.$refs.form as ElForm
    if (form) {
      form.resetFields()
    }
  }

  queryQuoteAssetsList(key: string | undefined, cb: (results: { value: string }[]) => void) {
    let r = registeredOracleQuoteAssetsList
    if (this.quoteSymbol !== '') {
      r = registeredOracleQuoteAssetsList.filter(x => x.toUpperCase() === this.quoteSymbol.toUpperCase())
    }
    cb(r.map(x => {
      return { value: x }
    }))
  }

  onNextEvent() {
    if (!this.formValidatorIsPass || this.nextButtonIsDisabled) {
      return
    }

    this.$emit('confirm', {
      selectedType: 'registered',
      underlyingSymbol: this.underlyingSymbol,
      oracleRouterPath: this.selectedOracleRoute,
      quoteSymbol: this.quoteSymbol,
    })
  }

  reset() {
    this.underlyingSymbol = ''
    this.selectedUnderlying = null
    this.form = {
      adapterAddress: '',
      quoteSymbol: '',
    }
  }

  @Watch('underlyingSymbol')
  private onUnderlyingSymbolChange() {
    this.selectRoutesIndex = null
  }

  @Watch('selectedUnderlying')
  private onSelectedUnderlyingChange() {
    if (!this.selectedUnderlying) {
      this.underlyingSymbol = ''
      return
    }
    this.underlyingSymbol = this.selectedUnderlying.type === UnderlyingType.Token ? this.selectedUnderlying.info.symbol : this.selectedUnderlying.info
  }

  @Watch('oracleRoutes')
  private async onOracleRoutesChange() {
    try {
      this.loadingOracleRoutes = true
      this.oracleRoutesWithTunableFlag = await Promise.all(this.oracleRoutes.map(async oracleRoute => {
        return await Promise.all(oracleRoute.map(async oracle => {
          const isTunable = await isTunableOracle(oracle.oracle.address)
          return Object.assign({ isTunable }, oracle)
        }))
      }))
    } finally {
      this.loadingOracleRoutes = false
    }
  }
}
</script>

<style lang="scss" scoped>

.registered-oracle-selector {
  .svg-icon {
    height: 24px;
    width: 24px;
    vertical-align: -7px;
  }

  .control-item {
    width: 450px;

    &.underlying {
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

  .iconfont {
    margin-left: 4px;
  }

  .iconfont:hover {
    color: var(--mc-color-primary);
  }

  .el-form {
    .el-form-item {
      ::v-deep {
        .el-radio__label {
          font-size: 16px;
        }

        .el-input__inner {
          font-size: 16px;
        }
      }

      &.index-price-twap {
        margin-top: 10px;
      }
    }
  }

  .el-dialog {
    .is-medium {
      height: 557px;
    }
  }
}

.tip-line {
  margin-left: 125px;
  margin-top: 30px;
  font-size: 14px;
  font-weight: 400;
  margin-right: 100px;

  span {
    ::v-deep a {
      color: var(--mc-color-primary) !important;
    }
  }
}

.registered-show-routes-tables {

  ::v-deep {
    .el-radio__label {
      display: none;
    }
  }

  .mc-data-table {
    width: 700px;
    margin: auto;

    tr {
      font-size: 14px;
      font-weight: 400;
    }

    th:nth-of-type(1) {
      width: 11%;
    }

    th:nth-of-type(2) {
      text-align: left;
      padding-left: 18px;
      width: 75%;
    }

    td:nth-of-type(2) {
      padding-left: 10px;
    }

    td {
      color: var(--mc-text-color-white);
    }
  }

  .oracle-item-split {
    color: var(--mc-icon-color-light);
  }
}
</style>

<style lang="scss" scoped>
@import '~@mcdex/style/common/fantasy-var';

.el-form {
  .el-form-item {

    &.button-container {
      margin-top: 30px;
    }

    ::v-deep {
      .el-form-item__label {
        width: 385px;
        padding-right: 20px;
        font-size: 14px;
        font-weight: 400;
        color: var(--mc-text-color);

        .iconfont {
          padding-left: 4px;
        }
      }
    }

    .el-radio__label {
      font-size: 14px;
      font-weight: 400;
      color: var(--mc-text-color);
    }

    .el-input {
      font-size: 16px;
      font-weight: 400;
    }
  }
}

.routes-table-wrap {
  min-height: 30px;
}

.oracle-route {
  display: inline-flex;
  align-items: center;
}

.fine-tuner {
  margin: 0 4px;
  font-size: 12px;
  line-height: 14px;
  color: var(--mc-color-primary);
  background-color: rgb($--mc-color-primary, 0.1);
  padding: 3px 8px;
  border-radius: var(--mc-border-radius-m);
  border: 1px solid rgb($--mc-color-primary, 0.1);
}
</style>

<style lang="scss">

.create-perpetual-select-oracle {
  font-size: 16px;

  li {
    font-size: 16px;
  }

  .el-autocomplete-suggestion__wrap {
    padding: 10px 0 0 0;
  }

  .popper__arrow {
    display: none;
  }
}
</style>
