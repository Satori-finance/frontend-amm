<template>
  <div class="graph-error-banner" v-if="isShowBanner">
    <div class="content-box">
      <div class="text">
        <span v-html="$t('graphBanner.graphErrorText',
          { graphBlockNumber: graphBlockNumber,currentBlockNumber: currentBlockNumber})">
        </span>
        <span v-if="behindBlock >= 0" v-html="$t('graphBanner.graphErrorBehindText',
          { behindBlock: behindBlock})">
        </span>
      </div>
      <div class="right">
        <i class="iconfont icon-close-bold" @click="close" />
        <el-checkbox v-model="isDontShow">{{ $t('orderConfirmDialog.donShow') }}</el-checkbox>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import GraphErrorBannerMixin from '@/business-components/GraphErrorBanner/GraphErrorBannerMixin'

@Component
export default class GraphErrorBanner extends Mixins(GraphErrorBannerMixin) {

  init() {
    this.checkGraphBlock()
  }

  close() {
    this.isShowBanner = false
  }
}
</script>
<style lang="scss" scoped>

$layout-breakpoint-medium: 897px;
$layout-breakpoint-small: 603px;
.graph-error-banner {
  max-width: 865px;
  position: fixed;
  bottom: 49px;
  left: 0;
  right: 0;
  transform: translate(0, 0);
  margin-left: auto;
  margin-right: auto;
  z-index: 999;
  padding: 16px;
  border-radius: 12px;
  background: linear-gradient(0deg, rgba(255, 177, 16, 0.1), rgba(255, 177, 16, 0.1)), #0A1024;

  .content-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    .text {
      width: 76%;
      color: var(--mc-color-warning);
      font-size: 14px;
      line-height: 20px;
    }

    .right {
      height: 60px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: flex-end;

      ::v-deep {
        .el-checkbox__label {
          padding-left: 8px;
          font-size: 14px;
          line-height: 20px;
        }
      }

      .icon-close-bold {
        color: var(--mc-color-warning);
        cursor: pointer;
      }
    }
  }
}
@media (max-width: $layout-breakpoint-medium) {
  .graph-error-banner {

  }
}
@media (max-width: $layout-breakpoint-small) {
  .graph-error-banner {


  }
}
</style>
