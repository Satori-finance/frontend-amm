<template>
  <div class="mcb-info">
    <div class="info-title">
      <div>{{ $t('dao.satoriInfo') }}</div>
      <div class="mcb-contract">
        <div class="label">Contract:</div>
        <div class="value link">
          <a :href="SATORI_ADDRESS | etherBrowserAddressFormatter" target="_blank">
            {{ SATORI_ADDRESS | poolNameFormatter }}
          </a>
        </div>
        <i class="iconfont icon-copy1" @click="copyAddress(SATORI_ADDRESS)"></i>
      </div>
    </div>
    <div class="info-content">
      <div class="price">
        <McLoadingIcon v-if="!price" :height="40"></McLoadingIcon>
        <div v-else class="price-box">
          <div class="value">${{ price | bigNumberFormatter(2) }}</div>
          <PNNumber
            v-if="satori24hChangeRate"
            :number="satori24hChangeRate"
            :showPlusSign="true"
            :decimals="2"
            suffix="% (24H)"
          />
        </div>
        <div class="text">{{ $t('dao.currentSatoriPrice') }}</div>
      </div>

      <div class="info-card">
        <div class="info-card-item flex-box">
          <div class="left">
            <div class="top">
              <div class="value">
                <McLoadingIcon v-if="currentTotalSupplyLoading"></McLoadingIcon>
                <div v-else>{{ circulatingSupply | bigNumberFormatter(0) }}</div>
                <McMTokenImageView :size="22" :token="SATORI_ADDRESS" />
              </div>
              <div class="text">{{ $t('dao.circulatingSupply') }}</div>
            </div>
            <div class="bottom">
              <div class="value">
                <div>{{ maxSupplyCap | bigNumberFormatter(0) }}</div>
              </div>
              <div class="text">{{ $t('dao.maxSupplyCap') }}</div>
            </div>
          </div>
          <div class="right">
            <McCircleProgress :percentage="percentage" :barSize="20" :size="104"/>
          </div>
        </div>
        <div class="info-card-item">
          <div class="top">
            <div class="value">
              <McLoadingIcon v-if="!marketCap"></McLoadingIcon>
              <div v-else>${{ marketCap | bigNumberFormatter(0) }}</div>
            </div>
            <div class="text">{{ $t('dao.marketCap') }}</div>
          </div>
          <div class="bottom">
            <div class="value">
              <McLoadingIcon v-if="!fullyDilutedValuation"></McLoadingIcon>
              <div v-else>${{ fullyDilutedValuation | bigNumberFormatter(0) }}</div>
              <McMTokenImageView :size="22" :token="SATORI_ADDRESS" />
            </div>
            <div class="text">{{ $t('dao.fullyDilutedValuation') }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { McMInfoCard, McMTokenImageView } from '@/mobile/components'
import SATORIInfoMixin from '@/template/components/DAO/Info/SatoriInfoMixin'
import { McCircleProgress, McLoadingIcon, PNNumber } from '@/components'
import { SATORI_ADDRESS } from '@/constants'
import { copyToClipboard } from '@/utils'

@Component({
  components: {
    McMInfoCard,
    McCircleProgress,
    McMTokenImageView,
    PNNumber,
    McLoadingIcon,
  }
})
export default class SATORIInfo extends Mixins(SATORIInfoMixin) {
  private SATORI_ADDRESS: string = SATORI_ADDRESS

  copyAddress(address: string) {
    if (!address) {
      return
    }
    copyToClipboard(address)
    this.$toast(this.$t('base.copySuccess').toString())
  }
}
</script>

<style lang="scss" scoped>
@import "./info.scss";
.mcb-info {
  .right {
    ::v-deep .percentage {
      font-size: 16px;
    }
  }

  .mcb-contract {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 16px;
    line-height: 24px;

    .label {
      color: var(--mc-border-color-light);
      margin-right: 4px;
    }

    .icon-copy1 {
      font-size: 16px;
      margin-left: 4px;
      color: var(--mc-text-color);
    }
  }

  .flex-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
