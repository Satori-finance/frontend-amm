<template>
  <div class="dao-main-info">
    <div class="panel-item flex-box">
      <SATORIInfo />
      <VaultInfo />
    </div>
    <div class="panel-item">
      <GovernanceHistory />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import SATORIInfo from './DaoInfo/SatoriInfo.vue'
import VaultInfo from './DaoInfo/VaultInfo.vue'
import ProposalHistoryList from '@/template/DAO/Governance/ProposalHistoryList.vue'

@Component({
  components: {
    SATORIInfo,
    VaultInfo,
    GovernanceHistory: ProposalHistoryList,
  },
})
export default class DaoMainInfo extends Vue {

}
</script>

<style scoped lang="scss">
.dao-main-info {
  width: 1200px;
  margin: 0 auto 64px;

  .panel-item {
    margin-top: 32px;
  }

  .flex-box {
    display: flex;
    justify-content: space-between;
    margin-bottom: 48px;
  }
}

.satori-fantasy {
}
</style>
