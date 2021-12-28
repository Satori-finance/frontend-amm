<template>
  <header class="dex-header">
    <div class="logo">
      <a href="http://satori.finance/">
        <img :src="require(`@/assets/img/${theme}/logo.png`)"/>
      </a>
      <div class="beta">Beta</div>
    </div>

    <el-menu :default-active="activeIndex" class="router-nav" mode="horizontal" @select="onMenuChange">
      <el-menu-item index="trade">
        {{ $t('trade') }}
      </el-menu-item>
      <el-menu-item index="pool">
        {{ $t('base.pool') }}
      </el-menu-item>
      <el-menu-item index="mining">
        {{ $t('base.farm') }}
      </el-menu-item>
      <el-menu-item index="wallet">
        {{ $t('base.account') }}
      </el-menu-item>
      <el-menu-item index="dao">
        {{ $t('base.dao') }}
      </el-menu-item>
      <el-menu-item index="stats">
        {{ $t('base.stats') }}
      </el-menu-item>
    </el-menu>

    <div class="preferences">
      <div class="item" v-if="$route.name === 'tradeMain'">
        <Layout
          ref="layout"
          :initalTheme="theme"
          @girdItemsChanged="
            (items) => {
              $emit('girdItemsChanged', items)
            }
          "
          @defaultLayout="
            () => {
              $emit('defaultLayout')
            }
          "
        />
      </div>
      <!--      <div class="item">-->
      <!--        <DisplaySetting class="display-setting-wrapper"/>-->
      <!--      </div>-->
    </div>
    <div class="dividing-line" v-if="$route.name === 'tradeMain'"></div>
    <div class="chain">
      <ChainViewer/>
    </div>
    <ConnectedWallet
      :walletAddress="walletAddress"
      :walletType="walletType"
      :isValidSession="isValidSessionFunc()"
      :noAuth="noAuth"
      v-if="isShowConnectedWallet"
    />
    <ConnectWallet
      class="connect-wallet"
      :class="{ 'margin-left': !wallet }"
      v-if="!wallet"
      :buttonText="$t('connectWalletButton.header')"
    ></ConnectWallet>

    <MenuViewer></MenuViewer>
  </header>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import Layout from './Layout.vue'
import { ConnectWallet } from '@/components'
import ConnectedWallet from './ConnectedWallet.vue'
import { namespace } from 'vuex-class'
import { SUPPORTED_WALLET, Wallet } from '@/business-components/wallet/wallet-connector'
import { ChainViewer, MenuViewer } from '@/business-components'
import { SelectedPerpetualMixin } from '@/mixins'
import DisplaySetting from './DisplaySetting.vue'
import { getLocalStorage } from '@/utils'
import { PERP_SYMBOL_KEY } from '@/constants'
import { ROUTE } from '@/router'

const wallet = namespace('wallet')
const auth = namespace('auth')

@Component({
  components: {
    Layout,
    ConnectWallet,
    ConnectedWallet,
    DisplaySetting,
    ChainViewer,
    MenuViewer,
  },
})
export default class Header extends Mixins(SelectedPerpetualMixin) {
  @auth.Getter('isValidateFunc') isValidSessionFunc!: () => boolean
  @wallet.Getter('address') walletAddress!: string | null
  @wallet.State('wallet') wallet!: Wallet | null
  @wallet.State('walletType') walletType!: SUPPORTED_WALLET | null

  private theme = 'dark'

  get noAuth() {
    return this.$route.name === 'liquidity'
  }

  get isShowConnectedWallet() {
    return this.walletAddress && this.walletAddress !== ''
  }

  get activeIndex() {
    if (!this.$route || !this.$route.name) {
      return null
    }
    if (this.routeMatched(ROUTE.TRADE)) {
      return 'trade'
    } else if (this.routeMatched(ROUTE.MINING_MAIN)) {
      return 'mining'
    } else if (this.routeMatched(ROUTE.POOL)) {
      return 'pool'
    } else if (this.routeMatched(ROUTE.WALLET)) {
      return 'wallet'
    } else if (this.routeMatched(ROUTE.DAO)) {
      return 'dao'
    } else if (this.routeMatched(ROUTE.HOME)) {
      return 'stats'
    } else {
      return this.$route.name
    }
  }

  get toTradeSymbol() {
    return this.selectedPerpetualProperty?.symbolStr || getLocalStorage(PERP_SYMBOL_KEY) || ''
  }

  private onMenuChange(index: string) {
    switch (index) {
      case 'trade':
        this.$router.push({ name: ROUTE.TRADE_MAIN, params: { symbol: this.toTradeSymbol } })
        break
      case 'pool':
        this.$router.push({ name: ROUTE.POOL })
        break
      case 'mining':
        this.$router.push({ name: ROUTE.MINING })
        break
      case 'wallet':
        this.$router.push({ name: ROUTE.WALLET })
        break
      case 'home':
        this.$router.push({ name: ROUTE.HOME })
        break
      case 'dao':
        this.$router.push({ name: ROUTE.DAO })
        break
      case 'stats':
        this.$router.push({ name: ROUTE.HOME })
        break
      default:
        break
    }
  }

  private routeMatched(routeName: ROUTE) {
    if (!this.$route || !this.$route.name) {
      return false
    }
    return this.$route.matched.filter((item) => item.name === routeName).length > 0
  }
}
</script>

<style lang="scss" scoped>
@import '~@mcdex/style/common/var.scss';

.dex-header {
  z-index: 11;
  position: sticky;
  top: 0;
  display: flex;
  height: 56px;
  align-items: center;
  font-size: 16px;
  padding: 0 16px;

  .logo {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    a {
      padding: 0;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    img {
      width: 100px;
    }

    .beta {
      align-self: flex-start;
      border: 1px solid rgba($--mc-color-primary, 0.1);
      color: var(--mc-color-primary);
      border-radius: 8px 8px 8px 0;
      padding: 3px 7px;
      font-size: 12px;
      line-height: 14px;
      margin-top: 8px;
      margin-left: 4px;
    }
  }

  .router-nav {
    flex: auto;
    margin-left: 24px;
    height: 56px;
  }

  .faucet {
    display: flex;
    align-items: center;

    button {
      height: 0.32rem;
      font-weight: bold;
      padding: 0 0.2rem;
      margin-left: 0.08rem;
    }
  }

  .preferences {
    display: flex;
    align-items: center;

    .item {
      display: flex;
      margin-left: 10px;
      position: relative;
      cursor: pointer;
    }
  }

  .dividing-line {
    margin: 0 16px;
    height: 16px;
    width: 1px;
    background: #242D43;
  }

  .connect-wallet {
    height: 40px;
    padding: 0 12px;
    font-size: 14px;
    border-radius: var(--mc-border-radius-l);

    &.margin-left {
      margin-left: 8px;
    }
  }

  .menu-viewer {
    margin-left: 8px;
  }
}
</style>

<style lang="scss" scoped>
.dex-theme-dark {
  .dex-header {
    background: var(--mc-background-color);

    .route-item {
      color: var(--menu-color);

      &:hover {
        color: var(--strong-menu-color);
      }

      &.current-route {
        color: var(--strong-menu-color);

        &:after {
          background-image: linear-gradient(89deg, #1d233b 0%, #93b6f2 51%, #1d233b 100%);
        }
      }
    }
  }
}
</style>

<style scoped lang="scss">
@import "~@mcdex/style/common/fantasy-var";

.satori-fantasy {
  .dex-header {
    background-color: var(--mc-background-color-darkest);

    .logo {
      .beta {
        background-color: rgba($--mc-color-primary, 0.1);
      }
    }
  }
}
</style>
