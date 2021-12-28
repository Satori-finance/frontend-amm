<template>
  <van-popup
    class="sider-popup safe-area-inset-bottom"
    v-model="show"
    safe-area-inset-bottom
    position="right"
    get-container="body">
    <div class="head">
      <div class="logo-box">
        <img class="logo" src="@/assets/img/mcdex_logo.png" alt="">
        <div class="beta">Beta</div>
      </div>
      <van-icon name="cross" @click="closePopup"/>
    </div>

    <div class="menu">
      <div class="menu-item" :class="{'selected-menu-item': activeIndex==='trade'}" @click="goTrade">
        <i class="iconfont icon-trade-bold"></i>
        <span class="label">{{ $t('base.trade') }}</span>
      </div>
      <div class="menu-item" :class="{'selected-menu-item': activeIndex==='pool'}" @click="goPool">
        <i class="iconfont icon-pool"></i>
        <span class="label">{{ $t('base.pool') }}</span>
      </div>
      <div class="menu-item" :class="{'selected-menu-item': activeIndex==='mining'}" @click="goMining">
        <i class="iconfont icon-mining-bold"></i>
        <span class="label">{{ $t('base.farm') }}</span>
      </div>
      <div class="menu-item" :class="{'selected-menu-item': activeIndex==='dao'}" @click="goDao">
        <i class="iconfont icon-dao"></i>
        <span class="label">{{ $t('base.dao') }}</span>
      </div>
      <div class="menu-item" :class="{'selected-menu-item': activeIndex==='stats'}" @click="goStats">
        <i class="iconfont icon-sidebar-stats"></i>
        <span class="label">{{ $t('base.stats') }}</span>
      </div>
      <div class="menu-item" v-if="isShowSATORISerialA" :class="{'selected-menu-item': activeIndex==='claim'}" @click="toClaimPage">
        <i class="iconfont icon-mcb-round-logo"></i>
        <span class="label">{{ $t('mcbSale.serial2') }}</span>
      </div>
      <div class="menu-item" :class="showMore?'arrow-transform':''" @click="showMore=!showMore">
        <i class="iconfont icon-more-2"></i>
        <span class="label">{{ $t('base.more') }}</span>
        <i class="iconfont icon-bold-up"></i>
      </div>
      <div class="more-box" :class="showMore?'show-more':''">
        <div class="more-menu">
          <!-- <div class="more-menu-item" @click="goReference">{{ $t('footer.docs') }}</div> -->
          <div class="more-menu-item" @click="goCode">{{ $t('footer.code') }}</div>
          <!-- <div class="more-menu-item" @click="goForum">{{ $t('footer.forum') }}</div> -->
          <!-- <div class="more-menu-item" @click="goDiscord">{{ $t('footer.discord') }}</div>
          <div class="more-menu-item" @click="goTelegram">{{ $t('footer.telegram') }}</div>
          <div class="more-menu-item" @click="goMedium">{{ $t('footer.medium') }}</div> -->
        </div>
      </div>
      <!--      <div class="menu-item" @click="goLanguage">-->
      <!--        <i class="iconfont icon-language"></i>-->
      <!--        <span class="label">{{ $t('footer.language') }}</span>-->
      <!--      </div>-->
    </div>
  </van-popup>
</template>
<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import { VUE_EVENT_BUS } from '@/event'
import { COMMON_EVENT } from '@/mobile/event'
import { namespace } from 'vuex-class'
import { ROUTE } from '@/mobile/router'
import { copyToClipboard } from '@/utils'
import { SUPPORTED_WALLET } from '@/business-components/wallet/wallet-connector'
import { commitments, getMcbVestingContract } from '@/utils/SatoriVesting'
import { ErrorHandlerMixin } from '@/mixins'
import { Provider } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import { currentChainConfig } from '@/config/chain'

const wallet = namespace('wallet')

