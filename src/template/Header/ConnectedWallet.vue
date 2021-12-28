<template>
  <div>
    <div class="wallet-container">
      <div class="value-container">
        <div class="wallet-address" @click="showDialog">
          <img class="icon" :src="walletIcon" alt="">
          <span>{{ displayWalletAddress }}</span>
        </div>
      </div>
    </div>
    <ConnectedWalletDialog :visible.sync="showConnectedWalletDialog" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { ellipsisMiddle } from '@/utils'
import { SUPPORTED_WALLET, WALLET_ICON } from '@/business-components/wallet/wallet-connector'
import { namespace } from 'vuex-class'
import ConnectedWalletDialog from './ConnectedWalletDialog.vue'

const auth = namespace('auth')

@Component({
  components: {
    ConnectedWalletDialog
  },
})
export default class ConnectedWallet extends Vue {
  @auth.Getter('isValidateFunc') isValidSessionFunc!: () => boolean
  @Prop({ default: '' }) private walletAddress!: string
  @Prop({ default: SUPPORTED_WALLET.InvalidType }) private walletType!: SUPPORTED_WALLET

  private showConnectedWalletDialog: boolean = false

  get displayWalletAddress() {
    return ellipsisMiddle(this.walletAddress || '', 6, 4)
  }

  get walletIcon() {
    return WALLET_ICON[this.walletType]
  }

  showDialog() {
    this.showConnectedWalletDialog = true
  }
}
</script>

<style lang="scss" scoped>
.wallet-container {
  height: 100%;
  position: relative;
  margin-left: 8px;

  .value-container {
    width: 100%;
    height: 100%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .wallet-address {
    display: flex;
    align-items: center;
    font-size: 14px;
    line-height: 24px;
    padding: 8px 12px;
    border-radius: var(--mc-border-radius-l);

    .icon {
      width: 20px;
      height: 20px;
      margin-right: 8px;
      vertical-align: 1px;
    }
  }
}
</style>

<style lang="scss" scoped>
.satori-fantasy {
  .wallet-container {
    color: var(--strong-text-color);

    .wallet-address {
      background-color: var(--mc-background-color);

      &:hover {
        background-color: var(--mc-background-color-light);
      }
    }

    .icon-triangle-bottom {
      color: var(--text-color);
    }
  }
}
</style>
