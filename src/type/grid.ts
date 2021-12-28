export interface TilesItem {
  i: string
  x: number
  y: number
  h: number
  w: number
  isDraggable: boolean
  isResizable: boolean
  minW: number
  moved: boolean
  maximizable: boolean
}

export enum LAYOUT_ITEM {
  CHARTS = 'charts',
  AMM_DEPTH = 'AMMDepth',
  TRADE_PANEL = 'tradePanel',
  POSITIONS_AND_ORDERS = 'positionsAndOrders',
}

export enum LAYOUT_TYPE {
  DEFAULT = 'mcdex3-fantasy-trade-layout',
}

export interface Layout {
  isUseDefault: boolean
  hiddenItems: TilesItem[]
  tiles: TilesItem[]
}

export interface PreferenceState {
  commonGridRowHeight: number
  commonGridMargin: [number, number]
  layout: Layout
  theme: string
  gridColumnNum: number
}

export interface LayoutBreakPointSetting {
  breakPoint: number
  width?: number
  height?: number
}
