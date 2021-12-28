<template>
  <div>
    <el-dialog
      :title="$t('newContract.customRoute')"
      append-to-body
      top="0"
      custom-class="mini-round-dialog"
      class="custom-uniswap-route-dialog"
      :close-on-click-modal="false"
      :visible.sync="currentVisible"
      @open="onOpen"
      @close="onClose"
    >
      <div class="tokens" v-if="route">
        <div class="path-item" :class="{confirming: confirming}" v-for="(token, index) in route.tokenPath" :key="index">
          <div class="path">
            <div class="token-item" @click="showChangeTokenDialog(index)">
              <div class="token-info" v-if="token">
                <el-image :src="token.address | tokenIconUrlFormatter">
                  <div slot="error" class="image-slot">?</div>
                </el-image>
                <div class="label">
                  <div class="symbol">{{ token.symbol }}</div>
                  <div class="address">{{ token.address | ellipsisMiddle }}
                    <el-link :underline="false" target="_blank"><i class="iconfont icon-view"></i></el-link>
                  </div>
                </div>
              </div>
              <div class="placeholder" v-else>{{ $t('selectToken.title') }}</div>
              <div class="right-icon"><i class="iconfont icon-triangle-bottom-old"></i></div>
            </div>
            <div class="actions" v-if="index !== route.tokenPath.length - 1">
              <div class="add-action action-item" @click="addToken(index)"><i class="iconfont icon-add-bold"></i></div>
              <div class="remove-action action-item" v-if="index !== 0" @click="removeToken(index)"><i
                class="iconfont icon-remove-bold"></i></div>
            </div>
          </div>

          <div class="token-error" v-if="tokenErrors[index]">{{ $t(tokenErrors[index]) }}</div>

          <div class="fee" v-if="index !== route.tokenPath.length - 1">
            <div class="left"></div>
            <i class="iconfont icon-down-bold"></i>
            <div class="right" :class="{'no-data': !route.feeAmounts[index]}">
              <div class="label">{{ $t('newContract.poolFee') }}</div>
              <div class="fee-selector" @click="showChangeFeeDialog(index)">
                {{ getPoolFee(index) }}
                <div class="icon"><i class="iconfont icon-triangle-bottom-old"></i></div>
              </div>
            </div>
          </div>

          <div class="fee-error" v-if="feeErrors[index]">{{ $t(feeErrors[index]) }}</div>
        </div>

        <div class="path-error" v-if="pathError">{{ $t(pathError) }}</div>
      </div>
      <div class="confirm-btn">
        <el-button size="large" type="primary" :loading="confirming" @click="onConfirm">{{
            $t('base.confirm')
          }}
        </el-button>
      </div>
    </el-dialog>

    <McTokenSelectorDialog :visible.sync="tokenSelectorDialogVisible" v-model="selectingToken" :tokenList="chainAllTokenList" @close="changeToken"/>
    <UniswapFeeSelectorDialog :visible.sync="feeSelectorDialogVisible" v-model="selectingFee" @close="changeFee"/>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { ExtendedPool, LinkedMap, TokenInfoItem, UniswapV3Pool } from '@/type'
import { toBigNumber } from '@/utils'
import McTokenSelectorDialog from '@/business-components/McTokenSelectorDialog.vue'
import UniswapFeeSelectorDialog from '@/business-components/UniswapFeeSelectorDialog.vue'
import _ from 'lodash'
import BigNumber from 'bignumber.js'
import { namespace } from 'vuex-class'
import { TARGET_NETWORK_ID, UNISWAP_V3_FACTORY_ADDRESS } from '@/constants'
import { Provider } from '@ethersproject/providers'
import { FeeAmount } from '@uniswap/v3-sdk/dist/constants'
import { Token } from '@uniswap/sdk-core'
import { queryUniswapV3PoolsByAddresses } from '@/api/token'
import { Route } from '@uniswap/v3-sdk'
import { CHAIN_ID_TO_UNISWAP_V3_TOOL_ADDRESS, UniswapV3ToolFactory } from '@mcdex/mai3.js'
import { getPoolAddresses } from '@/utils/uniswap'

function defaultRoute(): { tokenPath: (TokenInfoItem | null)[], feeAmounts: (number | null)[] } {
  return { tokenPath: [], feeAmounts: [] }
}

const wallet = namespace('wallet')
const token = namespace('token')

@Component({
  components: {
    McTokenSelectorDialog,
    UniswapFeeSelectorDialog,
  },
})
export default class CustomUniswapRouteDialog extends Vue {
  @Prop({ default: false }) visible!: boolean
  @Prop({ default: () => null }) initRoute!: { tokenPath: TokenInfoItem[], feeAmounts: number[] } | null

