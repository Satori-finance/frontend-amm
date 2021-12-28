<template>
  <div>
    <div class="pool-info-table">
      <span class="head-title">{{ $t('pool.poolInfo.poolInfo') }}</span>
      <div class="table-container">
        <table
          class="mc-data-table mc-data-table--border"
          :class="{ 'four-columns-table': isFourColumnsTable, 'two-columns-table': !isFourColumnsTable }"
        >
          <tbody>
            <tr>
              <td>{{ $t('pool.poolInfo.poolInfoTable.address') }}</td>
              <td colspan="3">
                {{ poolAddress }}
                <el-link
                  class="icon"
                  :underline="false"
                  target="_blank"
                  :href="poolAddress | etherBrowserAddressFormatter"
                >
                  <i class="iconfont icon-transmit"></i>
                </el-link>
              </td>
            </tr>
            <tr v-if="!isPoolOperator && !isTakerOverOperator">
              <td>{{ $t('pool.poolInfo.poolInfoTable.operator') }}</td>
              <td>
                <EllipsisText :text="operatorAddress" :show-text="operatorName" />
                <el-link
                  class="icon"
                  :underline="false"
                  target="_blank"
                  :href="operatorAddress | etherBrowserAddressFormatter"
                >
                  <i class="iconfont icon-transmit"></i>
                </el-link>
              </td>
              <td>{{ $t('pool.poolInfo.lastCheckIn') }}</td>
              <td>
                <span v-if="operatorLastCheckTimestamp > 0">
                  {{ operatorLastCheckTimestamp | timestampFormatter('ll') }}
                </span>
              </td>
            </tr>
            <tr
              :class="{ 'button-tr': isPoolOperator || isTakerOverOperator }"
              v-show="isPoolOperator || isTakerOverOperator"
            >
              <td>{{ $t('pool.poolInfo.poolInfoTable.operator') }}</td>
              <td colspan="3">
                <EllipsisText :text="operatorAddress" :show-text="operatorName" />
                <el-link
                  class="icon"
                  :underline="false"
                  target="_blank"
                  :href="operatorAddress | etherBrowserAddressFormatter"
                >
                  <i class="iconfont icon-transmit"></i>
                </el-link>
                <el-button
                  type="primary"
                  size="mini"
                  round
                  class="mini-button"
                  v-if="isPoolOperator"
                  @click="onTransferEvent"
                >
                  {{ $t('pool.poolInfo.transfer') }}
                </el-button>
                <el-button
                  type="primary"
                  size="mini"
                  round
                  class="mini-button"
                  v-if="isTakerOverOperator"
                  @click="onTakerOverOperatorEvent"
                  :disabled="takeoverOperatorDisabled"
                >
                  {{ $t('pool.poolInfo.takerOverOperator') }}
                  <i v-if="takeoverOperatorDisabled" class="el-icon-loading"></i>
                </el-button>
                <el-button
                  type="secondary"
                  size="mini"
                  round
                  class="mini-button"
                  v-if="isPoolOperator && !isRunningPool"
                  @click="onRunPoolEvent"
                  :class="{ 'is-disabled': runningPoolDisabled }"
                >
                  {{ $t('pool.poolInfo.runPool') }}
                  <i v-if="runPoolLoading" class="el-icon-loading"></i>
                  <el-tooltip placement="top" v-if="!poolHasPerpetual">
                    <div slot="content"><span v-html="$t('pool.poolInfo.runPoolPrompt')"></span></div>
                    <i class="iconfont icon-help-icon"></i>
                  </el-tooltip>
                </el-button>
              </td>
            </tr>
            <tr :class="{ 'button-tr': isPoolOperator }" v-if="isPoolOperator">
              <td>{{ $t('pool.poolInfo.poolInfoTable.checkInTimeout') }}</td>
              <td colspan="3">
                <span>
                  <McCountDown :end-timestamp="operatorCheckInExpireTime" />
                </span>
                <el-button
                  type="secondary"
                  size="mini"
                  round
                  class="mini-button"
                  @click="onCheckInEvent"
                  :disabled="checkInDisabled"
                >
                  {{ $t('pool.poolInfo.checkIn') }}
                  <i v-if="checkInDisabled" class="el-icon-loading"></i>
                </el-button>
              </td>
            </tr>
            <tr>
              <td>{{ $t('pool.poolInfo.poolInfoTable.collateral') }}</td>
              <td colspan="3">
                {{ collateralSymbol }}
                <el-link
                  class="icon"
                  :underline="false"
                  target="_blank"
                  v-if="poolBaseInfo"
                  :href="collateralAddress | etherBrowserAddressFormatter"
                >
                  <i class="iconfont icon-transmit"></i>
                </el-link>
              </td>
            </tr>
            <tr>
              <td>{{ $t('pool.poolInfo.poolInfoTable.shareLiquidity') }}</td>
              <td colspan="3">
                <span v-if="poolMarginUSD.gt(0)"> ${{ this.poolMarginUSD | bigNumberFormatter(2) }} </span>
                <span v-else-if="poolMargin.gte(0)">
                  {{ poolMargin | bigNumberFormatter(collateralDecimals) }} {{ collateralSymbol }}
                </span>
              </td>
            </tr>
            <tr>
              <td>{{ $t('pool.poolInfo.poolInfoTable.totalVolume') }}</td>
              <td colspan="3">{{ totalVolume | bigNumberFormatter }} {{ collateralSymbol }}</td>
            </tr>
            <!--          <tr>-->
            <!--            <td>{{ $t('pool.poolInfo.poolInfoTable.lpApy') }}</td>-->
            <!--            <td colspan="3">>-->
            <!--              <span v-if="lpApy.eq('0') || lpApy.isNaN()">-&#45;&#45;</span>-->
            <!--              <span v-else>{{ lpApy | bigNumberFormatter(2) }} %</span>-->
            <!--            </td>-->
            <!--          </tr>-->
            <tr>
              <td>{{ $t('contractInfo.contractParams.insuranceFundCap') }}</td>
              <td v-if="netAssetValue" colspan="3">
                <span v-if="liquidityPoolStorage">
                  {{ liquidityPoolStorage.insuranceFundCap | bigNumberFormatter }} {{ collateralSymbol }}
                </span>
              </td>
            </tr>
            <tr>
              <td>{{ $t('base.insuranceFund') }}</td>
              <td colspan="3">
                <template v-if="liquidityPoolStorage">
                  <span>
                    {{ insuranceFund | bigNumberFormatter(collateralDecimals) }} {{ collateralSymbol }}
                    <el-tooltip placement="top">
                      <div
                        slot="content"
                        v-html="
                          $t('pool.poolInfo.insuranceFundPrompt', {
                            donate: donatedInsuranceFund.toFormat(collateralDecimals),
                            fund: liquidityPoolStorage.insuranceFund.toFormat(collateralDecimals),
                            cap: liquidityPoolStorage.insuranceFundCap.toFormat(collateralDecimals),
                            collateralUnit: collateralSymbol,
                          })
                        "
                      ></div>
                      <i class="iconfont icon-help-icon icon"></i>
                    </el-tooltip>
                  </span>
                  <el-button
                    :disabled="disableShowDonate"
                    type="blue"
                    size="mini"
                    class="donate-btn"
                    round
                    @click="showDonate"
                  >
                    {{ $t('base.donate') }}
                  </el-button>
                </template>
              </td>
            </tr>
            <tr>
              <td>{{ $t('pool.poolInfo.poolInfoTable.netAssetValue') }}</td>
              <td v-if="netAssetValue" colspan="3">
                {{ netAssetValue | bigNumberFormatter(netAssetValueDecimals) }} {{ collateralSymbol }} / LP Token
              </td>
            </tr>
            <tr v-if="isMiningPool">
              <td>{{ $t('pool.poolInfo.poolInfoTable.release') }}</td>
              <td colspan="3">
                <span> {{ miningRelease | bigNumberFormatterTruncateByPrecision(6, 1, 2) }} {{ miningTokenSymbol }} </span>
              </td>
            </tr>
            <tr v-if="isMiningPool || claimableReward.gt(0)">
              <td>{{ $t('pool.poolInfo.poolInfoTable.miningApy') }}</td>
              <td>
                <span> {{ miningApy | bigNumberFormatter(2) }} % </span>
              </td>
              <td>{{ $t('pool.poolInfo.miningReward') }}</td>
              <td>
                <span>{{ claimableReward | bigNumberFormatterTruncateByPrecision(6, 1, 2) }} {{ miningTokenSymbol }}</span>
                <span v-show="claimableReward.gt(0)">
                  <el-button
                    size="mini"
                    type="orange"
                    class="sub-mini-button"
                    round
                    @click="onClaimEvent"
                    :disabled="claiming"
                  >
                    {{ $t('base.claim') }}
                    <i v-if="claiming" class="el-icon-loading"></i>
                  </el-button>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <TransferOperator
      :visible.sync="showTransferOperator"
      :is-pool-operator="isPoolOperator"
      :pool-address="poolAddress"
    />
    <DonatedInsuranceFundDialog
      :visible.sync="showDonateDialog"
      :pool-address="poolAddress"
      :liquidity-pool-storage="liquidityPoolStorage"
      :collateral-symbol="collateralSymbol"
      :collateral-decimals="collateralDecimals"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import PoolInfoMixin from '@/template/components/Pool/PoolInfo/poolInfoMixin'
