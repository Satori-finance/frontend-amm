<template>
  <div class="mc-count-down">
    <span class="count-down-container" v-if="module === 0">
      <span class="value" v-if="showDay">{{ dd }}</span>
      <span class="text" v-if="showDay">{{ $t('countDown.day') }}</span>
      <span class="value">{{ hh }}</span>
      <span class="text">{{ $t('countDown.hour') }}</span>
      <span class="value">{{ mm }}</span>
      <span class="text">{{ $t('countDown.minutes') }}</span>
      <span class="value">{{ ss }}</span>
      <span class="text">{{ $t('countDown.second') }}</span>
    </span>
    <span class="count-down-container" v-if="module === 1">
      <span><span v-if="showDay">{{ dd }}:</span>{{ hh }}:{{ mm }}:{{ ss }}</span>
    </span>
    <span class="count-down-container" v-if="module === 2">
      <span>
        {{ dd }}{{ $t('countDown.day') }}
        {{ hh }}{{ $t('countDown.hour') }}
        {{ mm }}{{ $t('countDown.minutes') }}
      </span>
    </span>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'

@Component
export default class McCountDown extends Vue {
  @Prop({ default: 0 }) endTimestamp !: number
  @Prop({ default: 0 }) module !: 0 | 1 | 2
  @Prop({default: true}) showDay !: boolean

  private timer: number | null = null
  private dd: string = '-'
  private hh: string = '-'
  private mm: string = '-'
  private ss: string = '-'

  destroyed () {
    if (this.timer) {
      window.clearInterval(this.timer)
    }
  }

  @Watch('endTimestamp', { immediate: true })
  onEndTimeStampChange () {
    if (this.timer !== null) {
      window.clearInterval(this.timer)
    }
    let startTimestamp = Math.floor(Date.now() / 1000)
    let endTimestamp = this.endTimestamp
    if (endTimestamp === 0 || startTimestamp >= endTimestamp) {
      if (this.timer !== null) {
        window.clearInterval(this.timer)
      }
      return
    }
    this.timer = window.setInterval(() => {
      const ts = endTimestamp - startTimestamp
      if (ts > 0) {
        let dd = parseInt((ts / 60 / 60 / 24).toString(), 10)
        let hh = parseInt((ts / 60 / 60 % 24).toString(), 10)
        let mm = parseInt((ts / 60 % 60).toString(), 10)
        let ss = parseInt((ts % 60).toString(), 10)
        this.dd = this.checkTime(dd)
        this.hh = this.checkTime(hh)
        this.mm = this.checkTime(mm)
        this.ss = this.checkTime(ss)
        startTimestamp++
      } else if (ts < 0) {
        this.dd = '-'
        this.mm = '-'
        this.ss = '-'
      }
    }, 1000)
  }


  checkTime (i: number): string {
    let showText = i.toString()
    if (i < 10 && i !== 0) {
      showText = '0' + i.toString()
    }
    return showText
  }
}
</script>

<style scoped lang="scss">
.mc-count-down {
  display: inline-block;
  font-size: 14px;
  font-weight: 400;

  .count-down-container {
    span {
      padding: 0 2px;

      &:first-child {
        padding-left: 0;
      }

      &:last-child {
        padding-right: 0;
      }
    }
  }

  .text {
    color: var(--mc-text-color);
    margin-right: 6px;

    &:last-child {
      margin-right: 0;
    }
  }

  .value {
    color: var(--mc-text-color-white);
  }
}
</style>
