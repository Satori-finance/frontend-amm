<template>
  <div class="information">
    <div class="card-title">{{ $t('pool.info') }}</div>
    <van-skeleton :row="7" :loading="!poolBaseInfo && !liquidityPool && !perpetualProperty" >
      <div class="info-box">
        <div class="info-line">
          <span class="title">{{ $t('pool.poolInfo.poolInfoTable.shareLiquidity') }}</span>
          <span v-if="poolMarginUSD.gt(0)">
          ${{ this.poolMarginUSD | bigNumberFormatter(2) }}
        </span>
          <span v-else-if="poolMargin.gte(0)">
          {{ poolMargin | bigNumberFormatter(collateralDecimals) }} {{ collateralSymbol }}
        </span>
        </div>
        <div class="info-line">
          <span class="title">{{ $t('pool.poolInfo.poolInfoTable.totalVolume') }}</span>
          <span>{{ totalVolume | bigNumberFormatter }} {{ collateralSymbol }}</span>
        </div>
        <div class="info-line">
          <span class="title">{{ $t('pool.poolInfo.poolInfoTable.netAssetValue') }}</span>
          <span v-if="netAssetValue" >
          {{ netAssetValue | bigNumberFormatter(netAssetValueDecimals) }} {{ collateralSymbol }} / LP Token
        </span>
        </div>
        <div class="info-line">
          <span class="title">{{ $t('pool.poolInfo.poolInfoTable.operator') }}</span>
          <span>
            <span v-if="operatorName !== ''">{{ operatorName }}</span>
            <span v-else>{{ operatorAddress | ellipsisMiddle }}
              <i class="iconfont icon-copy-bold" @click="copyAddress(operatorAddress)"></i></span>
          </span>
        </div>

        <div class="info-line" v-if="isPoolOperator">
          <span class="title">{{ $t('pool.poolInfo.poolInfoTable.checkInTimeout') }}</span>
          <span>
          <McCountDown :end-timestamp="operatorCheckInExpireTime" :module="1" />
        </span>
        </div>

        <div v-if="!isPoolOperator" class="info-line">
          <span class="title">{{ $t('pool.poolInfo.lastCheckIn') }}</span>
          <span v-if="operatorLastCheckTimestamp > 0">
          {{ operatorLastCheckTimestamp | timestampFormatter('ll') }}
        </span>
        </div>
        <div v-if="isMiningPool" class="info-line">
          <span class="title">{{ $t('pool.poolInfo.poolInfoTable.release') }}</span>
          <span >{{ miningRelease | bigNumberFormatterTruncateByPrecision(6, 1, 2) }} {{ miningTokenSymbol }}</span>
        </div>
        <div v-if="isMiningPool" class="info-line">
          <span class="title">{{ $t('pool.poolInfo.poolInfoTable.miningApy') }}</span>
          <span>{{ miningApy | bigNumberFormatter(2) }} %</span>
        </div>
      </div>
    </van-skeleton>
    <div class="button-box">
      <McMStateButton :button-class="['round', 'large']" :state.sync="checkButtonState" v-if='isPoolOperator'
                      :disabled="checkInDisabled" @click="onCheckInEvent">
        {{ $t('pool.poolInfo.checkIn') }}
      </McMStateButton>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import PoolInfoMixin from '@/template/components/Pool/PoolInfo/poolInfoMixin'
import { McCountDown } from '@/components'
import { McMStateButton } from '@/mobile/components'
import { copyToClipboard } from '@/utils'

const wallet = namespace('wallet')
const perpetual = namespace('perpetual')
const price = namespace('price')

@Component({
  components: {
    McCountDown,
    McMStateButton,
  },
})
export default class Information extends Mixins(PoolInfoMixin){
  private copyAddress(address:string) {
    if (!address) {
      return
    }
    copyToClipboard(address)
    this.$toast(this.$t('base.copySuccess').toString())
  }
}
</script>

<style scoped lang="scss">
.information {

  .info-box {
    .info-line {
      display: flex;
      justify-content: space-between;
      width: 100%;
      margin-bottom: 16px;
      font-size: 14px;

      .title {
        color: var(--mc-text-color);
      }

      &:last-child {
        margin-bottom: 0;
      }
    }

    .iconfont {
      color: var(--mc-text-color);
    }

    .mc-count-down {
      font-size: 16px;
    }
  }

  .button-box {
    margin-top: 8px;
  }
}
</style>
