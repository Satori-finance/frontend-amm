<template>
  <transition name="moveOut">
    <section class="mc-transaction"
             :class="{pending: status==='pending', success: status==='success', error: status==='error'}">
      <div class="mc-transaction-inner">
        <div class="icon-box">
          <div class="icon-bg">
            <img v-if="status==='pending'" class="fantasy-loading" src="@/assets/img/satori-fantasy/loading.svg" alt="">
            <img v-if="status==='success'" class="fantasy-success" src="@/assets/img/satori-fantasy/success.svg" alt="">
            <img v-if="status==='error'" class="fantasy-fail" src="@/assets/img/satori-fantasy/failed.svg" alt="">
          </div>
        </div>
        <div class="mc-transaction-content">
          <div class="content-wrapper">
            <span class="content" v-html="content"></span>
            <a class="tx-link" v-if="transactionHash" :href="txLink" target="_blank">
              <i class="iconfont icon-view"></i>
            </a>
          </div>
          <div class="time">{{ now | datetimeFormatter('lll') }}</div>
        </div>
        <div class="close-btn">
          <McCircleLoad v-if="status!=='pending'" class="timer" :size="30" :bar-size="2" :duration="5"
                        background-color="transparent"
                        @end="destroyMessage"></McCircleLoad>
          <i class="mc-iconfont iconfont icon-step-failed" @click="destroyMessage"></i>
        </div>
      </div>
    </section>
  </transition>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch, Ref } from 'vue-property-decorator'
import moment, { Moment } from 'moment'
import { etherBrowserTxURL } from '@/utils/ethers'
import McCircleLoad from '../McCircleLoad.vue'

@Component({
  components: {
    McCircleLoad,
  },
})
export default class Transaction extends Vue {
  @Prop() content!: string
  @Prop() transactionHash!: string
  @Prop() transaction!: Promise<any>

  private flag: boolean = false
  private now: Moment = moment()
  private status: 'pending' | 'success' | 'error' = 'pending'
  private hideBar = false

  get txLink() {
    return etherBrowserTxURL(this.transactionHash)
  }

  mounted() {
    this.transaction.then(() => {
      this.status = 'success'
    }).catch(() => {
      this.status = 'error'
    })
  }

  private destroyMessage() {
    this.flag = false
    this.$nextTick(() => {
      (this.$el as HTMLElement).remove()
    })
  }

  @Watch('status', { immediate: true })
  onStatusChange() {
    if (this.status !== 'pending') {
      this.$nextTick(() => {
        this.hideBar = true
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~@mcdex/style/common/var';

.mc-transaction {
  position: relative;
  background: var(--mc-color-primary-gradient);
  padding: 1px;
  border-radius: var(--mc-border-radius-l);
  width: 340px;
  overflow: hidden;

  & + & {
    margin-top: 10px;
  }

  .mc-transaction-inner {
    display: flex;
    align-items: center;
    padding: 14px 16px;
    border-radius: var(--mc-border-radius-l);
    background: var(--mc-background-color-darkest);
    width: 100%;
  }

  .tx-link {
    color: var(--mc-text-color);
  }

  &.success {
    background: var(--mc-color-success-gradient);

    .mc-transaction-content {
      .content-wrapper {
        .content {
          color: #09c0a0;
        }
      }
    }

    .icon-box {
      color: var(--mc-color-success);
    }
  }

  &.error {
    background: var(--mc-color-error-gradient);

    .mc-transaction-content {
      .content-wrapper {
        .content {
          color: var(--mc-color-error);
        }
      }
    }

    .icon-box {
      color: var(--mc-color-error);
    }
  }

  .icon-box {
    height: 24px;
    width: 24px;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: var(--mc-icon-color-light);

    .icon-bg {
      height: 24px;
      width: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;

      i {
        line-height: 25px;
      }
    }

    .fantasy-loading {
      animation: 2s linear infinite svg-animation;
      max-width: 100px;
    }

    @keyframes svg-animation {
      0% {
        transform: rotateZ(0deg);
      }
      100% {
        transform: rotateZ(360deg);
      }
    }
  }

  .close-btn {
    position: relative;
    height: 30px;
    width: 30px;
    font-size: 16px;
    font-weight: bold;
    text-align: center;
    color: var(--mc-icon-color-light);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.75;

    &:hover {
      opacity: 1;
    }

    .timer {
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
    }

    .iconfont {
      color: var(--mc-text-color-white);
    }
  }

  .mc-transaction-content {
    flex: 1;
    padding-left: 16px;
    font-size: 14px;
    line-height: 20px;

    .content-wrapper {
      margin-bottom: 4px;

      .content {
        color: var(--mc-text-color-white);
      }

      .tx-link {
        font-size: 13px;
        color: var(--mc-icon-color-light);
        margin-left: 6px;
        font-weight: bold;
      }
    }

    .time {
      color: var(--mc-text-color-dark);
      font-size: 12px;
      line-height: 16px;
      opacity: 0.5;
    }
  }
}
</style>