  @wallet.Getter('provider') provider!: Provider
  @token.Getter('chainAllTokenList') chainAllTokenList!: TokenInfoItem[]

  private route: { tokenPath: (TokenInfoItem | null)[], feeAmounts: (number | null)[] } = defaultRoute()
  private selectingToken: TokenInfoItem | null = null
  private selectingTokenIndex: number | null = null
  private tokenSelectorDialogVisible: boolean = false
  private feeSelectorDialogVisible: boolean = false
  private selectingFeeIndex: number | null = null
  private selectingFee: number | null = null
  private tokenErrors: string[] = []
  private feeErrors: string[] = []
  private pathError = ''
  private confirming = false

  get currentVisible() {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
  }

  private getPoolFee(index: number) {
    return this.route.feeAmounts[index] ? `${toBigNumber(this.route.feeAmounts[index]).div(10000).toFixed()}%` : '--'
  }

  private addToken(index: number) {
    this.route.tokenPath.splice(index + 1, 0, null)
    this.route.feeAmounts.splice(index + 1, 0, null)
    this.pathError = ''
  }

  private removeToken(index: number) {
    this.route.tokenPath.splice(index, 1)
    this.route.feeAmounts.splice(index, 1)
    this.pathError = ''
  }

  private showChangeTokenDialog(index: number) {
    this.selectingToken = this.route.tokenPath[index]
    this.selectingTokenIndex = index
    this.tokenSelectorDialogVisible = true
  }

  private changeToken() {
    if (this.selectingTokenIndex === null || this.selectingTokenIndex < 0) {
      return
    }
    const currentToken = this.route.tokenPath[this.selectingTokenIndex]
    if (!currentToken || currentToken.address !== this.selectingToken?.address) {
      this.route.tokenPath.splice(this.selectingTokenIndex, 1, this.selectingToken)
    }
    this.pathError = ''
    this.validateField()
  }

  private showChangeFeeDialog(index: number) {
    this.selectingFeeIndex = index
    this.feeSelectorDialogVisible = true
    this.selectingFee = this.route.feeAmounts[index] || null
  }

  private changeFee() {
    if (this.selectingFeeIndex === null || this.selectingFeeIndex < 0) {
      return
    }
    this.route.feeAmounts.splice(this.selectingFeeIndex, 1, this.selectingFee)
    this.pathError = ''
    this.validateField()
  }

  private onClose() {
    this.route = defaultRoute()
    this.selectingToken = null
    this.selectingTokenIndex = null
    this.pathError = ''
    this.tokenErrors = []
    this.feeErrors = []
  }

  private onOpen() {
    if (this.initRoute) {
      this.route = {
        tokenPath: new Array<TokenInfoItem>().concat(this.initRoute.tokenPath),
        feeAmounts: new Array<number>().concat(this.initRoute.feeAmounts),
      }
    }
  }

  private validateField() {
    this.tokenErrors = new Array(this.route.tokenPath.length)
    this.feeErrors = new Array(this.route.feeAmounts.length)
    this.route.tokenPath.forEach((t, i) => {
      if (!t) {
        this.tokenErrors[i] = 'newContract.selectTokenError'
      }
    })
    this.route.feeAmounts.forEach((f, i) => {
      if (!f) {
        this.feeErrors[i] = 'newContract.selectFeeError'
      }
    })
    return !_.some(this.tokenErrors, e => !!e) && !_.some(this.feeErrors, e => !!e)
  }

