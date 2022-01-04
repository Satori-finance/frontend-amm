<template>
  <div class="chain-viewer">
    <el-popover
      placement="bottom-start"
      trigger="click"
      popper-class="chain-viewer-popover fantasy"
      v-model="popoverStatus"
      :visible-arrow="false"
      :disabled="popoverDisabled"
    >
      <div class="chain-tools-box popover-content">
        <div v-if="!showBridge" class="network-options">
          <div class="title">{{ $t('base.selectNetwork') }}</div>
          <div class="network-item" v-for="item in networkOptions" :class="{selected: item.chainId === walletNetworkId}"
               :key="item.chainId"
               @click="changeNetwork(item.chainId)">
            <div class="network-icon">
              <img :src="item.icon" alt="">
            </div>
            {{ item.name }}
          </div>
        </div>

        <template v-if="arbChain">
          <template v-if="!showBridge">
            <span class="link-item action-item" @click="showBridge = true">
              <span class="name">{{ $t('chainViewer.arbitrumTokenBridge') }}</span>
              <span><i class="iconfont icon-right2"></i></span>
            </span>
            <a target="_blank" :href="arbExplorer" class="link-item">
              <span class="name">{{ $t('chainViewer.arbitrumExplorer') }}</span>
              <span><i class="iconfont icon-view-bold"></i></span>
            </a>
          </template>
          <template v-else>
            <span class="link-item action-item back" @click="showBridge = false">
              <span class="name"><i class="iconfont icon-left2"></i>{{ $t('chainViewer.arbitrumTokenBridge') }}</span>
            </span>
            <a target="_blank" href="https://bridge.arbitrum.io/" class="link-item">
              <span class="name">{{ $t('chainViewer.arbitrumOfficialBridge') }}</span>
              <span><i class="iconfont icon-view-bold"></i></span>
            </a>
            <a target="_blank" href="https://cbridge.celer.network/" class="link-item">
              <span class="name">{{ $t('chainViewer.cBridge') }}</span>
              <span><i class="iconfont icon-view-bold"></i></span>
            </a>
          </template>
        </template>
        <template v-else-if="optChain">
          <a target="_blank" href="https://gateway.optimism.io/" class="link-item">
            <span class="name">{{ $t('chainViewer.optimismTokenBridge') }}</span>
            <span><i class="iconfont icon-view-bold"></i></span>
          </a>
          <a target="_blank" :href="optExplorer" class="link-item">
            <span class="name">{{ $t('chainViewer.optimismExplorer') }}</span>
            <span><i class="iconfont icon-view-bold"></i></span>
          </a>
        </template>
        <template v-else-if="bscChain">
          <template v-if="!showBridge">
            <span class="link-item action-item" @click="showBridge = true">
              <span class="name">{{ $t('chainViewer.bscTokenBridge') }}</span>
              <span><i class="iconfont icon-right2"></i></span>
            </span>
            <a target="_blank" href="https://www.bscscan.com/" class="link-item">
              <span class="name">{{ $t('chainViewer.bscExplorer') }}</span>
              <span><i class="iconfont icon-view-bold"></i></span>
            </a>
          </template>
          <template v-else>
            <span class="link-item action-item back" @click="showBridge = false">
              <span class="name"><i class="iconfont icon-left2"></i>{{ $t('chainViewer.bscTokenBridge') }}</span>
            </span>
            <a target="_blank" href="https://www.binance.org/en/bridge" class="link-item">
              <span class="name">{{ $t('chainViewer.bscTokenBridge') }}</span>
              <span><i class="iconfont icon-view-bold"></i></span>
            </a>
            <a target="_blank" href="https://anyswap.exchange/" class="link-item">
              <span class="name">{{ $t('chainViewer.anyswap') }}</span>
              <span><i class="iconfont icon-view-bold"></i></span>
            </a>
          </template>
        </template>
      </div>
      <div class="chain-name-box" :class="{ 'cursor-pointer-item': !popoverDisabled, 'is-focus': popoverStatus }"
           slot="reference">
        <div class="chain-name-wrapper">
          <img :src="currentChainConfig.icon" alt=""/>
          {{ currentChainConfig.chainName }}
          <i class="iconfont icon-drop-down"/>
        </div>
      </div>
    </el-popover>
    <MobileSwitchChainWarnDialog
      :visible.sync="showSwitchWarningDialog"
      :target-chain-id="targetChainId"
      @changeChainFunc="changeNetwork"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { chainConfigs, currentChainConfig } from '@/config/chain'