@Component
export default class SiderPopup extends Mixins(ErrorHandlerMixin) {
  @wallet.Getter('address') address!: string | null
  @wallet.Getter('provider') provider!: Provider
  @wallet.State('walletType') walletType!: SUPPORTED_WALLET | null
  @wallet.Mutation('closeWallet') closeWallet!: () => void

  show = false
  protected allocation: BigNumber | null = null
  private showMore: boolean = false

  get isInjectedWallet() {
    return this.address && this.walletType === SUPPORTED_WALLET.InvalidType
  }

  get isShowSATORISerialA() {
    if (!this.isConnectedWallet || !this.allocation || this.allocation.eq(0)) {
      return false
    }
    return true
  }

  get activeIndex() {
    if (!this.$route || !this.$route.name) {
      return null
    }
    if (this.routeMatched(ROUTE.TRADE)) {
      return 'trade'
    } else if (this.routeMatched(ROUTE.MINING)) {
      return 'mining'
    } else if (this.routeMatched(ROUTE.POOL_LIST) || this.routeMatched(ROUTE.POOL_INFO)) {
      return 'pool'
    } else if (this.routeMatched(ROUTE.DAO)) {
      return 'dao'
    } else if (this.routeMatched(ROUTE.HOME)) {
      return 'stats'
    } else if (this.routeMatched(ROUTE.CLAIM)) {
      return 'claim'
    } else {
      return this.$route.name
    }
  }

  async mounted() {
    VUE_EVENT_BUS.on(COMMON_EVENT.SHOW_SIDER_POPUP, this.showPopup)
    this.getClaimableToken()
  }

  destroyed() {
    VUE_EVENT_BUS.off(COMMON_EVENT.SHOW_SIDER_POPUP, this.showPopup)
  }

  showPopup() {
    this.show = true
  }

  closePopup() {
    this.show = false
  }

  toClaimPage() {
    this.$router.push({ name: ROUTE.CLAIM })
    this.closePopup()
  }

  private selectWallet() {
    this.closePopup()
    VUE_EVENT_BUS.emit(COMMON_EVENT.SHOW_SELECT_WALLET_POPUP)
  }

  private goTrade() {
    this.$router.push({ name: ROUTE.TRADE })
    this.closePopup()
  }

  private goMining() {
    this.$router.push({ name: ROUTE.MINING })
    this.closePopup()
  }

  private goPool() {
    this.$router.push({ name: 'poolList' })
    this.closePopup()
  }

  private goDao() {
    this.$router.push({ name: ROUTE.DAO })
    this.closePopup()
  }

  private goStats() {
    this.$router.push({ name: ROUTE.HOME })
    this.closePopup()
  }

  private goReference() {
    window.location.href = ''
  }

  private goForum() {
    window.location.href = ''
  }

  private goCode() {
    window.location.href = 'https://github.com/Satori-finance'
  }

  private goDiscord() {
    window.location.href = ''
  }

  private goTelegram() {
    window.location.href = ''
  }

  private goMedium() {
    window.location.href = ''
  }

  private goLanguage() {
    this.$router.push({ name: ROUTE.LANGUAGE })
    this.closePopup()
  }

  private copyAddress() {
    if (!this.address) {
      return
    }
    copyToClipboard(this.address)
    this.$toast(this.$t('base.copySuccess').toString())
  }

  private routeMatched(routeName: ROUTE) {
    if (!this.$route || !this.$route.name) {
      return false
    }
    return this.$route.matched.filter((item) => item.name === routeName).length > 0
  }

  @Watch('provider', { immediate: true })
  @Watch('address', { immediate: true })
  async getClaimableToken() {
    await this.callChainReadFunc(async () => {
      if (!this.provider || !this.address) {
        return
      }
      const contract = getMcbVestingContract(this.provider)
      this.allocation = await commitments(contract, this.address)
    })
  }
}
</script>

