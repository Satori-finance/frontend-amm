<template>
  <div class='margin-change-risk-notice'>
    <el-dialog
      :visible.sync="currentVisible"
      append-to-body
      top='0'
      custom-class="is-small is-round"
      :close-on-click-modal="false"
      :show-close="false"
      :title="$t('marginChangeRiskDialog.title')"
    >
      <div slot="title" class="head">
        <span class="warn-svg">
          <img src="@/assets/img/Warning.svg" alt="" />
        </span>
        <span class="head-title">{{ $t('perpetualRiskNotice.riskNotice') }}</span>
      </div>
      <div class="container">
        <div class="text-box">{{ $t('marginChangeRiskDialog.message') }}</div>
        <div class="tag-tip">
          <i class="iconfont icon-warning-triangle"></i>
          {{ $t('marginChangeRiskDialog.tagTip') }}
        </div>
        <div class="confirm-button">
          <el-button size="large" @click="onConfirmEvent">
            {{ $t('marginChangeRiskDialog.buttonTip') }}
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script lang='ts'>
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { PerpetualCombinedState } from '@/type'
import { getLocalStorage, setLocalStorage } from "@/utils"
import { noticePool, noticeAccount, noticeStorageKey } from './noticeConfig'
import { namespace } from 'vuex-class'

const wallet = namespace('wallet')

@Component
export default class MarginChangeRiskNotice extends Vue {
  @Prop({ required: true }) selectedPerpetual !: PerpetualCombinedState | null
  @wallet.Getter('address') address !: string

  private currentVisible: boolean = false

  getIsRememberNotice(): boolean {
    return getLocalStorage(noticeStorageKey)
  }

  @Watch('selectedPerpetual')
  onSelectedPerpetualChanged() {
    if (!this.selectedPerpetual || !this.address) {
      this.currentVisible = false
      return
    }
    const isRememberNotice = this.getIsRememberNotice()
    const isNoticePool = noticePool.indexOf(this.selectedPerpetual.perpetualProperty.liquidityPoolAddress.toLowerCase())
    if (isRememberNotice || isNoticePool === -1) {
      this.currentVisible = false
      return
    }
    const accountIsInNoticeList = noticeAccount.indexOf(this.address.toLowerCase())
    if (accountIsInNoticeList > -1) {
      this.currentVisible = true
    }
  }

  onConfirmEvent() {
    setLocalStorage(noticeStorageKey, true)
    this.currentVisible = false
  }
}
</script>

<style scoped lang='scss'>
@import '~@mcdex/style/common/fantasy-var';

::v-deep .el-dialog {
  padding: 16px;
  &.is-small {
    height: 324px;
  }

  .el-dialog__header {
    padding: 0 0 28px;
  }

  .el-dialog__body {
    padding: 0;
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
    .text-box {
      font-size: 14px;
      color: var(--mc-text-color-white);
      line-height: 20px;
    }

    .tag-tip {
      display: inline-block;
      margin-top: 28px;
      background: rgba($--mc-color-warning, 0.1);
      color: var(--mc-color-warning);
      padding: 4px 8px;
      font-size: 12px;
      border-radius: var(--mc-border-radius-m);
    }

    .confirm-button {
      margin-top: 32px;
      .el-button {
        height: 56px;
        width: 100%;
        border-radius: var(--mc-border-radius-l);
      }
    }
  }
}
</style>

