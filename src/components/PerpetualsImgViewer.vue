<template>
  <div class="perpetuals-img-viewer">
    <div class="grid-container">
      <span class="perp-item" v-for="(p, index) in newPerpetuals.slice(0, perRowCount)" :key="index"
            :class="{'selected-perp-item': isSearchSelectedPerp(p)}">
        <TokenImageView :size="32" :token="p.underlying" :network-id="SUPPORTED_NETWORK_ID.MAINNET" />
        <div class="info" @click.stop="goTrade(p)">
          <div class="underlying-text large-text-item">{{ p.underlying }}</div>
          <div class="collateral-text text-item">-{{ collateral }}</div>
        </div>
      </span>
      <el-popover
        v-if="showPopover"
        popper-class="perpetuals-img-viewer-popover fantasy"
        placement="bottom"
        trigger="hover">
        <div class="perpetuals-list-box popover-content">
          <div class="perps-row" v-for="i in Math.ceil((perpetuals.length-perRowCount)/8)" :key="i">
            <span class="extra-perp-item"
                  v-for="(p, index) in newPerpetuals.slice(perRowCount+8*(i-1), perRowCount+8*i)" :key="index">
            <TokenImageView :size="32" :token="p.underlying" />
            <div class="info" @click.stop="goTrade(p)">
              <div class="underlying-text large-text-item">{{ p.underlying }}</div>
              <div class="collateral-text text-item">-{{ collateral }}</div>
            </div>
          </span>
          </div>
        </div>
        <span class="extra" slot="reference" @click.stop>+ {{ perpetuals.length - perRowCount }} {{ $t('base.more') }}</span>
      </el-popover>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Perpetual } from '@/type'
import * as _ from 'lodash'
import { ROUTE } from '@/router'
import TokenImageView from './TokenImageView.vue'
import { SUPPORTED_NETWORK_ID } from '@/const'

@Component({
  components: {
    TokenImageView
  }
})
export default class PerpetualsImgViewer extends Vue {
  @Prop({ default: () => [] }) perpetuals!: Perpetual[]
  @Prop({ default: 5 }) perRowCount!: number
  @Prop({ required: true }) collateral!: string
  @Prop({ default: '' }) searchKey !: string
  @Prop({ default: false }) newPageOpen !: boolean

  SUPPORTED_NETWORK_ID = SUPPORTED_NETWORK_ID

  get newPerpetuals(): Perpetual[] {
    if (this.searchKey === '') return this.perpetuals
    return this.filterPerpetuals(this.perpetuals)
  }

  get showPopover(): boolean {
    return this.perpetuals.length > this.perRowCount
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
.perpetuals-img-viewer {
  text-align: left;
  display: inline-block;

  .grid-container {
    display: flex;
    align-items: center;
  }

  .perp-item {
    display: flex;
    align-items: center;
    min-width: 101px;
    margin-right: 12px;

    .info {
      margin-left: 8px;
      cursor: pointer;
      color: var(--mc-color-primary);

      &:hover {
        text-decoration: underline;
      }
    }

    .large-text-item {
      line-height: 20px;
    }

    .text-item {
      line-height: 16px;
    }

    .underlying-text {
      font-size: 14px;
    }

    .collateral-text {
      font-size: 12px;
      margin-top: 4px;
    }
  }

  .selected-perp-item {}

  .extra {
    font-size: 12px;
    color: var(--mc-text-color);
    cursor: pointer;
    text-decoration-line: underline;
    text-decoration-style: dashed;
    text-decoration-color: inherit;
    text-underline-position: under;
  }
}
</style>

<style lang="scss">
.perpetuals-img-viewer-popover {
  .perpetuals-list-box {
    background-color: var(--mc-background-color-darkest) !important;
    min-width: 359px !important;
    min-height: 72px;
    max-width: 924px;
    padding: 0 16px;
  }

  &[x-placement^="bottom"] {
    margin-top: 21.2px !important;

    .popper__arrow::after {
      background-color: var(--mc-background-color-darkest);
    }
  }

  .perps-row {
    display: flex;
    align-items: center;
    height: 72px;
  }

  .extra-perp-item {
    display: flex;
    align-items: center;
    min-width: 101px;
    margin-right: 12px;

    .info {
      margin-left: 8px;
      cursor: pointer;
      color: var(--mc-color-primary);

      &:hover {
        text-decoration: underline;
      }
    }

    .text-item {
      line-height: 20px;
    }

    .underlying-text {
      font-size: 14px;
    }

    .collateral-text {
      font-size: 12px;
    }
  }
}
</style>

