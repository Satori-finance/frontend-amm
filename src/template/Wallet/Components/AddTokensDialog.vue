<template>
  <div class="add-tokens-dialog">
    <el-dialog
      :title="$t('accountWallet.addTokenDialog.title')"
      top="0"
      custom-class="is-medium"
      :close-on-click-modal="false"
      :visible.sync="currentVisible"
      @closed="onClosed"
    >
      <div class="dialog-body">
        <div class="form-box">
          <el-form
            size="large"
            :model="form"
            ref="orderGasForm"
            @submit.native.prevent
          >
            <el-form-item prop="address">
              <el-input v-model.trim="form.address" size="large"
                        :placeholder="$t('accountWallet.addTokenDialog.tokenContractAddress')"
                        @input="search">
                <i slot="prefix" class="el-input__icon el-icon-search"></i>
              </el-input>
            </el-form-item>
          </el-form>
        </div>
        <McLoading :show-loading="loading" :delay="500">
          <div class="panel-box" v-show="searchTimes">
            <div v-if="!searchTokenDetails" class="panel-no-data">
              <McNoData :label="$t('base.noResults')"></McNoData>
            </div>
            <div v-else>
              <div class="panel-line-item">
                <span>{{ $t('accountWallet.addTokenDialog.symbol') }}</span>
                <span class="value">
              {{ searchTokenDetails.symbol }}
              <el-link class="icon" :underline="false" target="_blank"
                       :href="searchTokenDetails.address | etherBrowserAddressFormatter">
                <i class="iconfont icon-transmit"></i>
              </el-link>
            </span>
              </div>
              <div class="panel-line-item">
                <span>{{ $t('accountWallet.addTokenDialog.tokenName') }}</span>
                <span class="value">{{ searchTokenDetails.tokenName }}</span>
              </div>
              <div class="panel-line-item">
                <span>{{ $t('accountWallet.addTokenDialog.maxTotalSupply') }}</span>
                <span class="value">{{ searchTokenDetails.maxTotalSupply }}</span>
              </div>
              <div class="panel-line-item">
                <span>{{ $t('accountWallet.addTokenDialog.decimals') }}</span>
                <span class="value">{{ searchTokenDetails.decimals }}</span>
              </div>
            </div>
          </div>
        </McLoading>
      </div>
      <span slot="footer">
        <div class="footer-button">
          <el-button @click="currentVisible=false" class="cancel-btn" size="medium"
                     type="secondary">{{ $t('base.cancel') }}</el-button>
          <el-button @click="confirmEvent" size="medium" type="primary" :disabled="buttonIsDisabled">
            {{ $t('base.confirm') }}
            <i v-if="buttonIsLoading" class="el-icon-loading"></i>
          </el-button>
        </div>
      </span>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import BigNumber from 'bignumber.js'
import { McNoData, McLoading } from '@/components'
import { erc20Decimals, erc20Symbol, getERC20Contract, totalSupply, erc20Name, IERC20 } from '@mcdex/mai3.js'
import { namespace } from 'vuex-class'
import { Provider } from '@ethersproject/providers'
import debounceAsync from '@seregpie/debounce-async'

interface TokenDetails {
  address: string
  symbol: string
  tokenName: string
  maxTotalSupply: BigNumber
  decimals: number
}

const wallet = namespace('wallet')

@Component({
  components: {
    McNoData,
    McLoading,
  },
})
export default class AddTokensDialog extends Mixins(ErrorHandlerMixin) {
  @wallet.Getter('provider') provider!: Provider | null
  @wallet.Getter('providerL1') providerL1!: Provider | null

  @Prop({ default: false }) visible!: boolean

  private buttonIsLoading: boolean = false
  private debounceGetCollateralFunc = debounceAsync(this.getCollateral, 200)
  private loading = false
  private searchTimes = 0
  private form = {
    address: '',
  }

  private searchTokenDetails: TokenDetails | null = null

  get currentVisible() {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
  }

  get buttonIsDisabled(): boolean {
    return !this.searchTokenDetails
  }

  private search() {
    this.debounceGetCollateralFunc()
  }

  private async getCollateral() {
    if (!this.provider || !this.providerL1) {
      return
    }
    this.searchTimes++
    try {
      this.loading = true
      let erc20Contract: IERC20
      let decimals
      try {
        erc20Contract = getERC20Contract(this.form.address, this.provider)
        decimals = await erc20Decimals(erc20Contract)
      } catch (e) {
        erc20Contract = getERC20Contract(this.form.address, this.providerL1)
        decimals = await erc20Decimals(erc20Contract)
      }
      const [symbol, tokenTotalSupply, name] = await Promise.all([erc20Symbol(erc20Contract), totalSupply(erc20Contract, decimals), erc20Name(erc20Contract)])
      this.searchTokenDetails = {
        symbol,
        decimals,
        tokenName: name,
        maxTotalSupply: tokenTotalSupply,
        address: erc20Contract.address.toLowerCase(),
      }
    } catch (e) {
      this.searchTokenDetails = null
      console.warn(e)
    } finally {
      this.loading = false
    }
  }

  onClosed() {
    this.form.address = ''
    this.searchTimes = 0
    this.searchTokenDetails = null
  }

  async confirmEvent() {
    if (this.searchTokenDetails) {
      this.currentVisible = false
      this.$emit('confirm', this.searchTokenDetails.address)
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~@mcdex/style/common/var';

.add-tokens-dialog {
  ::v-deep .el-dialog {
    height: 454px;
    padding-bottom: 32px;

    .el-dialog__footer {
      .footer-button {
        text-align: center;
      }

      .el-button {
        width: 106px;
        margin: 0 12px;
      }
    }
  }

  ::v-deep .el-input__inner {
    font-size: 14px;
  }

  ::v-deep .el-form-item {
    margin-bottom: 10px;
  }

  .dialog-body {
    padding: 43px 76px 0 76px;
  }

  .panel-no-data {
    height: 100%;

    ::v-deep {
      .no-data {
        height: 100%;

        img {
          width: 48px;
          height: 48px;
        }

        .label {
          margin-top: unset;
        }
      }
    }
  }

  .panel-box {
    height: 152px;
    width: 480px;
    background: rgba($--mc-background-color-dark, 0.5);
    padding: 20px;
    border-radius: 4px;
    line-height: 28px;

    .panel-line-item {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: var(--mc-text-color);

      .value {
        color: var(--mc-text-color-white);
      }

      .icon {
        margin-left: 7px;
        color: var(--mc-icon-color-light);
        font-size: 10px;
        vertical-align: middle;
      }
    }
  }
}
</style>

