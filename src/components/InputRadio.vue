<template>
  <div class="input-radio">
    <div class="input-radio-group">
      <div class="input-radio-item" v-for="(item, index) in items" :key="item" @click="setSelectedValue(item)"
           :class="{ 'is-selected': item === value&&hasSelectedValue, 'start-item': index===0, 'disabled': disabled }"
           :style="{ width: `${((100-(100/(items.length+1)+5))/items.length)-2}%` }"
      >
        {{ item }}{{ suffix }}
      </div>
      <div class="input-radio-item end-item custom-input-item" :style="{ width: `${100/(items.length+1)+5}%` }"
           :class="{ 'is-selected': !hasSelectedValue, 'error': !hasSelectedValue && validateHasError, 'disabled': disabled }">
        <el-input v-model="inputValue" :placeholder="$t('base.custom')" @click="useCustom = true"
                  @focus="isFocusCustom = true" @blur="isFocusCustom = false" :disabled="disabled">
          <span slot="suffix" v-if="(isFocusCustom || inputValue)&&suffix !== ''">{{ suffix }}</span>
        </el-input>
      </div>
    </div>
    <div v-for="(msg, index) in validateMessages" class="error-msg-line" :key="index">{{ msg }}</div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'

@Component
export default class InputRadio extends Vue {
  @Prop({ required: true }) value !: string | number
  @Prop({ required: true }) items !: (string | number)[]
  @Prop({ default: '' }) suffix !: string
  @Prop({ default: '' }) defaultVal !: string | number
  @Prop({ default: () => [] }) validateMessages !: string[]
  @Prop({ default: false }) disabled !: boolean

  private isFocusCustom = false
  private useCustom = false
  private inputValue: string | number = ''

  private propDefaultVal = this.defaultVal

  get hasSelectedValue(): boolean {
    if (this.isFocusCustom) {
      return false
    }
    return this.items.indexOf(this.value) > -1
  }

  get validateHasError(): boolean {
    if (this.validateMessages.length <= 0) {
      return false
    }
    for (let i=0;i<this.validateMessages.length;i++) {
      if(this.validateMessages[i] !== '') {
        return true
      }
    }
    return false
  }

  @Watch('value')
  onValueChanged() {
    if (!this.hasSelectedValue && !this.isFocusCustom) {
      this.useCustom = true
      this.inputValue = this.value
    }
  }

  @Watch('isFocusCustom', { immediate: true })
  onIsFocusCustomChange() {
    if (this.isFocusCustom) {
      this.useCustom = true
      this.setSelectedValue(this.inputValue)
    }
    this.onInputHasErrors()
  }

  onInputHasErrors() {
    if(this.validateHasError) {
      if (this.propDefaultVal === '' && this.items.length > 0){
        this.$emit('input', this.items[0])
        return
      }
      this.$emit('input', this.propDefaultVal)
    }
  }

  @Watch('inputValue')
  setSelectedValue(value: string | number) {
    if (this.disabled) {
      return
    }
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
  .input-radio-group {
    display: flex;
    justify-content: space-around;

    .input-radio-item {
      width: 100%;
      display: inline-block;
      text-align: center;
      height: 40px;
      line-height: 40px;
      margin: 0 6px;
      background: var(--mc-background-color-dark-light);
      font-size: 16px;
      font-weight: 400;
      color: var(--mc-text-color-white);
      border-radius: 12px;
      align-items: center;
      cursor: pointer;
    }

    .start-item {
      margin-left: 0;
    }

    .end-item {
      margin-right: 0;
    }

    .is-selected {
      height: 40px;
      line-height: 40px;
      // common not define
      background: linear-gradient(90deg, #86ABCB 0%, #A6C8DD 100%);
    }

    .disabled {
      cursor: not-allowed;
      opacity: 0.5;

      &::v-deep .el-input__inner {
        cursor: not-allowed;
      }
    }

    .error {
      border: 1px solid var(--mc-color-error);
    }

    .custom-input-item {
      position: relative;

      .custom-input {
        text-align: center;
        padding: 0 8px;
        width: 100%;

        ::v-deep {
          .van-cell {
            border: unset;
            text-align: center;
          }
          .van-field__control {
            text-align: center;
          }
        }
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
        background: var(--mc-background-color-dark-light);
      }
    }
  }

  ::v-deep {
    .el-input {
      background: var(--mc-background-color-dark-light);
      height: 36px;
      border-radius: 12px;
      font-size: 16px;
      border: unset;

      .el-input__inner {
        height: 36px;
        line-height: 36px;
        text-align: center;
      }

      .el-input__suffix-inner {
        color: var(--mc-text-color-white);
      }
    }
  }

  .error-msg-line {
    line-height: 18px;
    color: var(--mc-color-error);
    font-size: 12px;
    margin-left: 6px;
    margin-top: 4px;
  }
}
</style>
