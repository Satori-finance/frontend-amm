<template>
  <div ref="gridContainer" id="grid-container">
    <GridLayout v-bind:style="{ width: '100%' }" :layout="renderLayout" :col-num="colNum" :row-height="gridRowHeight"
                :is-draggable="true" :is-resizable="true" :vertical-compact="true" :use-css-transforms="false"
                :margin="gridMargin" :autoSize="true">
      <GridItem v-for="item in renderLayout" :key="item.i" :is-draggable="item.isDraggable"
                :is-resizable="item.isResizable" v-bind="item" @resized="onResized" @moved="onMoved"
                dragAllowFrom=".head" style="overflow: hidden">
        <DEXGridItem :isMaximized="!!maximizedItem" :maximizable="item.maximizable" @shrinkGridItem="
            () => {
              onShrink(item.i)
            }
          " @closeGridItem="
            () => {
              onClose(item.i)
            }
          " @maximizeGridItem="
            () => {
              onMaximize(item.i)
            }
          ">
          <component :data-xxxxxxxx="item.i" v-if="gridItems && gridItems[item.i]" :is="gridItems[item.i].component" :ref="item.i" :x="item.x"
                     :y="item.y" :h="item.h" :w="item.w" :minW="item.minW" :rowHeight="gridRowHeight"
                     v-bind="gridItems[item.i].props"></component>
        </DEXGridItem>
      </GridItem>
    </GridLayout>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { DEXGridItem } from '@/components'
import OrderBook from './OrderBook/OrderBook.vue'
import PositionsAndOrders from './PositionAndOrders/PositionsAndOrders.vue'
import ChartAdapter from './Charts/ChartAdapter.vue'
import { namespace } from 'vuex-class'
import { TilesItem, Layout, LAYOUT_ITEM } from '@/type'
import TradePanel from '@/template/Trade/OrderTrade/TradePanel.vue'
import { VUE_EVENT_BUS } from '@/event'

const VueGridLayout = require('vue-grid-layout')
const preference = namespace('preference')

@Component({
  components: {
    GridLayout: VueGridLayout.GridLayout,
    GridItem: VueGridLayout.GridItem,
    DEXGridItem,
  },
})
export default class GridContainer extends Vue {
  @preference.State('layout') layout!: Layout
  @preference.Getter('defaultLayout') defaultLayout!: Layout
  @preference.Mutation('changeLayout') changeLayout!: Function
  @preference.Mutation('fitLayoutToWindow') fitLayoutToWindow!: () => Layout
  @preference.State('commonGridRowHeight') commonGridRowHeight!: number
  @preference.State('commonGridMargin') commonGridMargin!: [number, number]
  @preference.State('gridColumnNum') colNum!: number

  maximizedItem: string | null = null
  windowWidth = document.documentElement.clientWidth
  maximizedH = 0

  get hiddenItems(): Array<TilesItem> {
    return this.layout.hiddenItems
  }

  get tilesLayout(): Array<TilesItem> {
    return this.layout.tiles
  }

  get gridRowHeight(): number {
    return this.commonGridRowHeight
  }

  get gridMargin(): [number, number] {
    return this.commonGridMargin
  }

  mounted() {
    this.maximizedH = this.getMaximizedH()
    window.addEventListener('resize', this.onWindowResized)
  }

  beforeDestroy() {
    window.removeEventListener('resize', this.onWindowResized)
  }

  get renderLayout() {
    return this.maximizedLayout || this.tilesLayout
  }

  get gridItems() {
    return {
      [LAYOUT_ITEM.AMM_DEPTH]: {
        component: OrderBook,
        props: {},
      },
      [LAYOUT_ITEM.POSITIONS_AND_ORDERS]: {
        component: PositionsAndOrders,
        props: {},
      },
      [LAYOUT_ITEM.CHARTS]: {
        component: ChartAdapter,
        props: {},
      },
      [LAYOUT_ITEM.TRADE_PANEL]: {
        component: TradePanel,
        props: {},
      }
    }
  }

  get maximizedLayout(): Array<TilesItem> | null {
    return this.maximizedItem
      ? [
        {
          i: this.maximizedItem,
          isDraggable: false,
          isResizable: false,
          maximizable: true,
          w: this.colNum,
          h: this.maximizedH,
          x: 0,
          y: 0,
          minW: 0,
          moved: false,
        },
      ]
      : null
  }

  getMaximizedH() {
    let maxHeight = window.innerHeight - (this.$el as HTMLElement).offsetTop
    return Math.floor(maxHeight / (this.gridRowHeight + this.gridMargin[1]))
  }

  onWindowResized() {
    let tmp = this.getMaximizedH()
    if (this.maximizedH != tmp) {
      this.maximizedH = tmp
    }
    this.fitLayoutToWindow()
  }

  onResized(i: string, newH: number, newW: number, newHPx: number, newWPx: number) {
    let resizedObject = this.$refs[i] as Array<any>
    resizedObject.forEach((x) => {
      x.onResized && x.onResized(i, newH, newW, newHPx, newWPx)
    })
    const tiles: Array<TilesItem> = this.tilesLayout
    tiles.forEach((t) => {
      if (t.i === i) {
        t.h = newH
        t.w = newW
      }
    })
    this.emitGridLayoutChanged({ hiddenItems: this.hiddenItems, tiles, isUseDefault: false })
  }

  onMoved(i: string, newX: number, newY: number) {
    let movedObject = this.$refs[i] as Array<any>
    movedObject.forEach((x) => {
      x.onResized && x.onMoved(i, newX, newY)
    })
    const tiles: Array<TilesItem> = this.tilesLayout
    tiles.forEach((t) => {
      if (t.i === i) {
        t.x = newX
        t.y = newY
      }
    })
    this.emitGridLayoutChanged({ hiddenItems: this.hiddenItems, tiles, isUseDefault: false })
  }

  onShrink(i: string) {
    if (this.maximizedItem === i) {
      this.maximizedItem = null
    }
  }

  onMaximize(i: string) {
    this.maximizedItem = i
    VUE_EVENT_BUS.emit('gridMaximize', i)
  }

  onClose(i: string) {
    if (this.maximizedItem === i) {
      this.maximizedItem = null
    } else {
      const newHiddens: Array<TilesItem> = this.hiddenItems.concat(this.tilesLayout.filter((x) => x.i === i))
      const newTiles = this.tilesLayout.filter((x) => x.i !== i)
      this.emitGridLayoutChanged({ tiles: newTiles, hiddenItems: newHiddens })
    }
  }

  emitGridLayoutChanged(payload: { hiddenItems?: Array<any>; isUseDefault?: boolean; tiles?: Array<TilesItem> }) {
    this.changeLayout(payload)
  }
}
</script>

<style lang="scss" scoped></style>
