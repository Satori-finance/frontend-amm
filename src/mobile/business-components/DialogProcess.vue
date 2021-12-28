<template>
  <div>
    <PerpetualRiskNotice ref="risk" />
    <LegalTip ref="legal" @close="initPerpetualRiskNotice" />
    <ProhibitionUseNotice ref="prohibition" @close="initLegalBanner" />
    <MGraphErrorBanner ref="graph" />
  </div>
</template>
<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator'
import ProhibitionUseNotice from './ProhibitionUseNotice.vue'
import PerpetualRiskNotice from './PerpetualRiskNotice.vue'
import LegalTip from './LegalTip.vue'
import MGraphErrorBanner from './MGraphErrorBanner.vue'

@Component({
  components: {
    PerpetualRiskNotice,
    LegalTip,
    ProhibitionUseNotice,
    MGraphErrorBanner,
  }
})
export default class DialogProcess extends Vue {
  @Ref('prohibition') prohibition!: ProhibitionUseNotice
  @Ref('legal') legal!: LegalTip
  @Ref('risk') risk!: PerpetualRiskNotice
  @Ref('graph') graph!: MGraphErrorBanner

  mounted() {
    this.initGraphErrorBanner()
    this.initProhibitionNotice()
  }

  private initProhibitionNotice() {
    this.prohibition.init()
  }

  private initLegalBanner() {
    this.legal.init()
  }

  private initPerpetualRiskNotice() {
    this.risk.init()
  }

  private initGraphErrorBanner() {
    this.graph.init()
  }
}
</script>
<style lang="scss" scoped>

</style>
