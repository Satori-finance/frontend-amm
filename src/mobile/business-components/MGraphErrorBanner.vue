<template>
  <div>
    <van-popup
      class="safe-area-inset-bottom graph-error-banner"
      position="bottom"
      round closeable
      safe-area-inset-bottom
      v-model="isShowBanner">
      <div class="head-title">
        <img class="warn-svg" src="@/assets/img/Warning.svg" alt=''>
        <div>{{ $t('graphBanner.notice') }}</div>
      </div>
      <div class="text">
        <span v-html="$t('graphBanner.graphErrorText',
          { graphBlockNumber: graphBlockNumber,currentBlockNumber: currentBlockNumber})">
        </span>
        <span v-if="behindBlock >= 0" v-html="$t('graphBanner.graphErrorBehindText',
          { behindBlock: behindBlock})">
        </span>
      </div>

      <van-checkbox v-model="isDontShow" class="mc-mobile__checkbox">
        {{ $t('orderConfirmDialog.donShow') }}
        <template #icon="props">
          <div class="selected box" v-if="props.checked">
            <i class="iconfont icon-select"></i>
          </div>
          <div class="un-selected box" v-else></div>
        </template>
      </van-checkbox>
    </van-popup>
  </div>
</template>
<script lang="ts">
import { Component, Mixins, Vue } from 'vue-property-decorator'
import GraphErrorBannerMixin from '@/business-components/GraphErrorBanner/GraphErrorBannerMixin'

@Component
export default class MGraphErrorBanner extends Mixins(GraphErrorBannerMixin) {

  init() {
    this.checkGraphBlock()
  }

  close() {
    this.isShowBanner = false
  }
}
</script>
<style lang="scss" scoped>

.graph-error-banner {
  &.van-popup {
    padding: 16px;
    background: linear-gradient(0deg, rgba(255, 177, 16, 0.1), rgba(255, 177, 16, 0.1)), #0A1024;
  }

  .head-title {
    font-size: 18px;
    line-height: 24px;
    display: flex;
    align-items: center;
    color: var(--mc-color-warning);

    .warn-svg {
      width: 24px;
      height: 24px;
      margin-right: 8px;
    }
  }

  .text {
    margin-top: 28px;
    font-size: 14px;
    line-height: 20px;
    color: var(--mc-color-warning);
    margin-bottom: 12px;
  }

  ::v-deep {
    .van-popup__close-icon--top-right {
      color: var(--mc-color-warning);
    }

    .van-checkbox__label {
      color: var(--mc-text-color-white);
      font-size: 14px;
      line-height: 20px;
    }
  }
}
</style>