import { NETWORK_ID_NAME, NETWORK_OPTIONS, SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/const'
import { namespace } from 'vuex-class'
import { connectChain } from '@/utils/chain'
import { SUPPORTED_WALLET, } from '@/business-components/wallet/wallet-connector'
import { Provider } from '@ethersproject/providers'
import MobileSwitchChainWarnDialog from '@/business-components/MobileSwitchChainWarnDialog.vue'

let wallet = namespace('wallet')

@Component({
  components: {
    MobileSwitchChainWarnDialog
  }
})
export default class ChainViewer extends Vue {
  @wallet.State('walletType') walletType!: SUPPORTED_WALLET
  @wallet.Getter('walletNetworkId') walletNetworkId!: any
  @wallet.Getter('isMobileWallet') isMobileWallet!: boolean
  @wallet.Getter('provider') provider!: Provider

  showSwitchWarningDialog: boolean = false

  TARGET_NETWORK_ID = TARGET_NETWORK_ID

  popoverStatus: boolean = false
  showBridge: boolean = false

  targetChainId: number = 0

  get popoverDisabled(): boolean {
    return !this.arbChain && !this.optChain && !this.bscChain && !this.cloverChain
  }

  get networkOptions() {
    return NETWORK_OPTIONS.map(item => {
      return {
        chainId: item,
        name: NETWORK_ID_NAME[item],
        icon: chainConfigs[item].icon,
      }
    })
  }

  get arbChain() {
    return currentChainConfig.chainID === SUPPORTED_NETWORK_ID.ARB || currentChainConfig.chainID === SUPPORTED_NETWORK_ID.ARB_TESTNET
  }

  get cloverChain() {
    return currentChainConfig.chainID === SUPPORTED_NETWORK_ID.CLOVER_TEST
  }

  get optChain() {
    return currentChainConfig.chainID === SUPPORTED_NETWORK_ID.OPTIMISM_TESTNET || currentChainConfig.chainID === SUPPORTED_NETWORK_ID.OPTIMISM
  }

  get bscChain() {
    return currentChainConfig.chainID === SUPPORTED_NETWORK_ID.BSC
  }

  get optExplorer() {
    return currentChainConfig.chainID === SUPPORTED_NETWORK_ID.OPTIMISM ? 'https://optimistic.etherscan.io/' : 'https://kovan-optimistic.etherscan.io/'
  }

  get arbExplorer() {
    return currentChainConfig.chainID === SUPPORTED_NETWORK_ID.ARB ? 'https://arbiscan.io/' : 'https://testnet.arbiscan.io/'
  }

  get isARBOne() {
    return currentChainConfig.chainID === SUPPORTED_NETWORK_ID.ARB
  }

  get currentChainConfig() {
    return currentChainConfig
  }

  async changeNetwork(chainId: number) {
    if (this.isMobileWallet && !this.showSwitchWarningDialog) {
      try {
        this.targetChainId = chainId
        const chainNetwork = await this.provider.getNetwork()
        if (chainNetwork.chainId !== chainId) {
          this.showSwitchWarningDialog = true
          return
        }
      } catch (e) {
        // ignore error
      }
    }
    await connectChain(chainId, this.walletType)
  }
}
</script>

<style lang="scss" scoped>
.chain-viewer {
  .cursor-pointer-item {
    cursor: pointer;
    border-radius: var(--mc-border-radius-l);
    padding: 1px;
  }

  .chain-name-wrapper {
    display: flex;
    align-items: center;
    border-radius: var(--mc-border-radius-l);
    padding: 7px 12px;
    color: var(--mc-text-color-white);
    font-size: 14px;
    line-height: 24px;

    img {
      width: 20px;
      height: 20px;
      margin-right: 8px;
    }

    .iconfont {
      margin-left: 8px;
    }
  }

  .icon-drop-down {
    font-size: 14px;
  }
}
</style>

<style scoped lang="scss">
.satori-fantasy .chain-viewer {
  .chain-name-box {
    background-color: var(--mc-background-color);

    &.cursor-pointer-item {
      &:hover {
        background-color: var(--mc-background-color-light);

        .chain-name-wrapper {
          background-color: var(--mc-background-color-light);
        }
      }

      &.is-focus {
        background: linear-gradient(90deg, #00D8E2 0%, #27A2F8 100%);
      }

      .chain-name-wrapper {
        background-color: var(--mc-background-color);
      }
    }
  }
}
</style>

<style lang="scss">
@import "~@mcdex/style/element-fantasy/common/var";

.satori-fantasy .chain-viewer-popover.el-popper[x-placement^='bottom'] {
  margin-top: 10px;
}

.chain-viewer-popover {
  background: var(--mc-background-color);
  border-radius: 12px;
  padding: 16px;

  .chain-tools-box {
    padding: 16px;
  }

  .link-item {
    cursor: pointer;
    width: 240px;
    height: 20px;
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: rgba($--mc-text-color-white, 0.75);
    margin-top: 16px;
    align-items: center;

    &:first-child {
      margin-top: 0;
    }

    .iconfont {
      font-size: 17px;
      color: rgba($--mc-text-color-white, 0.5);

      &:hover {
        color: rgba($--mc-text-color-white, 0.75);
      }
    }

    &:hover {
      color: var(--mc-text-color-white);
    }
  }

  .action-item {
    &:hover .iconfont {
      color: rgba($--mc-text-color-white, 0.75);
    }

    &.back .name {
      display: flex;
      align-items: center;

      .iconfont {
        margin-right: 8px;
      }
    }
  }

  .network-options {
    border-bottom: 1px solid #1A2136;
    font-size: 14px;
    line-height: 20px;
    padding-bottom: 16px;

    .title {
      color: var(--mc-text-color);
    }

    .network-item {
      margin-top: 8px;
      height: 40px;
      display: flex;
      align-items: center;
      padding: 8px 12px;
      color: var(--mc-text-color-white);
      cursor: pointer;

      .network-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        height: 24px;
        width: 24px;
        margin-right: 8px;

        img {
          height: 20px;
          width: 20px;
        }
      }

      &.selected, &:hover {
        background: var(--mc-background-color);
        border-radius: var(--mc-border-radius-l);
      }

      &.selected {
        cursor: auto;
        pointer-events: none;

        .network-icon:after {
          content: ' ';
          position: absolute;
          bottom: -2px;
          right: -2px;
          height: 8px;
          width: 8px;
          border: 2px solid var(--mc-border-color);
          background: var(--mc-color-success);
          border-radius: 50%;
        }
      }
    }
  }
}
</style>
