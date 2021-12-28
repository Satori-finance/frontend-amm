<template>
  <transition name="fade">
    <el-dialog
      class="wallet-connected-dialog"
      custom-class="is-mini is-round"
      append-to-body
      top="0"
      :visible.sync="currentVisible"
      :title="$t('connectedWallet.dialogTitle')">
      <div class="body-container">
        <div class="wallet-info">
          <div class="address-info">
            <div class="tip-text-item button-container">
              {{ $t('connectedWallet.connectedWithWallet', { 'walletName': walletName }).toString() }}
              <el-button size="small" type="primary" class="change-button" plain @click="change">{{
                  $t('connectedWallet.change')
                }}
              </el-button>
            </div>
            <div class="address">
              <img v-if="isImToken" src="@/assets/img/wallet/imToken.svg" alt="">
              <McAvatar v-else :address="walletAddress" :size="16"></McAvatar>
              <span>{{ displayWalletAddress }}</span>
            </div>

            <div class="actions">
              <div class="action-item">
                <McCopy :content="address" :tooltip="false">
                  <span>{{ $t('base.copyAddress') }}</span>
                </McCopy>
              </div>
              <a class="action-item" :href="walletAddress | etherBrowserAddressFormatter" target="_blank">
                <span>{{ $t('base.viewOnExplorer') }}</span>
                <i class="iconfont icon-view"></i>
              </a>
            </div>
          </div>
        </div>

        <div class="recent-box" v-if="transactions.length">
          <span class="title">{{ $t('base.recentTransactions') }}</span>
          <el-button type="primary" size="mini" class="clear-btn" plain @click="clearRecentTransactions">{{
              $t('base.clearAll')
            }}
          </el-button>
        </div>
        <ul class="transactions" v-if="transactions.length">
          <li v-for="(item, index) in transactions" :key="index">
            <span class="label">
              <span>{{ item.content }}</span>
              <el-link :underline="false" target="_blank" :href="item.transactionHash | etherBrowserTxFormatter"><i
                class="iconfont icon-view"></i></el-link>
            </span>
            <span class="status">
              <Promised :promise="item.transaction">
                <template v-slot:pending>
                  <i class="iconfont icon-loading-small"></i>
                </template>
                <template>
                  <i class="iconfont icon-success-small"></i>
                </template>
                <template v-slot:rejected>
                  <i class="iconfont icon-failed-small"></i>
                </template>
              </Promised>
            </span>
          </li>
        </ul>
      </div>
    </el-dialog>
  </transition>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { SUPPORTED_WALLET, Wallet } from '@/business-components/wallet/wallet-connector'
import { VUE_EVENT_BUS, WALLET_EVENT } from '@/event'
import { ErrorHandlerMixin } from '@/mixins'
import { ellipsisMiddle, etherBrowserAddressUrl } from '@/utils'
import { clearRecentTransactions, McAvatar, McCopy, RECENT_TRANSACTIONS } from '@/components'
import { Promised } from 'vue-promised'

const wallet = namespace('wallet')

@Component({
  components: {
    Promised,
    McAvatar,
    McCopy,
  },
})
export default class ConnectedWalletDialog extends Mixins(ErrorHandlerMixin) {
  @Prop({ default: false }) visible!: boolean
  @wallet.State('walletType') walletType!: SUPPORTED_WALLET | null
  @wallet.Getter('address') walletAddress!: string | null
  @wallet.State('wallet') wallet!: Wallet | null

  private recentTransactions = RECENT_TRANSACTIONS

  get transactions() {
    return this.recentTransactions.reverse()
  }

  get currentVisible() {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
  }

  get isImToken() {
    return this.walletType === SUPPORTED_WALLET.imToken
  }

  get walletIcon() {
    let icon = 'wallet-metamask'
    switch (this.walletType) {
      case SUPPORTED_WALLET.WalletConnect:
        icon = 'wallet-connect'
        break
      case SUPPORTED_WALLET.WalletLink:
        icon = 'wallet-link'
        break
    }
    return icon
  }

  get displayWalletAddress() {
    return ellipsisMiddle(this.walletAddress || '', 6, 4)
  }

