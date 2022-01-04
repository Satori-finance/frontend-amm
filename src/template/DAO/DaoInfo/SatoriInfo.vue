<template>
  <div class="mcb-info">
    <div class="panel-item-header">
      <div class="title">{{ $t('dao.satoriInfo') }}</div>
      <div class="mcb-contract">
        <div class="label">Contract:</div>
        <div class="value link">
          <a :href="SATORI_ADDRESS | etherBrowserAddressFormatter" target="_blank">
            {{ SATORI_ADDRESS | ellipsisMiddle }}
          </a>
        </div>
        <McCopy :content="SATORI_ADDRESS" />
      </div>
      <div v-if="walletType && (walletType === this.supplyWalletType.MetaMask)" class="button-box">
        <el-button class="button add-mcb" @click="addSATORITokenToWallet">
          <i class="iconfont icon-add-mcb" ></i>
          <svg class="svg-icon" aria-hidden="true">
            <use :xlink:href="`#icon-${walletIcon}`"></use>
          </svg>
        </el-button>
      </div>
    </div>
    <div class="card-container">
      <div class="card-item-box left">
        <div class="bg">
          <img src="@/assets/img/dao-logo-bg.png"  alt=""/>
        </div>

        <div class="card-item">
          <div class="value price-info">
            <McLoadingIcon v-if="!price" :height="40"></McLoadingIcon>
            <template v-else>
              <div class="SATORI-price">${{ price | bigNumberFormatter(2) }}</div>
              <PNNumber
                v-if="satori24hChangeRate"
                :number="satori24hChangeRate"
                :showPlusSign="true"
                :decimals="2"
                suffix="% (24H)"
              />
            </template>
          </div>
          <div class="text">{{ $t('dao.currentSatoriPrice') }}</div>
        </div>
        <div class="logo">
          <img class="blurred-picture" src="@/assets/img/dao-logo.png"  alt=""/>
          <img class="clear-picture" src="@/assets/img/dao-logo.png"  alt=""/>
        </div>
      </div>
      <div class="card-item-box right">
        <div class="card-item flex-box">
          <div class="box-left">
            <div class="item-top">
              <div class="value">
                <McLoadingIcon v-if="currentTotalSupplyLoading"></McLoadingIcon>
                <div v-else>{{ circulatingSupply | bigNumberFormatter(0) }}</div>
                <img class="token-img" src="@/assets/img/tokens/SATORI.svg"  alt=""/>
              </div>
              <div class="text">{{ $t('dao.circulatingSupply') }}</div>
            </div>
            <div class="item-bottom">
              <div class="value">
                <div>{{ maxSupplyCap | bigNumberFormatter(0) }}</div>
                <img class="token-img" src="@/assets/img/tokens/SATORI.svg"  alt=""/>
              </div>
              <div class="text">{{ $t('dao.maxSupplyCap') }}</div>
            </div>
          </div>
          <div class="chart">
            <McCircleProgress :percentage="percentage" :barSize="20" :size="124"/>
          </div>
        </div>

        <div class="card-item">
          <div class="item-top">
            <McLoadingIcon v-if="!marketCap"></McLoadingIcon>
            <div v-else class="value">${{ marketCap | bigNumberFormatter(0) }}</div>
            <div class="text">{{ $t('dao.marketCap') }}</div>
          </div>
          <div class="item-bottom">
            <McLoadingIcon v-if="!fullyDilutedValuation"></McLoadingIcon>
            <div v-else class="value">${{ fullyDilutedValuation | bigNumberFormatter(0) }}</div>
            <div class="text">{{ $t('dao.fullyDilutedValuation') }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import SATORIInfoMixin from '@/template/components/DAO/Info/SatoriInfoMixin'
import { addERC20TokenToWallet } from '@/utils/chain'
import { SATORI_TOKEN_INFO, SATORI_ADDRESS, SUPPORTED_NETWORK_ID } from '@/const'
import { SUPPORTED_WALLET } from '@/business-components/wallet/wallet-connector'
import { currentChainConfig } from '@/config/chain'
import { McCircleProgress, PNNumber, McCopy, McLoadingIcon } from '@/components'

@Component({
  components: {
    McCircleProgress,
    PNNumber,
    McCopy,
    McLoadingIcon,
  },
})
export default class SATORIInfo extends Mixins(SATORIInfoMixin) {
  private SATORI_ADDRESS: string = SATORI_ADDRESS
  private ARB_NETWORK_ID = SUPPORTED_NETWORK_ID.ARB

  supplyWalletType = SUPPORTED_WALLET

  get currentChainConfig() {
    return currentChainConfig
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

  get isArbOneNetwork(): boolean {
    return ['ARB'].includes(currentChainConfig.chainSymbol)
  }

  async addSATORITokenToWallet() {
    if (!this.walletType) {
      return
    }
    try {
      await addERC20TokenToWallet(
        this.walletType,
        SATORI_ADDRESS,
        SATORI_TOKEN_INFO.symbol,
        SATORI_TOKEN_INFO.decimals,
        SATORI_TOKEN_INFO.image
      )
    } catch (e) {
      console.warn(e)
    }
  }
}
</script>

<style scoped lang="scss">
@import "./info.scss";
.mcb-info {
  .panel-item-header {
    display: flex;
    justify-content: left;
    align-items: center;

    .mcb-contract {
      width: 209px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-left: 24px;
      padding-right: 16px;

      .label {
        font-size: 16px;
        line-height: 24px;
        color: var(--mc-border-color-light);
      }
    }

    .button-box {
      height: 16px;
      padding-left: 16px;
      border-left: 1px solid var(--mc-border-color);
      display: flex;
      align-items: center;

      .add-mcb {
        width: 64px;
        height: 30px;
        border-radius: 12px;
        background: var(--mc-background-color);
        font-size: 16px;
        padding: 0 12px;

        &:hover {
          background: var(--mc-background-color-light);
        }

        ::v-deep span {
          display: flex;
          align-items: center;
        }

        .icon-add-mcb {
          font-size: 12px;
          color: #C4C4C4;
          margin-right: 8px;
        }
      }
    }
  }

  .card-container {
    width: 792px;

    .card-item-box {
      width: 364px;
      height: 100%;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;

      .box-left {
        width: 164px;
      }

      .chart {
        margin: 3px 3px 1.5px 1px;
      }

      .price-info {
        font-size: 16px;
        line-height: 24px;
        display: flex;
        align-items: flex-end;

        .SATORI-price {
          font-size: 32px;
          line-height: 40px;
          font-weight: 700;
          margin-right: 8px;
        }
      }
    }

    .left {
      z-index: 0;

      .bg {
        position: absolute;
        width: 230px;
        height: 120px;
        left: 0;
        top: -60px;
        filter: blur(70px);
        z-index: -1;

        img {
          width: 230px;
          height: 120px;
        }
      }

      .card-item {
        background-color: transparent;
      }

      .logo {
        position: relative;

        .blurred-picture {
          position: absolute;
          bottom: 8px;
          right: 24px;
          opacity: 0.4;
          filter: blur(20px);
        }

        .clear-picture {
          position: absolute;
          bottom: 24px;
          right: 24px;
        }
      }
    }

    .right {
      .flex-box {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    }
  }
}
</style>

<style scoped lang="scss">
.satori-fantasy {
  .mcb-info {
    .left {
      background-color: var(--mc-background-color-dark);
    }
  }
}

</style>
