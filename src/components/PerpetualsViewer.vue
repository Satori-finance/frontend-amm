<template>
  <div class="perpetuals-viewer">
    <div class="grid-container" :style="style">
      <div class="grid-cell" v-for="(p, index) in newPerpetuals.slice(0, maxShowCount)" :key="index">
        <span class="perp-item" :class="{'selected-perp-item': isSearchSelectedPerp(p)}">
          <span @click.stop="goTrade(p)">{{ `${p.symbol} ${p.underlying}-${collateral}` }}</span>
          <el-popover
            v-if="showPopover && index + 1 === maxShowCount"
            popper-class="perpetuals-viewer-popover"
            placement="bottom"
            trigger="hover">
            <div class="extra-perp-item"
                 v-for="(p2, index2) in newPerpetuals.slice(maxShowCount, newPerpetuals.length)"
                 @click.stop="goTrade(p2)"
                 :key="index2">
              {{ p2.symbol }} {{ p2.underlying }}-{{ collateral }}
            </div>
            <a class="extra" slot="reference">...</a>
          </el-popover>
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Perpetual } from '@/type'
import * as _ from 'lodash'
import { ROUTE } from '@/router'

@Component
export default class PerpetualsViewer extends Vue {
  @Prop({ default: () => [] }) perpetuals!: Perpetual[]
  @Prop({ default: 2 }) maxRowCount!: number
  @Prop({ default: 3 }) perRowCount!: number
  @Prop({ required: true }) collateral!: string
  @Prop({ default: '' }) searchKey !: string
  @Prop({ default: false }) newPageOpen !: boolean

  get rowCount() {
    return this.perRowCount > 0 ? Math.ceil(this.perpetuals.length / this.perRowCount) : this.perpetuals.length
  }

  get newPerpetuals(): Perpetual[] {
    if (this.searchKey === '') return this.perpetuals
    return this.filterPerpetuals(this.perpetuals)
  }

  get showPopover() {
    return this.maxShowCount < this.perpetuals.length
  }

  get maxShowCount() {
    return Math.max(this.maxRowCount * this.perRowCount, 1)
  }

  get style() {
    return {
      'grid-template-rows': `repeat(${Math.min(this.rowCount, this.maxRowCount)}, 1fr)`,
      'grid-template-columns': `repeat(${this.perRowCount}, 1fr)`,
    }
  }

  filterPerpetuals(perps: Perpetual[]): Perpetual[] {
    let selectedPerpsList: Perpetual[] = []
    let unSelectedPerpsList: Perpetual[] = []
    perps.forEach((val: Perpetual) => {
      if (this.isSearchSelectedPerp(val)) {
        selectedPerpsList.push(val)
      } else {
        unSelectedPerpsList.push(val)
      }
    })
    selectedPerpsList = _.sortBy(selectedPerpsList, 'symbol')
    unSelectedPerpsList = _.sortBy(unSelectedPerpsList, 'symbol')
    return [...selectedPerpsList, ...unSelectedPerpsList]
  }

  isSearchSelectedPerp(perp: Perpetual): boolean {
    if (this.searchKey === '') return false
    const newSearchKey = this.searchKey.toLowerCase()
    const isPerpetualNameKey = newSearchKey.indexOf('-') > -1
    // underlying, collateral
    const perpetualNameKeys = newSearchKey.split('-')
    if (isPerpetualNameKey) {
      if (perp.underlying && perp.underlying.toLowerCase() === perpetualNameKeys[0].toLowerCase() &&
          this.collateral.toLowerCase() === perpetualNameKeys[1].toLowerCase()) {
        return true
      }
    } else {
      if (perp.underlying && newSearchKey === perp.underlying.toLowerCase()) return true
      if (perp.symbol && newSearchKey === perp.symbol.toLowerCase()) return true
      if (this.collateral.toLowerCase() === newSearchKey.toLowerCase()) return true
    }
    return false
  }

  goTrade(perpetual: {symbol: string}) {
    if (this.newPageOpen) {
      const url = `${window.location.origin}/trade/${perpetual.symbol}`
      window.open(url, "_blank","")
    } else {
      this.$router.push({name: ROUTE.TRADE_MAIN, params: { symbol: perpetual.symbol}})
    }
  }
}
</script>

<style scoped lang="scss">
.perpetuals-viewer {
  text-align: left;
  display: inline-block;

  .grid-container {
    display: inline-grid;
    grid-column-gap: 8px;
    grid-row-gap: 8px;
  }

  .perp-item {
    position: relative;
    display: flex;
    align-items: center;
    color: var(--mc-color-primary);
    text-decoration: underline;
    cursor: pointer;

    &:before {
      content: "";
      display: inline-block;
      width: 4px;
      height: 4px;
      background: var(--mc-text-color-white);
      margin-right: 2px;
      border-radius: 50%;
    }

    .symbol {
      display: inline-block;
      margin-right: 4px;
    }

    .extra {
      position: absolute;
      left: calc(100% + 2px);
      bottom: 0;
    }
  }

  .selected-perp-item {
    background: var(--mc-background-color-darkest);
    color: var(--mc-color-blue);
  }

}
</style>

<style lang="scss">
.perpetuals-viewer-popover {
  padding: 0;

  &[x-placement^="bottom"] {
    margin-top: 2px;
  }

  .extra-perp-item {
    font-size: 13px;
    font-weight: 400;
    height: 36px;
    line-height: 36px;
    padding: 0 10px;
    min-width: 180px;
  }

  .extra-perp-item:hover {
    cursor: pointer;
    background: var(--mc-background-color-dark);
  }
}
</style>
