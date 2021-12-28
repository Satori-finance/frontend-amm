<template>
  <div class="node-status-viewer" :class="[status]">
    <div class="left">
      <span class="status"></span>
      <span class="label">
        <span v-if="!hasError">{{ $t('nodeStatus.stable') }}</span>
        <span v-if="nodeErrorNum">
          {{ nodeErrorMessage }}
          <el-tooltip placement="top" :content="$t('nodeStatus.nodeErrorPrompt')">
            <span class="tooltip-box">
              <img src="@/assets/img/warning-help.svg" alt="">
            </span>
          </el-tooltip>
        </span>
        <span v-if="graphError">
          {{ $t('nodeStatus.graphErrorMessage') }}
          <el-tooltip placement="top" :content="$t('nodeStatus.graphErrorPrompt')">
            <span class="tooltip-box">
              <img src="@/assets/img/warning-help.svg" alt="">
            </span>
          </el-tooltip>
        </span>
        <span v-if="relayerError">
          {{ $t('nodeStatus.relayerErrorMessage') }}
          <el-tooltip placement="top" :content="$t('nodeStatus.relayerErrorPrompt')">
            <span class="tooltip-box">
              <img src="@/assets/img/warning-help.svg" alt="">
            </span>
          </el-tooltip>
        </span>
        <span v-if="priceChartError">
          {{ $t('nodeStatus.chartServiceErrorMessage') }}
          <el-tooltip placement="top" :content="$t('nodeStatus.relayerErrorPrompt')">
            <span class="tooltip-box">
              <img src="@/assets/img/warning-help.svg" alt="">
            </span>
          </el-tooltip>
        </span>
        <span v-if="wsError">
          {{ $t('nodeStatus.wsErrorMessage') }}
          <el-tooltip placement="top" :content="$t('nodeStatus.wsErrorPrompt')">
            <span class="tooltip-box">
              <img src="@/assets/img/warning-help.svg" alt="">
            </span>
          </el-tooltip>
        </span>
      </span>
    </div>

    <div class="right">
      <i class="iconfont icon-warning-triangle"></i>
      {{ arbNetworkId === networkId ? $t('nodeStatus.betaMessage') : $t('nodeStatus.bscBetaMessage') }}
    </div>
  </div>
</template>

<script lang='ts'>
import { Component, Mixins } from 'vue-property-decorator'
import { NodeServerErrorMixin } from '@/mixins'

@Component
export default class NodeStatusViewer extends Mixins(NodeServerErrorMixin) {
}
</script>

<style lang="scss" scoped>
@import "~@mcdex/style/common/fantasy-var";

.node-status-viewer {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  line-height: 16px;
  padding: 0 16px;

  .left {
    display: flex;
    align-items: center;
  }

  .status {
    height: 6px;
    width: 6px;
    border-radius: 50%;
    background-color: var(--mc-color-success);
    margin-right: 8px;
  }

  .label {
    display: inline-flex;
    align-items: center;
    color: var(--mc-color-success);

    > span {
      display: inline-flex;
      align-items: center;

      &:not(:last-of-type) {
        margin-right: 2px;

        &:after {
          content: ';';
        }
      }
    }

    .tooltip-box {
      margin: 0 2px;
      height: 13px;
      width: 13px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background-color: rgba($--mc-color-warning, 0.5);
    }
  }

  &.warning {
    .status {
      background-color: var(--mc-color-warning);
    }

    .label {
      color: var(--mc-color-warning);
    }
  }

  &.error {
    .status {
      background-color: var(--mc-color-error);
    }

    .label {
      color: var(--mc-color-error);
    }
  }

  .right {
    display: flex;
    align-items: center;

    .icon-warning-triangle {
      font-size: 16px;
      color: var(--mc-color-warning);
      margin-right: 8px;
    }
  }
}
</style>

<style scoped lang="scss">
.satori-fantasy {
  .node-status-viewer {
    background-color: var(--mc-background-color-darkest);
  }
}
</style>

<style scoped lang="scss">
.dex-theme-dark {
  .node-status-viewer {
    background-color: var(--mc-background-color);
  }
}
</style>
