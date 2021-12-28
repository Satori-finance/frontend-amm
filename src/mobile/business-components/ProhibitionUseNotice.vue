<template>
  <van-popup class="prohibition-use-notice safe-area-inset-bottom"
             v-model="currentVisible"
             position="bottom"
             :close-on-click-overlay='false'
             round
             safe-area-inset-bottom>
    <div class="head">
      <span class="warn-svg">
        <img src="@/assets/img/Warning.svg" alt="" />
      </span>
      <span class="head-title" v-html="$t('prohibitionUseNotice.prohibitNotice')"></span>
    </div>

    <div class="container">
      <div class="warn-text">
        <span class="text" v-html="$t('prohibitionUseNotice.riskNoticeFirstText')"></span>
        <span class="text" v-html="$t('prohibitionUseNotice.riskNoticeSecondText')"></span>
      </div>

      <div class="info">
        <span class="countries" v-html="$t('prohibitionUseNotice.countries')"></span>
      </div>
      <div class="button-zone">
        <div class="understand">
          <van-checkbox v-model="isCheckKnow" class="mc-mobile__checkbox">
            {{ $t('prohibitionUseNotice.understand') }}
            <template #icon="props">
              <div class="selected box" v-if="props.checked">
                <i class="iconfont icon-select"></i>
              </div>
              <div class="un-selected box" v-else></div>
            </template>
          </van-checkbox>
        </div>

        <div class="confirm-btn">
          <van-button class="round" :disabled="isDisabledButton" size="large" @click="confirmEvent">
            {{ $t('base.confirm') }}
          </van-button>
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script lang='ts'>
import { Component, Vue, Watch } from 'vue-property-decorator'
import { getLocalStorage, setLocalStorage } from '@/utils'
import { PROHIBIT_NOTICE_POP_UP } from '@/constants'
import { namespace } from 'vuex-class'
const wallet = namespace('wallet')

@Component({})
export default class ProhibitionUseNotice extends Vue {
  @wallet.Getter('address') walletAddress!: string
  protected currentVisible: boolean = false
  protected isCheckKnow: boolean = false

  get isDisabledButton(): boolean {
    return !this.isCheckKnow
  }

  init() {
    const visible = getLocalStorage(PROHIBIT_NOTICE_POP_UP) !== 'prohibited'
    this.currentVisible = visible
    if (!visible) {
      this.$emit('close')
    }
  }

  confirmEvent() {
    if (this.isCheckKnow) {
      setLocalStorage(PROHIBIT_NOTICE_POP_UP, 'prohibited')
    }
    this.isCheckKnow = false
    this.currentVisible = false
    this.$emit('close')
  }
}
</script>

<style scoped lang='scss'>
@import '~@mcdex/style/common/var';
.prohibition-use-notice {
  padding: 14px 16px 50px 16px;

  .head {
    display: flex;

    .warn-svg {
      img {
        width: 24px;
      }
    }

    .head-title {
      margin-left: 8px;
      font-size: 18px;
      line-height: 24px;
    }
  }

  .container {
    max-height: calc(100vh - 56px);
    margin-top: 28px;
    line-height: 20px;
    overflow-y: auto;

    .warn-text {
      display: flex;
      flex-direction: column;

      .text {
        width: 100%;
        font-size: 14px;
        line-height: 20px;

        &:last-child {
          margin-top: 12px;
        }
      }
    }

    .info {
      max-height: 272px;
      border-radius: 12px;
      padding: 16px;
      margin-top: 8px;
      background: var(--mc-background-color-darkest);
      overflow: auto;

      .countries {
        display: block;
        font-size: 14px;
        line-height: 20px;
        color: var(--mc-text-color);
      }
    }

    .button-zone {
      margin-top: 24px;

      .understand {
        ::v-deep.van-checkbox__label {
          font-size: 14px;
          line-height: 16px;
          color: var(--mc-text-color-white);
          margin-left: 8px;
        }
      }

      .confirm-btn {
        margin-top: 16px;

        .van-button {
          height: 56px;
          border-radius: 12px;
          font-size: 16px;
        }
      }
    }
  }
}
</style>
