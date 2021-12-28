<template>
  <span class="mc-avatar" :style="{'background-color': backgroundColor, height: size + 'px', width: size + 'px'}">
    <svg xmlns="http://www.w3.org/2000/svg" class="rounded-full flex-none h-9 w-9" :height="size" :width="size">
      <svg v-for="(item, index) in rectOptions">
        <defs>
          <linearGradient :id="`svg-linear-gradient-${index}`" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-opacity: 1;" :style="{'stop-color': item.color1}"></stop>
            <stop offset="100%" style="stop-opacity: 1;" :style="{'stop-color': item.color2}"></stop>
          </linearGradient>
        </defs>
        <rect x="0" y="0" rx="0" ry="0" :height="size" :width="size"
              :transform="`translate(${item.translateX} ${item.translateY}) rotate(${item.rotate} ${item.rotateX} ${item.rotateY})`"
              :fill="`url(#svg-linear-gradient-${index})`"></rect>
      </svg>
    </svg>
  </span>
</template>

<script lang="ts">
import { Vue, Prop, Component } from 'vue-property-decorator'
import BigNumber from 'bignumber.js'

interface RectOption {
  color1: string
  color2: string
  translateX: number
  translateY: number
  rotate: number
  rotateX: number
  rotateY: number
}

const colors = [
  'rgb(183, 251, 255)',
  'rgb(246, 65, 206)',
  'rgb(255, 133, 221)',
  'rgb(134, 43, 250)',
  'rgb(133, 255, 167)',
  'rgb(43, 151, 250)',
  'rgb(183, 203, 255)',
  'rgb(65, 116, 246)',
  'rgb(104, 82, 237)',
]

@Component
export default class McAvatar extends Vue {
  @Prop({ default: '' }) address!: string
  @Prop({ default: 36 }) size!: number

  get hexNumbers() {
    return (this.address.match(/[0-9a-fA-F]{5}/g) || []).map(n => `0x${n}`.toLowerCase())
  }

  get rectOptions(): RectOption[] {
    const options: RectOption[] = []
    for (let i = 0, j = this.hexNumbers.length - 1; i < j; i++, j--) {
      options.push(this.calcOption(new BigNumber(this.hexNumbers[i]), new BigNumber(this.hexNumbers[j])))
    }
    return options
  }

  get backgroundColor() {
    const index = new BigNumber(`0x${this.address.slice(this.address.length - 2, this.address.length)}`).mod(colors.length).toNumber()
    return colors[index] || null
  }

  private calcOption(num1: BigNumber, num2: BigNumber): RectOption {
    return {
      color1: colors[num1.plus(num2).mod(colors.length).toNumber()], // (num1 + num2) % color length
      color2: colors[num1.times(num2).mod(colors.length).toNumber()], // (num1 * num2) % color length
      translateX: num1.minus(num2).mod(this.size).toNumber(), // (num1 - num2) % size
      translateY: new BigNumber(Math.tan(num1.div(num2).mod(Math.PI).toNumber() - (Math.PI / 2))).mod(this.size).toNumber(), // (tan((num1 / num2) % PI - PI / 2) + PI / 2) % size
      rotate: num1.times(num2).mod(360).toNumber(), // (num1 * num2) % 360
      rotateX: this.size / 2,
      rotateY: this.size / 2,
    }
  }
}
</script>

<style scoped lang="scss">
span {
  display: inline-block;
  overflow: hidden;
  border-radius: 50%;
}
</style>