<style lang="scss" scoped>
.sider-popup {
  height: 100%;
  width: 320px;
  color: var(--mc-text-color);

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    height: 44px;

    .logo-box {
      display: flex;
      align-items: center;

      img.logo {
        height: 20px;
      }

      .beta {
        align-self: flex-start;
        border-radius: 8px 8px 8px 0;
        padding: 3px 7px;
        font-size: 12px;
        line-height: 14px;
        margin-left: 4px;
        margin-top: -9px;
      }
    }

    .van-icon {
      color: white;
      font-size: 24px;
    }
  }

  .menu {
    margin-top: 16px;
    color: var(--mc-text-color-white);

    .menu-item {
      display: flex;
      align-items: center;
      padding: 0 16px;
      height: 48px;
      line-height: 48px;

      &.selected-menu-item {
        &:before {
          content: ' ';
          display: inline-block;
          width: 3px;
          height: 20px;
          background: var(--mc-color-primary);
          position: absolute;
          left: 0;
        }
      }

      .iconfont {
        font-size: 20px;
        line-height: 20px;

        &::before {
          height: 20px;
        }
      }

      .label {
        line-height: 18px;
        font-size: 16px;
        margin-left: 12px;
      }

      .icon-bold-up {
        font-size: 12px;
        color: var(--mc-text-color);
        margin-left: 200px;
        transition: transform 0.3s;
        transform: rotate(0.5turn);

        &::before {
          height: 12px;
        }
      }
    }

    .arrow-transform {
      .icon-bold-up {
        transform: none;
      }
    }

    .more-box {
      height: 0;
      position: relative;
      overflow: hidden;
      transition: height 0.3s;

      .more-menu {
        position: absolute;
        bottom: 0;
        width: 100%;
        background: var(--mc-background-color-darkest);
        height: 264px;
        z-index: 1;

        .more-menu-item {
          height: 44px;
          padding: 12px 16px;
          font-size: 14px;
        }
      }
    }

    .show-more {
      height: 264px;
    }
  }

  .connect-wallet {
    .van-button {
      font-size: 16px;

      ::v-deep .van-button__text {
        display: flex;
        align-items: center;
      }
    }

    .iconfont {
      font-size: 20px;
      margin-right: 4px;
    }
  }

  .connect-wallet, .user-info-box {
    position: absolute;
    bottom: 0;
    left: 0;
    padding: 0 16px;
    width: 100%;
    margin-bottom: 16px;
  }

  .user-info-box {
    .user-info {
      padding: 16px;
      border: 1px solid var(--mc-border-color);
      border-radius: 12px;

      .title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: var(--mc-text-color-white);
        font-size: 18px;
      }

      .address {
        display: flex;
        align-items: center;
        color: var(--mc-text-color-white);
        font-size: 20px;
        line-height: 23px;
        margin-top: 16px;

        img {
          border-radius: 50%;
        }

        span {
          margin-left: 8px;
        }
      }

      .buttons {
        display: flex;

        .van-button {
          padding: 0 8px;

          &:last-of-type {
            margin-left: 8px;
          }
        }
      }

      .actions {
        margin-top: 16px;
        display: flex;
        align-items: center;
        font-size: 14px;
        line-height: 16px;

        .iconfont {
          font-size: 16px;
        }

        .action-item {
          margin-right: 32px;

          .iconfont {
            margin-right: 4px;
          }
        }

        .claim-button {
          margin-left: 10px;

          ::v-deep.van-button {
            height: 24px;
            width: 77px;
            border-radius: 8px;

            .van-button__content {
              font-size: 12px;
              white-space: nowrap;
            }
          }

          ::v-deep.van-button--normal {
            padding: 0;
          }
        }
      }
    }
  }
}
</style>

<style scoped lang="scss">
@import "~@mcdex/style/common/fantasy-var";

.satori-fantasy {
   .logo-box{
      .beta {
        background-color: rgba($--mc-color-primary, 0.1);
        border: 1px solid rgba($--mc-color-primary, 0.1);
        color: $--mc-color-primary;
      }
  }
}
</style>
