<template>
  <div class="pool-adapter">
    <BaseCardFrame>
      <template slot="title">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ name: 'poolList' }">{{ $t('base.pool') }}</el-breadcrumb-item>
          <el-breadcrumb-item
            :to="{ name: 'poolInfo' }"
            v-if="selectedPageTypeOption !== 'info' || isPerpetualInfo || isPoolGovernance"
          >
            {{ titlePoolAddress }} ({{ poolBaseInfo ? poolBaseInfo.collateralSymbol : '' }})
          </el-breadcrumb-item>
          <el-breadcrumb-item v-if="selectedPageTypeOption === 'info' && !isPerpetualInfo && !isPoolGovernance">
            {{ titlePoolAddress }} ({{ poolBaseInfo ? poolBaseInfo.collateralSymbol : '' }})
          </el-breadcrumb-item>
          <el-breadcrumb-item v-if="isPerpetualInfo">{{ perpetualSymbol }}</el-breadcrumb-item>
          <el-breadcrumb-item v-if="isPoolGovernance">{{ $t('governance.proposal') }}</el-breadcrumb-item>
        </el-breadcrumb>
      </template>
      <template slot="title-center" v-if="!isPerpetualInfo && !isPoolGovernance">
        <McTabs v-model="selectedPageTypeOption" :tabs="pageTypeOption" v-if="!poolLoading"></McTabs>
      </template>
      <template slot="title-suffix">
        <div v-if="isPerpetualInfo">
          <el-button size="mini" round @click="toTradePage">{{ $t('trade') }}</el-button>
        </div>
      </template>
      <template slot="content">
        <McLoading
          class="base-loading"
          :show-loading="poolLoading"
          :maskColor="'transparent'"
          :hide-content="true"
          :min-show-time="0"
        >
          <router-view v-bind="{ poolBaseInfo, liquidityPool, liquidityAccount, _poolAddress: poolAddress }"></router-view>
        </McLoading>
      </template>
    </BaseCardFrame>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import { BaseCardFrame, McTabs, McLoading } from '@/components'
import { PoolMixins } from '@/template/components/Pool/poolMixins'
import { ellipsisMiddle, promiseTimeout } from '@/utils'
import { ROUTE } from '@/router'
import { GLOBAL_NOTIFICATION_EVENT, VUE_EVENT_BUS } from '@/event'
import { NOTIFICATION_KEY } from '@/type'
import { PageRouteMixinFactory } from '@/mixins'
import { Route } from 'vue-router'
import store from '@/store'
import {
  CHAIN_ID_TO_POOL_CREATOR_ADDRESS,
  PoolCreatorFactory,
} from '@mcdex/mai3.js'
import { TARGET_NETWORK_ID } from '@/constants'

const routeValidator = async (to: Route) => {
  if (store.getters['routePassed'](to.params.poolAddress)) {
    return
  }
  const provider = store.getters['wallet/provider']
  const poolCreator = PoolCreatorFactory.connect(CHAIN_ID_TO_POOL_CREATOR_ADDRESS[TARGET_NETWORK_ID], provider)
  let isPool
  try {
    isPool = await promiseTimeout(poolCreator.isLiquidityPool(to.params.poolAddress), 5000)
  } catch (e) {
    return
  }
  if (!isPool) {
    throw Error(`${to.params.poolAddress} is not pool`)
  }
  store.commit('setRouteValidatorPassport', to.params.poolAddress)
}

@Component({
  components: {
    BaseCardFrame,
    McTabs,
    McLoading,
  },
})
export default class PoolAdapter extends Mixins(PoolMixins, PageRouteMixinFactory(routeValidator)) {
  private selectedPageTypeOption: 'info' | 'liquidity' | 'mining' = 'info'
  private isPerpetualInfo: boolean = false
  private isPoolGovernance: boolean = false

  get routerName(): string {
    return this.$route?.name || ''
  }

  get pageTypeOption(): Array<{ label: string, value: 'info' | 'liquidity' | 'mining', link: any }> {
    return [
      { label: this.$t('pool.info').toString(), value: 'info', link: 'info' },
      { label: this.$t('pool.liquidity').toString(), value: 'liquidity', link: 'liquidity' },
    ]
  }

  get titlePoolAddress(): string {
    return ellipsisMiddle(this.poolAddress, 6, 4)
  }

  @Watch('$route', { immediate: true, deep: true })
  async onRouterChange() {
    this.poolAddress = this.$route.params?.poolAddress || ''
    this.perpetualSymbol = this.$route.params?.symbol || ''
  }

  @Watch('routerName', { immediate: true })
  onRouterChanged() {
    if (this.$route.meta && this.$route.meta['tabName']) this.selectedPageTypeOption = this.$route.meta['tabName']
    if (this.$route.meta && this.$route.meta['isPerpetualInfo']) {
      this.isPerpetualInfo = this.$route.meta['isPerpetualInfo']
    } else {
      this.isPerpetualInfo = false
    }
    if (this.$route.meta && this.$route.meta['isPoolGovernance']) {
      this.isPoolGovernance = this.$route.meta['isPoolGovernance']
    } else {
      this.isPoolGovernance = false
    }
  }

  toPoolListPage() {
    this.$router.push({ name: 'pool' })
  }

  toTradePage() {
    this.$router.push({ name: ROUTE.TRADE_MAIN, params: { symbol: this.perpetualSymbol as string } })
  }

  @Watch('poolAddress', { immediate: true })
  async onPoolAddressChanged() {
    if (!this.provider || this.poolAddress === '') {
      return
    }
    const isPoolAddress = await this.checkIsLiquidityPool(this.poolAddress)
    if (!isPoolAddress) {
      this.$router.push({ name: ROUTE.POOL })
    }
  }

  @Watch('poolIsRunning', { immediate: true })
  handleRunState() {
    if (this.poolIsRunning) {
      VUE_EVENT_BUS.emit(GLOBAL_NOTIFICATION_EVENT.HIDE, 'warn', NOTIFICATION_KEY.PoolNotRunWarn)
    } else {
      VUE_EVENT_BUS.emit(GLOBAL_NOTIFICATION_EVENT.SHOW, {
        type: 'warn',
        key: NOTIFICATION_KEY.PoolNotRunWarn,
        i18nKey: 'globalNotification.poolNotRunPrompt',
      })
    }
  }

  destroyed() {
    VUE_EVENT_BUS.emit(GLOBAL_NOTIFICATION_EVENT.HIDE, 'warn', NOTIFICATION_KEY.PoolNotRunWarn)
  }
}
</script>

<style scoped lang="scss">
.pool-adapter {
  height: 100%;
  max-width: 1440px;
  width: 1440px;
  margin: auto;
  display: flex;
  flex-direction: column;

  .base-card-frame {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  ::v-deep .base-card-frame {
    .head {
      .title {
        .el-breadcrumb__inner {
          color: var(--mc-text-color);
          font-weight: 400 !important;
          cursor: pointer;
        }
      }

      .title-center {
        width: 28%;
        margin-left: -12%;
      }

      .title-suffix {
        .el-button--mini {
          width: 80px;
        }
      }
    }

    .content {
      padding: 30px;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: stretch;

      .base-loading {
        flex: 1;
      }
    }
  }
}
</style>
