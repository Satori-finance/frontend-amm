<template>
  <div class="change-margin-dialog">
    <van-popup
      v-model="currentVisible"
      closeable
      round
      class="safe-area-inset-bottom"
      safe-area-inset-bottom
      position="bottom"
      @closed="closePopUp"
      :close-on-click-overlay="false"
    >
      <div class="popup-header">
        <div>{{ $t('base.changeMargin') }} {{ perpetualName }}</div>
        <div v-if="isInverse" class="inverse">{{ $t('base.inverse') }}</div>
      </div>
      <PerpetualMargin :currentVisible="currentVisible" :perpetualID="currentPerpetualID" :selectedRadio.sync="operateType" ref="perpetualMargin" />
    </van-popup>
  </div>
</template>

<script lang='ts'>
import { Component, Ref, Vue } from 'vue-property-decorator'
import PerpetualMargin from './PerpetualMargin.vue'
import { ACCOUNT_EVENT, VUE_EVENT_BUS } from '@/event'
import { PerpetualCombinedState } from '@/type'
import { namespace } from 'vuex-class'

const perpetual = namespace('perpetual')

@Component({
  components: {
    PerpetualMargin
  },
})
export default class ChangeMarginPopup extends Vue {
  @perpetual.Getter('getPerpetualFunc') getPerpetualFunc!: (perpetualId: string) => PerpetualCombinedState | null

  private currentVisible: boolean = false
  private currentPerpetualID: string = ''
  public operateType: string = ''

  @Ref('perpetualMargin') perpetualMargin!: PerpetualMargin

  mounted() {
    VUE_EVENT_BUS.on(ACCOUNT_EVENT.CHANGE_MARGIN, (data: { perpetualID: string, type: string }) => {
      this.currentPerpetualID = data.perpetualID
      this.operateType = data.type
      this.currentVisible = true
    })

  }

  destroyed() {
    VUE_EVENT_BUS.off(ACCOUNT_EVENT.CHANGE_MARGIN, (data: { perpetualID: string, type: string }) => {
      this.currentPerpetualID = data.perpetualID
      this.operateType = data.type
      this.currentVisible = true
    })
  }

  closePopUp() {
    this.perpetualMargin.reSetBaseDate()
  }

  get perpetualName() {
    return this.selectedPerpetual?.perpetualProperty.name || ''
  }

  get isInverse() {
    return this.selectedPerpetual?.perpetualProperty.isInverse || false
  }

  get selectedPerpetual(): PerpetualCombinedState | null {
    if (!this.getPerpetualFunc || !this.currentPerpetualID) {
      return null
    }
    try {
      return this.getPerpetualFunc(this.currentPerpetualID) || null
    } catch (e) {
      console.warn(e)
      return null
    }
  }
}
</script>

<style lang='scss' scoped>
@import '~@mcdex/style/common/var';

.change-margin-dialog {
  ::v-deep .van-popup {
    padding: 16px;
    min-height: 500px;
    max-height: 618px;

    .popup-header {
      display: flex;
      align-items: center;

      .inverse {
        width: 56px;
        height: 22px;
        font-size: 12px;
        line-height: 14px;
        color: var(--mc-color-orange);
        background: rgba($--mc-color-orange, 0.1);
        border: 1px solid rgba($--mc-color-orange, 0.1);
        padding: 3px 7px;
        border-radius: 8px;
        font-weight: 400;
        margin-left: 4px;
      }
    }
  }

  .perpetual-margin {
    margin-top: 28px;
  }
}
</style>
