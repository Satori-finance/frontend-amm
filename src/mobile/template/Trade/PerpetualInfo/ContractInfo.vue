<template>
  <div class="contract-info">
    <div class="line-item">
      <span class="title">{{ $t('base.contract') }}</span>
      <span v-if="perpetualProperty" class="flex-value">
        {{ perpetualProperty.symbolStr }} {{ perpetualProperty.name }}
        <span class="inverse-card" v-if="perpetualProperty.isInverse">{{ $t('base.inverse') }}</span>
      </span>
    </div>
    <div class="line-item status">
      <span class="title">{{ $t('base.status') }}</span>
      <span v-if="!perpetualStorage"></span>
      <span v-else :class="[getPerpetualStatusColor(perpetualProperty.unChangePerpetualState)]">
        {{ getPerpetualStatusText(perpetualProperty.unChangePerpetualState) }}
      </span>
    </div>
    <div class="line-item">
      <span class="title">{{ $t('base.underlyingAssets') }}</span>
      <span v-if="perpetualProperty"
      >{{ perpetualProperty.underlyingAssetSymbol }}
        <span
          v-if="
            getOracleIntro(perpetualStorage.oracle) === 'SP500' || getOracleIntro(perpetualStorage.oracle) === 'DPI'
          "
        >
          <a v-if="perpetualProperty.underlyingAssetSymbol === 'SP500'" :href="$t('base.SP500Link')">
            {{ $t('base.introduction') }}
            <i class="iconfont icon-vector-stroke"></i>
          </a>
          <a v-if="perpetualProperty.underlyingAssetSymbol === 'DPI'" :href="$t('base.DPILink')">
            {{ $t('base.introduction') }}
            <i class="iconfont icon-vector-stroke"></i>
          </a>
        </span>
      </span>
    </div>
    <div class="line-item">
      <span class="title">{{ $t('base.collateral') }}</span>
      <span v-if="perpetualProperty">{{ collateralSymbol }}</span>
    </div>
    <div class="line-item">
      <span class="title">{{ $t('pool.poolInfo.perpetuals.volume24H') }}</span>
      <span>{{ tradeVolumeIn24HNumber }} {{ collateralSymbol }}</span>
    </div>
    <div class="line-item oracle-line-item">
      <span class="title">{{ $t('base.oracle') }}</span>
      <McMLoading :loading="loadingTunableInfoTimes === 0" :show-loading-text="false">
        <div v-if="oracleDetail && oracleDetail.withFineTuner && oracleDetail.oracles && oracleDetail.oracles.length">
          <div class="oracle-list">
            <div class="oracle-item" v-for="(item, index) in oracleDetail.oracles" :key="item.externalOracle">
              <div class="oracle-symbol">
                <i class="font-icon el-icon-right" v-if="index > 0"></i>

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
                {{ getOracleTypeName(item) }} {{ item.oracle.underlyingAsset }}/{{
                    item.oracle.collateral
                  }}
              </span>
              </div>
              <div v-if="isWithFineTuner(item)" class="fine-tuner">
                {{ getOracleTypeName(item) === 'SATORI' ? $t('base.chainlinkWithFineTuner') : $t('base.withFineTuner') }}
              </div>
            </div>
            <van-button class="tunable-detail medium round__medium" size="mini" round
                        @click="showTunableInfoDialog = true">{{ $t('base.detail') }}
            </van-button>
          </div>
        </div>
        <template v-else>
          <span v-if="perpetualStorage && !oracleName">{{ perpetualStorage.oracle | oracleNameFormatter }}</span>
          <span v-if="perpetualStorage && oracleName">
          {{ perpetualStorage.oracle | oracleNameFormatter | ellipsisMiddle(6, 4) }}
          <i class="iconfont icon-copy-bold" @click="copyAddress(perpetualStorage.oracle)"></i>
        </span>
        </template>
      </McMLoading>
    </div>
    <div class="line-item">
      <span class="title">{{ $t('base.operator') }}</span>
      <span v-if="poolStorage"
      >{{ poolStorage.operator | operatorNameFormatter | ellipsisMiddle(6, 4) }}
        <i class="iconfont icon-copy-bold" @click="copyAddress(poolStorage.operator)"></i
        ></span>
    </div>

    <TunableInfoPopup :visible.sync="showTunableInfoDialog" :tunableOracles="oracleDetail.oracles"></TunableInfoPopup>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import { PoolPerpetualInfoMixin } from '@/template/components/Pool/poolPerpetualInfoMixin'
import { PerpetualState } from '@mcdex/mai3.js'
import BigNumber from 'bignumber.js'
import { getBeforeTimestamp, toBigNumber } from '@/utils'
import * as _ from 'lodash'
import { Volume } from '@/type'
import { USDTokenSet } from '@/config/tokens'
import { SelectedPerpetualMixin } from '@/mixins'
import { queryPriceStatus } from '@/api/priceStatus'
import { getOracleNameByAddress } from '@/config/oracle'
import { copyToClipboard } from '@/utils'
import TunableInfoPopup from '@/mobile/business-components/TunableInfoPopup.vue'
import { McMLoading } from '@/mobile/components'

@Component({
  components: {
    TunableInfoPopup,
    McMLoading,
  }
})
export default class PerpetualInfo extends Mixins(PoolPerpetualInfoMixin, SelectedPerpetualMixin) {
  volumes: Volume[] | null = null
  private loadTimer = 0
  private showTunableInfoDialog = false

