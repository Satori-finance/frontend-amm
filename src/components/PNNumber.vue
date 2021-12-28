<template>
  <span class="pn-number" :class="{positive: isPositive&&showChangedColor, negative: isNegative&&showChangedColor}">
    {{ formatted }}
  </span>
</template>

<script lang='ts'>
import { Component, Prop, Vue } from 'vue-property-decorator'
import { BigNumber } from 'bignumber.js'

@Component
export default class PNNumber extends Vue {
  @Prop({ required: true }) private number!: BigNumber
  @Prop({ type: Number, default: 0 }) private decimals!: number
  @Prop({ default: true }) private showChangedColor!: number
  @Prop() private roundingMode!: BigNumber.RoundingMode
  @Prop({ type: Boolean, default: false }) private showPlusSign!: boolean
  @Prop({ default: '' }) private suffix!: string
  @Prop({ default: '' }) private prefix!: string

  get isPositive() {
    return this.number ? this.number.gt(0) : false
  }

  get isNegative() {
    return this.number ? this.number.lt(0) : false
  }

  get formatted() {
    if (!this.number) {
      return ''
    }
    let prefix = ''
    let sign = 1
    if (this.isNegative) {
      prefix = '- '
      sign = -1
    } else if (this.isPositive && this.showPlusSign) {
      prefix = '+ '
    }
    const r = this.number.times(sign).toFormat(this.decimals, this.roundingMode)
    return `${this.prefix}${prefix}${r}${this.suffix}`
  }
}
</script>

<style lang="scss" scoped>
span.pn-number.positive {
  color: var(--mc-color-blue) !important;
}

span.pn-number.negative {
  color: var(--mc-color-orange) !important;
}
</style>
