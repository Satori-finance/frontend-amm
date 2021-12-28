<template>
  <div class="modify-perp-params-details">
    <div class="details-title">{{ $t('governance.proposalDetail') }}</div>
    <div class="table-container" v-if="proposal">
      <table class="mc-data-table mc-data-table--border">
        <thead>
        <tr>
          <td>{{ $t('governance.proposal') }}</td>
          <td>{{ $t('base.before') }}</td>
          <td>{{ $t('base.after') }}</td>
        </tr>
        </thead>
        <tbody>
          <tr v-if="proposal">
            <td>
              {{ $t('pool.poolProposal.changeInsuranceFundCapProposal.proposalTitle') }}
            </td>
            <td class="value">
              <span v-if="proposal.beforeInsuranceFundCap">
                {{ proposal.beforeInsuranceFundCap | bigNumberFormatter }} {{ collateralSymbol }}
              </span>
            </td>
            <td class="value">
              <span v-if="proposal.insuranceFundCap">
                {{ proposal.insuranceFundCap | bigNumberFormatter }} {{ collateralSymbol }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import {
  ChangeInsuranceFundCapPoolProposal,
} from '@/template/components/Pool/poolProposalMixin'
import { Component, Prop, Vue } from 'vue-property-decorator'
import { PoolBaseInfo } from '@/template/components/Pool/poolMixins'

@Component
export default class ChangeInsuranceFundCapDetails extends Vue {
  @Prop({ required: true }) proposal !: ChangeInsuranceFundCapPoolProposal | null
  @Prop({ required: true }) poolBaseInfo !: PoolBaseInfo | null

  get collateralSymbol(): string {
    if (!this.poolBaseInfo) {
      return ''
    }
    return this.poolBaseInfo.collateralSymbol
  }
}
</script>

<style scoped lang="scss">
.modify-perp-params-details {
  .details-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--mc-text-color-white);
  }

  .table-container {
    margin-top: 22px;
    width: 608px;

    table {
      width: 100%;

      tr {
        height: 40px;
        font-size: 14px;
        font-weight: 400;
        text-align: center;
      }

      td {
        color: var(--mc-text-color);
      }

      td:nth-of-type(1) {
        width: 35%;
      }

      td:nth-of-type(2) {
        width: 35%;
      }

      td:nth-of-type(3) {
        width: 30%;
      }
    }
  }

  .value {
    color: var(--mc-text-color-white) !important;
  }
}
</style>
