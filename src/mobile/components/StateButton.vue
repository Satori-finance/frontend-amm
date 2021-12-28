<template>
  <div class="state-button">
    <van-button :class="buttonClass" :disabled="isDisabledButton" v-click-outside="onclickOutside" @click="onClickEvent">
      <slot>{{ buttonContext }}</slot>
      <span class="state">
        <i class="iconfont icon-loading-bold" v-if="state==='loading'"></i>
        <i class="iconfont icon-success-bold" v-if="state==='success'"></i>
        <i class="iconfont icon-fail-bold" v-if="state==='fail'"></i>
      </span>
    </van-button>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { ButtonState } from '@/type'

@Component
export default class StateButton extends Vue {
  @Prop({ required: true, default: '' }) state !: ButtonState
  @Prop({ default: () => [] }) buttonClass !: string[]
  @Prop({ default: '' }) buttonContext !: any
  @Prop({ default: false }) disabled !: boolean

  get isDisabledButton(): boolean {
    return this.state === 'loading' || this.disabled
  }

  onclickOutside() {
    if (this.state !== 'loading') {
      this.$emit('update:state', '')
    }
  }

  onClickEvent() {
    this.$emit('update:state', '')
    this.$emit('click')
  }
}
</script>

<style scoped lang="scss">
.state-button {
  display: inline-block;
  width: 100%;

  ::v-deep .van-button {
    width: 100%;
  }

  .state {
    display: inline-block;
    margin-left: 4px;

    .icon-loading-bold {
      display: inline-block;
      animation: rotating 2s linear infinite;
    }
  }

  ::v-deep {
    .van-button--normal {
      padding: 0;
    }
  }
}
</style>
