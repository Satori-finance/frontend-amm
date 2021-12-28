<template>
  <div class="mcm-simple-slider" :class="{'show-label': !hideLabel}">
    <VueSlider v-model="currentValue"
               :min="min"
               :max="max"
               :interval="step"
               :marks="marks"
               :hide-label="hideLabel"
               :dot-size="[18, 16]"
               :adsorb="true"
               :disabled="disabled"
               :tooltip="showTooltip ? 'active': 'none'"
               :height="4"
               :tooltip-placement="tooltipPlacement"
               :tooltip-style="tooltipStyle"
               :tooltip-formatter="tooltipFormatter === ''?tooltipFormatterFunc:tooltipFormatter">
      <template v-slot:dot>
        <img src="@/assets/img/slider-dot.svg" alt="" class="custom-dot">
      </template>
      <template v-slot:step="{ label, active }">
        <img v-if="active" src="@/assets/img/slider-point-active.svg" alt=""
             :class="['mc-simple-slider__point', { active }]">
        <img v-else src="@/assets/img/slider-point-mobile.svg" alt="" :class="['mc-simple-slider__point', { active }]">
      </template>
    </VueSlider>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/default.css'
import { MarksProp, TooltipFormatter } from 'vue-slider-component/typings/typings'
import { Value } from 'vue-slider-component/lib/typings'
import { formatBigNumber } from '@/utils'

@Component({
  components: {
    VueSlider,
  },
})
export default class McMSimpleSlider extends Vue {
  @Prop({ default: 100 }) private max!: number
  @Prop({ default: 0 }) private value!: number
  @Prop({ default: 0 }) private min!: number
  @Prop({ default: 1 }) private step!: number
  @Prop({ default: false }) private disabled!: boolean
  @Prop({ default: true }) private showTooltip !: boolean
  @Prop({ default: () => [0, 20, 40, 60, 80, 100] }) private marks!: MarksProp[]
  @Prop({ default: true }) private hideLabel!: boolean
  @Prop({ default: 'top' }) private tooltipPlacement!: 'top' | 'bottom'
  @Prop({ default: '' }) private tooltipFormatter!: TooltipFormatter | TooltipFormatter[]
  @Prop({ default: '' }) private tooltipUnit !: string
  @Prop({
    default: () => {
      return { background: 'none' }
    },
  }) private tooltipStyle!: Object

  get currentValue() {
    return this.value.toString()
  }

  tooltipFormatterFunc(v: Value): string {
    return `${formatBigNumber(v, 0)}${this.tooltipUnit}`
  }

  set currentValue(e: string) {
    this.$emit('input', parseInt(e))
  }

  get range() {
    return this.max - this.min
  }
}
</script>

<style lang="scss" scoped>
.mcm-simple-slider {
  position: relative;
  width: 100%;
  height: 16px;
  display: flex;
  align-items: center;

  &.show-label {
    height: 44px;
    padding-bottom: 20px;
  }

  .vue-slider {
    flex: 1;
    padding: 6px 0!important;

    ::v-deep {
      .vue-slider-dot-tooltip-inner {
        font-size: 12px;

        &::after {
          display: none;
        }
      }

      .vue-slider-dot-tooltip-top {
        top: 0;
      }

      .vue-slider-dot-tooltip-bottom {
        bottom: 0;
      }

      .vue-slider-rail {
        height: 4px;
        border-radius: 4px;
        background-color: #232B48;

        .vue-slider-process {
          background: linear-gradient(90deg, #99B8D4 0%, #B2CFE1 100%);
        }

        .vue-slider-marks {
          .vue-slider-mark-label {
            margin-top: 10px;
            font-size: 14px;
            line-height: 20px;
            color: var(--mc-text-color);
          }
        }
      }
    }

    .custom-dot {
      cursor: pointer;
      width: 100%;
      height: 100%;
    }
  }

  .mc-simple-slider__point {
    position: absolute;
    top: calc(50% - 9px);
    left: calc(50% - 9.5px);
    height: 18px;
    width: 19px;
    z-index: 1;
    cursor: pointer;
  }
}

</style>

<style lang="scss" scoped>
.satori-fantasy {
  .mcm-simple-slider {
    .vue-slider {
      ::v-deep {
        .vue-slider-process {
          background: var(--mc-color-primary-gradient);
        }
      }
    }
  }
}
</style>
