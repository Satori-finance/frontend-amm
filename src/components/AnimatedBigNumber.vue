<template>
  <span :class="{up, down}">{{ formated }}</span>
</template>

<script lang="ts">
import { Vue, Prop, Component, Watch } from 'vue-property-decorator'
import BigNumber from 'bignumber.js'

@Component
export default class AnimatedBigNumber extends Vue {
  @Prop({ required: true }) value!: BigNumber
  @Prop( { default:2 } ) amountFormatDecimals!: number
  @Prop( { default: BigNumber.ROUND_DOWN}) amountRoundMode !: BigNumber.RoundingMode
  @Prop( { default: 1000 }) duration !: number

  private up = false
  private down = false

  get formated(): string {
    return this.value.toFormat(this.amountFormatDecimals, this.amountRoundMode)
  }

  @Watch('value', { immediate: true })
  updateValue(newValue: BigNumber, oldValue: BigNumber) {
    if (newValue.gt(oldValue)) {
      this.up = true
      window.setTimeout(() => (this.up = false), this.duration)
    } else if (newValue.lt(oldValue)) {
      this.down = true
      window.setTimeout(() => (this.down = false), this.duration)
    }
  }
}
</script>
