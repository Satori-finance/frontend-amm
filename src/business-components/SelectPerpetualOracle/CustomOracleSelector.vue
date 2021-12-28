<template>
  <div class="custom-oracle-selector">
    <el-form ref="form" :model="form" :rules="rules" label-width="262px" @submit.native.prevent>
      <!-- custom type -->
      <div>
        <!-- index input -->
        <el-form-item :label="$t('newContract.adapter')" prop="adapterAddress" :inline-message="true">
          <el-input
            class="control-item"
            v-model.trim="form.adapterAddress"
            :placeholder="$t('newContract.inputAdapterAddress')"
          ></el-input>
        </el-form-item>
        <!-- custom read info -->
        <table v-show="underlyingSymbol !== '' || form.quoteSymbol !== ''"
               class="mc-data-table mc-data-table--border is-medium custom-oracle-info-table">
          <tbody>
          <tr>
            <td>{{ $t('newContract.underlyingAsset') }}</td>
            <td>{{ underlyingSymbol }}</td>
          </tr>
          <tr>
            <td>{{ $t('base.quote') }}</td>
            <td>{{ form.quoteSymbol }}</td>
          </tr>
          </tbody>
        </table>
      </div>
      <!-- next button -->

      <el-form-item label=" " class="button-container">
        <el-button
          class="control-item"
          @click="onConfirm"
          :loading="oracleLoading"
          :disabled="nextButtonIsDisabled"
        >
          {{ $t('base.next') }}
        </el-button>
      </el-form-item>
    </el-form>

  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator'
import { Provider } from '@ethersproject/providers'
import { ElForm } from 'element-ui/types/form'
import { CheckOracleAdaptorError, checkValidOracleAdaptor } from '@/utils'
import { namespace } from 'vuex-class'
import { McLoading } from '@/components'

const wallet = namespace('wallet')

@Component({
  components: {
    McLoading,
  },
})
export default class SelectPerpetualOracle extends Vue {
  @wallet.Getter('provider') provider!: Provider
  // bind: next event, params: SelectedOracleParams

  @Prop({ default: '', required: true }) collateralSymbol !: string
  @Prop({ default: '', required: true }) collateralAddress !: string
  @Prop({ default: 18, required: true }) collateralDecimals !: number

  @Ref('form') formRef!: ElForm

  private oracleLoading: boolean = false

  private underlyingSymbol = ''
  private form = {
    adapterAddress: '',
    quoteSymbol: '',
  }

  get rules() {
    return {
      adapterAddress: {
        validator: async (rule: any, value: any, callback: Function) => {
          this.underlyingSymbol = ''
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
    return this.underlyingSymbol !== '' && this.form.adapterAddress !== ''
  }

  get nextButtonIsDisabled(): boolean {
    return !this.formValidatorIsPass
  }

  @Watch('selectType')
  onSelectTypeChanged() {
    this.form.adapterAddress = ''
    this.underlyingSymbol = ''
    this.form.quoteSymbol = ''
    this.resetFormFields()
  }

  resetFormFields() {
    const form = this.$refs.form as ElForm
    if (form) {
      form.resetFields()
    }
  }

  onConfirm() {
    if (!this.formValidatorIsPass) {
      return
    }

    this.formRef.validate((isValid) => {
      if (!isValid) {
        return
      }
      this.$emit('confirm', {
        selectedType: 'custom',
        underlyingSymbol: this.underlyingSymbol,
        oracleAddress: this.form.adapterAddress,
        quoteSymbol: this.form.quoteSymbol,
      })
    })
  }

  reset() {
    this.underlyingSymbol = ''
    this.form = {
      adapterAddress: '',
      quoteSymbol: '',
    }
  }
}
</script>

<style lang="scss" scoped>

.custom-oracle-selector {

  .control-item {
    width: 450px;
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
        .el-input__inner {
          font-size: 16px;
        }
      }
    }
  }
}

.custom-oracle-info-table {
  margin-left: 192px;
  width: 620px;

  td:nth-of-type(1) {
    color: var(--mc-text-color);
    width: 30%;
  }

  td:nth-of-type(2) {
    color: var(--mc-text-color-white);
  }

  td {
    padding-left: 20px;
    font-size: 14px;
    font-weight: 400;
  }
}
</style>

<style lang="scss" scoped>
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

    .el-input {
      font-size: 16px;
      font-weight: 400;
    }
  }
}
</style>
