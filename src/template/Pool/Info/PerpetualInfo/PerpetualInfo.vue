<template>
  <div class="perpetual-info-table">
    <span class="head-title">{{ $t('pool.poolInfo.perpetualInfo') }}</span>
    <div class="table-container">
      <table class="mc-data-table mc-data-table--border is-medium">
        <tbody>
        <tr>
          <td>{{ $t('base.perpetual') }}</td>
          <td>
            <div class="flex-line">
                <span v-if="perpetualProperty" class="flex-line">
                  {{ perpetualProperty.symbolStr }} {{ perpetualProperty.name }}
                <span class="inverse-card" v-if="perpetualProperty.isInverse">{{ $t('base.inverse') }}</span>
              </span>
              <el-link
                v-if="perpetualProperty"
                class="icon flex-line"
                :underline="false"
                target="_blank"
                :href="perpetualProperty.liquidityPoolAddress | etherBrowserAddressFormatter"
              >
                <i class="iconfont icon-transmit"></i>
              </el-link>
              <el-button
                v-if="accountIsOperator"
                class="mini-button"
                type="secondary"
                size="mini"
                round
                @click="modifyDisplay"
                :loading="modifyingPerpDisplaying"
              >
                {{ $t('pool.poolInfo.modifyDisplay') }}
                <el-tooltip :content="modifyPerpDisplayText" placement="top">
                  <i class="iconfont icon-help-icon button-icon"></i>
                </el-tooltip>
              </el-button>
            </div>
          </td>
        </tr>
        <tr>
          <td>{{ $t('base.status') }}</td>
          <td v-if="!perpetualStorage"></td>
          <td v-else :class="[getPerpetualStatusColor(perpetualProperty.unChangePerpetualState)]">
            {{ getPerpetualStatusText(perpetualProperty.unChangePerpetualState) }}
          </td>
        </tr>
        <tr>
          <td>{{ $t('base.underlyingAssets') }}</td>
          <td>
            <span v-if="perpetualProperty">{{ perpetualProperty.underlyingAssetSymbol }}</span>
            <span
              v-if="
                  perpetualStorage &&
                  (getOracleIntro(perpetualStorage.oracle) === 'SP500' ||
                    getOracleIntro(perpetualStorage.oracle) === 'DPI')
                "
            >
                <a
                  class="intro"
                  v-if="perpetualProperty.underlyingAssetSymbol === 'SP500'"
                  target="_blank"
                  :href="$t('base.SP500Link')"
                >
                  {{ $t('base.introduction') }}<i class="iconfont icon-vector-stroke"></i>
                </a>
                <a
                  class="intro"
                  v-if="perpetualProperty.underlyingAssetSymbol === 'DPI'"
                  target="_blank"
                  :href="$t('base.DPILink')"
                >
                  {{ $t('base.introduction') }}<i class="iconfont icon-vector-stroke"></i>
                </a>
              </span>
          </td>
        </tr>
        <tr>
          <td>{{ $t('base.collateral') }}</td>
          <td>
            <span v-if="perpetualProperty">{{ collateralSymbol }}</span>
            <el-link
              v-if="poolStorage"
              class="icon"
              :underline="false"
              target="_blank"
              :href="poolStorage.collateral | etherBrowserAddressFormatter"
            >
              <i class="iconfont icon-transmit"></i>
            </el-link>
          </td>
        </tr>
        <tr>
          <td class="align-top">{{ $t('base.oracle') }}</td>
          <td>
            <McLoading :show-loading="loadingTunableInfoTimes===0" :show-loading-text="false" :hide-content="true">
              <template
                v-if="oracleDetail && oracleDetail.withFineTuner && oracleDetail.oracles && oracleDetail.oracles.length">
                <div class="oracle-list">
                  <div class="oracle-item" v-for="(item, index) in oracleDetail.oracles" :key="item.externalOracle">
                    <svg class="svg-icon" aria-hidden="true"
                         v-if="getOracleTypeName(item) === 'Chainlink'">
                      <use :xlink:href="`#icon-chainlink`"></use>
                    </svg>
                    <svg class="svg-icon" aria-hidden="true" v-if="getOracleTypeName(item) === 'Band'">
                      <use :xlink:href="`#icon-band`"></use>
                    </svg>
                    <svg class="svg-icon" aria-hidden="true"
                         v-if="getOracleTypeName(item) === 'SATORI'">
                      <use :xlink:href="`#icon-token-mcb`"></use>
                    </svg>
                    <span>
                      {{ getOracleTypeName(item) }} {{
                        item.oracle.underlyingAsset
                      }}-{{ item.oracle.collateral }}
                    </span>
                    <span v-if="isWithFineTuner(item)" class="fine-tuner">
                      {{
                        getOracleTypeName(item) === 'SATORI' ? $t('base.chainlinkWithFineTuner') : $t('base.withFineTuner')
                      }}
                    </span>
                    <i class="font-icon el-icon-right" v-if="index < (oracleDetail.oracles.length - 1)"></i>
                    <el-link
                      v-else
                      class="link-icon"
                      :underline="false"
                      target="_blank"
                      :href="perpetualStorage.oracle | etherBrowserAddressFormatter"
                    >
                      <i class="iconfont icon-transmit"></i>
                    </el-link>
                  </div>
                </div>
                <el-button class="tunable-detail" size="mini" round @click="showTunableInfoDialog = true">
                  {{ $t('base.detail') }}
                </el-button>
              </template>
              <template v-else>
                <span v-if="perpetualStorage">{{ perpetualStorage.oracle | oracleNameFormatter }}</span>
                <el-link
                  v-if="perpetualStorage"
                  class="icon"
                  :underline="false"
                  target="_blank"
                  :href="perpetualStorage.oracle | etherBrowserAddressFormatter"
                >
                  <i class="font-icon iconfont icon-transmit"></i>
                </el-link>
              </template>
            </McLoading>
          </td>
        </tr>
        <tr>
          <td>{{ $t('base.operator') }}</td>
          <td>
              <span v-if="poolStorage">
                <EllipsisText :text="poolStorage.operator" :show-text="operatorName"/>
              </span>
            <el-link
              v-if="poolStorage"
              class="icon"
              :underline="false"
              target="_blank"
              :href="poolStorage.operator | etherBrowserAddressFormatter"
            >
              <i class="iconfont icon-transmit"></i>
            </el-link>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <TunableInfoDialog :visible.sync="showTunableInfoDialog"
                       :tunable-oracles="oracleDetail.oracles"></TunableInfoDialog>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { PoolPerpetualInfoMixin } from '@/template/components/Pool/poolPerpetualInfoMixin'
