import { Module } from 'vuex'
import { getLocalStorage, setLocalStorage } from '@/utils'
import * as _ from 'lodash'
import { TilesItem, LAYOUT_TYPE, Layout, PreferenceState, LayoutBreakPointSetting, LAYOUT_ITEM } from '@/type/grid'

const gridRowHeight = 32
const gridMargin = 1
const staticsHeight = 70
const initialDefaultLayout: () => Layout = () => {
  return {
    isUseDefault: true,
    hiddenItems: [],
    tiles: [
      // work around: please leave the 'priceChart' at top. there is a bug with an unknown reason that
      //              makes the component refresh when maximum and lost our 'volume' chart
      {
        i: LAYOUT_ITEM.CHARTS,
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        minW: 0,
        isDraggable: true,
        isResizable: true,
        maximizable: true,
        moved: false,
      },
      {
        i: LAYOUT_ITEM.AMM_DEPTH,
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        minW: 360,
        isDraggable: true,
        isResizable: true,
        maximizable: false,
        moved: false,
      },
      {
        i: LAYOUT_ITEM.POSITIONS_AND_ORDERS,
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        minW: 0,
        isDraggable: true,
        isResizable: true,
        maximizable: false,
        moved: false,
      },
      {
        i: LAYOUT_ITEM.TRADE_PANEL,
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        minW: 0,
        isDraggable: true,
        isResizable: true,
        maximizable: false,
        moved: false,
      },
    ],
  }
}

//1024 1280 1366 1440 1680 1920 2560
const fitBuffer = 20
const fitWidthTable: { [key: string]: Array<LayoutBreakPointSetting> } = {
  [LAYOUT_ITEM.TRADE_PANEL]: [
    {
      breakPoint: 0,
      width: 5,
    },
    {
      breakPoint: 1920 - fitBuffer,
      width: 4,
    },
  ],
  [LAYOUT_ITEM.AMM_DEPTH]: [
    {
      breakPoint: 0,
      width: 6,
    },
    {
      breakPoint: 1920 - fitBuffer,
      width: 5,
    },
  ],
  [LAYOUT_ITEM.CHARTS]: [
    {
      breakPoint: 0,
      width: 13,
    },
    {
      breakPoint: 1920 - fitBuffer,
      width: 15,
    },
  ],
  [LAYOUT_ITEM.POSITIONS_AND_ORDERS]: [
    {
      breakPoint: 0,
      width: 19,
    },
    {
      breakPoint: 1920 - fitBuffer,
      width: 20,
    },
  ],
}
const fitHeightTable: { [key: string]: Array<LayoutBreakPointSetting> } = {
  [LAYOUT_ITEM.TRADE_PANEL]: [
    {
      breakPoint: 0,
      height: 22,
    }
  ],
  [LAYOUT_ITEM.AMM_DEPTH]: [
    {
      breakPoint: 0,
      height: 12,
    },
    {
      breakPoint: 900,
      height: 12,
    },
    {
      breakPoint: 1200,
      height: 13,
    },
    {
      breakPoint: 1300,
      height: 14,
    },
  ],
  [LAYOUT_ITEM.CHARTS]: [
    {
      breakPoint: 0,
      height: 12,
    }
  ],
  [LAYOUT_ITEM.POSITIONS_AND_ORDERS]: [
    {
      breakPoint: 0,
      height: 10,
    },
    {
      breakPoint: 900,
      height: 8,
    },
  ],
}

function calcWidth(width: number) {
  const result: { [key: string]: { x: number, w: number, minW: number } } = {}
  for (let key in LAYOUT_ITEM) {
    const itemStr = (<any>LAYOUT_ITEM)[key]
    const widthSetting = fitWidthTable[itemStr]
    if (widthSetting) {
      for (let item of widthSetting) {
        if (width >= item.breakPoint) {
          result[itemStr] = { x: 0, w: item.width as number, minW: 0 }
        }
      }
    }
  }
  result[LAYOUT_ITEM.TRADE_PANEL].x = result[LAYOUT_ITEM.POSITIONS_AND_ORDERS].w
  result[LAYOUT_ITEM.AMM_DEPTH].x = result[LAYOUT_ITEM.CHARTS].w
  return result
}

function calcHeight(height: number) {
  const result: { [key: string]: { y: number, h: number } } = {}
  for (let key in LAYOUT_ITEM) {
    const itemStr = (<any>LAYOUT_ITEM)[key]
    const heightSetting = fitHeightTable[itemStr]
    if (heightSetting) {
      for (let item of heightSetting) {
        if (height >= item.breakPoint) {
          result[itemStr] = { y: 0, h: item.height as number }
        }
      }
    }
  }
  const rowNum = Math.max(Math.ceil((height - staticsHeight) / (gridMargin + gridRowHeight)), 22)
  result[LAYOUT_ITEM.TRADE_PANEL].h = rowNum
  result[LAYOUT_ITEM.CHARTS].h = rowNum - result[LAYOUT_ITEM.POSITIONS_AND_ORDERS].h
  result[LAYOUT_ITEM.AMM_DEPTH].h = result[LAYOUT_ITEM.CHARTS].h
  result[LAYOUT_ITEM.POSITIONS_AND_ORDERS].y = result[LAYOUT_ITEM.CHARTS].h
  return result
}

