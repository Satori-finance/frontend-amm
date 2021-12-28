<template>
  <div class="number-arrow" v-if="number">
    <span :class="numberStyle">{{ formatNumber }}</span>
    <i class="iconfont" :class="iconStyle"/>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { BigNumber } from 'bignumber.js'
import { formatPrice } from '@/utils/bignumberUtil'

@Component
export default class NumberArrow extends Vue {
  @Prop({ default: () => null }) private number!: BigNumber | null
  @Prop({ default: 0 }) private decimals!: number
  @Prop({ default: false }) private inverse!: boolean

  private numberStyle: { up: null | boolean, down: null | boolean } = { up: null, down: null }
  private iconStyle: { 'icon-up1': null | boolean, 'icon-down1': null | boolean } = { 'icon-up1': null, 'icon-down1': null }

  get formatNumber() {
    // fix Infinity
    let inverse: boolean = this.inverse
    if (this.number && this.number.isZero()) {
      inverse = false
    }
    return formatPrice(this.number, inverse).toFormat(this.decimals)
  }

  inverseBoolean(v: boolean): boolean {
    return this.inverse ? !v : v
  }

  @Watch('number')
  onNumberChange(value: BigNumber | null, oldValue?: BigNumber | null) {
    if (value && oldValue) {
      if (value.gt(oldValue)) {
        this.numberStyle = { up: this.inverseBoolean(true), down: this.inverseBoolean(false) }
        this.iconStyle = { 'icon-up1': this.inverseBoolean(true), 'icon-down1': this.inverseBoolean(false) }
      } else if (value.lt(oldValue)) {
        this.numberStyle = { up: this.inverseBoolean(false), down: this.inverseBoolean(true) }
        this.iconStyle = { 'icon-up1': this.inverseBoolean(false), 'icon-down1': this.inverseBoolean(true) }
      }
    }
  }
}
</script>

<style lang="scss" scoped>

.number-arrow {
  span {
    color: var(--strong-text-color);
  }

  span.up {
    color: var(--mc-color-blue);
  }

  span.down {
    color: var(--mc-color-orange);
  }

  i {
    color: var(--strong-text-color);
  }

  i.iconfont.icon-up1 {
    font-size: 16px;
    color: var(--mc-color-blue);
  }

  i.iconfont.icon-down1 {
    font-size: 16px;
    color: var(--mc-color-orange);
  }
}
</style>
