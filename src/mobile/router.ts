import Vue from 'vue'
import VueRouter, { RawLocation, Route, RouteConfig } from 'vue-router'
import * as _ from 'lodash'
import { getLocalStorage } from '@/utils'
import { PERP_SYMBOL_KEY, TARGET_NETWORK_ID } from '@/constants'
import { PERPETUAL_EVENT, VUE_EVENT_BUS } from '@/event'

Vue.use(VueRouter)

// fixed duplicate route error
const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(location: RawLocation) {
  return originalPush.call<VueRouter, RawLocation[], Promise<Route>>(this, location).catch(err => err)
}

export enum ROUTE {
  LIQUIDITY = 'liquidity',
  UNISWAP_STAKE = 'uniswapStake',
  SATORI_STAKE = 'mcbStake',
  TRADE = 'trade',
  TRADE_MAIN = 'tradeMain',
  TRADE_MAIN_ADAPTER = 'tradeMainAdapter',
  HOME = 'home',
  TRADE_HISTORY = 'tradeHistory',
  TRADE_CHART_INFO = 'tradeChartInfo',
  PERPETUAL_INFO = 'perpetualInfo',
  CANCEL_DETAIL = 'cancelDetail',
  MINING = 'farm',
  // SATORI_SALE = 'mcbsale',
  TRANSACTION_MINING = 'transactionMining',
  TRADING_MINING_HISTORY = 'tradingMiningHistory',
  POOL_LIST = 'poolList',
  DAO = 'dao',
  POOL_INFO = 'poolInfo',
  LANGUAGE = 'language',
  CLAIM = 'claim',
  REFERRER = 'referrer',
}