function fitLayoutToWindow(state: PreferenceState): Layout {
  const allLayout: TilesItem[] = Array().concat(state.layout.hiddenItems, state.layout.tiles)
  const mainElement = document.getElementById('main')
  if (!state.layout.isUseDefault || !allLayout.length || !mainElement) {
    return state.layout
  }
  const w = mainElement.clientWidth
  const h = mainElement.clientHeight
  const widthSetting = calcWidth(w)
  const heightSetting = calcHeight(h)
  const total: TilesItem[] = []
  allLayout.forEach(item => {
    const newLayout = Object.assign({}, item, widthSetting[item.i], heightSetting[item.i])
    total.push(newLayout)
  })

  const newHiddens = _.intersectionBy(total, state.layout.hiddenItems, 'i')
  const newTiles = _.intersectionBy(total, state.layout.tiles, 'i')
  return Object.assign({}, state.layout, { hiddenItems: newHiddens, tiles: newTiles })
}

const module: Module<PreferenceState, any> = {
  namespaced: true,

  state: () => {
    return {
      layout: { hiddenItems: [], tiles: [], isUseDefault: true },
      theme: '',
      commonGridMargin: [gridMargin, gridMargin],
      commonGridRowHeight: gridRowHeight,
      gridColumnNum: 24,
    }
  },
  getters: {
    defaultLayout(state): Layout {
      return initialDefaultLayout()
    },
  },
  actions: {
    init({ commit }) {
      commit('initTheme')
      commit('initLayout')
    },
  },
  mutations: {
    initTheme(state) {
      state.theme = getLocalStorage('dex-theme') || 'dex-theme-dark'
    },
    changeTheme(state, theme) {
      setLocalStorage('dex-theme', theme)
      state.theme = theme
    },
    initLayout(state) {
      let layout = getLocalStorage(LAYOUT_TYPE.DEFAULT) || initialDefaultLayout()
      layout = fitLayoutToWindow(Object.assign({}, state, { layout }))
      setLocalStorage(LAYOUT_TYPE.DEFAULT, layout)
      state.layout = layout
    },
    changeLayout(state, payload) {
      const layout = Object.assign({ ...state.layout }, {
        hiddenItems: payload.hiddenItems,
        tiles: payload.tiles,
        isUseDefault: payload.isUseDefault === undefined ? true : payload.isUseDefault,
      })
      setLocalStorage(LAYOUT_TYPE.DEFAULT, layout)
      state.layout = layout
    },
    resetLayout(state) {
      let layout = initialDefaultLayout()
      layout = fitLayoutToWindow(Object.assign({}, state, { layout }))
      setLocalStorage(LAYOUT_TYPE.DEFAULT, layout)
      state.layout = layout
    },
    changeLayoutItems(state, items: string[]) {
      const nowHiddenItems = state.layout.hiddenItems
      const tiles = state.layout.tiles
      let newShow = nowHiddenItems.filter(x => items.find(item => item === x.i))
      let tmp = nowHiddenItems.filter(x => !items.find(item => item === x.i))
      const hiddenItems = tmp.concat(tiles.filter(x => !items.find(item => item === x.i)))
      const tilesLayout = tiles.filter(x => items.find(item => item === x.i))

      let isOverlap = (rc1: any, rc2: any) =>
        rc1.x + rc1.w > rc2.x && rc2.x + rc2.w > rc1.x && rc1.y + rc1.h > rc2.y && rc2.y + rc2.h > rc1.y
      newShow.forEach(x => {
        if (tiles.find(i => isOverlap(x, i))) {
          let bottom = 0
          tiles.forEach(item => {
            if (item.y + item.h > bottom) {
              bottom = item.y + item.h
            }
          })
          x.y = bottom
          x.x = 0
        }
        tilesLayout.push(x)
      })

      const layout = Object.assign({}, state.layout, { hiddenItems: hiddenItems, tiles: tilesLayout })
      setLocalStorage(LAYOUT_TYPE.DEFAULT, layout)
      state.layout = layout
    },
    fitLayoutToWindow(state) {
      const layout = fitLayoutToWindow(state)
      setLocalStorage(LAYOUT_TYPE.DEFAULT, layout)
      state.layout = layout
    },
  },
}

export default module
