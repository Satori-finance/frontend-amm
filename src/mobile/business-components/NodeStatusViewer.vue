<template>
  <div class="node-status-viewer" :class="[status]">
    <div class="left">
      <span class="status"></span>
      <span class="label">
        <span v-if="!hasError">{{ $t('nodeStatus.stable') }}</span>
        <span v-if="nodeErrorNum">
          {{ nodeErrorMessage }}
          <McMTooltip placement="top" :content="$t('nodeStatus.nodeErrorPrompt')">
            <span class="tooltip-box">
              <img src="@/assets/img/warning-help.svg" alt="">
            </span>
          </McMTooltip>
        </span>
        <span v-if="graphError">
          {{ $t('nodeStatus.graphErrorMessage') }}
          <McMTooltip placement="top" :content="$t('nodeStatus.graphErrorPrompt')">
            <span class="tooltip-box">
              <img src="@/assets/img/warning-help.svg" alt="">
            </span>
          </McMTooltip>
        </span>
        <span v-if="relayerError">
          {{ $t('nodeStatus.relayerErrorMessage') }}
          <McMTooltip placement="top" :content="$t('nodeStatus.relayerErrorPrompt')">
            <span class="tooltip-box">
              <img src="@/assets/img/warning-help.svg" alt="">
            </span>
          </McMTooltip>
        </span>
        <span v-if="priceChartError">
          {{ $t('nodeStatus.chartServiceErrorMessage') }}
          <McMTooltip placement="top" :content="$t('nodeStatus.relayerErrorPrompt')">
            <span class="tooltip-box">
              <img src="@/assets/img/warning-help.svg" alt="">
            </span>
          </McMTooltip>
        </span>
        <span v-if="wsError">
          {{ $t('nodeStatus.wsErrorMessage') }}
          <McMTooltip placement="top" :content="$t('nodeStatus.wsErrorPrompt')">
            <span class="tooltip-box">
              <img src="@/assets/img/warning-help.svg" alt="">
            </span>
          </McMTooltip>
        </span>
      </span>
    </div>

    <div class="right"></div>
  </div>
</template>

<script lang='ts'>
import { Component, Mixins } from 'vue-property-decorator'
import { NodeServerErrorMixin } from '@/mixins'
import { McMTooltip } from '@/mobile/components'

@Component({
  components: {
    McMTooltip
  }
})
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
  border-top: 1px solid var(--mc-border-color);

  .mcm-tooltip-wrapper {
    margin-left: 4px;
  }

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