const routes: RouteConfig[] = [
  {
    path: '/',
    redirect: '/trade',
  },
  {
    name: ROUTE.TRADE,
    path: '/trade',
    component: () => import(/* webpackChunkName: "trade" */ '@/mobile/template/Trade/Trade.vue'),
    redirect: { name: ROUTE.TRADE_MAIN },
    children: [
      {
        name: ROUTE.TRADE_HISTORY,
        path: 'history',
        component: () => import(/* webpackChunkName: "tradeHistory" */ '@/mobile/template/Trade/History/History.vue'),
        meta: {
          showTabbar: false,
          theme: 'satori-fantasy',
        },
      },
      {
        name: ROUTE.TRADE_MAIN_ADAPTER,
        path: ':symbol?',
        component: () => import(/* webpackChunkName: "trade" */ '@/mobile/template/Trade/TradeMainAdapter.vue'),
        redirect: { name: ROUTE.TRADE_MAIN },
        children: [
          {
            name: ROUTE.TRADE_MAIN,
            path: '',
            component: () => import(/* webpackChunkName: "trade" */ '@/mobile/template/Trade/TradeMain.vue'),
            meta: {
              targetNetwork: 'L2',
              theme: 'satori-fantasy',
            },
          },
          {
            name: ROUTE.TRADE_CHART_INFO,
            path: 'chart',
            component: () => import(/* webpackChunkName: "trade" */ '@/mobile/template/Trade/PriceChartInfo/PerpetualChartInfo.vue'),
            meta: {
              theme: 'satori-fantasy',
            }
          },
          {
            name: ROUTE.PERPETUAL_INFO,
            path: 'info',
            meta: {
              theme: 'satori-fantasy',
            },
            component: () => import(/* webpackChunkName: "trade" */ '@/mobile/template/Trade/PerpetualInfo.vue'),
          },
        ]
      },

    ],
  },
  {
    name: ROUTE.CANCEL_DETAIL,
    path: '/cancel-detail',
    component: () => import(/* webpackChunkName: "cancelDetail" */ '@/mobile/template/Trade/History/CancelDetail.vue'),
    props: route => ({ orderItem: route.params.orderItem })
  },
  {
    name: ROUTE.LANGUAGE,
    path: '/language',
    component: () => import(/* webpackChunkName: "language" */ '@/mobile/components/SwitchLanguage.vue'),
    meta: {
      targetNetwork: 'none',
    },
  },
  {
    name: ROUTE.CLAIM,
    path: '/claim',
    component: () => import(/* webpackChunkName: "claim" */ '@/mobile/components/Claim.vue'),
    meta: {
      targetNetwork: 'L2',
      theme: 'satori-fantasy',
    },
  },
  {
    name: 'miningMain',
    path: '/farm',
    component: () => import(/* webpackChunkName: "mining" */ '@/mobile/template/Mining/MiningMain.vue'),
    children: [
      {
        name: ROUTE.MINING,
        path: '',
        component: () => import(/* webpackChunkName: "mining" */ '@/mobile/template/Mining/MiningList.vue'),
        meta: {
          showTabbar: true,
          theme: 'satori-fantasy',
        },
      },
      {
        name: ROUTE.TRANSACTION_MINING,
        path: 'transaction',
        component: () => import(/* webpackChunkName: "mining" */ '@/mobile/template/Mining/TransactionMiningDetail.vue'),
        meta: {
          showTabbar: false,
        },
      },
      {
        name: ROUTE.TRADING_MINING_HISTORY,
        path: 'tradingMiningHistory',
        component: () => import(/* webpackChunkName: "mining" */ '@/mobile/template/Mining/TradingMiningHistory.vue'),
        meta: {
          showTabbar: false,
          theme: 'satori-fantasy',
        },
      }
    ]
  },
  {
    name: 'pool',
    path: '/pool',
    component: () => import(/* webpackChunkName: "pool" */ '@/mobile/template/Pool/PoolMain.vue'),
    children: [
      {
        name: ROUTE.UNISWAP_STAKE,
        path: 'uniswap/:pairAddress/stake',
        component: () => import(/* webpackChunkName: "pool" */ '@/mobile/template/Pool/UniswapStake.vue'),
      },
      {
        name: ROUTE.POOL_LIST,
        path: 'list',
        component: () => import(/* webpackChunkName: "pool" */ '@/mobile/template/Pool/PoolList.vue'),
        meta: {
          theme: 'satori-fantasy',
        },
      },
      {
        name: 'poolAdapter',
        path: ':poolAddress',
        component: () => import(/* webpackChunkName: "pool" */ '@/mobile/template/Pool/PoolAdapter.vue'),
        meta: {
          theme: 'satori-fantasy',
        },
        children: [
          {
            name: ROUTE.POOL_INFO,
            path: 'info',
            component: () => import(/* webpackChunkName: "pool" */ '@/mobile/template/Pool/PoolInfo/PoolInfo.vue'),
          },
          {
            name: ROUTE.LIQUIDITY,
            path: 'liquidity',
            component: () => import(/* webpackChunkName: "pool" */ '@/mobile/template/Pool/Liquidity.vue'),
          },
        ],
      },
    ],
  },
  {
    name: ROUTE.HOME,
    path: '/stats',
    component: () => import(/* webpackChunkName: "stats" */ '@/mobile/template/Home/Home.vue'),
    meta: {
      showTabbar: true,
      targetNetwork: 'none',
      theme: 'satori-fantasy',
    },
  },
  {
    name: ROUTE.DAO,
    path: '/dao',
    component: () => import(/* webpackChunkName: "noprefetch-dao" */ '@/mobile/template/DAO/DaoAdapter.vue'),
    redirect: { name: 'daoMainInfo' },
    children: [
      {
        name: 'daoMainInfo',
        path: '',
        component: () => import(/* webpackChunkName: "noprefetch-dao" */ '@/mobile/template/DAO/DaoMainInfo.vue'),
        meta: {
          theme: 'satori-fantasy',
        },
      },
      {
        name: 'daoVaultAsset',
        path: 'vault',
        component: () => import(/* webpackChunkName: "noprefetch-dao" */ '@/mobile/template/DAO/Info/VaultAssetDetails.vue'),
      },
      // {
      //   name: 'daoProposalVote',
      //   path: 'proposal/:index',
      //   component: () => import(/* webpackChunkName: "noprefetch-dao" */ '@/mobile/template/DAO/Governance/ProposalVote.vue'),
      // },
      {
        name: ROUTE.SATORI_STAKE,
        path: 'mcb/stake',
        component: () => import(/* webpackChunkName: "noprefetch-dao" */ '@/mobile/template/DAO/DAOSATORIStaking.vue'),
      },
    ],
  },
  // {
  //   name: ROUTE.SATORI_SALE,
  //   path: '/mcbsale',
  //   component: () => import(/* webpackChunkName: "mcbsale" */ '@/mobile/template/SATORISale/SATORISale.vue'),
  //   meta: {
  //     showTabbar: false,
  //   },
  // },
  {
    name: ROUTE.REFERRER,
    path: '/r',
    meta: {
      theme: 'satori-fantasy',
    },
    component: () => import(/* webpackChunkName: "referrer" */ '@/template/Referrer/ReferrerMain.vue'),
  },
  {
    path: '*',
    redirect: (to: any) => {
      if (to.path.match(/^\/data/)) {
        return ''
      }
      return '/'
    },
  },
]

const router = new VueRouter({
  mode: 'history',
  routes,
  scrollBehavior() {
    return { x: 0, y: 0 }
  },
})

router.beforeEach((to, from, next) => {
  if (_.trim(to.path, '/') === _.trim(from.path, '/')) {
    return
  }
  switch (to.name) {
    case ROUTE.TRADE_MAIN || ROUTE.TRADE_CHART_INFO || ROUTE.PERPETUAL_INFO || ROUTE.TRADE_MAIN_ADAPTER:
      const localSymbol = getLocalStorage(PERP_SYMBOL_KEY)
      if (!to.params.symbol && localSymbol) {
        next({ name: to.name, params: { symbol: localSymbol } })
        return
      }
      break
    default:
      break
  }
  if (!to.query.chainId) {
    next({ path: to.path, name: to.name || undefined, params: to.params, query: Object.assign({}, to.query, { chainId: TARGET_NETWORK_ID }) })
  } else {
    next()
  }
})

router.afterEach((to, from) => {
  let isMatchTradeAdapter: boolean = false
  for (let i = 0; i < to.matched.length; i++) {
    if (to.matched[i].name === ROUTE.TRADE_MAIN_ADAPTER) {
      isMatchTradeAdapter = true
      break
    }
  }
  if (isMatchTradeAdapter && from.params.symbol !== to.params.symbol) {
    VUE_EVENT_BUS.emit(PERPETUAL_EVENT.PERPETUAL_CHANGE, to.params.symbol)
  }
})

export default router
