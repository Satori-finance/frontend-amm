<template>
  <van-popup class="margin-change-risk-notice safe-area-inset-bottom"
             v-model="currentVisible"
             position="bottom"
             round
             safe-area-inset-bottom>
      <span class='head-title'>
        <span class="warn-svg">
          <img src="@/assets/img/Warning.svg" alt="" />
        </span>
        {{ $t('perpetualRiskNotice.riskNotice') }}
      </span>
      <div class='container'>
        <div class="text-box">{{ $t('marginChangeRiskDialog.message') }}</div>
        <div class="tag-tip">
          <i class="iconfont icon-warning-triangle"></i>
          {{ $t('marginChangeRiskDialog.tagTip') }}
        </div>
        <div class='confirm-btn'>
          <van-button class="round" size="large" @click='onConfirmEvent'>
            {{ $t('marginChangeRiskDialog.buttonTip') }}
          </van-button>
        </div>
      </div>
  </van-popup>
</template>

<script lang='ts'>
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { PerpetualCombinedState } from '@/type'
import { getLocalStorage, setLocalStorage } from "@/utils"
import { noticePool, noticeAccount, noticeStorageKey } from '@/business-components/MarginChangeRiskNotice/noticeConfig'
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
@import '~@mcdex/style/common/var';

.margin-change-risk-notice {
  background-color: var(--mc-background-color);
  padding: 14px 16px 16px 16px;
  height: 316px;

  .head-title {
    font-size: 18px;
    line-height: 24px;
    font-weight: 700;
    display: flex;
    align-items: center;

    .warn-svg {
      margin-right: 8px;
    }

    img {
      width: 24px;
      height: 24px;
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
      margin-top: 20px;
      background: rgba($--mc-color-warning, 0.1);
      color: var(--mc-color-warning);
      padding: 4px 8px;
      font-size: 12px;
      border-radius: var(--mc-border-radius-m);
    }

    .confirm-btn {
      margin-top: 48px;
    }
  }
}
</style>
