<template>
  <div class="trade-container">
    <div class="trade">
      <PerpetualStatistics class="statistics"/>
      <div class="content">
        <router-view v-bind="$props"></router-view>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import PerpetualStatistics from './PerpetualStatistics.vue'
import { ErrorHandlerMixin, PageRouteMixinFactory, SelectedPerpetualMixin } from '@/mixins'
import { Route } from 'vue-router'
import { CHAIN_ID_SYMBOL_SERVICE_ADDRESS, SymbolServiceFactory, _1 } from '@mcdex/mai3.js'
import { SITE_DEFAULT_TITLE, TARGET_NETWORK_ID } from '@/const'
import { BigNumber } from 'ethers'
import store from '@/store'
import { promiseTimeout } from '@/utils'

const perpetual = namespace('perpetual')

const routeValidator = async (to: Route) => {
  if (store.getters['routePassed'](to.params.symbol)) {
    return
  }
  const provider = store.getters['wallet/provider']
  const symbolServiceContract = SymbolServiceFactory.connect(CHAIN_ID_SYMBOL_SERVICE_ADDRESS[TARGET_NETWORK_ID], provider)
  try {
    await promiseTimeout(symbolServiceContract.getPerpetualUID(BigNumber.from(to.params.symbol)), 10000)
    store.commit('setRouteValidatorPassport', to.params.symbol)
  } catch (e) {
    if (e.message.includes('symbol not found')) {
      throw e
    }
  }
}

@Component({
  components: {
    PerpetualStatistics,
  },
})
export default class Trade extends Mixins(SelectedPerpetualMixin, PageRouteMixinFactory(routeValidator), ErrorHandlerMixin) {

  mounted() {
    this.updateSiteTradeTitle()
  }

  destroyed() {
    this.defaultSiteTitle()
  }

  defaultSiteTitle() {
    document.title = SITE_DEFAULT_TITLE
  }

  @Watch('selectedPerpetualID', { immediate: true })
  @Watch('selectedPerpetual', { immediate: true })
  @Watch('selectedPerpetualIndexPrice', { immediate: true })
  updateSiteTradeTitle() {
    if (!this.selectedPerpetual) {
      this.defaultSiteTitle()
      return
    }
    const underlyingSymbol = this.selectedPerpetual.perpetualStorage.underlyingSymbol
    const collateralSymbol = this.selectedPerpetual.perpetualProperty.collateralTokenSymbol
    const symbolStr = this.selectedPerpetual.perpetualProperty.symbolStr

    let indexPrice = this.selectedPerpetualIndexPrice
    if (indexPrice && this.selectedPerpetual.perpetualProperty.isInverse) {
      indexPrice = _1.div(indexPrice)
    }
    let price = indexPrice?.toFixed(
      this.selectedPerpetual.perpetualProperty.priceFormatDecimals) || ''
    let contractName = `${underlyingSymbol}${collateralSymbol} ${symbolStr}`
    document.title = `${price} ${price? '|' : ''} ${contractName} | ${SITE_DEFAULT_TITLE}`
  }
}
</script>

<style lang="scss" scoped>
.trade-container {

  .trade {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;

    .statistics {
      width: 100%;
    }

    .content {
      display: flex;
      flex: 1;
      width: 100%;

      .main {
        flex: auto;

        .grid-container {
          height: 100%;

          .vue-grid-layout {
            height: 100%;
          }
        }

        .margin-account {
          margin: 8px 8px 0;
        }
      }
    }
  }
}
</style>
