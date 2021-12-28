<template>
  <div class="mc-mcdex-loading">
    <div class="animation">
      <span>M</span>
      <span>C</span>
      <span>D</span>
      <span>E</span>
      <span>X</span>
    </div>
  </div>
</template>

<script lang='ts'>
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator'

enum Status {
  HIDE,
  DEALY,
  MIN_SHOW,
  SHOW
}

@Component
export default class McMcdexLoading extends Vue {
  @Prop({ default: 0 }) delay!: number
  @Prop({ default: 500 }) minShowTime!: number
  @Prop({ default: false }) showLoading!: boolean

  private delayTimerId = 0
  private status = Status.HIDE

  get show(): boolean {
    return this.status === Status.MIN_SHOW || this.status === Status.SHOW
  }

  @Watch('showLoading', { immediate: true })
  showLoadingChange(value: boolean) {
    if (value) {
      // start show
      if (this.status === Status.HIDE) {
        this.status = Status.DEALY
        this.delayTimerId = window.setTimeout(() => {
          this.status = Status.MIN_SHOW
          window.setTimeout(() => {
            if (this.showLoading) {
              this.status = Status.SHOW
            } else {
              this.status = Status.HIDE
            }
          }, this.minShowTime)
        }, this.delay)
      }
    } else {
      if (this.status === Status.DEALY) {
        // cancel show
        window.clearTimeout(this.delayTimerId)
        this.delayTimerId = 0
        this.status = Status.HIDE
      } else if (this.status === Status.SHOW) {
        this.status = Status.HIDE
      }
    }
  }

  @Watch('show')
  onShowChange(val: boolean) {
    if (val) {
      this.$emit('show')
    } else {
      this.$emit('hide')
    }
  }
}
</script>

<style scoped lang="scss">
.mc-mcdex-loading {
  @keyframes upDownMove {
    0% {
      transform: translateY(0);
    }

    50% {
      transform: translateY(10px);
    }

    100% {
      transform: translateY(-10px);
    }
  }

  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--mc-background-color-darkest);

  .animation {
    font-size: 40px;
    color: #ffffff;
    font-weight: bold;
    font-family: Helvtica, Arial, Sans-serif;
  }

  .animation span {
    display: inline-block;
  }

  .animation span:nth-of-type(1) {
    color: #59efec;
    animation: upDownMove 1s cubic-bezier(0.39, 0.58, 0.57, 1) 0s infinite alternate;
  }

  .animation span:nth-of-type(2) {
    color: #d98041;
    animation: upDownMove 1s cubic-bezier(0.39, 0.58, 0.57, 1) 0.1s infinite alternate;
  }

  .animation span:nth-of-type(3) {
    animation: upDownMove 1s cubic-bezier(0.39, 0.58, 0.57, 1) 0.2s infinite alternate;
  }

  .animation span:nth-of-type(4) {
    animation: upDownMove 1s cubic-bezier(0.39, 0.58, 0.57, 1) 0.3s infinite alternate;
  }

  .animation span:nth-of-type(5) {
    animation: upDownMove 1s cubic-bezier(0.39, 0.58, 0.57, 1) 0.4s infinite alternate;
  }
}
</style>