import { PerpetualState } from '@mcdex/mai3.js'
import { EllipsisText, McLoading } from '@/components'
import TunableInfoDialog from '@/template/Dialogs/TunableInfoDialog.vue'

@Component({
  components: {
    EllipsisText,
    TunableInfoDialog,
    McLoading,
  },
})
export default class PerpetualInfo extends Mixins(PoolPerpetualInfoMixin) {
  private showTunableInfoDialog = false

  getPerpetualStatusText(status: PerpetualState) {
    if (status === PerpetualState.INVALID) return this.$t('perpetualStatus.invalid').toString()
    if (status === PerpetualState.INITIALIZING) return this.$t('perpetualStatus.initializing').toString()
    if (status === PerpetualState.NORMAL) return this.$t('perpetualStatus.normal').toString()
    if (status === PerpetualState.EMERGENCY) return this.$t('perpetualStatus.emergency').toString()
    if (status === PerpetualState.CLEARED) return this.$t('perpetualStatus.cleared').toString()
    return ''
  }

  getPerpetualStatusColor(status: PerpetualState) {
    if (status === PerpetualState.INVALID) return 'invalid-status'
    if (status === PerpetualState.INITIALIZING) return 'initializing-status'
    if (status === PerpetualState.NORMAL) return 'normal-status'
    if (status === PerpetualState.EMERGENCY) return 'emergency-status'
    if (status === PerpetualState.CLEARED) return 'cleared-status'
    return ''
  }

  modifyDisplay() {
    if (this.isClearOrEmergency) {
      this.$message({
        message: this.$t('pool.poolInfo.poolInfoTable.modifyPrompt').toString(),
        iconClass: 'el-message__icon iconfont icon-warning',
      })
    } else {
      this.onModifyPerpetualDisplay()
    }
  }
}
</script>

<style scoped lang="scss">
@import '../info.scss';
@import '~@mcdex/style/common/fantasy-var';

.perpetual-info-table {
  .table-container {
    table {
      tr {
        font-size: 14px;
        font-weight: 400;
        line-height: 20px;

        td {
          padding: 10px;

          .intro {
            margin-left: 8px;

            .icon-vector-stroke {
              margin-left: 4px;
            }
          }

          .intro,
          .icon-vector-stroke {
            font-size: 14px;
            color: var(--mc-color-brand);
          }
        }

        td:nth-of-type(1) {
          width: 26%;
          color: var(--mc-text-color);
        }

        td:nth-of-type(2) {
          width: 72%;
          color: var(--mc-text-color-white);
        }

        td.invalid-status {
          color: var(--mc-color-secondary);
        }

        td.initializing-status {
          color: var(--mc-color-primary);
        }

        td.normal-status {
          color: var(--mc-color-blue);
        }

        td.emergency-status {
          color: var(--mc-color-error);
        }

        td.cleared-status {
          color: var(--mc-color-warning);
        }
      }

      tr:nth-of-type(2),
      tr:nth-of-type(3) {
        td {
          padding: 6px 10px;
        }
      }
    }
  }
}

.flex-line {
  display: flex;
  align-items: center;
}

.button-icon {
  width: 10px;
  height: 10px;
  font-size: 10px;
  margin-left: 4px;
  color: var(--mc-text-color-white);
  display: inline;
}

.mini-button {
  margin-left: 10px;
  font-size: 12px;
  color: var(--mc-text-color-white);
}

::v-deep.el-button.is-loading:before {
  height: 28px;
}

.alert-error {
  margin-top: 20px;
}

.align-top {
  vertical-align: top;
}

.svg-icon {
  height: 24px;
  width: 24px;
  margin-right: 4px;
}

.font-icon {
  color: var(--mc-text-color-dark) !important;
  font-size: 14px;
  line-height: 1;
  margin-left: 4px;
}

.link-icon {
  color: var(--mc-text-color-white);
  font-size: 14px;
  line-height: 1;
  margin-left: 4px;
}

.tunable-detail {
  min-width: 55px;
  margin-top: 10px;
}

.oracle-list {
  font-size: 14px;
  line-height: 20px;

  .oracle-item {
    display: flex;
    align-items: center;

    &:not(:first-of-type) {
      margin-top: 4px;
    }

    .fine-tuner {
      margin-left: 4px;
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
