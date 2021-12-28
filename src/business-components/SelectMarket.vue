<template>
  <div class="trade-select">
    <PerpetualSelector></PerpetualSelector>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { SelectedPerpetualMixin, ErrorHandlerMixin } from '@/mixins'
import PerpetualSelector from './PerpetualSelector/PerpetualSelector.vue'
import { COMMON_EVENT, VUE_EVENT_BUS } from '@/event'

const perpetual = namespace('perpetual')

@Component({
  components: {
    PerpetualSelector,
  },
})
export default class SelectMarket extends Mixins(SelectedPerpetualMixin, ErrorHandlerMixin) {
}
</script>

<style lang="scss" scoped>
.trade-select {
  display: flex;
  align-items: center;
  .disabled{
    opacity: 0.5;
    cursor: no-drop;
  }
}
</style>
