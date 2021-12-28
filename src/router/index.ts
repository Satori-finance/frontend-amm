import Vue from 'vue'
import VueRouter, { RawLocation, Route, RouteConfig } from 'vue-router'
import { PERPETUAL_EVENT, VUE_EVENT_BUS } from '@/event'
import * as _ from 'lodash'
import { getLocalStorage } from '@/utils'
import { DEFAULT_SYMBOL, PERP_SYMBOL_KEY, TARGET_NETWORK_ID } from '@/constants'
import store from '@/store'

Vue.use(VueRouter)

// fixed duplicate route error
const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(location: RawLocation) {
  return originalPush.call<VueRouter, RawLocation[], Promise<Route>>(this, location).catch(err => err)
}

export enum ROUTE {
  TRADE = 'trade',
  TRADE_MAIN = 'tradeMain',
  POOL = 'pool',
  POOL_INFO = 'poolInfo',
  PERPETUAL_INFO = 'poolPerpetualInfo',
  WALLET = 'account',
  DAO = 'dao',
  HOME = 'stats',
  REFERRER = 'referrer',
  // SATORI_SALE = 'mcbSale',
  MINING_MAIN = 'miningMain',
  MINING = 'farm',
  TRANSACTION_MINING = 'miningTransaction',
  BRIDGE = 'bridge',
  BRIDGE_INBOX = 'bridgeInbox',
  POOL_LIQUIDITY = 'poolLiquidity'
}

