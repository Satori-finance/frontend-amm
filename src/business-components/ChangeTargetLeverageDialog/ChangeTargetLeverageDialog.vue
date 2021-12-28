<template>
  <transition name="fade">
    <el-dialog
      @close="reset"
      custom-class="is-small is-round change-target-leverage-dialog"
      append-to-body
      top="0"
      :visible.sync="visible"
      :close-on-click-modal="false">
      <div slot="title">
        <span class="dialog-title">
          {{ title }}
          <span class="inverse-card"
                v-if="perpetual ? perpetual.perpetualProperty.isInverse : false">{{ $t('base.inverse') }}</span>
        </span>
      </div>
      <McLoading :show-loading="loading" :hide-content="true" :mask-color="'transparent'" :show-loading-text="false">
        <div class="content-box">
          <div class="leverage-info">
            <span>{{ $t('base.leverage') }}</span>
            <span>
              <el-tooltip :content="$t('status.maximumLeverage')" placement="top" :open-delay="400">
                <span class="tip-text">{{ $t('base.maximumLeverage') }}:</span>
              </el-tooltip>
              <span class="value"> {{ maxLeverage | bigNumberFormatter(0) }}X</span>
            </span>
          </div>
          <div class="input-box">
            <el-input-number v-model="leverage" :min="minNormalizeLeverage" :step-strictly="true" :precision="0"
                             :max="maxNormalizeLeverage" @input.native="onLeverageInput"></el-input-number>
          </div>
          <div class="slider-box">
            <McSimpleSlider :hide-label="false" :min="minNormalizeLeverage" :max="maxNormalizeLeverage"
                            v-model="leverage"
                            :marks="marks" tooltip-formatter="{value}X" :show-tooltip="false"/>
          </div>
          <div class="button-box">
            <el-button :disabled="disableChangeTargetLeverage" :loading="setting" size="medium" type="primary"
                       @click="onConfirm">{{ $t('base.confirm') }}
            </el-button>
          </div>
        </div>
      </McLoading>
    </el-dialog>
  </transition>
</template>

<script lang='ts'>
import { Component, Mixins, Watch } from 'vue-property-decorator'
import { ChangeTargetLeverageMixin } from './ChangeTargetLeverageMixin'
import { McLoading, McSimpleSlider } from '@/components'
import { MarksProp } from 'vue-slider-component/typings/typings'
import { ErrorHandlerMixin } from '@/mixins'
import { COMMON_EVENT, VUE_EVENT_BUS } from '@/event'

@Component({
  components: {
    McSimpleSlider,
    McLoading,
  },
})
export default class ChangeTargetLeverageDialog extends Mixins(ChangeTargetLeverageMixin, ErrorHandlerMixin) {
  private visible: boolean = false

  get marks(): MarksProp {
    return {
      [this.minNormalizeLeverage.toString()]: {
        label: this.minNormalizeLeverage.toFixed() + 'X',
      },
      [this.maxNormalizeLeverage.toString()]: {
        label: this.maxNormalizeLeverage.toFixed() + 'X',
      },
    }
  }

  mounted() {
    VUE_EVENT_BUS.on(COMMON_EVENT.CHANGE_TARGET_LEVERAGE, this.showDialog)
  }

  destroyed() {
    VUE_EVENT_BUS.off(COMMON_EVENT.CHANGE_TARGET_LEVERAGE, this.showDialog)
  }

  showDialog(id: string) {
    this.setPerpetualID(id)
    this.visible = true
  }

  onLeverageInput(evt: UIEvent) {
    this.leverage = (evt.target as any).value as string
  }

  async onConfirm() {
    this.setTargetLeverage()
    this.visible = false
  }

  @Watch('visible')
  onVisibleChange() {
    if (this.visible) {
      this.loadData()
    }
  }
}
</script>

<style lang="scss" scoped>

.dialog-title {
  display: flex;
  align-items: center;
}

.change-target-leverage-dialog {

  .mc-loading {
    position: unset;
    height: 90%;
    width: 100%;

    ::v-deep .mc-loading__mask {
      top: 52px;
    }
  }

  ::v-deep &.is-small {
    min-height: 318px;
  }

  .content-box {
    margin-top: 12px;

    .leverage-info {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      color: var(--mc-text-color);
      margin-bottom: 8px;
    }

    .input-box {
      margin-bottom: 24px;

      ::v-deep.el-input-number {
        width: 100%;
        line-height: 60px;

        .el-input {
          height: 62px;
          border-radius: 12px;
        }

        .el-input__inner {
          height: 62px;
          line-height: 62px;
          font-size: 24px;
          font-weight: 700;
        }

        .el-input-number__decrease, .el-input-number__increase {
          background: var(--mc-background-color);
          font-size: 20px;
        }

        [class^=el-icon-] {
          font-weight: 600;
        }

        .el-input-number__decrease {
          border-radius: 12px 0 0 12px;
        }

        .el-input-number__increase {
          border-radius: 0 12px 12px 0;
        }
      }
    }

    .slider-box {
      padding: 0 3px;
      margin-bottom: 24px;
    }

    .button-box {
      padding: 2px;

      .el-button {
        width: 100%;
        height: 56px;
        border-radius: var(--mc-border-radius-l);
        font-size: 16px;
      }
    }
  }
}
</style>