  get walletName() {
    if (!this.walletType) {
      return ''
    }
    return SUPPORTED_WALLET[this.walletType]
  }

  openInEtherscan() {
    if (!this.walletAddress) {
      return
    }
    window.open(etherBrowserAddressUrl(this.walletAddress))
  }

  change() {
    this.currentVisible = false
    VUE_EVENT_BUS.emit(WALLET_EVENT.ShowConnectWallet)
  }

  clearRecentTransactions() {
    clearRecentTransactions()
  }
}
</script>

<style lang="scss" scoped>
@import "~@mcdex/style/common/var";

.wallet-connected-dialog {
  a {
    cursor: pointer;
  }

  ::v-deep .el-dialog {
    min-height: 182px;

    .el-dialog__body {
      padding: 0 16px;
    }
  }

  ::v-deep .el-dialog.is-mini {
    width: 400px;
  }

  .body-container {
    text-align: center;

    .change-button {
      border-radius: var(--mc-border-radius-m);

      &:hover {
        -webkit-filter: unset !important;
        filter: unset !important;
      }
    }

    .wallet-info {
      border-radius: var(--mc-border-radius-l);
      border: 1px solid var(--mc-border-color);
      padding: 16px;
      box-sizing: border-box;
      display: flex;
      align-items: center;

      .address-info {
        flex: 1;

        .address {
          margin-top: 12px;
          color: var(--mc-text-color-white);
          font-size: 20px;
          line-height: 24px;
          display: flex;
          align-items: center;
          justify-content: flex-start;

          .mc-avatar {
            margin-right: 8px;
          }

          img {
            height: 24px;
            width: 24px;
            margin-right: 8px;
          }
        }

        .button-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 14px;
          line-height: 20px;
        }

        .actions {
          display: flex;
          align-items: center;
          margin-top: 12px;

          .action-item {
            display: flex;
            align-items: center;
            color: var(--mc-text-color);
            font-size: 14px;
            line-height: 16px;
            cursor: pointer;

            &:hover {
              span {
                text-decoration: underline;
              }

              i {
                color: var(--mc-color-primary);
              }
            }

            &:not(:last-child) {
              margin-right: 24px;
            }

            ::v-deep i {
              margin-left: 5px;
            }
          }
        }

        .tip-text-item {
          color: var(--mc-text-color);
        }
      }

      .icon-item {
        margin: 0 3px;
        font-size: 12px;
      }

      .copy-icon {
        margin-left: 6px;

        i {
          font-size: 14px !important;
        }
      }

      .link-icon {
        i {
          font-size: 10px !important;
        }
      }
    }

    .recent-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 16px;
      font-size: 16px;
      line-height: 22px;
    }

    .transactions {
      margin-top: 12px;
      max-height: 100px;
      overflow-x: hidden;
      overflow-y: auto;

      li {
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: var(--mc-text-color);
        line-height: 20px;
        font-size: 14px;
        margin-bottom: 8px;

        &:last-of-type {
          margin-bottom: 0;
        }

        .label {
          display: flex;
          align-items: center;
        }

        .el-link {
          margin-left: 7px;
          font-size: 12px;
          color: var(--mc-text-color);

          i {
            font-size: 16px;
          }
        }

        .status {
          i {
            overflow: hidden;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            font-size: 14px;
            color: var(--mc-text-color-white);

            &.icon-loading-small {
              animation: rotating 2s linear infinite;
              background-color: var(--mc-color-warning);
            }

            &.icon-success-small {
              background-color: var(--mc-color-success);
            }

            &.icon-failed-small {
              background-color: var(--mc-color-error);
            }
          }
        }
      }
    }
  }

  i:hover {
    color: var(--mc-color-primary);
  }

  .el-button {
    font-size: 12px;
    height: 24px;
    margin: 0;

    &.clear-btn {
      font-size: 12px;
      width: auto;
      min-width: 61px;
      border-radius: var(--mc-border-radius-m);

      &:hover {
        -webkit-filter: unset !important;
        filter: unset !important;
      }
    }
  }
}
</style>
