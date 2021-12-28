<template>
  <div class="input-radio">
    <div v-if="label" class="label">
      <el-tooltip v-if="labelTooltip !== ''" :content="labelTooltip" placement="top">
        <span class="tip-text">{{ label }}</span>
      </el-tooltip>
      <span class="tip-text" v-else>{{ label }}</span>
    </div>
    <div class="input-radio-group">
      <div class="input-radio-item" v-for="(item, index) in items" :key="item" @click="setSelectedValue(item)"
           :class="{ 'is-selected': item === value&&hasSelectedValue }"
           :style="{ width: `${radioItemWidth}%` }">
        {{ item }}<span :style="{ marginLeft: `${suffixMargin}px`}">{{ suffix }}</span>
      </div>
      <div class="input-radio-item custom-input-item" v-if="useCustomInput" :style="{ width: `${radioItemWidth}%` }"
           :class="{ 'is-selected': !hasSelectedValue}">
        <el-input v-model="inputValue"
                  @focus="useCustom = true; isFocusCustom = true" @blur="isFocusCustom = false">
          <span slot="suffix" v-if="suffix !== ''" :class="{ 'focus-custom-suffix': isFocusCustom }">{{ suffix }}</span>
        </el-input>
      </div>
    </div>
    <InputErrors v-if="useCustomInput" :errors="errors" />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import InputErrors from '@/components/Input/InputErrors.vue'

@Component({
  components: {
    InputErrors,
  }
})
export default class McRadio extends Vue {
  @Prop({ required: true }) value !: string | number
  @Prop({ default: '' }) private label!: string
  @Prop({ default: '' }) private labelTooltip!: string
  @Prop({ required: true }) items !: (string | number)[]
  @Prop({ default: true }) useCustomInput !: boolean
  @Prop({ default: '' }) suffix !: string
  @Prop({ default: 0 }) suffixMargin !: number
  @Prop({ default: '' }) defaultVal !: string | number
  @Prop({ default: () => [] }) errors!: Array<string | number>

  private isFocusCustom = false
  private useCustom = false
  private inputValue: string | number = ''

  private propDefaultVal = this.defaultVal

  get radioItemWidth(): number {
    return 100 / this.items.length
  }

  get hasSelectedValue(): boolean {
    if (this.isFocusCustom) {
      return false
    }
    return this.items.indexOf(this.value) > -1
  }

  @Watch('isFocusCustom', { immediate: true })
  onIsFocusCustomChange() {
    if (this.isFocusCustom) {
      this.useCustom = true
      this.setSelectedValue(this.inputValue)
    }
    this.onInputHasErrors()
  }

  @Watch('value')
  onValueChanged() {
    if (!this.hasSelectedValue && !this.isFocusCustom) {
      this.useCustom = true
      this.inputValue = this.value
    }
  }

  onInputHasErrors() {
    if(this.errors.length > 0) {
      if (this.propDefaultVal === '' && this.items.length > 0){
        this.$emit('input', this.items[0])
        return
      }
      this.$emit('input', this.propDefaultVal)
    }
  }

  @Watch('inputValue')
  setSelectedValue(value: string | number) {
    if (value === '') {
      if (this.propDefaultVal === '' && this.items.length > 0){
        this.$emit('input', this.items[0])
        return
      }
      this.$emit('input', this.propDefaultVal)
      return
    }
    this.$emit('input', value)
  }
}
</script>

<style scoped lang="scss">
.input-radio {
  .label {
    font-size: 12px;
    font-weight: normal;
    color: var(--mc-text-color);
    .tip-text {
      display: inline-block;
      line-height: 16px;
    }
  }

  .input-radio-group {
    display: flex;
    justify-content: space-around;
    margin-top: 4px;
    align-items: center;
    cursor: pointer;

    .input-radio-item {
      cursor: pointer;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 32px;
      margin: 0 4px;
      background: var(--mc-background-color);
      font-size: 12px;
      font-weight: 400;
      color: var(--mc-text-color-white);
      border-radius: 8px;

      &:hover {
        color: var(--mc-color-primary);
      }

      &:first-child {
        margin-left: 0;
      }

      &:last-child {
        margin-right: 0;
      }
    }

    .is-selected {
      color: var(--mc-color-primary);
    }

    .custom-input-item {
      position: relative;

      ::v-deep {
        .el-input__inner {
          font-size: 12px;
        }
      }

      .custom-input {
        text-align: center;
        padding: 0 8px;
        width: 100%;
      }

      .input-suffix {
        position: absolute;
        right: 5%;
      }

      .custom-label {
        color: var(--mc-text-color);
      }

      &.is-selected {
        border: 1px solid var(--mc-color-primary);
        ::v-deep .el-input {
          .el-input__inner {
            color: var(--mc-color-primary);
          }

          .el-input__suffix-inner {
            color: var(--mc-color-primary);
          }
        }
      }
    }
  }

  ::v-deep {
    .el-input {
      height: 30px;
      border-radius: 8px;
      font-size: 13px;
      border: unset;
      background-color: var(--mc-background-color);

      .el-input__inner {
        height: 30px;
        line-height: 32px;
        text-align: center;
        padding: 0;
        font-size: 12px;
      }

      .el-input__suffix-inner {
        color: var(--mc-text-color-white);
        font-size: 12px;
      }
    }
  }
}
</style>