  private async generateRouteInfo() {
    try {
      this.pathError = ''
      const uniswapV3OracleTool = UniswapV3ToolFactory.connect(CHAIN_ID_TO_UNISWAP_V3_TOOL_ADDRESS[TARGET_NETWORK_ID], this.provider)
      const price = await uniswapV3OracleTool.getPrice(UNISWAP_V3_FACTORY_ADDRESS, this.route.tokenPath.map(t => t?.address || ''), this.route.feeAmounts as number[])

      const pairs: [Token, Token, FeeAmount][] = this.route.feeAmounts.map((f, i) => {
        const tokenIn = this.route.tokenPath[i]
        const tokenOut = this.route.tokenPath[i + 1]
        return [new Token(TARGET_NETWORK_ID, tokenIn!.address, tokenIn!.decimals!, tokenIn?.symbol), new Token(TARGET_NETWORK_ID, tokenOut!.address, tokenOut!.decimals!, tokenIn?.symbol), f as FeeAmount]
      })
      const poolAddresses = getPoolAddresses(pairs, TARGET_NETWORK_ID).filter(p => p !== undefined).map(p => p!.toLowerCase())
      const uniqPoolAddresses = _.uniq(poolAddresses)
      if (poolAddresses.length !== uniqPoolAddresses.length) {
        throw new Error('duplicate pool')
      }
      const poolMap = new LinkedMap<string, UniswapV3Pool | null>(poolAddresses.map(p => [p, null]))
      const result = await queryUniswapV3PoolsByAddresses(poolAddresses)
      result.pools.forEach(p => {
        poolMap.set(p.id, p)
      })
      const pools = (Array.from(poolMap.values()).filter(p => p !== null) as UniswapV3Pool[]).map(p => p.toPoolWithFeeAmount(TARGET_NETWORK_ID)) as ExtendedPool[]
      return {
        route: new Route(pools, pairs[0][0], pairs[pairs.length - 1][1]),
        price: new BigNumber(price.toString()),
      }
    } catch (e) {
      this.pathError = 'newContract.pathError'
      return null
    }
  }

  private async onConfirm() {
    if (this.validateField()) {
      this.confirming = true
      const routeInfo = await this.generateRouteInfo()
      if (routeInfo) {
        this.$emit('change', routeInfo)
        this.currentVisible = false
      }
      this.confirming = false
    }
  }
}
</script>

<style lang="scss" scoped>
.custom-uniswap-route-dialog {
  ::v-deep .el-dialog {
    min-height: auto;
    width: 400px;

    .el-dialog__body {
      overflow: unset;
    }
  }

  .path-item {
    &.confirming {
      pointer-events: none;
    }

    .path {
      background-color: var(--mc-background-color-light);
      border-radius: var(--mc-border-radius-l);
      border: 1px solid var(--mc-border-color);

      .token-item {
        background-color: var(--mc-background-color);
        border-radius: var(--mc-border-radius-l);
        border: 1px solid var(--mc-border-color);
        margin: -1px -1px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 56px;
        padding: 0 16px;
        cursor: pointer;

        .token-info {
          display: flex;
          align-items: center;

          .el-image {
            height: 24px;
            width: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;

            ::v-deep .image-slot {
              width: 100%;
              height: 100%;
              border: 2px solid var(--mc-text-color);
              color: var(--mc-text-color);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
            }
          }

          .label {
            .symbol {
              font-size: 18px;
              line-height: 20px;
            }

            .address {
              display: flex;
              align-items: center;
              color: var(--mc-text-color);
              font-size: 12px;
              line-height: 16px;

              .el-link {
                margin-left: 4px;
                color: var(--mc-text-color);
                font-size: 14px;
              }
            }
          }
        }

        .right-icon {
          height: 20px;
          width: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: var(--mc-icon-color-light);
        }
      }

      .actions {
        height: 48px;
        display: flex;
        align-items: center;
        margin-top: 1px;

        .action-item {
          flex: 1;
          height: 100%;
          line-height: 48px;
          text-align: center;
          cursor: pointer;
          border-radius: var(--mc-border-radius-l);

          &:hover {
            background-color: var(--mc-background-color);
          }
        }
      }
    }

    .fee {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 8px 0;

      .icon-down-bold {
        font-size: 16px;
        color: var(--mc-text-color);
      }

      .left, .right {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        justify-content: center;

        &.no-data {
          opacity: 0.5;
        }

        .label {
          font-size: 14px;
          line-height: 20px;
          color: var(--mc-text-color);
          margin-bottom: 4px;
        }

        .fee-selector {
          height: 38px;
          padding: 0 16px;
          border-radius: var(--mc-border-radius-l);
          border: 1px solid var(--mc-border-color-light);
          display: flex;
          align-items: center;
          cursor: pointer;

          .icon {
            height: 20px;
            width: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: var(--mc-text-color);
            margin-left: 8px;
          }
        }
      }
    }

    .token-error, .fee-error {
      font-size: 16px;
      line-height: 24px;
      margin: 8px 0;
      color: var(--mc-color-error);
    }

    .fee-error {
      text-align: right;
    }
  }

  .path-error {
    font-size: 16px;
    line-height: 24px;
    margin: 8px 0;
    color: var(--mc-color-error);
  }

  .confirm-btn {
    margin-top: 24px;

    .el-button {
      width: 100%;
      border-radius: var(--mc-border-radius-l);
      height: 56px;
    }
  }
}
</style>