const routes: RouteConfig[] = [
  {
    path: '/',
    redirect: '/trade',
  },
  {
    path: '/404',
    meta: {
      theme: 'satori-fantasy',
    },
    component: () => import(/* webpackChunkName: "404" */ '@/template/404.vue'),
  },
  {
    name: ROUTE.HOME,
    path: '/stats',
    component: () => import(/* webpackChunkName: "stats" */ '@/template/Home/Home.vue'),
    meta: {
      targetNetwork: 'none',
      theme: 'satori-fantasy',
    },
  },
  {
    name: ROUTE.TRADE,
    path: '/trade/:symbol?',
    component: () => import(/* webpackChunkName: "trade" */ '@/template/Trade/Trade.vue'),
    children: [
      {
        name: ROUTE.TRADE_MAIN,
        path: '',
        component: () => import(/* webpackChunkName: "trade" */ '@/template/Trade/TradeMain.vue'),
      },
    ],
    meta: {
      targetNetwork: 'L2',
      theme: 'satori-fantasy',
    },
  },
  {
    name: ROUTE.MINING_MAIN,
    path: '/farm',
    component: () => import(/* webpackChunkName: "mining" */ '@/template/Mining/MiningMain.vue'),
    children: [
      {
        name: ROUTE.MINING,
        path: '',
        component: () => import(/* webpackChunkName: "mining" */ '@/template/Mining/MiningSummary.vue'),
        meta: {
          theme: 'satori-fantasy',
        },
      },
      {
        name: ROUTE.TRANSACTION_MINING,
        path: 'transaction',
        component: () => import(/* webpackChunkName: "mining" */ '@/template/Mining/TransactionMiningDetail.vue'),
      },
    ],
  },
  {
    name: ROUTE.POOL,
    path: '/pool',
    redirect: { name: 'poolList' },
    component: () => import(/* webpackChunkName: "pool" */ '@/template/Pool/PoolMain.vue'),
    children: [
      {
        name: 'poolList',
        path: '',
        component: () => import(/* webpackChunkName: "pool" */ '@/template/Pool/PoolList.vue'),
        meta: {
          theme: 'satori-fantasy',
        },
      },
      {
        name: 'poolCreate',
        path: 'create',
        meta: {
          theme: 'satori-fantasy',
        },
        component: () => import(/* webpackChunkName: "pool" */ '@/template/Pool/CreatePerpetual/CreatePerpetual.vue'),
      },
      // {
      //   name: 'poolLiquidation',
      //   path: 'liquidation',
      //   component: () => import(/* webpackChunkName: "pool" */ '@/template/Pool/Liquidation.vue'),
      // },
      {
        name: 'poolAdapter',
        path: ':poolAddress',
        component: () => import(/* webpackChunkName: "pool" */ '@/template/Pool/PoolAdapter.vue'),
        redirect: { name: ROUTE.POOL_INFO },
        meta: {
          theme: 'satori-fantasy',
        },
        children: [
          {
            name: ROUTE.POOL_INFO,
            path: 'info',
            component: () => import(/* webpackChunkName: "pool" */ '@/template/Pool/Info/PoolInfo/PoolInfoAdapter.vue'),
            meta: {
              tabName: 'info',
            },
          },
          {
            name: ROUTE.POOL_LIQUIDITY,
            path: 'liquidity',
            component: () => import(/* webpackChunkName: "pool" */ '@/template/Pool/Liquidity.vue'),
            meta: {
              tabName: 'liquidity',
            },
          },
          {
            name: ROUTE.PERPETUAL_INFO,
            path: ':symbol',
            component: () => import(/* webpackChunkName: "pool" */ '@/template/Pool/Info/PerpetualInfo/PerpetualInfoAdapter.vue'),
            meta: {
              isPerpetualInfo: true,
            },
          },
          {
            name: 'poolPerpetualInfoModify',
            path: ':symbol/modify',
            component: () => import(/* webpackChunkName: "pool" */ '@/template/Pool/Info/PerpetualInfo/ModifyRiskParams.vue'),
            meta: {
              isPerpetualInfo: true,
            },
          },
          {
            name: 'poolGovernance',
            path: 'proposal',
            component: () => import(/* webpackChunkName: "pool" */ '@/template/Pool/Governance/GovernanceMain.vue'),
            children: [
              {
                name: 'poolProposalCreate',
                path: 'create',
                component: () => import(/* webpackChunkName: "pool" */ '@/template/Pool/Governance/CreateProposal.vue'),
                meta: {
                  isPoolGovernance: true,
                },
              },
              {
                name: 'poolProposalVote',
                path: ':index',
                component: () => import(/* webpackChunkName: "pool" */ '@/template/Pool/Governance/ProposalVote.vue'),
                meta: {
                  isPoolGovernance: true,
                },
              },
            ],
          },
        ],
      },
    ],
  },
  // {
  //   name: ROUTE.SATORI_SALE,
  //   path: '/mcbsale',
  //   component: () => import(/* webpackChunkName: "mcbsale" */ '@/template/SATORISale/SATORISale.vue'),
  // },
  {
    name: ROUTE.WALLET,
    path: '/account',
    component: () => import(/* webpackChunkName: "wallet" */ '@/template/Wallet/WalletAdapter.vue'),
    meta: {
      theme: 'satori-fantasy',
      targetNetwork: 'all',
    },
  },
  {
    name: ROUTE.DAO,
    path: '/dao',
    redirect: { name: 'daoMain' },
    component: () => import(/* webpackChunkName: "noprefetch-dao" */ '@/template/DAO/DAOMain.vue'),
    children: [
      {
        name: 'daoMain',
        path: '',
        component: () => import(/* webpackChunkName: "noprefetch-dao" */ '@/template/DAO/DaoMainInfo.vue'),
        meta: {
          theme: 'satori-fantasy',
        },
      },
      // {
      //   name: 'daoProposal',
      //   path: 'proposal',
      //   redirect: { name: 'daoProposalList' },
      //   meta: {
      //     theme: 'satori-fantasy',
      //   },
      //   component: () => import(/* webpackChunkName: "noprefetch-dao" */ '@/template/DAO/Governance/GovernanceMain.vue'),
      //   children: [
      //     {
      //       name: 'daoProposalCreate',
      //       path: 'create',
      //       component: () => import(/* webpackChunkName: "noprefetch-dao" */ '@/template/DAO/Governance/CreateProposal.vue'),
      //     },
      //     {
      //       name: 'daoProposalVote',
      //       path: ':index',
      //       component: () => import(/* webpackChunkName: "noprefetch-dao" */ '@/template/DAO/Governance/ProposalVote.vue'),
      //     },
      //   ],
      // },
    ],
  },
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
  store.commit('setRouting', true)
  switch (to.name) {
    case ROUTE.TRADE_MAIN:
      const localSymbol = getLocalStorage(PERP_SYMBOL_KEY) || DEFAULT_SYMBOL
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
  store.commit('setRouting', false)
  switch (to.name) {
    case ROUTE.TRADE_MAIN:
      if (to.params.symbol) {
        VUE_EVENT_BUS.emit(PERPETUAL_EVENT.PERPETUAL_CHANGE, to.params.symbol)
      }
      break
    default:
      break
  }
})

export default router