import { EllipsisText, McCountDown } from '@/components'
import TransferOperator from '../../Components/TransferOperator.vue'
import DonatedInsuranceFundDialog from '../../Components/DonatedInsuranceFundDialog.vue'
import { _0 } from '@mcdex/mai3.js'

@Component({
  components: {
    EllipsisText,
    TransferOperator,
    McCountDown,
    DonatedInsuranceFundDialog,
  },
})
export default class PoolInfo extends Mixins(PoolInfoMixin) {
  private showDonateDialog = false
  private showTransferOperator: boolean = false

  onTransferEvent() {
    this.showTransferOperator = true
  }

  showDonate() {
    if (!this.userAddress || this.userAddress === '') {
      return
    }
    this.showDonateDialog = true
  }

  get disableShowDonate() {
    return !this.liquidityPool || !this.liquidityPool.liquidityPoolStorage.isRunning ||
      !this.userAddress || this.userAddress === ''
  }

  get insuranceFund() {
    if (!this.liquidityPoolStorage) {
      return _0
    }
    return this.liquidityPoolStorage.insuranceFund.plus(this.liquidityPoolStorage.donatedInsuranceFund)
  }
}
</script>

<style scoped lang="scss">
@import '../info.scss';

.pool-info-table {
  .table-container {
    table {
      tr {
        font-size: 14px;
        font-weight: 400;
        line-height: 20px;

        td {
          padding: 10px;
        }
      }

      .button-tr {
        td {
          padding: 6px 10px;
        }
      }
    }
  }

  .donate-btn {
    margin-left: 8px;
    min-width: 60px;
  }

  .four-columns-table {
    td:nth-of-type(1),
    td:nth-of-type(3) {
      color: var(--mc-text-color);
    }

    td:nth-of-type(1) {
      width: 22%;
    }

    td:nth-of-type(3) {
      width: 18%;
      border-left: 1px solid var(--mc-border-color);
    }

    td:nth-of-type(2),
    td:nth-of-type(4) {
      width: 27%;
    }
  }

  .two-columns-table {
    td:nth-of-type(1) {
      width: 27%;
      color: var(--mc-text-color);
    }

    td:nth-of-type(2) {
      color: var(--mc-text-color-white);
    }
  }

  .line-sub {
    margin-left: 18px;
  }
}
</style>
