<template>
  <div class="wallet-account-wrapper">
    <div class="bg">
      <img src="@/assets/img/satori-bg.png" alt="">
    </div>
    <div class="wallet-adapter">
      <div class="left">
        <WalletInfo/>
        <WalletReferralLink/>
      </div>
      <div class="right">
        <MarginAccount class="panel-item"/>
        <LiquidityProvider class="panel-item"/>
        <SATORISerial class="panel-item"/>
      </div>
    </div>
  </div>

</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { BaseCardFrame } from '@/components'
import WalletPanel from './WalletPanel.vue'
import WalletDetails from './WalletDetails.vue'
import WalletInfo from './WalletInfo.vue'
import WalletReferralLink from './WalletReferralLink.vue'
import MarginAccount from './MarginAccount.vue'
import LiquidityProvider from './LiquidityProvider.vue'
import SATORISerial from './SatoriSerial.vue'
import ReferralLink from './ReferralLink.vue'
import { namespace } from 'vuex-class'

const wallet = namespace('wallet')

@Component({
  components: {
    BaseCardFrame,
    WalletPanel,
    WalletDetails,
    WalletInfo,
    MarginAccount,
    WalletReferralLink,
    LiquidityProvider,
    SATORISerial,
    ReferralLink,
  },
})
export default class WalletAdapter extends Vue {
  @wallet.Getter('isConnectedWallet') isConnectedWallet !: boolean
}
</script>

<style scoped lang="scss">
@import './wallet.scss';

.wallet-account-wrapper {
  position: relative;
  background-color: var(--mc-background-color-darkest);
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .bg {
    position: absolute;
    width: 800px;
    left: calc(50% - 400px);
    filter: blur(100px);
    z-index: 0;
  }
}

.panel-item {
  margin-bottom: 48px;

  &:last-of-type {
    margin-bottom: 0;
  }
}

.wallet-adapter {
  position: relative;
  height: 100%;
  width: 100%;
  overflow-y: auto;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 32px;
  margin: 0 auto;
  flex: 1;
  z-index: 1;
  padding-bottom: 64px;

  .left {
    width: 304px;
    position: sticky;
    top: 0;
    margin-right: 24px;
  }

  .right {
    width: 872px;
  }

  ::v-deep .base-card-frame {
    .content {
      padding: 30px;
    }
  }

  ::v-deep.mc-loading .mc-loading__mask .mc-loading__item {
    z-index: 9;
  }
}
</style>
