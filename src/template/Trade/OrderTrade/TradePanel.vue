<template>
  <div class="trade-panel" ref="panel">
    <McLoading :show-loading="tradePanelIsLoading" :delay="500" :margin="8" :show-loading-text="false">
      <div class="trade-panel-container">
        <PlaceOrderAdapter />
        <div class="banner-container">
          <BannerBox></BannerBox>
        </div>
      </div>
    </McLoading>
  </div>
</template>

<script lang='ts'>
import { Component, Mixins } from 'vue-property-decorator'
import PlaceOrderAdapter from './PlaceOrderAdapter.vue'
import { namespace } from 'vuex-class'
import { McLoading } from '@/components'
import TradePanelMixin from '@/template/components/Trade/TradePanelMixin'
import BannerBox from './BannerBox.vue'

const wallet = namespace('wallet')
const interactiveState = namespace('interactiveState')

@Component({
  components: {
    PlaceOrderAdapter,
    McLoading,
    BannerBox,
  },
})
export default class TradePanel extends Mixins(TradePanelMixin) {

}
</script>

<style lang="scss" scoped>
@import '~@mcdex/style/common/var';

.trade-panel {
  width: auto;
  height: 100%;
  min-width: 280px;
  background: #131A31;
  overflow-y: overlay;

  .trade-panel-container {
    height: 100%;
    overflow-y: overlay;
    padding-bottom: 5px;
  }

  .banner-container {
    margin-top: 16px;
  }

  .mc-loading {
    height: 100%;
  }
}

.dex-grid-item {
  .vue-resizable-handle {
    z-index: 2008;
  }
}
</style>
