<template>
  <div class="transaction-mining-detail">
    <BaseCardFrame>
      <template #title>
        <span class="link" @click="toMining">{{ $t('base.farm') }}</span>
        <span> / {{ $t('dao.transactionMiningPool') }}</span>
      </template>
      <template #content>
        <div class="table-container">
          <McLoading :show-loading="loading">
            <table class="mc-data-table">
              <thead>
              <tr>
                <th>{{ $t('base.pool') }}</th>
                <th>{{ $t('base.perpetualContract') }}</th>
              </tr>
              </thead>
              <tbody>
              <tr v-if="noData" class="no-data">
                <td colspan="2">
                  <McNoData/>
                </td>
              </tr>
              <tr v-else v-for="item in tableBody">
                <td>
                  <div class="pool">
                    <span class="collateral" @click="toPoolInfo(item.poolAddress)">{{ item.collateral }}</span>
                    ({{ item.poolAddress | ellipsisMiddle }})
                  </div>
                </td>
                <td>
                  <PerpetualsViewer :per-row-count="5" :perpetuals="item.perpetuals" :collateral="item.collateral"/>
                </td>
              </tr>
              </tbody>
            </table>
          </McLoading>
        </div>
      </template>
    </BaseCardFrame>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Vue } from 'vue-property-decorator'
import { BaseCardFrame, McLoading, McNoData, PerpetualsViewer } from '@/components'
import { TransactionMiningDetailMixin } from '@/template/components/Mining/transactionMiningDetailMixin'
import { ROUTE } from '@/router'

@Component({
  components: {
    BaseCardFrame,
    McLoading,
    McNoData,
    PerpetualsViewer,
  },
})
export default class TransactionMiningDetail extends Mixins(TransactionMiningDetailMixin) {

  get title() {
    return `${this.$t('base.mining').toString()} / ${this.$t('dao.transactionMiningPool').toString()}`
  }

  toPoolInfo(poolAddress: string) {
    this.$router.push({ name: ROUTE.POOL_INFO, params: { poolAddress: poolAddress } })
  }

  toMining() {
    this.$router.push({ name: ROUTE.MINING })
  }
}
</script>

<style scoped lang="scss">
@import "mining";

.transaction-mining-detail {
  flex: 1;
  display: flex;
  flex-direction: column;

  .base-card-frame {
    flex: 1;
    font-size: 14px;
    line-height: 24px;

    .link {
      cursor: pointer;
      display: inline-block;
    }
  }

  table {
    tbody tr {
      min-height: 65px;
    }
    td:nth-of-type(1) {
      width: 22%;
    }

    td:nth-of-type(2) {
      text-align: left;
      padding-left: 116px;
    }

    td {
      cursor: default;

      .pool {
        .collateral {
          color: var(--mc-color-primary);
          text-decoration: underline;
          cursor: pointer;
        }
      }
    }
  }
}
</style>
