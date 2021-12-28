<template>
  <el-dialog
    append-to-body
    top="0"
    custom-class="is-round is-small gas-fee-rebate-history-dialog"
    :close-on-click-modal="false"
    :visible.sync="currentVisible"
    @closed="dialogClosed"
  >
    <template slot="title">
      <i class="iconfont icon-left2-back" @click="currentVisible=false"></i>
      {{ $t('gasFeeRebate.historyTitle') }}
    </template>
    <div class="dialog-container">
      <div class="tip-text" v-if="recentClaimEpoch">
        {{ $t('gasFeeRebate.prompts.claimTimeTip', {id: recentClaimEpoch.id+1}).toString() }}
        <span class="value">{{ recentClaimEpoch.claimTimestamp | timestampFormatter('MMM D, YYYY') }}</span>
      </div>
      <div class="table-box">
        <div class="table-header table-row">
          <div class="table-line-item">{{ $t('gasFeeRebate.week') }} #</div>
          <div class="table-line-item">{{ $t('gasFeeRebate.gasSpent') }}</div>
          <div class="table-line-item">
            <el-tooltip :content="$t('gasFeeRebate.prompts.rebatedClaimed')" placement="top" :open-delay="400">
              <span>{{ $t('gasFeeRebate.rebatedClaimed') }}</span>
            </el-tooltip>
          </div>
        </div>
        <div class="table-body">
          <McLoading
            :mask-color="'transparent'"
            :show-loading="loadingData || claimableHistoryInfoLoading"
            :min-show-time="500"
            :hide-content="loadingData || claimableHistoryInfoLoading"
            :show-loading-text="false"
          >
            <template v-if="accountHistoryData.length === 0">
              <McNoData></McNoData>
            </template>
            <template v-else>
              <div class="table-row" v-for="(item, index) in accountHistoryData" :key="index">
                <div class="table-line-item">
                  <el-tooltip placement="top" :open-delay="400">
                    <span slot="content">
                      {{ item.startTimestamp | timestampFormatter('MMM D, YYYY') }} -
                      {{ item.endTimestamp | timestampFormatter('MMM D, YYYY') }}
                    </span>
                    <span>{{ item.weekId }}</span>
                  </el-tooltip>

                </div>
                <div class="table-line-item">
                  {{ item.gas | bigNumberFormatterTruncateByPrecision(6, 2, 3) }}
                  <img :src="currentChainConfig.symbol | tokenIconUrlFormatter" alt="">
                </div>
                <div class="table-line-item">
                  <el-tooltip placement="top" :open-delay="400">
                    <span slot="content">
                      {{ $t('gasFeeRebate.prompts.price', {price: getRebatePriceView(item.epoch)}).toString() }}
                    </span>
                    <span>{{ getRebatedValue(item.epoch) | bigNumberFormatterTruncateByPrecision(6, 2, 3) }}
                      / {{ getClaimedValue(item.epoch) | bigNumberFormatterTruncateByPrecision(6, 2, 3) }}</span>
                  </el-tooltip>
                  <img :src="require('@/assets/img/tokens/SATORI.svg')" alt="">
                </div>
              </div>
            </template>
          </McLoading>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script lang='ts'>
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import { currentChainConfig } from '@/config/chain'
import { GasFeeRebateHistoryMixin } from '@/template/components/GasFeeRebate/gasFeeRebateHistoryMixin'
import { McLoading, McNoData } from '@/components'

@Component({
  components: {
    McLoading,
    McNoData,
  }
})
export default class GasFeeRebateHistoryDialog extends Mixins(GasFeeRebateHistoryMixin) {
  @Prop({ default: false }) visible!: boolean

  get currentVisible() {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
  }

  get currentChainConfig() {
    return currentChainConfig
  }

  dialogClosed() {
    this.accountEpochsInfo = {}
    this.accountHistoryData = []
    this.claimableHistoryInfo = {}
  }

  @Watch('currentVisible', { immediate: true })
  async onVisibleChanged() {
    if (this.currentVisible) {
      await Promise.all([
        this.updateHistoryData(),
        this.initialClaimableHistoryInfo()
      ])
    }
  }
}
</script>

<style lang='scss' scoped>
.gas-fee-rebate-history-dialog {
  ::v-deep &.is-small {
    min-height: 317px;
    width: 400px;
    padding: 16px 0 0 0;

    .el-dialog__header {
      display: inline-flex;
      align-items: center;

      .icon-left2-back {
        font-size: 16px;
        margin-right: 16px;
        cursor: pointer;
        color: var(--mc-text-color-white);
      }
    }
  }

  .dialog-container {

    .tip-text {
      margin-bottom: 8px;
      font-size: 14px;
      color: var(--mc-text-color);

      .value {
        color: var(--mc-text-color-white);
      }
    }

    .table-box {
      .table-row {
        display: flex;
        align-items: center;
        justify-content: space-around;

        .table-line-item {
          display: inline-flex;
          justify-content: left;
          align-items: center;

          &:nth-of-type(1) {
            width: 29%;
          }

          &:nth-of-type(2) {
            width: 39%;
          }

          &:nth-of-type(3) {
            width: 32%;
          }

          img {
            height: 18px;
            width: 18px;
            margin-left: 4px;
          }
        }
      }

      .table-header {
        border-bottom: 1px solid var(--mc-border-color);

        &.table-row {
          height: 36px;
          font-size: 14px;
          color: var(--mc-text-color);

          .table-line-item {
            line-height: 20px;
          }
        }
      }

      .table-body {
        overflow-y: auto;
        height: 208px;

        .table-row {
          height: 52px;
          border-bottom: 1px solid var(--mc-border-color);
          &:last-child {
            border-bottom: unset;
          }
        }

        .table-line-item:nth-of-type(3) {
          justify-content: right;
        }
      }
    }

    .mc-loading {
      height: 100%;
      width: 100%;
    }

    .no-data {
      height: 100%;
    }
  }
}
</style>