  private copyAddress(address: string) {
    if (!address) {
      return
    }
    copyToClipboard(address)
    this.$toast(this.$t('base.copySuccess').toString())
  }

  mounted() {
    this.loadTimer = window.setInterval(() => {
      this.getVolumes()
    }, 30000)
  }

  destroyed() {
    window.clearInterval(this.loadTimer)
  }

  getPerpetualStatusText(status: PerpetualState) {
    switch (status) {
      case PerpetualState.INVALID:
        return this.$t('perpetualStatus.invalid').toString()
      case PerpetualState.INITIALIZING:
        return this.$t('perpetualStatus.initializing').toString()
      case PerpetualState.NORMAL:
        return this.$t('perpetualStatus.normal').toString()
      case PerpetualState.EMERGENCY:
        return this.$t('perpetualStatus.emergency').toString()
      case PerpetualState.CLEARED:
        return this.$t('perpetualStatus.cleared').toString()
    }
  }

  getPerpetualStatusColor(status: PerpetualState) {
    switch (status) {
      case PerpetualState.INVALID:
        return 'invalid-status'
      case PerpetualState.INITIALIZING:
        return 'initializing-status'
      case PerpetualState.NORMAL:
        return 'normal-status'
      case PerpetualState.EMERGENCY:
        return 'emergency-status'
      case PerpetualState.CLEARED:
        return 'cleared-status'
    }
  }

  get oracleName() {
    if (this.perpetualStorage?.oracle) {
      const result = getOracleNameByAddress(this.perpetualStorage?.oracle).slice(0, 2)
      return result === '0x'
    }
  }

  get volumeDecimals(): number {
    if (!this.selectedLiquidityPool) {
      return 0
    }
    const collateralAddress = this.selectedLiquidityPool.liquidityPoolStorage.collateral.toLowerCase()
    if (USDTokenSet.has(collateralAddress)) {
      return 0
    }
    return 1
  }

  get tradeVolumeIn24H(): BigNumber | null {
    if (this.volumes === null) {
      return null
    }
    if (this.volumes.length === 0) {
      return toBigNumber('0')
    }
    const trade24HVolume = _.sumBy(this.volumes, (o) => {
      return Number(o.volume)
    })
    return toBigNumber(trade24HVolume.toString())
  }

  get tradeVolumeIn24HNumber() {
    return this.tradeVolumeIn24H?.toFormat(this.volumeDecimals)
  }

  async getVolumes(isClearData = false) {
    await this.callGraphApiFunc(async () => {
      if (!this.selectedPerpetualID || !this.selectedPerpetualStorage) {
        return
      }
      if (isClearData) {
        this.volumes = null
      }
      const before24hTimestamp = getBeforeTimestamp('d')
      const accBefore8hTimestamp = getBeforeTimestamp('h', 8)
      const data = await queryPriceStatus(this.selectedPerpetualID,
        this.selectedPerpetualStorage.oracle,
        before24hTimestamp,
        accBefore8hTimestamp)
      this.volumes = data.volumes
    })
  }

  @Watch('selectedPerpetualID', { immediate: true })
  async onSelectedPerpetualIDChanged() {
    await this.getVolumes(true)
  }

  @Watch('selectedPerpetualStorage')
  async onPerpetualStorageChanged() {
    await this.getVolumes(false)
  }
}
</script>

<style scoped lang="scss">
@import '~@mcdex/style/common/fantasy-var';

.contract-info {
  padding: 16px 16px 0 16px;

  .flex-value {
    display: flex;
    align-items: center;

    .inverse-card {
      font-size: 12px;
      line-height: 16px;
      padding: 3px 8px;
    }
  }

  .line-item {
    display: flex;
    justify-content: space-between;
    width: 100%;
    height: 50px;
    line-height: 50px;
    border-bottom: 1px solid #1A2136;

    span {
      font-size: 16px;
    }

    .title,
    .iconfont {
      color: var(--mc-text-color);
    }

    &:last-child {
      border-bottom: unset;
    }

    &.oracle-line-item {
      padding: 16px 0;
      align-items: flex-start;
      height: auto;
      line-height: 18px;
      text-align: right;

      .font-icon {
        color: var(--mc-text-color);
      }

      .svg-icon {
        height: 24px;
        width: 24px;
        margin-right: 4px;
      }

      .oracle-symbol {
        line-height: 24px;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        margin-bottom: 4px;
      }

      .fine-tuner {
        display: inline-block;
        margin-bottom: 4px;
        font-size: 12px;
        line-height: 16px;
        color: var(--mc-color-primary);
        background-color: rgb($--mc-color-primary, 0.1);
        padding: 3px 8px;
        border-radius: var(--mc-border-radius-m);
        border: solid 1px rgb($--mc-color-primary, 0.1);
      }

      .tunable-detail {
        width: 55px;
        height: 28px;
        font-size: 12px;
      }
    }
  }

  .status {
    .invalid-status {
      color: var(--mc-color-secondary);
    }

    .initializing-status {
      color: var(--mc-color-primary);
    }

    .normal-status {
      color: var(--mc-color-success);
    }

    .emergency-status {
      color: var(--mc-color-error);
    }

    .cleared-status {
      color: var(--mc-color-warning);
    }
  }
}
</style>

