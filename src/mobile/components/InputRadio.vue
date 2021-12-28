<template>
  <div class="input-radio">
    <div class="input-radio-group">
      <div class="input-radio-item" v-for="(item, index) in items" :key="item" @click="setSelectedValue(item)"
           :class="{ 'is-selected': item === value&&hasSelectedValue, 'start-item': index===0 }"
           :style="{ width: `${radioItemWidth}%` }"
      >
        {{ item }}{{ suffix }}
      </div>
      <div class="input-radio-item end-item custom-input-item" :style="{ width: `${radioItemWidth}%` }"
           :class="{ 'is-selected': !hasSelectedValue }">
        <McMNumberField v-model="inputValue" class="custom-input" :fixed-dom="fixedDom"
                        @click="useCustom = true" @focus="isFocusCustom = true" @blur="isFocusCustom = false">
          <span slot="right-icon" v-if="suffix !== ''">{{ suffix }}</span>
        </McMNumberField>
      </div>
    </div>
    <div class="error-line" v-if="showErrorLine && validateHasError">
      <div  v-for="(item, index) in validateMessages" :key="index">{{ item }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import McMNumberField from './NumberField.vue'

@Component({
  components: {
    McMNumberField,
  }
})
export default class InputRadio extends Vue {
  @Prop({ required: true }) value !: string | number
  @Prop({ required: true }) items !: (string | number)[]
  @Prop({ default: '' }) suffix !: string
  @Prop({ default: '' }) defaultVal !: string | number
  @Prop({ default: () => [] }) validateMessages !: string[]
  @Prop({ default: () => null }) fixedDom !: any
  @Prop({ default: false }) showErrorLine !: boolean

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

  get radioItemWidth(): number {
    return 100 / this.items.length
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

  @Watch('value')
  onValueChanged() {
    if (!this.hasSelectedValue && !this.isFocusCustom) {
      this.useCustom = true
      this.inputValue = this.value
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
@import "~@mcdex/style/common/var";

.input-radio {
  .input-radio-group {
    display: flex;
    justify-content: space-around;

    .input-radio-item {
      width: 100%;
      display: flex;
      height: 40px;
      line-height: 40px;
      margin: 0 4px;
      background: var(--mc-background-color);
      font-size: 14px;
      font-weight: 400;
      color: var(--mc-text-color-white);
      border-radius: 12px;
      align-items: center;
      justify-content: center;
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
      color: var(--mc-color-primary);
    }

    .custom-input-item {
      position: relative;

      .custom-input {
        text-align: center;
        padding: 0 12px;
        width: 100%;

        ::v-deep {
          .van-cell {
            border: unset;
            text-align: center;
            padding: 0;
            height: 40px;
            line-height: 40px;
          }
          .van-field__control {
            text-align: center;
          }

          .van-field__right-icon {
            color: var(--mc-text-color-white);
            font-size: 14px;
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
        ::v-deep {
          .van-field__control, .van-field__right-icon {
            color: var(--mc-color-primary) !important;
          }
        }
      }
    }
  }

  .error-line {
    div {
      margin-top: 8px;
      padding: 12px 16px;
      font-size: 14px;
      color: var(--mc-color-error);
      background: rgba($--mc-color-error, 0.1);
      border-radius: var(--mc-border-radius-l);
    }
  }
}
</style>
