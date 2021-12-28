<template>
  <div class="number-field">
    <van-field :value="showValue" type="number" readonly clickable :disabled="disabled" autocomplete="off"
               :placeholder="placeholder" @click="onOpenShowKeyBoard" :unselectable="disabled">
      <slot name="left-icon" slot="left-icon"></slot>
      <slot name="right-icon" slot="right-icon"></slot>
    </van-field>
    <van-field :value="value" readonly v-show="false" :rules="rules" :name="name" />
    <van-number-keyboard
        ref="keyboardRef"
        theme="custom"
        v-model="inputValue"
        :show="showKeyboard"
        :extra-key="['.']"
        :close-button-text="$t('base.confirm')"
        @blur="onBlurEvent"
        @show="onShowKeyboardEvent"
        @hide="onHideKeyBoardEvent"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import BigNumber from 'bignumber.js'

@Component
export default class NumberField extends Vue {
  @Prop({ required: true }) value !: string | number
  @Prop({ default: '' }) placeholder!: any
  @Prop({ default: false }) disabled !: boolean
  @Prop({ default: () => [] }) rules !: any[]
  @Prop({ default: () => null }) fixedDom !: any
  @Prop({ default: '' }) name !: string

  private showKeyboard: boolean = false
  private defaultPaddingBottom: string = '0'
  private fixedDomHTML: HTMLElement | null = null

  get formattedValue() {
    return this.disabled ? new BigNumber(this.value).toFormat() : this.value
  }

  onOpenShowKeyBoard() {
    if (!this.disabled) {
      this.showKeyboard = !this.showKeyboard
    } else {
      this.showKeyboard = false
    }
  }

  get fixedDomIsHTMLElement(): boolean {
    return this.fixedDom && this.fixedDom instanceof HTMLElement
  }

  mounted() {
    if (this.fixedDom) {
      if (this.fixedDomIsHTMLElement) {
        this.fixedDomHTML = this.fixedDom
      } else  {
        this.fixedDomHTML = this.fixedDom.$el
      }
      if (this.fixedDomHTML) {
        this.defaultPaddingBottom = this.fixedDomHTML.style.paddingBottom
      }
    }
  }

  destroyed() {
    this.onHideKeyBoardEvent()
  }

  get showValue() {
    const sValue = this.value.toString()
    let prefix: string = sValue
    let suffix: string = ''
    let prefixValue = prefix
    if (!sValue.startsWith('.')) {
      const decimalPlacesIndex: number = sValue.indexOf('.')
      if (decimalPlacesIndex > -1) {
        prefix = sValue.slice(0, decimalPlacesIndex)
        suffix = sValue.slice(decimalPlacesIndex, sValue.length)
      }
      const normalizePrefixValue = new BigNumber(prefix)
      prefixValue = !normalizePrefixValue.isNaN() ? normalizePrefixValue.toFormat() : sValue
    }
    if (this.showKeyboard) {
      return `${prefixValue}${suffix}|`
    }
    return `${prefixValue}${suffix}`
  }

  get inputValue(): string | number {
    return this.value
  }

  set inputValue(val: string | number) {
    this.updateValue(val)
  }

  updateValue(val: string | number) {
    let newVal = val
    if (Number(newVal) === 0 && val.toString().indexOf('.') < 0 && val !== '') {
      newVal = '0'
    }
    this.$emit('input', newVal)
  }

  onShowKeyboardEvent() {
    this.$emit('focus')
    if (!this.fixedDomHTML) {
      return
    }
    const defaultPaddingBottom = this.defaultPaddingBottom.split('px')[0]
    const keyboardHeight = (this.$refs.keyboardRef as any).$el.offsetHeight
    this.fixedDomHTML.style.paddingBottom = `${keyboardHeight+Number(defaultPaddingBottom)}px`
  }

  onHideKeyBoardEvent() {
    if (!this.fixedDomHTML) {
      return
    }
    this.fixedDomHTML.style.paddingBottom = this.defaultPaddingBottom
  }

  onBlurEvent() {
    this.showKeyboard = false
    this.$emit('blur')
  }
}
</script>

<style scoped lang="scss">
.number-field {
  ::v-deep {
    .van-cell::after {
      border-bottom: unset;
    }

    .van-number-keyboard {
      .van-number-keyboard__keys {
        .van-key__wrapper {
          .van-key {
            color: var(--mc-background-color-dark);
          }
        }
      }

      .van-number-keyboard__sidebar {
        .van-key--delete {
          color: var(--mc-background-color-dark);
        }
      }
    }
  }
}
</style>
