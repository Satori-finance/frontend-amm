<template>
  <div class="perpetuals-img-viewer" @click.stop="showPerpetualPopup">
    <div v-if="showTitle" class="title">
      <span>{{ $t('base.perpetual') }}</span>
      <span v-if="showExtra" class="extra" slot="reference">+ {{ perpetuals.length - perRowCount }}</span>
    </div>
    <div class="grid-container" v-if="newPerpetuals.length > 0">
      <span class="perp-item" v-for="(p, index) in newPerpetuals.slice(0, perRowCount)" :key="index">
        <McMTokenImageView :size="20" :token="p.underlying" />
      </span>
    </div>
    <div class="grid-container" v-else>
      <span class="perp-item no-data">{{ $t('base.none') }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Perpetual } from '@/type'
import * as _ from 'lodash'
import { ROUTE } from '@/router'
import McMTokenImageView from '@/mobile/components/McMTokenImageView.vue'

@Component({
  components: {
    McMTokenImageView,
  }
})
export default class MPerpetualsImgViewer extends Vue {
  @Prop({ default: () => [] }) perpetuals!: Perpetual[]
  @Prop({ default: 5 }) perRowCount!: number
  @Prop({ required: true }) collateral!: string
  @Prop({ default: '' }) searchKey !: string
  @Prop({ default: false }) newPageOpen !: boolean
  @Prop({ default: 20 }) tokenImgSize!: number
  @Prop({ default: false }) showTitle!: boolean

  get newPerpetuals(): Perpetual[] {
    if (this.searchKey === '') return this.perpetuals
    return this.filterPerpetuals(this.perpetuals)
  }

  get showExtra(): boolean {
    return this.perpetuals.length > this.perRowCount
  }

  showPerpetualPopup() {
    this.$emit('click', { perpetuals: this.perpetuals, collateral: this.collateral })
  }

  filterPerpetuals(perps: Perpetual[]): Perpetual[] {
    let selectedPerpsList: Perpetual[] = []
    let unSelectedPerpsList: Perpetual[] = []
    perps.forEach((val: Perpetual) => {
      unSelectedPerpsList.push(val)
    })
    selectedPerpsList = _.sortBy(selectedPerpsList, 'symbol')
    unSelectedPerpsList = _.sortBy(unSelectedPerpsList, 'symbol')
    return [...selectedPerpsList, ...unSelectedPerpsList]
  }
}
</script>

<style scoped lang="scss">
.perpetuals-img-viewer {
  text-align: left;
  display: inline-block;
  width: 116px;
  background: var(--mc-background-color);
  border-radius: 12px;
  padding: 8px 12px;

  .title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    line-height: 16px;
    color: var(--mc-text-color);
    margin-bottom: 4px;
  }

  .grid-container {
    display: flex;
    align-items: center;
  }

  .perp-item {
    display: flex;
    align-items: center;
    min-width: 20px;
    margin-right: 4px;
  }

  .extra {
    font-size: 12px;
    color: var(--mc-text-color);
    cursor: pointer;
  }

  .no-data {
    line-height: 20px;
  }
}
</style>

