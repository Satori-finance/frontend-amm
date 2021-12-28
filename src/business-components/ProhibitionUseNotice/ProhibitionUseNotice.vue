<template>
  <div class="prohibition-use-notice">
    <el-dialog
      :visible.sync="currentVisible"
      append-to-body
      top="0"
      custom-class="is-small is-round"
      :show-close="showClo"
      :close-on-click-modal="closeModal"
      :close-on-press-escape="closePressEsc"
    >
      <div slot="title" class="head">
        <span class="warn-svg">
          <img src="@/assets/img/Warning.svg" alt="" />
        </span>
        <span class="head-title">{{ $t('prohibitionUseNotice.prohibitNotice') }}</span>
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
            <el-checkbox v-model="isCheckKnow">{{ $t('prohibitionUseNotice.understand') }}</el-checkbox>
          </div>

          <div class="confirm-btn">
            <el-button @click="confirmEvent" :disabled="isDisabledButton">
              {{ $t('base.confirm') }}
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
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
  private showClo: boolean = false
  private closeModal: boolean = false
  private closePressEsc: boolean = false

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

::v-deep .el-dialog {
  border-radius: 12px;
  padding: 16px;

  .el-dialog__header {
    padding: 0 0 28px 0;
  }

  .el-dialog__body {
    display: flex;
    flex-direction: column;
    padding: 0;
  }
}
.head {
  display: flex;
  .warn-svg {
    display: flex;
    justify-content: center;
    align-items: center;
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
  line-height: 20px;
  flex: 1;
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
    border-radius: 12px;
    padding: 16px;
    margin-top: 8px;
    overflow: auto;
    word-break: keep-all;
    .countries {
      display: block;
      font-size: 14px;
      line-height: 20px;
    }
  }

  .button-zone {
    flex: 1;
    margin-top: 24px;
    display: flex;
    flex-direction: column;
    .understand {
      flex: 1;
      align-items: center;
      display: flex;
      ::v-deep.el-checkbox {
        span {
          font-size: 14px;
          line-height: 20px;
        }

        .el-checkbox__label {
          padding-left: 8px;
        }
      }
    }

    .confirm-btn {
      flex: 1;
      margin-top: 12px;
      .el-button {
        width: 100%;
        height: 56px;
        border-radius: 12px;
      }
    }
  }
}
</style>

<style scoped lang="scss">
.satori-fantasy {
  .container {
    .info {
      background: var(--mc-background-color-darkest);

      .countries {
        color: var(--mc-text-color);
      }
    }

    .button-zone {
      .understand {
        ::v-deep.el-checkbox {
          span {
            color: var(--mc-text-color-white);
          }

          .el-checkbox__input {
            border-color: var(--mc-text-color);
          }
        }
      }
    }
  }
}
</style>
