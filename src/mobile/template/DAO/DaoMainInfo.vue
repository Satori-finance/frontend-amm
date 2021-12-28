<template>
  <div class="dao-main-info scroll-container">
    <div class='title'>
      <HeaderBar></HeaderBar>
      <div class="tab-container">
        <div class="bg">
          <img src="@/assets/img/satori-bg.png" alt="">
        </div>
        <div class="selected-radio">
          <McTabs v-model="selectedRadio" :tabs="radioOptions" :equal-width="true"/>
        </div>
      </div>
    </div>
    <div class="page-container">
      <keep-alive>
        <InfoMain v-if="selectedRadio === 'info'" />
      </keep-alive>
      <keep-alive>
        <ProposalHistoryList v-if="selectedRadio === 'governance'" />
      </keep-alive>
    </div>
    <VaultAssetPopup :visible.sync="showVaultAssetPopup"/>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import BackNavBar from '@/mobile/template/Header/BackNavBar.vue'
import InfoMain from './Info/InfoMain.vue'
import ProposalHistoryList from './Governance/ProposalHistoryList.vue'
import { namespace } from 'vuex-class'
import { McTabs, } from '@/components'
import HeaderBar from '@/mobile/template/Header/HeaderBar.vue'
import VaultAssetPopup from '@/mobile/template/DAO/Components/VaultAssetPopup.vue'
import { VUE_EVENT_BUS } from '@/event'
import { COMMON_EVENT } from '@/mobile/event'

const interactiveState = namespace('interactiveState')

@Component({
  components: {
    BackNavBar,
    InfoMain,
    ProposalHistoryList,
    McTabs,
    HeaderBar,
    VaultAssetPopup,
  }
})
export default class DaoMainInfo extends Vue {
  @interactiveState.State('daoMainInfoTab') daoMainInfoTab !: 'info' | 'governance'
  @interactiveState.Mutation('updateDaoMainInfoTab') updateDaoMainInfoTab !: Function

  private selectedRadio: 'info' | 'governance' = 'info'
  private showVaultAssetPopup: boolean = false

  get radioOptions() {
    return [
      {
        value: 'info',
        label: this.$t('base.info').toString()
      },
      {
        value: 'governance',
        label: this.$t('dao.governance').toString(),
      },
    ]
  }

  mounted() {
    VUE_EVENT_BUS.on(COMMON_EVENT.SHOW_VAULT_ASSET_POPUP, this.showPopup)
  }

  destroyed() {
    VUE_EVENT_BUS.off(COMMON_EVENT.SHOW_VAULT_ASSET_POPUP, this.showPopup)
  }

  showPopup() {
    this.showVaultAssetPopup = true
  }

  @Watch('selectedRadio')
  onSelectedRadioChanged() {
    this.updateDaoMainInfoTab(this.selectedRadio)
  }

  @Watch('$route', { immediate: true })
  onRouteChanged() {
    this.selectedRadio = this.daoMainInfoTab
  }
}
</script>

<style lang="scss" scoped>
.dao-main-info {

  .bg {
    position: absolute;
    width: 800px;
    left: calc(50% - 368px);
    filter: blur(90px);
    z-index: 0;
    pointer-events: none;
  }

  .title {
    width: 100%;
    z-index: 1;

    .tab-container {
      margin: 0 16px 0 16px;
      width: calc(100% - 32px);
      height: 58px;
      border-bottom: 1px solid var(--mc-border-color);

      .selected-radio {
        width: 147px;

        ::v-deep .mc-tabs {
          height: 56px;

          .tab-item {
            font-size: 16px;
            line-height: 56px;
          }
        }
      }
    }
  }

  .page-container {
    height: calc(100% - 102px);
    margin: 0 16px 0;
    overflow-y: scroll;
    z-index: 1;
  }
}
</style>
