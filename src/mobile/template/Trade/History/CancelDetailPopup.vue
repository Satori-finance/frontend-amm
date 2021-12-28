<template>
  <div class="cancel-detail-popup">
    <van-popup v-model="showPopup" round position="bottom" closeable
               class="safe-area-inset-bottom" safe-area-inset-bottom>
      <div class="popup-header">{{ $t('cancelDetail.title') }}</div>
      <div class="popup-container">
        <div class="data-head">
          <van-row>
            <van-col span="8" class="block">
              <div>{{ $t('cancelDetail.time') }}</div>
            </van-col>
            <van-col span="8" class="block">
              <div>{{ $t('cancelDetail.amount') }}</div>
            </van-col>
            <van-col span="8" class="block is-right">
              <div>{{ $t('cancelDetail.reason') }}</div>
            </van-col>
          </van-row>
        </div>
        <div v-if="orderItem == null" class="empty-container">
          <McMNoData />
        </div>
        <div v-else class="data-body" v-for="(item, index) in orderItem.cancelReasons" :key="index">
          <van-row>
            <van-col span="8" class="block">
              <div class="value">
                {{ item.canceledAt.unix() | i18nTimeFormatter($i18n.locale, 'day') }}
                <span class="newline">
                  {{ item.canceledAt.unix() | i18nTimeFormatter($i18n.locale, 'time') }}
                </span>
              </div>
            </van-col>
            <van-col span="8" class="block">
              <div class="value">{{ item.amount | bigNumberFormatter(decimals) | negativeFormatter(decimals) }}
                {{ orderItem.perpetualProperty.contractSymbol }}</div>
            </van-col>
            <van-col span="8" class="block">
              <div class="value is-right">{{ getCancelReason(item.reason) }}</div>
            </van-col>
          </van-row>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import OrderHistoryMixin, { TableData } from '@/template/components/Order/orderHistoryMixin'
import { McMNoData } from '@/mobile/components'
import BigNumber from 'bignumber.js'

@Component({
  components: {
    McMNoData,
  },
  filters: {
    negativeFormatter(val: string, decimals: number) {
      if (!val || !Number(val)) {
        return val
      }
      if (Number(val) < 0) {
        val = `- ${(Number(val) * -1).toFixed(decimals)}`
      }
      return val
    },
  }
})
export default class CancelDetailPopup extends Mixins(OrderHistoryMixin) {
  @Prop({ required: true }) visible !: boolean
  @Prop({ required: true, default: null }) orderItem!: TableData | null

  get showPopup(): boolean {
    return this.visible
  }

  set showPopup(val: boolean) {
    this.$emit('update:visible', val)
  }

  get decimals() {
    return this.orderItem ? this.orderItem.perpetualProperty.underlyingAssetFormatDecimals : 0
  }

  getCancelReason(val: string) {
    const output = 'cancelDetail.' + val
    return this.$t(output)
  }
}
</script>

<style lang="scss" scoped>
.cancel-detail-popup {
  ::v-deep {
    .van-popup {
      padding: 16px;
      min-height: 500px;
      max-height: 523px;
    }

    .van-popup__close-icon {
      color: var(--mc-text-color-white);
    }
  }

  .popup-container {
    margin: 28px 0 39px;
    font-size: 12px;
    line-height: 18px;

    .data-head {
      padding: 8px 0;
      font-size: 14px;
      line-height: 20px;
      color: var(--mc-text-color);
      border-bottom: 1px solid #1A2136;
    }

    .data-body {
      padding: 16px 0;
      border-bottom: 1px solid #1A2136;

      .value {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        height: 44px;
        font-size: 14px;
        line-height: 20px;

        .newline {
          display: block;
        }
      }
    }

    .is-right {
      text-align: right;
      justify-content: flex-end;
    }
  }
}
</style>
