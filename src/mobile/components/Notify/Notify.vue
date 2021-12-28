<template>
  <van-popup class="mcm-notify safe-area-inset-bottom"
             :class="[type, className, position]" :value="value"
             :position="position"
             :overlay="false"
             safe-area-inset-bottom
             :duration="0.2"
             :lock-scroll="false">
    <div class="title" v-if="title">
      <span>{{ title }}</span>
      <i @click="$el.remove()" class="iconfont icon-bold-colse"></i>
    </div>
    <div class="message" :class="{'left-message': title || this.position === 'bottom' }">
      {{ message }}
    </div>
  </van-popup>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { NotifyParams } from '@/mobile/components/Notify/notify'

@Component
export default class Notify extends Vue {
  value: boolean = true
  type: 'danger' | 'success' | 'warning' | 'info' = 'info'
  message: string = ''
  duration = 200
  className = ''
  title: string = ''
  position: 'bottom' | 'top' = 'top'

  setData(data: NotifyParams) {
    this.type = data.type || 'info'
    this.message = data.message
    this.value = !!data.value
    this.duration = data.duration === undefined ? 200 : data.duration
    this.className = data.className || ''
    this.title = data.title || ''
    this.position = data.position || 'top'
  }

  hide() {
    this.value = false
  }
}
</script>

<style lang="scss" scoped>
.mcm-notify {
  color: var(--mc-text-color-white);
  width: calc(100% - 16px);
  padding: 16px 16px;
  border-radius: var(--mc-border-radius-l);
  z-index: 9999 !important;

  ::v-deep .van-popup__close-icon {
    font-size: 16px;
    color: var(--mc-text-color-white);
  }

  &.top {
    margin: 8px 8px 0 8px;
  }

  &.bottom {
    margin: 0 8px 41px 8px;
  }

  &.success {
    background-color: var(--mc-color-success);
  }

  &.danger {
    background-color: var(--mc-color-error);
  }

  &.warning {
    background-color: var(--mc-color-warning);
  }

  &.info {
    background-color: var(--mc-color-primary);
  }

  .title {
    font-size: 16px;
    line-height: 22px;
    margin-bottom: 4px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .icon-bold-colse {
      font-size: 16px;
      opacity: 0.75;
    }
  }

  .message {
    display: flex;
    font-size: 14px;
    line-height: 20px;
    opacity: 0.8;

    &.left-message {
      justify-content: left;
    }
  }
}
</style>
