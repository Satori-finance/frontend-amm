<template>
  <div class="mc-loading" :class="{show: show}">
    <slot v-if="!show || !hideContent"></slot>
    <div class="mc-loading__mask" v-show="show" :style="{background: maskColor}">
      <div class="mc-loading__item" :style="[positionStyle]">
        <div class="loading-icon">
          <i class="el-icon-loading"></i>
          <img class="fantasy-loading" src="@/assets/img/satori-fantasy/loading.svg" alt="">
        </div>
        <div class="loading-text" v-if="showLoadingText">{{ $t('base.loading') }}...</div>
      </div>
    </div>
  </div>
</template>

<script lang='ts'>
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator'
import { Loading as ElLoading } from 'element-ui'
import { ElLoadingComponent } from 'element-ui/types/loading'

enum Status {
  HIDE,
  DEALY,
  MIN_SHOW,
  SHOW
}

@Component
export default class McLoading extends Vue {
  @Prop({ default: 0 }) delay!: number
  @Prop({ default: 1500 }) minShowTime!: number
  @Prop({ default: false }) showLoading!: boolean
  @Prop({ default: true }) showLoadingText!: boolean
  @Prop({ default: 0 }) margin!: number
  @Prop({ default: 'rgba(10, 16, 36, 0.5)' }) maskColor!: string
  @Prop({ default: false }) hideContent!: boolean

  private delayTimerId = 0
  private status = Status.HIDE

  get show(): boolean {
    return this.status === Status.MIN_SHOW || this.status === Status.SHOW
  }

  get positionStyle() {
    return {
      top: this.margin + 'px',
      left: this.margin + 'px',
      right: this.margin + 'px',
      bottom: this.margin + 'px',
    }
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
.mc-loading {
  position: relative;

  .mc-loading__mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;

    .mc-loading__item {
      position: absolute;
      pointer-events: visible;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .loading-text {
        margin-top: 8px;
        font-size: 14px;
        line-height: 20px;
      }

      .loading-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        i, img {
          display: none;
        }
      }

      .el-icon-loading {
        font-size: 18px;
      }
    }
  }

}
</style>

<style scoped lang="scss">
.dex-theme-dark .mc-loading {
  .mc-loading__item {
    color: var(--mc-text-color);

    .loading-icon {
      i {
        display: inline-block;
      }
    }
  }
}
</style>


<style scoped lang="scss">
.satori-fantasy .mc-loading {
  .mc-loading__item {
    color: var(--mc-text-color);

    .loading-icon {
      img {
        display: inline-block;
        animation: rotating 2s linear infinite;
      }
    }
  }
}
</style>
