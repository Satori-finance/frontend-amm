<template>
  <div class="select-perpetual-oracle-view">
    <table class="mc-data-table mc-data-table--border is-medium">
      <thead>
      <tr>
        <template v-if="isUniswapOracle">
          <th>{{ $t('newContract.oracleRoutes') }}</th>
          <th>{{ $t('newContract.underlyingAsset') }}</th>
          <th>{{ $t('base.quote') }}</th>
          <th>{{ $t('newContract.indexPriceTWAP') }}</th>
          <th>{{ $t('newContract.markPriceTWAP') }}</th>
        </template>
        <template v-else>
          <th style="width: 50%">{{
              selectType === 'registered' ? $t('newContract.oracleRoutes') : $t('newContract.custom')
            }}
          </th>
          <th style="width: 25%">{{ $t('newContract.underlyingAsset') }}</th>
          <th style="width: 25%">{{ $t('base.quote') }}</th>
        </template>
      </tr>
      </thead>
      <tbody>
      <tr>
        <template v-if="isUniswapOracle">
          <td class="is-center">
            <McUniswapV3OracleView :token-path="selectedOracleRoute.route.tokenPath"/>
          </td>
          <td class="is-center">{{ underlyingSymbol }}</td>
          <td class="is-center">{{ quoteSymbol }}</td>
          <td class="is-center">{{ selectedOracleRoute.indexPriceTWAP }}s</td>
          <td class="is-center">{{ selectedOracleRoute.markPriceTWAP }}s</td>
        </template>
        <template v-else>
          <td class="is-center">
            <span v-if="selectType==='registered'">
              <span v-for="(link, index) in selectedOracleRoute" :key="index" class="oracle-item">
                <span class="oracle-name">
                  <svg class="svg-icon" aria-hidden="true"
                       v-if="getOracleTypeName(link.oracle.address) === 'chainlink'">
                    <use :xlink:href="`#icon-chainlink`"></use>
                  </svg>
                  <svg class="svg-icon" aria-hidden="true" v-if="getOracleTypeName(link.oracle.address) === 'band'">
                    <use :xlink:href="`#icon-band`"></use>
                  </svg>
                  <svg class="svg-icon" aria-hidden="true" v-if="getOracleTypeName(link.oracle.address) === 'mcdex'">
                    <use :xlink:href="`#icon-token-mcb`"></use>
                  </svg>
                  {{ link.oracle.address | oracleNameFormatter }}
                </span>
                <span v-if="link.isTunable" class="fine-tuner">
                  {{
                    getOracleTypeName(link.oracle.address) === 'mcdex' ? $t('base.chainlinkWithFineTuner') : $t('base.withFineTuner')
                  }}
                </span>
                <span class="oracle-item-split" v-if="index < (selectedOracleRoute.length - 1)">
                  <i class="el-icon-right"></i>
                </span>
              </span>
            </span>
            <span v-if="selectType==='custom'">
              {{ readOnlyOracleAddress.toLowerCase() }}
              <el-link
                class="unit"
                :underline="false"
                :href="customOracleAddress | etherBrowserAddressFormatter"
                target="_blank"
              >
                <i class="iconfont icon-transmit"></i>
              </el-link>
            </span>
          </td>
          <td class="is-center">{{ underlyingSymbol }}</td>
          <td class="is-center">{{ quoteSymbol }}</td>
        </template>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { SelectedOracleParams, getOracleTypeName, UniswapOracle } from './types'
import { OracleLink, OracleLinkWithTunable } from '@/config/oracle'
import { ellipsisMiddle } from '@/utils'
import _ from 'lodash'
import { McUniswapV3OracleView } from '@/components'

@Component({
  components: {
    McUniswapV3OracleView,
  },
})
export default class SelectPerpetualOracleView extends Vue {
  @Prop({ required: true, default: () => null }) selectedOracleParams !: SelectedOracleParams | null

  private getOracleTypeName = getOracleTypeName

  get selectType(): 'registered' | 'custom' | 'uniswapV3' | '' {
    return this.selectedOracleParams?.selectedType || ''
  }

  get selectedOracleRoute(): OracleLinkWithTunable[] | UniswapOracle {
    return this.selectedOracleParams?.oracleRouterPath || []
  }

  get customOracleAddress(): string {
    return this.selectedOracleParams?.oracleAddress || ''
  }

  get underlyingSymbol(): string {
    return this.selectedOracleParams?.underlyingSymbol || ''
  }

  get readOnlyOracleAddress(): string {
    return ellipsisMiddle(this.customOracleAddress, 6, 4)
  }

  get isUniswapOracle() {
    return !_.isArray(this.selectedOracleRoute)
  }

  get quoteSymbol(): string {
    if (!this.selectedOracleParams) {
      return ''
    }
    if (this.selectType === 'registered' && this.selectedOracleParams.quoteSymbol === '') {
      return (this.selectedOracleRoute as OracleLinkWithTunable[])[0]?.oracle.priceSymbol || ''
    } else if (this.selectType === 'uniswapV3') {
      return (this.selectedOracleRoute as UniswapOracle).route.output.symbol || ''
    }
    return this.selectedOracleParams.quoteSymbol
  }
}
</script>

<style lang="scss" scoped>
@import '~@mcdex/style/common/fantasy-var';

.select-perpetual-oracle-view {
  .mc-data-table,
  .action {
    width: 730px;
    margin: auto;
  }

  table {
    thead,
    tbody {
      font-size: 14px;
      font-weight: 400;
    }

    thead {
      color: var(--mc-text-color);
    }

    tbody {
      color: var(--mc-text-color-white);
    }

    .unit {
      color: #c4c4c4;
      margin-left: 7px;
      font-size: 10px;
    }
  }

  .oracle-item {
    display: inline-flex;
    align-items: center;

    .svg-icon {
      height: 24px;
      width: 24px;
      margin-right: 4px;
    }

    .oracle-name {
      display: inline-flex;
      align-items: center;
    }

    .fine-tuner {
      margin: 0 4px;
      font-size: 12px;
      line-height: 14px;
      color: var(--mc-color-primary);
      background-color: rgb($--mc-color-primary, 0.1);
      padding: 3px 8px;
      border-radius: var(--mc-border-radius-m);
      border: 1px solid rgb($--mc-color-primary, 0.1);
    }
  }
}
</style>
