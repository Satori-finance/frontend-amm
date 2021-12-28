<template>
  <div class="vault-asset-details">
    <div class="table-container">
      <table class="mc-data-table">
        <thead>
        <tr>
          <th>{{ $t('dao.assetDetailsDialog.asset') }}</th>
          <th>{{ $t('dao.assetDetailsDialog.amount') }}</th>
        </tr>
        </thead>
        <tbody>
        <tr v-if="noData" :class="{'no-data': noData}">
          <td colspan="2">
            <McLoading :show-loading="vaultAssetsLoading" :min-show-time="300">
              <McNoData :label="$t('base.empty')" v-if="!vaultAssetsLoading"></McNoData>
            </McLoading>
          </td>
        </tr>
          <tr v-else v-for="(item, index) in tableData" :key="index">
            <td>
              {{ item.tokenName }}
              <el-link
                class="icon"
                :underline="false"
                target="_blank"
                :href="item.address | etherBrowserAddressFormatter(item.chainId)"
              >
                <i class="iconfont icon-transmit"></i>
              </el-link>
            </td>
            <td>
              {{ item.amount | bigNumberFormatterByPrecision(item.decimals) }}
            </td>
          </tr>
        </tbody>
      </table>
      <div class="table-pagination">
        <el-pagination background layout="prev, pager, next" v-if="assetsList.length>0"
                       hide-on-single-page
                       :page-size.sync="pagination.pageSize"
                       :total="assetsList.length"
                       :current-page.sync="pagination.currentPage">
        </el-pagination>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import _ from 'lodash'
import { McNoData, McLoading } from '@/components'
import { VaultAssetItem, VaultAssetDetailsMixin } from '@/template/components/DAO/Info/vaultAssetDetailsMixin';

@Component({
  components: {
    McNoData,
    McLoading,
  }
})
export default class VaultAssetDetails extends Mixins(VaultAssetDetailsMixin) {
  private pagination = {
    pageSize: 10,
    currentPage: 1
  }

  get offset () {
    return Math.max((this.pagination.currentPage - 1) * this.pagination.pageSize, 0)
  }

  get tableData(): VaultAssetItem[] {
    return _.slice(this.assetsList, this.offset, this.offset + this.pagination.pageSize)
  }
}
</script>

<style scoped lang="scss">
.vault-asset-details {
  .table-container {

    table {
      width: 100%;

      .no-data {
        height: 500px;
      }

      th,td {
        width: 50%;
      }

      th {
        color: var(--mc-text-color);
      }

      td {
        color: var(--mc-text-color-white);
      }

      tr {
        border: 1px solid var(--mc-border-color);
        height: 50px;
        text-align: center;
        font-size: 14px;
        font-weight: 400;
      }
    }
  }

  .table-pagination {
    text-align: right;
    margin-top: 20px;

    ::v-deep .el-pagination {
      padding: unset;
    }
  }

  .icon {
    font-size: 10px;
    color: var(--mc-text-color);
    margin-left: 4px;
  }
}
</style>
