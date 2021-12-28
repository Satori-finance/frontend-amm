<template>
  <div>
    <el-dialog
      append-to-body
      top="0"
      custom-class="mini-round-dialog"
      class="uniswap-fee-selector-dialog"
      :close-on-click-modal="false"
      :visible.sync="currentVisible"
      @close="close"
    >
      <template #title>
        <div class="uniswap-fee-selector-dialog-title">
          <div class="left"><i class="iconfont icon-left" @click="currentVisible = false"></i></div>
          <span class="title">{{ $t('newContract.poolFee') }}</span>
          <div class="right"></div>
        </div>
      </template>

      <div class="list">
        <div class="list-item" @click="selectFee(fee)" :class="{selected: fee === selectedFee}" v-for="fee in fees"
             :key="fee">{{ getFee(fee) }}
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { FeeAmount } from '@uniswap/v3-sdk'
import { toBigNumber } from '@/utils'

@Component
export default class UniswapFeeSelectorDialog extends Vue {
  @Prop({ default: false }) visible!: boolean
  @Prop({ default: () => null }) value!: number | null

  private selectedFee: number | null = null

  get currentVisible() {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
  }

  get fees() {
    return [FeeAmount.LOW, FeeAmount.MEDIUM, FeeAmount.HIGH]
  }

  private getFee(fee: number) {
    return `${toBigNumber(fee).div(10000).toFixed()}%`
  }

  private selectFee(fee: number) {
    this.selectedFee = fee
    this.currentVisible = false
  }

  private close() {
    this.$emit('input', this.selectedFee)
    this.$emit('close')
  }

  @Watch('value', { immediate: true })
  private onValueChange() {
    this.selectedFee = this.value
  }
}
</script>

<style lang="scss" scoped>
.uniswap-fee-selector-dialog {
  ::v-deep .el-dialog {
    width: 400px;
    padding-left: 0;
    padding-right: 0;
    min-height: auto;

    .el-dialog__header {
      margin-left: 16px;
      margin-right: 16px;
    }
  }
}
</style>

<style lang="scss" scoped>
.uniswap-fee-selector-dialog {
  .uniswap-fee-selector-dialog-title {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .left, .right {
      flex: 1;

      .iconfont {
        cursor: pointer;
      }
    }
  }

  .list {
    .list-item {
      height: 56px;
      padding: 0 16px;
      display: flex;
      align-items: center;
      cursor: pointer;

      &.selected {
        background-color: var(--mc-background-color-light);
        pointer-events: none;
      }

      &:hover {
        background-color: var(--mc-background-color-light);
      }
    }
  }
}
</style>

