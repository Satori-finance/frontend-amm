<template>
  <div class="mcb-staking">
    <div class="panel-item-header">
      <div class="title">
        {{ $t('dao.mcbStaking') }}
      </div>
    </div>
    <div class="table-container">
      <McLoading :show-loading="loading">
        <table class="mc-data-table">
          <thead>
            <tr>
              <th>{{ $t('dao.miningApy') }}</th>
              <th>{{ $t('dao.myShare') }}</th>
              <th>{{ $t('dao.claimable') }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="noData" class="no-data">
              <td colspan="3">
                <McNoData />
              </td>
            </tr>
            <tr v-else @click="showStakeDialog = true">
              <td>{{ miningApy | bigNumberFormatter(2) }} %</td>
              <td>{{ myShareRate | bigNumberFormatter(2) }} %</td>
              <td>
                <div class="claimable-list">
                  <span class="claimable-item" v-for="(item, index) in claimableTokens" :key="index">
                    {{ item.value | bigNumberFormatter(2) }} {{ item.tokenName }}
                  </span>
                </div>
              </td>
              <td>
                <el-button
                  class="withdraw-general-button"
                  size="mini"
                  type="orange"
                  round
                  @click.stop="onClaimEvent()"
                  :disabled="claimIsDisabled"
                >
                  <template v-if="claimableTokens.length > 1">
                    {{ $t('base.claimAll') }}
                  </template>
                  <template v-else>
                    {{ $t('base.claim') }}
                  </template>
                  <i v-if="claiming" class="el-icon-loading"></i>
                </el-button>
              </td>
            </tr>
          </tbody>
        </table>
      </McLoading>
    </div>
    <StakeDialog :visible.sync="showStakeDialog" @closed="onClosedDialog" />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { McLoading, McNoData } from '@/components'
import StakeDialog from '@/template/DAO/Components/StakeDialog.vue'
import { daoClaimableItem, DaoStakingMixin } from '@/template/components/DAO/daoStakingMixin'

@Component({
  components: {
    McLoading,
    McNoData,
    StakeDialog,
  }
})

export default class SATORIStaking extends Mixins(DaoStakingMixin) {
  private showStakeDialog: boolean = false
  private selectedDaoItem: daoClaimableItem | null = null

  get noData(): boolean {
    return false
    //return this.miningApy.toFixed() == new BigNumber('0').toFixed()
  }

  onClosedDialog() {
    this.selectedDaoItem = null
    this.showStakeDialog = false
  }

}
</script>

<style scoped lang="scss">
@import 'mining';
.mcb-staking {
  table {
    td:nth-of-type(1),
    td:nth-of-type(2) {
      width: 15%;
    }

    td:nth-of-type(3) {
      width: 60%;
    }

    td:nth-of-type(4) {
      width: 11%;
    }
  }

  .claimable-list {
    display: flex;
    justify-content: space-around;

    .claimable-item {
      .el-button {
        margin-left: 18px;
      }
    }
  }
}
</style>
