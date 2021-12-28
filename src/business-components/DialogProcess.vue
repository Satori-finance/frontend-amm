<template>
  <div>
    <PerpetualRiskNotice ref="risk" />
    <LegalBanner ref="legal" @close="initPerpetualRiskNotice" />
    <ProhibitionUseNotice ref="prohibition" @close="initLegalBanner" />
    <GraphErrorBanner ref="graph" />
  </div>
</template>
<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator'
import ProhibitionUseNotice from './ProhibitionUseNotice/ProhibitionUseNotice.vue'
import PerpetualRiskNotice from './PerpetualRiskNotice/PerpetualRiskNotice.vue'
import LegalBanner from './LegalBanner.vue'
import GraphErrorBanner from './GraphErrorBanner/GraphErrorBanner.vue'

@Component({
  components: {
    PerpetualRiskNotice,
    LegalBanner,
    ProhibitionUseNotice,
    GraphErrorBanner,
  }
})
export default class DialogProcess extends Vue {
  @Ref('prohibition') prohibition!: ProhibitionUseNotice
  @Ref('legal') legal!: LegalBanner
  @Ref('risk') risk!: PerpetualRiskNotice
  @Ref('graph') graph!: GraphErrorBanner

  mounted() {
    this.initProhibitionNotice()
    this.initGraphErrorBanner()
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
