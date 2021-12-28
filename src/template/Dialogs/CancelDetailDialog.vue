<template>
  <div class="cancle-detail-dialog">
    <el-dialog :title="cancleDialogTitle" :visible.sync="currentVisible" top="0">
      <div class="table-box">
        <table class="mc-data-table">
          <thead>
            <tr>
              <th class="is-left">
                <span>{{ $t('cancelDetail.time') }}</span>
              </th>
              <th class="is-left">
                <span>{{ $t('cancelDetail.amount') }}</span>
              </th>
              <th class="is-right">
                <span>{{ $t('cancelDetail.reason') }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in activeCancelReason" :key="index">
              <td class="is-left">
                <div class="cell">
                  {{ item.canceledAt.unix() | i18nTimeFormatter($i18n.locale, 'day') }}
                  <span class="newline">
                    {{ item.canceledAt.unix() | i18nTimeFormatter($i18n.locale, 'time') }}
                  </span>
                </div>
              </td>
              <td class="is-left">
                <div class="cell">
                  <div class="newline">
                    <span>{{ item.amount.abs() | bigNumberFormatter(amountFormatDecimals) }}</span>
                    <span class="symbol">{{ underlyingAssetSymbol }}</span>
                  </div>

                </div>
              </td>
              <td class="is-right">
                <div class="cell">
                  <span>{{ getCancelReason(item.reason) }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { OrderCancelReason } from '@/type/validatable/orderStruct'
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'

@Component
export default class CancelDetailDialog extends Vue {
  @Prop({ default: false }) visible!: boolean
  @Prop({ default: [] }) activeCancelReason!: Array<OrderCancelReason>
  @Prop({ default: 0 }) amountFormatDecimals!: number
  @Prop({ default: '' }) underlyingAssetSymbol!: string

  get cancleDialogTitle() {
    return this.$t('cancelDetail.title')
  }

  get currentVisible() {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
  }

  getCancelReason(val: string) {
    var output = 'cancelDetail.' + val
    return this.$t(output)
  }

  dialogClosed() {
    this.$emit('update:visible', false)
  }
}
</script>
<style lang="scss" scoped>
.cancle-detail-dialog {
  ::v-deep .el-dialog {
    height: 527px;
    width: 400px;
    background: #12182c;
    border: 1px solid #242d43;
    border-radius: 12px;
    box-sizing: border-box;

    .el-dialog__body {
      padding-top: 20px;
      padding-left: 16px;
      padding-right: 16px;
      .el-dialog {
        padding: 16px 0;
      }
    }
  }

  .mc-data-table {
    font-size: 14px;
    border-collapse: collapse;
    width: 100%;
    th {
      background-color: var(--mc-background-color-dark);
      color: var(--mc-text-color);
    }

    tr {
      text-align: center;
      width: 368px;
      height: 32px;
    }
    td {
      .newline {
        display: flex;
        align-items: center;
      }
      .symbol {
        margin-left: 6px;
      }
    }
    .cell {
      width: 100%;
      height: 100%;
      padding: 8px 0 11px 0;
      line-height: 16px;
      display: flex;
      justify-content: space-around;
      flex-direction: column;
    }
    tbody td {
      height: 60px;
    }
    thead th,
    tbody td {
      margin: 0 8px;
      &:nth-child(1) {
        width: 23.8%;
      }
      &:nth-child(2) {
        width: 35.7%;
      }
      &:nth-child(3) {
        width: 41.5%;
      }
    }
  }
}
</style>
