<template>
  <div class="trade-page">
    <router-view></router-view>
    <PerpetualSelectorPopup/>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { PerpetualSelectorPopup } from '@/mobile/business-components'

@Component({
  components: {
    PerpetualSelectorPopup,
  },
})
export default class Trade extends Vue {

}
</script>

<style scoped lang="scss">
.trade-page {
  height: 100%;
}
</style>
