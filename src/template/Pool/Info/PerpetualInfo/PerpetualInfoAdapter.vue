<template>
  <div class="perpetual-info">
    <el-row :gutter="18">
      <el-col :span="10">
        <PerpetualInfo :perpetual-storage="perpetualStorage" :perpetual-property="perpetualProperty"
                       :pool-storage="poolStorage"/>
      </el-col>
      <el-col :span="14">
        <PerpetualChart :perpetual-storage="perpetualStorage" :perpetual-property="perpetualProperty"/>
      </el-col>
    </el-row>
    <el-row :gutter="18">
      <el-col :span="10">
        <PerpetualParams :perpetual-storage="perpetualStorage" :perpetual-property="perpetualProperty"
                         :pool-storage="poolStorage"/>
      </el-col>
      <el-col :span="14">
        <RiskParams :perpetual-property="perpetualProperty" :perpetual-storage="perpetualStorage"
                    :pool-storage="poolStorage"/>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="24">
        <PerpetualRecentTransaction :perpetual-property="perpetualProperty"/>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import PerpetualInfo from './PerpetualInfo.vue'
import PerpetualParams from './PerpetualParams.vue'
import PerpetualRiskParams from './PerpetualRiskParams.vue'
import PerpetualRecentTransaction from './PerpetualRecentTransaction.vue'
import PerpetualChart from './PerpetualChart.vue'
import { namespace } from 'vuex-class'
import { Directory, PerpetualCombinedState, PerpetualProperty } from '@/type'
import {
  CHAIN_ID_SYMBOL_SERVICE_ADDRESS,
  LiquidityPoolStorage,
  PerpetualStorage,
  SymbolServiceFactory,
} from '@mcdex/mai3.js'
import { PageRouteMixinFactory } from '@/mixins'
import { Route } from 'vue-router'
import store from '@/store'
import { TARGET_NETWORK_ID } from '@/const'
import { promiseTimeout } from '@/utils'

const perpetual = namespace('perpetual')

const routeValidator = async (to: Route) => {
  if (store.getters['routePassed'](`${to.params.poolAddress}-${to.params.symbol}`)) {
    return
  }
  const provider = store.getters['wallet/provider']
  const symbolServiceContract = SymbolServiceFactory.connect(CHAIN_ID_SYMBOL_SERVICE_ADDRESS[TARGET_NETWORK_ID], provider)
  let liquidityPoolAddress: string = ''
  try {
    const { liquidityPool } = await promiseTimeout(symbolServiceContract.getPerpetualUID(to.params.symbol), 5000)
    liquidityPoolAddress = liquidityPool
  } catch (e) {
    if (e.message.includes('symbol not found') || e.data?.message?.include('symbol not found')) {
      throw e
    }
  }
  if (!liquidityPoolAddress) {
    return
  } else if (liquidityPoolAddress.toLowerCase() !== to.params.poolAddress.toLowerCase()) {
    throw Error(`pool ${to.params.poolAddress} do not include ${to.params.symbol}`)
  }
  store.commit('setRouteValidatorPassport', `${to.params.poolAddress}-${to.params.symbol}`)
}

@Component({
  components: {
    PerpetualInfo,
    PerpetualParams,
    RiskParams: PerpetualRiskParams,
    PerpetualRecentTransaction,
    PerpetualChart,
  },
})
export default class PerpetualInfoAdapter extends Mixins(PageRouteMixinFactory(routeValidator)) {
  @perpetual.State('symbolToPerpetualID') symbolToPerpetualID!: Directory<string>
  @perpetual.Action('updateLiquidityPool') updateLiquidityPool!: (poolAddress: string) => Promise<void>
  @perpetual.Getter('getPerpetualFunc') getPerpetualFunc!: (perpetualID: string) => PerpetualCombinedState | null

  private symbol: string = ''
  private poolAddress: string = ''

  get perpetualID(): string | null {
    return this.symbolToPerpetualID.get(this.symbol) || null
  }

  get perpetual(): PerpetualCombinedState | null {
    if (!this.perpetualID) {
      return null
    }
    return this.getPerpetualFunc(this.perpetualID)
  }

  get perpetualStorage(): PerpetualStorage | null {
    return this.perpetual?.perpetualStorage || null
  }

  get perpetualProperty(): PerpetualProperty | null {
    return this.perpetual?.perpetualProperty || null
  }

  get poolStorage(): LiquidityPoolStorage | null {
    return this.perpetual?.liquidityPoolStorage || null
  }

  @Watch('poolAddress', { immediate: true })
  private onPoolAddressChange() {
    if (!this.poolAddress) {
      return
    }
    this.updateLiquidityPool(this.poolAddress)
  }

  @Watch('$route', { immediate: true })
  private onRouteChange() {
    this.poolAddress = this.$route.params.poolAddress
    this.symbol = this.$route.params.symbol
  }
}
</script>

<style scoped lang="scss">
.el-row {
  &:not(:first-of-type) {
    margin-top: 20px;
  }
}
</style>
