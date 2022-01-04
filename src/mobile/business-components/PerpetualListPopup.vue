<template>
  <div>
    <van-popup
      class="perpetual-list-popup safe-area-inset-bottom" safe-area-inset-bottom
      v-model="showPopup" round position="bottom" closeable>
      <div class="popup-header">{{ $t('base.perpetualContracts') }}</div>
      <div class="popup-container" :class="{'no-data-container': perpetuals.length === 0}">
        <template v-if="perpetuals.length > 0">
          <div class="perpetual-item" v-for="(p, index) in perpetuals" @click="goTrade(parseInt(p.symbol))"
               :class="perpetuals.length > 2 && index <= perpetuals.length-2?'item-border':''">
            <McMTokenImageView :size="32" :token="p.underlying" />
            <div class="name">{{ p.underlying }}-{{ collateral }}</div>
          </div>
        </template>
        <template v-else>
          <McMNoData></McMNoData>
        </template>
      </div>
    </van-popup>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Perpetual } from '@/type'
import { McMTokenImageView, McMNoData } from '@/mobile/components'
import { padLeft } from '@/utils'
import { DEFAULT_SYMBOL_LENGTH } from '@/const'
import { ROUTE } from '@/mobile/router'

@Component({
  components: {
    McMTokenImageView,
    McMNoData,
  }
})
export default class PerpetualListPopup extends Vue {
  @Prop({ required: true }) visible !: boolean
  @Prop({ default: () => [] }) perpetuals!: Perpetual[]
  @Prop({ required: true }) collateral!: string

  get showPopup(): boolean {
    return this.visible
  }

  set showPopup(val: boolean) {
    this.$emit('update:visible', val)
  }

  private goTrade(symbol: number) {
    const symbolStr = padLeft(symbol, DEFAULT_SYMBOL_LENGTH)
    this.$router.push({ name: ROUTE.TRADE_MAIN, params: { symbol: symbolStr } })
  }
}
</script>

<style lang="scss" scoped>

  ::v-deep {
    .van-popup {
      padding: 16px;
      background-color: var(--mc-background-color-dark);
      min-height: 120px;
      max-height: 491px;
    }

    .van-popup__close-icon {
      color: var(--mc-text-color-white);
    }
  }

  .popup-container {
    margin: 28px 0 34px;
    font-size: 12px;
    line-height: 18px;
    display: flex;
    flex-wrap: wrap;

    &.no-data-container {
      align-items: center;
      margin: 96px 0 80px;

      .no-data {
        width: 100%;
      }
    }

    .item-border {
      border-bottom: 1px solid var(--mc-text-color-darkest);
    }

    .perpetual-item {
      width: 50%;
      height: 64px;
      display: flex;
      justify-content: left;
      align-items: center;

      .name {
        color: var(--mc-color-primary);
        font-size: 14px;
        line-height: 20px;
        margin-left: 8px;
      }
    }
  }

</style>
